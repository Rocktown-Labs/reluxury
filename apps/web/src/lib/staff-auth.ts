import { hasPermission } from "@reluxury/auth/permissions";
import type {
  StaffContext,
  StaffPermission,
} from "@reluxury/auth/permissions";

interface StaffSession {
  staff?: StaffContext | null;
  user: { role?: string | null };
}

export interface SessionWithStaff {
  staff?: StaffContext | null;
  user: { email: string; id: string; name: string; role?: string | null };
}

export function isFullAccess(session: StaffSession | null): boolean {
  if (!session) {
    return false;
  }
  if (session.user.role === "admin") {
    return true;
  }
  return session.staff?.role === "owner" || session.staff?.role === "admin";
}

export function requireStaffPermission(
  context: { session: StaffSession | null },
  permission: StaffPermission
) {
  if (!context.session) {
    throw new Error("Unauthorized");
  }
  if (isFullAccess(context.session)) {
    return;
  }
  if (!hasPermission(context.session.staff, permission)) {
    throw new Error(`Forbidden: missing ${permission} permission`);
  }
}
