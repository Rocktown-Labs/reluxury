export const EMAIL_FROM = {
  noreply: "ReLUXURY <noreply@mail.reluxury.shop>",
  orders: "ReLUXURY Orders <orders@mail.reluxury.shop>",
  tailoring: "ReLUXURY Tailoring <tailoring@mail.reluxury.shop>",
  workshops: "ReLUXURY Workshops <workshops@mail.reluxury.shop>",
} as const;

export interface EmailBusinessInfo {
  address: string;
  phone: string;
}

const DEFAULT_EMAIL_BUSINESS: EmailBusinessInfo = {
  address: "14217 Corvallis Rd, Ste F, Maumelle, AR 72113",
  phone: "(501) 404-8696",
};

function businessFooter(business?: EmailBusinessInfo): string {
  const info = business ?? DEFAULT_EMAIL_BUSINESS;
  const address = info.address.replaceAll("\n", ", ");
  return `<p style="color:#6b6259;font-size:12px;border-top:1px solid #eee;padding-top:12px;margin-top:20px">${address} · ${info.phone}</p>`;
}

export interface ResendSendInput {
  apiKey: string;
  from?: string;
  html: string;
  subject: string;
  to: string;
}

export async function sendViaResend(input: ResendSendInput) {
  if (!input.apiKey) {
    console.log(
      `[email skipped - no RESEND_API_KEY] to=${input.to} subject=${input.subject}`
    );
    return { skipped: true as const };
  }
  const res = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: input.from ?? EMAIL_FROM.noreply,
      html: input.html,
      subject: input.subject,
      to: input.to,
    }),
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Resend send failed: ${res.status} ${text}`);
    return { ok: false as const, status: res.status };
  }
  return { ok: true as const };
}

export function welcomeHtml(props: { business?: EmailBusinessInfo; name: string }) {
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto"><div style="background:#0a0a0a;color:#d4af77;padding:24px;text-align:center;font-weight:700;letter-spacing:4px">ReLUXURY</div><div style="padding:24px"><h1>Welcome, ${props.name}!</h1><p>Thanks for joining — shop pre-loved luxury, book alterations, and grab a seat in our free workshops.</p><p><a href="https://reluxury.shop/shop">Start shopping</a> · <a href="https://reluxury.shop/events">Browse workshops</a></p>${businessFooter(props.business)}</div></div>`;
}

export function staffInvitationHtml(props: {
  business?: EmailBusinessInfo;
  inviteUrl: string;
  inviterName: string;
  roleTitle: string;
}) {
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto"><div style="background:#0a0a0a;color:#d4af77;padding:24px;text-align:center;font-weight:700;letter-spacing:4px">ReLUXURY</div><div style="padding:24px"><h1>Join the ReLUXURY team</h1><p>${props.inviterName} has invited you to join ReLUXURY as <strong>${props.roleTitle}</strong>.</p><p><a href="${props.inviteUrl}">Accept invitation</a></p><p style="color:#6b6259">This link expires in 7 days. Sign in (or create your account) with the invited email address first.</p>${businessFooter(props.business)}</div></div>`;
}

export function tailoringBookingHtml(props: {
  business?: EmailBusinessInfo;
  customerName: string;
  preferredDate: string;
  serviceType: string;
}) {
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto"><div style="background:#0a0a0a;color:#d4af77;padding:24px;text-align:center;font-weight:700;letter-spacing:4px">ReLUXURY</div><div style="padding:24px"><h1>Request received</h1><p>Hi ${props.customerName}, we got your tailoring request for <strong>${props.serviceType}</strong> (${props.preferredDate}). We'll confirm your appointment shortly.</p><p><a href="https://reluxury.shop/dashboard">View my bookings</a></p>${businessFooter(props.business)}</div></div>`;
}

export function tailoringStatusHtml(props: {
  business?: EmailBusinessInfo;
  customerName: string;
  serviceType: string;
  status: string;
}) {
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto"><div style="background:#0a0a0a;color:#d4af77;padding:24px;text-align:center;font-weight:700;letter-spacing:4px">ReLUXURY</div><div style="padding:24px"><h1>Booking update</h1><p>Hi ${props.customerName}, your tailoring request for <strong>${props.serviceType}</strong> is now <strong>${props.status}</strong>.</p>${businessFooter(props.business)}</div></div>`;
}

export function workshopConfirmHtml(props: {
  attendeeName: string;
  business?: EmailBusinessInfo;
  location?: string;
  startDate: string;
  title: string;
}) {
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto"><div style="background:#0a0a0a;color:#d4af77;padding:24px;text-align:center;font-weight:700;letter-spacing:4px">ReLUXURY</div><div style="padding:24px"><h1>You&apos;re registered!</h1><p>Hi ${props.attendeeName}, we got you — your spot for <strong>${props.title}</strong> is confirmed.</p><p>📅 ${props.startDate}<br/>📍 ${props.location ?? "ReLUXURY Boutique, Maumelle AR"}</p><p><a href="https://reluxury.shop/dashboard">View my workshops</a></p><p style="color:#6b6259">Free workshop — just show up a few minutes early.</p>${businessFooter(props.business)}</div></div>`;
}

export function workshopReminderHtml(props: {
  attendeeName: string;
  business?: EmailBusinessInfo;
  location?: string;
  startDate: string;
  title: string;
}) {
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto"><div style="background:#0a0a0a;color:#d4af77;padding:24px;text-align:center;font-weight:700;letter-spacing:4px">ReLUXURY</div><div style="padding:24px"><h1>See you soon, ${props.attendeeName}</h1><p>Reminder — <strong>${props.title}</strong> is coming up.</p><p>📅 ${props.startDate}<br/>📍 ${props.location ?? "ReLUXURY Boutique, Maumelle AR"}</p>${businessFooter(props.business)}</div></div>`;
}

export function orderConfirmationHtml(props: {
  business?: EmailBusinessInfo;
  customerName: string;
  deliveryMethod: string;
  items: { price: number; quantity: number; title: string }[];
  orderNumber: string;
  total: number;
}) {
  const rows = props.items
    .map((i) => `<p>${i.quantity} × ${i.title} — $${i.price.toFixed(2)}</p>`)
    .join("");
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto"><div style="background:#0a0a0a;color:#d4af77;padding:24px;text-align:center;font-weight:700;letter-spacing:4px">ReLUXURY</div><div style="padding:24px"><h1>Order confirmed</h1><p>Hi ${props.customerName}, order <strong>${props.orderNumber}</strong> (${props.deliveryMethod}) is confirmed.</p>${rows}<p><strong>Total: $${props.total.toFixed(2)}</strong></p>${businessFooter(props.business)}</div></div>`;
}
