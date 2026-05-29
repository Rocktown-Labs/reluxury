import { env } from "@reluxury/env/server";
import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "@/middleware/auth";

export const getUser = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { session } = context;
    if (session && session.user && env.ADMIN_EMAILS) {
      const adminEmails = env.ADMIN_EMAILS.split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
      if (adminEmails.includes(session.user.email.toLowerCase())) {
        session.user.role = "admin";
      }
    }
    return session;
  });
