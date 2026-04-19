import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/shortlist/route";

describe("POST /api/shortlist errors", () => {
  it("400 on invalid JSON", async () => {
    const res = await POST(
      new Request("http://localhost/api/shortlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not-json",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("400 on empty body", async () => {
    const res = await POST(
      new Request("http://localhost/api/shortlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "",
      }),
    );
    expect(res.status).toBe(400);
  });
});
