# Release validation / التحقق من الإصدار

## V1.2 — Vercel build simulation / محاكاة بناء Vercel

**Run date / تاريخ التشغيل:** 2026-10-05
**Scope / النطاق:** Local build-script behavior only; no live database or Vercel deployment was contacted.
**النطاق:** التحقق محلياً من سلوك سكربت البناء فقط؛ لم يتم الاتصال بقاعدة بيانات حية أو نشر على Vercel.

### Environment validation / التحقق من البيئة

| Case / الحالة | Result / النتيجة |
|---|---|
| Production mode with no configured variables | **Expected failure, exit 1.** Reported missing database URL, `JWT_SECRET` (minimum 32 characters), and `SETUP_TOKEN` (minimum 16 characters). / **فشل متوقع، الرمز 1.** أبلغ عن غياب رابط قاعدة البيانات و`JWT_SECRET` (32 حرفاً على الأقل) و`SETUP_TOKEN` (16 حرفاً على الأقل). |
| Dummy well-formed Postgres URL, `JWT_SECRET=change-me`, valid-length setup token | **Expected failure, exit 1.** Reported that `JWT_SECRET` is too short/a placeholder. / **فشل متوقع، الرمز 1.** أبلغ أن `JWT_SECRET` قصير أو قيمة بديلة. |
| Dummy well-formed Postgres URL and non-placeholder test secrets meeting length requirements | **Pass, exit 0.** The validator accepted the shape and lengths; values were local test placeholders, not credentials. / **نجاح، الرمز 0.** قبل المدقق الصيغة والأطوال؛ كانت القيم أمثلة محلية وليست بيانات اعتماد. |

### Build-script simulations / محاكاة سكربت البناء

- With a dummy Postgres URL and valid-length local test secrets, Prisma client generation succeeded and the real `next build` completed. A temporary `pnpm` wrapper intercepted only `migrate:deploy` and returned a simulated success; **no database connection or migration occurred**.
- With the same dummy URL, a temporary wrapper intentionally returned exit code **42** for `migrate:deploy`. `scripts/vercel-build.sh` exited 42 before invoking `next build`, showing a migration failure blocks the build. This was a simulated command failure, not a real database migration failure.
- With `APP_MODE=demo` and no database URL, the script printed `[vercel-build] DATABASE_URL not set; skipping Prisma migrations.` Prisma client generation and the real `next build` then completed successfully. Production mode without a database URL was separately rejected by `check-env`, as intended.
- Dummy hostname: `ep-example-pooler.neon.tech`; the test did not resolve or connect to it. The temporary wrapper and logs were under `/tmp` and are not repository files.

Evidence commands used isolated environments around `node scripts/check-env.mjs` and `bash scripts/vercel-build.sh`; no secret value or live connection was used. No claim is made about actual Neon migration success or deployment to Vercel.

### Revalidation on 2026-10-05 / إعادة التحقق

- `node scripts/check-env.mjs`: no production variables exited **1** and listed the missing database URL, `JWT_SECRET`, and `SETUP_TOKEN`; a dummy URL with `JWT_SECRET=change-me` exited **1** with the placeholder error; the dummy URL plus test-only secrets of sufficient length exited **0**.
- Full `bash scripts/vercel-build.sh` with the dummy URL exited **0**. Prisma generation and the real Next.js production build ran; a temporary `pnpm` shim intercepted only `migrate:deploy` and returned synthetic success, so no database connection was attempted. `apps/web/.next/BUILD_ID` was present.
- A second run with the shim returning synthetic migration exit **42** stopped at `migrate:deploy`; the build-step marker was absent, proving the web build was not invoked after the failure.
- With `APP_MODE=demo` and no database URL, the script exited **0** and printed `[vercel-build] DATABASE_URL not set; skipping Prisma migrations.` Prisma generation ran; the duplicate web-build step was deliberately intercepted in this branch because the actual full build had already passed above. No database migration was attempted.

## V1.3 — Prisma tracing and Neon URLs / تتبع Prisma وروابط Neon

### Trace verification / التحقق من ملفات التتبع

- `apps/web/next.config.mjs` sets neither `outputFileTracingRoot` nor `outputFileTracingIncludes`.
- After a local production build, both `apps/web/.next/server/app/api/erp/route.js.nft.json` and `apps/web/.next/server/app/api/auth/me/route.js.nft.json` listed the generated Prisma client's `default.js`, `schema.prisma`, and `libquery_engine-rhel-openssl-3.0.x.so.node`. Resolving each listed path from its manifest directory confirmed that the file exists.
- The manifests trace outside `apps/web` into the repository's root pnpm installation. Because the generated client and RHEL engine are present in the real route traces, no extra tracing setting was added. Recheck after Next.js or Prisma upgrades.
- `packages/database/src/client.ts` caches the client on Node's process-global `global.__erpPrisma` slot (the Node `global` alias for `globalThis`), allowing reuse across module reloads in a warm process. This cache is per process/instance, not shared between serverless instances.

### Neon connection contract / إعداد اتصال Neon

- Set `DATABASE_URL` to Neon’s **pooled** URL (the hostname includes `-pooler`) for app runtime traffic, with `?sslmode=require&pgbouncer=true&connect_timeout=15`.
- Set `DATABASE_URL_UNPOOLED` to the **direct/unpooled** Neon URL for migrations. `scripts/vercel-build.sh` passes it only to `prisma migrate deploy` when present; otherwise migration uses `DATABASE_URL`.
- `packages/database/prisma/schema.prisma` defines only `url = env("DATABASE_URL")`; it has no Prisma `directUrl`. `packages/database/src/env.ts` resolves `DATABASE_URL` first. Configure the pooled URL there for runtime.
- These are configuration instructions only. No Neon URL, database credential, or live connection was used during this validation.

## V1.4 — Node.js routes and function durations / بيئة Node.js ومدد الوظائف

The added `apps/web/lib/api-runtime.test.ts` scans every API `route.ts` file and requires explicit `runtime = 'nodejs'`, rejecting Edge runtime declarations. The ERP test suite passes **227/227**, including this guard. `apps/web/proxy.ts` imports only `NextRequest` and `NextResponse` from `next/server`; it has no Prisma, bcrypt, filesystem, or Node crypto imports.

The local production build's `functions-config-manifest.json` reports `maxDuration: 60` for `/api/erp/export`, `/api/erp/backup`, `/api/scale/readings`, `/api/erp`, `/api/erp/recall`, and all six print routes. The existing export ceiling was retained; 60 seconds were added to the other heavy server-side paths. The print UI fetches data from the ERP/recall APIs, and `apps/web/app/print/layout.tsx` applies the shared duration to the print route segment.

`60` is the requested working default, **not a verified plan entitlement**. Confirm it does not exceed the function-duration limit of the Vercel plan before production deployment. The route-runtime test, typecheck, ERP tests, build, and lint passed after the individual V1.4 changes. The manifest check was local; no Vercel account setting was accessed or changed.

## V1.5 — Serverless storage limits / حدود التخزين في بيئة Serverless

- `ERP_DATA_DIR` is honored on local hosts, but ignored on Vercel and AWS Lambda; ERP state, local archive files, and any legacy file operations are routed beneath the runtime temporary directory (`/tmp/erp-data`). No durable-storage provider was selected or added.
- Vercel attachment uploads are disabled until durable attachment storage is chosen. The server and UI enforce a **4 MB file** limit and a **4.5 MB request** ceiling; oversized requests return 413, while otherwise-valid uploads return localized 503 text in Arabic, English, or Hindi and do not write attachment bytes or add attachment metadata. Existing attachment metadata whose bytes are missing from the temporary filesystem also returns a localized 503 rather than claiming a successful download.
- Vercel backup responses are **download-only**: the endpoint skips the redundant server-side local-copy write and streams the current state as a JSON download. If state cannot be loaded, it returns a localized 503 and creates no backup file. The Settings screen instructs the user to retain the downloaded JSON; Vercel's server filesystem is not represented as durable backup storage.
- `apps/web/server/auth/login-throttle.ts` uses a module-level `Map`; its 5-failures/5-minute window and 60-second lock apply only within one warm Node.js process/instance. The counter is not shared across serverless instances and resets on cold starts or deployments. This is not a distributed production rate limiter.
- `NEXT_PUBLIC_APP_ENV` is injected at build time as `vercel` when the platform sets `VERCEL`, otherwise it uses the configured value or `local`; the upload UI uses that public, non-secret label to enforce the matching file limit.
- Verification after the V1.5 code changes: typecheck, `pnpm test:erp` (**232/232**), production build, and lint passed. Policy unit tests cover the 4/4.5 MB limits and distinct AR/EN/HI messages. A live Vercel request, external durable attachment store, and multi-instance throttle behavior were **not** exercised here.

**Decisions still open / قرارات ما زالت مفتوحة:** choose database-backed versus external object storage for attachments, and choose a shared rate-limit provider if distributed brute-force protection is required. The temporary disk and per-instance throttle must not be treated as durable/shared services.
