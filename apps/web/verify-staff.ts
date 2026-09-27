import { chromium } from "@playwright/test";

const browser = await chromium.launch({
  executablePath:
    "/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome",
});
const page = await browser.newPage();
await page.goto("https://reluxury.shop/login");
await page.getByRole("main").getByLabel("Email").fill("admin@reluxury.shop");
await page
  .getByRole("main")
  .getByLabel("Password")
  .fill(process.env.DRILL_ADMIN_PASSWORD ?? "");
await page.getByRole("main").getByRole("button", { name: "Sign In" }).click();
await page.waitForURL("**/admin", { timeout: 30_000 });
await page.getByRole("button", { name: "Staff", exact: true }).click();
await page.getByText("Team").first().waitFor({ timeout: 30_000 });
const auditVisible = await page.getByText("Recent Activity").count();
console.log("staff tab ok, audit section:", auditVisible > 0);
await browser.close();
