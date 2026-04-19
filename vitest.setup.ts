import path from "node:path";

process.env.DATABASE_URL = `file:${path.join(__dirname, "prisma", "test.db")}`;
process.env.AI_PROVIDER = "mock";
