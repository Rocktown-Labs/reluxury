import { Badge } from "@reluxury/ui/components/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@reluxury/ui/components/tabs";
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { Package, Scissors, Calendar, User, ArrowRight } from "lucide-react";
import { z } from "zod";

import { getMyAlterationBookings } from "@/functions/alterations";
import { getMyEventRegistrations } from "@/functions/events";
import { getUser } from "@/functions/get-user";
import { getOrders } from "@/functions/orders";

const dashboardSearchSchema = z.object({
  tab: z.enum(["orders", "bookings", "events", "profile"]).optional(),
});

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const session = await getUser();
    return { session };
  },
  component: DashboardComponent,
  loader: async ({ context }) => {
    if (!context.session) {
      throw redirect({ to: "/login" });
    }
    const [orders, bookings, registrations] = await Promise.all([
      getOrders(),
      getMyAlterationBookings(),
      getMyEventRegistrations(),
    ]);
    return { bookings, orders, registrations, session: context.session };
  },
  validateSearch: (search) => dashboardSearchSchema.parse(search),
});

function DashboardComponent() {
  const { orders, bookings, registrations, session } = Route.useLoaderData();
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const statusColors: Record<string, string> = {
    approved: "bg-blue-500/10 text-blue-500",
    cancelled: "bg-red-500/10 text-red-500",
    completed: "bg-green-500/10 text-green-500",
    confirmed: "bg-blue-500/10 text-blue-500",
    in_progress: "bg-purple-500/10 text-purple-500",
    pending: "bg-yellow-500/10 text-yellow-500",
    preparing: "bg-purple-500/10 text-purple-500",
    ready_for_pickup: "bg-green-500/10 text-green-500",
    registered: "bg-green-500/10 text-green-500",
    shipped: "bg-cyan-500/10 text-cyan-500",
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">
      <div className="space-y-2 mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
          Welcome back
        </p>
        <h1 className="font-display text-3xl font-light text-foreground">
          {session?.user.name ?? "My Account"}
        </h1>
      </div>

      <Tabs
        value={tab ?? "orders"}
        onValueChange={(val) =>
          navigate({
            search: {
              tab: val as "orders" | "bookings" | "events" | "profile",
            },
          })
        }
      >
        <TabsList className="bg-card border border-gold/10 mb-8">
          <TabsTrigger value="orders" className="gap-2">
            <Package className="h-4 w-4" />
            Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-2">
            <Scissors className="h-4 w-4" />
            Alterations ({bookings.length})
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-2">
            <Calendar className="h-4 w-4" />
            Workshops ({registrations.length})
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          {orders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No orders yet"
              description="Start shopping to see your orders here."
              action={{ label: "Shop Now", to: "/shop" }}
            />
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-xl border border-gold/10 bg-card space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground">
                        {order.orderNumber}
                      </span>
                      <Badge
                        variant="outline"
                        className={statusColors[order.status] ?? ""}
                      >
                        {order.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {order.items?.length ?? 0} item(s) &middot;{" "}
                      {order.deliveryMethod === "pickup"
                        ? "In-Store Pickup"
                        : "Shipping"}
                    </span>
                    <span className="font-semibold text-gold">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          {bookings.length === 0 ? (
            <EmptyState
              icon={Scissors}
              title="No alteration bookings"
              description="Book an alteration appointment to see it here."
              action={{ label: "Book Alteration", to: "/alterations" }}
            />
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-5 rounded-xl border border-gold/10 bg-card space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-foreground">
                      {booking.serviceType}
                    </span>
                    <Badge
                      variant="outline"
                      className={statusColors[booking.status] ?? ""}
                    >
                      {booking.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {booking.itemDescription}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {booking.preferredDate
                        ? new Date(booking.preferredDate).toLocaleDateString()
                        : ""}
                      {booking.preferredTime && ` at ${booking.preferredTime}`}
                    </span>
                    {booking.price && (
                      <span className="text-gold">
                        ${booking.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          {registrations.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No workshop registrations"
              description="Register for a workshop to see it here."
              action={{ label: "Browse Workshops", to: "/events" }}
            />
          ) : (
            <div className="space-y-4">
              {registrations.map((reg) => (
                <div
                  key={reg.id}
                  className="p-5 rounded-xl border border-gold/10 bg-card space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-foreground">
                      {reg.event?.title}
                    </span>
                    <Badge
                      variant="outline"
                      className={statusColors[reg.status] ?? ""}
                    >
                      {reg.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {reg.event?.startDate
                        ? new Date(reg.event.startDate).toLocaleDateString()
                        : ""}
                    </span>
                    <span className="text-muted-foreground">
                      Payment: {reg.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <div className="p-6 rounded-xl border border-gold/10 bg-card max-w-lg">
            <h2 className="font-display text-xl text-foreground mb-6">
              Profile Information
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Name</span>
                <span className="text-foreground">{session?.user.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email</span>
                <span className="text-foreground">{session?.user.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Role</span>
                <span className="text-foreground capitalize">
                  {session?.user.role ?? "Customer"}
                </span>
              </div>
            </div>
          </div>

          {session?.user.role === "admin" && (
            <Link to="/admin">
              <button className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors text-sm">
                Go to Admin Panel <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action: { label: string; to: string };
}) {
  return (
    <div className="text-center py-16 border border-dashed border-gold/10 rounded-xl">
      <Icon className="h-8 w-8 text-gold/30 mx-auto mb-3" />
      <h3 className="font-display text-lg text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <Link to={action.to}>
        <span className="text-sm text-gold hover:text-gold-light transition-colors">
          {action.label}
        </span>
      </Link>
    </div>
  );
}
