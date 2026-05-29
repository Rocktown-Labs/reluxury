import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Crown, MapPin, Phone, Clock, Instagram } from "lucide-react";

import { footerContactQueryOptions } from "@/lib/queries";

export default function Footer() {
  const { data: contact } = useQuery(footerContactQueryOptions());
  const address =
    contact?.address ?? "14217 Corvallis Rd, Ste F\nMaumelle, AR 72113";
  const phone = contact?.phone ?? "(501) 404-8696";
  const hours =
    contact?.hours ?? "Tue–Fri: 10am–6pm\nSat: 10am–5pm\nSun–Mon: Closed";

  return (
    <footer className="border-t border-gold/10 bg-card">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-gold" />
              <span className="font-display text-xl font-semibold tracking-[0.15em] text-gold">
                ReLUXURY
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Elevated Resale and Alterations. Consignment Boutique. Discover
              curated pre-loved luxury fashion and expert tailoring services.
            </p>
            <div className="flex gap-3">
              <a
                href="https://instagram.com/reluxury_cra"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-gold transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-medium text-foreground">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {[
                { label: "Shop All", to: "/shop" },
                { label: "Workshops & Classes", to: "/events" },
                { label: "Alterations", to: "/alterations" },
                { label: "About Us", to: "/about" },
                { label: "My Account", to: "/dashboard" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-medium text-foreground">
              Contact
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 text-gold shrink-0" />
                <span className="whitespace-pre-line">{address}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-gold shrink-0" />
                <a
                  href={`tel:${phone.replaceAll(/\D/g, "")}`}
                  className="hover:text-gold transition-colors"
                >
                  {phone}
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mt-0.5 text-gold shrink-0" />
                <span className="whitespace-pre-line">{hours}</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-medium text-foreground">
              Stay Connected
            </h4>
            <p className="text-sm text-muted-foreground">
              Follow us on Instagram @reluxury_cra for the latest arrivals,
              workshops, and behind-the-scenes content.
            </p>
            <a
              href="https://instagram.com/reluxury_cra"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors"
            >
              <Instagram className="h-4 w-4" />
              @reluxury_cra
            </a>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gold/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} ReLUXURY Consignment & Alterations
            Boutique. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/60">
            EST. 2025 &middot; Maumelle, Arkansas
          </p>
        </div>
      </div>
    </footer>
  );
}
