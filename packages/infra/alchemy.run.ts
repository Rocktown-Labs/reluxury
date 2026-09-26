import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Stack } from "alchemy/Stack";
import { config } from "dotenv";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Redacted from "effect/Redacted";

config({ path: "./.env" });
config({ path: "../../apps/web/.env" });

const PROD_DOMAIN = "reluxury.shop";

// Physical names pinned to the v1 scheme ({app}-{id}-{stage}, worker name
// explicit) so the first v2 deploy can adopt the live resources instead of
// creating new ones. Deploy with `alchemy deploy --adopt` once.
export const Database = Cloudflare.D1.Database(
  "database",
  Stack.useSync((stack) => ({
    name: `reluxury-database-${stack.stage}`,
  }))
);

export const ProductImages = Cloudflare.R2.Bucket(
  "product-images",
  Stack.useSync((stack) => ({
    name: `reluxury-product-images-${stack.stage}`,
    publicAccess: true,
  }))
);

export const Web = Cloudflare.Website.Vite(
  "web",
  Stack.useSync((stack) => {
    const isProd = stack.stage === "prod";
    const baseUrl = isProd
      ? `https://${PROD_DOMAIN}`
      : (process.env.BETTER_AUTH_URL ?? "http://localhost:3001");
    return {
      dev: {
        host: process.env.HOST ?? "127.0.0.1",
        port: process.env.PORT ? Number(process.env.PORT) : 3001,
      },
      // Custom domain: zone reluxury.shop already exists in the account,
      // so Cloudflare provisions DNS + certificates automatically.
      domain: isProd
        ? { aliases: [`www.${PROD_DOMAIN}`], name: PROD_DOMAIN }
        : undefined,
      env: {
        ADMIN_EMAILS: process.env.ADMIN_EMAILS ?? "admin@reluxury.shop",
        BETTER_AUTH_SECRET: Config.Redacted("BETTER_AUTH_SECRET"),
        BETTER_AUTH_URL: baseUrl,
        CORS_ORIGIN: isProd
          ? baseUrl
          : (process.env.CORS_ORIGIN ?? "http://localhost:3001"),
        DB: Database,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
        GOOGLE_CLIENT_SECRET: Config.Redacted("GOOGLE_CLIENT_SECRET").pipe(
          Config.withDefault(Redacted.make(""))
        ),
        PRODUCT_IMAGES: ProductImages,
        // Static per-stage fallback: resolving the live r2.dev hostname via
        // Output.fromEffect breaks plan diffing on this beta, and the prod
        // hostname is stable for the adopted bucket's lifetime.
        PRODUCT_IMAGES_PUBLIC_URL:
          process.env.PRODUCT_IMAGES_PUBLIC_URL ??
          (stack.stage === "prod"
            ? "https://pub-0cbd5b44f2c542f2b59bf4e8bca2ffa4.r2.dev"
            : ""),
        RESEND_API_KEY: Config.Redacted("RESEND_API_KEY").pipe(
          Config.withDefault(Redacted.make(""))
        ),
        RESEND_WEBHOOK_SECRET: Config.Redacted("RESEND_WEBHOOK_SECRET").pipe(
          Config.withDefault(Redacted.make(""))
        ),
      },
      name: isProd ? "reluxury-web" : `reluxury-web-${stack.stage}`,
      observability: {
        enabled: true,
      },
      placement: {
        mode: "smart",
      },
      rootDir: "../../apps/web",
    };
  })
);

export type WebEnv = Cloudflare.InferEnv<typeof Web>;

export default Alchemy.Stack(
  "reluxury",
  { providers: Cloudflare.providers(), state: Cloudflare.state() },
  Effect.gen(function* stack() {
    const web = yield* Web;
    return { url: web.url };
  })
);
