import { fileURLToPath } from "node:url";

import { sentryTanstackStart } from "@sentry/tanstackstart-react/vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const cloudflareWorkersShimPath = fileURLToPath(
  new URL("../../packages/env/src/cloudflare-local.ts", import.meta.url)
);

// `cloudflare:workers` only resolves inside workerd or alchemy-managed
// builds (deploy/dev attach the real module). Plain vite/vitest runs need
// the local shim instead — opt in via CF_WORKERS_SHIM=1 (set in the web
// package scripts). Default is OFF so production bundles never ship the
// shim (every binding, e.g. env.DB, would be undefined at runtime).
const useShim = process.env.CF_WORKERS_SHIM === "1";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackStart(),
    sentryTanstackStart({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: "rocktown-labs-tq",
      project: "reluxury",
    }),
    viteReact(),
  ],
  resolve: {
    alias: useShim
      ? {
          "cloudflare:workers": cloudflareWorkersShimPath,
        }
      : {},
    tsconfigPaths: true,
  },
  server: {
    host: process.env.HOST ?? "127.0.0.1",
    port: process.env.PORT ? Number(process.env.PORT) : 3001,
  },
});
