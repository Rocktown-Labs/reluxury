/* oxlint-disable unicorn/no-useless-undefined */
import { describe, expect, it } from "vitest";

import {
  formatPhoneNumber,
  optionalPhoneSchema,
  phoneSchema,
} from "@/lib/phone";

describe("formatPhoneNumber", () => {
  it("returns empty for empty input", () => {
    expect(formatPhoneNumber("")).toBe("");
  });

  it("masks progressive input as (501) ###-####", () => {
    expect(formatPhoneNumber("5")).toBe("(5");
    expect(formatPhoneNumber("501")).toBe("(501");
    expect(formatPhoneNumber("5014")).toBe("(501) 4");
    expect(formatPhoneNumber("501404")).toBe("(501) 404");
    expect(formatPhoneNumber("5014048696")).toBe("(501) 404-8696");
  });

  it("strips letters so they can never be typed in", () => {
    expect(formatPhoneNumber("(501) abc-8696")).toBe("(501) 869-6");
    expect(formatPhoneNumber("call 5014048696 now")).toBe("(501) 404-8696");
  });

  it("caps at 10 digits", () => {
    expect(formatPhoneNumber("50140486969999")).toBe("(501) 404-8696");
  });
});

describe("phone schemas", () => {
  it("accepts only the masked shape", () => {
    expect(phoneSchema.safeParse("(501) 404-8696").success).toBe(true);
    expect(phoneSchema.safeParse("5014048696").success).toBe(false);
    expect(phoneSchema.safeParse("(501) 404-869").success).toBe(false);
  });

  it("allows empty/undefined for optional phones", () => {
    expect(optionalPhoneSchema.safeParse(undefined).success).toBe(true);
    expect(optionalPhoneSchema.safeParse("").success).toBe(true);
    expect(optionalPhoneSchema.safeParse("(501) 404-8696").success).toBe(
      true
    );
    expect(optionalPhoneSchema.safeParse("abc").success).toBe(false);
  });
});
