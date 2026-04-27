import type { AiInsight } from "@/lib/llm/ai-insight";

type AiInsightCardProps = {
  rankedCount: number;
  insight: AiInsight | null;
  nameById: Map<string, string>;
};

export function AiInsightCard({ rankedCount, insight, nameById }: AiInsightCardProps) {
  if (rankedCount === 0) return null;

  return (
    <section
      data-testid="ai-insight-section"
      aria-labelledby="ai-heading"
      className="rounded-xl border border-border bg-card p-6 text-card-foreground"
    >
      <h2 id="ai-heading" className="text-lg font-medium">
        Tips from comparison
      </h2>
      {insight ? (
        <div className="mt-4 space-y-4">
          <p className="max-w-prose text-sm leading-relaxed">{insight.summary}</p>
          <ol className="list-decimal space-y-3 pl-5 text-sm">
            {insight.picks.map((p) => (
              <li key={p.carId}>
                <span className="font-medium">{nameById.get(p.carId) ?? p.carId}</span>
                <p className="mt-1 text-muted-foreground">{p.rationale}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="mt-4 max-w-prose text-sm text-muted-foreground">
          We could not generate a comparison right now. Your ranked matches and scores in the list above
          are unchanged.
        </p>
      )}
    </section>
  );
}
