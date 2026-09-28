/* oxlint-disable no-use-before-define, func-style, typescript/no-explicit-any, complexity */
import { Badge } from "@reluxury/ui/components/badge";
import { Button } from "@reluxury/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@reluxury/ui/components/dialog";
import { Input } from "@reluxury/ui/components/input";
import { Label } from "@reluxury/ui/components/label";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  adminCreateShift,
  adminDeleteShift,
  adminSendShiftReminders,
  adminUpdateShift,
} from "@/functions/staff";
import { adminKeys } from "@/lib/queries";
import { queryClient } from "@/lib/query-client";
import {
  addDays,
  centralTime,
  isSameDay,
  startOfDay,
  toLocalDateKey,
  weekDays,
} from "@/lib/shifts";

const SHIFT_STATUSES = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

interface ShiftDraft {
  endAt: string;
  id?: string;
  notes: string;
  position: string;
  staffId: string;
  startAt: string;
  status: string;
}

const EMPTY_SHIFT: ShiftDraft = {
  endAt: "",
  notes: "",
  position: "",
  staffId: "",
  startAt: "",
  status: "scheduled",
};

function toDateTimeLocal(value: any): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function pad(part: number): string {
  return String(part).padStart(2, "0");
}

function staffDisplayName(shift: any): string {
  return (
    shift.staff?.alias || shift.staff?.user?.name || "Unassigned"
  );
}

export default function ShiftsManagement({
  assignable,
  shifts,
}: {
  assignable: any[];
  shifts: any[];
}) {
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<ShiftDraft>({ ...EMPTY_SHIFT });
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const remindersAttempted = useRef(false);

  const days = weekDays(weekAnchor);
  const weekStart = days[0] ?? new Date();
  const weekEnd = days[6] ?? new Date();

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: adminKeys.shifts() });

  useEffect(() => {
    if (remindersAttempted.current) {
      return;
    }
    remindersAttempted.current = true;
    const send = async () => {
      try {
        await adminSendShiftReminders();
      } catch {
        // silent — the manual button covers failures
      }
    };
    void send();
  }, []);

  const openCreate = (day?: Date) => {
    setConfirmDelete(false);
    const base = day ? startOfDay(day) : startOfDay(new Date());
    base.setHours(10, 0, 0, 0);
    const end = new Date(base);
    end.setHours(18, 0, 0, 0);
    setDraft({
      ...EMPTY_SHIFT,
      endAt: toDateTimeLocal(end),
      staffId: assignable[0]?.id ?? "",
      startAt: toDateTimeLocal(base),
    });
    setDialogOpen(true);
  };

  const openEdit = (shift: any) => {
    setConfirmDelete(false);
    setDraft({
      endAt: toDateTimeLocal(shift.endAt),
      id: shift.id,
      notes: shift.notes ?? "",
      position: shift.position ?? "",
      staffId: shift.staffId ?? "",
      startAt: toDateTimeLocal(shift.startAt),
      status: shift.status ?? "scheduled",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!draft.staffId || !draft.startAt || !draft.endAt) {
      toast.error("Staff, start, and end are required");
      return;
    }
    setIsSaving(true);
    try {
      if (draft.id) {
        await adminUpdateShift({
          data: {
            endAt: new Date(draft.endAt).toISOString(),
            id: draft.id,
            notes: draft.notes || null,
            position: draft.position || null,
            staffId: draft.staffId,
            startAt: new Date(draft.startAt).toISOString(),
            status: draft.status as
              | "scheduled"
              | "confirmed"
              | "completed"
              | "cancelled"
              | "no_show",
          },
        });
        toast.success("Shift updated");
      } else {
        await adminCreateShift({
          data: {
            endAt: new Date(draft.endAt).toISOString(),
            notes: draft.notes || undefined,
            position: draft.position || undefined,
            staffId: draft.staffId,
            startAt: new Date(draft.startAt).toISOString(),
            status: draft.status as
              | "scheduled"
              | "confirmed"
              | "completed"
              | "cancelled"
              | "no_show",
          },
        });
        toast.success("Shift scheduled");
      }
      setDialogOpen(false);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!draft.id || !confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setIsSaving(true);
    try {
      await adminDeleteShift({ data: draft.id });
      toast.success("Shift deleted");
      setConfirmDelete(false);
      setDialogOpen(false);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendReminders = async () => {
    setIsSendingReminders(true);
    try {
      const result = await adminSendShiftReminders();
      toast.success(
        result.sent === 0
          ? "No unsent reminders for today"
          : `Sent ${result.sent} shift reminder(s)`
      );
      if (result.failed.length > 0) {
        toast.error(`${result.failed.length} reminder(s) failed to send`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Send failed");
    } finally {
      setIsSendingReminders(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-gold/10">
        <h2 className="font-display text-xl text-foreground">Team Schedule</h2>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-gold/20 text-gold hover:bg-gold/10"
            disabled={isSendingReminders}
            onClick={handleSendReminders}
          >
            {isSendingReminders ? "Sending..." : "Send Today's Reminders"}
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-gold text-primary-foreground hover:bg-gold-dark"
            onClick={() => openCreate()}
          >
            Add Shift
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-gold"
          onClick={() => setWeekAnchor((prev) => addDays(prev, -7))}
        >
          ← Prev week
        </Button>
        <p className="text-sm text-muted-foreground">
          {weekStart.toLocaleDateString()} – {weekEnd.toLocaleDateString()}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-gold"
          onClick={() => setWeekAnchor((prev) => addDays(prev, 7))}
        >
          Next week →
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-7">
        {days.map((day) => {
          const dayShifts = shifts.filter((shift) =>
            isSameDay(new Date(shift.startAt), day)
          );
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={toLocalDateKey(day)}
              className={`rounded-xl border p-3 space-y-2 min-h-[140px] ${
                isToday
                  ? "border-gold/40 bg-gold/5"
                  : "border-gold/10 bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <p
                  className={`text-xs font-medium ${isToday ? "text-gold" : "text-muted-foreground"}`}
                >
                  {day.toLocaleDateString([], {
                    day: "numeric",
                    month: "short",
                    weekday: "short",
                  })}
                </p>
                <button
                  type="button"
                  onClick={() => openCreate(day)}
                  className="text-gold text-sm leading-none hover:text-gold-dark"
                  aria-label={`Add shift on ${day.toLocaleDateString()}`}
                >
                  +
                </button>
              </div>
              {dayShifts.length === 0 && (
                <p className="text-xs text-muted-foreground/60">No shifts</p>
              )}
              {dayShifts.map((shift) => (
                <button
                  key={shift.id}
                  type="button"
                  onClick={() => openEdit(shift)}
                  className="w-full text-left rounded-lg border border-gold/10 bg-background p-2 space-y-1 hover:border-gold/30"
                >
                  <p className="text-xs font-medium text-foreground truncate">
                    {staffDisplayName(shift)}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {centralTime(shift.startAt)} – {centralTime(shift.endAt)}
                  </p>
                  {shift.position && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      {shift.position}
                    </p>
                  )}
                  <Badge
                    variant="outline"
                    className="text-[10px] capitalize border-gold/20 text-gold"
                  >
                    {String(shift.status).replace("_", " ")}
                  </Badge>
                </button>
              ))}
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={() => setDialogOpen(false)}>
        <DialogContent className="max-w-lg bg-card border border-gold/25 p-6">
          <DialogHeader>
            <DialogTitle className="text-gold font-display font-light text-2xl">
              {draft.id ? "Edit Shift" : "Schedule Shift"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Staff member <span className="text-destructive">*</span>
              </Label>
              <select
                value={draft.staffId}
                onChange={(e) =>
                  setDraft({ ...draft, staffId: e.target.value })
                }
                className="flex h-10 w-full rounded-xl border border-gold/10 bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">Select staff</option>
                {assignable.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.alias || member.name} ({member.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Start <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={draft.startAt}
                  onChange={(e) =>
                    setDraft({ ...draft, startAt: e.target.value })
                  }
                  className="border-gold/10"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  End <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={draft.endAt}
                  onChange={(e) =>
                    setDraft({ ...draft, endAt: e.target.value })
                  }
                  className="border-gold/10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Position</Label>
                <Input
                  value={draft.position}
                  onChange={(e) =>
                    setDraft({ ...draft, position: e.target.value })
                  }
                  placeholder="Tailor, register, steamer..."
                  className="border-gold/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={draft.status}
                  onChange={(e) =>
                    setDraft({ ...draft, status: e.target.value })
                  }
                  className="flex h-10 w-full rounded-xl border border-gold/10 bg-background px-3 py-2 text-sm text-foreground"
                >
                  {SHIFT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                placeholder="Optional notes"
                className="border-gold/10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Times save as entered; reminders go out in boutique-local
              (Chicago) time on the morning of the shift.
            </p>
          </div>
          <DialogFooter className="mt-4 gap-2">
            {draft.id && (
              <Button
                variant="ghost"
                className="text-destructive text-xs mr-auto"
                disabled={isSaving}
                onClick={handleDelete}
              >
                {confirmDelete ? "Click again to confirm" : "Delete"}
              </Button>
            )}
            <Button
              className="bg-gold text-primary-foreground hover:bg-gold-dark"
              disabled={isSaving}
              onClick={handleSave}
            >
              {isSaving ? "Saving..." : "Save Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
