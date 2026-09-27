-- Legacy placeholder: 0002_steady_workshops.sql was applied to production
-- under Alchemy v1, then replaced in the repo by 0002_slow_pretty_boy.sql
-- (commit e4623e2). This no-op stub exists ONLY so Alchemy v2's one-way
-- history conversion finds a local file for the recorded migration.
-- It must stay a no-op: fresh databases apply the real schema from the
-- other files. Do not delete. This file is intentionally absent from
-- src/migrations/ (drizzle-kit must never see it).
SELECT 1;
