"use client";

import { AiInsightSchema, type AiInsight } from "@/lib/llm/ai-insight";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Car = {
  id: string;
  slug: string;
  name: string;
  priceMinLakh: number;
  priceMaxLakh: number;
  fuelType: string;
  segment: string;
  transmission: string;
  seats: number;
  sunroof: boolean;
  safetyRating: number | null;
  avgRating: number | null;
  reviewSummary: string | null;
};

type CarWithScore = Car & { score: number };

type Meta = { count: number; take: number; capped: boolean };

const LS_KEY = "cardekho_shortlist_ids";

function loadShortlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveShortlist(ids: string[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(ids));
}

export default function Home() {
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
  const [shortlist, setShortlist] = useState<string[]>([]);

  const carsFetchRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setShortlist(loadShortlist());
  }, []);

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

  const toggleShortlist = (id: string) => {
    setShortlist((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveShortlist(next);
      return next;
    });
  };

  const displayRows = ranked.length > 0 ? ranked : cars;
  const busyResults = loadingSearch;

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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-4 py-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Car shortlist MVP</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Hard filters below affect search. <strong>Notes</strong> are soft — they do not change the
              candidate query; they are used for scoring and tips only.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
        <section
          className="rounded-xl border border-border bg-card p-6 text-card-foreground"
          aria-labelledby="prefs-heading"
        >
          <h2 id="prefs-heading" className="text-lg font-medium">
            Preferences
          </h2>
          <form
            data-testid="preferences-form"
            className="mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              search();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-muted-foreground">Budget min (₹ Lakh)</span>
                <input
                  className="min-h-11 rounded-md border border-input bg-background px-3 py-2"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  inputMode="decimal"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-muted-foreground">Budget max (₹ Lakh)</span>
                <input
                  className="min-h-11 rounded-md border border-input bg-background px-3 py-2"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  inputMode="decimal"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-muted-foreground">Fuel</span>
                <select
                  className="min-h-11 rounded-md border border-input bg-background px-3 py-2"
                  value={fuel}
                  onChange={(e) => setFuel(e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="PETROL">Petrol</option>
                  <option value="DIESEL">Diesel</option>
                  <option value="CNG">CNG</option>
                  <option value="EV">EV</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-muted-foreground">Segment</span>
                <select
                  className="min-h-11 rounded-md border border-input bg-background px-3 py-2"
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="HATCHBACK">Hatchback</option>
                  <option value="SUV">SUV</option>
                  <option value="SEDAN">Sedan</option>
                  <option value="MPV">MPV</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-muted-foreground">Min seats</span>
                <input
                  className="min-h-11 rounded-md border border-input bg-background px-3 py-2"
                  value={minSeats}
                  onChange={(e) => setMinSeats(e.target.value)}
                  inputMode="numeric"
                />
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" checked={sunroof} onChange={(e) => setSunroof(e.target.checked)} />
                Sunroof required
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={automaticOnly}
                  onChange={(e) => setAutomaticOnly(e.target.checked)}
                />
                Automatic only
              </label>
            </div>
            <label className="mt-4 flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Notes (soft)</span>
              <textarea
                className="min-h-[88px] rounded-md border border-input bg-background px-3 py-2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={2000}
                placeholder="Priorities that should not narrow the search — e.g. comfort, resale, city use…"
              />
            </label>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                data-testid="search-button"
                className="inline-flex min-h-11 min-w-[8rem] items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
                disabled={loadingSearch || loadingRank}
              >
                Search cars
              </button>
              <button
                type="button"
                data-testid="rank-button"
                className="inline-flex min-h-11 min-w-[8rem] items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                onClick={() => void rankWithAi()}
                disabled={loadingSearch || loadingRank}
              >
                {loadingRank ? "Ranking…" : "Rank matches + get tips"}
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Tips use AI on your top matches (mock provider when no API key is set).
            </p>
          </form>
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <section
          data-testid="results-region"
          aria-labelledby="results-heading"
          aria-busy={busyResults}
        >
          <h2 id="results-heading" className="text-lg font-medium">
            {ranked.length ? "Ranked results" : "Results"}
          </h2>
          <p data-testid="results-status" aria-live="polite" className="mt-2 text-sm text-muted-foreground">
            {resultsStatusText}
          </p>

          {loadingSearch && (
            <ul className="mt-4 flex flex-col gap-3" aria-hidden>
              {[1, 2, 3].map((i) => (
                <li
                  key={i}
                  className="h-24 animate-pulse rounded-lg border border-border bg-muted/40"
                />
              ))}
            </ul>
          )}

          {!loadingSearch && (
            <ul className="mt-4 flex flex-col gap-3">
              {displayRows.map((c) => (
                <li
                  key={c.id}
                  data-testid={`car-row-${c.id}`}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-card-foreground sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-muted-foreground">
                      ₹{c.priceMinLakh}–{c.priceMaxLakh}L · {c.fuelType} · {c.segment} ·{" "}
                      {c.transmission} · {c.seats} seats
                      {c.sunroof ? " · Sunroof" : ""}
                      {"score" in c && typeof (c as CarWithScore).score === "number"
                        ? ` · Score ${(c as CarWithScore).score}`
                        : ""}
                    </div>
                    {c.reviewSummary && (
                      <p className="mt-1 text-sm text-muted-foreground">{c.reviewSummary}</p>
                    )}
                  </div>
                  <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm whitespace-nowrap">
                    <input
                      type="checkbox"
                      data-testid={`car-shortlist-${c.id}`}
                      checked={shortlist.includes(c.id)}
                      onChange={() => toggleShortlist(c.id)}
                    />
                    Shortlist
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>

        {ranked.length > 0 && (
          <section
            data-testid="ai-insight-section"
            aria-labelledby="ai-heading"
            className="rounded-xl border border-border bg-card p-6 text-card-foreground"
          >
            <h2 id="ai-heading" className="text-lg font-medium">
              Tips from comparison
            </h2>
            {parsedInsight ? (
              <div className="mt-4 space-y-4">
                <p className="max-w-prose text-sm leading-relaxed">{parsedInsight.summary}</p>
                <ol className="list-decimal space-y-3 pl-5 text-sm">
                  {parsedInsight.picks.map((p) => (
                    <li key={p.carId}>
                      <span className="font-medium">{nameById.get(p.carId) ?? p.carId}</span>
                      <p className="mt-1 text-muted-foreground">{p.rationale}</p>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <p className="mt-4 max-w-prose text-sm text-muted-foreground">
                We could not generate a comparison right now. Your ranked matches and scores in the list
                above are unchanged.
              </p>
            )}
          </section>
        )}

        <section
          className="rounded-xl border border-border bg-card p-6 text-card-foreground"
          aria-labelledby="shortlist-heading"
        >
          <h2 id="shortlist-heading" className="text-lg font-medium">
            Shortlist ({shortlist.length})
          </h2>
          {shortlist.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No cars saved yet. Use the checkboxes in Results to add cars here. Stored on this device only
              ({LS_KEY}).
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Stored on this device only ({LS_KEY}).</p>
          )}
        </section>
      </main>
    </div>
  );
}
