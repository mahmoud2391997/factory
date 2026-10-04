# Next-session prompt — Factory ERP continuation

Resume the Arabic/RTL feed-factory ERP in `/home/ubuntu/factory`, branch `work/manual-test-ready`, from the current pushed GitHub branch `mahmoud2391997/factory`. Work directly in the repo; do not touch Docker/VPS files, Vercel settings, secrets, or `main`.

## Done so far (verified in this repository)
- Task 0 and Task C were completed in prior pushed commits: pnpm metadata/lockfile corrected, Vercel build wiring confirmed, and Prisma client fallback fails closed in production without an explicit demo opt-in. Clean frozen install passed earlier.
- Task D is committed and pushed (`77f5f47`): flow-audit numeric assertions, OMR rounding tests, command coverage matrix; referenced-material deletion protection and conflict/permission tests were completed in earlier commits.
- Task E is committed and pushed (`71e13e8`): bilingual dependency-ordered Vercel manual checklist with concrete quantities and negative scenarios.
- Task F is committed and pushed (`ab80953`): Vercel guides aligned, smoke health-shape assertions strengthened; env checker produced expected failure/failure/success outputs for empty, placeholder, and valid-shaped test environments. No live DB connection was tested.
- Phase 2 selection work is in progress in the worktree: stable-ID table selection, visible-page/select-all-filtered behavior, selected-count toolbar, permission-gated per-item material/customer deletes, partial-failure handling, and EN/AR/HI labels. Engine and pure selection tests were added. Last full run had 215/216 tests due an incorrect test expectation; that expectation has just been corrected, and the full rerun is pending.

## Working on now — ordered
1. Finish Task G audit as `docs/PHASE2-AUDIT.md`, including table/selection usage, locale mechanism and `html lang/dir`, all Inventory routes/entities, tab counts, and selection root cause.
2. Finish Task H: run the full required checks; commit each unit; verify permission hiding/enforcement, page/filter selection, successful deletion clearing, partial-failure retry selection, and status/error messaging.
3. Task I: audit/fill EN/AR/HI across screens, server/validation errors, print/export, long Hindi text, and date/number/OMR style; add durable language-persistence coverage without a refresh.
4. Task J: consolidate existing inventory modules into the requested 12-section Inventory workspace, add only functional ERP-document-backed features with migration/tests; no new Prisma tables.
5. Task K: replace horizontal inner tabs with responsive, accessible desktop sidebar/mobile drawer or select; preserve routes and test RTL/LTR/Hindi at 360/768/1280px.
6. Task L/M: run regression suite, Playwright if browser availability permits, update this prompt with exact done/not-done state, and produce the final report.

## Blockers / UNVERIFIED
- No Neon empty test branch, deployed-app URL, or test account/token was provided in this run: empty-DB migration diff/deploy and authenticated live smoke are unverified.
- Playwright packages exist, but browser install/live UI verification has not been run. Use the exact commands `npx playwright install chromium && npx playwright test` and `node scripts/smoke-test.mjs https://<app> --expect-prod` when a disposable deployed environment and credentials are available; never include credentials in Git.
- There is no dedicated customer sales-return engine command. Do not invent stock/credit-note accounting behavior; document as incomplete and request the policy decision.
- New category/subcategory behavior, Arabic versus Western numerals by locale, and any font dependency remain open decisions; avoid new dependencies until audited.

## Workflow constraints
After each completed unit, run `(cd apps/web && pnpm exec tsc --noEmit)`, `pnpm test:erp`, `pnpm build`, and `pnpm lint`; stage explicit paths only; commit and push to `origin work/manual-test-ready`; never force-push. For a bug fix, test-first failing test and implementation fix belong in separate commits. Do not claim browser/DB results without running them.
