import type { createDb } from "@reluxury/db";
import type * as schema from "@reluxury/db/schema";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";

// Narrowed handle over the createDb() union (D1 vs in-memory test driver).
// Use requireDb() in new server code so fresh queries don't add to the
// repo's endemic db-union type noise.
export type AppDb = BaseSQLiteDatabase<
  "async",
  // oxlint-disable-next-line typescript/no-explicit-any
  any,
  typeof schema
>;

export function requireDb(db: ReturnType<typeof createDb>): AppDb {
  if (!db) {
    throw new Error("Database unavailable");
  }
  return db as AppDb;
}
