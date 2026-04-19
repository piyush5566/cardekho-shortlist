import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader() {
  return (
    <header className="border-b border-border px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
  );
}
