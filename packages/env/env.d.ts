import type { WebEnv } from "@reluxury/infra/alchemy.run";

// This file infers types for the cloudflare:workers environment from your Alchemy Worker.
// @see https://alchemy.run/concepts/bindings/#type-safe-bindings

export type CloudflareEnv = WebEnv;

declare global {
  type Env = CloudflareEnv;
}

/* oxlint-disable typescript/no-empty-interface, typescript/no-empty-object-type */
declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends CloudflareEnv {}
  }
}
