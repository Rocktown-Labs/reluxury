/* oxlint-disable no-use-before-define, func-style, typescript/no-explicit-any, complexity */
import { Badge } from "@reluxury/ui/components/badge";
import { Button } from "@reluxury/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@reluxury/ui/components/dialog";
import { Input } from "@reluxury/ui/components/input";
import { Label } from "@reluxury/ui/components/label";
import { Textarea } from "@reluxury/ui/components/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@reluxury/ui/components/table";
import { useState } from "react";
import { toast } from "sonner";

import {
  adminGetIntakeRates,
  adminMarkIntakeInTransit,
  adminMarkIntakeReceived,
  adminPurchaseIntakeLabel,
  adminReviewIntake,
} from "@/functions/intake";
import { adminKeys } from "@/lib/queries";
import { queryClient } from "@/lib/query-client";

const STATUSES = [
  "pending",
  "approved",
  "declined",
  "label_sent",
  "in_transit",
  "received",
  "completed",
  "cancelled",
];

function purchaseButtonLabel(isSaving: boolean, armed: boolean): string {
  if (isSaving) {
    return "Buying...";
  }
  if (armed) {
    return "Confirm: spend real money";
  }
  return "Buy Label (Real Money)";
}

function parseShipFrom(value: string | null): {
  address: string;
  city: string;
  state: string;
  zip: string;
} | null {
  if (!value) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed === "object" && parsed !== null) {
      const record = parsed as Record<string, unknown>;
      if (
        typeof record.address === "string" &&
        typeof record.city === "string" &&
        typeof record.state === "string" &&
        typeof record.zip === "string"
      ) {
        return {
          address: record.address,
          city: record.city,
          state: record.state,
          zip: record.zip,
        };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function parseItems(items: string | null): any[] {
  if (!items) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(items);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function IntakeManagement({ intakes }: { intakes: any[] }) {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selected, setSelected] = useState<any | null>(null);
  const [decision, setDecision] = useState<"approved" | "declined">("approved");
  const [offerAmount, setOfferAmount] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [appointmentAt, setAppointmentAt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [rates, setRates] = useState<any[]>([]);
  const [selectedRateId, setSelectedRateId] = useState("");
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [purchaseArmed, setPurchaseArmed] = useState(false);

  const filtered =
    statusFilter === "all"
      ? intakes
      : intakes.filter((intake) => intake.status === statusFilter);

  const openDetail = (intake: any) => {
    setSelected(intake);
    setRates([]);
    setSelectedRateId("");
    setPurchaseArmed(false);
    setDecision("approved");
    setOfferAmount(
      typeof intake.offerAmount === "number" ? String(intake.offerAmount) : ""
    );
    setAdminNotes(intake.adminNotes ?? "");
    setAppointmentAt(
      intake.appointmentAt
        ? new Date(intake.appointmentAt).toISOString().slice(0, 16)
        : ""
    );
  };

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: adminKeys.intakes() });

  const handleReview = async () => {
    if (!selected) {
      return;
    }
    setIsSaving(true);
    try {
      await adminReviewIntake({
        data: {
          adminNotes: adminNotes || undefined,
          appointmentAt: appointmentAt
            ? new Date(appointmentAt).toISOString()
            : null,
          decision,
          id: selected.id,
          offerAmount: offerAmount ? Number.parseFloat(offerAmount) : null,
        },
      });
      toast.success(`Submission ${decision}`);
      setSelected(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Review failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReceived = async () => {
    if (!selected) {
      return;
    }
    setIsSaving(true);
    try {
      await adminMarkIntakeReceived({ data: selected.id });
      toast.success("Marked as received");
      setSelected(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGetRates = async () => {
    if (!selected) {
      return;
    }
    setIsLoadingRates(true);
    try {
      const result = await adminGetIntakeRates({
        data: { intakeId: selected.id },
      });
      if (!result.success) {
        toast.error(result.messages.join(", ") || "Address is invalid");
        setRates([]);
        setSelectedRateId("");
        return;
      }
      setRates(result.rates);
      setSelectedRateId(result.rates[0]?.objectId ?? "");
      toast.success("Inbound rates updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rates failed");
    } finally {
      setIsLoadingRates(false);
    }
  };

  const handlePurchase = async () => {
    if (!selected || !selectedRateId) {
      return;
    }
    if (!purchaseArmed) {
      setPurchaseArmed(true);
      return;
    }
    const rate = rates.find((option) => option.objectId === selectedRateId);
    setIsSaving(true);
    try {
      const result = await adminPurchaseIntakeLabel({
        data: {
          carrier: rate?.provider,
          intakeId: selected.id,
          rateObjectId: selectedRateId,
        },
      });
      toast.success("Label purchased — customer emailed");
      setPurchaseArmed(false);
      setSelected({
        ...selected,
        inboundCarrier: rate?.provider ?? "USPS",
        inboundLabelUrl: result.labelUrl,
        inboundTrackingNumber: result.trackingNumber,
        status: "label_sent",
      });
      setRates([]);
      setSelectedRateId("");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Purchase failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInTransit = async () => {
    if (!selected) {
      return;
    }
    setIsSaving(true);
    try {
      await adminMarkIntakeInTransit({ data: selected.id });
      toast.success("Marked in transit");
      setSelected({ ...selected, status: "in_transit" });
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-gold/10">
        <h2 className="font-display text-xl text-foreground">
          Consignment Intake
        </h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-xl border border-gold/10 bg-background px-3 text-sm text-foreground"
        >
          <option value="pending">Pending review</option>
          <option value="all">All statuses</option>
          {STATUSES.filter(
            (status) => status !== "pending"
          ).map((status) => (
            <option key={status} value={status}>
              {status.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-gold/10 overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-gold/10 hover:bg-transparent">
              <TableHead className="text-gold">Contact</TableHead>
              <TableHead className="text-gold">Type</TableHead>
              <TableHead className="text-gold text-center">Items</TableHead>
              <TableHead className="text-gold text-center">Status</TableHead>
              <TableHead className="text-gold text-center">Offer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((intake) => (
              <TableRow
                key={intake.id}
                className="border-gold/10 hover:bg-gold/5 cursor-pointer"
                onClick={() => openDetail(intake)}
              >
                <TableCell>
                  <p className="text-sm font-medium">{intake.contactName}</p>
                  <p className="text-xs text-muted-foreground">
                    {intake.contactEmail}
                  </p>
                </TableCell>
                <TableCell className="text-xs capitalize">
                  {intake.type === "mailin" ? "Mail-in" : "Drop-off"}
                </TableCell>
                <TableCell className="text-sm text-center font-mono">
                  {parseItems(intake.items).length}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className="text-xs capitalize border-gold/20 text-gold"
                  >
                    {intake.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-center font-mono">
                  {typeof intake.offerAmount === "number"
                    ? `$${Number(intake.offerAmount).toFixed(2)} (${intake.offerStatus})`
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-sm text-muted-foreground py-8"
                >
                  No submissions with this status.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={selected !== null} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl bg-card border border-gold/25 p-6">
          <DialogHeader>
            <DialogTitle className="text-gold font-display font-light text-2xl">
              Review Submission
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <span className="text-foreground font-medium">
                    {selected.contactName}
                  </span>{" "}
                  · {selected.contactEmail}
                  {selected.phone ? ` · ${selected.phone}` : ""}
                </p>
                <p>
                  {selected.type === "mailin" ? "Mail-in" : "Drop-off"}
                  {selected.appointmentAt
                    ? ` · ${new Date(selected.appointmentAt).toLocaleString()}`
                    : ""}
                </p>
              </div>
              {selected.photos?.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {selected.photos.map((photo: any) => (
                    <img
                      key={photo.id}
                      src={photo.url}
                      alt=""
                      className="w-full h-20 rounded-md object-cover border border-gold/10"
                    />
                  ))}
                </div>
              )}
              <ul className="space-y-2">
                {parseItems(selected.items).map((item: any, index: number) => (
                  <li
                    key={index}
                    className="text-sm rounded-lg border border-gold/10 p-3"
                  >
                    <p className="text-foreground">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {[item.brand, item.category, item.condition]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
              {selected.type === "mailin" &&
                (selected.status === "approved" ||
                  selected.status === "label_sent") && (
                  <div className="rounded-lg border border-gold/20 bg-gold/5 p-4 space-y-3">
                    <p className="text-sm font-medium text-foreground">
                      Inbound shipping label
                    </p>
                    {(() => {
                      const shipFrom = parseShipFrom(selected.shipFromAddress);
                      return shipFrom ? (
                        <p className="text-xs text-muted-foreground">
                          From: {shipFrom.address}, {shipFrom.city},{" "}
                          {shipFrom.state} {shipFrom.zip}
                        </p>
                      ) : (
                        <p className="text-xs text-destructive">
                          Customer ship-from address is missing.
                        </p>
                      );
                    })()}
                    {rates.length === 0 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-gold/20 text-gold hover:bg-gold/10"
                        disabled={isLoadingRates}
                        onClick={handleGetRates}
                      >
                        {isLoadingRates
                          ? "Checking rates..."
                          : "Check Inbound Rates"}
                      </Button>
                    ) : (
                      <>
                        <div className="space-y-2">
                          {rates.map((rate) => (
                            <label
                              key={rate.objectId}
                              className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-sm cursor-pointer ${
                                selectedRateId === rate.objectId
                                  ? "border-gold bg-gold/5"
                                  : "border-gold/10"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="intake-rate"
                                  checked={selectedRateId === rate.objectId}
                                  onChange={() => {
                                    setSelectedRateId(rate.objectId);
                                    setPurchaseArmed(false);
                                  }}
                                  className="accent-[#d4af77]"
                                />
                                <span>
                                  <span className="block font-medium text-foreground">
                                    {rate.provider} {rate.servicelevel.name}
                                  </span>
                                  <span className="block text-xs text-muted-foreground">
                                    {rate.durationTerms ||
                                      "Delivery estimate varies"}
                                  </span>
                                </span>
                              </span>
                              <span className="font-mono text-gold">
                                ${Number(rate.amount).toFixed(2)}
                              </span>
                            </label>
                          ))}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          className="bg-gold text-primary-foreground hover:bg-gold-dark"
                          disabled={isSaving || !selectedRateId}
                          onClick={handlePurchase}
                        >
                          {purchaseButtonLabel(isSaving, purchaseArmed)}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              {selected.status === "pending" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Decision</Label>
                      <select
                        value={decision}
                        onChange={(e) =>
                          setDecision(e.target.value as "approved" | "declined")
                        }
                        className="flex h-10 w-full rounded-xl border border-gold/10 bg-background px-3 py-2 text-sm text-foreground"
                      >
                        <option value="approved">Approve</option>
                        <option value="declined">Decline</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Offer Amount ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={offerAmount}
                        onChange={(e) => setOfferAmount(e.target.value)}
                        placeholder="Optional"
                        className="border-gold/10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Appointment (drop-off)</Label>
                    <Input
                      type="datetime-local"
                      value={appointmentAt}
                      onChange={(e) => setAppointmentAt(e.target.value)}
                      className="border-gold/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Note to Customer</Label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={2}
                      className="border-gold/10"
                    />
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    Status:{" "}
                    <span className="text-foreground capitalize">
                      {selected.status.replace("_", " ")}
                    </span>
                  </p>
                  {typeof selected.offerAmount === "number" && (
                    <p>
                      Offer: ${Number(selected.offerAmount).toFixed(2)} (
                      {selected.offerStatus})
                    </p>
                  )}
                  {selected.inboundLabelUrl && (
                    <p>
                      Label:{" "}
                      <a
                        href={selected.inboundLabelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold hover:underline"
                      >
                        View shipping label
                      </a>
                      {selected.inboundTrackingNumber
                        ? ` · ${selected.inboundCarrier ?? "USPS"} ${selected.inboundTrackingNumber}`
                        : ""}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="mt-4 gap-2">
            {selected?.status === "pending" ? (
              <Button
                className="bg-gold text-primary-foreground hover:bg-gold-dark"
                disabled={isSaving}
                onClick={handleReview}
              >
                {isSaving ? "Saving..." : "Send Decision"}
              </Button>
            ) : (
              ["approved", "label_sent", "in_transit"].includes(
                selected?.status ?? ""
              ) && (
                <div className="flex gap-2">
                  {selected?.status === "label_sent" && (
                    <Button
                      variant="outline"
                      className="border-gold/20 text-gold hover:bg-gold/10"
                      disabled={isSaving}
                      onClick={handleInTransit}
                    >
                      {isSaving ? "Saving..." : "Mark In Transit"}
                    </Button>
                  )}
                  <Button
                    className="bg-gold text-primary-foreground hover:bg-gold-dark"
                    disabled={isSaving}
                    onClick={handleReceived}
                  >
                    {isSaving ? "Saving..." : "Mark Received"}
                  </Button>
                </div>
              )
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
