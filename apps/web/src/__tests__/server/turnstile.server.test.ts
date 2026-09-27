import { describe, expect, it } from "vitest";

import { verifyTurnstile } from "@/functions/turnstile";

describe("verifyTurnstile", () => {
  it("fails open when the secret is not configured", async () => {
    const result = await verifyTurnstile({
      data: { action: "login", token: "" },
    });
    expect(result.configured).toBe(false);
    expect(result.success).toBe(true);
  });

  it("fails open for signup too without a secret", async () => {
    const result = await verifyTurnstile({
      data: { action: "signup", token: "any-token" },
    });
    expect(result.configured).toBe(false);
    expect(result.success).toBe(true);
  });
});
