"use client";

import type { CarJson, CarWithScore } from "@/lib/types/car";

type ResultsSectionProps = {
  rankedMode: boolean;
  displayRows: (CarJson | CarWithScore)[];
  meta: { count: number; take: number; capped: boolean } | null;
  loadingSearch: boolean;
  error: string | null;
  isSaved: (carId: string) => boolean;
  onToggleSave: (car: CarJson) => void;
};

export function ResultsSection({
  rankedMode,
  displayRows,
  meta,
  loadingSearch,
  error,
  isSaved,
  onToggleSave,
}: ResultsSectionProps) {
  const busyResults = loadingSearch;

  const resultsStatusText = loadingSearch
    ? "Loading matches…"
    : meta
      ? `Showing ${displayRows.length} of ${meta.count} matches${meta.capped ? ` (capped at ${meta.take})` : ""}.`
      : error
        ? "Could not load results."
        : displayRows.length === 0
          ? "No matches yet — adjust filters and search again."
          : `${displayRows.length} match${displayRows.length === 1 ? "" : "es"} loaded.`;

  return (
    <section data-testid="results-region" aria-labelledby="results-heading" aria-busy={busyResults}>
      <h2 id="results-heading" className="text-lg font-medium">
        {rankedMode ? "Ranked results" : "Results"}
      </h2>
      <p data-testid="results-status" aria-live="polite" className="mt-2 text-sm text-muted-foreground">
        {resultsStatusText}
      </p>

      {loadingSearch && (
        <ul className="mt-4 flex flex-col gap-3" aria-hidden>
          {[1, 2, 3].map((i) => (
            <li key={i} className="h-24 animate-pulse rounded-lg border border-border bg-muted/40" />
          ))}
        </ul>
      )}

      {!loadingSearch && (
        <ul className="mt-4 flex flex-col gap-3">
          {displayRows.map((c) => {
            const saved = isSaved(c.id);
            const score = "score" in c && typeof (c as CarWithScore).score === "number" ? (c as CarWithScore).score : null;
            return (
              <li
                key={c.id}
                data-testid={`car-row-${c.id}`}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm text-muted-foreground">
                    ₹{c.priceMinLakh}–{c.priceMaxLakh}L · {c.fuelType} · {c.segment} · {c.transmission} ·{" "}
                    {c.seats} seats
                    {c.sunroof ? " · Sunroof" : ""}
                    {score !== null ? ` · Score ${score}` : ""}
                  </div>
                  {c.reviewSummary && (
                    <p className="mt-1 text-sm text-muted-foreground">{c.reviewSummary}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                  <button
                    type="button"
                    data-testid={`car-shortlist-${c.id}`}
                    aria-pressed={saved}
                    aria-label={saved ? `Remove ${c.name} from shortlist` : `Save ${c.name} to shortlist`}
                    className={`inline-flex min-h-11 min-w-[7.5rem] items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                      saved
                        ? "border-accent/40 bg-accent/10 text-accent hover:bg-accent/15"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                    onClick={() => void onToggleSave(c)}
                  >
                    {saved ? "Saved" : "Save to shortlist"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
