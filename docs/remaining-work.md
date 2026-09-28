# What's Left — ReLUXURY handoff

Shipped to prod (`master`): boutique storefront, admin dashboard, staff RBAC (#2/#3/#4),
consignment intake loop (#5/#6), checkout + Shippo outbound rates, workshops, alterations
booking, auth (email/password + Google, Turnstile on email forms), Radar address
verification, intake emails on `intake@mail.reluxury.shop`.

## P3 — Mail-in Shippo inbound labels + drop-off appointments (issue #7)

The intake record already carries `shipFromAddress`, `appointmentAt`, `inboundLabelUrl`,
and statuses (`label_sent`, `in_transit`, `received`). What's missing is the label flow:

- [ ] Admin confirms the customer's ship-from address, fetches inbound rates, and
      purchases the label behind a deliberate click (real money) — reuse the
      `shippo` client in `apps/web/src/lib/shippo.ts` (`getRates` + `purchaseLabel`
      already exist for outbound).
- [ ] Store the label URL on `inboundLabelUrl`, flip status to `label_sent`.
- [ ] Label-ready email to the customer with the label link (new builder in
      `packages/transactional/src/send.ts`, sender `EMAIL_FROM.intake`).
- [ ] In-transit → received transitions in the admin Intake tab; drop-off
      appointment slot confirmed on approve.
- [ ] Secrets: Shippo key already wired (`SHIPPO_API_KEY` binding / DB setting).

## P4 — Shifts, claim queues, low-stock alerts (issue #8)

Schema tables (`shifts`, `staff_members`) exist from the RBAC migration; no UI yet:

- [ ] `shifts` week view in admin (reuse `calendar-admin` patterns) + per-role
      my-schedule view.
- [ ] Morning-of shift reminder emails (same Resend path as other mail).
- [ ] Off-shift assignment warnings (display only, no hard blocks); default the
      workshop instructor from scheduled staff.
- [ ] Claim queues: tailors claim alterations, fulfillment staff claim orders
      (new `claimedBy` ownership or a lightweight claims table + permission checks
      via the existing `requireStaffPermission` pattern).
- [ ] Low-stock alerts into the existing badge system (threshold → dashboard badge
      + admin email).

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
