import { createDb } from "@reluxury/db";
import * as schema from "@reluxury/db/schema/auth";
import { env } from "@reluxury/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";

export function createAuth() {
  const db = createDb();

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      tanstackStartCookies(),
      admin({
        adminRole: "admin",
        defaultRole: "customer",
      }),
    ],
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.CORS_ORIGIN],
  });
}
