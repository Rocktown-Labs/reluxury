import { Badge } from "@reluxury/ui/components/badge";
import { Button } from "@reluxury/ui/components/button";
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
import { useQuery } from "@tanstack/react-query";
import { Package, Scissors, Calendar, User, ArrowRight, Tag } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { getMyAlterationBookings } from "@/functions/alterations";
import { getMyEventRegistrations } from "@/functions/events";
import { getMyIntakes, respondToOffer } from "@/functions/intake";
import { getUser } from "@/functions/get-user";
import { getOrders } from "@/functions/orders";
import { myIntakesQueryOptions } from "@/lib/queries";
import { queryClient } from "@/lib/query-client";

const dashboardSearchSchema = z.object({
  tab: z.enum(["orders", "bookings", "events", "consignment", "profile"]).optional(),
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
    const [orders, bookings, registrations, intakes] = await Promise.all([
      getOrders(),
      getMyAlterationBookings(),
      getMyEventRegistrations(),
      getMyIntakes(),
    ]);
    return { bookings, intakes, orders, registrations, session: context.session };
  },
  validateSearch: (search) => dashboardSearchSchema.parse(search),
});

function parseIntakeItems(items: string | null): { description: string }[] {
  if (!items) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(items);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function DashboardComponent() {
  const { orders, bookings, registrations, intakes, session } =
    Route.useLoaderData();
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const { data: myIntakes } = useQuery({
    ...myIntakesQueryOptions(),
    initialData: intakes,
  });

  const handleOfferResponse = async (id: string, accept: boolean) => {
    try {
      await respondToOffer({ data: { accept, id } });
      toast.success(
        accept ? "Offer accepted — we'll be in touch" : "Offer declined"
      );
      await queryClient.invalidateQueries({
        queryKey: myIntakesQueryOptions().queryKey,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    }
  };

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
    <div className="container mx-auto max-w-7xl px-4 lg:px-8 pt-8 pb-28 sm:py-8">
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
              tab: val as "orders" | "bookings" | "events" | "consignment" | "profile",
            },
          })
        }
      >
        <TabsList className="bg-card border border-gold/10 mb-8 hidden sm:inline-flex">
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
          <TabsTrigger value="consignment" className="gap-2">
            <Tag className="h-4 w-4" />
            Consignment ({intakes.length})
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
        </TabsList>

        {/* Native-style bottom tab bar (mobile only) */}
        <nav
          aria-label="Account sections"
          className="fixed bottom-0 inset-x-0 z-40 border-t border-gold/10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:hidden"
        >
          <div className="grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
            {(
              [
                {
                  count: orders.length,
                  icon: Package,
                  label: "Orders",
                  value: "orders",
                },
                {
                  count: bookings.length,
                  icon: Scissors,
                  label: "Alterations",
                  value: "bookings",
                },
                {
                  count: registrations.length,
                  icon: Calendar,
                  label: "Workshops",
                  value: "events",
                },
                {
                  count: intakes.length,
                  icon: Tag,
                  label: "Sell",
                  value: "consignment",
                },
                { count: null, icon: User, label: "Profile", value: "profile" },
              ] as const
            ).map((item) => {
              const isActive = (tab ?? "orders") === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    navigate({
                      search: {
                        tab: item.value,
                      },
                    })
                  }
                  className={`relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                    isActive ? "text-gold" : "text-muted-foreground"
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-0 h-0.5 w-10 rounded-full bg-gold" />
                  )}
                  <span className="relative">
                    <item.icon className="h-5 w-5" />
                    {item.count !== null && item.count > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-0.5 rounded-full bg-gold text-[9px] font-semibold text-primary-foreground flex items-center justify-center">
                        {item.count}
                      </span>
                    )}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

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

        <TabsContent value="consignment" className="space-y-4">
          {(myIntakes ?? intakes).length === 0 ? (
            <EmptyState
              icon={Tag}
              title="No consignment submissions"
              description="Send photos ahead of time for drop-off or mail-in review."
              action={{ label: "Sell to Us", to: "/sell" }}
            />
          ) : (
            <div className="space-y-4">
              {(myIntakes ?? intakes).map((submission) => {
                const describedItems = parseIntakeItems(submission.items);
                return (
                  <div
                    key={submission.id}
                    className="p-5 rounded-xl border border-gold/10 bg-card space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-foreground">
                        {describedItems.length} item
                        {describedItems.length === 1 ? "" : "s"} ·{" "}
                        {submission.type === "mailin"
                          ? "Mail-in"
                          : "Drop-off"}
                      </span>
                      <Badge
                        variant="outline"
                        className={statusColors[submission.status] ?? ""}
                      >
                        {submission.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {describedItems.map((item, index) => (
                        <li key={index}>
                          {item.description}
                        </li>
                      ))}
                    </ul>
                    {submission.offerStatus === "pending" &&
                      typeof submission.offerAmount === "number" && (
                        <div className="rounded-lg border border-gold/20 bg-gold/5 p-4 space-y-3">
                          <p className="text-sm text-foreground">
                            Our offer:{" "}
                            <span className="text-gold font-semibold">
                              ${Number(submission.offerAmount).toFixed(2)}
                            </span>
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-gold text-primary-foreground hover:bg-gold-dark"
                              onClick={() =>
                                handleOfferResponse(submission.id, true)
                              }
                            >
                              Accept Offer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gold/20 text-gold hover:bg-gold/10"
                              onClick={() =>
                                handleOfferResponse(submission.id, false)
                              }
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      )}
                    {submission.offerStatus !== "none" && (
                      <p className="text-xs text-muted-foreground">
                        Offer {submission.offerStatus}
                        {typeof submission.offerAmount === "number" &&
                          ` · $${Number(submission.offerAmount).toFixed(2)}`}
                      </p>
                    )}
                  </div>
                );
              })}
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
