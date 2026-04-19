import { NextRequest, NextResponse } from "next/server";
import { removeSavedCarForSession } from "@/lib/saved-cars/service";
import { applySessionCookie, getOrCreateSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ carId: string }> };

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { carId } = await ctx.params;
  if (!carId || carId === "migrate") {
    return NextResponse.json({ error: "Invalid car id" }, { status: 400 });
  }

  const { session, setSessionCookie } = await getOrCreateSession(req);

  const { removed } = await removeSavedCarForSession(session.id, carId);

  const res = NextResponse.json({ ok: true, removed });
  if (setSessionCookie) applySessionCookie(res, setSessionCookie);
  return res;
}
