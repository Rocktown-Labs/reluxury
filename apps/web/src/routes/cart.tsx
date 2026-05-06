import { Button } from "@reluxury/ui/components/button";
import { Separator } from "@reluxury/ui/components/separator";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { getCart, updateCartItem, removeFromCart } from "@/functions/cart";

export const Route = createFileRoute("/cart")({
  component: CartComponent,
  loader: async () => ({ cartItems: await getCart() }),
});

function CartComponent() {
  const { cartItems } = Route.useLoaderData();
  const router = useRouter();

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

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      await updateCartItem({ data: { itemId, quantity } });
      await router.invalidate();
    } catch {
      toast.error("Failed to update quantity");
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await removeFromCart({ data: itemId });
      await router.invalidate();
      toast.success("Item removed");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-20">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gold/10 flex items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-gold" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl text-foreground">
              Your Cart is Empty
            </h1>
            <p className="text-muted-foreground">
              Discover something beautiful in our shop.
            </p>
          </div>
          <Link to="/shop">
            <Button className="bg-gold text-primary-foreground hover:bg-gold-dark gap-2">
              Continue Shopping <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">
      <h1 className="font-display text-3xl font-light text-foreground mb-8">
        Shopping Cart
      </h1>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {cartItems.map(
            (item: {
              id: string;
              product: {
                title: string;
                slug: string;
                images: { url: string }[];
                salePrice: number | null;
                price: number;
              };
              quantity: number;
              size: string | null;
            }) => {
              const price = item.product.salePrice ?? item.product.price;
              return (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 rounded-xl border border-gold/10 bg-card"
                >
                  <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-muted">
                    {item.product.images[0] ? (
                      <img
                        src={item.product.images[0].url}
                        alt={item.product.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <span className="font-display text-xl text-gold/20">
                          R
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link
                          to="/shop/$slug"
                          params={{ slug: item.product.slug }}
                        >
                          <h3 className="font-medium text-foreground hover:text-gold transition-colors line-clamp-1">
                            {item.product.title}
                          </h3>
                        </Link>
                        {item.size && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Size: {item.size}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="w-8 h-8 rounded-md border border-gold/10 flex items-center justify-center text-muted-foreground hover:border-gold/30 transition-colors"
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          className="w-8 h-8 rounded-md border border-gold/10 flex items-center justify-center text-muted-foreground hover:border-gold/30 transition-colors"
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="font-semibold text-gold">
                        ${(price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-gold/10 bg-card space-y-4">
            <h2 className="font-display text-xl text-foreground">
              Order Summary
            </h2>
            <Separator className="bg-gold/10" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-muted-foreground">
                  Calculated at checkout
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="text-muted-foreground">
                  Calculated at checkout
                </span>
              </div>
            </div>

            <Separator className="bg-gold/10" />

            <div className="flex justify-between">
              <span className="font-medium text-foreground">Total</span>
              <span className="font-semibold text-gold text-lg">
                ${subtotal.toFixed(2)}
              </span>
            </div>

            <Link to="/checkout">
              <Button className="w-full bg-gold text-primary-foreground hover:bg-gold-dark mt-2">
                Proceed to Checkout
              </Button>
            </Link>

            <Link to="/shop">
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-gold"
              >
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
