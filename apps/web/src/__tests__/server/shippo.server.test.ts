import { createDb } from "@reluxury/db";
import { orders } from "@reluxury/db/schema";
import { eq } from "drizzle-orm";
import { describe, it, expect, beforeAll } from "vitest";

import {
  adminGetShippoRates,
  adminPurchaseShippoLabel,
  adminRefundShippoLabel,
  adminMarkReadyForPickup,
} from "../../functions/admin";
import { shippo } from "../../lib/shippo";

describe("Shippo Order Fulfillment Pipeline", () => {
  const db = createDb();
  let testOrderId: string;
  let testPickupOrderId: string;

  beforeAll(async () => {
    testOrderId = crypto.randomUUID();
    testPickupOrderId = crypto.randomUUID();

    // Insert a dummy shipping order
    await db.insert(orders).values({
      deliveryMethod: "shipping",
      email: "customer@example.com",
      id: testOrderId,
      name: "Jane Doe",
      orderNumber: `TEST-SHIP-${Date.now()}`,
      phone: "555-123-4567",
      shippingAddress: JSON.stringify({
        address: "1600 Amphitheatre Pkwy",
        city: "Mountain View",
        name: "Jane Doe",
        state: "CA",
        zip: "94043",
      }),
      shippingCost: 9.99,
      status: "preparing",
      subtotal: 100,
      tax: 0,
      total: 109.99,
    });

    // Insert a dummy pickup order
    await db.insert(orders).values({
      deliveryMethod: "pickup",
      email: "customer-pickup@example.com",
      id: testPickupOrderId,
      name: "John Smith",
      orderNumber: `TEST-PICK-${Date.now()}`,
      phone: "555-987-6543",
      shippingAddress: null,
      shippingCost: 0,
      status: "preparing",
      subtotal: 50,
      tax: 0,
      total: 50,
    });
  });

  it("should validate addresses correctly", async () => {
    const validAddress = {
      city: "Mountain View",
      country: "US",
      name: "Jane Doe",
      state: "CA",
      street1: "1600 Amphitheatre Pkwy",
      zip: "94043",
    };

    const result = await shippo.validateAddress(validAddress);
    expect(result.isValid).toBe(true);

    const invalidAddress = {
      city: "",
      country: "US",
      name: "",
      state: "",
      street1: "",
      zip: "",
    };

    const invalidResult = await shippo.validateAddress(invalidAddress);
    expect(invalidResult.isValid).toBe(false);
  });

  it("should calculate shipping rates using dimensions and weight", async () => {
    // Invoke the server function to get rates
    const response = await adminGetShippoRates({
      data: {
        height: 4,
        length: 8,
        orderId: testOrderId,
        weight: 12.5, // 12.5 oz scale weight
        width: 6,
      },
    });

    expect(response.rates).toBeDefined();
    expect(response.rates.length).toBeGreaterThan(0);

    const [firstRate] = response.rates;
    expect(firstRate.provider).toBe("USPS");
    expect(firstRate.amount).toBeDefined();
    expect(firstRate.objectId).toBeDefined();
  });

  it("should purchase a shipping label, update order status, and log tracking number", async () => {
    // First fetch rates so we have an object ID
    const ratesRes = await adminGetShippoRates({
      data: {
        height: 6,
        length: 10,
        orderId: testOrderId,
        weight: 16,
        width: 8,
      },
    });

    const rateId = ratesRes.rates[0].objectId;

    // Purchase label using the rates ID
    const purchaseRes = await adminPurchaseShippoLabel({
      data: {
        orderId: testOrderId,
        rateObjectId: rateId,
      },
    });

    expect(purchaseRes.success).toBe(true);
    expect(purchaseRes.transaction.status).toBe("SUCCESS");
    expect(purchaseRes.transaction.trackingNumber).toBeDefined();
    expect(purchaseRes.transaction.labelUrl).toBeDefined();

    // Verify order in D1 is updated
    const orderInDb = await db.query.orders.findFirst({
      where: eq(orders.id, testOrderId),
    });

    expect(orderInDb).toBeDefined();
    expect(orderInDb?.status).toBe("shipped");
    expect(orderInDb?.carrier).toBe("USPS");
    expect(orderInDb?.trackingNumber).toBe(
      purchaseRes.transaction.trackingNumber
    );
    expect(orderInDb?.shippingLabelUrl).toBe(purchaseRes.transaction.labelUrl);
    expect(orderInDb?.adminNotes).toContain("Shipped via USPS");
    expect(orderInDb?.adminNotes).toContain("[Notification]");
  });

  it("should void/refund the label and revert order status to preparing", async () => {
    const refundRes = await adminRefundShippoLabel({
      data: {
        orderId: testOrderId,
      },
    });

    expect(refundRes.success).toBe(true);
    expect(refundRes.status).toBeDefined();

    // Verify order in DB has reverted
    const orderInDb = await db.query.orders.findFirst({
      where: eq(orders.id, testOrderId),
    });

    expect(orderInDb).toBeDefined();
    expect(orderInDb?.status).toBe("preparing");
    expect(orderInDb?.trackingNumber).toBeNull();
    expect(orderInDb?.shippingLabelUrl).toBeNull();
    expect(orderInDb?.shippoTransactionId).toBeNull();
    expect(orderInDb?.carrier).toBeNull();
    expect(orderInDb?.adminNotes).toContain("Requested shipping label refund");
  });

  it("should mark pickup order as ready_for_pickup and complete it", async () => {
    // Mark ready for pickup
    const readyRes = await adminMarkReadyForPickup({
      data: {
        orderId: testPickupOrderId,
      },
    });

    expect(readyRes.success).toBe(true);

    const orderInDb = await db.query.orders.findFirst({
      where: eq(orders.id, testPickupOrderId),
    });
    expect(orderInDb?.status).toBe("ready_for_pickup");
    expect(orderInDb?.adminNotes).toContain("Marked ready for pickup");
    expect(orderInDb?.adminNotes).toContain("[Notification]");
  });
});
