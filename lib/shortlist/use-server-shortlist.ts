"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CarJson } from "@/lib/types/car";
import {
  hasShortlistMigrationFlag,
  loadLegacyShortlistIds,
  markShortlistMigratedAndClearLegacy,
} from "@/lib/shortlist/legacy-local";
import type { SavedCarListItem } from "@/lib/saved-cars/service";

type ShortlistState = {
  items: SavedCarListItem[];
  loading: boolean;
  error: string | null;
};

async function fetchSavedCars(): Promise<SavedCarListItem[]> {
  const res = await fetch("/api/saved-cars", { credentials: "same-origin" });
  const data = (await res.json()) as { items?: SavedCarListItem[]; error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
  return data.items ?? [];
}

function sortByCreatedAt(a: SavedCarListItem, b: SavedCarListItem): number {
  return a.createdAt.localeCompare(b.createdAt);
}

export function useServerShortlist(onServerConfirmed: (message: string) => void) {
  const [state, setState] = useState<ShortlistState>({
    items: [],
    loading: true,
    error: null,
  });
  const itemsRef = useRef<SavedCarListItem[]>([]);
  itemsRef.current = state.items;

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const items = await fetchSavedCars();
      setState({ items, loading: false, error: null });
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : "Could not load shortlist",
      }));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        let items = await fetchSavedCars();
        if (cancelled) return;

        if (!hasShortlistMigrationFlag()) {
          const legacy = loadLegacyShortlistIds();
          if (legacy.length > 0) {
            const m = await fetch("/api/saved-cars/migrate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              body: JSON.stringify({ items: legacy.map((carId) => ({ carId })) }),
            });
            if (!m.ok) {
              const body = (await m.json().catch(() => ({}))) as { error?: string };
              throw new Error(body.error ?? `Migrate failed (${m.status})`);
            }
            markShortlistMigratedAndClearLegacy();
            items = await fetchSavedCars();
          } else {
            markShortlistMigratedAndClearLegacy();
          }
        }

        if (!cancelled) setState({ items, loading: false, error: null });
      } catch (e) {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            loading: false,
            error: e instanceof Error ? e.message : "Could not sync shortlist",
          }));
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const savedIds = useMemo(() => new Set(state.items.map((i) => i.car.id)), [state.items]);

  const isSaved = useCallback((carId: string) => savedIds.has(carId), [savedIds]);

  const addCar = useCallback(
    async (car: CarJson) => {
      if (savedIds.has(car.id)) return;
      const optimisticId = `optimistic-${car.id}`;
      const optimistic: SavedCarListItem = {
        id: optimisticId,
        createdAt: new Date().toISOString(),
        car,
      };
      setState((s) => ({ ...s, items: [...s.items, optimistic], error: null }));
      try {
        const res = await fetch("/api/saved-cars", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ carId: car.id }),
        });
        const data = (await res.json()) as { item?: SavedCarListItem; error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        if (!data.item) throw new Error("Missing item");
        setState((s) => ({
          ...s,
          items: s.items.map((row) => (row.car.id === car.id ? data.item! : row)),
        }));
        onServerConfirmed(`Saved ${car.name} to your shortlist.`);
      } catch (e) {
        setState((s) => ({
          ...s,
          items: s.items.filter((r) => r.id !== optimisticId && !(r.id.startsWith("optimistic-") && r.car.id === car.id)),
          error: e instanceof Error ? e.message : "Save failed",
        }));
        onServerConfirmed("Could not save to shortlist. Changes were reverted.");
      }
    },
    [savedIds, onServerConfirmed],
  );

  const removeByCarId = useCallback(
    async (carId: string, displayName: string) => {
      const removed = itemsRef.current.find((r) => r.car.id === carId);
      setState((s) => ({
        ...s,
        items: s.items.filter((row) => row.car.id !== carId),
        error: null,
      }));
      try {
        const res = await fetch(`/api/saved-cars/${encodeURIComponent(carId)}`, {
          method: "DELETE",
          credentials: "same-origin",
        });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        onServerConfirmed(`Removed ${displayName} from your shortlist.`);
      } catch (e) {
        setState((s) => ({
          ...s,
          items:
            removed && !s.items.some((r) => r.id === removed.id)
              ? [...s.items, removed].sort(sortByCreatedAt)
              : s.items,
          error: e instanceof Error ? e.message : "Remove failed",
        }));
        onServerConfirmed("Could not remove from shortlist. Changes were reverted.");
      }
    },
    [onServerConfirmed],
  );

  return {
    ...state,
    refresh,
    savedIds,
    isSaved,
    addCar,
    removeByCarId,
  };
}
