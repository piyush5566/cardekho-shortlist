import type { Car } from "@prisma/client";
import type { ShortlistPrefs } from "@/lib/cars/prefs";
import { getEnv } from "@/lib/env";
import {
  AiInsightSchema,
  type AiInsight,
  validateAiInsightForCars,
} from "@/lib/llm/ai-insight";

function buildPrompt(prefs: ShortlistPrefs, cars: Car[]): string {
  const lines = cars.map(
    (c) =>
      `- id=${c.id} name=${c.name} price=${c.priceMinLakh}-${c.priceMaxLakh}L ${c.fuelType} ${c.segment} ${c.transmission} seats=${c.seats} sunroof=${c.sunroof}` +
      (c.reviewSummary ? ` review="${c.reviewSummary.replace(/"/g, "'")}"` : ""),
  );
  const notes = prefs.notes ? `Buyer notes (soft): ${prefs.notes}\n` : "";
  return `You compare ONLY the cars listed below by id. Output valid JSON matching schema:
{"summary":"string","picks":[{"carId":"id from list","rationale":"string"}]}
Pick up to 5 cars best matching implied preferences. ${notes}
Cars:\n${lines.join("\n")}`;
}

export async function fetchAiInsight(
  prefs: ShortlistPrefs,
  cars: Car[],
  signal?: AbortSignal,
): Promise<AiInsight | null> {
  const env = getEnv();
  const allowedIds = new Set(cars.map((c) => c.id));

  if (env.AI_PROVIDER === "mock" || !env.GROQ_API_KEY) {
    if (cars.length === 0) return null;
    const mock: AiInsight = {
      summary: "Mock insight: compare options using price band, fuel, and seating; verify on a test drive.",
      picks: cars.slice(0, Math.min(3, cars.length)).map((c) => ({
        carId: c.id,
        rationale: `${c.name} fits the shortlist based on listed specs (mock provider).`,
      })),
    };
    return validateAiInsightForCars(mock, allowedIds);
  }

  const url = "https://api.groq.com/openai/v1/chat/completions";
  const body = {
    model: env.GROQ_MODEL,
    messages: [
      { role: "system", content: "You are a concise car shopping assistant. Reply with JSON only." },
      { role: "user", content: buildPrompt(prefs, cars) },
    ],
    temperature: 0.2,
    max_tokens: 800,
    response_format: { type: "json_object" },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content;
    if (!text) return null;
    let json: unknown;
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      return null;
    }
    const parsed = AiInsightSchema.safeParse(json);
    if (!parsed.success) return null;
    return validateAiInsightForCars(parsed.data, allowedIds);
  } catch {
    return null;
  }
}
