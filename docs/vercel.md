# Vercel Deployment (Monorepo)

هذا الريبو يحتوي Next.js Full-Stack واحد (ويب + API داخل `apps/web`).

## إعدادات مشروع Vercel للواجهة (Next.js)

- **Root Directory**: `apps/web`
- **Include source files outside of the Root Directory**: ✅ (مهم للوصول إلى `packages/*`)
- **Install Command**: `cd ../.. && pnpm install --frozen-lockfile`
- **Build Command**: `cd ../.. && pnpm vercel-build`
- **Output Directory**: `.next`

> تم إضافة ملف `apps/web/vercel.json` لنفس الإعدادات.

## متغيرات البيئة المطلوبة (Project → Settings → Environment Variables)

| Variable | مطلوب | ملاحظات |
|----------|--------|---------|
| `DATABASE_URL` **أو** `POSTGRES_PRISMA_URL` / `POSTGRES_URL` | ✅ | أي واحد يكفي — التطبيق يوحّدهم تلقائيًا |
| `JWT_SECRET` | ✅ | جلسات الدخول |
| `SETUP_TOKEN` | ✅ | تهيئة أول Admin عبر `/api/setup/bootstrap` |

### لو عندك Vercel Postgres
Storage → Postgres عادةً يضيف `POSTGRES_URL` و`POSTGRES_PRISMA_URL` تلقائيًا.  
بعد الربط: **Redeploy**، ثم افتح `/api/health` وتأكد أن `databaseReachable: true`.

إذا ظهر خطأ Prisma `DATABASE_URL resolved to an empty string` فهذا يعني أن كل متغيرات قاعدة البيانات فاضية — اربط Postgres أو الصق connection string يدويًا.

## سلوك `pnpm vercel-build`

1. إذا `DATABASE_URL` موجود وغير فارغ → `prisma migrate deploy`
2. دائمًا → `prisma generate` (يستخدم URL مؤقت إذا لم يوجد `DATABASE_URL`)
3. دائمًا → `next build`
