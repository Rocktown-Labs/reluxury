/* oxlint-disable unicorn/no-useless-undefined */
import { describe, expect, it } from "vitest";

import {
  formatPhoneDigits,
  formatPhoneNumber,
  normalizePhoneToMasked,
  optionalFlexiblePhoneSchema,
  optionalPhoneDigitsSchema,
  phoneSchema,
  stripPhoneDigits,
} from "@/lib/phone";

describe("stripPhoneDigits", () => {
  it("keeps only digits, capped at 10", () => {
    expect(stripPhoneDigits("(501) 404-8696")).toBe("5014048696");
    expect(stripPhoneDigits("call 5014048696 now")).toBe("5014048696");
    expect(stripPhoneDigits("50140486969999")).toBe("5014048696");
    expect(stripPhoneDigits("")).toBe("");
  });
});

describe("formatPhoneDigits", () => {
  it("formats 10 typed digits as (123) 456-7890", () => {
    expect(formatPhoneDigits("5014048696")).toBe("(501) 404-8696");
  });

  it("returns partial input untouched", () => {
    expect(formatPhoneDigits("50140")).toBe("50140");
  });
});

describe("formatPhoneNumber", () => {
  it("masks progressive input as (501) ###-####", () => {
    expect(formatPhoneNumber("5")).toBe("(5");
    expect(formatPhoneNumber("5014048696")).toBe("(501) 404-8696");
  });
});

describe("normalizePhoneToMasked", () => {
  it("converts typed digits to the display format", () => {
    expect(normalizePhoneToMasked("5014048696")).toBe("(501) 404-8696");
    expect(normalizePhoneToMasked("(501) 404-8696")).toBe("(501) 404-8696");
    expect(normalizePhoneToMasked(undefined)).toBe(undefined);
  });
});

describe("phone schemas", () => {
  it("accepts only the masked shape for stored values", () => {
    expect(phoneSchema.safeParse("(501) 404-8696").success).toBe(true);
    expect(phoneSchema.safeParse("5014048696").success).toBe(false);
  });

  it("accepts typed digits for form input", () => {
    expect(optionalPhoneDigitsSchema.safeParse(undefined).success).toBe(true);
    expect(optionalPhoneDigitsSchema.safeParse("").success).toBe(true);
    expect(optionalPhoneDigitsSchema.safeParse("5014048696").success).toBe(
      true
    );
    expect(optionalPhoneDigitsSchema.safeParse("50140").success).toBe(false);
    expect(optionalPhoneDigitsSchema.safeParse("abc").success).toBe(false);
  });

  it("accepts digits or masked on the server", () => {
    expect(optionalFlexiblePhoneSchema.safeParse("5014048696").success).toBe(
      true
    );
    expect(optionalFlexiblePhoneSchema.safeParse("(501) 404-8696").success).toBe(
      true
    );
    expect(optionalFlexiblePhoneSchema.safeParse("abc").success).toBe(false);
  });
});
