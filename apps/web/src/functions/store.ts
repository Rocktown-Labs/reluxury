import { createDb } from "@reluxury/db";
import {
  categories,
  events,
  productImages,
  products,
  promotions,
  storeSettings,
} from "@reluxury/db/schema";
import { createServerFn } from "@tanstack/react-start";
import {
  eq,
  desc,
  and,
  asc,
  like,
  sql,
  isNotNull,
  count,
  gte,
  lte,
} from "drizzle-orm";
import { z } from "zod";

export const getProductsByIds = createServerFn({ method: "POST" })
  .inputValidator(z.array(z.string()))
  .handler(async ({ data: ids }) => {
    const db = createDb();
    if (ids.length === 0) {
      return [];
    }
    return db.query.products.findMany({
      where: and(eq(products.isActive, true), sql`${products.id} IN ${ids}`),
      with: {
        category: true,
        images: {
          orderBy: [asc(productImages.sortOrder)],
        },
      },
    });
  });

export const getCategories = createServerFn({ method: "GET" }).handler(
  async () => {
    const db = createDb();
    return db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder));
  }
);

export const getFeaturedProducts = createServerFn({ method: "GET" }).handler(
  async () => {
    const db = createDb();
    return db.query.products.findMany({
      limit: 8,
      orderBy: [desc(products.createdAt)],
      where: and(
        eq(products.featured, true),
        eq(products.isActive, true),
        isNotNull(products.categoryId)
      ),
      with: {
        category: true,
        images: {
          limit: 1,
          orderBy: [asc(productImages.sortOrder)],
        },
      },
    });
  }
);

export const getNewArrivals = createServerFn({ method: "GET" }).handler(
  async () => {
    const db = createDb();
    return db.query.products.findMany({
      limit: 8,
      orderBy: [desc(products.createdAt)],
      where: eq(products.isActive, true),
      with: {
        category: true,
        images: {
          limit: 1,
          orderBy: [asc(productImages.sortOrder)],
        },
      },
    });
  }
);

export const getProducts = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      brand: z.string().optional(),
      category: z.string().optional(),
      condition: z.string().optional(),
      gender: z.string().optional(),
      limit: z.number().default(12),
      maxPrice: z.number().optional(),
      minPrice: z.number().optional(),
      page: z.number().default(1),
      search: z.string().optional(),
      sort: z.enum(["newest", "price_asc", "price_desc", "name"]).optional(),
    })
  )
  .handler(async ({ data }) => {
    const db = createDb();
    const conditions = [eq(products.isActive, true)];

    if (data.category) {
      conditions.push(eq(products.categoryId, data.category));
    } else {
      // Exclude workshops by default from standard product listings
      conditions.push(
        sql`${products.categoryId} IS NULL OR ${products.categoryId} != 'cat-workshops'`
      );
    }
    if (data.gender) {
      conditions.push(eq(products.gender, data.gender));
    }
    if (data.condition) {
      conditions.push(eq(products.condition, data.condition));
    }
    if (data.brand) {
      conditions.push(eq(products.brand, data.brand));
    }
    if (data.minPrice !== undefined) {
      conditions.push(gte(products.price, data.minPrice));
    }
    if (data.maxPrice !== undefined) {
      conditions.push(lte(products.price, data.maxPrice));
    }
    if (data.search) {
      conditions.push(like(products.title, `%${data.search}%`));
    }

    const whereClause = and(...conditions);

    const orderBy = (() => {
      switch (data.sort) {
        case "price_asc": {
          return [asc(products.price)];
        }
        case "price_desc": {
          return [desc(products.price)];
        }
        case "name": {
          return [asc(products.title)];
        }
        default: {
          return [desc(products.createdAt)];
        }
      }
    })();

    const offset = (data.page - 1) * data.limit;

    const [items, totalResult] = await Promise.all([
      db.query.products.findMany({
        limit: data.limit,
        offset,
        orderBy,
        where: whereClause,
        with: {
          category: true,
          images: {
            limit: 1,
            orderBy: [asc(productImages.sortOrder)],
          },
        },
      }),
      db.select({ count: count() }).from(products).where(whereClause),
    ]);

    return {
      items,
      limit: data.limit,
      page: data.page,
      total: totalResult[0]?.count ?? 0,
      totalPages: Math.ceil((totalResult[0]?.count ?? 0) / data.limit),
    };
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator(z.string())
  .handler(async ({ data: slug }) => {
    const db = createDb();
    return db.query.products.findFirst({
      where: and(eq(products.slug, slug), eq(products.isActive, true)),
      with: {
        category: true,
        images: {
          orderBy: [asc(productImages.sortOrder)],
        },
      },
    });
  });

export const getProductBrands = createServerFn({ method: "GET" }).handler(
  async () => {
    const db = createDb();
    const results = await db
      .select({ brand: products.brand })
      .from(products)
      .where(eq(products.isActive, true))
      .groupBy(products.brand);
    return results
      .map((r: { brand: string | null }) => r.brand)
      .filter(Boolean);
  }
);

export const getEvents = createServerFn({ method: "GET" }).handler(async () => {
  const db = createDb();
  await syncAllEventsToProducts(db);
  return db.query.events.findMany({
    orderBy: [asc(events.startDate)],
    where: eq(events.isActive, true),
  });
});

export const getEventBySlug = createServerFn({ method: "GET" })
  .inputValidator(z.string())
  .handler(async ({ data: slug }) => {
    const db = createDb();
    await syncAllEventsToProducts(db);
    return db.query.events.findFirst({
      where: and(eq(events.slug, slug), eq(events.isActive, true)),
    });
  });

export const getPromotions = createServerFn({ method: "GET" })
  .inputValidator(z.enum(["homepage", "shop", "both"]).optional())
  .handler(async ({ data: location }) => {
    const db = createDb();
    const conditions = [eq(promotions.isActive, true)];

    if (location) {
      conditions.push(
        sql`${promotions.displayLocation} = ${location} OR ${promotions.displayLocation} = 'both'`
      );
    }

    return db.query.promotions.findMany({
      orderBy: [asc(promotions.sortOrder)],
      where: and(...conditions),
    });
  });

export const getFooterContact = createServerFn({ method: "GET" }).handler(
  async () => {
    const db = createDb();
    const setting = await db.query.storeSettings.findFirst({
      where: eq(storeSettings.key, "footer_contact"),
    });
    if (setting) {
      try {
        return JSON.parse(setting.value);
      } catch {
        // Fallback below
      }
    }
    return {
      address: "14217 Corvallis Rd, Ste F\nMaumelle, AR 72113",
      hours: "Tue–Fri: 10am–6pm\nSat: 10am–5pm\nSun–Mon: Closed",
      phone: "(501) 404-8696",
    };
  }
);

async function syncAllEventsToProducts(db: ReturnType<typeof createDb>) {
  // 1. Ensure Workshops category exists
  const workshopsCat = await db.query.categories.findFirst({
    where: eq(categories.id, "cat-workshops"),
  });
  if (!workshopsCat) {
    await db.insert(categories).values({
      description: "ReLUXURY Creative Workshops and Classes",
      id: "cat-workshops",
      isActive: true,
      name: "Workshops",
      slug: "workshops",
      sortOrder: 99,
    });
  }

  // 2. Fetch all events
  const allEvents = await db.query.events.findMany();
  for (const event of allEvents) {
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.id, event.id),
    });

    const productValues = {
      brand: "ReLUXURY Studio",
      categoryId: "cat-workshops",
      colors: JSON.stringify(["Default"]),
      condition: "new" as const,
      description: event.description || "",
      featured: false,
      gender: "unisex" as const,
      id: event.id,
      isActive: event.isActive,
      price: event.price,
      quantity: event.capacity ?? 10,
      sizes: JSON.stringify(["Standard"]),
      slug: `event-${event.slug}`,
      title: event.title,
    };

    if (existingProduct) {
      await db
        .update(products)
        .set(productValues)
        .where(eq(products.id, event.id));
    } else {
      await db.insert(products).values(productValues);
    }

    if (event.imageUrl) {
      const existingImg = await db.query.productImages.findFirst({
        where: eq(productImages.productId, event.id),
      });
      if (existingImg) {
        await db
          .update(productImages)
          .set({ url: event.imageUrl })
          .where(eq(productImages.productId, event.id));
      } else {
        await db.insert(productImages).values({
          id: crypto.randomUUID(),
          isPrimary: true,
          productId: event.id,
          sortOrder: 0,
          url: event.imageUrl,
        });
      }
    }
  }
}
