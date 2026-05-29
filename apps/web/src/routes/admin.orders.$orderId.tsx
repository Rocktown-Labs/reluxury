import { Badge } from "@reluxury/ui/components/badge";
import { Button } from "@reluxury/ui/components/button";
import { Input } from "@reluxury/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@reluxury/ui/components/table";
import { Textarea } from "@reluxury/ui/components/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  Calendar,
  Mail,
  Phone,
  User,
  Truck,
  MapPin,
  Clock,
  Package,
  DollarSign,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { adminUpdateOrderStatus } from "@/functions/admin";
import { adminOrderByIdQueryOptions } from "@/lib/queries";
import { queryClient } from "@/lib/query-client";

export const Route = createFileRoute("/admin/orders/$orderId")({
  component: AdminOrderDetailComponent,
  loader: ({ params }) =>
    queryClient.ensureQueryData(adminOrderByIdQueryOptions(params.orderId)),
});

function AdminOrderDetailComponent() {
  const params = Route.useParams();
  const loaderData = Route.useLoaderData();
  const [adminNotes, setAdminNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");

  const { data: order, refetch } = useQuery({
    ...adminOrderByIdQueryOptions(params.orderId),
    initialData: loaderData,
  });

  const updateStatusMutation = useMutation({
    mutationFn: adminUpdateOrderStatus,
    onError: (err) => {
      toast.error(err.message || "Failed to update order status");
    },
    onSuccess: () => {
      toast.success("Order status updated successfully");
      refetch();
    },
  });

  if (!order) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-xl">Order not found</h2>
        <Link
          to="/admin"
          className="text-gold hover:underline mt-4 inline-block"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  let shippingAddressObj: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null = null;
  if (order.shippingAddress) {
    if (typeof order.shippingAddress === "string") {
      try {
        shippingAddressObj = JSON.parse(
          order.shippingAddress
        ) as typeof shippingAddressObj;
      } catch {
        shippingAddressObj = null;
      }
    } else {
      shippingAddressObj = order.shippingAddress as typeof shippingAddressObj;
    }
  }

  const handleStatusChange = (status: typeof order.status) => {
    let notes = adminNotes;
    if (order.deliveryMethod === "shipping" && trackingNumber) {
      notes =
        `${notes}\n\n[Shipping] Carrier: ${carrier || "USPS"}, Tracking: ${trackingNumber}`.trim();
    } else if (
      order.deliveryMethod === "pickup" &&
      status === "ready_for_pickup"
    ) {
      notes = `${notes}\n\n[Pickup] Item is ready for pickup in store.`.trim();
    }

    updateStatusMutation.mutate({
      adminNotes: notes,
      id: order.id,
      status,
    });
  };

  const getStatusBadge = (status: typeof order.status) => {
    const config: Record<
      typeof order.status,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      cancelled: { label: "Cancelled", variant: "destructive" },
      completed: { label: "Completed", variant: "default" },
      confirmed: { label: "Confirmed", variant: "secondary" },
      pending: { label: "Pending", variant: "outline" },
      preparing: { label: "Preparing", variant: "secondary" },
      ready_for_pickup: { label: "Ready for Pickup", variant: "default" },
      shipped: { label: "Shipped", variant: "default" },
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
              Order {order.orderNumber}
            </h1>
            {getStatusBadge(order.status)}
          </div>
        </div>
        <span className="text-sm text-muted-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gold" />
          {new Date(order.createdAt).toLocaleDateString()} at{" "}
          {new Date(order.createdAt).toLocaleTimeString()}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left/Middle Column (Details & Items) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order Details */}
          <div className="bg-card border border-gold/10 rounded-xl p-6 space-y-6">
            <h2 className="font-display text-xl font-light text-foreground border-b border-gold/5 pb-3">
              Order Details
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gold flex items-center gap-2">
                  <User className="h-4 w-4" /> Customer Info
                </h3>
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{order.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a
                      href={`mailto:${order.email}`}
                      className="text-gold hover:underline"
                    >
                      {order.email}
                    </a>
                  </div>
                  {order.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a
                        href={`tel:${order.phone}`}
                        className="hover:underline"
                      >
                        {order.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gold flex items-center gap-2">
                  {order.deliveryMethod === "shipping" ? (
                    <Truck className="h-4 w-4" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  Delivery Method ({order.deliveryMethod})
                </h3>
                <div className="text-sm space-y-2">
                  {order.deliveryMethod === "shipping" && shippingAddressObj ? (
                    <div className="space-y-1">
                      <p className="font-medium">{shippingAddressObj.name}</p>
                      <p className="text-muted-foreground">
                        {shippingAddressObj.address}
                      </p>
                      <p className="text-muted-foreground">
                        {shippingAddressObj.city}, {shippingAddressObj.state}{" "}
                        {shippingAddressObj.zip}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 flex items-start gap-2">
                      <Clock className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">In-Store Pickup</p>
                        <p className="text-muted-foreground text-xs">
                          Pickup instructions will be emailed when marked "Ready
                          for Pickup".
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-card border border-gold/10 rounded-xl p-6">
            <h2 className="font-display text-xl font-light text-foreground border-b border-gold/5 pb-3 mb-4">
              Items Summary
            </h2>
            <Table>
              <TableHeader>
                <TableRow className="border-gold/5">
                  <TableHead className="text-gold">Item Description</TableHead>
                  <TableHead className="text-gold text-center">Size</TableHead>
                  <TableHead className="text-gold text-center">Qty</TableHead>
                  <TableHead className="text-gold text-right">Price</TableHead>
                  <TableHead className="text-gold text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="border-gold/5 hover:bg-gold/5"
                  >
                    <TableCell className="font-medium flex items-center gap-3">
                      <div className="w-10 h-10 bg-gold/10 rounded border border-gold/20 flex items-center justify-center shrink-0">
                        <Package className="h-5 w-5 text-gold" />
                      </div>
                      <div>
                        <p>{item.title}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          ID: {item.productId.slice(0, 8)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {item.size || "—"}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${item.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${(item.price * item.quantity).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Price breakdown */}
            <div className="mt-6 flex justify-end">
              <div className="w-80 space-y-3 text-sm border-t border-gold/5 pt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">
                    ${order.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-mono">
                    ${order.shippingCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gold/10 pt-3 text-base font-medium">
                  <span className="text-gold">Grand Total</span>
                  <span className="font-mono text-gold">
                    ${order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Column (Admin Notes & Actions) */}
        <div className="space-y-8">
          <div className="bg-card border border-gold/10 rounded-xl p-6 space-y-6">
            <h2 className="font-display text-xl font-light text-foreground border-b border-gold/5 pb-3">
              Order Fulfillment
            </h2>

            {/* Quick action buttons */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Transition Status
              </h3>
              {order.status === "pending" && (
                <Button
                  className="w-full bg-gold hover:bg-gold-dark text-primary-foreground"
                  onClick={() => handleStatusChange("confirmed")}
                  disabled={updateStatusMutation.isPending}
                >
                  Confirm Order
                </Button>
              )}

              {order.status === "confirmed" && (
                <Button
                  className="w-full bg-gold hover:bg-gold-dark text-primary-foreground"
                  onClick={() => handleStatusChange("preparing")}
                  disabled={updateStatusMutation.isPending}
                >
                  Start Preparing
                </Button>
              )}

              {order.status === "preparing" && (
                <>
                  {order.deliveryMethod === "pickup" ? (
                    <Button
                      className="w-full bg-gold hover:bg-gold-dark text-primary-foreground"
                      onClick={() => handleStatusChange("ready_for_pickup")}
                      disabled={updateStatusMutation.isPending}
                    >
                      Mark Ready for Pickup
                    </Button>
                  ) : (
                    <div className="space-y-3 p-3 border border-gold/10 rounded-lg">
                      <p className="text-xs font-medium text-gold">
                        Shipping Carrier Info
                      </p>
                      <Input
                        placeholder="Carrier (e.g. USPS, UPS)"
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                      />
                      <Input
                        placeholder="Tracking Number"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                      />
                      <Button
                        className="w-full bg-gold hover:bg-gold-dark text-primary-foreground mt-2"
                        onClick={() => handleStatusChange("shipped")}
                        disabled={
                          updateStatusMutation.isPending || !trackingNumber
                        }
                      >
                        Ship Order
                      </Button>
                    </div>
                  )}
                </>
              )}

              {(order.status === "shipped" ||
                order.status === "ready_for_pickup") && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleStatusChange("completed")}
                  disabled={updateStatusMutation.isPending}
                >
                  Complete Order
                </Button>
              )}

              {order.status !== "completed" && order.status !== "cancelled" && (
                <Button
                  variant="outline"
                  className="w-full border-red-500/20 text-red-500 hover:bg-red-500/10"
                  onClick={() => handleStatusChange("cancelled")}
                  disabled={updateStatusMutation.isPending}
                >
                  Cancel Order
                </Button>
              )}
            </div>

            {/* Admin Notes */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gold" /> Admin Internal
                Notes
              </h3>
              <Textarea
                placeholder="Add notes about alterations, alterations tracking, pickup codes, etc."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
              />
              <Button
                variant="outline"
                className="w-full border-gold/20 text-gold hover:bg-gold/10"
                onClick={() =>
                  updateStatusMutation.mutate({
                    adminNotes,
                    id: order.id,
                    status: order.status,
                  })
                }
                disabled={updateStatusMutation.isPending}
              >
                Save Notes Only
              </Button>
            </div>

            {/* Display Previous Notes */}
            {order.adminNotes && (
              <div className="p-3 bg-gold/5 border border-gold/10 rounded-lg text-xs space-y-2">
                <span className="font-semibold text-gold">
                  Logged Activities & Notes:
                </span>
                <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
                  {order.adminNotes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
