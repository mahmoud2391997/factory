# Factory ERP — readiness review

Date: 2026-10-15. Branch: `prod-readiness/factory-runtime`. Status: development candidate, NOT approved production.

## Implemented and evidence
- F1/F2: explicit production mode/build guard; unknown/missing values fail; database-backed demo rejected; production initial state has no sample users; demo reset denied by policy; loopback-only legacy database mapping and private shared database.
- Full `pnpm check`: baseline observed 275 passed; latest 281/281 passed, no skips, including typecheck. Node 22.
- F3: clean local PostgreSQL `migrate deploy` succeeded. Prisma migration lock added. Drift comparison found three enums and 17 unmigrated models; no tables added/dropped for them.
- F5: notifications persist before transport; durable claim, stable Message-ID, CAS-safe updates, deferred SMTP, three outbox tests. Ambiguous delivery is held as SENDING/UNCERTAIN; it is never automatically resent.
- F6: `pnpm test:browser` adds localhost-only synthetic receipt/production/QC/delivery/payment flow, role denial and RTL/mobile browser assertions. Business actions use Playwright request context, not UI clicks; this is not a complete UI regression suite.
- F7: `node scripts/performance-baseline.mjs` executed against disposable PostgreSQL. Synthetic 1 MiB document: 5 writers p50=52ms/p95=1290ms, 137/187 CAS attempts conflicted; 10 writers p50=98ms/p95=3163ms, 597/697 conflicted. No lost writes. Storage benchmark only, not full command latency or VPS capacity. Keep architecture pending representative workload measurement.
- F8: quality-limit configuration, automatic sample pass/fail, raw quarantine, finished-lot release/sale blocking and HTTP scale-ingest contract exist in source; no physical scale was connected. Existing suites exercise domain behavior.
- F9: this is the current readiness index. Older plans remain for history and must not override executed evidence. Printable operator checklist: docs/OPERATOR-ACCEPTANCE-CHECKLIST.html.

## Not complete / limits
F4: attachment upload/download, restart persistence and authenticated download from a separately restored stack have now passed. F5 has duplicate suppression and durable pending/ambiguous states but no operator reconciliation/retry UI; generic SMTP cannot promise exactly-once recipient delivery. F6 does not cover every journey by actual UI clicks. F7 is synthetic storage contention, not full user-command performance. Alternative migration branches for 17 models were not created because owner decision is outstanding. One-week real-use acceptance remains for operators.

## Blocked on owner
F3: keep and migrate, or drop, the 17 unused models? F10: define returns/credit accounting, numeral display and inventory category tree. Approve email provider, scale contract/device and operator trial. No policies or prices were invented.

## Reproduce
`pnpm check`; `APP_MODE=production pnpm build:web`; use a disposable PostgreSQL URL for `pnpm --filter @erp/database migrate:deploy`; run the drift command in docs/DB-MIGRATION-AUDIT.md with disposable shadow database. Browser suite requires new empty local database, running application, FACTORY_TEST_URL and private SETUP_TOKEN. Benchmark only accepts localhost DB URLs.

## Shared VPS delivery
`infra/` is copied identically into each existing repository at the owner's request; run ONE copy only. Set PROJECTS_DIR to the absolute directory containing checkouts named factory, clinic, employees, feed-site and medical-site. Private environment files and backup keys belong outside all repositories. One internal PostgreSQL service contains separate factory, clinic and workforce databases/users. Caddy routes five hostnames. Containers run without root, with persistent volumes and health checks.

No production deployment, DNS, production database, real messages, payments, merges to main, or GitHub settings changes were performed. Local fixtures are synthetic. Production demo defaults OFF, following the latest written instruction. HTTPS issuance cannot be verified without approved domains. See infra/RUNBOOK.md for setup, backup, scheduling, rollback and hardening.

## Blocked on owner — shared
Choose domains, VPS size/region, off-server backup destination, retention, acceptable loss/recovery time, email provider and whether a public demo is approved. Confirm repository visibility and business/privacy content. These decisions are not inferred from old documents.

## Remaining verification — shared
A successful build or unit test is not operational acceptance. The final local-stack evidence below distinguishes executed checks from pending checks. No real-user trial has been performed. Automatic application rollback, SMTP-catcher invitation/password-reset journeys and physical-device acceptance must not be assumed passed unless explicitly recorded below.

## Executed local stack / recovery evidence
2026-10-15: all five images built successfully. One PostgreSQL16 service, three databases and distinct roles; inspect showed {"5432/tcp":null}, no published database port. A temporary loopback-only test forwarder was used for database acceptance, never added to production compose. All five apps returned200 through placeholder hostnames on the local Caddy proxy. Factory bootstrap created only its supplied synthetic administrator; clinic owner and synthetic roles were created through protected setup/user APIs; workforce used the explicit synthetic administrator configuration.

Encrypted backup restored all three databases with table-count comparison and file checksum validation; recovery_seconds=6 and snapshot_age_seconds=20 for the small synthetic snapshot. Corrupted ciphertext was rejected. Separate restored-app project reached healthy status, all five proxy routes returned200; restored workforce login and protected factory/clinic attachment byte checks passed. Database restoration needed --role=<app-role> and copied volumes needed UID/GID1000; see infra/RUNBOOK.md. Live TLS, offsite transfer, real backup schedule and production-scale recovery time remain unverified.
