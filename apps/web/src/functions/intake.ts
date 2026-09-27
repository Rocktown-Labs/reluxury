import { createDb, readBusinessContact } from "@reluxury/db";
import { intakeSubmissions, intakePhotos } from "@reluxury/db/schema";
import { env } from "@reluxury/env/server";
import {
  EMAIL_FROM,
  intakeDecisionHtml,
  intakeOfferResponseHtml,
  intakeReceivedHtml,
  intakeSubmittedHtml,
  sendViaResend,
} from "@reluxury/transactional";
import { createServerFn } from "@tanstack/react-start";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

import { notifyAdmin } from "@/lib/admin-notify";
import {
  normalizePhoneToMasked,
  optionalFlexiblePhoneSchema,
} from "@/lib/phone";
import { requireStaffPermission } from "@/lib/staff-auth";
import { authMiddleware } from "@/middleware/auth";

const INTAKE_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const INTAKE_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const INTAKE_MAX_PHOTOS = 8;

function decodeBase64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    const code = binary.codePointAt(i) ?? 0;
    bytes[i] = code;
  }
  return bytes;
}

function toSafeFileName(name: string): string {
  return name.toLowerCase().replaceAll(/[^a-z0-9.\-_]/g, "-");
}

export const uploadIntakePhoto = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      base64: z.string().min(1),
      contentType: z.string().min(1),
      fileName: z.string().min(1),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    if (!context.session) {
      throw new Error("Unauthorized");
    }
    if (!INTAKE_IMAGE_MIME_TYPES.has(data.contentType)) {
      throw new Error("Unsupported image format");
    }
    const bytes = decodeBase64ToBytes(data.base64);
    if (bytes.byteLength > INTAKE_MAX_UPLOAD_BYTES) {
      throw new Error("Image exceeds 10MB upload limit");
    }
    const r2 = env.PRODUCT_IMAGES;
    const publicBase = env.PRODUCT_IMAGES_PUBLIC_URL;
    if (!r2 || !publicBase) {
      return { url: `data:${data.contentType};base64,${data.base64}` };
    }
    const extension = data.fileName.split(".").pop()?.toLowerCase();
    const key = `intake/${context.session.user.id}/${Date.now()}-${crypto.randomUUID()}-${toSafeFileName(extension ? data.fileName : `${data.fileName}.jpg`)}`;
    await r2.put(key, bytes, {
      httpMetadata: { contentType: data.contentType },
    });
    return { url: `${publicBase.replace(/\/+$/, "")}/${key}` };
  });

const intakeItemSchema = z.object({
  brand: z.string().optional(),
  category: z.string().optional(),
  condition: z.string().optional(),
  description: z.string().min(1),
  photos: z.array(z.string().url()).max(INTAKE_MAX_PHOTOS).default([]),
});

export const submitIntake = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      appointmentAt: z.string().datetime().optional(),
      contactEmail: z.email("Enter a valid email address"),
      contactName: z.string().trim().min(1, "Full name is required"),
      items: z.array(intakeItemSchema).min(1).max(20),
      phone: optionalFlexiblePhoneSchema,
      shipFromAddress: z
        .object({
          address: z.string().trim().min(1, "Street address is required"),
          city: z.string().trim().min(1, "City is required"),
          state: z.string().trim().min(1, "State is required"),
          zip: z.string().trim().min(3, "Enter a valid ZIP code"),
        })
        .optional(),
      type: z.enum(["dropoff", "mailin"]),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    if (!context.session) {
      throw new Error("Unauthorized");
    }
    const photoCount = data.items.reduce(
      (total, item) => total + item.photos.length,
      0
    );
    if (photoCount > INTAKE_MAX_PHOTOS) {
      throw new Error(`Up to ${INTAKE_MAX_PHOTOS} photos per submission`);
    }
    if (data.type === "dropoff" && !data.appointmentAt) {
      throw new Error("Choose a drop-off appointment time");
    }
    if (data.type === "mailin" && !data.shipFromAddress) {
      throw new Error("Add the address you will ship from");
    }
    const db = createDb();
    const id = crypto.randomUUID();
    await db.insert(intakeSubmissions).values({
      appointmentAt: data.appointmentAt
        ? new Date(data.appointmentAt)
        : null,
      contactEmail: data.contactEmail,
      contactName: data.contactName,
      id,
      items: JSON.stringify(
        data.items.map(
          ({
            photos: _photos,
            ...rest
          }: {
            brand?: string;
            category?: string;
            condition?: string;
            description: string;
            photos: string[];
          }) => rest
        )
      ),
      offerStatus: "none",
      phone: normalizePhoneToMasked(data.phone) ?? null,
      shipFromAddress: data.shipFromAddress
        ? JSON.stringify(data.shipFromAddress)
        : null,
      status: "pending",
      type: data.type,
      userId: context.session.user.id,
    });
    const photoRows = data.items.flatMap((item, itemIndex) =>
      item.photos.map((url: string, photoIndex: number) => ({
        id: crypto.randomUUID(),
        intakeId: id,
        sortOrder: itemIndex * 10 + photoIndex,
        url,
      }))
    );
    for (const row of photoRows) {
      await db.insert(intakePhotos).values(row);
    }
    const business = await readBusinessContact(db);
    try {
      await sendViaResend({
        apiKey: env.RESEND_API_KEY ?? "",
        from: EMAIL_FROM.intake,
        html: intakeSubmittedHtml({
          business,
          customerName: data.contactName,
          itemCount: data.items.length,
          type: data.type,
        }),
        subject: "We received your consignment submission",
        to: data.contactEmail,
      });
    } catch (error) {
      console.error("Intake confirmation email failed", error);
    }
    await notifyAdmin(
      `New consignment submission — ${data.items.length} item(s)`,
      `<div style="font-family:sans-serif"><h2>New consignment submission</h2><p>${data.contactName} (${data.contactEmail}) submitted ${data.items.length} item(s) via ${data.type === "mailin" ? "mail-in" : "drop-off"}.</p></div>`
    );
    return { id, success: true };
  });

export const getMyIntakes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!context.session) {
      throw new Error("Unauthorized");
    }
    const db = createDb();
    return db.query.intakeSubmissions.findMany({
      orderBy: [desc(intakeSubmissions.createdAt)],
      where: eq(intakeSubmissions.userId, context.session.user.id),
      with: { photos: true },
    });
  });

export const respondToOffer = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accept: z.boolean(),
      id: z.string(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    if (!context.session) {
      throw new Error("Unauthorized");
    }
    const db = createDb();
    const submission = await db.query.intakeSubmissions.findFirst({
      where: and(
        eq(intakeSubmissions.id, data.id),
        eq(intakeSubmissions.userId, context.session.user.id)
      ),
    });
    if (!submission) {
      throw new Error("Submission not found");
    }
    if (submission.offerStatus !== "pending") {
      throw new Error("This offer is no longer pending");
    }
    await db
      .update(intakeSubmissions)
      .set({ offerStatus: data.accept ? "accepted" : "declined" })
      .where(eq(intakeSubmissions.id, data.id));
    const business = await readBusinessContact(db);
    await notifyAdmin(
      `Offer ${data.accept ? "accepted" : "declined"} — ${submission.contactName}`,
      intakeOfferResponseHtml({
        accepted: data.accept,
        business,
        customerEmail: submission.contactEmail,
        customerName: submission.contactName,
        offerAmount:
          typeof submission.offerAmount === "number"
            ? submission.offerAmount
            : null,
      })
    );
    return { success: true };
  });

export const adminGetIntakes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    requireStaffPermission(context, "intake.manage");
    const db = createDb();
    return db.query.intakeSubmissions.findMany({
      orderBy: [desc(intakeSubmissions.createdAt)],
      with: { photos: true, user: true },
    });
  });

export const adminReviewIntake = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminNotes: z.string().optional(),
      appointmentAt: z.string().datetime().optional().nullable(),
      decision: z.enum(["approved", "declined"]),
      id: z.string(),
      offerAmount: z.number().nonnegative().optional().nullable(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "intake.manage");
    const db = createDb();
    const submission = await db.query.intakeSubmissions.findFirst({
      where: eq(intakeSubmissions.id, data.id),
    });
    if (!submission) {
      throw new Error("Submission not found");
    }
    if (submission.status !== "pending") {
      throw new Error("Submission was already reviewed");
    }
    const hasOffer =
      data.decision === "approved" &&
      typeof data.offerAmount === "number" &&
      data.offerAmount > 0;
    await db
      .update(intakeSubmissions)
      .set({
        adminNotes: data.adminNotes ?? undefined,
        appointmentAt: data.appointmentAt
          ? new Date(data.appointmentAt)
          : undefined,
        offerAmount: data.offerAmount ?? undefined,
        offerStatus: hasOffer ? "pending" : "none",
        reviewedBy: context.session?.user.id ?? null,
        status: data.decision === "approved" ? "approved" : "declined",
      })
      .where(eq(intakeSubmissions.id, data.id));
    const business = await readBusinessContact(db);
    try {
      await sendViaResend({
        apiKey: env.RESEND_API_KEY ?? "",
        from: EMAIL_FROM.intake,
        html: intakeDecisionHtml({
          adminNote: data.adminNotes,
          business,
          customerName: submission.contactName,
          decision: data.decision,
          offerAmount: data.offerAmount,
        }),
        subject:
          data.decision === "approved"
            ? "Good news about your consignment submission"
            : "Update on your consignment submission",
        to: submission.contactEmail,
      });
    } catch (error) {
      console.error("Intake decision email failed", error);
    }
    return { success: true };
  });

export const adminMarkIntakeReceived = createServerFn({ method: "POST" })
  .inputValidator(z.string())
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    requireStaffPermission(context, "intake.manage");
    const db = createDb();
    const submission = await db.query.intakeSubmissions.findFirst({
      where: eq(intakeSubmissions.id, id),
    });
    if (!submission) {
      throw new Error("Submission not found");
    }
    await db
      .update(intakeSubmissions)
      .set({ status: "received" })
      .where(eq(intakeSubmissions.id, id));
    const business = await readBusinessContact(db);
    try {
      await sendViaResend({
        apiKey: env.RESEND_API_KEY ?? "",
        from: EMAIL_FROM.intake,
        html: intakeReceivedHtml({
          business,
          customerName: submission.contactName,
        }),
        subject: "Your consignment items arrived",
        to: submission.contactEmail,
      });
    } catch (error) {
      console.error("Intake received email failed", error);
    }
    return { success: true };
  });
