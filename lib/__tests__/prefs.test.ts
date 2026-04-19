import { describe, expect, it } from "vitest";
import { parsePrefsFromSearchParams, parsePrefsFromJson } from "@/lib/cars/prefs";

describe("parsePrefsFromSearchParams", () => {
  it("parses valid query", () => {
    const p = new URLSearchParams({ budgetMaxLakh: "12", fuelType: "PETROL" });
    const r = parsePrefsFromSearchParams(p);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.budgetMaxLakh).toBe(12);
      expect(r.data.fuelType).toBe("PETROL");
    }
  });

  it("treats empty string as undefined for optional numbers", () => {
    const p = new URLSearchParams({ budgetMaxLakh: "" });
    const r = parsePrefsFromSearchParams(p);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.budgetMaxLakh).toBeUndefined();
    }
  });

  it("rejects invalid number", () => {
    const p = new URLSearchParams({ budgetMaxLakh: "abc" });
    const r = parsePrefsFromSearchParams(p);
    expect(r.success).toBe(false);
  });
});

describe("parsePrefsFromJson", () => {
  it("parses body", () => {
    const r = parsePrefsFromJson({ budgetMaxLakh: 18, segment: "SUV" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.budgetMaxLakh).toBe(18);
      expect(r.data.segment).toBe("SUV");
    }
  });
});
