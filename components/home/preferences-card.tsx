"use client";

type PreferencesCardProps = {
  budgetMin: string;
  budgetMax: string;
  fuel: string;
  segment: string;
  minSeats: string;
  sunroof: boolean;
  automaticOnly: boolean;
  notes: string;
  loadingSearch: boolean;
  loadingRank: boolean;
  onBudgetMin: (v: string) => void;
  onBudgetMax: (v: string) => void;
  onFuel: (v: string) => void;
  onSegment: (v: string) => void;
  onMinSeats: (v: string) => void;
  onSunroof: (v: boolean) => void;
  onAutomaticOnly: (v: boolean) => void;
  onNotes: (v: string) => void;
  onSearch: () => void;
  onRank: () => void;
};

export function PreferencesCard(props: PreferencesCardProps) {
  const {
    budgetMin,
    budgetMax,
    fuel,
    segment,
    minSeats,
    sunroof,
    automaticOnly,
    notes,
    loadingSearch,
    loadingRank,
    onBudgetMin,
    onBudgetMax,
    onFuel,
    onSegment,
    onMinSeats,
    onSunroof,
    onAutomaticOnly,
    onNotes,
    onSearch,
    onRank,
  } = props;

  return (
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
          onSearch();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Budget min (₹ Lakh)</span>
            <input
              className="min-h-11 rounded-md border border-input bg-background px-3 py-2"
              value={budgetMin}
              onChange={(e) => onBudgetMin(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Budget max (₹ Lakh)</span>
            <input
              className="min-h-11 rounded-md border border-input bg-background px-3 py-2"
              value={budgetMax}
              onChange={(e) => onBudgetMax(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Fuel</span>
            <select
              className="min-h-11 rounded-md border border-input bg-background px-3 py-2"
              value={fuel}
              onChange={(e) => onFuel(e.target.value)}
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
              onChange={(e) => onSegment(e.target.value)}
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
              onChange={(e) => onMinSeats(e.target.value)}
              inputMode="numeric"
            />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={sunroof} onChange={(e) => onSunroof(e.target.checked)} />
            Sunroof required
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={automaticOnly}
              onChange={(e) => onAutomaticOnly(e.target.checked)}
            />
            Automatic only
          </label>
        </div>
        <label className="mt-4 flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Notes (soft)</span>
          <textarea
            className="min-h-[88px] rounded-md border border-input bg-background px-3 py-2"
            value={notes}
            onChange={(e) => onNotes(e.target.value)}
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
            onClick={() => void onRank()}
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
  );
}
