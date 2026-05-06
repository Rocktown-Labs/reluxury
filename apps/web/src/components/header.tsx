import { Button } from "@reluxury/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@reluxury/ui/components/sheet";
import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu, Crown } from "lucide-react";
import { useState } from "react";

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
                className="flex items-center gap-2"
                onClick={() => setMobileOpen(false)}
              >
                <Crown className="h-6 w-6 text-gold" />
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
        <Link to="/" className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-gold hidden sm:block" />
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
            </Button>
          </Link>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
