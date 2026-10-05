# Development readiness assessment

Reviewed 2026-10-05. Scope: repository architecture, runtime persistence/authentication, navigation, setup, CI/container configuration, existing tests, and TypeScript/build checks. This is a development assessment, not a complete security audit or production certification.

## Current architecture

Arabic-first factory ERP with RTL and additional locales, Next.js App Router, React, Prisma, and PostgreSQL. Core workflows cover procurement, inventory, production recipes/lots/costs, quality and recall, sales, finance, fleet, HR, documents, and permissions. The pure domain engine has broad automated coverage and is a useful boundary to preserve.

ERP runtime persistence is one versioned JSON document (`ErpDocument`, main), with optimistic revision checks and command retry. Archives use `ArchiveRecord`. Most relational Prisma models are not used by runtime. File storage is for demos. Do not build a new module assuming its corresponding Prisma table is the active source of truth.

## Changes in this review

- CI follows Node 22 from `.nvmrc`, generates Prisma, and explicitly checks types before tests/build.
- Added `pnpm check`, `db:generate`, and `db:migrate` entry points and a concrete developer guide.
- Docker install includes workspace configuration and preserves workspace dependency links. A Docker ignore file excludes secrets, data, host dependencies, and build output.
- Compose selects production mode and requires JWT/setup secrets rather than running demo reset behavior against a database.
- Corrected duplicate navigation ID/canonical registration for material price analysis while retaining its canonical purchase route.
- Updated stale inventory navigation expectations for the existing materials/analytics/warehouses split, preserving legacy route coverage and adding a unique-ID assertion.
- README distinguishes demo storage/accounts and removes the nonexistent shared package.

## Prioritized refinements

| Priority | Finding | Development task and completion condition |
| --- | --- | --- |
| P0 before real data | Demo is the default even under NODE_ENV=production; demo normalization can reset seeded users and resetDemo is permitted. Build checks are not a universal runtime safeguard. | Require explicit production mode at every deployment; follow up with a runtime fail-closed mode policy and tests covering missing/unknown APP_MODE, production builds, and database-backed demos. |
| P0 before database changes | 17 Prisma models have no table migration according to the existing migration audit. | Decide the relational schema's role, then verify clean migration deployment and schema drift using disposable PostgreSQL and a shadow database. Keep real data out of drift experiments. |
| P0 before launch | Database migrations, container execution, and recovery need environment-backed verification. | Exercise clean setup, bootstrap, authenticated smoke checks, and restore into a second database; document backup recovery time and accepted data loss. |
| P1 | One JSON document makes unrelated writes compete, and state reads/writes scale with document size. Revision retry helps correctness but does not remove the contention boundary. | Measure payload size, command latency, conflict frequency, and concurrent-user throughput. Introduce repository interfaces; move high-volume ledgers and operations to transactional tables incrementally if measurements require it. |
| P1 | Engine is 5,316 lines; operations UI is 4,364 and office UI 2,181. | Extract procurement, inventory, production, finance, and HR handlers/screens incrementally. Keep public command contracts and existing workflow tests unchanged during extraction. |
| P1 | SMTP delivery occurs after persistence, and conflict retries can repeat delivery before flags commit. | Add a durable notification outbox with delivery identity and controlled retry; test crash/conflict recovery and define duplicate-email behavior. |
| P1 | Attachment bytes use filesystem paths; serverless durability needs a separate design. | Respect existing upload guards, select durable private object storage for serverless uploads, and verify access permissions, metadata/byte recovery, retention, and missing-file behavior. |
| P1 | Login throttling is process-local. | Use shared rate-limit storage for multiple instances, with tests for cross-instance limits and recovery. |
| P2 | Root lint is a type check, not a style/quality linter. | Add an explicit ESLint configuration and separate lint/typecheck jobs; introduce rules gradually without bulk formatting changes. |
| P2 | Many historical completion/audit documents coexist. | Mark historical plans clearly, maintain one current roadmap, and link verified release evidence from RELEASE.md. |
| P2 | Dense screens can slow factory tasks. | Validate receiving, batch execution, invoice/payment, and QC release with actual operators; prioritize scan-first inputs, clear units, validation next to fields, loading/error states, and visible approval status. |

## Recommended development sequence

1. Confirm production/demo policy and persistence ownership; complete clean PostgreSQL and restore verification.
2. Establish a browser regression suite for receiving → production → QC → delivery → invoice/payment, with role denial, Arabic RTL, and narrow-screen checks.
3. Extract domain handlers and screen modules in small changes backed by the current tests.
4. Measure realistic data volume and multi-user behavior before deciding how much normalized storage to implement.

No live deployment, production migration, credential changes, or data resets were performed in this review. See the verification results below for the checks actually run.

## Verification results

- 247/247 automated tests passed using the documented Node/tsx fallback (the default tsx CLI cannot open its IPC socket in this sandbox).
- `pnpm typecheck` passed after the changes.
- `pnpm --filter @erp/web exec next build --webpack` completed successfully, including static generation and route output.
- Default `pnpm build` (Turbopack) could not complete because the environment denies subprocess port binding during CSS processing. This remains unverified on an unrestricted host; the default build configuration was preserved.
- `docker compose config --quiet` passed with the existing local environment; no secret values were printed.
- `git diff --check` passed.
- Docker image build/start, clean PostgreSQL migration deployment/drift, production authenticated smoke checks, and backup restore remain unverified. Subsequent localization and demo browser verification is recorded in [LOCALIZATION-MAP-VERIFICATION.md](LOCALIZATION-MAP-VERIFICATION.md).
