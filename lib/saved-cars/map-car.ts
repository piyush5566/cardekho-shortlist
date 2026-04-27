import type { Car as PrismaCar } from "@prisma/client";
import type { CarJson } from "@/lib/types/car";

export function carToJson(car: PrismaCar): CarJson {
  return {
    id: car.id,
    slug: car.slug,
    name: car.name,
    priceMinLakh: car.priceMinLakh,
    priceMaxLakh: car.priceMaxLakh,
    fuelType: car.fuelType,
    segment: car.segment,
    transmission: car.transmission,
    seats: car.seats,
    sunroof: car.sunroof,
    safetyRating: car.safetyRating,
    avgRating: car.avgRating,
    reviewSummary: car.reviewSummary,
  };
}
