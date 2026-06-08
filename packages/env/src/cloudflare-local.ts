import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";

try {
  if (import.meta.url && import.meta.url.startsWith("file:")) {
    config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });
  } else {
    config({ path: join(process.cwd(), ".env") });
  }
} catch {
  // Safe fallback if filesystem access fails
  config();
}
config();

const runtimeEnv = typeof process === "undefined" ? {} : process.env;

// Identify if running inside workerd runtime (JSDOM runs in Node and has process.versions.node)
const isWorkerd =
  typeof process === "undefined" || !process.versions || !process.versions.node;

// Try to resolve cloudflare:test env (only exists in vitest-pool-workers)
// Construct string dynamically to bypass Vite compile-time analysis in JSDOM tests
const testMod = ["cloudflare", "test"].join(":");
// @ts-expect-error: cloudflare:test is a virtual module only resolved in vitest workerd pool
const cfEnv = isWorkerd
  ? await import(/* @vite-ignore */ testMod)
      .then((m) => m.env)
      .catch(() => null)
  : null;

export const env = new Proxy({} as Env, {
  get(_target, prop) {
    if (typeof prop !== "string") {
      return;
    }

    // Check cloudflare:test environment first (contains DB etc. in server tests)
    if (cfEnv && cfEnv[prop] !== undefined) {
      return cfEnv[prop];
    }

    // In workerd / vitest-pool-workers, bindings are injected globally
    if (typeof globalThis !== "undefined" && prop in globalThis) {
      return (globalThis as unknown as Record<string, unknown>)[prop];
    }

    return runtimeEnv[prop];
  },
});
