import { eq } from "drizzle-orm";

import { createDb } from "./index";
import { storeSettings } from "./schema";

export interface BusinessContact {
  address: string;
  businessName: string;
  email: string;
  hours: string;
  phone: string;
}

export const DEFAULT_BUSINESS_CONTACT: BusinessContact = {
  address: "14217 Corvallis Rd, Ste F\nMaumelle, AR 72113",
  businessName: "ReLUXURY Consignment & Alterations Boutique",
  email: "",
  hours: "Tue–Fri: 10am–6pm\nSat: 10am–5pm\nSun–Mon: Closed",
  phone: "(501) 404-8696",
};

export async function readBusinessContact(
  db?: ReturnType<typeof createDb>
): Promise<BusinessContact> {
  const database = db ?? createDb();
  if (!database) {
    return { ...DEFAULT_BUSINESS_CONTACT };
  }
  const setting = await database.query.storeSettings.findFirst({
    where: eq(storeSettings.key, "footer_contact"),
  });
  if (setting) {
    try {
      const parsed = JSON.parse(setting.value) as Partial<BusinessContact>;
      return { ...DEFAULT_BUSINESS_CONTACT, ...parsed };
    } catch {
      // Fallback below
    }
  }
  return { ...DEFAULT_BUSINESS_CONTACT };
}
