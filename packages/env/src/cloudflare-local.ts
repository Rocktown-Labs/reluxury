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

export const env = new Proxy({} as Env, {
  get(_target, prop) {
    if (typeof prop !== "string") {
      return;
    }

    return runtimeEnv[prop];
  },
});
