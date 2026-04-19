import { describe, expect, it } from "vitest";
import type { Car } from "@prisma/client";
import { scoreCar } from "@/lib/cars/score";

const baseCar: Car = {
  id: "c1",
  slug: "test",
  name: "Test",
  priceMinLakh: 8,
  priceMaxLakh: 10,
  fuelType: "PETROL",
  segment: "SUV",
  transmission: "MANUAL",
  seats: 5,
  sunroof: false,
  safetyRating: 4,
  avgRating: null,
  reviewSummary: null,
};

describe("scoreCar", () => {
  it("is deterministic for same inputs", () => {
    const prefs = { budgetMaxLakh: 12 };
    const a = scoreCar(prefs, baseCar);
    const b = scoreCar(prefs, baseCar);
    expect(a).toBe(b);
  });
});
