import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/cars/route";
import { POST } from "@/app/api/shortlist/route";

describe("GET vs POST candidate multiset", () => {
  it("returns same car id set for identical prefs", async () => {
    const qs = "budgetMaxLakh=20&segment=SUV";
    const getRes = await GET(new NextRequest(`http://localhost/api/cars?${qs}`));
    expect(getRes.status).toBe(200);
    const getJson = (await getRes.json()) as { cars: { id: string }[] };

    const postRes = await POST(
      new Request("http://localhost/api/shortlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budgetMaxLakh: 20, segment: "SUV" }),
      }),
    );
    expect(postRes.status).toBe(200);
    const postJson = (await postRes.json()) as { cars: { id: string }[] };

    const a = new Set(getJson.cars.map((c) => c.id));
    const b = new Set(postJson.cars.map((c) => c.id));
    expect(a.size).toBe(b.size);
    for (const id of a) expect(b.has(id)).toBe(true);
  });
});
