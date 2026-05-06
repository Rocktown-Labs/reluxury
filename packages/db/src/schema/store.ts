import { relations, sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  index,
  real,
} from "drizzle-orm/sqlite-core";

import { user } from "./auth";

export const categories = sqliteTable("categories", {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  description: text("description"),
  id: text("id").primaryKey(),
  imageUrl: text("image_url"),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const products = sqliteTable(
  "products",
  {
    brand: text("brand"),
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    colors: text("colors"),
    compareAtPrice: real("compare_at_price"),
    condition: text("condition", {
      enum: ["new", "like_new", "excellent", "good", "fair"],
    })
      .default("good")
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    description: text("description"),
    featured: integer("featured", { mode: "boolean" }).default(false).notNull(),
    gender: text("gender", { enum: ["women", "men", "unisex"] })
      .default("women")
      .notNull(),
    id: text("id").primaryKey(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    material: text("material"),
    metaDescription: text("meta_description"),
    metaTitle: text("meta_title"),
    price: real("price").notNull(),
    quantity: integer("quantity").default(1).notNull(),
    salePrice: real("sale_price"),
    sizeGuide: text("size_guide"),
    sizes: text("sizes"),
    sku: text("sku"),
    slug: text("slug").notNull().unique(),
    tags: text("tags"),
    title: text("title").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    weight: real("weight"),
  },
  (table) => [
    index("products_category_idx").on(table.categoryId),
    index("products_featured_idx").on(table.featured),
    index("products_active_idx").on(table.isActive),
    index("products_gender_idx").on(table.gender),
    index("products_brand_idx").on(table.brand),
  ]
);

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  orderItems: many(orderItems),
}));

export const productImages = sqliteTable(
  "product_images",
  {
    alt: text("alt"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    id: text("id").primaryKey(),
    isPrimary: integer("is_primary", { mode: "boolean" })
      .default(false)
      .notNull(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
    url: text("url").notNull(),
  },
  (table) => [index("product_images_product_idx").on(table.productId)]
);

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const orders = sqliteTable(
  "orders",
  {
    adminNotes: text("admin_notes"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    deliveryMethod: text("delivery_method", { enum: ["pickup", "shipping"] })
      .default("pickup")
      .notNull(),
    email: text("email").notNull(),
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    notes: text("notes"),
    orderNumber: text("order_number").notNull().unique(),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }),
    phone: text("phone"),
    shippingAddress: text("shipping_address"),
    shippingCost: real("shipping_cost").default(0).notNull(),
    status: text("status", {
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready_for_pickup",
        "shipped",
        "completed",
        "cancelled",
      ],
    })
      .default("pending")
      .notNull(),
    subtotal: real("subtotal").notNull(),
    tax: real("tax").default(0).notNull(),
    total: real("total").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  },
  (table) => [
    index("orders_user_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
  ]
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  items: many(orderItems),
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
}));

export const orderItems = sqliteTable(
  "order_items",
  {
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    id: text("id").primaryKey(),
    imageUrl: text("image_url"),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    price: real("price").notNull(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    size: text("size"),
    title: text("title").notNull(),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)]
);

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const cartItems = sqliteTable(
  "cart_items",
  {
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    size: text("size"),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("cart_items_user_idx").on(table.userId),
    index("cart_items_product_idx").on(table.productId),
  ]
);

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
  user: one(user, {
    fields: [cartItems.userId],
    references: [user.id],
  }),
}));

export const events = sqliteTable(
  "events",
  {
    capacity: integer("capacity"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    description: text("description"),
    endDate: integer("end_date", { mode: "timestamp_ms" }),
    id: text("id").primaryKey(),
    imageUrl: text("image_url"),
    instructor: text("instructor"),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    location: text("location"),
    price: real("price").default(0).notNull(),
    slug: text("slug").notNull().unique(),
    startDate: integer("start_date", { mode: "timestamp_ms" }).notNull(),
    title: text("title").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("events_active_idx").on(table.isActive),
    index("events_date_idx").on(table.startDate),
  ]
);

export const eventsRelations = relations(events, ({ many }) => ({
  registrations: many(eventRegistrations),
}));

export const eventRegistrations = sqliteTable(
  "event_registrations",
  {
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    notes: text("notes"),
    paymentStatus: text("payment_status", {
      enum: ["pending", "paid", "refunded", "waived"],
    })
      .default("pending")
      .notNull(),
    status: text("status", {
      enum: ["registered", "attended", "cancelled", "no_show"],
    })
      .default("registered")
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("event_registrations_event_idx").on(table.eventId),
    index("event_registrations_user_idx").on(table.userId),
  ]
);

export const eventRegistrationsRelations = relations(
  eventRegistrations,
  ({ one }) => ({
    event: one(events, {
      fields: [eventRegistrations.eventId],
      references: [events.id],
    }),
    user: one(user, {
      fields: [eventRegistrations.userId],
      references: [user.id],
    }),
  })
);

export const alterationBookings = sqliteTable(
  "alteration_bookings",
  {
    adminNotes: text("admin_notes"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    id: text("id").primaryKey(),
    imageUrls: text("image_urls"),
    itemDescription: text("item_description").notNull(),
    notes: text("notes"),
    preferredDate: integer("preferred_date", {
      mode: "timestamp_ms",
    }).notNull(),
    preferredTime: text("preferred_time"),
    price: real("price"),
    serviceType: text("service_type").notNull(),
    status: text("status", {
      enum: ["pending", "approved", "in_progress", "completed", "cancelled"],
    })
      .default("pending")
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("alteration_bookings_user_idx").on(table.userId),
    index("alteration_bookings_status_idx").on(table.status),
  ]
);

export const alterationBookingsRelations = relations(
  alterationBookings,
  ({ one }) => ({
    user: one(user, {
      fields: [alterationBookings.userId],
      references: [user.id],
    }),
  })
);

export const promotions = sqliteTable("promotions", {
  buttonLink: text("button_link"),
  buttonText: text("button_text"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  description: text("description"),
  displayLocation: text("display_location", {
    enum: ["homepage", "shop", "both"],
  })
    .default("both")
    .notNull(),
  endDate: integer("end_date", { mode: "timestamp_ms" }),
  id: text("id").primaryKey(),
  imageUrl: text("image_url"),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  startDate: integer("start_date", { mode: "timestamp_ms" }),
  subtitle: text("subtitle"),
  title: text("title").notNull(),
});

export const storeSettings = sqliteTable("store_settings", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  value: text("value").notNull(),
});

export const storeRelations = relations(storeSettings, () => ({}));
