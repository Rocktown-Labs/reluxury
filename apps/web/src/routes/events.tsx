import { Button } from "@reluxury/ui/components/button";
import {
  Outlet,
  createFileRoute,
  useRouterState,
} from "@tanstack/react-router";
import { Calendar } from "lucide-react";

import EventCard from "@/components/event-card";
import { getEvents } from "@/functions/store";
import { getDateValue, isUpcomingWorkshop } from "@/lib/workshops";

export const Route = createFileRoute("/events")({
  component: EventsComponent,
  loader: async () => ({ events: await getEvents() }),
});

function EventsComponent() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const { events } = Route.useLoaderData();

  if (pathname !== "/events" && pathname !== "/events/") {
    return <Outlet />;
  }
  const sortedEvents = [...events].toSorted((a, b) => {
    const aDate = getDateValue(a.startDate) ?? 0;
    const bDate = getDateValue(b.startDate) ?? 0;
    return aDate - bDate;
  });
  const upcoming = sortedEvents.filter((event) =>
    isUpcomingWorkshop(event.startDate)
  );
  const past = sortedEvents
    .filter((event) => !isUpcomingWorkshop(event.startDate))
    .toReversed();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-20 bg-card border-b border-gold/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--gold)_0%,_transparent_60%)] opacity-[0.05]" />
        <div className="container mx-auto max-w-7xl px-4 lg:px-8 relative text-center space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
            Community
          </p>
          <h1 className="font-display text-4xl lg:text-5xl font-light text-foreground">
            Sewing Workshops
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join our sewing classes, styling sessions, and community gatherings.
            Learn new skills and connect with fellow fashion enthusiasts.
          </p>
        </div>
      </section>

      {/* Upcoming Workshops */}
      <section className="py-16">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
                Coming Up
              </p>
              <h2 className="font-display text-2xl text-foreground">
                Upcoming Workshops
              </h2>
            </div>
          </div>

          {upcoming.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map((event: { id: string }) => (
                <EventCard key={event.id} event={event as never} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-gold/10 rounded-xl">
              <Calendar className="h-8 w-8 text-gold/30 mx-auto mb-3" />
              <p className="text-muted-foreground">
                No upcoming workshops at the moment.
              </p>
              <p className="text-sm text-muted-foreground/60">
                Check back soon or follow us on Instagram for updates.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Past Workshops */}
      {past.length > 0 && (
        <section className="py-16 bg-card border-y border-gold/10">
          <div className="container mx-auto max-w-7xl px-4 lg:px-8">
            <div className="space-y-2 mb-10">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
                Archive
              </p>
              <h2 className="font-display text-2xl text-foreground">
                Past Workshops
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {past.slice(0, 3).map((event: { id: string }) => (
                <EventCard key={event.id} event={event as never} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="p-12 rounded-2xl border border-gold/10 bg-card text-center space-y-6 max-w-3xl mx-auto">
            <h2 className="font-display text-3xl text-foreground">
              Want to Host a Workshop?
            </h2>
            <p className="text-muted-foreground">
              We love collaborating with local makers, stylists, and creative
              entrepreneurs. Reach out to discuss hosting your workshop or
              pop-up at ReLUXURY.
            </p>
            <a href="tel:5014048696">
              <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
                Call Us: (501) 404-8696
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
