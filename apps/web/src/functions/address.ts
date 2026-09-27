import { env } from "@reluxury/env/server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface AddressSuggestion {
  city: string;
  label: string;
  state: string;
  street: string;
  zip: string;
}

const RADAR_AUTOCOMPLETE_URL =
  "https://api.radar.io/v1/search/autocomplete";
const RADAR_VALIDATE_URL = "https://api.radar.io/v1/addresses/validate";

function radarKey(): string {
  try {
    const record = env as unknown as Record<string, string | undefined>;
    return record.RADAR_SECRET_KEY ?? "";
  } catch {
    return "";
  }
}

interface RadarAutocompleteResult {
  addressLabel?: string;
  city?: string;
  countryCode?: string;
  formattedAddress?: string;
  postalCode?: string;
  stateCode?: string;
  street?: string;
}

export const searchAddresses = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      query: z.string().trim().min(3).max(100),
    })
  )
  .handler(async ({ data }) => {
    const key = radarKey();
    if (!key) {
      return { configured: false, suggestions: [] as AddressSuggestion[] };
    }
    try {
      const url = `${RADAR_AUTOCOMPLETE_URL}?${new URLSearchParams({
        country: "US",
        limit: "5",
        query: data.query,
      }).toString()}`;
      const response = await fetch(url, {
        headers: { Authorization: key },
      });
      if (!response.ok) {
        throw new Error(`Radar returned ${response.status}`);
      }
      const json = (await response.json()) as {
        addresses?: RadarAutocompleteResult[];
      };
      const suggestions: AddressSuggestion[] = (json.addresses ?? [])
        .map((item) => ({
          city: item.city ?? "",
          label:
            item.formattedAddress ??
            [item.addressLabel ?? item.street, item.city, item.stateCode, item.postalCode]
              .filter(Boolean)
              .join(", "),
          state: item.stateCode ?? "",
          street: item.addressLabel ?? item.street ?? "",
          zip: item.postalCode ?? "",
        }))
        .filter((item) => item.street && item.label);
      return { configured: true, suggestions };
    } catch (error) {
      console.error("Radar autocomplete failed", error);
      return { configured: true, suggestions: [] as AddressSuggestion[] };
    }
  });

export const validateConsignmentAddress = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      city: z.string().trim().min(1).max(100),
      state: z.string().trim().min(1).max(50),
      street: z.string().trim().min(1).max(200),
      zip: z.string().trim().min(3).max(20),
    })
  )
  .handler(async ({ data }) => {
    const key = radarKey();
    if (!key) {
      return {
        configured: false,
        message: "Address saved.",
        standardizedAddress: null as string | null,
        success: true,
      };
    }
    try {
      const response = await fetch(RADAR_VALIDATE_URL, {
        body: JSON.stringify({
          addressLabel: data.street,
          city: data.city,
          countryCode: "US",
          postalCode: data.zip,
          stateCode: data.state,
        }),
        headers: {
          Authorization: key,
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Radar API returned status: ${response.status}`);
      }
      const validated = (await response.json()) as {
        address?: { formattedAddress?: string };
        result?: {
          verificationStatus?: "verified" | "partially_verified" | "unverified";
        };
      };
      const status = validated.result?.verificationStatus ?? "unverified";
      if (status === "verified") {
        return {
          configured: true,
          message: "Address confirmed. Eligible for prepaid shipping label.",
          standardizedAddress:
            validated.address?.formattedAddress ?? null,
          success: true,
        };
      }
      if (status === "partially_verified") {
        return {
          configured: true,
          message:
            "Address is missing details. Please check the unit, apartment, or suite number.",
          standardizedAddress:
            validated.address?.formattedAddress ?? null,
          success: false,
        };
      }
      return {
        configured: true,
        message:
          "We could not verify this address. Please ensure it is a valid delivery location.",
        standardizedAddress: null as string | null,
        success: false,
      };
    } catch (error) {
      console.error("Address validation failed", error);
      return {
        configured: true,
        message: "Address validation service is temporarily unavailable.",
        standardizedAddress: null as string | null,
        success: false,
      };
    }
  });
