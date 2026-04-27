"use client";

import type { SavedCarListItem } from "@/lib/saved-cars/service";

type ShortlistPanelProps = {
  count: number;
  loading: boolean;
  error: string | null;
  items: SavedCarListItem[];
  liveMessage: string;
  onRetry: () => void;
  onRemove: (carId: string, name: string) => void;
};

export function ShortlistPanel({
  count,
  loading,
  error,
  items,
  liveMessage,
  onRetry,
  onRemove,
}: ShortlistPanelProps) {
  return (
    <section
      className="flex min-h-0 flex-col rounded-xl border border-border bg-card p-6 text-card-foreground"
      aria-labelledby="shortlist-heading"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="shortlist-heading" className="text-lg font-medium">
          Shortlist ({count})
        </h2>
        {error && (
          <button
            type="button"
            disabled={loading}
            className="shrink-0 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => void onRetry()}
          >
            Retry
          </button>
        )}
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </p>

      {error && (
        <p className="mt-3 text-sm text-destructive" role="status">
          {error}
        </p>
      )}

      {loading && (
        <ul className="mt-4 flex flex-col gap-3" aria-hidden>
          {[1, 2].map((i) => (
            <li key={i} className="h-20 animate-pulse rounded-lg border border-border bg-muted/40" />
          ))}
        </ul>
      )}

      {!loading && count === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          No cars saved yet. Use <strong>Save to shortlist</strong> on a result row to add it here. Your list
          syncs to this browser session on the server so refresh and other tabs stay consistent.
        </p>
      )}

      {!loading && count > 0 && (
        <ul className="mt-4 flex min-h-0 flex-col gap-3 overflow-y-auto pr-1">
          {items.map((row) => (
            <li
              key={row.id}
              data-testid={`shortlist-row-${row.car.id}`}
              className="flex flex-col gap-2 rounded-lg border border-border bg-background/60 p-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <div className="font-medium leading-snug">{row.car.name}</div>
                <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  ₹{row.car.priceMinLakh}–{row.car.priceMaxLakh}L · {row.car.fuelType} · {row.car.segment} ·{" "}
                  {row.car.transmission} · {row.car.seats} seats
                  {row.car.sunroof ? " · Sunroof" : ""}
                </div>
              </div>
              <button
                type="button"
                data-testid={`shortlist-remove-${row.car.id}`}
                disabled={loading}
                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md border border-destructive/40 px-3 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => void onRemove(row.car.id, row.car.name)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
