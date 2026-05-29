import { Badge } from "@reluxury/ui/components/badge";
import { Button } from "@reluxury/ui/components/button";
import { Input } from "@reluxury/ui/components/input";
import { Textarea } from "@reluxury/ui/components/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  Calendar,
  Clock,
  User,
  Scissors,
  Mail,
  Phone,
  MessageSquare,
  DollarSign,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { adminUpdateAlteration } from "@/functions/admin";
import { adminAlterationByIdQueryOptions } from "@/lib/queries";
import { queryClient } from "@/lib/query-client";

export const Route = createFileRoute("/admin/alterations/$alterationId")({
  component: AdminAlterationDetailComponent,
  loader: ({ params }) =>
    queryClient.ensureQueryData(
      adminAlterationByIdQueryOptions(params.alterationId)
    ),
});

function AdminAlterationDetailComponent() {
  const params = Route.useParams();
  const loaderData = Route.useLoaderData();
  const [adminNotes, setAdminNotes] = useState("");
  const [price, setPrice] = useState<string>("");

  const { data: booking, refetch } = useQuery({
    ...adminAlterationByIdQueryOptions(params.alterationId),
    initialData: loaderData,
  });

  const updateMutation = useMutation({
    mutationFn: adminUpdateAlteration,
    onError: (err) => {
      toast.error(err.message || "Failed to update alteration booking");
    },
    onSuccess: () => {
      toast.success("Alteration booking updated successfully");
      refetch();
    },
  });

  if (!booking) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-xl">Alteration booking not found</h2>
        <Link
          to="/admin"
          className="text-gold hover:underline mt-4 inline-block"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const handleUpdate = (status?: typeof booking.status) => {
    updateMutation.mutate({
      adminNotes: adminNotes || booking.adminNotes,
      id: booking.id,
      price: price ? Number(price) : booking.price,
      status: status ?? booking.status,
    });
  };

  const getStatusBadge = (status: typeof booking.status) => {
    const config: Record<
      typeof booking.status,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      approved: { label: "Approved", variant: "secondary" },
      cancelled: { label: "Cancelled", variant: "destructive" },
      completed: { label: "Completed", variant: "default" },
      in_progress: { label: "In Progress", variant: "secondary" },
      pending: { label: "Pending Approval", variant: "outline" },
    };
    const c = config[status] || { label: status, variant: "outline" };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

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
              Alteration Ticket
            </h1>
            {getStatusBadge(booking.status)}
          </div>
        </div>
        <span className="text-sm text-muted-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gold" />
          Created: {new Date(booking.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Service Details */}
          <div className="bg-card border border-gold/10 rounded-xl p-6 space-y-6">
            <h2 className="font-display text-xl font-light text-foreground border-b border-gold/5 pb-3 flex items-center gap-2">
              <Scissors className="h-5 w-5 text-gold" /> Service Details
            </h2>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Garment/Item Description
                </span>
                <p className="text-foreground text-base leading-relaxed">
                  {booking.itemDescription}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Service Requested
                </span>
                <p className="text-foreground text-base leading-relaxed">
                  {booking.serviceType}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Preferred Appointment Date
                </span>
                <p className="text-foreground flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gold" />
                  {new Date(booking.preferredDate).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    weekday: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Preferred Time Window
                </span>
                <p className="text-foreground flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gold" />
                  {booking.preferredTime || "Anytime"}
                </p>
              </div>
            </div>

            {booking.notes && (
              <div className="space-y-2 border-t border-gold/5 pt-4">
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gold" /> Customer Notes
                </h3>
                <p className="text-sm bg-gold/5 p-4 rounded-lg leading-relaxed text-muted-foreground border border-gold/5">
                  "{booking.notes}"
                </p>
              </div>
            )}
          </div>

          {/* Customer Profile card */}
          <div className="bg-card border border-gold/10 rounded-xl p-6 space-y-6">
            <h2 className="font-display text-xl font-light text-foreground border-b border-gold/5 pb-3 flex items-center gap-2">
              <User className="h-5 w-5 text-gold" /> Customer Contact Info
            </h2>
            <div className="grid sm:grid-cols-2 gap-6 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-semibold">
                  Full Name
                </span>
                <p className="font-medium text-base">{booking.user.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-semibold">
                  Email Address
                </span>
                <p className="text-gold flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <a
                    href={`mailto:${booking.user.email}`}
                    className="hover:underline"
                  >
                    {booking.user.email}
                  </a>
                </p>
              </div>
              {booking.user.phone && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-semibold">
                    Phone Number
                  </span>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <a
                      href={`tel:${booking.user.phone}`}
                      className="hover:underline"
                    >
                      {booking.user.phone}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-8">
          <div className="bg-card border border-gold/10 rounded-xl p-6 space-y-6">
            <h2 className="font-display text-xl font-light text-foreground border-b border-gold/5 pb-3">
              Fulfillment Settings
            </h2>

            {/* Price section */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gold" /> Service Price Quote
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    placeholder={
                      booking.price === null
                        ? "Set quote price"
                        : booking.price.toString()
                    }
                    className="pl-7"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <Button
                  className="bg-gold text-primary-foreground hover:bg-gold-dark"
                  onClick={() => handleUpdate()}
                  disabled={updateMutation.isPending}
                >
                  Set
                </Button>
              </div>
              {booking.price !== null && (
                <p className="text-xs text-gold font-mono">
                  Currently Quoted: ${booking.price.toFixed(2)}
                </p>
              )}
            </div>

            {/* Status updates */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Set Job Status
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {booking.status === "pending" && (
                  <Button
                    className="col-span-2 bg-gold text-primary-foreground hover:bg-gold-dark"
                    onClick={() => handleUpdate("approved")}
                    disabled={updateMutation.isPending}
                  >
                    Approve Request
                  </Button>
                )}
                {booking.status === "approved" && (
                  <Button
                    className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleUpdate("in_progress")}
                    disabled={updateMutation.isPending}
                  >
                    Start In Progress
                  </Button>
                )}
                {booking.status === "in_progress" && (
                  <Button
                    className="col-span-2 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleUpdate("completed")}
                    disabled={updateMutation.isPending}
                  >
                    Mark Job Completed
                  </Button>
                )}
                {booking.status !== "completed" &&
                  booking.status !== "cancelled" && (
                    <Button
                      variant="outline"
                      className="col-span-2 border-red-500/20 text-red-500 hover:bg-red-500/10"
                      onClick={() => handleUpdate("cancelled")}
                      disabled={updateMutation.isPending}
                    >
                      Cancel Booking
                    </Button>
                  )}
              </div>
            </div>

            {/* Admin notes */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Internal Admin Notes
              </label>
              <Textarea
                placeholder="Alterations measurements, fitting notes, fabric tracking, etc."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={5}
              />
              <Button
                variant="outline"
                className="w-full border-gold/20 text-gold hover:bg-gold/10"
                onClick={() => handleUpdate()}
                disabled={updateMutation.isPending}
              >
                Save Fitting Notes
              </Button>
            </div>

            {/* Previous notes display */}
            {booking.adminNotes && (
              <div className="p-3 bg-gold/5 border border-gold/10 rounded-lg text-xs space-y-2">
                <span className="font-semibold text-gold">
                  Internal Notes History:
                </span>
                <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
                  {booking.adminNotes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
