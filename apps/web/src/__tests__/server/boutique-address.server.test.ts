import { describe, expect, it } from "vitest";

import {
  parseBoutiqueAddress,
  parseShipFromAddress,
  toInboundShippoAddresses,
} from "@/lib/boutique-address";

describe("parseShipFromAddress", () => {
  it("parses stored intake JSON", () => {
    expect(
      parseShipFromAddress(
        JSON.stringify({
          address: "1 Main St",
          city: "Little Rock",
          state: "AR",
          zip: "72201",
        })
      )
    ).toEqual({
      address: "1 Main St",
      city: "Little Rock",
      state: "AR",
      zip: "72201",
    });
  });

  it("returns null for garbage", () => {
    expect(parseShipFromAddress("not json")).toBe(null);
    expect(parseShipFromAddress(JSON.stringify({ foo: 1 }))).toBe(null);
    expect(parseShipFromAddress(null as unknown as string)).toBe(null);
  });
});

describe("parseBoutiqueAddress", () => {
  it("parses the default boutique address", () => {
    expect(
      parseBoutiqueAddress("14217 Corvallis Rd, Ste F\nMaumelle, AR 72113")
    ).toEqual({
      address: "14217 Corvallis Rd, Ste F",
      city: "Maumelle",
      state: "AR",
      zip: "72113",
    });
  });

  it("returns null when the last line is not City, ST ZIP", () => {
    expect(parseBoutiqueAddress("Just a street")).toBe(null);
    expect(parseBoutiqueAddress("")).toBe(null);
  });
});

describe("toInboundShippoAddresses", () => {
  it("maps customer sender and boutique recipient legs", () => {
    const legs = toInboundShippoAddresses({
      boutique: {
        address: "14217 Corvallis Rd, Ste F\nMaumelle, AR 72113",
        businessName: "ReLUXURY",
        email: "shop@example.com",
        hours: "",
        phone: "(501) 404-8696",
      },
      contactEmail: "ava@example.com",
      contactName: "Ava",
      phone: "(501) 555-0123",
      shipFrom: {
        address: "1 Main St",
        city: "Little Rock",
        state: "AR",
        zip: "72201",
      },
    });
    expect(legs.sender).toMatchObject({
      city: "Little Rock",
      country: "US",
      state: "AR",
      street1: "1 Main St",
      zip: "72201",
    });
    expect(legs.recipient).toMatchObject({
      city: "Maumelle",
      country: "US",
      state: "AR",
      zip: "72113",
    });
  });

  it("throws when the boutique address is unparseable", () => {
    expect(() =>
      toInboundShippoAddresses({
        boutique: {
          address: "nowhere",
          businessName: "ReLUXURY",
          email: "",
          hours: "",
          phone: "",
        },
        contactEmail: "ava@example.com",
        contactName: "Ava",
        shipFrom: {
          address: "1 Main St",
          city: "Little Rock",
          state: "AR",
          zip: "72201",
        },
      })
    ).toThrow();
  });
});
