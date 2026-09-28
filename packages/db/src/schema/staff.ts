import { relations, sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
} from "drizzle-orm/sqlite-core";

import { user } from "./auth";

export const staffMembers = sqliteTable(
  "staff_members",
  {
    alias: text("alias").unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    forwardAddress: text("forward_address"),
    id: text("id").primaryKey(),
    invitedBy: text("invited_by").references(() => user.id, {
      onDelete: "set null",
    }),
    isActive: integer("is_active", { mode: "boolean" })
      .default(true)
      .notNull(),
    permissions: text("permissions").notNull().default("[]"),
    role: text("role", {
      enum: ["owner", "admin", "manager", "tailor", "fulfillment", "custom"],
    })
      .default("custom")
      .notNull(),
    title: text("title"),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("staff_members_user_idx").on(table.userId)]
);

export const staffMembersRelations = relations(staffMembers, ({ one }) => ({
  user: one(user, {
    fields: [staffMembers.userId],
    references: [user.id],
  }),
}));

export const staffInvitations = sqliteTable(
  "staff_invitations",
  {
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    email: text("email").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    id: text("id").primaryKey(),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    permissions: text("permissions").notNull().default("[]"),
    role: text("role", {
      enum: ["owner", "admin", "manager", "tailor", "fulfillment", "custom"],
    })
      .default("custom")
      .notNull(),
    status: text("status", {
      enum: ["pending", "accepted", "revoked", "expired"],
    })
      .default("pending")
      .notNull(),
    token: text("token").notNull().unique(),
  },
  (table) => [
    index("staff_invitations_email_idx").on(table.email),
    index("staff_invitations_token_idx").on(table.token),
  ]
);

export const shifts = sqliteTable(
  "shifts",
  {
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    endAt: integer("end_at", { mode: "timestamp_ms" }).notNull(),
    id: text("id").primaryKey(),
    notes: text("notes"),
    position: text("position"),
    staffId: text("staff_id").references(() => staffMembers.id, {
      onDelete: "set null",
    }),
    startAt: integer("start_at", { mode: "timestamp_ms" }).notNull(),
    status: text("status", {
      enum: ["scheduled", "confirmed", "completed", "cancelled", "no_show"],
    })
      .default("scheduled")
      .notNull(),
  },
  (table) => [
    index("shifts_staff_idx").on(table.staffId),
    index("shifts_start_idx").on(table.startAt),
  ]
);

export const shiftsRelations = relations(shifts, ({ one }) => ({
  staff: one(staffMembers, {
    fields: [shifts.staffId],
    references: [staffMembers.id],
  }),
}));

export const intakeSubmissions = sqliteTable(
  "intake_submissions",
  {
    adminNotes: text("admin_notes"),
    appointmentAt: integer("appointment_at", { mode: "timestamp_ms" }),
    contactEmail: text("contact_email").notNull(),
    contactName: text("contact_name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    id: text("id").primaryKey(),
    inboundCarrier: text("inbound_carrier"),
    inboundLabelUrl: text("inbound_label_url"),
    inboundTrackingNumber: text("inbound_tracking_number"),
    items: text("items").notNull().default("[]"),
    offerAmount: real("offer_amount"),
    offerStatus: text("offer_status", {
      enum: ["none", "pending", "accepted", "declined"],
    })
      .default("none")
      .notNull(),
    phone: text("phone"),
    reviewedBy: text("reviewed_by").references(() => user.id, {
      onDelete: "set null",
    }),
    shipFromAddress: text("ship_from_address"),
    status: text("status", {
      enum: [
        "pending",
        "approved",
        "declined",
        "label_sent",
        "in_transit",
        "received",
        "completed",
        "cancelled",
      ],
    })
      .default("pending")
      .notNull(),
    type: text("type", { enum: ["dropoff", "mailin"] })
      .default("dropoff")
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("intake_submissions_user_idx").on(table.userId),
    index("intake_submissions_status_idx").on(table.status),
  ]
);

export const intakeSubmissionsRelations = relations(
  intakeSubmissions,
  ({ one, many }) => ({
    photos: many(intakePhotos),
    user: one(user, {
      fields: [intakeSubmissions.userId],
      references: [user.id],
    }),
  })
);

export const intakePhotos = sqliteTable(
  "intake_photos",
  {
    id: text("id").primaryKey(),
    intakeId: text("intake_id")
      .notNull()
      .references(() => intakeSubmissions.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
    url: text("url").notNull(),
  },
  (table) => [index("intake_photos_intake_idx").on(table.intakeId)]
);

export const intakePhotosRelations = relations(intakePhotos, ({ one }) => ({
  intake: one(intakeSubmissions, {
    fields: [intakePhotos.intakeId],
    references: [intakeSubmissions.id],
  }),
}));

export const auditLog = sqliteTable(
  "audit_log",
  {
    action: text("action").notNull(),
    actorUserId: text("actor_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    details: text("details"),
    entityId: text("entity_id"),
    entityType: text("entity_type").notNull(),
    id: text("id").primaryKey(),
  },
  (table) => [
    index("audit_log_entity_idx").on(table.entityType, table.entityId),
    index("audit_log_created_idx").on(table.createdAt),
  ]
);

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  actor: one(user, {
    fields: [auditLog.actorUserId],
    references: [user.id],
  }),
}));
