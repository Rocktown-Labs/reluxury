/* oxlint-disable no-use-before-define, no-array-reduce, func-style */
import { Button } from "@reluxury/ui/components/button";
import { Input } from "@reluxury/ui/components/input";
import { Label } from "@reluxury/ui/components/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@reluxury/ui/components/radio-group";
import { Separator } from "@reluxury/ui/components/separator";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Truck, CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getCart } from "@/functions/cart";
import { createOrder } from "@/functions/orders";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/checkout")({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
  },
  component: CheckoutComponent,
  loader: async () => {
    const cartItems = await getCart();
    return { cartItems };
  },
});

function CheckoutComponent() {
  const { cartItems } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "shipping">(
    "pickup"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    email: "",
    name: "",
    phone: "",
    state: "",
    zip: "",
  });

  const subtotal = cartItems.reduce(
    (
      sum: number,
      item: {
        product: { salePrice: number | null; price: number };
        quantity: number;
      }
    ) => {
      const price = item.product.salePrice ?? item.product.price;
      return sum + price * item.quantity;
    },
    0
  );

  const shippingCost = deliveryMethod === "shipping" ? 9.99 : 0;
  const total = subtotal + shippingCost;

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

    setIsSubmitting(true);
    try {
      await createOrder({
        data: {
          deliveryMethod,
          email: formData.email,
          name: formData.name,
          phone: formData.phone || undefined,
          shippingAddress: deliveryMethod === "shipping" ? formData : undefined,
        },
      });
      toast.success("Order placed successfully!");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="bg-background border-gold/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="bg-background border-gold/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    className="bg-background border-gold/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code *</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) =>
                      setFormData({ ...formData, zip: e.target.value })
                    }
                    className="bg-background border-gold/10"
                  />
                </div>
              </div>
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
                  ${shippingCost.toFixed(2)}
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
