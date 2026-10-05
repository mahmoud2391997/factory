
## V1.4 — Node.js routes and function durations / بيئة Node.js ومدد الوظائف

The new `apps/web/lib/api-runtime.test.ts` scans every API `route.ts` file and requires explicit `runtime = 'nodejs'`, rejecting Edge runtime declarations. The ERP test suite now passes **227/227**, including this guard. `apps/web/proxy.ts` imports only `NextRequest` and `NextResponse` from `next/server`; the inspected proxy contains no Prisma, bcrypt, filesystem, or Node crypto imports.

The local production build's `functions-config-manifest.json` reports `maxDuration: 60` for `/api/erp/export`, `/api/erp/backup`, `/api/scale/readings`, `/api/erp`, `/api/erp/recall`, and all six print routes. The existing export ceiling was retained; 60 seconds were added to the other heavy server-side paths. Print document pages use the ERP/recall APIs, and `apps/web/app/print/layout.tsx` applies the shared duration to the print route segment. `60` is the requested working default, **not a verified plan entitlement**: confirm it does not exceed the function-duration limit of the Vercel plan before production deployment.

The route-runtime test, typecheck, ERP tests, production build, and lint all passed after each individual V1.4 change. The build manifest check was performed locally; no Vercel plan/account setting was accessed or changed.
