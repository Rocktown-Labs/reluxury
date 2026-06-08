import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createDb } from "@reluxury/db";
import {
  categories,
  events,
  productImages,
  products,
} from "@reluxury/db/schema";
import { and, asc, desc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { WORKSHOP_PRODUCT_CATEGORY_ID } from "../../functions/store";

const migrationFiles = [
  "0000_clean_network.sql",
  "0001_chunky_miek.sql",
  "0002_slow_pretty_boy.sql",
  "0003_swift_auth_admin_fields.sql",
  "0004_golden_dummy_products.sql",
  "0005_seed_catalog_and_workshop_cart_products.sql",
];

const currentDir = import.meta.dirname;
const migrationsDir = resolve(
  currentDir,
  "../../../../../packages/db/src/migrations"
);
const catalogProductFilter = or(
  isNull(products.categoryId),
  ne(products.categoryId, WORKSHOP_PRODUCT_CATEGORY_ID)
);

async function ensureMigratedTestDb() {
  const db = createDb();

  const existingTables = await db.all<{ name: string }>(
    sql.raw(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'products'"
    )
  );
  if (existingTables.length > 0) {
    return;
  }

  for (const file of migrationFiles) {
    const migration = readFileSync(resolve(migrationsDir, file), "utf-8");
    const statements = migration
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      try {
        await db.run(sql.raw(statement));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const { cause } = error as { cause?: unknown };
        const causeMessage =
          cause instanceof Error ? cause.message : String(cause ?? "");
        const isDuplicateColumn =
          message.includes("duplicate column name") ||
          causeMessage.includes("duplicate column name");
        if (!isDuplicateColumn) {
          throw error;
        }
      }
    }
  }
}

describe("Seeded catalog and workshop visibility", () => {
  beforeAll(async () => {
    await ensureMigratedTestDb();
  });

  it("seeds merchandise for shop queries without leaking workshops", async () => {
    const db = createDb();
    const shopProducts = await db.query.products.findMany({
      limit: 20,
      orderBy: [desc(products.createdAt)],
      where: and(eq(products.isActive, true), catalogProductFilter),
      with: {
        images: {
          limit: 1,
          orderBy: [asc(productImages.sortOrder)],
        },
      },
    });

    expect(shopProducts.length).toBeGreaterThanOrEqual(8);
    expect(shopProducts.some((item) => item.id.startsWith("prod-"))).toBe(true);
    expect(
      shopProducts.every(
        (item) => item.categoryId !== WORKSHOP_PRODUCT_CATEGORY_ID
      )
    ).toBe(true);
  });

  it("keeps workshop categories and backing products out of public merchandise surfaces", async () => {
    const db = createDb();
    const [visibleCategories, featured, newArrivals, workshopProduct] =
      await Promise.all([
        db
          .select()
          .from(categories)
          .where(
            and(
              eq(categories.isActive, true),
              sql`${categories.id} != ${WORKSHOP_PRODUCT_CATEGORY_ID}`
            )
          )
          .orderBy(asc(categories.sortOrder)),
        db.query.products.findMany({
          limit: 8,
          where: and(
            eq(products.featured, true),
            eq(products.isActive, true),
            catalogProductFilter
          ),
        }),
        db.query.products.findMany({
          limit: 8,
          orderBy: [desc(products.createdAt)],
          where: and(eq(products.isActive, true), catalogProductFilter),
        }),
        db.query.products.findFirst({
          where: and(
            eq(products.slug, "event-intermediate-pattern-hacking"),
            eq(products.isActive, true),
            catalogProductFilter
          ),
        }),
      ]);

    expect(visibleCategories.map((category) => category.id)).not.toContain(
      WORKSHOP_PRODUCT_CATEGORY_ID
    );
    expect(
      featured.every(
        (product) => product.categoryId !== WORKSHOP_PRODUCT_CATEGORY_ID
      )
    ).toBe(true);
    expect(
      newArrivals.every(
        (product) => product.categoryId !== WORKSHOP_PRODUCT_CATEGORY_ID
      )
    ).toBe(true);
    expect(workshopProduct).toBeUndefined();
  });

  it("seeds workshops as events while keeping cart-compatible backing products", async () => {
    const db = createDb();
    const [activeEvents, cartProducts] = await Promise.all([
      db.query.events.findMany({
        orderBy: [asc(events.startDate)],
        where: eq(events.isActive, true),
      }),
      db.query.products.findMany({
        where: and(
          eq(products.isActive, true),
          inArray(products.id, ["workshop-2026-06-21"])
        ),
      }),
    ]);

    expect(activeEvents.map((event) => event.id)).toContain(
      "workshop-2026-06-21"
    );
    expect(cartProducts).toHaveLength(1);
    expect(cartProducts[0]?.categoryId).toBe(WORKSHOP_PRODUCT_CATEGORY_ID);
  });
});
