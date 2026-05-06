import { Button } from "@reluxury/ui/components/button";
import { Input } from "@reluxury/ui/components/input";
import { Label } from "@reluxury/ui/components/label";
import { Textarea } from "@reluxury/ui/components/textarea";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle, Clock, MapPin, Phone, Scissors } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { createAlterationBooking } from "@/functions/alterations";
import { authClient } from "@/lib/auth-client";

const SERVICE_TYPES = [
  "Hemming",
  "Resizing",
  "Repairs",
  "Custom Tailoring",
  "Zipper Replacement",
  "Button Replacement",
  "Dress Alterations",
  "Suit Alterations",
  "Other",
] as const;

const TIME_SLOTS = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
] as const;

export const Route = createFileRoute("/alterations")({
  component: AlterationsComponent,
});

function AlterationsComponent() {
  const { data: session } = authClient.useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    itemDescription: "",
    notes: "",
    preferredDate: "",
    preferredTime: "",
    serviceType: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("Please sign in to book an alteration");
      return;
    }
    if (
      !formData.serviceType ||
      !formData.itemDescription ||
      !formData.preferredDate
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await createAlterationBooking({
        data: {
          itemDescription: formData.itemDescription,
          notes: formData.notes || undefined,
          preferredDate: new Date(formData.preferredDate).toISOString(),
          preferredTime: formData.preferredTime || undefined,
          serviceType: formData.serviceType,
        },
      });
      toast.success("Booking request submitted! We'll contact you to confirm.");
      setFormData({
        itemDescription: "",
        notes: "",
        preferredDate: "",
        preferredTime: "",
        serviceType: "",
      });
    } catch {
      toast.error("Failed to submit booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-20 bg-card border-b border-gold/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--gold)_0%,_transparent_60%)] opacity-[0.05]" />
        <div className="container mx-auto max-w-7xl px-4 lg:px-8 relative text-center space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
            Expert Craftsmanship
          </p>
          <h1 className="font-display text-4xl lg:text-5xl font-light text-foreground">
            Alterations & Tailoring
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From simple hems to complete restyling, our experienced team ensures
            every garment fits you perfectly.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="font-display text-2xl text-foreground">
                Our Services
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {SERVICE_TYPES.map((service) => (
                  <div
                    key={service}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle className="h-3.5 w-3.5 text-gold shrink-0" />
                    {service}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-xl border border-gold/10 bg-card space-y-4">
              <h3 className="font-display text-lg text-foreground">
                Visit Our Studio
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    14217 Corvallis Rd, Ste F<br />
                    Maumelle, AR 72113
                  </span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Clock className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    Tue–Fri: 10am–6pm
                    <br />
                    Sat: 10am–5pm
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-gold shrink-0" />
                  <a
                    href="tel:5014048696"
                    className="text-muted-foreground hover:text-gold transition-colors"
                  >
                    (501) 404-8696
                  </a>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-gold/10 bg-card space-y-3">
              <h3 className="font-display text-lg text-foreground">Pricing</h3>
              <p className="text-sm text-muted-foreground">
                Pricing varies based on the complexity of the alteration. We
                provide estimates after evaluating your garment. Simple hems
                start at $15.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="font-display text-2xl text-foreground">
                Book an Appointment
              </h2>
              <p className="text-muted-foreground text-sm">
                Fill out the form below and we'll contact you to confirm your
                appointment.
              </p>
            </div>

            {!session && (
              <div className="p-4 rounded-lg border border-gold/10 bg-gold/5 text-sm text-muted-foreground">
                Please{" "}
                <Link to="/login" className="text-gold hover:underline">
                  sign in
                </Link>{" "}
                to book an alteration.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type *</Label>
                <select
                  id="serviceType"
                  value={formData.serviceType}
                  onChange={(e) =>
                    setFormData({ ...formData, serviceType: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-gold/10 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20"
                  required
                >
                  <option value="">Select a service</option>
                  {SERVICE_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemDescription">Item Description *</Label>
                <Textarea
                  id="itemDescription"
                  value={formData.itemDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      itemDescription: e.target.value,
                    })
                  }
                  placeholder="Describe the item(s) and what alterations you need..."
                  className="min-h-[100px] border-gold/10 bg-background"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preferredDate">Preferred Date *</Label>
                  <Input
                    id="preferredDate"
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferredDate: e.target.value,
                      })
                    }
                    className="border-gold/10 bg-background"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredTime">Preferred Time</Label>
                  <select
                    id="preferredTime"
                    value={formData.preferredTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferredTime: e.target.value,
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-gold/10 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20"
                  >
                    <option value="">Select time</option>
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Any special requests or details..."
                  className="border-gold/10 bg-background"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gold text-primary-foreground hover:bg-gold-dark gap-2"
                disabled={isSubmitting || !session}
              >
                <Scissors className="h-4 w-4" />
                {isSubmitting ? "Submitting..." : "Request Appointment"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
