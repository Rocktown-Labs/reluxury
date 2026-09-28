import type { BusinessContact } from "@reluxury/db";
import type { ShippoAddressInput } from "@/lib/shippo";

export interface ParsedShipFrom {
  address: string;
  city: string;
  state: string;
  zip: string;
}

export function parseShipFromAddress(value: string): ParsedShipFrom | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "address" in parsed &&
      "city" in parsed &&
      "state" in parsed &&
      "zip" in parsed
    ) {
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
    // not JSON
  }
  return null;
}

// Business contact address is free text like "14217 Corvallis Rd, Ste F\nMaumelle, AR 72113".
// Best-effort parse into street/city/state/zip for the Shippo destination leg.
export function parseBoutiqueAddress(
  address: string
): ParsedShipFrom | null {
  const lines = address
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return null;
  }
  const last = lines.at(-1) ?? "";
  const match = /^(.*?),\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/.exec(last);
  if (!match) {
    return null;
  }
  const street = lines.slice(0, -1).join(", ");
  return {
    address: street || match[1]?.trim() || "",
    city: (match[1] ?? "").trim(),
    state: (match[2] ?? "").toUpperCase(),
    zip: match[3] ?? "",
  };
}

export function toInboundShippoAddresses(input: {
  boutique: BusinessContact;
  contactEmail: string;
  contactName: string;
  phone?: string | null;
  shipFrom: ParsedShipFrom;
}): { recipient: ShippoAddressInput; sender: ShippoAddressInput } {
  const boutiqueParsed = parseBoutiqueAddress(input.boutique.address);
  if (!boutiqueParsed) {
    throw new Error(
      "Set a parseable boutique address in Settings (street lines, then City, ST ZIP)"
    );
  }
  return {
    recipient: {
      city: boutiqueParsed.city,
      country: "US",
      email: input.boutique.email || undefined,
      name: input.boutique.businessName,
      phone: input.boutique.phone || undefined,
      state: boutiqueParsed.state,
      street1: boutiqueParsed.address,
      zip: boutiqueParsed.zip,
    },
    sender: {
      city: input.shipFrom.city,
      country: "US",
      email: input.contactEmail,
      name: input.contactName,
      phone: input.phone || undefined,
      state: input.shipFrom.state,
      street1: input.shipFrom.address,
      zip: input.shipFrom.zip,
    },
  };
}
