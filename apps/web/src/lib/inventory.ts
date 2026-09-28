import type { createDb } from "@reluxury/db";
import { storeSettings } from "@reluxury/db/schema";
import { eq } from "drizzle-orm";

import type { AppDb } from "@/lib/db";

export const LOW_STOCK_THRESHOLD_KEY = "low_stock_threshold";
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export async function readLowStockThreshold(
  db: AppDb | ReturnType<typeof createDb>
): Promise<number> {
  const database: AppDb = db as AppDb;
  try {
    const row = await database.query.storeSettings.findFirst({
      where: eq(storeSettings.key, LOW_STOCK_THRESHOLD_KEY),
    });
    const parsed = row?.value ? Number.parseInt(row.value, 10) : Number.NaN;
    if (!Number.isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_LOW_STOCK_THRESHOLD;
}

export function isNewlyLowStock(
  before: number,
  after: number,
  threshold: number
): boolean {
  return before > threshold && after <= threshold;
}
