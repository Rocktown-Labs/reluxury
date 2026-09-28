import { createDb, readBusinessContact } from "@reluxury/db";
import {
  products,
  productImages,
  orders,
  orderItems,
  events,
  alterationBookings,
  promotions,
  user,
  storeSettings,
  shifts,
  categories,
  cartItems,
} from "@reluxury/db/schema";
import { env } from "@reluxury/env/server";
import {
  EMAIL_FROM,
  sendViaResend,
  tailoringStatusHtml,
} from "@reluxury/transactional";
import { createServerFn } from "@tanstack/react-start";
import {
  eq,
  desc,
  count,
  sql,
  isNull,
  ne,
  or,
  and,
  gte,
  inArray,
} from "drizzle-orm";
import { z } from "zod";

import { auditAction } from "@/lib/audit";
import { requireDb } from "@/lib/db";
import type { AppDb } from "@/lib/db";
import {
  LOW_STOCK_THRESHOLD_KEY,
  readLowStockThreshold,
} from "@/lib/inventory";
import { shippo } from "@/lib/shippo";
import { shiftCoversCentralDay } from "@/lib/shifts";
import { offShiftWarning } from "@/lib/shift-warnings";
import { isFullAccess, requireStaffPermission } from "@/lib/staff-auth";
import { authMiddleware } from "@/middleware/auth";

import { WORKSHOP_PRODUCT_CATEGORY_ID } from "./store";

const catalogProductFilter = or(
  isNull(products.categoryId),
  ne(products.categoryId, WORKSHOP_PRODUCT_CATEGORY_ID)
);

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const SHIPPO_API_KEY_SETTING = "shippo_api_key";

function decodeBase64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.codePointAt(i);
  }
  return bytes;
}

function toSafeFileName(name: string): string {
  return name.toLowerCase().replaceAll(/[^a-z0-9.\-_]/g, "-");
}

async function ensureWorkshopProductCategory(db: ReturnType<typeof createDb>) {
  const existing = await db.query.categories.findFirst({
    where: eq(categories.id, WORKSHOP_PRODUCT_CATEGORY_ID),
  });

  if (existing) {
    return;
  }

  await db.insert(categories).values({
    description: "Cart backing records for ReLUXURY workshops and classes.",
    id: WORKSHOP_PRODUCT_CATEGORY_ID,
    isActive: false,
    name: "Workshops",
    slug: "workshops",
    sortOrder: 99,
  });
}

async function syncWorkshopToCartProduct(
  db: ReturnType<typeof createDb>,
  event: typeof events.$inferSelect
) {
  await ensureWorkshopProductCategory(db);

  const productValues = {
    brand: "ReLUXURY Studio",
    categoryId: WORKSHOP_PRODUCT_CATEGORY_ID,
    colors: JSON.stringify(["Workshop"]),
    condition: "new" as const,
    description: event.description ?? "",
    featured: false,
    gender: "unisex" as const,
    isActive: event.isActive,
    price: event.price,
    quantity: event.capacity ?? 999,
    sizes: JSON.stringify(["Registration"]),
    slug: `event-${event.slug}`,
    title: event.title,
  };

  const existingProduct = await db.query.products.findFirst({
    where: eq(products.id, event.id),
  });

  if (existingProduct) {
    await db
      .update(products)
      .set(productValues)
      .where(eq(products.id, event.id));
  } else {
    await db.insert(products).values({
      id: event.id,
      ...productValues,
    });
  }

  if (!event.imageUrl) {
    return;
  }

  const existingImage = await db.query.productImages.findFirst({
    where: eq(productImages.productId, event.id),
  });

  if (existingImage) {
    await db
      .update(productImages)
      .set({ alt: event.title, url: event.imageUrl })
      .where(eq(productImages.id, existingImage.id));
    return;
  }

  await db.insert(productImages).values({
    alt: event.title,
    id: crypto.randomUUID(),
    isPrimary: true,
    productId: event.id,
    sortOrder: 0,
    url: event.imageUrl,
  });
}

// Products Admin
export const adminGetProducts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    requireStaffPermission(context, "products.manage");
    const db = createDb();
    return db.query.products.findMany({
      orderBy: [desc(products.createdAt)],
      where: catalogProductFilter,
      with: {
        category: true,
        images: {
          limit: 1,
          orderBy: [productImages.sortOrder],
        },
      },
    });
  });

export const adminCreateProduct = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      brand: z.string().optional(),
      categoryId: z.string().optional(),
      colors: z.array(z.string()).optional(),
      condition: z.enum(["new", "like_new", "excellent", "good", "fair"]),
      description: z.string().optional(),
      featured: z.boolean().default(false),
      gender: z.enum(["women", "men", "unisex"]),
      imageUrls: z.array(z.string()).optional(),
      isActive: z.boolean().default(true),
      material: z.string().optional(),
      price: z.number(),
      quantity: z.number().default(1),
      salePrice: z.number().optional(),
      sizes: z.array(z.string()).optional(),
      sku: z.string().optional(),
      slug: z.string(),
      tags: z.array(z.string()).optional(),
      title: z.string(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "products.manage");
    const db = createDb();
    const id = crypto.randomUUID();

    await db.insert(products).values({
      brand: data.brand,
      categoryId: data.categoryId,
      colors: data.colors ? JSON.stringify(data.colors) : null,
      condition: data.condition,
      description: data.description,
      featured: data.featured,
      gender: data.gender,
      id,
      isActive: data.isActive,
      material: data.material,
      price: data.price,
      quantity: data.quantity,
      salePrice: data.salePrice,
      sizes: data.sizes ? JSON.stringify(data.sizes) : null,
      sku: data.sku,
      slug: data.slug,
      tags: data.tags ? JSON.stringify(data.tags) : null,
      title: data.title,
    });

    if (data.imageUrls && data.imageUrls.length > 0) {
      for (let i = 0; i < data.imageUrls.length; i += 1) {
        await db.insert(productImages).values({
          id: crypto.randomUUID(),
          isPrimary: i === 0,
          productId: id,
          sortOrder: i,
          url: data.imageUrls[i],
        });
      }
    }

    return { id };
  });

export const adminUpdateProduct = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      brand: z.string().optional().nullable(),
      categoryId: z.string().optional().nullable(),
      colors: z.array(z.string()).optional(),
      condition: z
        .enum(["new", "like_new", "excellent", "good", "fair"])
        .optional(),
      description: z.string().optional().nullable(),
      featured: z.boolean().optional(),
      gender: z.enum(["women", "men", "unisex"]).optional(),
      id: z.string(),
      isActive: z.boolean().optional(),
      material: z.string().optional().nullable(),
      price: z.number().optional(),
      quantity: z.number().optional(),
      salePrice: z.number().optional().nullable(),
      sizes: z.array(z.string()).optional(),
      sku: z.string().optional().nullable(),
      tags: z.array(z.string()).optional(),
      title: z.string().optional(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "products.manage");
    const db = createDb();
    const { id, ...updateData } = data;

    const update: Record<string, unknown> = {};
    if (updateData.title !== undefined) {
      update.title = updateData.title;
    }
    if (updateData.description !== undefined) {
      update.description = updateData.description;
    }
    if (updateData.price !== undefined) {
      update.price = updateData.price;
    }
    if (updateData.salePrice !== undefined) {
      update.salePrice = updateData.salePrice;
    }
    if (updateData.categoryId !== undefined) {
      update.categoryId = updateData.categoryId;
    }
    if (updateData.brand !== undefined) {
      update.brand = updateData.brand;
    }
    if (updateData.condition !== undefined) {
      update.condition = updateData.condition;
    }
    if (updateData.gender !== undefined) {
      update.gender = updateData.gender;
    }
    if (updateData.sizes !== undefined) {
      update.sizes = JSON.stringify(updateData.sizes);
    }
    if (updateData.colors !== undefined) {
      update.colors = JSON.stringify(updateData.colors);
    }
    if (updateData.material !== undefined) {
      update.material = updateData.material;
    }
    if (updateData.quantity !== undefined) {
      update.quantity = updateData.quantity;
    }
    if (updateData.sku !== undefined) {
      update.sku = updateData.sku;
    }
    if (updateData.featured !== undefined) {
      update.featured = updateData.featured;
    }
    if (updateData.isActive !== undefined) {
      update.isActive = updateData.isActive;
    }
    if (updateData.tags !== undefined) {
      update.tags = JSON.stringify(updateData.tags);
    }

    await db.update(products).set(update).where(eq(products.id, id));
    return { success: true };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .inputValidator(z.string())
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    requireStaffPermission(context, "products.manage");
    const db = createDb();
    await db.delete(productImages).where(eq(productImages.productId, id));
    await db.delete(products).where(eq(products.id, id));
    await auditAction({ actorUserId: context.session?.user.id, action: "product.deleted", entityId: id ?? undefined, entityType: "product" });
    return { success: true };
  });

export const adminBulkDeleteProducts = createServerFn({ method: "POST" })
  .inputValidator(z.array(z.string()).min(1).max(200))
  .middleware([authMiddleware])
  .handler(async ({ context, data: ids }) => {
    requireStaffPermission(context, "products.manage");
    const db = createDb();
    try {
      await db
        .delete(productImages)
        .where(inArray(productImages.productId, ids));
      await db.delete(products).where(inArray(products.id, ids));
    } catch {
      throw new Error(
        "Some products are linked to orders and cannot be deleted"
      );
    }
    await auditAction({ actorUserId: context.session?.user.id, action: "product.bulk_deleted", entityType: "product", details: { count: ids.length } });
    return { deleted: ids.length };
  });

export const adminUploadProductImage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      base64: z.string().min(1),
      contentType: z.string().min(1),
      fileName: z.string().min(1),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "products.manage");

    if (!IMAGE_MIME_TYPES.has(data.contentType)) {
      throw new Error("Unsupported image format");
    }

    const bytes = decodeBase64ToBytes(data.base64);
    if (bytes.byteLength > MAX_UPLOAD_BYTES) {
      throw new Error("Image exceeds 10MB upload limit");
    }

    const r2 = env.PRODUCT_IMAGES;
    const publicBase = env.PRODUCT_IMAGES_PUBLIC_URL;

    if (!r2 || !publicBase) {
      const dataUrl = `data:${data.contentType};base64,${data.base64}`;
      return { url: dataUrl };
    }

    const extension = data.fileName.split(".").pop()?.toLowerCase();
    const key = `products/${Date.now()}-${crypto.randomUUID()}-${toSafeFileName(extension ? data.fileName : `${data.fileName}.jpg`)}`;

    await r2.put(key, bytes, {
      httpMetadata: {
        contentType: data.contentType,
      },
    });

    return {
      key,
      url: `${publicBase.replace(/\/+$/, "")}/${key}`,
    };
  });

export const adminDeleteProductImage = createServerFn({ method: "POST" })
  .inputValidator(z.string())
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    requireStaffPermission(context, "products.manage");
    const db = createDb();
    const image = await db.query.productImages.findFirst({
      where: eq(productImages.id, id),
    });
    if (!image) {
      throw new Error("Image not found");
    }
    if (image.url.startsWith("data:")) {
      await db.delete(productImages).where(eq(productImages.id, id));
      return { success: true };
    }
    const r2 = env.PRODUCT_IMAGES;
    if (r2) {
      try {
        const url = new URL(image.url);
        const key = url.pathname.slice(1);
        await r2.delete(key);
      } catch {
        // ignore R2 delete errors
      }
    }
    await db.delete(productImages).where(eq(productImages.id, id));
    return { success: true };
  });

export const adminSetPrimaryImage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      imageId: z.string(),
      productId: z.string(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "products.manage");
    const db = createDb();
    await db
      .update(productImages)
      .set({ isPrimary: false })
      .where(eq(productImages.productId, data.productId));
    await db
      .update(productImages)
      .set({ isPrimary: true })
      .where(eq(productImages.id, data.imageId));
    return { success: true };
  });

export const adminAddProductImages = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      productId: z.string(),
      urls: z.array(z.string()),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "products.manage");
    const db = createDb();
    const existingCount = await db
      .select({ count: count() })
      .from(productImages)
      .where(eq(productImages.productId, data.productId));
    const startIndex = existingCount[0]?.count ?? 0;

    for (let i = 0; i < data.urls.length; i += 1) {
      await db.insert(productImages).values({
        id: crypto.randomUUID(),
        isPrimary: startIndex === 0 && i === 0,
        productId: data.productId,
        sortOrder: startIndex + i,
        url: data.urls[i],
      });
    }
    return { success: true };
  });

// Orders Admin
export const adminGetOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    requireStaffPermission(context, "orders.manage");
    const db = createDb();
    return db.query.orders.findMany({
      orderBy: [desc(orders.createdAt)],
      with: {
        items: true,
        user: true,
      },
    });
  });

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminNotes: z.string().optional(),
      id: z.string(),
      status: z.enum([
        "pending",
        "confirmed",
        "preparing",
        "ready_for_pickup",
        "shipped",
        "completed",
        "cancelled",
      ]),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "orders.manage");
    const db = createDb();
    await db
      .update(orders)
      .set({ adminNotes: data.adminNotes ?? undefined, status: data.status })
      .where(eq(orders.id, data.id));
    await auditAction({ actorUserId: context.session?.user.id, action: "order.status_changed", entityId: data.id ?? undefined, entityType: "order" });
    return { success: true };
  });

export const adminDeleteOrder = createServerFn({ method: "POST" })
  .inputValidator(z.string())
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    requireStaffPermission(context, "orders.manage");
    const db = createDb();
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });
    if (!order) {
      throw new Error("Order not found");
    }
    if (!["pending", "cancelled"].includes(order.status)) {
      throw new Error("Only pending or cancelled orders can be deleted");
    }
    await db.delete(orderItems).where(eq(orderItems.orderId, id));
    await db.delete(orders).where(eq(orders.id, id));
    await auditAction({ actorUserId: context.session?.user.id, action: "order.deleted", entityId: id ?? undefined, entityType: "order" });
    return { success: true };
  });

// Events Admin
export const adminGetEvents = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    requireStaffPermission(context, "workshops.manage");
    const db = createDb();
    return db.query.events.findMany({
      orderBy: [desc(events.startDate)],
      with: {
        registrations: {
          with: {
            user: true,
          },
        },
      },
    });
  });

export const adminCreateEvent = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      capacity: z.number().optional(),
      description: z.string().optional(),
      endDate: z.string().datetime().optional(),
      imageUrl: z.string().optional(),
      instructor: z.string().optional(),
      location: z.string().optional(),
      price: z.number().default(0),
      slug: z.string(),
      startDate: z.string().datetime(),
      title: z.string(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "workshops.manage");
    const db = createDb();
    const id = crypto.randomUUID();
    const instructor =
      data.instructor?.trim() ||
      (await defaultEventInstructor(db, new Date(data.startDate)));
    await db.insert(events).values({
      id,
      ...data,
      endDate: data.endDate ? new Date(data.endDate) : null,
      instructor: instructor ?? undefined,
      isActive: true,
    });
    const event = await db.query.events.findFirst({
      where: eq(events.id, id),
    });
    if (event) {
      await syncWorkshopToCartProduct(db, event);
    }
    await auditAction({ actorUserId: context.session?.user.id, action: "event.created", entityId: id, entityType: "event" });
    return { id };
  });

export const adminUpdateEvent = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      capacity: z.number().optional().nullable(),
      description: z.string().optional().nullable(),
      endDate: z.string().datetime().optional().nullable(),
      id: z.string(),
      imageUrl: z.string().optional().nullable(),
      instructor: z.string().optional().nullable(),
      isActive: z.boolean().optional(),
      location: z.string().optional().nullable(),
      price: z.number().optional(),
      startDate: z.string().datetime().optional(),
      title: z.string().optional(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "workshops.manage");
    const db = createDb();
    const { id, ...updateData } = data;
    let endDate: Date | null | undefined;
    if (updateData.endDate === null) {
      endDate = null;
    } else if (updateData.endDate) {
      endDate = new Date(updateData.endDate);
    }

    const update = {
      ...updateData,
      endDate,
      startDate: updateData.startDate
        ? new Date(updateData.startDate)
        : undefined,
    };
    const instructorEmpty =
      update.instructor === null ||
      update.instructor === undefined ||
      update.instructor.trim() === "";
    if (instructorEmpty) {
      let startForDefault: Date | null = update.startDate ?? null;
      if (!startForDefault) {
        const existing = await db.query.events.findFirst({
          where: eq(events.id, id),
        });
        startForDefault = existing?.startDate ?? null;
      }
      if (startForDefault) {
        update.instructor =
          (await defaultEventInstructor(db, new Date(startForDefault))) ??
          update.instructor;
      }
    }
    await db.update(events).set(update).where(eq(events.id, id));
    const event = await db.query.events.findFirst({
      where: eq(events.id, id),
    });
    if (event) {
      await syncWorkshopToCartProduct(db, event);
    }
    await auditAction({ actorUserId: context.session?.user.id, action: "event.updated", entityId: data.id ?? undefined, entityType: "event" });
    return { success: true };
  });

export const adminDeleteEvent = createServerFn({ method: "POST" })
  .inputValidator(z.string())
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    requireStaffPermission(context, "workshops.manage");
    const db = createDb();
    await db.delete(productImages).where(eq(productImages.productId, id));
    await db.delete(products).where(eq(products.id, id));
    await db.delete(events).where(eq(events.id, id));
    await auditAction({ actorUserId: context.session?.user.id, action: "event.deleted", entityId: id ?? undefined, entityType: "event" });
    return { success: true };
  });

export const adminBulkDeleteEvents = createServerFn({ method: "POST" })
  .inputValidator(z.array(z.string()).min(1).max(200))
  .middleware([authMiddleware])
  .handler(async ({ context, data: ids }) => {
    requireStaffPermission(context, "workshops.manage");
    const db = createDb();
    await db.delete(productImages).where(inArray(productImages.productId, ids));
    await db.delete(products).where(inArray(products.id, ids));
    await db.delete(events).where(inArray(events.id, ids));
    await auditAction({ actorUserId: context.session?.user.id, action: "event.bulk_deleted", entityType: "event", details: { count: ids.length } });
    return { deleted: ids.length };
  });

// Alterations Admin
export const adminGetAlterations = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    requireStaffPermission(context, "alterations.manage");
    const db = createDb();
    return db.query.alterationBookings.findMany({
      orderBy: [desc(alterationBookings.createdAt)],
      with: {
        user: true,
      },
    });
  });

export const adminUpdateAlteration = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminNotes: z.string().optional().nullable(),
      id: z.string(),
      price: z.number().optional().nullable(),
      status: z
        .enum(["pending", "approved", "in_progress", "completed", "cancelled"])
        .optional(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "alterations.manage");
    const db = createDb();
    const { id, ...update } = data;
    await db
      .update(alterationBookings)
      .set(update)
      .where(eq(alterationBookings.id, id));
    if (data.status) {
      const booking = await db.query.alterationBookings.findFirst({
        where: eq(alterationBookings.id, id),
        with: { user: true },
      });
      if (booking?.user?.email) {
        try {
          const business = await readBusinessContact(db);
          await sendViaResend({
            apiKey: env.RESEND_API_KEY ?? "",
            from: EMAIL_FROM.tailoring,
            html: tailoringStatusHtml({
              business,
              customerName: booking.user.name ?? "there",
              serviceType: booking.serviceType,
              status: data.status.replaceAll("_", " "),
            }),
            subject: `Tailoring update — ${booking.serviceType} ${data.status.replaceAll("_", " ")}`,
            to: booking.user.email,
          });
        } catch (error) {
          console.error("Tailoring status email failed", error);
        }
      }
    }
    await auditAction({ actorUserId: context.session?.user.id, action: "alteration.updated", entityId: data.id ?? undefined, entityType: "alteration" });
    return { success: true };
  });

async function defaultEventInstructor(
  db: ReturnType<typeof createDb>,
  startDate: Date
): Promise<string | null> {
  if (!db) {
    return null;
  }
  const database: AppDb = db as AppDb;
  const nearby = await database.query.shifts.findMany({
    where: and(
      gte(shifts.startAt, new Date(startDate.getTime() - 24 * 60 * 60 * 1000)),
      eq(shifts.status, "scheduled")
    ),
    with: { staff: { with: { user: true } } },
  });
  let earliest: (typeof nearby)[number] | null = null;
  for (const shift of nearby) {
    if (!shiftCoversCentralDay(shift, startDate)) {
      continue;
    }
    const name = shift.staff?.alias || shift.staff?.user?.name;
    if (!name) {
      continue;
    }
    if (!earliest || +new Date(shift.startAt) < +new Date(earliest.startAt)) {
      earliest = shift;
    }
  }
  if (!earliest?.staff) {
    return null;
  }
  return earliest.staff.alias || earliest.staff.user?.name || null;
}

export const adminClaimOrder = createServerFn({ method: "POST" })
  .inputValidator(z.string())
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    requireStaffPermission(context, "orders.manage");
    const db = requireDb(createDb());
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });
    if (!order) {
      throw new Error("Order not found");
    }
    if (order.claimedBy && order.claimedBy !== context.session?.user.id) {
      throw new Error(
        `Already claimed by ${order.claimedByName ?? "another team member"}`
      );
    }
    const name = context.session?.user.name ?? "Team member";
    await db
      .update(orders)
      .set({ claimedBy: context.session?.user.id ?? null, claimedByName: name })
      .where(eq(orders.id, id));
    await auditAction({
      action: "order.claimed",
      actorUserId: context.session?.user.id,
      entityId: id,
      entityType: "order",
    });
    const warning = await offShiftWarning(db, {
      isFull: isFullAccess(context.session),
      userId: context.session?.user.id ?? "",
    });
    return { success: true, warning };
  });

export const adminUnclaimOrder = createServerFn({ method: "POST" })
  .inputValidator(z.string())
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    requireStaffPermission(context, "orders.manage");
    const db = requireDb(createDb());
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });
    if (!order) {
      throw new Error("Order not found");
    }
    if (
      order.claimedBy &&
      order.claimedBy !== context.session?.user.id &&
      !isFullAccess(context.session)
    ) {
      throw new Error("Only the claimer or an admin can release this order");
    }
    await db
      .update(orders)
      .set({ claimedBy: null, claimedByName: null })
      .where(eq(orders.id, id));
    await auditAction({
      action: "order.unclaimed",
      actorUserId: context.session?.user.id,
      entityId: id,
      entityType: "order",
    });
    return { success: true };
  });

export const adminClaimAlteration = createServerFn({ method: "POST" })
  .inputValidator(z.string())
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    requireStaffPermission(context, "alterations.manage");
    const db = requireDb(createDb());
    const booking = await db.query.alterationBookings.findFirst({
      where: eq(alterationBookings.id, id),
    });
    if (!booking) {
      throw new Error("Booking not found");
    }
    if (
      booking.assignedUserId &&
      booking.assignedUserId !== context.session?.user.id
    ) {
      throw new Error(
        `Already claimed by ${booking.assignedUserName ?? "another tailor"}`
      );
    }
    const name = context.session?.user.name ?? "Team member";
    await db
      .update(alterationBookings)
      .set({ assignedUserId: context.session?.user.id ?? null, assignedUserName: name })
      .where(eq(alterationBookings.id, id));
    await auditAction({
      action: "alteration.claimed",
      actorUserId: context.session?.user.id,
      entityId: id,
      entityType: "alteration",
    });
    const warning = await offShiftWarning(db, {
      isFull: isFullAccess(context.session),
      userId: context.session?.user.id ?? "",
    });
    return { success: true, warning };
  });

export const adminUnclaimAlteration = createServerFn({ method: "POST" })
  .inputValidator(z.string())
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    requireStaffPermission(context, "alterations.manage");
    const db = requireDb(createDb());
    const booking = await db.query.alterationBookings.findFirst({
      where: eq(alterationBookings.id, id),
    });
    if (!booking) {
      throw new Error("Booking not found");
    }
    if (
      booking.assignedUserId &&
      booking.assignedUserId !== context.session?.user.id &&
      !isFullAccess(context.session)
    ) {
      throw new Error("Only the claimer or an admin can release this booking");
    }
    await db
      .update(alterationBookings)
      .set({ assignedUserId: null, assignedUserName: null })
      .where(eq(alterationBookings.id, id));
    await auditAction({
      action: "alteration.unclaimed",
      actorUserId: context.session?.user.id,
      entityId: id,
      entityType: "alteration",
    });
    return { success: true };
  });

// Promotions Admin
export const adminGetPromotions = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    requireStaffPermission(context, "marketing.manage");
    const db = createDb();
    return db.select().from(promotions).orderBy(desc(promotions.createdAt));
  });

export const adminCreatePromotion = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      buttonLink: z.string().optional(),
      buttonText: z.string().optional(),
      description: z.string().optional(),
      displayLocation: z.enum(["homepage", "shop", "both"]).default("both"),
      imageUrl: z.string().optional(),
      sortOrder: z.number().default(0),
      subtitle: z.string().optional(),
      title: z.string(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "marketing.manage");
    const db = createDb();
    const id = crypto.randomUUID();
    await db.insert(promotions).values({ id, ...data, isActive: true });
    return { id };
  });

export const adminUpdatePromotion = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      buttonLink: z.string().optional().nullable(),
      buttonText: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      displayLocation: z.enum(["homepage", "shop", "both"]).optional(),
      id: z.string(),
      imageUrl: z.string().optional().nullable(),
      isActive: z.boolean().optional(),
      sortOrder: z.number().optional(),
      subtitle: z.string().optional().nullable(),
      title: z.string().optional(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "marketing.manage");
    const db = createDb();
    const { id, ...update } = data;
    await db.update(promotions).set(update).where(eq(promotions.id, id));
    return { success: true };
  });

export const adminDeletePromotion = createServerFn({ method: "POST" })
  .inputValidator(z.string())
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    requireStaffPermission(context, "marketing.manage");
    const db = createDb();
    await db.delete(promotions).where(eq(promotions.id, id));
    await auditAction({ actorUserId: context.session?.user.id, action: "promotion.deleted", entityId: id ?? undefined, entityType: "promotion" });
    return { success: true };
  });

// Stats
export const adminGetStats = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    requireStaffPermission(context, "dashboard.view");
    const db = createDb();

    const [
      orderCount,
      totalRevenue,
      productCount,
      eventCount,
      pendingOrders,
      pendingAlterations,
      abandonedCartRows,
      lowStockThreshold,
    ] = await Promise.all([
      db.select({ count: count() }).from(orders),
      db
        .select({ total: sql<number>`sum(${orders.total})` })
        .from(orders)
        .where(eq(orders.status, "completed")),
      db.select({ count: count() }).from(products).where(catalogProductFilter),
      db
        .select({ count: count() })
        .from(events)
        .where(
          and(eq(events.isActive, true), gte(events.startDate, new Date()))
        ),
      db
        .select({ count: count() })
        .from(orders)
        .where(eq(orders.status, "pending")),
      db
        .select({ count: count() })
        .from(alterationBookings)
        .where(eq(alterationBookings.status, "pending")),
      db
        .select({
          count: sql<number>`count(distinct ${cartItems.userId})`,
          total: sql<number>`sum(coalesce(${products.salePrice}, ${products.price}) * ${cartItems.quantity})`,
        })
        .from(cartItems)
        .innerJoin(products, eq(cartItems.productId, products.id)),
      readLowStockThreshold(db),
    ]);

    return {
      abandonedCartValue: abandonedCartRows[0]?.total ?? 0,
      abandonedCarts: abandonedCartRows[0]?.count ?? 0,
      activeEvents: eventCount[0]?.count ?? 0,
      lowStockThreshold,
      pendingAlterations: pendingAlterations[0]?.count ?? 0,
      pendingOrders: pendingOrders[0]?.count ?? 0,
      totalOrders: orderCount[0]?.count ?? 0,
      totalProducts: productCount[0]?.count ?? 0,
      totalRevenue: totalRevenue[0]?.total ?? 0,
    };
  });

export const adminGetOrderById = createServerFn({ method: "GET" })
  .inputValidator(z.string())
  .middleware([authMiddleware])
  .handler(async ({ context, data: orderId }) => {
    requireStaffPermission(context, "orders.manage");
    const db = createDb();
    return db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: true,
        user: true,
      },
    });
  });

export const adminGetAlterationById = createServerFn({ method: "GET" })
  .inputValidator(z.string())
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    requireStaffPermission(context, "alterations.manage");
    const db = createDb();
    return db.query.alterationBookings.findFirst({
      where: eq(alterationBookings.id, id),
      with: {
        user: true,
      },
    });
  });

export const adminGetEventById = createServerFn({ method: "GET" })
  .inputValidator(z.string())
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    requireStaffPermission(context, "workshops.manage");
    const db = createDb();
    return db.query.events.findFirst({
      where: eq(events.id, id),
      with: {
        registrations: {
          with: {
            user: true,
          },
        },
      },
    });
  });

export const adminGetCustomers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    requireStaffPermission(context, "customers.view");
    const db = createDb();
    return db.query.user.findMany({
      orderBy: [desc(user.createdAt)],
      with: {
        alterationBookings: true,
        cartItems: {
          with: {
            product: {
              with: {
                images: {
                  limit: 1,
                },
              },
            },
          },
        },
        eventRegistrations: {
          with: {
            event: true,
          },
        },
        orders: true,
      },
    });
  });

export const adminGetAbandonedCarts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    requireStaffPermission(context, "orders.manage");
    const db = createDb();
    const rows = await db.query.user.findMany({
      orderBy: [desc(user.updatedAt)],
      with: {
        cartItems: {
          with: {
            product: {
              with: {
                images: {
                  limit: 1,
                },
              },
            },
          },
        },
      },
    });

    return rows
      .filter((customer) => customer.cartItems.length > 0)
      .map((customer) => {
        let total = 0;
        let itemCount = 0;
        let lastUpdatedAt = customer.cartItems[0]?.updatedAt ?? new Date(0);
        for (const item of customer.cartItems) {
          const price = item.product.salePrice ?? item.product.price;
          total += price * item.quantity;
          itemCount += item.quantity;
          if (item.updatedAt > lastUpdatedAt) {
            lastUpdatedAt = item.updatedAt;
          }
        }

        return {
          customer,
          itemCount,
          items: customer.cartItems,
          lastUpdatedAt,
          total,
        };
      })
      .toSorted(
        (a, b) => b.lastUpdatedAt.getTime() - a.lastUpdatedAt.getTime()
      );
  });

export const adminCreateAlteration = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminNotes: z.string().optional().nullable(),
      itemDescription: z.string().min(1),
      notes: z.string().optional(),
      preferredDate: z.string().datetime(),
      preferredTime: z.string().optional(),
      price: z.number().optional().nullable(),
      serviceType: z.string().min(1),
      status: z
        .enum(["pending", "approved", "in_progress", "completed", "cancelled"])
        .default("pending"),
      userId: z.string(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "alterations.manage");
    const db = createDb();
    const id = crypto.randomUUID();
    await db.insert(alterationBookings).values({
      adminNotes: data.adminNotes ?? null,
      id,
      itemDescription: data.itemDescription,
      notes: data.notes ?? null,
      preferredDate: new Date(data.preferredDate),
      preferredTime: data.preferredTime ?? null,
      price: data.price ?? null,
      serviceType: data.serviceType,
      status: data.status,
      userId: data.userId,
    });
    return { id, success: true };
  });

export const adminUpdateFooterContact = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      address: z.string().min(1),
      businessName: z.string().optional(),
      email: z.string().optional(),
      hours: z.string().min(1),
      phone: z.string().min(1),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "settings.manage");
    const db = createDb();
    const existing = await db.query.storeSettings.findFirst({
      where: eq(storeSettings.key, "footer_contact"),
    });

    const current = (() => {
      try {
        return existing ? JSON.parse(existing.value) : {};
      } catch {
        return {};
      }
    })();
    const jsonValue = JSON.stringify({ ...current, ...data });

    if (existing) {
      await db
        .update(storeSettings)
        .set({ value: jsonValue })
        .where(eq(storeSettings.key, "footer_contact"));
    } else {
      await db.insert(storeSettings).values({
        id: crypto.randomUUID(),
        key: "footer_contact",
        value: jsonValue,
      });
    }

    return { success: true };
  });

const BUSINESS_SETUP_DONE_KEY = "business_info_confirmed";

export const adminGetBusinessSetupState = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    requireStaffPermission(context, "settings.manage");
    const db = createDb();
    const setting = await db.query.storeSettings.findFirst({
      where: eq(storeSettings.key, BUSINESS_SETUP_DONE_KEY),
    });
    return { done: setting?.value === "1" };
  });

export const adminSetBusinessSetupDone = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    requireStaffPermission(context, "settings.manage");
    const db = createDb();
    const existing = await db.query.storeSettings.findFirst({
      where: eq(storeSettings.key, BUSINESS_SETUP_DONE_KEY),
    });
    if (existing) {
      await db
        .update(storeSettings)
        .set({ value: "1" })
        .where(eq(storeSettings.key, BUSINESS_SETUP_DONE_KEY));
    } else {
      await db.insert(storeSettings).values({
        id: crypto.randomUUID(),
        key: BUSINESS_SETUP_DONE_KEY,
        value: "1",
      });
    }
    return { success: true };
  });

export const adminGetShippoSettings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    requireStaffPermission(context, "settings.manage");
    const db = createDb();
    const setting = await db.query.storeSettings.findFirst({
      where: eq(storeSettings.key, SHIPPO_API_KEY_SETTING),
    });
    const value = setting?.value ?? "";
    return {
      configured: value.length > 0,
      maskedKey: value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "",
    };
  });

export const adminUpdateShippoApiKey = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      apiKey: z.string().min(1),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "settings.manage");
    const db = createDb();
    const apiKey = data.apiKey.trim();
    if (!apiKey) {
      throw new Error("Shippo API key is required");
    }

    const existing = await db.query.storeSettings.findFirst({
      where: eq(storeSettings.key, SHIPPO_API_KEY_SETTING),
    });

    if (existing) {
      await db
        .update(storeSettings)
        .set({ value: apiKey })
        .where(eq(storeSettings.key, SHIPPO_API_KEY_SETTING));
    } else {
      await db.insert(storeSettings).values({
        id: crypto.randomUUID(),
        key: SHIPPO_API_KEY_SETTING,
        value: apiKey,
      });
    }

    return { success: true };
  });

export const adminClearShippoApiKey = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    requireStaffPermission(context, "settings.manage");
    const db = createDb();
    await db
      .delete(storeSettings)
      .where(eq(storeSettings.key, SHIPPO_API_KEY_SETTING));
    return { success: true };
  });

export const adminGetLowStockThreshold = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    requireStaffPermission(context, "dashboard.view");
    const db = requireDb(createDb());
    return { threshold: await readLowStockThreshold(db) };
  });

export const adminUpdateLowStockThreshold = createServerFn({ method: "POST" })
  .inputValidator(z.object({ threshold: z.number().int().min(0).max(1000) }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "settings.manage");
    const db = requireDb(createDb());
    const value = String(data.threshold);
    const existing = await db.query.storeSettings.findFirst({
      where: eq(storeSettings.key, LOW_STOCK_THRESHOLD_KEY),
    });
    if (existing) {
      await db
        .update(storeSettings)
        .set({ value })
        .where(eq(storeSettings.key, LOW_STOCK_THRESHOLD_KEY));
    } else {
      await db.insert(storeSettings).values({
        id: crypto.randomUUID(),
        key: LOW_STOCK_THRESHOLD_KEY,
        value,
      });
    }
    return { success: true, threshold: data.threshold };
  });

export const adminCreateCategory = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      description: z.string().optional(),
      isActive: z.boolean().default(true),
      name: z.string().min(1),
      sortOrder: z.number().default(0),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "products.manage");
    const db = createDb();
    const id = `cat-${crypto.randomUUID().slice(0, 8)}`;
    const slug = data.name.toLowerCase().replaceAll(/[^a-z0-9-]/g, "-");

    await db.insert(categories).values({
      description: data.description || null,
      id,
      isActive: data.isActive,
      name: data.name,
      slug,
      sortOrder: data.sortOrder,
    });

    return { id, success: true };
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .inputValidator(z.string())
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    requireStaffPermission(context, "products.manage");
    const db = createDb();
    await db.delete(categories).where(eq(categories.id, id));
    await auditAction({ actorUserId: context.session?.user.id, action: "category.deleted", entityId: id ?? undefined, entityType: "category" });
    return { success: true };
  });

export const adminUpdateCategory = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      description: z.string().optional().nullable(),
      id: z.string(),
      isActive: z.boolean().optional(),
      name: z.string().min(1).optional(),
      sortOrder: z.number().optional(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "products.manage");
    const db = createDb();
    const { id, ...update } = data;
    await db.update(categories).set(update).where(eq(categories.id, id));
    return { success: true };
  });

// Shippo Fulfillment Pipeline
export const adminGetShippoRates = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      height: z.number().min(1),
      length: z.number().min(1),
      orderId: z.string(),
      weight: z.number().min(0.1),
      width: z.number().min(1),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "orders.manage");
    const db = createDb();

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, data.orderId),
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.deliveryMethod !== "shipping") {
      throw new Error("Order is not set for shipping");
    }

    if (!order.shippingAddress) {
      throw new Error("Order does not have a shipping address");
    }

    let shippingAddressObj: {
      address: string;
      city: string;
      email?: string;
      name: string;
      phone?: string;
      state: string;
      zip: string;
    };

    try {
      shippingAddressObj = JSON.parse(order.shippingAddress);
    } catch {
      throw new Error("Invalid shipping address format");
    }

    const toAddress = {
      city: shippingAddressObj.city,
      country: "US",
      email: order.email,
      name: shippingAddressObj.name,
      phone: order.phone || undefined,
      state: shippingAddressObj.state,
      street1: shippingAddressObj.address,
      zip: shippingAddressObj.zip,
    };

    const rates = await shippo.getRates(toAddress, {
      height: data.height,
      length: data.length,
      weight: data.weight,
      width: data.width,
    });

    return { rates };
  });

export const adminPurchaseShippoLabel = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      orderId: z.string(),
      rateObjectId: z.string(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "orders.manage");
    const db = createDb();

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, data.orderId),
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const transaction = await shippo.purchaseLabel(data.rateObjectId);

    if (transaction.status !== "SUCCESS") {
      throw new Error(
        `Failed to purchase label: ${transaction.messages.join(", ") || "Unknown error"}`
      );
    }

    const timestamp = new Date().toLocaleString();
    const notificationText = `[Notification] Email sent to ${order.email}: "Your order ${order.orderNumber} has shipped! Tracking number is ${transaction.trackingNumber} via USPS."`;
    const newNotes =
      `${order.adminNotes || ""}\n\n[${timestamp}] Shipped via USPS.\nTracking: ${transaction.trackingNumber}\nLabel URL: ${transaction.labelUrl}\n${notificationText}`.trim();

    await db
      .update(orders)
      .set({
        adminNotes: newNotes,
        carrier: "USPS",
        shippingLabelUrl: transaction.labelUrl,
        shippoTransactionId: transaction.objectId,
        status: "shipped",
        trackingNumber: transaction.trackingNumber,
      })
      .where(eq(orders.id, data.orderId));

    return { success: true, transaction };
  });

export const adminMarkReadyForPickup = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      orderId: z.string(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "orders.manage");
    const db = createDb();

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, data.orderId),
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.deliveryMethod !== "pickup") {
      throw new Error("Order is not set for in-store pickup");
    }

    const timestamp = new Date().toLocaleString();
    const notificationText = `[Notification] Email sent to ${order.email}: "Your order ${order.orderNumber} is ready for pickup in store! Please visit us at our boutique during business hours."`;
    const newNotes =
      `${order.adminNotes || ""}\n\n[${timestamp}] Marked ready for pickup.\n${notificationText}`.trim();

    await db
      .update(orders)
      .set({
        adminNotes: newNotes,
        status: "ready_for_pickup",
      })
      .where(eq(orders.id, data.orderId));

    return { success: true };
  });

export const adminRefundShippoLabel = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      orderId: z.string(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "orders.manage");
    const db = createDb();

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, data.orderId),
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (!order.shippoTransactionId) {
      throw new Error("No Shippo shipping label found for this order");
    }

    const refund = await shippo.refundLabel(order.shippoTransactionId);

    const timestamp = new Date().toLocaleString();
    const newNotes =
      `${order.adminNotes || ""}\n\n[${timestamp}] Requested shipping label refund (Status: ${refund.status}).\nStatus reverted to preparing.`.trim();

    await db
      .update(orders)
      .set({
        adminNotes: newNotes,
        carrier: null,
        shippingLabelUrl: null,
        shippoTransactionId: null,
        status: "preparing",
        trackingNumber: null,
      })
      .where(eq(orders.id, data.orderId));

    return { status: refund.status, success: true };
  });
