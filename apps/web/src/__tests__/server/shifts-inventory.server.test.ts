import { describe, expect, it } from "vitest";

import {
  centralDayKey,
  isSameDay,
  shiftCoversCentralDay,
  toLocalDateKey,
  weekDays,
} from "@/lib/shifts";
import { isNewlyLowStock } from "@/lib/inventory";

describe("centralDayKey", () => {
  it("keys a Chicago morning in July as the same calendar day", () => {
    // 2026-07-06 14:00 UTC == 09:00 CDT
    expect(centralDayKey(new Date("2026-07-06T14:00:00Z"))).toBe("2026-07-06");
  });

  it("keys a late UTC evening as the next Chicago day boundary", () => {
    // 2026-07-07 04:30 UTC == 2026-07-06 23:30 CDT
    expect(centralDayKey(new Date("2026-07-07T04:30:00Z"))).toBe("2026-07-06");
  });
});

describe("shiftCoversCentralDay", () => {
  it("covers a same-day shift and skips cancelled ones", () => {
    const day = new Date("2026-07-06T12:00:00-05:00");
    expect(
      shiftCoversCentralDay(
        {
          endAt: new Date("2026-07-06T18:00:00-05:00"),
          startAt: new Date("2026-07-06T10:00:00-05:00"),
          status: "scheduled",
        },
        day
      )
    ).toBe(true);
    expect(
      shiftCoversCentralDay(
        {
          endAt: new Date("2026-07-06T18:00:00-05:00"),
          startAt: new Date("2026-07-06T10:00:00-05:00"),
          status: "cancelled",
        },
        day
      )
    ).toBe(false);
    expect(
      shiftCoversCentralDay(
        {
          endAt: new Date("2026-07-07T18:00:00-05:00"),
          startAt: new Date("2026-07-07T10:00:00-05:00"),
          status: "scheduled",
        },
        day
      )
    ).toBe(false);
  });
});

describe("weekDays", () => {
  it("returns a Sunday-to-Saturday week containing the anchor", () => {
    const days = weekDays(new Date("2026-09-30T12:00:00Z")); // Wednesday
    expect(days).toHaveLength(7);
    expect(days[0]?.getDay()).toBe(0);
    expect(days[6]?.getDay()).toBe(6);
    expect(days.some((day) => isSameDay(day, new Date("2026-09-30T12:00:00Z")))).toBe(
      true
    );
  });
});

describe("toLocalDateKey", () => {
  it("zero-pads month and day", () => {
    expect(toLocalDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("isNewlyLowStock", () => {
  it("fires only when crossing the threshold downward", () => {
    expect(isNewlyLowStock(6, 5, 5)).toBe(true);
    expect(isNewlyLowStock(5, 4, 5)).toBe(false);
    expect(isNewlyLowStock(6, 6, 5)).toBe(false);
    expect(isNewlyLowStock(10, 0, 5)).toBe(true);
  });
});
