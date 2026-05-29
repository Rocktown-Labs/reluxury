import { test, expect } from "@playwright/test";

test.describe("About Page E2E", () => {
  test("should load the about page and display the company information", async ({
    page,
  }) => {
    // Navigate to the about page
    await page.goto("/about");

    // Verify main header title
    const mainTitle = page.locator("h1");
    await expect(mainTitle).toContainText("About ReLUXURY");

    // Verify presence of boutique description
    const description = page.locator("p");
    await expect(
      description.filter({ hasText: "sustainable consumption" }).first()
    ).toBeVisible();

    // Verify core business pillars (Curated Quality, Sustainable Luxury) are displayed
    await expect(page.getByText("Curated Quality")).toBeVisible();
    await expect(page.getByText("Sustainable Luxury")).toBeVisible();
  });
});
