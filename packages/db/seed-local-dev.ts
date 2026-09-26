// Seeds the local D1 simulator used by `alchemy dev`.
// v2 does not manage SQL migrations for this project (drizzle-kit v0 layout),
// so the local database file starts empty. Run once per fresh checkout (or
// whenever migrations change) while the dev server is STOPPED:
//   bun --cwd packages/db run seed-local
import { Glob } from "bun";
import { Database } from "bun:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "../..");
const MIGRATIONS_DIR = join(REPO_ROOT, "packages/db/src/migrations");
const D1_DIR = join(
  REPO_ROOT,
  "packages/infra/.alchemy/local/d1/cloudflare-runtime-D1DatabaseObject"
);

function findDevDatabase(): string {
  const glob = new Glob("*.sqlite");
  const candidates = [...glob.scanSync(D1_DIR)].filter(
    (file) => file !== "metadata.sqlite"
  );
  if (candidates.length === 0) {
    throw new Error(
      `No local D1 database found in ${D1_DIR}. Run "bun run dev" once first so alchemy creates it, then stop the server and re-run this script.`
    );
  }
  if (candidates.length > 1) {
    throw new Error(
      `Multiple local D1 databases found: ${candidates.join(", ")}. Seed manually.`
    );
  }
  return join(D1_DIR, candidates[0] as string);
}

function hasTables(db: Database): boolean {
  const rows = db
    .query<{ name: string }, []>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'events'"
    )
    .all();
  return rows.length > 0;
}

const dbPath = findDevDatabase();
const db = new Database(dbPath);
if (hasTables(db)) {
  console.log(`Already seeded: ${dbPath}`);
  process.exit(0);
}

const files = readdirSync(MIGRATIONS_DIR)
  .filter((file) => file.endsWith(".sql"))
  .toSorted();
for (const file of files) {
  const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);
  db.transaction(() => {
    for (const statement of statements) {
      db.run(statement);
    }
  })();
  console.log(`Applied ${file} (${statements.length} statements)`);
}
console.log(`Done: ${dbPath}`);
