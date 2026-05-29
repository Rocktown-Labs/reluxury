import { createAuth } from "@reluxury/auth";
import { env } from "@reluxury/env/server";
import { createMiddleware } from "@tanstack/react-start";

export const authMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    const session = await createAuth().api.getSession({
      headers: request.headers,
    });
    if (session && session.user && env.ADMIN_EMAILS) {
      const adminEmails = env.ADMIN_EMAILS.split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
      if (adminEmails.includes(session.user.email.toLowerCase())) {
        session.user.role = "admin";
      }
    }
    return next({
      context: { session },
    });
  }
);
