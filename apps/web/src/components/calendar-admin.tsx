import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Scissors,
  Calendar as CalendarIcon,
  Clock,
  User,
  ExternalLink,
} from "lucide-react";
import { useState, useMemo } from "react";

interface Alteration {
  id: string;
  preferredDate: string | Date | null;
  preferredTime: string | null;
  serviceType: string;
  status: string;
  user?: {
    name: string | null;
    email: string;
  } | null;
}

interface Workshop {
  id: string;
  startDate: string | Date | null;
  title: string;
  instructor: string | null;
  registrations?: unknown[];
}

interface CalendarAdminProps {
  alterations: Alteration[];
  events: Workshop[];
}

export default function CalendarAdmin({
  alterations,
  events,
}: CalendarAdminProps) {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    () => new Date()
  );

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Helper to change month
  const handlePrevMonth = (): void => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = (): void => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  // Generate days in current month view
  const daysInMonth = useMemo(() => {
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // Day of week index (0-6)

    const dayArr: { date: Date | null; isCurrentMonth: boolean }[] = [];

    // Padding for previous month days
    for (let i = 0; i < firstDayIndex; i += 1) {
      dayArr.push({ date: null, isCurrentMonth: false });
    }

    // Days of current month
    for (let i = 1; i <= totalDays; i += 1) {
      dayArr.push({
        date: new Date(currentYear, currentMonth, i),
        isCurrentMonth: true,
      });
    }

    return dayArr;
  }, [currentYear, currentMonth]);

  // Group items by date string (YYYY-MM-DD)
  const itemsByDate = useMemo(() => {
    const map = new Map<
      string,
      { alterations: Alteration[]; workshops: Workshop[] }
    >();

    const getLocalDateString = (dStr: string | Date | null): string | null => {
      if (!dStr) {
        return null;
      }
      try {
        const d = new Date(dStr);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate()
        ).padStart(2, "0")}`;
      } catch {
        return null;
      }
    };

    for (const alt of alterations) {
      const dStr = getLocalDateString(alt.preferredDate);
      if (dStr) {
        if (!map.has(dStr)) {
          map.set(dStr, { alterations: [], workshops: [] });
        }
        map.get(dStr)?.alterations.push(alt);
      }
    }

    for (const shop of events) {
      const dStr = getLocalDateString(shop.startDate);
      if (dStr) {
        if (!map.has(dStr)) {
          map.set(dStr, { alterations: [], workshops: [] });
        }
        map.get(dStr)?.workshops.push(shop);
      }
    }

    return map;
  }, [alterations, events]);

  // Get scheduled items for selected day
  const selectedDayItems = useMemo(() => {
    if (!selectedDate) {
      return { alterations: [], workshops: [] };
    }
    const key = `${selectedDate.getFullYear()}-${String(
      selectedDate.getMonth() + 1
    ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    return itemsByDate.get(key) ?? { alterations: [], workshops: [] };
  }, [selectedDate, itemsByDate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gold/10 pb-4">
        <h2 className="font-display text-xl text-foreground">
          Scheduling Calendar
        </h2>
        <div className="flex items-center gap-4 bg-card border border-gold/10 px-3 py-1.5 rounded-lg">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="text-muted-foreground hover:text-gold transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-display text-sm tracking-widest text-gold uppercase min-w-[120px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="text-muted-foreground hover:text-gold transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-card border border-gold/10 rounded-xl p-6">
          <div className="grid grid-cols-7 gap-2 mb-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {daysInMonth.map((day, idx) => {
              if (!day.date) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="aspect-square rounded-lg bg-card/40 border border-transparent"
                  />
                );
              }

              const isSelected =
                selectedDate &&
                day.date.getDate() === selectedDate.getDate() &&
                day.date.getMonth() === selectedDate.getMonth() &&
                day.date.getFullYear() === selectedDate.getFullYear();

              const isToday = (() => {
                const today = new Date();
                return (
                  day.date.getDate() === today.getDate() &&
                  day.date.getMonth() === today.getMonth() &&
                  day.date.getFullYear() === today.getFullYear()
                );
              })();

              const dateKey = `${day.date.getFullYear()}-${String(
                day.date.getMonth() + 1
              ).padStart(
                2,
                "0"
              )}-${String(day.date.getDate()).padStart(2, "0")}`;
              const dayItems = itemsByDate.get(dateKey);

              const hasAlts = dayItems && dayItems.alterations.length > 0;
              const hasWorkshops = dayItems && dayItems.workshops.length > 0;

              let dayClasses =
                "border-gold/10 bg-background/50 text-muted-foreground";
              if (isSelected) {
                dayClasses = "border-gold bg-gold/10 text-foreground";
              } else if (isToday) {
                dayClasses = "border-gold/30 bg-muted/30 text-gold";
              }

              return (
                <button
                  type="button"
                  key={day.date.toISOString()}
                  onClick={() => setSelectedDate(day.date)}
                  className={`aspect-square rounded-lg border p-1 text-left flex flex-col justify-between hover:bg-gold/5 transition-all relative group ${dayClasses}`}
                >
                  <span
                    className={`text-xs font-mono font-medium ${isToday ? "text-gold" : ""}`}
                  >
                    {day.date.getDate()}
                  </span>

                  {/* Schedule Indicators */}
                  <div className="flex gap-1 mt-auto">
                    {hasAlts && (
                      <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                    )}
                    {hasWorkshops && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    )}
                  </div>

                  {/* Popover Hover summary */}
                  {dayItems && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-popover text-popover-foreground border border-gold/20 text-[10px] py-1 px-2 rounded shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10 w-32 space-y-1">
                      {dayItems.alterations.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Scissors className="h-2.5 w-2.5 text-gold" />
                          <span>{dayItems.alterations.length} Fitting(s)</span>
                        </div>
                      )}
                      {dayItems.workshops.length > 0 && (
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-2.5 w-2.5 text-emerald-500" />
                          <span>{dayItems.workshops.length} Workshop(s)</span>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day details */}
        <div className="bg-card border border-gold/10 rounded-xl p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="border-b border-gold/10 pb-4">
              <p className="text-xs uppercase tracking-widest text-gold font-medium">
                Day Schedule Inspector
              </p>
              <h3 className="font-display text-lg text-foreground mt-1">
                {selectedDate
                  ? selectedDate.toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "long",
                      weekday: "long",
                      year: "numeric",
                    })
                  : "Select a Date"}
              </h3>
            </div>

            {/* List items */}
            {selectedDayItems.alterations.length === 0 &&
            selectedDayItems.workshops.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm font-light border border-dashed border-gold/10 rounded-xl bg-background/30">
                <Clock className="h-8 w-8 text-gold/30 mx-auto mb-2" />
                No events scheduled for this day
              </div>
            ) : (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {/* Workshops list */}
                {selectedDayItems.workshops.map((shop) => (
                  <div
                    key={shop.id}
                    className="p-3 border border-emerald-500/20 bg-emerald-500/5 rounded-lg space-y-2 relative group"
                  >
                    <div className="flex justify-between items-start">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
                        <CalendarIcon className="h-3 w-3" /> Workshop
                      </span>
                      <Link
                        to="/admin/workshops/$workshopId"
                        params={{ workshopId: shop.id }}
                        className="text-muted-foreground hover:text-gold opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    <p className="font-display font-light text-foreground text-sm">
                      {shop.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3 w-3 text-emerald-500" />
                      <span>{shop.instructor || "No Instructor"}</span>
                    </div>
                  </div>
                ))}

                {/* Alterations list */}
                {selectedDayItems.alterations.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-3 border border-gold/20 bg-gold/5 rounded-lg space-y-2 relative group"
                  >
                    <div className="flex justify-between items-start">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gold/10 text-gold">
                        <Scissors className="h-3 w-3" /> Alteration
                      </span>
                      <Link
                        to="/admin/alterations/$alterationId"
                        params={{ alterationId: alt.id }}
                        className="text-muted-foreground hover:text-gold opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    <p className="font-display font-light text-foreground text-sm">
                      {alt.serviceType}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-gold" />
                        <span>
                          {alt.user?.name || alt.user?.email || "Guest"}
                        </span>
                      </div>
                      {alt.preferredTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gold" />
                          <span>{alt.preferredTime}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gold/10 pt-4 mt-6 text-[10px] text-muted-foreground/60 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-gold" /> Alteration
              Ticket
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Active
              Workshop
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
