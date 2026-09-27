import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { env } from "@reluxury/env/server";

import type { TurnstileAction } from "@/lib/turnstile";
import { authMiddleware } from "@/middleware/auth";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Frontend hostnames allowed to consume the widget. The worker serves
// reluxury.shop plus one pr-<n> subdomain per preview.
function isAllowedHostname(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return true;
  }
  return (
    hostname === "reluxury.shop" || hostname.endsWith(".reluxury.shop")
  );
}

function readSecret(): string {
  try {
    const record = env as unknown as Record<string, string | undefined>;
    return record.TURNSTILE_SECRET_KEY ?? "";
  } catch {
    return "";
  }
}

export const verifyTurnstile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      action: z.enum(["login", "signup"]),
      token: z.string().max(2048),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ data }) => {
    const secret = readSecret();
    if (!secret) {
      // Secret not configured yet (local dev / preview without the key):
      // fail open so auth keeps working until the secret is set.
      return { configured: false, success: true };
    }
    if (!data.token) {
      return { configured: true, success: false };
    }
    let result: {
      action?: string;
      hostname?: string;
      success?: boolean;
    };
    try {
      const response = await fetch(SITEVERIFY_URL, {
        body: new URLSearchParams({
          response: data.token,
          secret,
        }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`siteverify ${response.status}`);
      }
      result = (await response.json()) as typeof result;
    } catch (error) {
      console.error("Turnstile siteverify failed", error);
      return { configured: true, success: false };
    }
    const expectedAction: TurnstileAction = data.action;
    if (
      result.success !== true ||
      result.action !== expectedAction ||
      typeof result.hostname !== "string" ||
      !isAllowedHostname(result.hostname)
    ) {
      return { configured: true, success: false };
    }
    return { configured: true, success: true };
  });
