import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Clock, Phone, Instagram, Heart, Sparkles } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: AboutComponent,
});

function AboutComponent() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-20 bg-card border-b border-gold/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--gold)_0%,_transparent_60%)] opacity-[0.05]" />
        <div className="container mx-auto max-w-7xl px-4 lg:px-8 relative text-center space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
            Our Story
          </p>
          <h1 className="font-display text-4xl lg:text-5xl font-light text-foreground">
            About ReLUXURY
          </h1>
        </div>
      </section>

      <div className="container mx-auto max-w-4xl px-4 lg:px-8 py-16 space-y-16">
        {/* Story */}
        <div className="space-y-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-full border-2 border-gold/30 flex items-center justify-center">
            <span className="font-display text-3xl text-gold">R</span>
          </div>
          <h2 className="font-display text-3xl text-foreground">
            Elevated Resale & Alterations
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            ReLUXURY was founded in 2025 with a simple mission: to make luxury
            fashion accessible while promoting sustainable consumption. We
            believe that beautiful clothing deserves a second life, and that
            every person deserves to feel confident in what they wear.
          </p>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Located in Maumelle, Arkansas, our boutique offers carefully curated
            consignment pieces alongside expert alteration services. Whether
            you're hunting for a hidden gem or need the perfect fit, we're here
            to elevate your wardrobe.
          </p>
        </div>

        {/* Values */}
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              description:
                "Every piece is hand-selected, authenticated, and quality-checked before it reaches our racks.",
              icon: Heart,
              title: "Curated Quality",
            },
            {
              description:
                "By giving pre-loved fashion a second life, we're reducing waste and making luxury accessible.",
              icon: Sparkles,
              title: "Sustainable Luxury",
            },
            {
              description:
                "We're proud to be part of the Maumelle community, hosting events and supporting local makers.",
              icon: MapPin,
              title: "Community First",
            },
          ].map((value) => (
            <div key={value.title} className="text-center space-y-4 p-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-gold/10 flex items-center justify-center">
                <value.icon className="h-5 w-5 text-gold" />
              </div>
              <h3 className="font-display text-xl text-foreground">
                {value.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="p-8 rounded-2xl border border-gold/10 bg-card space-y-6">
          <h2 className="font-display text-2xl text-foreground text-center">
            Visit Us
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <MapPin className="h-5 w-5 text-gold" />
              <p className="text-sm text-muted-foreground">
                14217 Corvallis Rd, Ste F<br />
                Maumelle, AR 72113
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <Clock className="h-5 w-5 text-gold" />
              <p className="text-sm text-muted-foreground">
                Tue–Fri: 10am–6pm
                <br />
                Sat: 10am–5pm
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <Phone className="h-5 w-5 text-gold" />
              <a
                href="tel:5014048696"
                className="text-sm text-muted-foreground hover:text-gold transition-colors"
              >
                (501) 404-8696
              </a>
            </div>
          </div>
          <div className="text-center pt-4">
            <a
              href="https://instagram.com/reluxury_cra"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors"
            >
              <Instagram className="h-4 w-4" />
              Follow us @reluxury_cra
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
