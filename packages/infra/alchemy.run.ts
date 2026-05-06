import alchemy from "alchemy";
import { D1Database, R2Bucket, TanStackStart } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "../../apps/web/.env" });

const app = await alchemy("reluxury");

const db = await D1Database("database", {
  migrationsDir: "../../packages/db/src/migrations",
});
const productImages = await R2Bucket("product-images", {
  devDomain: true,
});

export const web = await TanStackStart("web", {
  bindings: {
    // oxlint-disable-next-line typescript/no-non-null-assertion
    BETTER_AUTH_SECRET: alchemy.secret.env.BETTER_AUTH_SECRET!,
    // oxlint-disable-next-line typescript/no-non-null-assertion
    BETTER_AUTH_URL: alchemy.env.BETTER_AUTH_URL!,
    // oxlint-disable-next-line typescript/no-non-null-assertion
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
    DB: db,
    PRODUCT_IMAGES: productImages,
    PRODUCT_IMAGES_PUBLIC_URL:
      alchemy.env.PRODUCT_IMAGES_PUBLIC_URL ?? productImages.devDomain ?? "",
  },
  cwd: "../../apps/web",
});

console.log(`Web    -> ${web.url}`);

await app.finalize();
