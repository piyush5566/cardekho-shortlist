import type { Car } from "@prisma/client";
import type { ShortlistPrefs } from "@/lib/cars/prefs";

function carMidPriceLakh(car: Car): number {
  return (car.priceMinLakh + car.priceMaxLakh) / 2;
}

/** User target price for distance: midpoint of budget band, else one bound, else car midpoint (neutral). */
function targetPriceLakh(prefs: ShortlistPrefs, car: Car): number {
  const { budgetMinLakh, budgetMaxLakh } = prefs;
  if (budgetMinLakh !== undefined && budgetMaxLakh !== undefined) {
    return (budgetMinLakh + budgetMaxLakh) / 2;
  }
  if (budgetMaxLakh !== undefined) return budgetMaxLakh;
  if (budgetMinLakh !== undefined) return budgetMinLakh;
  return carMidPriceLakh(car);
}

/**
 * Higher score = better fit. Deterministic (no Date/time).
 * `avgRating` null => neutral (no bonus, no penalty).
 */
export function scoreCar(prefs: ShortlistPrefs, car: Car): number {
  const mid = carMidPriceLakh(car);
  const target = targetPriceLakh(prefs, car);
  let score = 1000 - Math.abs(mid - target) * 12;

  if (prefs.fuelType && car.fuelType === prefs.fuelType) score += 40;
  if (prefs.segment && car.segment === prefs.segment) score += 40;
  if (prefs.minSeats !== undefined && car.seats >= prefs.minSeats) score += 25;
  if (prefs.sunroof === true && car.sunroof) score += 15;
  if (prefs.automaticOnly === true && car.transmission === "AUTOMATIC") score += 15;

  if (car.avgRating != null) {
    score += (car.avgRating - 3) * 10;
  }

  return Math.round(score * 100) / 100;
}
