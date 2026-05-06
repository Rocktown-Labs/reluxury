import { createDb } from "@reluxury/db";
import { cartItems } from "@reluxury/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";

export const getCart = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!context.session) {
      return [];
    }
    const db = createDb();
    return db.query.cartItems.findMany({
      orderBy: [cartItems.createdAt],
      where: eq(cartItems.userId, context.session.user.id),
      with: {
        product: {
          with: {
            images: {
              limit: 1,
            },
          },
        },
      },
    });
  });

export const addToCart = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      productId: z.string(),
      quantity: z.number().min(1),
      size: z.string().nullable().optional(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    if (!context.session) {
      throw new Error("Unauthorized");
    }
    const db = createDb();
    const existing = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.userId, context.session.user.id),
        eq(cartItems.productId, data.productId),
        data.size ? eq(cartItems.size, data.size) : undefined
      ),
    });

    if (existing) {
      await db
        .update(cartItems)
        .set({ quantity: existing.quantity + data.quantity })
        .where(eq(cartItems.id, existing.id));
    } else {
      await db.insert(cartItems).values({
        id: crypto.randomUUID(),
        productId: data.productId,
        quantity: data.quantity,
        size: data.size ?? null,
        userId: context.session.user.id,
      });
    }

    return { success: true };
  });

export const updateCartItem = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      itemId: z.string(),
      quantity: z.number().min(0),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    if (!context.session) {
      throw new Error("Unauthorized");
    }
    const db = createDb();
    if (data.quantity === 0) {
      await db.delete(cartItems).where(eq(cartItems.id, data.itemId));
    } else {
      await db
        .update(cartItems)
        .set({ quantity: data.quantity })
        .where(eq(cartItems.id, data.itemId));
    }
    return { success: true };
  });

export const removeFromCart = createServerFn({ method: "POST" })
  .inputValidator(z.string())
  .middleware([authMiddleware])
  .handler(async ({ context, data: itemId }) => {
    if (!context.session) {
      throw new Error("Unauthorized");
    }
    const db = createDb();
    await db.delete(cartItems).where(eq(cartItems.id, itemId));
    return { success: true };
  });
