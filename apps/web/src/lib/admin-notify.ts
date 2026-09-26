import { env } from "@reluxury/env/server";
import { EMAIL_FROM, sendViaResend } from "@reluxury/transactional";

export function getAdminEmail(): string | null {
  const raw = env.ADMIN_EMAILS ?? "";
  return (
    raw
      .split(",")
      .map((part) => part.trim())
      .find(Boolean) ?? null
  );
}

export async function notifyAdmin(subject: string, html: string) {
  const to = getAdminEmail();
  const apiKey = env.RESEND_API_KEY ?? "";
  if (!to || !apiKey) {
    return;
  }
  try {
    await sendViaResend({
      apiKey,
      from: EMAIL_FROM.noreply,
      html,
      subject: `[ReLUXURY Admin] ${subject}`,
      to,
    });
  } catch (error) {
    console.error("Admin notification failed", error);
  }
}
