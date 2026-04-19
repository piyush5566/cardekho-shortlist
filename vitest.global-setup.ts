import { execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

export default async function globalSetup() {
  const testDb = path.join(__dirname, "prisma", "test.db");
  const url = `file:${testDb}`;
  process.env.DATABASE_URL = url;
  process.env.AI_PROVIDER = "mock";
  if (fs.existsSync(testDb)) {
    fs.unlinkSync(testDb);
  }
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    cwd: __dirname,
    env: { ...process.env, DATABASE_URL: url },
  });
  execSync("npx tsx prisma/seed.ts", {
    stdio: "inherit",
    cwd: __dirname,
    env: { ...process.env, DATABASE_URL: url },
  });
}
