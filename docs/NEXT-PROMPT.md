# Next-session prompt — Factory ERP continuation

Resume the Arabic/RTL feed-factory ERP in branch `work/manual-test-ready`, origin `mahmoud2391997/factory`. Target: manual testing on Vercel + Neon, Vercel Root Directory = repo root, Supabase auth OFF. Work directly in the repo; do not touch Docker/VPS files, Vercel settings, secrets, or `main`.

## Done so far (verified in this repository)
- Task 0 & Task C: Monorepo workspace configuration verified, packageManager pnpm@10.12.4 / npm workspaces verified, Next.js 16 standalone build passes, Prisma client fails closed in production without explicit demo opt-in.
- Task D (`77f5f47`), Task E (`71e13e8`), Task F (`ab80953`): Confirmed in GitHub repository history. Flow audit coverage (7 chains), bilingual manual test checklist, Vercel test guides & smoke tests verified.
- Baseline checks verified: `test:erp` passed (216/216 passed, 0 failed), `tsc --noEmit` passed (0 errors), `build` passed, `lint` passed.
- Task G completed and committed (`381318d`): comprehensive audit in `docs/PHASE2-AUDIT.md` covering table/selection components, locale mechanism & `html lang/dir`, all inventory routes/entities/commands, tab metrics, and selection bug root cause.
- Task H completed in two commits (`6c9dce1` failing test, `d4611e6` fix):
  - Pure selection helpers in `apps/web/lib/erp/domain/table-selection.ts` with stable string IDs (single/multi/page/all-filtered/deselect/partial-failure).
  - Bulk engine command executor in `apps/web/lib/erp/domain/bulk-actions.ts` enforcing permissions, referenced-record validation, audit log, and error isolation.
  - Enhanced `DataTable` in `apps/web/components/erp/live/bits.tsx` with stable `rowIds`, `bulkActions`, and responsive Selected Count Toolbar (`تم تحديد X من أصل Y`, select-all-filtered, and deselect all).
  - Enhanced `EntityPage` in `apps/web/components/erp/entity-page.tsx` with multi-select checkboxes, selected toolbar, bulk delete confirmation modal, and partial failure handling.
  - Wired permission-gated bulk delete for Materials (`inventory.adjust`) and Customers (`sales.create`) in `screens-ops.tsx`.
  - Added unit test suites `table-selection.test.ts` and `bulk-actions.test.ts` (test count increased to 216 passed, 0 failed).

## Working on now
- Task I: Comprehensive EN/AR/HI localization across every screen group, modals, forms, dropdowns, zod/server error strings, and durable language persistence without reload.

## Next
- Task J: Inventory workspace 12 sections consolidation, ERP-document backed features, migration & schema version bump, invariant tests; no new Prisma tables.
- Task K: Responsive inner navigation (collapsible vertical sidebar desktop, drawer/select mobile) replacing horizontal tab bars without route breakage.
- Task L/M: Regression test suite (`test:erp`, build, lint, typecheck, Playwright e2e), final report.

## Blockers / UNVERIFIED
- Push to GitHub remote requires authentication in this environment (`fatal: could not read Username for 'https://github.com': terminal prompts disabled`). Commits are created locally on `work/manual-test-ready`. To push upstream manually:
  `git push origin work/manual-test-ready`
- No disposable Neon database URL or live deployed credentials provided: empty-DB migration diff/deploy and authenticated live smoke are UNVERIFIED.
- Playwright browser binaries not pre-installed in container: UI e2e is UNVERIFIED until browsers installed.
- No dedicated customer sales-return engine command exists; flagged under Decisions Needed.

## Decisions needed
- Keep or drop the 17 unused Prisma models in schema.prisma.
- Category/subcategory tree behavior in Inventory workspace.
- Arabic vs Western numerals policy per locale.
- Customer sales-return / credit-note accounting policy.
- Confirm Vercel Root Directory = repo root.
- Merge `work/manual-test-ready` into `main`.
