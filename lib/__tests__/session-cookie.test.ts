import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { isSecureCookieRequest } from "@/lib/session";

describe("isSecureCookieRequest", () => {
  it("is false for http localhost", () => {
    const req = new NextRequest("http://localhost:3000/api/saved-cars");
    expect(isSecureCookieRequest(req)).toBe(false);
  });

  it("is true when x-forwarded-proto is https", () => {
    const req = new NextRequest("http://127.0.0.1:3000/foo", {
      headers: { "x-forwarded-proto": "https" },
    });
    expect(isSecureCookieRequest(req)).toBe(true);
  });

  it("handles comma-separated forwarded proto", () => {
    const req = new NextRequest("http://internal/foo", {
      headers: { "x-forwarded-proto": "https,http" },
    });
    expect(isSecureCookieRequest(req)).toBe(true);
  });
});
