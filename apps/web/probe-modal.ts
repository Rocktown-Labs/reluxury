import { chromium } from "@playwright/test";

const BASE = "https://reluxury.shop";
const browser = await chromium.launch({
  executablePath:
    "/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome",
});
const page = await browser.newPage();
await page.goto(`${BASE}/login`);
await page.getByRole("main").getByLabel("Email").fill("admin@reluxury.shop");
await page
  .getByRole("main")
  .getByLabel("Password")
  .fill(process.env.DRILL_ADMIN_PASSWORD ?? "");
await page.getByRole("main").getByRole("button", { name: "Sign In" }).click();
await page.waitForURL("**/admin", { timeout: 30_000 });
await page
  .getByRole("button", { name: "Workshops", exact: true })
  .click();
await page.getByRole("button", { name: "Add Workshop" }).click();
await page.waitForTimeout(2000);
const roles = await page
  .locator('[role="dialog"], [data-slot="dialog"], div.fixed')
  .all();
console.log("candidates:", roles.length);
for (const [i, r] of roles.slice(0, 4).entries()) {
  const html = (await r.evaluate((el: Element) => el.outerHTML)).slice(0, 300);
  console.log(i, html);
}
await page.screenshot({ path: "/tmp/opencode/modal.png" });
await browser.close();
