// Production drill (throwaway — NOT committed):
// admin creates workshop w/ image -> registers via checkout -> roster check -> full cleanup.
import { chromium } from "@playwright/test";

const BASE = "https://reluxury.shop";
const ADMIN_EMAIL = "admin@reluxury.shop";
const ADMIN_PASSWORD = process.env.DRILL_ADMIN_PASSWORD ?? "";
const SLUG = "drill-delete-me";

if (!ADMIN_PASSWORD) {
  throw new Error("Set DRILL_ADMIN_PASSWORD env");
}

async function fillLabeled(
  dialog: import("@playwright/test").Locator,
  page: import("@playwright/test").Page,
  label: string,
  value: string
) {
  const block = dialog
    .locator("div.space-y-2")
    .filter({ hasText: label })
    .last();
  const field = block.locator("input, textarea").first();
  await field.fill(value);
}

const browser = await chromium.launch({
  executablePath:
    "/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome",
});
const page = await browser.newPage();
page.on("dialog", (dialog) => void dialog.accept());

// 1. Admin sign in
await page.goto(`${BASE}/login`);
await page.getByLabel("Email").fill(ADMIN_EMAIL);
await page.getByLabel("Password").fill(ADMIN_PASSWORD);
await page.getByRole("main").getByRole("button", { name: "Sign In" }).click();
await page.waitForURL("**/admin", { timeout: 30_000 });
console.log("OK admin signed in");

// 2. Create workshop with image
await page.getByRole("button", { name: "Workshops", exact: true }).click();
await page.getByRole("button", { name: "Add Workshop" }).click();
const dialog = page.locator("div.fixed.inset-0.z-50").last();
await dialog.getByText("Title *").first().waitFor({ timeout: 15_000 });
await fillLabeled(dialog, page, "Title *", "DRILL — Delete Me");
await fillLabeled(dialog, page, "Slug *", SLUG);
await fillLabeled(dialog, page, "Description", "Automated drill workshop.");
await fillLabeled(dialog, page, "Start Date", "2026-10-15T18:00");
await fillLabeled(dialog, page, "Instructor", "Drill Bot");
await fillLabeled(dialog, page, "Location", "Test Studio");
await fillLabeled(dialog, page, "Cover Image URL", `${BASE}/hero-boutique.png`);
await fillLabeled(dialog, page, "Capacity", "5");
await dialog.getByRole("button", { name: "Create Workshop" }).click();
await page.waitForTimeout(3000);
await page.screenshot({ path: "/tmp/opencode/after-create.png" });
const toasts = await page.locator("[data-sonner-toast]").allTextContents();
console.log("TOASTS:", JSON.stringify(toasts));
await page.getByText("DRILL — Delete Me").first().waitFor({ timeout: 30_000 });
console.log("OK workshop created");

// 3. Public listing shows it with image
await page.goto(`${BASE}/events/${SLUG}`);
await page.getByRole("button", { name: "Add to Cart to Register" }).click();
console.log("OK added to cart");

// 4. Checkout as admin (customer email = admin inbox)
await page.goto(`${BASE}/checkout`);
await page.getByLabel("Full Name *").fill("Drill Test");
await page.getByLabel("Email *").fill(ADMIN_EMAIL);
await page.getByRole("button", { name: "Place Order" }).click();
await page.getByText("Order Confirmed").waitFor({ timeout: 30_000 });
const orderText =
  (await page.getByText(/Order #RLX-/).first().textContent()) ?? "";
console.log(`OK order placed: ${orderText.trim()}`);

// 5. Roster shows registrant
await page.goto(`${BASE}/admin`);
await page.getByRole("button", { name: "Workshops", exact: true }).click();
await page.getByRole("link", { name: "DRILL — Delete Me" }).click();
await page.getByText(ADMIN_EMAIL).waitFor({ timeout: 30_000 });
console.log("OK roster shows registrant");

// 6. Cleanup: delete order (pending → allowed), delete workshop
const orderNumber = orderText.replace("Order #", "").trim();
await page.goto(`${BASE}/admin`);
await page.getByRole("button", { name: "Orders", exact: true }).click();
await page.getByRole("link", { name: new RegExp(orderNumber) }).click();
await page.getByRole("button", { name: "Delete this order" }).click();
console.log("OK order deleted");
await page.goto(`${BASE}/admin`);
await page.getByRole("button", { name: "Workshops", exact: true }).click();
const row = page.getByRole("row", { name: /DRILL — Delete Me/ });
await row.getByRole("checkbox").check();
await page.getByRole("button", { name: /Delete 1/ }).click();
console.log("OK workshop deleted");

await browser.close();
console.log("DRILL COMPLETE");
