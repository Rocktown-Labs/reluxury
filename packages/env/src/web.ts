import { createEnv } from "@t3-oss/env-core";
export const env = createEnv({
  client: {},
  clientPrefix: "VITE_",
  emptyStringAsUndefined: true,
  // oxlint-disable-next-line typescript/no-explicit-any
  runtimeEnv: (import.meta as any).env,
});
