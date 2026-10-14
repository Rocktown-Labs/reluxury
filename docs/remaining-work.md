# What's Left — ReLUXURY handoff

Shipped to prod (`master`): boutique storefront, admin dashboard, staff RBAC (#2/#3/#4),
consignment intake loop (#5/#6), checkout + Shippo outbound rates, workshops, alterations
booking, auth (email/password + Google, Turnstile on email forms), Radar address
verification, intake emails on `intake@mail.reluxury.shop`, P3 inbound Shippo labels +
drop-off appointments (#7), and P4 shifts/claims/low-stock alerts (#8).

## Verify on prod (post-ship checklist)

- [ ] Solve a real Turnstile challenge on sign-in/up (secret is set; fail-open is
      off) and confirm a replayed token is rejected.
- [ ] Type 3+ letters in a mail-in / shipping address box and confirm Radar
      suggestions + deliverability verdicts.
- [ ] Full mail-in dry run: submit → approve with offer → accept → label →
      received, watching each email land.
- [ ] Google OAuth on prod (preview subdomains need per-URL registration in the
      Google console, so prod is the source of truth).

## Env / deploy notes for the admin

- Secrets live in GitHub secrets (`gh secret set NAME`), never in files; new keys
  need all three: `packages/infra/alchemy.run.ts` bindings, `turbo.json`
  `globalPassThroughEnv`, `.github/workflows/deploy.yml` env.
- Prod deploys only via push to `master` (CI). Never run alchemy deploy locally
  against prod — the `BETTER_AUTH_SECRET` mismatch signs out every user.
- D1 migrations apply automatically from `packages/db/src/alchemy-migrations/`
  (run `bun run db:sync-migrations` in `@reluxury/db` after `db:generate`).
