import { createDb } from "@reluxury/db";
import { auditLog } from "@reluxury/db/schema";

export async function auditAction(input: {
  actorUserId?: string | null;
  action: string;
  details?: Record<string, unknown>;
  entityId?: string;
  entityType: string;
}) {
  try {
    const db = createDb();
    await db.insert(auditLog).values({
      action: input.action,
      actorUserId: input.actorUserId ?? null,
      details: input.details ? JSON.stringify(input.details) : null,
      entityId: input.entityId ?? null,
      entityType: input.entityType,
      id: crypto.randomUUID(),
    });
  } catch (error) {
    console.error("Audit log write failed", error);
  }
}
