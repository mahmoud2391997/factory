# Vercel Deployment (Monorepo)

هذا الريبو يحتوي Next.js Full-Stack واحد (ويب + API داخل `apps/web`).

## إعدادات مشروع Vercel للواجهة (Next.js)

- **Root Directory**: `apps/web`
- **Include source files outside of the Root Directory**: ✅ (مهم للوصول إلى `packages/*`)
- **Install Command**: `cd ../.. && npm ci`
- **Build Command**: `cd ../.. && npm run vercel-build`
- **Output Directory**: `.next`

> تم إضافة ملف `apps/web/vercel.json` لنفس الإعدادات.

## متغيرات البيئة المطلوبة (Project → Settings → Environment Variables)

| Variable | مطلوب | ملاحظات |
|----------|--------|---------|
| `DATABASE_URL` **أو** `POSTGRES_URL_NON_POOLING` / `POSTGRES_PRISMA_URL` / `PRISMA_DATABASE_URL` / `POSTGRES_URL` / `DATABASE_URL_UNPOOLED` | ✅ | أي واحد يكفي — سكربت النشر يطبع المتغير إلى `DATABASE_URL` قبل تشغيل Prisma، ويفضل الرابط غير المجمع للـ migrations |
| `JWT_SECRET` | ✅ | جلسات الدخول |
| `SETUP_TOKEN` | ✅ | تهيئة أول Admin عبر `/api/setup/bootstrap` |

### لو عندك Vercel Postgres
Storage → Postgres عادةً يضيف `POSTGRES_URL` و`POSTGRES_PRISMA_URL` تلقائيًا؛ أضف `DATABASE_URL` أو `POSTGRES_URL_NON_POOLING` إذا كانت المنصة توفر رابط اتصال مباشر خاصاً بالـ migrations.  
بعد الربط: **Redeploy**، ثم افتح `/api/health` وتأكد أن `databaseReachable: true`.

إذا ظهر خطأ Prisma `DATABASE_URL resolved to an empty string` فهذا يعني أن كل متغيرات قاعدة البيانات فاضية — اربط Postgres أو الصق connection string يدويًا.

## سلوك `npm run vercel-build`

1. `prisma generate` لتجهيز عميل قاعدة البيانات.
2. يطبع السكربت أي alias مدعوم إلى `DATABASE_URL` ثم يشغّل `pnpm db:deploy` لتطبيق كل migrations المسجلة عبر `prisma migrate deploy`؛ يجب أن يكون رابط قاعدة البيانات موجوداً.
3. يُحقن `NEXT_PUBLIC_GIT_COMMIT_SHA` وتاريخ UTC للبناء، ثم يُنفّذ `next build`.

ملف `packages/database/prisma/seed.ts` لا ينشئ بيانات ERP. عند إنشاء حالة التطبيق لأول مرة، ينشئ مخزن ERP الحالة الأولية من `buildSeedState` بما فيها مستخدم المدير العام وصلاحيات GM الافتراضية الكاملة. لذلك لا تستخدم `prisma db seed` كخطوة تهيئة بيانات المستخدمين.
