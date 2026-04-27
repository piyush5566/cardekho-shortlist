import { z } from "zod";

export const MAX_MIGRATE_SAVED_CARS_BATCH = 100;

export const PostSavedCarBodySchema = z.object({
  carId: z.string().min(1),
});

export const MigrateSavedCarsBodySchema = z.object({
  items: z.array(
    z.object({
      carId: z.string().min(1),
      snapshot: z.unknown().optional(),
    }),
  ).max(MAX_MIGRATE_SAVED_CARS_BATCH),
});
