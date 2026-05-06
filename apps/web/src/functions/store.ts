import { createDb } from "@reluxury/db";
import {
  products,
  categories,
  productImages,
  events,
  promotions,
} from "@reluxury/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { eq, and, desc, asc, like, gte, lte, sql, count } from "drizzle-orm";
import { z } from "zod";

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
      where: and(eq(products.featured, true), eq(products.isActive, true)),
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
  return db.query.events.findMany({
    orderBy: [asc(events.startDate)],
    where: eq(events.isActive, true),
  });
});

export const getEventBySlug = createServerFn({ method: "GET" })
  .inputValidator(z.string())
  .handler(async ({ data: slug }) => {
    const db = createDb();
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
