import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { MAX_MIGRATE_SAVED_CARS_BATCH } from "@/lib/saved-cars/schemas";

function isPrismaUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  );
}
import { carToJson } from "@/lib/saved-cars/map-car";

export type SavedCarListItem = {
  id: string;
  createdAt: string;
  car: ReturnType<typeof carToJson>;
};

export async function listSavedCarsForSession(sessionId: string): Promise<SavedCarListItem[]> {
  const rows = await prisma.savedCar.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    include: { car: true },
  });
  return rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    car: carToJson(r.car),
  }));
}

export type AddSavedResult =
  | { ok: true; item: SavedCarListItem }
  | { ok: false; reason: "not_found" | "duplicate" };

export async function addSavedCarForSession(
  sessionId: string,
  carId: string,
): Promise<AddSavedResult> {
  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car) return { ok: false, reason: "not_found" };

  try {
    const created = await prisma.savedCar.create({
      data: { sessionId, carId },
      include: { car: true },
    });
    return {
      ok: true,
      item: {
        id: created.id,
        createdAt: created.createdAt.toISOString(),
        car: carToJson(created.car),
      },
    };
  } catch (e) {
    if (isPrismaUniqueViolation(e)) {
      return { ok: false, reason: "duplicate" };
    }
    throw e;
  }
}

export async function removeSavedCarForSession(
  sessionId: string,
  carId: string,
): Promise<{ removed: boolean }> {
  const result = await prisma.savedCar.deleteMany({
    where: { sessionId, carId },
  });
  return { removed: result.count > 0 };
}

export async function migrateSavedCarsForSession(
  sessionId: string,
  items: { carId: string; snapshot?: unknown }[],
): Promise<{ applied: number; skippedIds: string[] }> {
  if (items.length === 0) {
    return { applied: 0, skippedIds: [] };
  }
  if (items.length > MAX_MIGRATE_SAVED_CARS_BATCH) {
    throw new RangeError(
      `Saved cars migrate batch exceeds max size of ${MAX_MIGRATE_SAVED_CARS_BATCH}`,
    );
  }

  const inputIds = items.map((i) => i.carId);
  const existingCars = await prisma.car.findMany({
    where: { id: { in: [...new Set(inputIds)] } },
    select: { id: true },
  });
  const validSet = new Set(existingCars.map((c) => c.id));

  const skippedIds: string[] = [];
  const seenSkipped = new Set<string>();
  for (const id of inputIds) {
    if (!validSet.has(id) && !seenSkipped.has(id)) {
      seenSkipped.add(id);
      skippedIds.push(id);
    }
  }

  const snapshotByCarId = new Map<string, Prisma.InputJsonValue | undefined>();
  for (const item of items) {
    if (!validSet.has(item.carId)) continue;
    if (item.snapshot !== undefined) {
      snapshotByCarId.set(item.carId, item.snapshot as Prisma.InputJsonValue);
    }
  }

  const uniqueValidIds = [...new Set(inputIds.filter((id) => validSet.has(id)))];

  await prisma.$transaction(
    uniqueValidIds.map((carId) => {
      const snap = snapshotByCarId.get(carId);
      return prisma.savedCar.upsert({
        where: { sessionId_carId: { sessionId, carId } },
        create: {
          sessionId,
          carId,
          ...(snap !== undefined ? { snapshot: snap } : {}),
        },
        update: {
          ...(snap !== undefined ? { snapshot: snap } : {}),
        },
      });
    }),
  );

  return { applied: uniqueValidIds.length, skippedIds };
}
