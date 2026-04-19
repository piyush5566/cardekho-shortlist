import { z } from "zod";

export const AiInsightSchema = z.object({
  summary: z.string().max(1200),
  picks: z
    .array(
      z.object({
        carId: z.string(),
        rationale: z.string().max(500),
      }),
    )
    .max(8),
});

export type AiInsight = z.infer<typeof AiInsightSchema>;

export function validateAiInsightForCars(
  raw: unknown,
  allowedIds: Set<string>,
): AiInsight | null {
  const parsed = AiInsightSchema.safeParse(raw);
  if (!parsed.success) return null;
  for (const p of parsed.data.picks) {
    if (!allowedIds.has(p.carId)) return null;
  }
  return parsed.data;
}
