import type { Prisma } from "@prisma/client";
import type { ShortlistPrefs } from "@/lib/cars/prefs";
import { prisma } from "@/lib/prisma";
import { MAX_CANDIDATES } from "@/lib/cars/constants";

export const browseOrderBy: Prisma.CarOrderByWithRelationInput[] = [
  { priceMinLakh: "asc" },
  { priceMaxLakh: "asc" },
  { id: "asc" },
];

export function buildCandidateWhere(prefs: ShortlistPrefs): Prisma.CarWhereInput {
  const and: Prisma.CarWhereInput[] = [];

  if (prefs.budgetMaxLakh !== undefined) {
    and.push({ priceMinLakh: { lte: prefs.budgetMaxLakh } });
  }
  if (prefs.budgetMinLakh !== undefined) {
    and.push({ priceMaxLakh: { gte: prefs.budgetMinLakh } });
  }
  if (prefs.fuelType) {
    and.push({ fuelType: prefs.fuelType });
  }
  if (prefs.segment) {
    and.push({ segment: prefs.segment });
  }
  if (prefs.minSeats !== undefined) {
    and.push({ seats: { gte: prefs.minSeats } });
  }
  if (prefs.sunroof === true) {
    and.push({ sunroof: true });
  }
  if (prefs.automaticOnly === true) {
    and.push({ transmission: "AUTOMATIC" });
  }

  return and.length > 0 ? { AND: and } : {};
}

export async function listCandidateCars(where: Prisma.CarWhereInput) {
  return prisma.car.findMany({
    where,
    take: MAX_CANDIDATES,
    orderBy: browseOrderBy,
  });
}

export async function countCandidates(where: Prisma.CarWhereInput) {
  return prisma.car.count({ where });
}
