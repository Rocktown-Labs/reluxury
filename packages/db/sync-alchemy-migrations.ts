// Copies flat .sql migration files for Alchemy's D1 provider, which only
// accepts the v1 ("flat") layout while drizzle-kit 0.31 generates the v0
// layout (meta/_journal.json) that Alchemy hard-rejects.
// Run after every `db:generate` (it is chained there automatically).
import { mkdirSync, readdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const source = join(root, "src/migrations");
const target = join(root, "src/alchemy-migrations");

mkdirSync(target, { recursive: true });
const files = readdirSync(source)
  .filter((file) => file.endsWith(".sql"))
  .toSorted();
for (const file of files) {
  copyFileSync(join(source, file), join(target, file));
}
console.log(`Synced ${files.length} migration files to src/alchemy-migrations`);
