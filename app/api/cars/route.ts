import { NextRequest, NextResponse } from "next/server";
import { parsePrefsFromSearchParams } from "@/lib/cars/prefs";
import {
  buildCandidateWhere,
  countCandidates,
  listCandidateCars,
} from "@/lib/cars/query";
import { MAX_CANDIDATES } from "@/lib/cars/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const parsed = parsePrefsFromSearchParams(req.nextUrl.searchParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const prefs = parsed.data;
  const where = buildCandidateWhere(prefs);
  const [count, cars] = await Promise.all([
    countCandidates(where),
    listCandidateCars(where),
  ]);
  return NextResponse.json({
    cars,
    meta: {
      count,
      take: MAX_CANDIDATES,
      capped: count > MAX_CANDIDATES,
    },
  });
}
