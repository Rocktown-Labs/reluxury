import { describe, expect, it } from "vitest";

import {
  getPermissionsForRole,
  hasPermission,
  isValidPermission,
  isValidRole,
  parseStaffPermissions,
} from "@reluxury/auth/permissions";
import {
  isFullAccess,
  requireStaffPermission,
} from "../../lib/staff-auth";

describe("staff permission maps", () => {
  it("grants owners and admins every permission", () => {
    for (const permission of getPermissionsForRole("owner")) {
      expect(permission).toBeTruthy();
    }
    expect(getPermissionsForRole("owner")).toEqual(
      getPermissionsForRole("admin")
    );
    expect(getPermissionsForRole("owner")).toContain("staff.manage");
    expect(getPermissionsForRole("owner")).toContain("audit.view");
  });

  it("scopes tailor to alterations, workshops, schedule and dashboard", () => {
    const permissions = getPermissionsForRole("tailor");
    expect(permissions).toContain("alterations.manage");
    expect(permissions).toContain("workshops.manage");
    expect(permissions).toContain("schedule.manage");
    expect(permissions).toContain("dashboard.view");
    expect(permissions).not.toContain("orders.manage");
    expect(permissions).not.toContain("settings.manage");
    expect(permissions).not.toContain("staff.manage");
  });

  it("scopes fulfillment to orders and dashboard only", () => {
    const permissions = getPermissionsForRole("fulfillment");
    expect(permissions).toEqual(
      expect.arrayContaining(["dashboard.view", "orders.manage"])
    );
    expect(permissions).not.toContain("staff.manage");
    expect(permissions).not.toContain("alterations.manage");
  });

  it("gives custom roles no permissions by default", () => {
    expect(getPermissionsForRole("custom")).toEqual([]);
  });
});

describe("hasPermission", () => {
  it("returns false without staff context", () => {
    expect(hasPermission(null, "orders.manage")).toBe(false);
    expect(hasPermission(undefined, "orders.manage")).toBe(false);
  });

  it("matches granted keys exactly", () => {
    expect(
      hasPermission({ permissions: ["orders.manage"] }, "orders.manage")
    ).toBe(true);
    expect(
      hasPermission({ permissions: ["orders.manage"] }, "staff.manage")
    ).toBe(false);
  });
});

describe("parseStaffPermissions", () => {
  it("drops unknown keys and malformed input", () => {
    expect(
      parseStaffPermissions(JSON.stringify(["orders.manage", "nope"]))
    ).toEqual(["orders.manage"]);
    expect(parseStaffPermissions("not-json")).toEqual([]);
    expect(parseStaffPermissions(null)).toEqual([]);
    expect(parseStaffPermissions(JSON.stringify({ a: 1 }))).toEqual([]);
  });
});

describe("role and permission validators", () => {
  it("accepts known roles and permissions", () => {
    expect(isValidRole("tailor")).toBe(true);
    expect(isValidRole("superuser")).toBe(false);
    expect(isValidPermission("audit.view")).toBe(true);
    expect(isValidPermission("everything")).toBe(false);
  });
});

describe("requireStaffPermission", () => {
  it("throws when unauthenticated", () => {
    expect(() =>
      requireStaffPermission({ session: null }, "orders.manage")
    ).toThrow("Unauthorized");
  });

  it("lets promoted admins through without a staff row", () => {
    expect(() =>
      requireStaffPermission(
        { session: { user: { role: "admin" } } },
        "settings.manage"
      )
    ).not.toThrow();
  });

  it("lets owner and admin staff roles through", () => {
    for (const role of ["owner", "admin"] as const) {
      expect(() =>
        requireStaffPermission(
          {
            session: {
              staff: {
                id: "s1",
                isActive: true,
                permissions: [],
                role,
                title: null,
              },
              user: { role: "customer" },
            },
          },
          "staff.manage"
        )
      ).not.toThrow();
    }
  });

  it("blocks tailors from orders and settings", () => {
    const context = {
      session: {
        staff: {
          id: "s2",
          isActive: true,
          permissions: getPermissionsForRole("tailor"),
          role: "tailor" as const,
          title: "Master Tailor",
        },
        user: { role: "customer" },
      },
    };
    expect(() =>
      requireStaffPermission(context, "alterations.manage")
    ).not.toThrow();
    expect(() => requireStaffPermission(context, "orders.manage")).toThrow(
      "Forbidden"
    );
    expect(() => requireStaffPermission(context, "settings.manage")).toThrow(
      "Forbidden"
    );
  });

  it("blocks fulfillment staff from staff management", () => {
    const context = {
      session: {
        staff: {
          id: "s3",
          isActive: true,
          permissions: getPermissionsForRole("fulfillment"),
          role: "fulfillment" as const,
          title: null,
        },
        user: { role: "customer" },
      },
    };
    expect(() =>
      requireStaffPermission(context, "orders.manage")
    ).not.toThrow();
    expect(() => requireStaffPermission(context, "staff.manage")).toThrow(
      "Forbidden"
    );
  });
});

describe("isFullAccess", () => {
  it("is false without a session", () => {
    expect(isFullAccess(null)).toBe(false);
  });
});
