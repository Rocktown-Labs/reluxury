/* oxlint-disable no-use-before-define, func-style */
import { Button } from "@reluxury/ui/components/button";
import { SkeletonEventCard } from "@reluxury/ui/components/skeleton-event-card";
import { SkeletonGrid } from "@reluxury/ui/components/skeleton-grid";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Sparkles,
  Scissors,
  Calendar,
  ShoppingBag,
} from "lucide-react";

import EventCard from "@/components/event-card";
import ProductCard from "@/components/product-card";
import {
  getFeaturedProducts,
  getNewArrivals,
  getEvents,
  getPromotions,
} from "@/functions/store";
import {
  featuredProductsQueryOptions,
  newArrivalsQueryOptions,
  eventsQueryOptions,
  promotionsQueryOptions,
} from "@/lib/queries";
import { getDateValue, isUpcomingWorkshop } from "@/lib/workshops";

export const Route = createFileRoute("/")({
  component: HomeComponent,
  loader: async () => ({
    events: await getEvents(),
    featured: await getFeaturedProducts(),
    newArrivals: await getNewArrivals(),
    promotions: await getPromotions({ data: "homepage" }),
  }),
});

function HomeComponent() {
  const loaderData = Route.useLoaderData();

  const { data: featured, isLoading: featuredLoading } = useQuery({
    ...featuredProductsQueryOptions(),
    initialData: loaderData.featured,
  });

  const { data: newArrivals, isLoading: newArrivalsLoading } = useQuery({
    ...newArrivalsQueryOptions(),
    initialData: loaderData.newArrivals,
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    ...eventsQueryOptions(),
    initialData: loaderData.events,
  });

  const { data: promotions, isLoading: promotionsLoading } = useQuery({
    ...promotionsQueryOptions("homepage"),
    initialData: loaderData.promotions,
  });

  const upcomingWorkshops = [...(events ?? [])]
    .filter((event) => isUpcomingWorkshop(event.startDate))
    .toSorted(
      (a, b) =>
        (getDateValue(a.startDate) ?? 0) - (getDateValue(b.startDate) ?? 0)
    );

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-card">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--gold)_0%,_transparent_50%)] opacity-[0.07]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--gold)_0%,_transparent_50%)] opacity-[0.05]" />

        <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-20 lg:py-28 relative">
          <div className="max-w-3xl mx-auto text-center space-y-10">
            <div className="space-y-6">
              <h1 className="font-display text-5xl lg:text-7xl font-light leading-[1.1] tracking-tight">
                <span className="text-foreground">Where Luxury Finds</span>
                <br />
                <span className="gold-text-gradient font-medium">
                  Its Second Life
                </span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Curated pre-loved fashion, expert alterations, and hands-on
                sewing workshops — all under one roof.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/shop">
                <Button
                  size="lg"
                  className="bg-gold text-primary-foreground hover:bg-gold-dark gap-2 px-8"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Shop Collection
                </Button>
              </Link>
              <Link to="/events">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gold/20 text-gold hover:bg-gold/10 gap-2 px-8"
                >
                  <Calendar className="h-4 w-4" />
                  Upcoming Workshops
                </Button>
              </Link>
            </div>

            {/* Quick stats */}
            <div className="flex items-center justify-center gap-8 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                In-Store Pickup Available
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                Expert Alterations
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                Authenticated Pieces
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Promotions Banner */}
      {promotionsLoading
        ? null
        : promotions.length > 0 && (
            <section className="border-y border-gold/10 bg-gold/5">
              <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-4">
                <div className="flex flex-wrap items-center justify-center gap-6 text-center">
                  {promotions.map(
                    (promo: {
                      id: string;
                      title: string;
                      subtitle: string | null;
                    }) => (
                      <div
                        key={promo.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Sparkles className="h-4 w-4 text-gold shrink-0" />
                        <span className="text-gold font-medium">
                          {promo.title}
                        </span>
                        {promo.subtitle && (
                          <span className="text-muted-foreground">
                            {promo.subtitle}
                          </span>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            </section>
          )}

      {/* Featured Products — horizontal scroll all screens */}
      <section className="py-20">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
                Curated Selection
              </p>
              <h2 className="font-display text-3xl lg:text-4xl font-light text-foreground">
                Featured Pieces
              </h2>
            </div>
            <Link
              to="/shop"
              className="hidden sm:flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {featuredLoading ? (
            <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-[280px] shrink-0 snap-start">
                  <ProductCard product={null as never} />
                </div>
              ))}
            </div>
          ) : (
            <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-1">
              {featured.map((product) => (
                <div key={product.id} className="w-[280px] shrink-0 snap-start">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-card border-y border-gold/10">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-16 space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
              What We Offer
            </p>
            <h2 className="font-display text-3xl lg:text-4xl font-light text-foreground">
              Our Services
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-xl border border-gold/10 hover:border-gold/20 transition-colors text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/15 transition-colors">
                <ShoppingBag className="h-6 w-6 text-gold" />
              </div>
              <h3 className="font-display text-xl text-foreground">
                Consignment
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Shop curated pre-loved luxury fashion. Every piece is
                authenticated and quality-checked for your confidence.
              </p>
            </div>
            <div className="group p-8 rounded-xl border border-gold/10 hover:border-gold/20 transition-colors text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/15 transition-colors">
                <Scissors className="h-6 w-6 text-gold" />
              </div>
              <h3 className="font-display text-xl text-foreground">
                Alterations
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Expert tailoring and alterations to make every garment fit you
                perfectly. From hems to complete restyling.
              </p>
            </div>
            <div className="group p-8 rounded-xl border border-gold/10 hover:border-gold/20 transition-colors text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/15 transition-colors">
                <Calendar className="h-6 w-6 text-gold" />
              </div>
              <h3 className="font-display text-xl text-foreground">
                Workshops
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Join our sewing classes and fashion workshops. Learn new skills
                and connect with our creative community.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="rounded-2xl border border-gold/20 bg-card/80 p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
                  Tailoring Services
                </p>
                <h3 className="font-display text-2xl text-foreground">
                  Need Alterations After You Shop?
                </h3>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  From hems to complete restyling, our in-house tailoring keeps
                  every piece fitting perfectly after purchase.
                </p>
              </div>
              <Link to="/alterations">
                <Button
                  variant="outline"
                  className="border-gold/20 text-gold hover:bg-gold/10 gap-2"
                >
                  <Scissors className="h-4 w-4" />
                  Book Alteration Service
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals — 6 cards + View All on desktop, horizontal scroll on mobile */}
      <section className="py-20">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
                Just In
              </p>
              <h2 className="font-display text-3xl lg:text-4xl font-light text-foreground">
                New Arrivals
              </h2>
            </div>
            <Link
              to="/shop"
              className="hidden sm:flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {newArrivalsLoading ? (
            <SkeletonGrid count={6} horizontal />
          ) : (
            <>
              {/* Mobile: horizontal scroll */}
              <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-1 md:hidden">
                {newArrivals.map((product) => (
                  <div
                    key={product.id}
                    className="w-[280px] shrink-0 snap-start"
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
              {/* Desktop: 6 cards + View All CTA */}
              <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                {newArrivals.slice(0, 6).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
                <Link
                  to="/shop"
                  className="group flex flex-col items-center justify-center rounded-xl border border-gold/10 bg-card p-6 hover:border-gold/30 transition-colors min-h-[320px]"
                >
                  <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/15 transition-colors">
                    <ArrowRight className="h-6 w-6 text-gold" />
                  </div>
                  <p className="font-display text-lg text-foreground group-hover:text-gold transition-colors">
                    View All
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {newArrivals.length}+ items
                  </p>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Workshops — horizontal scroll all screens */}
      {upcomingWorkshops.length > 0 && (
        <section className="py-20 bg-card border-y border-gold/10">
          <div className="container mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
                  Coming Up
                </p>
                <h2 className="font-display text-3xl lg:text-4xl font-light text-foreground">
                  Upcoming Workshops
                </h2>
              </div>
              <Link
                to="/events"
                className="hidden sm:flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors"
              >
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {eventsLoading ? (
              <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="min-w-[20rem] snap-start">
                    <SkeletonEventCard />
                  </div>
                ))}
              </div>
            ) : (
              <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-1">
                {upcomingWorkshops.map((event) => (
                  <div
                    key={event.id}
                    className="min-w-[20rem] snap-start md:min-w-0 md:flex-1"
                  >
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Visit Us */}
      <section className="py-20">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
                  Visit Our Boutique
                </p>
                <h2 className="font-display text-3xl lg:text-4xl font-light text-foreground">
                  Experience ReLUXURY
                </h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Step into our thoughtfully curated space where luxury meets
                sustainability. Browse our latest arrivals, discuss alterations
                with our experts, or simply enjoy the ambiance of elevated
                resale.
              </p>
              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-gold" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Store Hours</p>
                    <p className="text-sm text-muted-foreground">
                      Tuesday – Friday: 10:00 AM – 6:00 PM
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Saturday: 10:00 AM – 5:00 PM
                    </p>
                    <p className="text-sm text-muted-foreground/60">
                      Sunday & Monday: Closed
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-xl border border-gold/10 bg-card flex items-center justify-center">
                <div className="text-center space-y-3">
                  <p className="font-display text-2xl text-gold">
                    14217 Corvallis Rd, Ste F
                  </p>
                  <p className="text-muted-foreground">Maumelle, AR 72113</p>
                  <a
                    href="tel:5014048696"
                    className="text-gold hover:text-gold-light transition-colors"
                  >
                    (501) 404-8696
                  </a>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 border border-gold/10 rounded-full -z-10" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
