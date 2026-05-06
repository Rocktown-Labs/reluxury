import { createDb } from "@reluxury/db";
import { alterationBookings } from "@reluxury/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

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
