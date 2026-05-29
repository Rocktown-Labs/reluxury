import { Badge } from "@reluxury/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@reluxury/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  Calendar,
  Clock,
  User,
  Users,
  MapPin,
  DollarSign,
  Briefcase,
  AlertCircle,
} from "lucide-react";

import { adminEventByIdQueryOptions } from "@/lib/queries";
import { queryClient } from "@/lib/query-client";

export const Route = createFileRoute("/admin/workshops/$workshopId")({
  component: AdminWorkshopDetailComponent,
  loader: ({ params }) =>
    queryClient.ensureQueryData(adminEventByIdQueryOptions(params.workshopId)),
});

function AdminWorkshopDetailComponent() {
  const params = Route.useParams();
  const loaderData = Route.useLoaderData();

  const { data: event } = useQuery({
    ...adminEventByIdQueryOptions(params.workshopId),
    initialData: loaderData,
  });

  if (!event) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-xl">Workshop not found</h2>
        <Link
          to="/admin"
          className="text-gold hover:underline mt-4 inline-block"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const attendeesCount = event.registrations?.length ?? 0;
  const capacityPercent = event.capacity
    ? (attendeesCount / event.capacity) * 100
    : 0;

  return (
    <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gold/10">
        <div className="space-y-2">
          <Link
            to="/admin"
            className="flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="font-display text-3xl font-light text-foreground">
              {event.title}
            </h1>
            <Badge variant={event.isActive ? "default" : "outline"}>
              {event.isActive ? "Active" : "Archived"}
            </Badge>
          </div>
        </div>
        <span className="text-sm text-muted-foreground flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-gold animate-pulse" />
          EST. Capacity: {event.capacity || "Unlimited"}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Details & Attendee Roster */}
        <div className="lg:col-span-2 space-y-8">
          {/* Workshop overview */}
          <div className="bg-card border border-gold/10 rounded-xl p-6 space-y-6">
            <h2 className="font-display text-xl font-light text-foreground border-b border-gold/5 pb-3">
              Overview & Schedule
            </h2>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-gold shrink-0" />
                  <span className="font-semibold text-foreground">Date:</span>
                  {new Date(event.startDate).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    weekday: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-gold shrink-0" />
                  <span className="font-semibold text-foreground">Starts:</span>
                  {new Date(event.startDate).toLocaleTimeString()}
                </p>
                {event.endDate && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 text-gold shrink-0" />
                    <span className="font-semibold text-foreground">Ends:</span>
                    {new Date(event.endDate).toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <p className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4 text-gold shrink-0" />
                  <span className="font-semibold text-foreground">
                    Instructor:
                  </span>
                  {event.instructor || "To Be Announced"}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-gold shrink-0" />
                  <span className="font-semibold text-foreground">
                    Location:
                  </span>
                  {event.location || "Maumelle Boutique Studio"}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4 text-gold shrink-0" />
                  <span className="font-semibold text-foreground">
                    Class Price:
                  </span>
                  <span className="font-mono text-gold font-semibold">
                    ${event.price.toFixed(2)}
                  </span>
                </p>
              </div>
            </div>
            {event.description && (
              <div className="border-t border-gold/5 pt-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Course Description
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed mt-2 whitespace-pre-line">
                  {event.description}
                </p>
              </div>
            )}
          </div>

          {/* Attendees roster */}
          <div className="bg-card border border-gold/10 rounded-xl p-6">
            <h2 className="font-display text-xl font-light text-foreground border-b border-gold/5 pb-3 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-gold" /> Attendee Roster (
              {attendeesCount})
            </h2>

            {attendeesCount === 0 ? (
              <div className="text-center py-12 text-muted-foreground space-y-2 border border-dashed border-gold/10 rounded-lg">
                <AlertCircle className="h-8 w-8 text-gold/30 mx-auto" />
                <p className="text-sm">
                  No registrations found for this workshop yet.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gold/5">
                    <TableHead className="text-gold">Student Name</TableHead>
                    <TableHead className="text-gold">Email</TableHead>
                    <TableHead className="text-gold text-center">
                      Registration
                    </TableHead>
                    <TableHead className="text-gold text-center">
                      Payment Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {event.registrations.map((reg) => (
                    <TableRow
                      key={reg.id}
                      className="border-gold/5 hover:bg-gold/5"
                    >
                      <TableCell className="font-medium flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center font-semibold text-gold text-xs font-display">
                          {reg.user.name.slice(0, 2).toUpperCase()}
                        </div>
                        {reg.user.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {reg.user.email}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            reg.status === "registered"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {reg.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        <Badge
                          variant={
                            reg.paymentStatus === "paid"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {reg.paymentStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Sidebar Metrics */}
        <div className="space-y-8">
          <div className="bg-card border border-gold/10 rounded-xl p-6 space-y-6">
            <h2 className="font-display text-xl font-light text-foreground border-b border-gold/5 pb-3">
              Registration Metrics
            </h2>

            {/* Capacity tracker */}
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Class Capacity</span>
                <span className="font-mono">
                  {attendeesCount} / {event.capacity || "Unlimited"} students
                </span>
              </div>

              {event.capacity && (
                <div className="space-y-2">
                  <div className="h-2 w-full bg-gold/10 rounded-full overflow-hidden border border-gold/5">
                    <div
                      className="h-full bg-gold transition-all duration-500"
                      style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    {capacityPercent.toFixed(1)}% spots filled
                  </p>
                </div>
              )}
            </div>

            {/* Financial tracking */}
            <div className="p-4 bg-gold/5 border border-gold/10 rounded-lg space-y-2 text-center">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Class Revenue Generated
              </span>
              <p className="font-mono text-3xl font-light text-gold">
                ${(attendeesCount * event.price).toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground/60 leading-normal">
                Excludes pending checkouts and free waivers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
