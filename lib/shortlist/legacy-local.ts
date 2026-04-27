/** Legacy device-only storage key (never show raw key in UI). */
export const LEGACY_SHORTLIST_STORAGE_KEY = "cardekho_shortlist_ids";

/** After successful server migration, client sets this and clears legacy keys. */
export const SHORTLIST_MIGRATED_FLAG = "shortlist_migrated_v1";

export function loadLegacyShortlistIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEGACY_SHORTLIST_STORAGE_KEY);
    if (!raw) return [];
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function markShortlistMigratedAndClearLegacy() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SHORTLIST_MIGRATED_FLAG, "1");
    localStorage.removeItem(LEGACY_SHORTLIST_STORAGE_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

export function hasShortlistMigrationFlag(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(SHORTLIST_MIGRATED_FLAG) === "1";
  } catch {
    return true;
  }
}
