import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import viteReact from "@vitejs/plugin-react";

export default [
  // 1. Browser/Component & Router tests (JSDOM environment)
  {
    plugins: [viteReact()],
    test: {
      environment: "jsdom",
      exclude: [
        "src/__tests__/server/**/*",
        "src/**/*.server.test.{ts,tsx}",
        "src/__tests__/e2e/**/*",
      ],
      include: [
        "src/__tests__/browser/**/*.test.{ts,tsx}",
        "src/**/*.test.{ts,tsx}",
      ],
      name: "browser",
    },
  },
  // 2. Server functions / DB / Cloudflare Workers environment tests
  {
    plugins: [
      cloudflareTest({
        wrangler: {
          configPath: ".alchemy/local/wrangler.jsonc",
        },
      }),
    ],
    test: {
      environment: "cloudflare",
      exclude: ["src/__tests__/e2e/**/*"],
      include: [
        "src/__tests__/server/**/*.test.{ts,tsx}",
        "src/**/*.server.test.{ts,tsx}",
      ],
      name: "server",
      pool: "@cloudflare/vitest-pool-workers",
    },
  },
];
