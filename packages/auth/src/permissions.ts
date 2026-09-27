export const STAFF_PERMISSIONS = [
  "dashboard.view",
  "products.manage",
  "orders.manage",
  "workshops.manage",
  "alterations.manage",
  "marketing.manage",
  "customers.view",
  "settings.manage",
  "staff.manage",
  "intake.manage",
  "schedule.manage",
  "audit.view",
] as const;

export type StaffPermission = (typeof STAFF_PERMISSIONS)[number];

export const STAFF_ROLES = [
  "owner",
  "admin",
  "manager",
  "tailor",
  "fulfillment",
  "custom",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

const ALL_PERMISSIONS: StaffPermission[] = [...STAFF_PERMISSIONS];

export const ROLE_PRESETS: Record<StaffRole, StaffPermission[]> = {
  admin: ALL_PERMISSIONS,
  custom: [],
  fulfillment: ["dashboard.view", "orders.manage"],
  manager: [
    "dashboard.view",
    "products.manage",
    "orders.manage",
    "workshops.manage",
    "alterations.manage",
    "marketing.manage",
    "customers.view",
    "intake.manage",
    "schedule.manage",
  ],
  owner: ALL_PERMISSIONS,
  tailor: [
    "dashboard.view",
    "alterations.manage",
    "workshops.manage",
    "schedule.manage",
  ],
};

export interface StaffContext {
  id: string;
  isActive: boolean;
  permissions: StaffPermission[];
  role: StaffRole;
  title: string | null;
}

export function hasPermission(
  staff: Pick<StaffContext, "permissions"> | null | undefined,
  permission: StaffPermission
): boolean {
  if (!staff) {
    return false;
  }
  return staff.permissions.includes(permission);
}

export function getPermissionsForRole(role: StaffRole): StaffPermission[] {
  return [...(ROLE_PRESETS[role] ?? [])];
}

export function isValidPermission(value: string): value is StaffPermission {
  return (STAFF_PERMISSIONS as readonly string[]).includes(value);
}

export function isValidRole(value: string): value is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value);
}

export function parseStaffPermissions(value: unknown): StaffPermission[] {
  if (typeof value !== "string") {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((entry): entry is StaffPermission => isValidPermission(entry as string));
  } catch {
    return [];
  }
}
