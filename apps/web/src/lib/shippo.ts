import { env } from "@reluxury/env/server";

export interface ShippoAddressInput {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface ShippoParcelInput {
  length: number; // in inches
  width: number; // in inches
  height: number; // in inches
  weight: number; // in ounces
}

export interface ShippoRate {
  objectId: string;
  amount: string;
  currency: string;
  provider: string;
  servicelevel: {
    name: string;
    token: string;
  };
  durationTerms: string;
}

export interface ShippoTransaction {
  objectId: string;
  status: "SUCCESS" | "ERROR" | "QUEUED";
  labelUrl: string;
  trackingNumber: string;
  trackingStatus: string;
  messages: string[];
}

export interface AddressValidationResult {
  isValid: boolean;
  messages: string[];
  recommendedAddress?: ShippoAddressInput;
}

const SHIPPO_BASE_URL = "https://api.goshippo.com";

// Store default sender address (Reluxury Boutique)
export const DEFAULT_SENDER_ADDRESS: ShippoAddressInput = {
  city: "San Francisco",
  country: "US",
  email: "fulfillment@reluxury.com",
  name: "Reluxury Boutique",
  phone: "415-555-0199",
  state: "CA",
  street1: "123 Luxury Way",
  zip: "94107",
};

/**
 * Clean HTTP client for Shippo that works seamlessly in Cloudflare Workers.
 */
class ShippoClient {
  // oxlint-disable-next-line class-methods-use-this
  private get apiKey(): string | undefined {
    // Access token from environment binding
    // In Workerd / Alchemy environment, env is a Proxy referencing process.env or wrangler vars
    try {
      return (env as Record<string, string | undefined>).SHIPPO_API_KEY;
    } catch {
      return undefined;
    }
  }

  private get isMockMode(): boolean {
    const key = this.apiKey;
    const isTest =
      typeof process !== "undefined" && process.env.VITEST === "true";
    return !key || isTest;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const key = this.apiKey;
    if (!key) {
      throw new Error("Shippo API Key is not configured.");
    }

    const url = `${SHIPPO_BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers);
    headers.set("Authorization", `ShippoToken ${key}`);
    headers.set("Content-Type", "application/json");
    headers.set("shippo-api-version", "2018-02-08");

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Shippo API error: ${response.status} ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText) as Record<string, unknown>;
        if (errorJson.message) {
          errorMessage = `Shippo API error: ${String(errorJson.message)}`;
        }
      } catch {
        // use fallback string
      }
      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Validates an address using the Shippo Address validation API.
   */
  async validateAddress(
    address: ShippoAddressInput
  ): Promise<AddressValidationResult> {
    if (this.isMockMode) {
      // Simulate validation logic
      if (!address.street1 || !address.city || !address.state || !address.zip) {
        return {
          isValid: false,
          messages: ["Street, city, state, and zip code are required fields."],
        };
      }
      return {
        isValid: true,
        messages: [],
        recommendedAddress: address,
      };
    }

    try {
      interface RawAddressValidation {
        validation_results?: {
          is_valid: boolean;
          messages: { text: string }[];
        };
      }
      const res = await this.request<RawAddressValidation>("/addresses/", {
        body: JSON.stringify({
          ...address,
          validate: true,
        }),
        method: "POST",
      });

      const isValid = res.validation_results?.is_valid ?? false;
      const messages =
        res.validation_results?.messages.map((m) => m.text) ?? [];

      return {
        isValid,
        messages,
        recommendedAddress: address, // Shippo API returns coordinates and components, we fallback to input
      };
    } catch (error) {
      return {
        isValid: false,
        messages: [(error as Error).message || "Failed to validate address"],
      };
    }
  }

  /**
   * Creates a shipment and returns a list of rates (specifically USPS rates).
   */
  async getRates(
    toAddress: ShippoAddressInput,
    parcel: ShippoParcelInput,
    fromAddress: ShippoAddressInput = DEFAULT_SENDER_ADDRESS
  ): Promise<ShippoRate[]> {
    if (this.isMockMode) {
      // Generate realistic USPS rates based on parcel weight
      const weightOz = parcel.weight;
      // Base rate calculation
      const baseCost = 4.5 + (weightOz / 16) * 0.75;

      return [
        {
          amount: baseCost.toFixed(2),
          currency: "USD",
          durationTerms: "2-5 business days",
          objectId: `rate_mock_ground_${crypto.randomUUID().slice(0, 8)}`,
          provider: "USPS",
          servicelevel: {
            name: "USPS Ground Advantage",
            token: "usps_ground_advantage",
          },
        },
        {
          amount: (baseCost + 3.8).toFixed(2),
          currency: "USD",
          durationTerms: "1-3 business days",
          objectId: `rate_mock_priority_${crypto.randomUUID().slice(0, 8)}`,
          provider: "USPS",
          servicelevel: {
            name: "USPS Priority Mail",
            token: "usps_priority",
          },
        },
        {
          amount: (baseCost + 22.5).toFixed(2),
          currency: "USD",
          durationTerms: "1 business day",
          objectId: `rate_mock_express_${crypto.randomUUID().slice(0, 8)}`,
          provider: "USPS",
          servicelevel: {
            name: "USPS Priority Mail Express",
            token: "usps_priority_express",
          },
        },
      ];
    }

    interface RawShipmentResponse {
      object_id: string;
      rates: {
        object_id: string;
        amount: string;
        currency: string;
        provider: string;
        servicelevel: {
          name: string;
          token: string;
        };
        duration_terms: string;
      }[];
    }

    const res = await this.request<RawShipmentResponse>("/shipments/", {
      body: JSON.stringify({
        address_from: {
          city: fromAddress.city,
          country: fromAddress.country,
          email: fromAddress.email,
          name: fromAddress.name,
          phone: fromAddress.phone,
          state: fromAddress.state,
          street1: fromAddress.street1,
          street2: fromAddress.street2,
          zip: fromAddress.zip,
        },
        address_to: {
          city: toAddress.city,
          country: toAddress.country,
          email: toAddress.email,
          name: toAddress.name,
          phone: toAddress.phone,
          state: toAddress.state,
          street1: toAddress.street1,
          street2: toAddress.street2,
          zip: toAddress.zip,
        },
        async: false,
        parcels: [
          {
            distance_unit: "in",
            height: parcel.height.toString(),
            length: parcel.length.toString(),
            mass_unit: "oz",
            weight: parcel.weight.toString(),
            width: parcel.width.toString(),
          },
        ],
      }),
      method: "POST",
    });

    return res.rates.map((rate) => ({
      amount: rate.amount,
      currency: rate.currency,
      durationTerms: rate.duration_terms,
      objectId: rate.object_id,
      provider: rate.provider,
      servicelevel: {
        name: rate.servicelevel.name,
        token: rate.servicelevel.token,
      },
    }));
  }

  /**
   * Purchases a shipping label using a rate object ID.
   */
  async purchaseLabel(rateObjectId: string): Promise<ShippoTransaction> {
    if (this.isMockMode) {
      return {
        labelUrl: "https://docs.goshippo.com/assets/images/label.png", // Sample Shippo label URL
        messages: [],
        objectId: `tx_mock_${crypto.randomUUID().slice(0, 12)}`,
        status: "SUCCESS",
        trackingNumber: `940011189956${Math.floor(1_000_000_000 + Math.random() * 9_000_000_000)}`,
        trackingStatus: "UNKNOWN",
      };
    }

    interface RawTransactionResponse {
      object_id: string;
      status: "SUCCESS" | "ERROR" | "QUEUED";
      label_url: string;
      tracking_number: string;
      tracking_status: string;
      messages?: { text: string }[];
    }

    const res = await this.request<RawTransactionResponse>("/transactions/", {
      body: JSON.stringify({
        async: false,
        label_file_type: "PDF",
        rate: rateObjectId,
      }),
      method: "POST",
    });

    return {
      labelUrl: res.label_url,
      messages: res.messages?.map((m) => m.text) ?? [],
      objectId: res.object_id,
      status: res.status,
      trackingNumber: res.tracking_number,
      trackingStatus: res.tracking_status,
    };
  }

  /**
   * Requests a refund for a purchased label.
   */
  async refundLabel(transactionObjectId: string): Promise<{ status: string }> {
    if (this.isMockMode) {
      return { status: "QUEUED" };
    }

    interface RawRefundResponse {
      status: string;
    }

    const res = await this.request<RawRefundResponse>("/refunds/", {
      body: JSON.stringify({
        transaction: transactionObjectId,
      }),
      method: "POST",
    });

    return { status: res.status };
  }
}

export const shippo = new ShippoClient();
