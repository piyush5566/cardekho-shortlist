import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import type { Session } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "cardekho_session";

/** Shared TTL for httpOnly cookie `maxAge` and `Session.expiresAt` on create. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

export function isSecureCookieRequest(req: NextRequest): boolean {
  const forwarded = req.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0]?.trim() === "https";
  return req.nextUrl.protocol === "https:";
}

export type SessionCookieToSet = { value: string; secure: boolean };

function sessionExpiresAtFromNow(): Date {
  return new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
}

/**
 * Resolves anonymous session from httpOnly cookie, or creates a row + instructs caller to set cookie.
 * Opaque UUID in cookie maps to `Session.id`; no signing → no `SESSION_SECRET` required.
 */
export async function getOrCreateSession(
  req: NextRequest,
): Promise<{ session: Session; setSessionCookie: SessionCookieToSet | null }> {
  const jar = await cookies();
  const cookieVal = jar.get(SESSION_COOKIE)?.value ?? null;
  if (cookieVal) {
    const existing = await prisma.session.findUnique({ where: { id: cookieVal } });
    if (existing) {
      const expired =
        existing.expiresAt != null && existing.expiresAt.getTime() <= Date.now();
      if (expired) {
        await prisma.session.delete({ where: { id: cookieVal } }).catch(() => undefined);
      } else {
        return { session: existing, setSessionCookie: null };
      }
    }
  }

  const id = randomUUID();
  const expiresAt = sessionExpiresAtFromNow();
  const session = await prisma.session.create({ data: { id, expiresAt } });
  return {
    session,
    setSessionCookie: { value: id, secure: isSecureCookieRequest(req) },
  };
}

export function applySessionCookie(res: NextResponse, cookie: SessionCookieToSet) {
  res.cookies.set(SESSION_COOKIE, cookie.value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: cookie.secure,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}
