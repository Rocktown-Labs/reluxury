import { createDb } from "@reluxury/db";
import { eventRegistrations } from "@reluxury/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";

export const registerForEvent = createServerFn({ method: "POST" })
  .inputValidator(z.string())
  .middleware([authMiddleware])
  .handler(async ({ context, data: eventId }) => {
    if (!context.session) {
      throw new Error("Unauthorized");
    }
    const db = createDb();

    const existing = await db.query.eventRegistrations.findFirst({
      where: and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.userId, context.session.user.id)
      ),
    });

    if (existing) {
      throw new Error("Already registered for this event");
    }

    await db.insert(eventRegistrations).values({
      eventId,
      id: crypto.randomUUID(),
      paymentStatus: "pending",
      status: "registered",
      userId: context.session.user.id,
    });

    return { success: true };
  });

export const getMyEventRegistrations = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!context.session) {
      throw new Error("Unauthorized");
    }
    const db = createDb();
    return db.query.eventRegistrations.findMany({
      orderBy: [eventRegistrations.createdAt],
      where: eq(eventRegistrations.userId, context.session.user.id),
      with: {
        event: true,
      },
    });
  });
