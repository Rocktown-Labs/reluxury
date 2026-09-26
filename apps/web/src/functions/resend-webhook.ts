import { env } from "@reluxury/env/server";
import { Resend } from "resend";

interface ResendEventSummary {
  emailId?: string;
  subject?: string;
  to?: string[];
  type: string;
}

function summarizeEvent(event: {
  data?: unknown;
  type: string;
}): ResendEventSummary {
  const data = (event.data ?? {}) as {
    email_id?: string;
    subject?: string;
    to?: string[];
  };
  return {
    emailId: data.email_id,
    subject: data.subject,
    to: data.to,
    type: event.type,
  };
}

export async function handleResendWebhook(
  request: Request,
  secret = env.RESEND_WEBHOOK_SECRET
): Promise<Response> {
  if (!secret) {
    console.error("Resend webhook secret not configured");
    return new Response("Webhook not configured", { status: 500 });
  }

  const headers = {
    id: request.headers.get("webhook-id") ?? "",
    signature: request.headers.get("webhook-signature") ?? "",
    timestamp: request.headers.get("webhook-timestamp") ?? "",
  };
  if (!headers.id || !headers.signature || !headers.timestamp) {
    return new Response("Missing signature headers", { status: 401 });
  }

  const resend = new Resend(env.RESEND_API_KEY || "re_local_verify_only");
  let event: { data?: unknown; type: string };
  try {
    event = resend.webhooks.verify({
      headers,
      payload: await request.text(),
      webhookSecret: secret,
    }) as { data?: unknown; type: string };
  } catch {
    return new Response("Invalid signature", { status: 401 });
  }

  const summary = summarizeEvent(event);
  switch (event.type) {
    case "email.bounced":
    case "email.complained":
    case "email.failed": {
      console.warn(`Resend ${event.type}`, summary);
      break;
    }
    case "email.delivered":
    case "email.delivery_delayed":
    case "email.opened":
    case "email.clicked":
    case "email.sent":
    case "email.suppressed": {
      console.log(`Resend ${event.type}`, summary);
      break;
    }
    default: {
      console.log(`Resend event ignored: ${event.type}`);
      break;
    }
  }

  return new Response("OK", { status: 200 });
}
