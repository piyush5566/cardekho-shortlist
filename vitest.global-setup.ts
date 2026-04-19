import { execSync } from "node:child_process";
import { getTestDatabaseUrl } from "./vitest.test-db-url";

export default async function globalSetup() {
  const url = getTestDatabaseUrl();
  process.env.DATABASE_URL = url;
  process.env.AI_PROVIDER = "mock";

  execSync("npx prisma migrate reset --force", {
    stdio: "inherit",
    cwd: __dirname,
    env: { ...process.env, DATABASE_URL: url, AI_PROVIDER: "mock" },
  });
}
