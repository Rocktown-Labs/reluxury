import { describe, expect, it } from "vitest";

import {
  intakeDecisionHtml,
  intakeOfferResponseHtml,
  intakeReceivedHtml,
  intakeSubmittedHtml,
} from "@reluxury/transactional";

describe("intake email builders", () => {
  it("confirms submissions with item count and type", () => {
    const html = intakeSubmittedHtml({
      customerName: "Ava",
      itemCount: 3,
      type: "mailin",
    });
    expect(html).toContain("Ava");
    expect(html).toContain("3 items");
    expect(html).toContain("mail-in");
    expect(html).toContain("14217 Corvallis");
  });

  it("renders offers only when approved with an amount", () => {
    const withOffer = intakeDecisionHtml({
      customerName: "Ava",
      decision: "approved",
      offerAmount: 120,
    });
    expect(withOffer).toContain("$120.00");
    expect(withOffer).toContain("Review offer");
    const withoutOffer = intakeDecisionHtml({
      customerName: "Ava",
      decision: "approved",
    });
    expect(withoutOffer).not.toContain("Review offer");
    const declined = intakeDecisionHtml({
      adminNote: "Not our style right now",
      customerName: "Ava",
      decision: "declined",
      offerAmount: 50,
    });
    expect(declined).toContain("passing");
    expect(declined).not.toContain("$50.00");
  });

  it("summarizes offer responses for staff", () => {
    const html = intakeOfferResponseHtml({
      accepted: true,
      customerEmail: "ava@example.com",
      customerName: "Ava",
      offerAmount: 120,
    });
    expect(html).toContain("accepted");
    expect(html).toContain("ava@example.com");
    expect(html).toContain("$120.00");
  });

  it("confirms receipt with custom business info", () => {
    const html = intakeReceivedHtml({
      business: { address: "1 Test St, Testville", phone: "(555) 000-0000" },
      customerName: "Ava",
    });
    expect(html).toContain("arrived safely");
    expect(html).toContain("1 Test St, Testville");
    expect(html).toContain("(555) 000-0000");
  });
});
