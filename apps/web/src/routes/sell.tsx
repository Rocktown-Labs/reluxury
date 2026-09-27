import { Button } from "@reluxury/ui/components/button";
import { Input } from "@reluxury/ui/components/input";
import { Label } from "@reluxury/ui/components/label";
import { Textarea } from "@reluxury/ui/components/textarea";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
  submitIntake,
  uploadIntakePhoto,
} from "@/functions/intake";
import { validateConsignmentAddress } from "@/functions/address";
import { authClient } from "@/lib/auth-client";
import { formatPhoneNumber, optionalPhoneSchema } from "@/lib/phone";
import { categoriesQueryOptions } from "@/lib/queries";
import AddressAutocomplete from "@/components/address-autocomplete";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export const Route = createFileRoute("/sell")({
  component: SellComponent,
});

interface IntakeItemDraft {
  brand: string;
  category: string;
  condition: string;
  description: string;
  photos: string[];
}

const EMPTY_ITEM: IntakeItemDraft = {
  brand: "",
  category: "",
  condition: "good",
  description: "",
  photos: [],
};

const CONDITIONS = ["new", "like_new", "excellent", "good", "fair"];

const sellContactSchema = z.object({
  contactEmail: z.email("Enter a valid email address"),
  contactName: z.string().trim().min(1, "Full name is required"),
  phone: optionalPhoneSchema,
});

async function checkMailInAddress(input: {
  city: string;
  state: string;
  street: string;
  zip: string;
}): Promise<{ error?: string; notice?: string }> {
  if (!input.street || !input.city || !input.state || !input.zip) {
    return { error: "Add the address you will ship from" };
  }
  const validation = await validateConsignmentAddress({ data: input });
  if (!validation.success) {
    return { error: validation.message };
  }
  return validation.standardizedAddress
    ? { notice: validation.standardizedAddress }
    : {};
}

function readFileAsBase64(file: File): Promise<string> {
  // oxlint-disable-next-line promise/avoid-new
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("loadend", () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    });
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

function SellComponent() {
  const { data: session, isPending } = authClient.useSession();
  const { data: categories } = useQuery(categoriesQueryOptions());
  const [intakeType, setIntakeType] = useState<"dropoff" | "mailin">("dropoff");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [appointmentAt, setAppointmentAt] = useState("");
  const [shipAddress, setShipAddress] = useState("");
  const [shipCity, setShipCity] = useState("");
  const [shipState, setShipState] = useState("");
  const [shipZip, setShipZip] = useState("");
  const [items, setItems] = useState<IntakeItemDraft[]>([{ ...EMPTY_ITEM }]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [addressSearch, setAddressSearch] = useState("");
  const [addressNotice, setAddressNotice] = useState("");

  const totalPhotos = items.reduce((total, item) => total + item.photos.length, 0);

  const updateItem = (index: number, patch: Partial<IntakeItemDraft>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addItem = () => {
    if (items.length >= 20) {
      toast.error("Up to 20 items per submission");
      return;
    }
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePhotoSelect = async (
    index: number,
    files: FileList | null
  ) => {
    if (!files || files.length === 0) {
      return;
    }
    if (totalPhotos + files.length > 8) {
      toast.error("Up to 8 photos per submission");
      return;
    }
    setIsUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const base64 = await readFileAsBase64(file);
        const result = await uploadIntakePhoto({
          data: { base64, contentType: file.type, fileName: file.name },
        });
        urls.push(result.url);
      }
      updateItem(index, {
        photos: [...(items[index]?.photos ?? []), ...urls],
      });
    } catch {
      toast.error("Photo upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const contact = sellContactSchema.safeParse({
      contactEmail: contactEmail.trim(),
      contactName,
      phone: phone || undefined,
    });
    if (!contact.success) {
      toast.error(contact.error.issues[0]?.message ?? "Check your contact info");
      return;
    }
    if (phone && !/^\(\d{3}\) \d{3}-\d{4}$/.test(phone)) {
      toast.error("Enter a 10-digit phone number");
      return;
    }
    if (items.some((item) => !item.description.trim())) {
      toast.error("Describe every item");
      return;
    }
    if (intakeType === "dropoff" && !appointmentAt) {
      toast.error("Choose a drop-off appointment time");
      return;
    }
    if (intakeType === "mailin") {
      const checked = await checkMailInAddress({
        city: shipCity.trim(),
        state: shipState.trim(),
        street: shipAddress.trim(),
        zip: shipZip.trim(),
      });
      if (checked.error) {
        toast.error(checked.error);
        return;
      }
      if (checked.notice) {
        setAddressNotice(checked.notice);
      }
    }
    setIsSubmitting(true);
    try {
      await submitIntake({
        data: {
          appointmentAt: intakeType === "dropoff" ? new Date(appointmentAt).toISOString() : undefined,
          contactEmail: contactEmail.trim(),
          contactName: contactName.trim(),
          items: items.map((item) => ({
            brand: item.brand.trim() || undefined,
            category: item.category.trim() || undefined,
            condition: item.condition || undefined,
            description: item.description.trim(),
            photos: item.photos,
          })),
          phone: phone.trim() || undefined,
          shipFromAddress:
            intakeType === "mailin"
              ? {
                  address: shipAddress.trim(),
                  city: shipCity.trim(),
                  state: shipState.trim(),
                  zip: shipZip.trim(),
                }
              : undefined,
          type: intakeType,
        },
      });
      setSubmitted(true);
      toast.success("Submission received");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPending) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div className="space-y-8">
            <div className="overflow-hidden rounded-2xl border border-gold/10">
              <img
                alt="Inside the ReLUXURY boutique"
                className="h-72 w-full object-cover sm:h-96"
                src="/hero-boutique.png"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
                Consignment Intake
              </p>
              <h1 className="font-display text-3xl lg:text-4xl font-light text-foreground">
                Sell to ReLUXURY
              </h1>
              <p className="text-muted-foreground">
                Send photos ahead of time — drop off in store or mail your
                pieces from anywhere in the US. We review every submission
                and reply within 2 business days.
              </p>
            </div>
            <ol className="space-y-4">
              {[
                {
                  step: "1",
                  text: "Submit photos, brand, and condition in minutes.",
                  title: "Tell us what you have",
                },
                {
                  step: "2",
                  text: "Approve the number or drop off in person — your call.",
                  title: "Get an offer",
                },
                {
                  step: "3",
                  text: "Mail-in sellers get a prepaid label straight to their inbox.",
                  title: "Ship or drop off",
                },
              ].map((item) => (
                <li
                  key={item.step}
                  className="flex gap-4 rounded-xl border border-gold/10 bg-card p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 font-display text-sm text-gold">
                    {item.step}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-foreground">
                      {item.title}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {item.text}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="lg:sticky lg:top-24">
            <div className="rounded-2xl border border-gold/15 bg-card p-2 sm:p-4">
              {showSignUp ? (
                <SignUpForm
                  onSwitchToSignIn={() => setShowSignUp(false)}
                  redirectTo="/sell"
                />
              ) : (
                <SignInForm
                  onSwitchToSignUp={() => setShowSignUp(true)}
                  redirectTo="/sell"
                />
              )}
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Signing in keeps you right here — your intake form appears
              after you&apos;re in.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-20 text-center space-y-4">
        <h1 className="font-display text-3xl font-light">Submission received</h1>
        <p className="text-muted-foreground">
          Our team reviews every submission and replies within 2 business
          days. Track progress from your dashboard.
        </p>
        <Link to="/dashboard">
          <Button className="bg-gold text-primary-foreground hover:bg-gold-dark">
            View My Submissions
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 lg:px-8 py-8">
      <div className="space-y-2 mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
          Consignment Intake
        </p>
        <h1 className="font-display text-3xl lg:text-4xl font-light text-foreground">
          Sell to ReLUXURY
        </h1>
        <p className="text-muted-foreground">
          Send photos ahead of time — drop off in store or mail your pieces
          from anywhere in the US.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { label: "In-Store Drop-off", value: "dropoff" },
              { label: "Mail-In", value: "mailin" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setIntakeType(option.value)}
              className={`rounded-xl border p-4 text-sm font-medium transition-colors ${
                intakeType === option.value
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-gold/10 text-muted-foreground hover:border-gold/30"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="p-6 rounded-xl border border-gold/10 bg-card space-y-4">
          <h2 className="font-display text-lg text-foreground">Contact</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="intake-name">Full Name *</Label>
              <Input
                id="intake-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="border-gold/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="intake-email">Email *</Label>
              <Input
                id="intake-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="border-gold/10"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="intake-phone">Phone</Label>
              <Input
                id="intake-phone"
                inputMode="tel"
                autoComplete="tel"
                maxLength={14}
                placeholder="(501) 555-0123"
                value={phone}
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                onKeyDown={(e) => {
                  if (
                    /[a-zA-Z]/.test(e.key) &&
                    !e.metaKey &&
                    !e.ctrlKey &&
                    e.key.length === 1
                  ) {
                    e.preventDefault();
                  }
                }}
                className="border-gold/10"
              />
            </div>
          </div>
        </div>

        {intakeType === "dropoff" ? (
          <div className="p-6 rounded-xl border border-gold/10 bg-card space-y-4">
            <h2 className="font-display text-lg text-foreground">
              Drop-off Appointment
            </h2>
            <div className="space-y-2">
              <Label htmlFor="intake-appointment">Preferred Date & Time *</Label>
              <Input
                id="intake-appointment"
                type="datetime-local"
                value={appointmentAt}
                onChange={(e) => setAppointmentAt(e.target.value)}
                className="border-gold/10"
              />
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-gold/10 bg-card space-y-4">
            <h2 className="font-display text-lg text-foreground">
              Ship-From Address
            </h2>
            <p className="text-sm text-muted-foreground">
              If we accept your pieces, we&apos;ll email you a prepaid
              shipping label for this address.
            </p>
            <AddressAutocomplete
              id="intake-address-search"
              onChange={setAddressSearch}
              onSelect={(selected) => {
                setShipAddress(selected.street);
                setShipCity(selected.city);
                setShipState(selected.state);
                setShipZip(selected.zip);
              }}
              value={addressSearch}
            />
            {addressNotice && (
              <p className="text-xs text-gold">
                Verified as: {addressNotice}
              </p>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="intake-address">Street Address *</Label>
                <Input
                  id="intake-address"
                  autoComplete="street-address"
                  placeholder="123 Main St, Apt 4"
                  value={shipAddress}
                  onChange={(e) => {
                    setShipAddress(e.target.value);
                    setAddressSearch(e.target.value);
                  }}
                  className="border-gold/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intake-city">City *</Label>
                <Input
                  id="intake-city"
                  value={shipCity}
                  onChange={(e) => setShipCity(e.target.value)}
                  className="border-gold/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="intake-state">State *</Label>
                  <Input
                    id="intake-state"
                    autoComplete="address-level1"
                    maxLength={2}
                    placeholder="AR"
                    value={shipState}
                    onChange={(e) =>
                      setShipState(e.target.value.toUpperCase().replaceAll(/[^A-Z]/g, ""))
                    }
                    className="border-gold/10 uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intake-zip">ZIP *</Label>
                  <Input
                    id="intake-zip"
                    autoComplete="postal-code"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="72113"
                    value={shipZip}
                    onChange={(e) =>
                      setShipZip(e.target.value.replaceAll(/[^\d-]/g, ""))
                    }
                    className="border-gold/10"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-foreground">
              Items ({items.length})
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-gold/20 text-gold hover:bg-gold/10"
              onClick={addItem}
            >
              Add Item
            </Button>
          </div>
          {items.map((item, index) => (
            <div
              key={index}
              className="p-6 rounded-xl border border-gold/10 bg-card space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gold">
                  Item {index + 1}
                </p>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive text-xs"
                    onClick={() => removeItem(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={item.description}
                  onChange={(e) =>
                    updateItem(index, { description: e.target.value })
                  }
                  placeholder="Designer silk blouse, size M, worn twice..."
                  rows={2}
                  className="border-gold/10"
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input
                    value={item.brand}
                    onChange={(e) =>
                      updateItem(index, { brand: e.target.value })
                    }
                    className="border-gold/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    value={item.category}
                    onChange={(e) =>
                      updateItem(index, { category: e.target.value })
                    }
                    className="flex h-10 w-full rounded-xl border border-gold/10 bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">Select</option>
                    {(categories ?? []).map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <select
                    value={item.condition}
                    onChange={(e) =>
                      updateItem(index, { condition: e.target.value })
                    }
                    className="flex h-10 w-full rounded-xl border border-gold/10 bg-background px-3 py-2 text-sm text-foreground"
                  >
                    {CONDITIONS.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Photos ({item.photos.length})</Label>
                {item.photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {item.photos.map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt=""
                        className="w-full h-20 rounded-md object-cover border border-gold/10"
                      />
                    ))}
                  </div>
                )}
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={isUploading}
                  onChange={(e) => {
                    void handlePhotoSelect(index, e.target.files);
                    e.target.value = "";
                  }}
                  className="border-gold/10"
                />
              </div>
            </div>
          ))}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full bg-gold text-primary-foreground hover:bg-gold-dark"
          disabled={isSubmitting || isUploading}
        >
          {isSubmitting ? "Submitting..." : "Submit for Review"}
        </Button>
      </form>
    </div>
  );
}
