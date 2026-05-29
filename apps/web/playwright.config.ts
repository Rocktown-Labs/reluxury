import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Testing Configuration
 */
export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Webkit"] },
    },
  ],
  reporter: "list",
  retries: process.env.CI ? 2 : 0,
  testDir: "./src/__tests__/e2e",
  use: {
    baseURL: process.env.PORTLESS_URL || "http://127.0.0.1:3001",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  webServer: {
    command: "bun run dev",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    url: "http://127.0.0.1:3001",
  },
  workers: process.env.CI ? 1 : undefined,
});
