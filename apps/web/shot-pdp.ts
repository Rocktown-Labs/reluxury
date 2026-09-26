import { chromium } from "@playwright/test";

const browser = await chromium.launch({
  executablePath:
    "/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome",
});
const mobile = await browser.newPage({ viewport: { height: 800, width: 390 } });
await mobile.goto("http://127.0.0.1:3001/shop/mens-wool-topcoat", {
  waitUntil: "networkidle",
});
await mobile.getByRole("button", { name: "Add to Cart" }).scrollIntoViewIfNeeded();
await mobile.screenshot({ path: "/tmp/opencode/pdp-mobile.png" });
const desktop = await browser.newPage({
  viewport: { height: 900, width: 1440 },
});
await desktop.goto("http://127.0.0.1:3001/shop/mens-wool-topcoat", {
  waitUntil: "networkidle",
});
await desktop
  .getByRole("button", { name: "Add to Cart" })
  .scrollIntoViewIfNeeded();
await desktop.screenshot({ path: "/tmp/opencode/pdp-desktop.png" });
await browser.close();
console.log("done");
