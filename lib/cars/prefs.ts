import { z } from "zod";

const FuelType = z.enum(["PETROL", "DIESEL", "CNG", "EV"]);
const Segment = z.enum(["HATCHBACK", "SUV", "SEDAN", "MPV"]);

function emptyToUndefined<T>(val: T | "" | undefined | null): T | undefined {
  if (val === "" || val === null || val === undefined) return undefined;
  return val as T;
}

/** Normalize optional query / JSON fields: empty string becomes undefined. */
function preprocessOptionalString(schema: z.ZodTypeAny) {
  return z.preprocess((v) => emptyToUndefined(v as string), schema.optional());
}

function preprocessOptionalNumber(schema: z.ZodNumber) {
  return z.preprocess((v) => {
    const u = emptyToUndefined(v as string | number);
    if (u === undefined) return undefined;
    if (typeof u === "number" && Number.isNaN(u)) return undefined;
    return u;
  }, schema.optional());
}

function preprocessOptionalBoolean() {
  return z.preprocess((v) => {
    const u = emptyToUndefined(v as string | boolean);
    if (u === undefined) return undefined;
    if (typeof u === "boolean") return u;
    if (u === "true" || u === "1") return true;
    if (u === "false" || u === "0") return false;
    return u;
  }, z.boolean().optional());
}

export const ShortlistPrefsSchema = z.object({
  budgetMinLakh: preprocessOptionalNumber(z.coerce.number().min(0)),
  budgetMaxLakh: preprocessOptionalNumber(z.coerce.number().min(0)),
  fuelType: preprocessOptionalString(FuelType),
  segment: preprocessOptionalString(Segment),
  minSeats: preprocessOptionalNumber(z.coerce.number().int().min(2).max(9)),
  sunroof: preprocessOptionalBoolean(),
  automaticOnly: preprocessOptionalBoolean(),
  /** Soft preference — never affects SQL `where`. */
  notes: z.preprocess(
    (v) => emptyToUndefined(v as string),
    z.string().max(2000).optional(),
  ),
});

export type ShortlistPrefs = z.infer<typeof ShortlistPrefsSchema>;

export function parsePrefsFromSearchParams(params: URLSearchParams) {
  const raw: Record<string, string> = {};
  params.forEach((value, key) => {
    raw[key] = value;
  });
  return ShortlistPrefsSchema.safeParse(raw);
}

export function parsePrefsFromJson(body: unknown) {
  return ShortlistPrefsSchema.safeParse(body);
}
