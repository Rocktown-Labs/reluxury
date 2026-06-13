/* oxlint-disable eslint/complexity */
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
  Scale,
  Printer,
  RotateCcw,
  Calculator,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  adminUpdateOrderStatus,
  adminGetShippoRates,
  adminPurchaseShippoLabel,
  adminMarkReadyForPickup,
  adminRefundShippoLabel,
} from "@/functions/admin";
import { adminOrderByIdQueryOptions } from "@/lib/queries";
import { queryClient } from "@/lib/query-client";
import type { ShippoRate } from "@/lib/shippo";

export const Route = createFileRoute("/admin/orders/$orderId")({
  component: AdminOrderDetailComponent,
  loader: ({ params }) =>
    queryClient.ensureQueryData({
      ...adminOrderByIdQueryOptions(params.orderId),
      revalidateIfStale: true,
    }),
});

const BOX_PRESETS = [
  { height: 4, id: "custom", length: 8, name: "Custom Box", width: 6 },
  {
    height: 1.6,
    id: "sm-flat",
    length: 8.6,
    name: 'USPS Small Flat Box (8.6" x 5.4" x 1.6")',
    width: 5.4,
  },
  {
    height: 5.5,
    id: "md-flat",
    length: 11,
    name: 'USPS Medium Flat Box (11.0" x 8.5" x 5.5")',
    width: 8.5,
  },
  {
    height: 6,
    id: "lg-flat",
    length: 12.2,
    name: 'USPS Large Flat Box (12.2" x 12.0" x 6.0")',
    width: 12,
  },
  {
    height: 7.2,
    id: "shoe",
    length: 15,
    name: 'USPS Shoe Box (15.0" x 5.1" x 7.2")',
    width: 5.1,
  },
];
const BOX_PRESET_ID = "shipping-box-preset";
const PACKAGE_LENGTH_ID = "shipping-package-length";
const PACKAGE_WIDTH_ID = "shipping-package-width";
const PACKAGE_HEIGHT_ID = "shipping-package-height";
const PACKAGE_WEIGHT_ID = "shipping-package-weight";

function AdminOrderDetailComponent() {
  const params = Route.useParams();
  const loaderData = Route.useLoaderData();
  const [adminNotes, setAdminNotes] = useState("");

  // Shippo Package Details
  const [weight, setWeight] = useState("10"); // in ounces (weighed on scale)
  const [length, setLength] = useState("8");
  const [width, setWidth] = useState("6");
  const [height, setHeight] = useState("4");
  const [boxPreset, setBoxPreset] = useState("custom");

  // Shipping Rates
  const [rates, setRates] = useState<ShippoRate[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string>("");

  const { data: order, refetch } = useQuery({
    ...adminOrderByIdQueryOptions(params.orderId),
    initialData: loaderData,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const handlePresetChange = (presetId: string) => {
    setBoxPreset(presetId);
    const preset = BOX_PRESETS.find((p) => p.id === presetId);
    if (preset && preset.id !== "custom") {
      setLength(preset.length.toString());
      setWidth(preset.width.toString());
      setHeight(preset.height.toString());
    }
  };

  const updateStatusMutation = useMutation({
    mutationFn: adminUpdateOrderStatus,
    onError: (err) => {
      toast.error(err.message || "Failed to update order status");
    },
    onSuccess: async () => {
      toast.success("Order status updated successfully");
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      await refetch();
    },
  });

  const getRatesMutation = useMutation({
    mutationFn: adminGetShippoRates,
    onError: (err) => {
      toast.error(err.message || "Failed to retrieve shipping rates.");
    },
    onSuccess: (data) => {
      setRates(data.rates || []);
      if (data.rates && data.rates.length > 0) {
        // Sort cheapest first and select it
        const [cheapest] = [...data.rates].toSorted(
          (a, b) => Number.parseFloat(a.amount) - Number.parseFloat(b.amount)
        );
        setSelectedRateId(cheapest.objectId);
        toast.success(`Found ${data.rates.length} rates`);
      } else {
        toast.error("No shipping rates returned from Shippo.");
      }
    },
  });

  const purchaseLabelMutation = useMutation({
    mutationFn: adminPurchaseShippoLabel,
    onError: (err) => {
      toast.error(err.message || "Failed to purchase label.");
    },
    onSuccess: async () => {
      toast.success("Label purchased successfully!");
      setRates([]);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      await refetch();
    },
  });

  const markReadyForPickupMutation = useMutation({
    mutationFn: adminMarkReadyForPickup,
    onError: (err) => {
      toast.error(err.message || "Failed to update pickup status.");
    },
    onSuccess: async () => {
      toast.success("Order is ready for in-store pickup!");
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      await refetch();
    },
  });

  const refundLabelMutation = useMutation({
    mutationFn: adminRefundShippoLabel,
    onError: (err) => {
      toast.error(err.message || "Failed to refund label.");
    },
    onSuccess: async (data) => {
      toast.success(`Refund request submitted (Status: ${data.status})`);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      await refetch();
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

            {/* Quick action buttons / status transitions */}
            <div className="space-y-4">
              {order.status === "pending" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    This order is currently pending confirmation.
                  </p>
                  <Button
                    className="w-full bg-gold hover:bg-gold-dark text-primary-foreground font-medium"
                    onClick={() => handleStatusChange("confirmed")}
                    disabled={updateStatusMutation.isPending}
                  >
                    Confirm Order
                  </Button>
                </div>
              )}

              {order.status === "confirmed" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Start packing and preparing items for this order.
                  </p>
                  <Button
                    className="w-full bg-gold hover:bg-gold-dark text-primary-foreground font-medium"
                    onClick={() => handleStatusChange("preparing")}
                    disabled={updateStatusMutation.isPending}
                  >
                    Start Preparing
                  </Button>
                </div>
              )}

              {order.status === "preparing" && (
                <div className="space-y-4">
                  {order.deliveryMethod === "pickup" ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-gold/5 border border-gold/10 rounded-lg text-xs flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gold">
                            In-Store Pickup Order
                          </p>
                          <p className="text-muted-foreground">
                            Marking ready will notify the customer with pickup
                            directions.
                          </p>
                        </div>
                      </div>
                      <Button
                        className="w-full bg-gold hover:bg-gold-dark text-primary-foreground font-medium"
                        onClick={() =>
                          markReadyForPickupMutation.mutate({
                            orderId: order.id,
                          })
                        }
                        disabled={markReadyForPickupMutation.isPending}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> Mark Ready for
                        Pickup
                      </Button>
                    </div>
                  ) : (
                    // Shippo Shipping Flow
                    <div className="space-y-4 border border-gold/10 rounded-lg p-4 bg-primary/20">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gold uppercase tracking-wider flex items-center gap-1.5">
                          <Scale className="h-4 w-4" /> Package & Scale
                        </h3>
                        <Badge
                          variant="outline"
                          className="text-[10px] border-gold/20 text-gold"
                        >
                          Shippo Engine
                        </Badge>
                      </div>

                      {/* Box Preset */}
                      <div className="space-y-1">
                        <label
                          className="text-[11px] font-medium text-muted-foreground uppercase"
                          htmlFor={BOX_PRESET_ID}
                        >
                          Box Preset
                        </label>
                        <select
                          className="w-full bg-background border border-gold/10 rounded p-1.5 text-xs text-foreground focus:outline-none focus:border-gold"
                          id={BOX_PRESET_ID}
                          value={boxPreset}
                          onChange={(e) => handlePresetChange(e.target.value)}
                        >
                          {BOX_PRESETS.map((preset) => (
                            <option key={preset.id} value={preset.id}>
                              {preset.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Dimensions Grid */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label
                            className="text-[10px] text-muted-foreground uppercase"
                            htmlFor={PACKAGE_LENGTH_ID}
                          >
                            Length (in)
                          </label>
                          <Input
                            className="h-8 text-xs border-gold/10 focus-visible:ring-gold"
                            disabled={boxPreset !== "custom"}
                            id={PACKAGE_LENGTH_ID}
                            type="number"
                            value={length}
                            onChange={(e) => setLength(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label
                            className="text-[10px] text-muted-foreground uppercase"
                            htmlFor={PACKAGE_WIDTH_ID}
                          >
                            Width (in)
                          </label>
                          <Input
                            className="h-8 text-xs border-gold/10 focus-visible:ring-gold"
                            disabled={boxPreset !== "custom"}
                            id={PACKAGE_WIDTH_ID}
                            type="number"
                            value={width}
                            onChange={(e) => setWidth(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label
                            className="text-[10px] text-muted-foreground uppercase"
                            htmlFor={PACKAGE_HEIGHT_ID}
                          >
                            Height (in)
                          </label>
                          <Input
                            className="h-8 text-xs border-gold/10 focus-visible:ring-gold"
                            disabled={boxPreset !== "custom"}
                            id={PACKAGE_HEIGHT_ID}
                            type="number"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Scale Weight */}
                      <div className="space-y-1">
                        <label
                          className="text-[11px] font-medium text-muted-foreground uppercase flex items-center justify-between"
                          htmlFor={PACKAGE_WEIGHT_ID}
                        >
                          <span>Scale Weight (oz)</span>
                          <span className="text-[10px] text-gold font-mono">
                            16 oz = 1 lb
                          </span>
                        </label>
                        <div className="relative">
                          <Input
                            className="h-9 text-xs border-gold/10 pr-8 focus-visible:ring-gold"
                            id={PACKAGE_WEIGHT_ID}
                            step="0.1"
                            type="number"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-mono">
                            oz
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-gold/30 text-gold hover:bg-gold/10 text-xs h-9"
                        onClick={() =>
                          getRatesMutation.mutate({
                            height: Number.parseFloat(height),
                            length: Number.parseFloat(length),
                            orderId: order.id,
                            weight: Number.parseFloat(weight),
                            width: Number.parseFloat(width),
                          })
                        }
                        disabled={getRatesMutation.isPending}
                      >
                        <Calculator className="mr-1.5 h-3.5 w-3.5" />
                        {getRatesMutation.isPending
                          ? "Calculating..."
                          : "Weigh & Calculate Rates"}
                      </Button>

                      {/* Display Rates */}
                      {rates.length > 0 && (
                        <div className="space-y-2.5 pt-2 border-t border-gold/5">
                          <p className="text-[11px] font-semibold text-gold uppercase tracking-wider">
                            Select USPS Rate:
                          </p>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {rates.map((rate) => (
                              <label
                                key={rate.objectId}
                                className={`flex items-center justify-between p-2 border rounded-lg cursor-pointer transition-all ${
                                  selectedRateId === rate.objectId
                                    ? "bg-gold/10 border-gold"
                                    : "border-gold/5 bg-background hover:bg-gold/5"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="shipping_rate"
                                    value={rate.objectId}
                                    checked={selectedRateId === rate.objectId}
                                    onChange={() =>
                                      setSelectedRateId(rate.objectId)
                                    }
                                    className="accent-gold h-3.5 w-3.5"
                                  />
                                  <div className="text-left">
                                    <p className="text-xs font-semibold">
                                      {rate.servicelevel.name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-mono">
                                      {rate.durationTerms}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-xs font-mono font-bold text-gold">
                                  ${rate.amount}
                                </span>
                              </label>
                            ))}
                          </div>

                          <Button
                            className="w-full bg-gold hover:bg-gold-dark text-primary-foreground font-medium text-xs mt-2"
                            onClick={() =>
                              purchaseLabelMutation.mutate({
                                orderId: order.id,
                                rateObjectId: selectedRateId,
                              })
                            }
                            disabled={
                              purchaseLabelMutation.isPending || !selectedRateId
                            }
                          >
                            <Printer className="mr-1.5 h-3.5 w-3.5" />
                            {purchaseLabelMutation.isPending
                              ? "Purchasing Label..."
                              : "Buy & Print USPS Label"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {order.status === "ready_for_pickup" && (
                <div className="space-y-3">
                  <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg text-xs flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-500">
                        Ready for pickup
                      </p>
                      <p className="text-muted-foreground">
                        The customer has been notified to pick up their package.
                      </p>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
                    onClick={() => handleStatusChange("completed")}
                    disabled={updateStatusMutation.isPending}
                  >
                    Complete Order (Picked Up)
                  </Button>
                </div>
              )}

              {order.status === "shipped" && (
                <div className="space-y-4">
                  <div className="p-4 bg-gold/5 border border-gold/10 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gold">
                      <Truck className="h-4 w-4" />
                      <span>Shipped via {order.carrier || "USPS"}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-muted-foreground">
                        Tracking Number
                      </p>
                      <p className="text-xs font-mono font-semibold select-all bg-background border border-gold/5 rounded p-1.5 text-center">
                        {order.trackingNumber}
                      </p>
                    </div>

                    {order.shippingLabelUrl && (
                      <Button
                        asChild
                        className="w-full bg-gold hover:bg-gold-dark text-primary-foreground font-medium text-xs"
                      >
                        <a
                          href={order.shippingLabelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
                          Shipping Label
                        </a>
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs"
                      onClick={() =>
                        refundLabelMutation.mutate({ orderId: order.id })
                      }
                      disabled={refundLabelMutation.isPending}
                    >
                      <RotateCcw className="mr-1 h-3.5 w-3.5" /> Void Label
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white font-medium text-xs"
                      onClick={() => handleStatusChange("completed")}
                      disabled={updateStatusMutation.isPending}
                    >
                      Complete Order
                    </Button>
                  </div>
                </div>
              )}

              {(order.status === "completed" ||
                order.status === "cancelled") && (
                <div className="p-3 bg-muted border border-gold/5 rounded-lg text-xs text-center text-muted-foreground">
                  This order is{" "}
                  <span className="font-semibold text-foreground uppercase">
                    {order.status}
                  </span>
                  . No further actions are needed.
                </div>
              )}

              {order.status !== "completed" &&
                order.status !== "cancelled" &&
                order.status !== "shipped" && (
                  <Button
                    variant="outline"
                    className="w-full border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs"
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
                <DollarSign className="h-4 w-4 text-gold" /> Admin Notes
              </h3>
              <Textarea
                placeholder="Add notes about alterations, alterations tracking, pickup codes, etc."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
              />
              <Button
                variant="outline"
                className="w-full border-gold/20 text-gold hover:bg-gold/10 text-xs"
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
