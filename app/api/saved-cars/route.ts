import { NextRequest, NextResponse } from "next/server";
import { addSavedCarForSession, listSavedCarsForSession } from "@/lib/saved-cars/service";
import { PostSavedCarBodySchema } from "@/lib/saved-cars/schemas";
import { applySessionCookie, getOrCreateSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { session, setSessionCookie } = await getOrCreateSession(req);
  const items = await listSavedCarsForSession(session.id);
  const res = NextResponse.json({ items });
  if (setSessionCookie) applySessionCookie(res, setSessionCookie);
  return res;
}

export async function POST(req: NextRequest) {
  const { session, setSessionCookie } = await getOrCreateSession(req);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = PostSavedCarBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { carId } = parsed.data;

  const result = await addSavedCarForSession(session.id, carId);
  if (!result.ok) {
    if (result.reason === "not_found") {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Already saved" }, { status: 409 });
  }

  const res = NextResponse.json({ item: result.item }, { status: 201 });
  if (setSessionCookie) applySessionCookie(res, setSessionCookie);
  return res;
}
