import { getTestDatabaseUrl } from "./vitest.test-db-url";

process.env.DATABASE_URL = getTestDatabaseUrl();
process.env.AI_PROVIDER = "mock";
