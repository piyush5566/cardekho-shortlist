import { NextRequest, NextResponse } from "next/server";
import { addSavedCarForSession, listSavedCarsForSession } from "@/lib/saved-cars/service";
import { PostSavedCarBodySchema } from "@/lib/saved-cars/schemas";
import {
  applySessionCookie,
  getOrCreateSession,
  type SessionCookieToSet,
} from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { session, setSessionCookie } = await getOrCreateSession(req);
  const items = await listSavedCarsForSession(session.id);
  const res = NextResponse.json({ items });
  if (setSessionCookie) applySessionCookie(res, setSessionCookie);
  return res;
}

function jsonWithSessionCookie(
  json: unknown,
  init: ResponseInit,
  setSessionCookie: SessionCookieToSet | null,
) {
  const res = NextResponse.json(json, init);
  if (setSessionCookie) applySessionCookie(res, setSessionCookie);
  return res;
}

export async function POST(req: NextRequest) {
  const { session, setSessionCookie } = await getOrCreateSession(req);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonWithSessionCookie({ error: "Invalid JSON" }, { status: 400 }, setSessionCookie);
  }
  const parsed = PostSavedCarBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonWithSessionCookie(
      { error: "Invalid body", issues: parsed.error.flatten() },
      { status: 400 },
      setSessionCookie,
    );
  }
  const { carId } = parsed.data;

  const result = await addSavedCarForSession(session.id, carId);
  if (!result.ok) {
    if (result.reason === "not_found") {
      return jsonWithSessionCookie({ error: "Car not found" }, { status: 404 }, setSessionCookie);
    }
    return jsonWithSessionCookie({ error: "Already saved" }, { status: 409 }, setSessionCookie);
  }

  return jsonWithSessionCookie({ item: result.item }, { status: 201 }, setSessionCookie);
}
