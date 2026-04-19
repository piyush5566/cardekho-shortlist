/**
 * Vitest uses a dedicated Postgres database (see docker/postgres-init.sql).
 * Override with VITEST_DATABASE_URL if your host port or credentials differ.
 */
export function getTestDatabaseUrl(): string {
  return (
    process.env.VITEST_DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/cardekho_test?schema=public"
  );
}
