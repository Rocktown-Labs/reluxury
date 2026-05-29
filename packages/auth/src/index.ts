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
    trustedOrigins: [
      env.CORS_ORIGIN,
      "https://reluxury.localhost",
      "http://reluxury.localhost",
      "http://localhost:3002",
      "http://127.0.0.1:3002",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ].filter(Boolean),
  });
}
