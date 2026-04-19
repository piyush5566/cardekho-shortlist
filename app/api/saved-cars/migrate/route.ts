import { NextRequest, NextResponse } from "next/server";
import { MigrateSavedCarsBodySchema } from "@/lib/saved-cars/schemas";
import { migrateSavedCarsForSession } from "@/lib/saved-cars/service";
import { applySessionCookie, getOrCreateSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { session, setSessionCookie } = await getOrCreateSession(req);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = MigrateSavedCarsBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const summary = await migrateSavedCarsForSession(session.id, parsed.data.items);
  const res = NextResponse.json(summary);
  if (setSessionCookie) applySessionCookie(res, setSessionCookie);
  return res;
}
