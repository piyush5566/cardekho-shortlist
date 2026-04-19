import { NextResponse } from "next/server";
import type { Car } from "@prisma/client";
import { parsePrefsFromJson } from "@/lib/cars/prefs";
import {
  buildCandidateWhere,
  countCandidates,
  listCandidateCars,
} from "@/lib/cars/query";
import { scoreCar } from "@/lib/cars/score";
import { fetchAiInsight } from "@/lib/llm/provider";
import { MAX_CANDIDATES, LLM_TOP_K } from "@/lib/cars/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RankedCar = Car & { score: number };

export async function POST(req: Request) {
  let body: unknown;
  try {
    const text = await req.text();
    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "Empty body" }, { status: 400 });
    }
    body = JSON.parse(text) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parsePrefsFromJson(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const prefs = parsed.data;

  const where = buildCandidateWhere(prefs);
  const [count, cars] = await Promise.all([
    countCandidates(where),
    listCandidateCars(where),
  ]);

  const ranked: RankedCar[] = cars
    .map((c) => ({ ...c, score: scoreCar(prefs, c) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.id.localeCompare(b.id);
    });

  const forLlm = ranked.slice(0, LLM_TOP_K);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  let aiInsight = null;
  try {
    aiInsight = await fetchAiInsight(prefs, forLlm, controller.signal);
  } catch {
    aiInsight = null;
  } finally {
    clearTimeout(timeout);
  }

  return NextResponse.json({
    cars: ranked,
    meta: {
      count,
      take: MAX_CANDIDATES,
      capped: count > MAX_CANDIDATES,
    },
    aiInsight,
  });
}
