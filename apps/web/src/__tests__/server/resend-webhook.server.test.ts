import { describe, expect, it } from "vitest";

import { handleResendWebhook } from "../../functions/resend-webhook";

const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.codePointAt(index) ?? 0;
  }
  return bytes;
}

async function webhookHeaders(secret: string, payload: string) {
  const raw = fromBase64(secret.replace("whsec_", ""));
  const key = await crypto.subtle.importKey(
    "raw",
    raw as BufferSource,
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"]
  );
  const id = "msg_test123";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${id}.${timestamp}.${payload}`)
  );
  return {
    "webhook-id": id,
    "webhook-signature": `v1,${toBase64(new Uint8Array(signature))}`,
    "webhook-timestamp": timestamp,
  };
}

const TEST_SECRET = `whsec_${toBase64(
  encoder.encode("test-webhook-secret-32bytes!!")
)}`;

function signedRequest(payload: string, headers: Record<string, string>) {
  return new Request("https://reluxury.shop/api/webhooks/resend", {
    body: payload,
    headers,
    method: "POST",
  });
}

describe("Resend webhook receiver", () => {
  it("rejects requests without signature headers", async () => {
    const res = await handleResendWebhook(
      signedRequest(`{"type":"email.delivered"}`, {}),
      TEST_SECRET
    );
    expect(res.status).toBe(401);
  });

  it("rejects forged signatures", async () => {
    const payload = JSON.stringify({ data: {}, type: "email.delivered" });
    const headers = await webhookHeaders(TEST_SECRET, `${payload}tampered`);
    const res = await handleResendWebhook(
      signedRequest(payload, headers),
      TEST_SECRET
    );
    expect(res.status).toBe(401);
  });

  it("accepts valid delivery events", async () => {
    const payload = JSON.stringify({
      data: {
        email_id: "email_123",
        subject: "Order confirmed",
        to: ["customer@example.com"],
      },
      type: "email.delivered",
    });
    const headers = await webhookHeaders(TEST_SECRET, payload);
    const res = await handleResendWebhook(
      signedRequest(payload, headers),
      TEST_SECRET
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("OK");
  });

  it("acks bounce events without error", async () => {
    const payload = JSON.stringify({
      data: { email_id: "email_456", to: ["bounced@resend.dev"] },
      type: "email.bounced",
    });
    const headers = await webhookHeaders(TEST_SECRET, payload);
    const res = await handleResendWebhook(
      signedRequest(payload, headers),
      TEST_SECRET
    );
    expect(res.status).toBe(200);
  });

  it("returns 500 when the secret is not configured", async () => {
    const res = await handleResendWebhook(
      signedRequest(`{"type":"email.delivered"}`, {}),
      ""
    );
    expect(res.status).toBe(500);
  });
});
