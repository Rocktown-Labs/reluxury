import { shifts, staffMembers } from "@reluxury/db/schema";
import { and, eq, gte } from "drizzle-orm";

import type { AppDb } from "@/lib/db";
import { shiftCoversCentralDay } from "@/lib/shifts";

// Display-only staffing check: returns a warning string when a non-admin
// staffer acts while having no shift covering today (boutique-local day).
// Never blocks — callers complete the action and surface the message.
export async function offShiftWarning(
  db: AppDb,
  input: { isFull: boolean; userId: string }
): Promise<string | null> {
  if (input.isFull) {
    return null;
  }
  const database: AppDb = db as AppDb;
  const member = await database.query.staffMembers.findFirst({
    where: eq(staffMembers.userId, input.userId),
  });
  if (!member) {
    return null;
  }
  const recent = await database.query.shifts.findMany({
    where: and(
      eq(shifts.staffId, member.id),
      gte(shifts.startAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
    ),
  });
  const today = new Date();
  const covered = recent.some((shift) =>
    shiftCoversCentralDay(
      { endAt: shift.endAt, staffId: shift.staffId, startAt: shift.startAt, status: shift.status },
      today
    )
  );
  if (covered) {
    return null;
  }
  return "Note: you have no shift scheduled today — action completed anyway.";
}
