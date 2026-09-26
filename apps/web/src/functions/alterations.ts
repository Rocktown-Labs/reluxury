import { createDb, readBusinessContact } from "@reluxury/db";
import { alterationBookings } from "@reluxury/db/schema";
import { env } from "@reluxury/env/server";
import { EMAIL_FROM, sendViaResend, tailoringBookingHtml } from "@reluxury/transactional";
import { createServerFn } from "@tanstack/react-start";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

import { notifyAdmin } from "@/lib/admin-notify";
import { authMiddleware } from "@/middleware/auth";

export const createAlterationBooking = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      itemDescription: z.string(),
      notes: z.string().optional(),
      preferredDate: z.string().datetime(),
      preferredTime: z.string().optional(),
      serviceType: z.string(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    if (!context.session) {
      throw new Error("Unauthorized");
    }
    const db = createDb();
    await db.insert(alterationBookings).values({
      id: crypto.randomUUID(),
      itemDescription: data.itemDescription,
      notes: data.notes ?? null,
      preferredDate: new Date(data.preferredDate),
      preferredTime: data.preferredTime ?? null,
      serviceType: data.serviceType,
      status: "pending",
      userId: context.session.user.id,
    });
    await notifyAdmin(
      `New tailoring request — ${data.serviceType}`,
      `<div style="font-family:sans-serif"><h2>New tailoring request</h2><p>${context.session.user.email} requested <strong>${data.serviceType}</strong> for "${data.itemDescription}".</p><p>Preferred: ${data.preferredDate}${data.preferredTime ? ` at ${data.preferredTime}` : ""}.</p></div>`
    );
    try {
      const business = await readBusinessContact(db);
      await sendViaResend({
        apiKey: env.RESEND_API_KEY ?? "",
        from: EMAIL_FROM.tailoring,
        html: tailoringBookingHtml({
          business,
          customerName: context.session.user.name ?? "there",
          preferredDate: data.preferredDate,
          serviceType: data.serviceType,
        }),
        subject: `Tailoring request received — ${data.serviceType}`,
        to: context.session.user.email,
      });
    } catch (error) {
      console.error("Tailoring confirmation email failed", error);
    }
    return { success: true };
  });

export const getMyAlterationBookings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!context.session) {
      throw new Error("Unauthorized");
    }
    const db = createDb();
    return db.query.alterationBookings.findMany({
      orderBy: [desc(alterationBookings.createdAt)],
      where: eq(alterationBookings.userId, context.session.user.id),
    });
  });
