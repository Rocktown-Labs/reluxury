import { Badge } from "@reluxury/ui/components/badge";
import { Button } from "@reluxury/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@reluxury/ui/components/sheet";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu } from "lucide-react";
import { useEffect, useState } from "react";

import { getCart } from "@/functions/cart";
import { authClient } from "@/lib/auth-client";
import { getGuestCartCount } from "@/lib/guest-cart";

import UserMenu from "./user-menu";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Workshops", to: "/events" },
  { label: "Alterations", to: "/alterations" },
  { label: "About", to: "/about" },
] as const;

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const [guestCount, setGuestCount] = useState(0);

  const { data: serverCart } = useQuery({
    enabled: !!session,
    queryFn: () => getCart(),
    queryKey: ["cart-count"],
  });

  useEffect(() => {
    if (session) {
      setGuestCount(0);
      return;
    }
    const update = () => setGuestCount(getGuestCartCount());
    update();
    window.addEventListener("focus", update);
    window.addEventListener("reluxury-cart-changed", update);
    return () => {
      window.removeEventListener("focus", update);
      window.removeEventListener("reluxury-cart-changed", update);
    };
  }, [session]);

  let serverCount = 0;
  if (serverCart) {
    for (const item of serverCart) {
      serverCount += item.quantity;
    }
  }
  const cartCount = session ? serverCount : guestCount;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gold/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Mobile Menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-foreground hover:text-gold"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[300px] border-gold/10 bg-background shadow-2xl shadow-black/80"
          >
            <div className="flex flex-col gap-6 mt-8">
              <Link
                to="/"
                className="flex items-center"
                onClick={() => setMobileOpen(false)}
              >
                <span className="font-display text-2xl font-semibold tracking-wide text-gold">
                  ReLUXURY
                </span>
              </Link>
              <nav className="flex flex-col gap-4">
                {NAV_LINKS.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className="text-lg font-medium text-foreground/80 hover:text-gold transition-colors"
                    activeProps={{ className: "text-gold" }}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="font-display text-2xl font-semibold tracking-[0.15em] text-gold">
            ReLUXURY
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-sm font-medium uppercase tracking-[0.1em] text-foreground/70 hover:text-gold transition-colors duration-300"
              activeProps={{ className: "text-gold" }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link to="/cart">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-foreground hover:text-gold"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="sr-only">Cart</span>
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-gold text-primary-foreground border-0">
                  {cartCount > 99 ? "99+" : cartCount}
                </Badge>
              )}
            </Button>
          </Link>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
