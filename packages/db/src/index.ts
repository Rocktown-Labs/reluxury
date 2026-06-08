/* oxlint-disable node/global-require, unicorn/prefer-module */
import { env } from "@reluxury/env/server";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";

import * as schema from "./schema";

export function createDb() {
  const isTest =
    typeof process !== "undefined" && process.env.VITEST === "true";

  if (isTest) {
    // In Vitest tests, use an in-memory LibSQL database so we don't depend on Wrangler sandbox connection
    // @ts-expect-error: dynamic require is used to prevent workerd bundle bloat in production
    const { drizzle: drizzleLibsql } = require("drizzle-orm/libsql");
    // @ts-expect-error: dynamic require is used to prevent workerd bundle bloat in production
    const { createClient } = require("@libsql/client");
    // @ts-expect-error: dynamic require is used to prevent workerd bundle bloat in production
    const path = require("node:path");

    const globalRef = globalThis as unknown as {
      __testDb?: ReturnType<typeof drizzleD1>;
    };
    if (!globalRef.__testDb) {
      const client = createClient({ url: "file::memory:?cache=shared" });
      const db = drizzleLibsql(client, { schema });

      // Run migrations on the in-memory database
      // @ts-expect-error: dynamic require is used to prevent workerd bundle bloat in production
      const { migrate } = require("drizzle-orm/libsql/migrator");
      migrate(db, {
        migrationsFolder: path.resolve(__dirname, "migrations"),
      });

      globalRef.__testDb = db;
    }
    return globalRef.__testDb;
  }

  return drizzleD1(env.DB, { schema });
}
