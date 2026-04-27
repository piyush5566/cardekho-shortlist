"use client";

import { AiInsightSchema, type AiInsight } from "@/lib/llm/ai-insight";
import { AppHeader } from "@/components/home/app-header";
import { PreferencesCard } from "@/components/home/preferences-card";
import { ResultsSection } from "@/components/home/results-section";
import { AiInsightCard } from "@/components/home/ai-insight-card";
import { ShortlistPanel } from "@/components/home/shortlist-panel";
import { useDebouncedAnnounce } from "@/lib/shortlist/use-debounced-announce";
import { useServerShortlist } from "@/lib/shortlist/use-server-shortlist";
import type { CarJson, CarWithScore } from "@/lib/types/car";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Car = CarJson;

type Meta = { count: number; take: number; capped: boolean };

export default function Home() {
  const { message: shortlistLive, announce: announceShortlist } = useDebouncedAnnounce();
  const shortlist = useServerShortlist(announceShortlist);

  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [fuel, setFuel] = useState("");
  const [segment, setSegment] = useState("");
  const [minSeats, setMinSeats] = useState("");
  const [sunroof, setSunroof] = useState(false);
  const [automaticOnly, setAutomaticOnly] = useState(false);
  const [notes, setNotes] = useState("");

  const [cars, setCars] = useState<Car[]>([]);
  const [ranked, setRanked] = useState<CarWithScore[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [aiInsight, setAiInsight] = useState<unknown>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingRank, setLoadingRank] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carsFetchRef = useRef<AbortController | null>(null);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (budgetMin) p.set("budgetMinLakh", budgetMin);
    if (budgetMax) p.set("budgetMaxLakh", budgetMax);
    if (fuel) p.set("fuelType", fuel);
    if (segment) p.set("segment", segment);
    if (minSeats) p.set("minSeats", minSeats);
    if (sunroof) p.set("sunroof", "true");
    if (automaticOnly) p.set("automaticOnly", "true");
    return p.toString();
  }, [budgetMin, budgetMax, fuel, segment, minSeats, sunroof, automaticOnly]);

  const prefsBody = useMemo(
    () => ({
      budgetMinLakh: budgetMin === "" ? undefined : Number(budgetMin),
      budgetMaxLakh: budgetMax === "" ? undefined : Number(budgetMax),
      fuelType: fuel === "" ? undefined : fuel,
      segment: segment === "" ? undefined : segment,
      minSeats: minSeats === "" ? undefined : Number(minSeats),
      sunroof: sunroof || undefined,
      automaticOnly: automaticOnly || undefined,
      notes: notes === "" ? undefined : notes,
    }),
    [budgetMin, budgetMax, fuel, segment, minSeats, sunroof, automaticOnly, notes],
  );

  const fetchCarList = useCallback(async (signal: AbortSignal, qs: string) => {
    if (signal.aborted) return;
    setLoadingSearch(true);
    setError(null);
    setAiInsight(null);
    setRanked([]);
    try {
      const path = qs ? `/api/cars?${qs}` : "/api/cars";
      const res = await fetch(path, { signal });
      const data = (await res.json()) as { cars?: Car[]; meta?: Meta; error?: string };
      if (signal.aborted) return;
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        setCars([]);
        setMeta(null);
        return;
      }
      setCars(data.cars ?? []);
      setMeta(data.meta ?? null);
    } catch (e) {
      if (signal.aborted) return;
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Request failed");
      setCars([]);
      setMeta(null);
    } finally {
      if (!signal.aborted) {
        setLoadingSearch(false);
      }
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    carsFetchRef.current = ac;
    void fetchCarList(ac.signal, "");
    return () => {
      ac.abort();
    };
  }, [fetchCarList]);

  const search = useCallback(() => {
    carsFetchRef.current?.abort();
    const ac = new AbortController();
    carsFetchRef.current = ac;
    void fetchCarList(ac.signal, queryString);
  }, [fetchCarList, queryString]);

  const rankWithAi = useCallback(async () => {
    setLoadingRank(true);
    setError(null);
    try {
      const res = await fetch("/api/shortlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefsBody),
      });
      const data = (await res.json()) as {
        cars?: CarWithScore[];
        meta?: Meta;
        aiInsight?: unknown;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setRanked(data.cars ?? []);
      setMeta(data.meta ?? null);
      setAiInsight(data.aiInsight ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoadingRank(false);
    }
  }, [prefsBody]);

  const displayRows = ranked.length > 0 ? ranked : cars;

  const parsedInsight: AiInsight | null = useMemo(() => {
    const r = AiInsightSchema.safeParse(aiInsight);
    return r.success ? r.data : null;
  }, [aiInsight]);

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of displayRows) {
      m.set(c.id, c.name);
    }
    return m;
  }, [displayRows]);

  const handleSaveToggle = useCallback(
    async (car: CarJson) => {
      if (shortlist.loading) return;
      if (shortlist.isSaved(car.id)) {
        await shortlist.removeByCarId(car.id, car.name);
      } else {
        await shortlist.addCar(car);
      }
    },
    [shortlist],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-8 lg:grid lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-8">
          <div className="flex min-h-0 min-w-0 flex-col gap-8 lg:min-h-0">
            <PreferencesCard
              budgetMin={budgetMin}
              budgetMax={budgetMax}
              fuel={fuel}
              segment={segment}
              minSeats={minSeats}
              sunroof={sunroof}
              automaticOnly={automaticOnly}
              notes={notes}
              loadingSearch={loadingSearch}
              loadingRank={loadingRank}
              onBudgetMin={setBudgetMin}
              onBudgetMax={setBudgetMax}
              onFuel={setFuel}
              onSegment={setSegment}
              onMinSeats={setMinSeats}
              onSunroof={setSunroof}
              onAutomaticOnly={setAutomaticOnly}
              onNotes={setNotes}
              onSearch={search}
              onRank={rankWithAi}
            />

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <ResultsSection
              rankedMode={ranked.length > 0}
              displayRows={displayRows}
              meta={meta}
              loadingSearch={loadingSearch}
              error={error}
              shortlistHydrating={shortlist.loading}
              isSaved={shortlist.isSaved}
              onToggleSave={handleSaveToggle}
            />

            <AiInsightCard rankedCount={ranked.length} insight={parsedInsight} nameById={nameById} />
          </div>

          <aside className="min-h-0 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto">
            <ShortlistPanel
              count={shortlist.items.length}
              loading={shortlist.loading}
              error={shortlist.error}
              items={shortlist.items}
              liveMessage={shortlistLive}
              onRetry={() => void shortlist.refresh()}
              onRemove={shortlist.removeByCarId}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
