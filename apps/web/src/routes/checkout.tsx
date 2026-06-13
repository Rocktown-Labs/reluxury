/* oxlint-disable no-use-before-define, no-array-reduce, func-style */
import { Button } from "@reluxury/ui/components/button";
import { Input } from "@reluxury/ui/components/input";
import { Label } from "@reluxury/ui/components/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@reluxury/ui/components/radio-group";
import { Separator } from "@reluxury/ui/components/separator";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Truck, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { getCart } from "@/functions/cart";
import { createOrder, getCheckoutShippingRates } from "@/functions/orders";
import { getProductsByIds } from "@/functions/store";
import { authClient } from "@/lib/auth-client";
import { getGuestCart, clearGuestCart } from "@/lib/guest-cart";
import { queryClient } from "@/lib/query-client";
import type { ShippoRate } from "@/lib/shippo";

export const Route = createFileRoute("/checkout")({
  component: CheckoutComponent,
  loader: async () => {
    const cartItems = await getCart();
    return { cartItems };
  },
});

interface CheckoutItem {
  id: string;
  product: {
    title: string;
    images: { url: string }[];
    salePrice: number | null;
    price: number;
  };
  quantity: number;
}

function CheckoutComponent() {
  const { cartItems: serverCartItems } = Route.useLoaderData();
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "shipping">(
    "pickup"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [shippingRates, setShippingRates] = useState<ShippoRate[]>([]);
  const [selectedRateId, setSelectedRateId] = useState("");
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    email: "",
    name: "",
    phone: "",
    state: "",
    zip: "",
  });

  const [guestItems, setGuestItems] = useState<CheckoutItem[]>([]);
  const [isLoadingGuest, setIsLoadingGuest] = useState(true);

  useEffect(() => {
    if (session) {
      setGuestItems([]);
      setIsLoadingGuest(false);
      return;
    }

    const raw = getGuestCart();
    if (raw.length === 0) {
      setGuestItems([]);
      setIsLoadingGuest(false);
      return;
    }

    const ids = raw.map((item) => item.productId);
    (async () => {
      try {
        const products = await getProductsByIds({ data: ids });
        const merged: CheckoutItem[] = [];
        for (const item of raw) {
          const product = products.find((p) => p.id === item.productId);
          if (!product) {
            continue;
          }
          merged.push({
            id: `${item.productId}-${item.size ?? "no-size"}`,
            product: {
              images: product.images ?? [],
              price: product.price,
              salePrice: product.salePrice,
              title: product.title,
            },
            quantity: item.quantity,
          });
        }
        setGuestItems(merged);
      } catch {
        toast.error("Failed to load cart");
      } finally {
        setIsLoadingGuest(false);
      }
    })();
  }, [session]);

  const cartItems = session ? serverCartItems : guestItems;

  let subtotal = 0;
  for (const item of cartItems) {
    const price = item.product.salePrice ?? item.product.price;
    subtotal += price * item.quantity;
  }

  const shippingCost = deliveryMethod === "shipping" ? 9.99 : 0;
  const selectedShippingRate = shippingRates.find(
    (rate) => rate.objectId === selectedRateId
  );
  const resolvedShippingCost =
    deliveryMethod === "shipping"
      ? Number(selectedShippingRate?.amount ?? shippingCost)
      : 0;
  const total = subtotal + resolvedShippingCost;

  const getShippingAddressPayload = () => ({
    address: formData.address,
    city: formData.city,
    email: formData.email,
    name: formData.name,
    phone: formData.phone || undefined,
    state: formData.state,
    zip: formData.zip,
  });

  const handleGetShippingRates = async () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.address ||
      !formData.city ||
      !formData.state ||
      !formData.zip
    ) {
      toast.error("Complete the shipping address to see delivery rates");
      return;
    }

    setIsLoadingRates(true);
    try {
      const result = await getCheckoutShippingRates({
        data: {
          guestItems: session
            ? undefined
            : getGuestCart().map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                size: item.size,
              })),
          shippingAddress: getShippingAddressPayload(),
        },
      });

      if (!result.success) {
        toast.error(
          result.messages.join(", ") || "Shipping address is invalid"
        );
        setShippingRates([]);
        setSelectedRateId("");
        return;
      }

      setShippingRates(result.rates);
      setSelectedRateId(result.rates[0]?.objectId ?? "");
      toast.success("Shipping rates updated");
    } catch {
      toast.error("Failed to retrieve shipping rates");
    } finally {
      setIsLoadingRates(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (
      deliveryMethod === "shipping" &&
      (!formData.address || !formData.city || !formData.state || !formData.zip)
    ) {
      toast.error("Please fill in your shipping address");
      return;
    }
    if (deliveryMethod === "shipping" && !selectedShippingRate) {
      toast.error("Please choose a shipping rate");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: {
        deliveryMethod: "pickup" | "shipping";
        email: string;
        name: string;
        phone?: string;
        selectedShippingRate?: {
          amount: string;
          objectId: string;
          provider: string;
          servicelevelName: string;
          shipmentObjectId?: string;
        };
        shippingAddress?: {
          address: string;
          city: string;
          email: string;
          name: string;
          phone?: string;
          state: string;
          zip: string;
        };
        guestItems?: {
          productId: string;
          quantity: number;
          size: string | null;
        }[];
      } = {
        deliveryMethod,
        email: formData.email,
        name: formData.name,
        phone: formData.phone || undefined,
        selectedShippingRate: selectedShippingRate
          ? {
              amount: selectedShippingRate.amount,
              objectId: selectedShippingRate.objectId,
              provider: selectedShippingRate.provider,
              servicelevelName: selectedShippingRate.servicelevel.name,
              shipmentObjectId: selectedShippingRate.shipmentObjectId,
            }
          : undefined,
        shippingAddress:
          deliveryMethod === "shipping"
            ? getShippingAddressPayload()
            : undefined,
      };

      if (!session) {
        payload.guestItems = getGuestCart().map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
        }));
      }

      const result = await createOrder({ data: payload });
      setOrderNumber(result.orderNumber);
      setOrderComplete(true);

      clearGuestCart();
      setGuestItems([]);
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      await queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      await router.invalidate({ sync: true });
    } catch {
      toast.error("Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gold/10 flex items-center justify-center">
            <span className="font-display text-3xl text-gold">R</span>
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl text-foreground">
              Order Confirmed
            </h1>
            <p className="text-muted-foreground">
              Thank you for your order! We will send you an email confirmation
              shortly.
            </p>
            <p className="text-sm text-gold font-medium">
              Order #{orderNumber}
            </p>
          </div>
          <Link to="/shop">
            <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!session && isLoadingGuest) {
    return (
      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">
        <p className="text-muted-foreground">Loading cart...</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl text-foreground mb-4">
          Your cart is empty
        </h1>
        <Link to="/shop">
          <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">
      <Link
        to="/cart"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cart
      </Link>

      <h1 className="font-display text-3xl font-light text-foreground mb-8">
        Checkout
      </h1>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Contact Info */}
          <div className="p-6 rounded-xl border border-gold/10 bg-card space-y-4">
            <h2 className="font-display text-lg text-foreground">
              Contact Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-background border-gold/10"
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="bg-background border-gold/10"
                  placeholder="jane@example.com"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="bg-background border-gold/10"
                  placeholder="(501) 404-8696"
                />
              </div>
            </div>
          </div>

          {/* Delivery Method */}
          <div className="p-6 rounded-xl border border-gold/10 bg-card space-y-4">
            <h2 className="font-display text-lg text-foreground">
              Delivery Method
            </h2>
            <RadioGroup
              value={deliveryMethod}
              onValueChange={(v) =>
                setDeliveryMethod(v as "pickup" | "shipping")
              }
            >
              <div
                className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${deliveryMethod === "pickup" ? "border-gold bg-gold/5" : "border-gold/10"}`}
              >
                <RadioGroupItem value="pickup" id="pickup" />
                <div className="flex-1">
                  <Label
                    htmlFor="pickup"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <MapPin className="h-4 w-4 text-gold" />
                    <span className="font-medium">In-Store Pickup</span>
                    <span className="ml-auto text-gold font-medium">Free</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1 ml-6">
                    Pick up your order at our boutique during business hours.
                    <br />
                    14217 Corvallis Rd, Ste F, Maumelle, AR 72113
                  </p>
                </div>
              </div>
              <div
                className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${deliveryMethod === "shipping" ? "border-gold bg-gold/5" : "border-gold/10"}`}
              >
                <RadioGroupItem value="shipping" id="shipping" />
                <div className="flex-1">
                  <Label
                    htmlFor="shipping"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Truck className="h-4 w-4 text-gold" />
                    <span className="font-medium">Shipping</span>
                    <span className="ml-auto text-muted-foreground">$9.99</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1 ml-6">
                    Standard delivery to your address.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Shipping Address */}
          {deliveryMethod === "shipping" && (
            <div className="p-6 rounded-xl border border-gold/10 bg-card space-y-4">
              <h2 className="font-display text-lg text-foreground">
                Shipping Address
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value });
                      setShippingRates([]);
                      setSelectedRateId("");
                    }}
                    className="bg-background border-gold/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => {
                      setFormData({ ...formData, city: e.target.value });
                      setShippingRates([]);
                      setSelectedRateId("");
                    }}
                    className="bg-background border-gold/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => {
                      setFormData({ ...formData, state: e.target.value });
                      setShippingRates([]);
                      setSelectedRateId("");
                    }}
                    className="bg-background border-gold/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code *</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => {
                      setFormData({ ...formData, zip: e.target.value });
                      setSelectedRateId("");
                      setShippingRates([]);
                    }}
                    className="bg-background border-gold/10"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                className="border-gold/20 text-gold hover:bg-gold/10"
                disabled={isLoadingRates}
                onClick={handleGetShippingRates}
              >
                {isLoadingRates ? "Checking Rates..." : "Check Shipping Rates"}
              </Button>
              {shippingRates.length > 0 && (
                <RadioGroup
                  value={selectedRateId}
                  onValueChange={setSelectedRateId}
                  className="space-y-2"
                >
                  {shippingRates.map((rate) => (
                    <div
                      key={rate.objectId}
                      className={`flex items-center gap-3 rounded-lg border p-3 ${selectedRateId === rate.objectId ? "border-gold bg-gold/5" : "border-gold/10"}`}
                    >
                      <RadioGroupItem
                        value={rate.objectId}
                        id={`rate-${rate.objectId}`}
                      />
                      <Label
                        htmlFor={`rate-${rate.objectId}`}
                        className="flex flex-1 cursor-pointer items-center justify-between gap-3"
                      >
                        <span>
                          <span className="block text-sm font-medium">
                            {rate.provider} {rate.servicelevel.name}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {rate.durationTerms || "Delivery estimate varies"}
                          </span>
                        </span>
                        <span className="font-mono text-sm text-gold">
                          ${Number(rate.amount).toFixed(2)}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          )}

          {/* Payment (Mock) */}
          <div className="p-6 rounded-xl border border-gold/10 bg-card space-y-4">
            <h2 className="font-display text-lg text-foreground">Payment</h2>
            <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed border-gold/20 bg-gold/5">
              <CreditCard className="h-5 w-5 text-gold" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Secure Payment
                </p>
                <p className="text-xs text-muted-foreground">
                  Payment processing will be integrated soon. For now, orders
                  are created for review.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-gold/10 bg-card space-y-4">
            <h2 className="font-display text-xl text-foreground">
              Order Summary
            </h2>
            <Separator className="bg-gold/10" />

            <div className="space-y-3">
              {cartItems.map(
                (item: {
                  id: string;
                  product: {
                    title: string;
                    images: { url: string }[];
                    salePrice: number | null;
                    price: number;
                  };
                  quantity: number;
                }) => {
                  const price = item.product.salePrice ?? item.product.price;
                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted">
                        {item.product.images[0] ? (
                          <img
                            src={item.product.images[0].url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <span className="font-display text-sm text-gold/20">
                              R
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {item.product.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm text-gold">
                        ${(price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  );
                }
              )}
            </div>

            <Separator className="bg-gold/10" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-foreground">
                  ${resolvedShippingCost.toFixed(2)}
                </span>
              </div>
            </div>

            <Separator className="bg-gold/10" />

            <div className="flex justify-between">
              <span className="font-medium text-foreground">Total</span>
              <span className="font-semibold text-gold text-lg">
                ${total.toFixed(2)}
              </span>
            </div>

            <Button
              className="w-full bg-gold text-primary-foreground hover:bg-gold-dark"
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Processing..." : "Place Order"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
