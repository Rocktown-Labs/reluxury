import { Button } from "@reluxury/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, MapPin, Users, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { registerForEvent } from "@/functions/events";
import { getEventBySlug } from "@/functions/store";
import { authClient } from "@/lib/auth-client";
import { isUpcomingWorkshop } from "@/lib/workshops";

export const Route = createFileRoute("/events/$slug")({
  component: EventDetailComponent,
  loader: async ({ params }) => {
    const event = await getEventBySlug({ data: params.slug });
    return { event };
  },
});

function EventDetailComponent() {
  const { event } = Route.useLoaderData();
  const { data: session } = authClient.useSession();
  const [isRegistering, setIsRegistering] = useState(false);

  if (!event) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl text-foreground mb-4">
          Workshop Not Found
        </h1>
        <Link to="/events">
          <Button variant="outline" className="border-gold/20 text-gold">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workshops
          </Button>
        </Link>
      </div>
    );
  }

  const startDate = event.startDate ? new Date(event.startDate) : null;
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const isUpcoming = isUpcomingWorkshop(event.startDate);

  let registerButtonText: string;
  if (isRegistering) {
    registerButtonText = "Registering...";
  } else if (session) {
    registerButtonText = "Register Now";
  } else {
    registerButtonText = "Sign In to Register";
  }

  const handleRegister = async () => {
    if (!session) {
      toast.error("Please sign in to register");
      return;
    }
    setIsRegistering(true);
    try {
      await registerForEvent({ data: event.id });
      toast.success("Registered successfully!");
    } catch {
      toast.error("Failed to register");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 lg:px-8 py-8">
      <Link
        to="/events"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Workshops
      </Link>

      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          {isUpcoming && (
            <span className="inline-flex items-center rounded bg-gold/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-gold">
              Upcoming Workshop
            </span>
          )}
          <h1 className="font-display text-4xl font-light text-foreground">
            {event.title}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {startDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-gold" />
                <span>
                  {startDate.toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    weekday: "long",
                    year: "numeric",
                  })}
                  {endDate &&
                    ` - ${endDate.toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "long",
                      weekday: "long",
                    })}`}
                </span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gold" />
                <span>{event.location}</span>
              </div>
            )}
            {event.capacity && (
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-gold" />
                <span>{event.capacity} spots available</span>
              </div>
            )}
          </div>
        </div>

        {/* Image */}
        {event.imageUrl && (
          <div className="aspect-video rounded-xl overflow-hidden border border-gold/10">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="font-display text-xl text-foreground mb-3">
                About This Workshop
              </h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {event.instructor && (
              <div>
                <h2 className="font-display text-xl text-foreground mb-3">
                  Instructor
                </h2>
                <p className="text-muted-foreground">{event.instructor}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-gold/10 bg-card space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Price</span>
                <span className="font-semibold text-gold text-xl">
                  {event.price > 0 ? `$${event.price.toFixed(2)}` : "Free"}
                </span>
              </div>

              {isUpcoming ? (
                <Button
                  className="w-full bg-gold text-primary-foreground hover:bg-gold-dark"
                  disabled={isRegistering}
                  onClick={handleRegister}
                >
                  {registerButtonText}
                </Button>
              ) : (
                <Button disabled className="w-full" variant="outline">
                  Workshop Has Passed
                </Button>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Registration is required to attend.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-gold/10 bg-card space-y-3">
              <h3 className="font-medium text-foreground">Workshop Details</h3>
              {startDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="text-foreground">
                    {startDate.toLocaleDateString()}
                  </span>
                </div>
              )}
              {event.location && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Location</span>
                  <span className="text-foreground">{event.location}</span>
                </div>
              )}
              {event.capacity && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="text-foreground">
                    {event.capacity} people
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
