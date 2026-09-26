import { createDb } from "@reluxury/db";
import * as schema from "@reluxury/db/schema/auth";
import { env } from "@reluxury/env/server";
import { EMAIL_FROM, welcomeHtml } from "@reluxury/transactional";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { admin } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";

async function sendWelcomeEmail(email: string, name: string) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    return;
  }
  await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: EMAIL_FROM.noreply,
      html: welcomeHtml({ name }),
      subject: "Welcome to ReLUXURY",
      to: email,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

async function sendResetPasswordEmail(email: string, url: string) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    return;
  }
  await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: EMAIL_FROM.noreply,
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px"><h1 style="font-size:22px">Reset your ReLUXURY password</h1><p>Click the link below to set a new password. It expires in 1 hour.</p><p><a href="${url}">Reset password</a></p></div>`,
      subject: "Reset your ReLUXURY password",
      to: email,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function createAuth() {
  const db = createDb();
  const googleClientId = env.GOOGLE_CLIENT_ID;
  const googleClientSecret = env.GOOGLE_CLIENT_SECRET;

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      async sendResetPassword({ user, url }) {
        try {
          await sendResetPasswordEmail(user.email, url);
        } catch (error) {
          console.error("Reset password email failed", error);
        }
      },
    },
    hooks: {
      after: createAuthMiddleware(async (c) => {
        if (c.path !== "/sign-up/email") {
          return;
        }
        const user = c.context.newSession?.user;
        if (user) {
          try {
            await sendWelcomeEmail(user.email, user.name);
          } catch (error) {
            console.error("Welcome email failed", error);
          }
        }
      }),
    },
    plugins: [
      tanstackStartCookies(),
      admin({
        adminRole: "admin",
        defaultRole: "customer",
      }),
    ],
    secret: env.BETTER_AUTH_SECRET,
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60 * 24 * 7,
      },
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24 * 7,
    },
    socialProviders:
      googleClientId && googleClientSecret
        ? {
            google: {
              clientId: googleClientId,
              clientSecret: googleClientSecret,
            },
          }
        : undefined,
    trustedOrigins: [
      env.CORS_ORIGIN,
      "https://reluxury.shop",
      "https://www.reluxury.shop",
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
