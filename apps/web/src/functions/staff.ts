import {
  getPermissionsForRole,
  isValidPermission,
  isValidRole,
} from "@reluxury/auth/permissions";
import type { StaffRole } from "@reluxury/auth/permissions";
import { createDb } from "@reluxury/db";
import {
  staffMembers,
  staffInvitations,
  auditLog,
  user,
} from "@reluxury/db/schema";
import { env } from "@reluxury/env/server";
import {
  EMAIL_FROM,
  sendViaResend,
  staffInvitationHtml,
} from "@reluxury/transactional";
import { createServerFn } from "@tanstack/react-start";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

import { auditAction } from "@/lib/audit";
import { requireStaffPermission } from "@/lib/staff-auth";
import type { SessionWithStaff } from "@/lib/staff-auth";
import { authMiddleware } from "@/middleware/auth";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function inviteUrl(token: string): string {
  return `https://reluxury.shop/accept-invite?token=${token}`;
}

async function countActiveOwners(
  db: ReturnType<typeof createDb>,
  excludeUserId?: string
): Promise<number> {
  const owners = await db.query.staffMembers.findMany({
    where: and(eq(staffMembers.role, "owner"), eq(staffMembers.isActive, true)),
  });
  return owners.filter((row) => row.userId !== excludeUserId).length;
}

export const adminGetMyStaffContext = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const session = context.session as SessionWithStaff | null;
    if (!session) {
      return { isFullAdmin: false, staff: null };
    }
    if (session.user.role === "admin") {
      return { isFullAdmin: true, staff: session.staff ?? null };
    }
    return { isFullAdmin: false, staff: session.staff ?? null };
  });

export const adminGetStaffList = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    requireStaffPermission(context, "staff.manage");
    const db = createDb();
    const [members, invitations] = await Promise.all([
      db.query.staffMembers.findMany({
        orderBy: [desc(staffMembers.createdAt)],
        with: { user: true },
      }),
      db.query.staffInvitations.findMany({
        orderBy: [desc(staffInvitations.createdAt)],
      }),
    ]);
    return { invitations, members };
  });

const inviteInput = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  permissions: z.array(z.string()).optional(),
  role: z.string(),
});

export const adminInviteStaff = createServerFn({ method: "POST" })
  .inputValidator(inviteInput)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "staff.manage");
    if (!isValidRole(data.role)) {
      throw new Error("Invalid role");
    }
    const permissions = (
      data.permissions ?? getPermissionsForRole(data.role)
    ).filter(isValidPermission);
    const db = createDb();
    const token = crypto.randomUUID();
    const id = crypto.randomUUID();
    await db.insert(staffInvitations).values({
      email: data.email.toLowerCase(),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      id,
      invitedBy: context.session?.user.id ?? "",
      name: data.name,
      permissions: JSON.stringify(permissions),
      role: data.role,
      status: "pending",
      token,
    });
    await auditAction({
      action: "staff.invited",
      actorUserId: context.session?.user.id,
      details: { email: data.email, role: data.role },
      entityId: id,
      entityType: "staff_invitation",
    });
    const apiKey = env.RESEND_API_KEY ?? "";
    if (apiKey) {
      try {
        await sendViaResend({
          apiKey,
          from: EMAIL_FROM.noreply,
          html: staffInvitationHtml({
            inviteUrl: inviteUrl(token),
            inviterName: context.session?.user.name ?? "ReLUXURY",
            roleTitle: data.role,
          }),
          subject: "You're invited to the ReLUXURY team",
          to: data.email,
        });
      } catch (error) {
        console.error("Staff invite email failed", error);
      }
    }
    return { id, success: true };
  });

export const adminUpdateStaff = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
      isActive: z.boolean().optional(),
      permissions: z.array(z.string()).optional(),
      role: z.string().optional(),
      title: z.string().nullable().optional(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "staff.manage");
    const db = createDb();
    const member = await db.query.staffMembers.findFirst({
      where: eq(staffMembers.id, data.id),
    });
    if (!member) {
      throw new Error("Staff member not found");
    }
    if (member.userId === context.session?.user.id) {
      throw new Error("You cannot change your own role or status");
    }
    if (data.role && !isValidRole(data.role)) {
      throw new Error("Invalid role");
    }
    const nextRole = (data.role ?? member.role) as StaffRole;
    const nextActive = data.isActive ?? member.isActive;
    if (
      member.role === "owner" &&
      (nextRole !== "owner" || nextActive === false)
    ) {
      const remaining = await countActiveOwners(db, member.userId);
      if (remaining === 0) {
        throw new Error("Cannot remove the last active owner");
      }
    }
    const update: Partial<typeof staffMembers.$inferInsert> = {};
    if (data.role) {
      update.role = data.role as StaffRole;
      update.permissions = JSON.stringify(
        data.permissions ?? getPermissionsForRole(data.role as StaffRole)
      );
    } else if (data.permissions) {
      update.permissions = JSON.stringify(
        data.permissions.filter(isValidPermission)
      );
    }
    if (data.isActive !== undefined) {
      update.isActive = data.isActive;
    }
    if (data.title !== undefined) {
      update.title = data.title;
    }
    await db
      .update(staffMembers)
      .set(update)
      .where(eq(staffMembers.id, data.id));
    await auditAction({
      action: "staff.updated",
      actorUserId: context.session?.user.id,
      details: { role: nextRole, userId: member.userId },
      entityId: data.id,
      entityType: "staff_member",
    });
    return { success: true };
  });

export const adminRemoveStaff = createServerFn({ method: "POST" })
  .inputValidator(z.string())
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    requireStaffPermission(context, "staff.manage");
    const db = createDb();
    const member = await db.query.staffMembers.findFirst({
      where: eq(staffMembers.id, id),
    });
    if (!member) {
      throw new Error("Staff member not found");
    }
    if (member.userId === context.session?.user.id) {
      throw new Error("You cannot remove yourself");
    }
    if (member.role === "owner") {
      const remaining = await countActiveOwners(db, member.userId);
      if (remaining === 0) {
        throw new Error("Cannot remove the last active owner");
      }
    }
    await db
      .update(staffMembers)
      .set({ isActive: false })
      .where(eq(staffMembers.id, id));
    await auditAction({
      action: "staff.removed",
      actorUserId: context.session?.user.id,
      details: { userId: member.userId },
      entityId: id,
      entityType: "staff_member",
    });
    return { success: true };
  });

export const adminResendInvite = createServerFn({ method: "POST" })
  .inputValidator(z.string())
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    requireStaffPermission(context, "staff.manage");
    const db = createDb();
    const invite = await db.query.staffInvitations.findFirst({
      where: eq(staffInvitations.id, id),
    });
    if (!invite || invite.status !== "pending") {
      throw new Error("Invitation not found or no longer pending");
    }
    const apiKey = env.RESEND_API_KEY ?? "";
    if (!apiKey) {
      throw new Error("Email is not configured");
    }
    await sendViaResend({
      apiKey,
      from: EMAIL_FROM.noreply,
      html: staffInvitationHtml({
        inviteUrl: inviteUrl(invite.token),
        inviterName: context.session?.user.name ?? "ReLUXURY",
        roleTitle: invite.role,
      }),
      subject: "Reminder: you're invited to the ReLUXURY team",
      to: invite.email,
    });
    return { success: true };
  });

export const adminRevokeInvite = createServerFn({ method: "POST" })
  .inputValidator(z.string())
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    requireStaffPermission(context, "staff.manage");
    const db = createDb();
    await db
      .update(staffInvitations)
      .set({ status: "revoked" })
      .where(eq(staffInvitations.id, id));
    await auditAction({
      action: "staff.invite_revoked",
      actorUserId: context.session?.user.id,
      entityId: id,
      entityType: "staff_invitation",
    });
    return { success: true };
  });

export const acceptStaffInvite = createServerFn({ method: "POST" })
  .inputValidator(z.string())
  .middleware([authMiddleware])
  .handler(async ({ context, data: token }) => {
    if (!context.session) {
      throw new Error("Unauthorized");
    }
    const db = createDb();
    const invite = await db.query.staffInvitations.findFirst({
      where: eq(staffInvitations.token, token),
    });
    if (!invite || invite.status !== "pending") {
      throw new Error("Invitation is invalid or no longer pending");
    }
    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      await db
        .update(staffInvitations)
        .set({ status: "expired" })
        .where(eq(staffInvitations.id, invite.id));
      throw new Error("Invitation has expired");
    }
    if (
      invite.email.toLowerCase() !== context.session.user.email.toLowerCase()
    ) {
      throw new Error("This invitation was sent to a different email address");
    }
    const existing = await db.query.staffMembers.findFirst({
      where: eq(staffMembers.userId, context.session.user.id),
    });
    if (!existing) {
      await db.insert(staffMembers).values({
        id: crypto.randomUUID(),
        invitedBy: invite.invitedBy,
        isActive: true,
        permissions: invite.permissions,
        role: invite.role as StaffRole,
        title: null,
        userId: context.session.user.id,
      });
    }
    await db
      .update(staffInvitations)
      .set({ status: "accepted" })
      .where(eq(staffInvitations.id, invite.id));
    await auditAction({
      action: "staff.invite_accepted",
      actorUserId: context.session.user.id,
      entityId: invite.id,
      entityType: "staff_invitation",
    });
    return { success: true };
  });

export const adminSetUserBanned = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      banned: z.boolean(),
      email: z.string().email(),
      reason: z.string().optional(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    requireStaffPermission(context, "staff.manage");
    const db = createDb();
    const target = await db.query.user.findFirst({
      where: eq(user.email, data.email.toLowerCase()),
    });
    if (!target) {
      throw new Error("User not found");
    }
    if (target.id === context.session?.user.id) {
      throw new Error("You cannot ban yourself");
    }
    await db
      .update(user)
      .set({
        banExpires: null,
        banReason: data.banned ? (data.reason ?? "Disabled by staff") : null,
        banned: data.banned,
      })
      .where(eq(user.id, target.id));
    await auditAction({
      action: data.banned ? "user.banned" : "user.unbanned",
      actorUserId: context.session?.user.id,
      details: { email: data.email },
      entityId: target.id,
      entityType: "user",
    });
    return { success: true };
  });

export const adminGetAuditLog = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    requireStaffPermission(context, "audit.view");
    const db = createDb();
    return db.query.auditLog.findMany({
      limit: 100,
      orderBy: [desc(auditLog.createdAt)],
      with: { actor: true },
    });
  });
