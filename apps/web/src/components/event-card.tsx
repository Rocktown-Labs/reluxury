import type { events } from "@reluxury/db/schema";
import { Link } from "@tanstack/react-router";
import { Calendar, MapPin, Users } from "lucide-react";

import { isUpcomingWorkshop } from "@/lib/workshops";

interface EventCardProps {
  event: typeof events.$inferSelect;
}

export default function EventCard({ event }: EventCardProps) {
  const startDate = event.startDate ? new Date(event.startDate) : null;
  const isUpcoming = isUpcomingWorkshop(event.startDate);

  return (
    <Link
      to="/events/$slug"
      params={{ slug: event.slug }}
      className="group block"
    >
      <div className="overflow-hidden rounded-xl border border-gold/10 bg-card transition-colors hover:border-gold/20">
        <div className="relative aspect-[16/9] overflow-hidden">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-muted">
              <Calendar className="h-8 w-8 text-gold/30" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            {isUpcoming && (
              <span className="inline-flex items-center rounded bg-gold/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                Upcoming
              </span>
            )}
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="space-y-1">
            {startDate && (
              <p className="text-xs text-gold font-medium uppercase tracking-wider">
                {startDate.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                  weekday: "long",
                  year: "numeric",
                })}
              </p>
            )}
            <h3 className="font-display text-lg text-foreground transition-colors group-hover:text-gold">
              {event.title}
            </h3>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{event.location}</span>
              </div>
            )}
            {event.capacity && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{event.capacity} spots</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              {event.price > 0 ? `$${event.price.toFixed(2)}` : "Free"}
            </span>
            <span className="inline-flex h-8 items-center rounded-md border border-gold/20 px-3 text-xs font-medium text-gold transition-colors group-hover:bg-gold/10">
              View Workshop
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
