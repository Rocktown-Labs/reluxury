import { createDb } from "@reluxury/db";
import { orders, orderItems, cartItems, products } from "@reluxury/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "@/middleware/auth";

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      deliveryMethod: z.enum(["pickup", "shipping"]),
      email: z.string(),
      name: z.string(),
      phone: z.string().optional(),
      shippingAddress: z
        .object({
          address: z.string(),
          city: z.string(),
          email: z.string(),
          name: z.string(),
          phone: z.string().optional(),
          state: z.string(),
          zip: z.string(),
        })
        .optional(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    if (!context.session) {
      throw new Error("Unauthorized");
    }
    const db = createDb();
    const userId = context.session.user.id;

    const cart = await db.query.cartItems.findMany({
      where: eq(cartItems.userId, userId),
      with: {
        product: true,
      },
    });

    if (cart.length === 0) {
      throw new Error("Cart is empty");
    }

    let subtotal = 0;
    for (const item of cart) {
      const price = item.product.salePrice ?? item.product.price;
      subtotal += price * item.quantity;
    }

    const shippingCost = data.deliveryMethod === "shipping" ? 9.99 : 0;
    const total = subtotal + shippingCost;

    const orderNumber = `RLX-${Date.now().toString(36).toUpperCase()}`;
    const orderId = crypto.randomUUID();

    await db.insert(orders).values({
      deliveryMethod: data.deliveryMethod,
      email: data.email,
      id: orderId,
      name: data.name,
      orderNumber,
      phone: data.phone ?? null,
      shippingAddress: data.shippingAddress
        ? JSON.stringify(data.shippingAddress)
        : null,
      shippingCost,
      status: "pending",
      subtotal,
      tax: 0,
      total,
      userId,
    });

    for (const item of cart) {
      const price = item.product.salePrice ?? item.product.price;
      await db.insert(orderItems).values({
        id: crypto.randomUUID(),
        orderId,
        price,
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        title: item.product.title,
      });

      await db
        .update(products)
        .set({ quantity: item.product.quantity - item.quantity })
        .where(eq(products.id, item.productId));
    }

    await db.delete(cartItems).where(eq(cartItems.userId, userId));

    return { orderId, orderNumber };
  });

export const getOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!context.session) {
      throw new Error("Unauthorized");
    }
    const db = createDb();
    return db.query.orders.findMany({
      orderBy: [desc(orders.createdAt)],
      where: eq(orders.userId, context.session.user.id),
      with: {
        items: true,
      },
    });
  });

export const getOrderById = createServerFn({ method: "GET" })
  .inputValidator(z.string())
  .middleware([authMiddleware])
  .handler(async ({ context, data: orderId }) => {
    if (!context.session) {
      throw new Error("Unauthorized");
    }
    const db = createDb();
    return db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: true,
      },
    });
  });
