export interface ShiftLike {
  endAt: Date | string | number | null;
  staffId?: string | null;
  startAt: Date | string | number | null;
  status?: string | null;
}

function toTime(value: Date | string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return Number.NaN;
  }
  return new Date(value).getTime();
}

export function startOfDay(date: Date): Date {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

export function weekDays(anchor: Date): Date[] {
  const start = startOfDay(anchor);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function toLocalDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return toLocalDateKey(a) === toLocalDateKey(b);
}

// A shift counts as coverage when it overlaps any part of the given day and
// isn't cancelled or marked no-show.
export function shiftCoversDay(shift: ShiftLike, day: Date): boolean {
  if (shift.status === "cancelled" || shift.status === "no_show") {
    return false;
  }
  const start = toTime(shift.startAt);
  const end = toTime(shift.endAt);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return false;
  }
  const dayStart = startOfDay(day).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  return start < dayEnd && end > dayStart;
}

export function isStaffOnShift(
  shifts: ShiftLike[],
  staffId: string | null | undefined,
  day: Date
): boolean {
  if (!staffId) {
    return false;
  }
  return shifts.some(
    (shift) => shift.staffId === staffId && shiftCoversDay(shift, day)
  );
}

export function formatShiftTime(value: Date | string | number | null): string {
  const time = toTime(value);
  if (Number.isNaN(time)) {
    return "";
  }
  return new Date(time).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

const CENTRAL_TIME_ZONE = "America/Chicago";

// Boutique-local calendar day (YYYY-MM-DD) for a timestamp.
export function centralDayKey(value: Date | string | number): string {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: CENTRAL_TIME_ZONE,
    year: "numeric",
  }).format(new Date(value));
}

export function centralTime(value: Date | string | number | null): string {
  const time = toTime(value);
  if (Number.isNaN(time)) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: CENTRAL_TIME_ZONE,
  }).format(new Date(time));
}

// Coverage against the boutique-local day: a shift counts when it starts or
// ends on that calendar day and isn't cancelled / no-show.
export function shiftCoversCentralDay(shift: ShiftLike, day: Date): boolean {
  if (shift.status === "cancelled" || shift.status === "no_show") {
    return false;
  }
  const start = toTime(shift.startAt);
  const end = toTime(shift.endAt);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return false;
  }
  const key = centralDayKey(day);
  return centralDayKey(start) === key || centralDayKey(end) === key;
}
