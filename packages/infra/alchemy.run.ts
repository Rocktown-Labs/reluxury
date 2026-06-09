import alchemy from "alchemy";
import { D1Database, R2Bucket, TanStackStart } from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "../../apps/web/.env" });

const app = await alchemy("reluxury", {
  stateStore: process.env.CI
    ? (scope) => new CloudflareStateStore(scope)
    : undefined,
});

const db = await D1Database("database", {
  migrationsDir: "../../packages/db/src/migrations",
});
const productImages = await R2Bucket("product-images", {
  devDomain: true,
});

const isProd = app.stage === "prod";

export const web = await TanStackStart("web", {
  adopt: true,
  bindings: {
    ADMIN_EMAILS: alchemy.env.ADMIN_EMAILS ?? "",
    // oxlint-disable-next-line typescript/no-non-null-assertion
    BETTER_AUTH_SECRET: alchemy.secret.env.BETTER_AUTH_SECRET!,
    BETTER_AUTH_URL: isProd
      ? "https://reluxury-web.rocktown-labs.workers.dev"
      : (alchemy.env.BETTER_AUTH_URL as string),
    CORS_ORIGIN: isProd
      ? "https://reluxury-web.rocktown-labs.workers.dev"
      : (alchemy.env.CORS_ORIGIN as string),
    DB: db,
    PRODUCT_IMAGES: productImages,
    PRODUCT_IMAGES_PUBLIC_URL: (() => {
      const val =
        (alchemy.env.PRODUCT_IMAGES_PUBLIC_URL as string) ||
        productImages.devDomain ||
        "";
      if (val && !val.startsWith("http")) {
        return `https://${val}`;
      }
      return val;
    })(),
  },
  cwd: "../../apps/web",
  dev: process.env.PORT
    ? {
        command: `bun vite dev --host ${process.env.HOST ?? "127.0.0.1"} --port ${process.env.PORT}`,
      }
    : undefined,
  name: "reluxury-web",
  observability: {
    enabled: true,
  },
  placement: {
    mode: "smart",
  },
  port: process.env.PORT ? Number(process.env.PORT) : undefined,
  url: true,
});

console.log(`Web    -> ${web.url}`);

await app.finalize();
