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
| Dummy well-formed Postgres URL and non-placeholder test secrets meeting length requirements | **Pass, exit 0.** The environment validator accepted the shape and lengths; the URL and values were local test placeholders, not credentials. / **نجاح، الرمز 0.** قبل مدقق البيئة الصيغة والأطوال؛ كانت القيم وروابط قاعدة البيانات أمثلة محلية وليست بيانات اعتماد. |

### Build-script simulations / محاكاة سكربت البناء

- With a dummy Postgres URL and valid-length local test secrets, the Prisma client generated and `next build` completed. A temporary `pnpm` wrapper intercepted only `migrate:deploy` and returned a simulated success; **no database connection or migration occurred**. The real `next build` command ran and completed successfully.
- With the same dummy URL, a temporary wrapper intentionally returned exit code **42** for `migrate:deploy`. `scripts/vercel-build.sh` exited 42 before invoking `next build`, confirming the migration failure blocks the build. This was a simulated command failure, not a real database migration failure.
- With `APP_MODE=demo` and no database URL, the script printed `[vercel-build] DATABASE_URL not set; skipping Prisma migrations.` Prisma client generation and the real `next build` then completed successfully. Production mode without a database URL was separately rejected by `check-env`, as intended.

- Dummy database hostname used: `ep-example-pooler.neon.tech`; the test did not resolve or connect to it.
- The build outputs listed the app routes and completed static-page generation. No claim is made here about Neon connectivity, actual migration success, Vercel deployment, or the production plan's function limits.

### Evidence commands / أوامر التحقق

```sh
node scripts/check-env.mjs # run under isolated production envs for missing, placeholder, and valid test values
bash scripts/vercel-build.sh # run under isolated envs; migration command intercepted by a temporary test wrapper
```

The test-only wrapper and logs lived under `/tmp` and were not added to the repository.
