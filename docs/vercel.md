# Vercel Deployment (Monorepo)

هذا المستودع يحتوي تطبيق Next.js واحداً (الواجهة وواجهات API) داخل `apps/web`.

## إعدادات مشروع Vercel

- **Root Directory**: جذر المستودع (`.`)، وليس `apps/web`.
- **Framework Preset**: Next.js.
- **Install Command**: `pnpm install --frozen-lockfile` (من `vercel.json`).
- **Build Command**: `pnpm vercel-build` (من `vercel.json`).
- **Output Directory**: اتركه افتراضياً لـ Next.js؛ لا تضبط مساراً يدوياً.

يوجد ملف إعداد Vercel واحد فقط في جذر المستودع. اختيار الجذر ضروري لاكتشاف
`pnpm-workspace.yaml` و`packages/database` وملف القفل الموحد. أمر البناء يشغّل
فحص البيئة وتوليد Prisma، ثم يطبق migrations عند وجود اتصال قاعدة بيانات، ثم يبني الواجهة.

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

## سلوك `pnpm vercel-build`

1. `prisma generate` لتجهيز عميل قاعدة البيانات.
2. يطبق migrations عبر `prisma migrate deploy` فقط عند وجود `DATABASE_URL_UNPOOLED` أو `DATABASE_URL`؛ استخدم الرابط المباشر غير المجمع للمigrations عند توفره.
3. يُحقن `NEXT_PUBLIC_GIT_COMMIT_SHA` وتاريخ UTC للبناء، ثم يُنفّذ `next build`.

ملف `packages/database/prisma/seed.ts` لا ينشئ بيانات ERP. عند إنشاء حالة التطبيق لأول مرة، ينشئ مخزن ERP الحالة الأولية من `buildSeedState` بما فيها مستخدم المدير العام وصلاحيات GM الافتراضية الكاملة. لذلك لا تستخدم `prisma db seed` كخطوة تهيئة بيانات المستخدمين.
