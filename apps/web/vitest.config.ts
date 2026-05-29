import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Normalize path casing for macOS case-preserving mismatches
const normalizePath = (urlStr: string) => {
  let path = fileURLToPath(new URL(urlStr, import.meta.url));
  if (path.includes("/rocktownlabs/")) {
    path = path.replace("/rocktownlabs/", "/RocktownLabs/");
  }
  return path;
};

export default defineConfig({
  resolve: {
    alias: {
      "@": normalizePath("./src"),
      "@reluxury/db": normalizePath("../../packages/db/src/index.ts"),
      "@reluxury/db/schema": normalizePath("../../packages/db/src/schema/index.ts"),
      "@reluxury/db/schema/": normalizePath("../../packages/db/src/schema/"),
      "@reluxury/ui": normalizePath("../../packages/ui/src"),
      "cloudflare:workers": normalizePath("../../packages/env/src/cloudflare-local.ts"),
    },
  },
  test: {
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/src/__tests__/e2e/**",
    ],
    globals: true,
    server: {
      deps: {
        inline: [
          "@reluxury/env",
          "@reluxury/db",
          "@reluxury/auth",
          "@reluxury/ui",
        ],
      },
    },
    setupFiles: [normalizePath("./src/__tests__/browser/setup.ts")],
  },
});
