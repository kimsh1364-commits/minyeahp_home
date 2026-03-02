import { PrismaClient } from "@/app/generated/prisma";
import path from "path";

function createPrismaClient() {
  const absolutePath = path.join(process.cwd(), "prisma", "dev.db");

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

  const db = new Database(absolutePath);
  const adapter = new PrismaBetterSqlite3(db);

  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
