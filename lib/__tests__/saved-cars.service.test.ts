import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  addSavedCarForSession,
  listSavedCarsForSession,
  migrateSavedCarsForSession,
  removeSavedCarForSession,
} from "@/lib/saved-cars/service";
import { MAX_MIGRATE_SAVED_CARS_BATCH } from "@/lib/saved-cars/schemas";

describe("saved-cars service", () => {
  let sessionId: string | undefined;
  let carA: { id: string };
  let carB: { id: string };

  beforeEach(async () => {
    const session = await prisma.session.create({ data: {} });
    sessionId = session.id;
    const cars = await prisma.car.findMany({ take: 2, orderBy: { slug: "asc" } });
    if (cars.length < 2) throw new Error("seed needs at least two cars");
    carA = { id: cars[0]!.id };
    carB = { id: cars[1]!.id };
  });

  afterEach(async () => {
    if (!sessionId) return;
    try {
      await prisma.session.delete({ where: { id: sessionId } });
    } finally {
      sessionId = undefined;
    }
  });

  function sid(): string {
    if (!sessionId) throw new Error("session not initialized");
    return sessionId;
  }

  it("lists empty then add and list", async () => {
    expect(await listSavedCarsForSession(sid())).toEqual([]);
    const added = await addSavedCarForSession(sid(), carA.id);
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.item.car.id).toBe(carA.id);
    const list = await listSavedCarsForSession(sid());
    expect(list).toHaveLength(1);
    expect(list[0]!.car.id).toBe(carA.id);
  });

  it("404 path: unknown car id", async () => {
    const r = await addSavedCarForSession(sid(), "definitely-not-a-cuid");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("not_found");
  });

  it("409 path: duplicate add", async () => {
    expect((await addSavedCarForSession(sid(), carA.id)).ok).toBe(true);
    const r = await addSavedCarForSession(sid(), carA.id);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("duplicate");
  });

  it("remove is idempotent-ish (removed false when missing)", async () => {
    const r1 = await removeSavedCarForSession(sid(), carA.id);
    expect(r1.removed).toBe(false);
    await addSavedCarForSession(sid(), carA.id);
    const r2 = await removeSavedCarForSession(sid(), carA.id);
    expect(r2.removed).toBe(true);
    const r3 = await removeSavedCarForSession(sid(), carA.id);
    expect(r3.removed).toBe(false);
  });

  it("migrate skips unknown ids and applies valid in one transaction", async () => {
    const summary = await migrateSavedCarsForSession(sid(), [
      { carId: carA.id },
      { carId: "invalid-id-xyz" },
      { carId: carB.id },
    ]);
    expect(summary.skippedIds).toEqual(["invalid-id-xyz"]);
    expect(summary.applied).toBe(2);
    const list = await listSavedCarsForSession(sid());
    expect(list.map((x) => x.car.id).sort()).toEqual([carA.id, carB.id].sort());
  });

  it("migrate idempotency: double call keeps two rows", async () => {
    await migrateSavedCarsForSession(sid(), [{ carId: carA.id }, { carId: carB.id }]);
    const s2 = await migrateSavedCarsForSession(sid(), [{ carId: carA.id }, { carId: carB.id }]);
    expect(s2.applied).toBe(2);
    expect(s2.skippedIds).toEqual([]);
    const list = await listSavedCarsForSession(sid());
    expect(list).toHaveLength(2);
  });

  it("migrate rejects oversized batches defensively", async () => {
    const oversizedItems = Array.from({ length: MAX_MIGRATE_SAVED_CARS_BATCH + 1 }, () => ({
      carId: carA.id,
    }));
    await expect(migrateSavedCarsForSession(sid(), oversizedItems)).rejects.toThrow(RangeError);
  });
});
