/* oxlint-disable complexity */
import { createDb } from "@reluxury/db";
import {
  orders,
  orderItems,
  cartItems,
  products,
  eventRegistrations,
} from "@reluxury/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

import { shippo } from "@/lib/shippo";
import type { ShippoRate } from "@/lib/shippo";
import { authMiddleware } from "@/middleware/auth";

const orderInputSchema = z.object({
  deliveryMethod: z.enum(["pickup", "shipping"]),
  email: z.string(),
  guestItems: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().min(1),
        size: z.string().nullable().optional(),
      })
    )
    .optional(),
  name: z.string(),
  phone: z.string().optional(),
  selectedShippingRate: z
    .object({
      amount: z.string(),
      objectId: z.string(),
      provider: z.string(),
      servicelevelName: z.string(),
      shipmentObjectId: z.string().optional(),
    })
    .optional(),
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
});

const shippingRateInputSchema = z.object({
  guestItems: orderInputSchema.shape.guestItems,
  shippingAddress: orderInputSchema.shape.shippingAddress.unwrap(),
});

const DEFAULT_PACKAGE_DIMENSIONS = {
  height: 4,
  length: 14,
  width: 10,
} as const;
const DEFAULT_ITEM_WEIGHT_OZ = 16;

async function getCheckoutCart(
  db: ReturnType<typeof createDb>,
  userId: string | null,
  guestItems?: z.infer<typeof orderInputSchema>["guestItems"]
) {
  const cart: {
    productId: string;
    quantity: number;
    size: string | null;
    product: typeof products.$inferSelect;
  }[] = [];

  if (userId) {
    const dbCart = await db.query.cartItems.findMany({
      where: eq(cartItems.userId, userId),
      with: { product: true },
    });
    return dbCart.map((item) => ({
      product: item.product,
      productId: item.productId,
      quantity: item.quantity,
      size: item.size,
    }));
  }

  if (!guestItems || guestItems.length === 0) {
    return cart;
  }

  for (const guestItem of guestItems) {
    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, guestItem.productId),
        eq(products.isActive, true)
      ),
    });
    if (!product) {
      continue;
    }
    cart.push({
      product,
      productId: guestItem.productId,
      quantity: guestItem.quantity,
      size: guestItem.size ?? null,
    });
  }

  return cart;
}

function getCartWeightOz(
  cart: Awaited<ReturnType<typeof getCheckoutCart>>
): number {
  let totalWeight = 0;
  for (const item of cart) {
    totalWeight +=
      (item.product.weight ?? DEFAULT_ITEM_WEIGHT_OZ) * item.quantity;
  }
  return Math.max(totalWeight, DEFAULT_ITEM_WEIGHT_OZ);
}

export const getCheckoutShippingRates = createServerFn({ method: "POST" })
  .inputValidator(shippingRateInputSchema)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const db = createDb();
    const userId = context.session?.user.id ?? null;
    const cart = await getCheckoutCart(db, userId, data.guestItems);

    if (cart.length === 0) {
      throw new Error("Cart is empty");
    }

    const address = {
      city: data.shippingAddress.city,
      country: "US",
      email: data.shippingAddress.email,
      name: data.shippingAddress.name,
      phone: data.shippingAddress.phone,
      state: data.shippingAddress.state,
      street1: data.shippingAddress.address,
      zip: data.shippingAddress.zip,
    };

    const validation = await shippo.validateAddress(address);

    if (!validation.isValid) {
      return {
        messages: validation.messages,
        rates: [] as ShippoRate[],
        success: false,
      };
    }

    const rates = await shippo.getRates(address, {
      ...DEFAULT_PACKAGE_DIMENSIONS,
      weight: getCartWeightOz(cart),
    });

    return { messages: [], rates, success: true };
  });

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator(orderInputSchema)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const db = createDb();
    const userId = context.session?.user.id ?? null;

    const cart = await getCheckoutCart(db, userId, data.guestItems);

    if (cart.length === 0) {
      throw new Error("Cart is empty");
    }

    let subtotal = 0;
    for (const item of cart) {
      const price = item.product.salePrice ?? item.product.price;
      subtotal += price * item.quantity;
    }

    const shippingCost =
      data.deliveryMethod === "shipping"
        ? Number(data.selectedShippingRate?.amount ?? 9.99)
        : 0;
    const total = subtotal + shippingCost;

    const orderNumber = `RLX-${Date.now().toString(36).toUpperCase()}`;
    const orderId = crypto.randomUUID();

    await db.insert(orders).values({
      carrier: data.selectedShippingRate?.provider ?? null,
      deliveryMethod: data.deliveryMethod,
      email: data.email,
      id: orderId,
      name: data.name,
      notes: data.selectedShippingRate
        ? `Selected shipping: ${data.selectedShippingRate.provider} ${data.selectedShippingRate.servicelevelName} (${data.selectedShippingRate.objectId})`
        : null,
      orderNumber,
      phone: data.phone ?? null,
      shippingAddress: data.shippingAddress
        ? JSON.stringify(data.shippingAddress)
        : null,
      shippingCost,
      shippoShipmentId: data.selectedShippingRate?.shipmentObjectId ?? null,
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

      // If it is a workshop product, automatically register the user for it
      if (item.product.categoryId === "cat-workshops" && userId) {
        const existingReg = await db.query.eventRegistrations.findFirst({
          where: and(
            eq(eventRegistrations.eventId, item.productId),
            eq(eventRegistrations.userId, userId)
          ),
        });

        if (existingReg) {
          await db
            .update(eventRegistrations)
            .set({ paymentStatus: "paid" })
            .where(eq(eventRegistrations.id, existingReg.id));
        } else {
          await db.insert(eventRegistrations).values({
            eventId: item.productId,
            id: crypto.randomUUID(),
            paymentStatus: "paid",
            status: "registered",
            userId,
          });
        }
      }
    }

    // Clear DB cart for logged-in users
    if (userId) {
      await db.delete(cartItems).where(eq(cartItems.userId, userId));
    }

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
