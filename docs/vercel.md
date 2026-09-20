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

| Variable | مطلوب للـ Build | مطلوب للـ Runtime | ملاحظات |
|----------|------------------|-------------------|---------|
| `DATABASE_URL` | مُفضّل | ✅ | بدونها يتخطى `migrate deploy` أثناء البناء؛ الـ API يحتاجها وقت التشغيل |
| `JWT_SECRET` | لا | ✅ | جلسات الدخول |
| `SETUP_TOKEN` | لا | ✅ | تهيئة أول Admin عبر `/api/setup/bootstrap` |

إذا ظهر خطأ Prisma `DATABASE_URL resolved to an empty string` فهذا يعني أن المتغير مضبوط كسلسلة فارغة — احذفه أو ضع رابط Postgres حقيقي (مثلاً Neon / Supabase / Vercel Postgres).

## سلوك `pnpm vercel-build`

1. إذا `DATABASE_URL` موجود وغير فارغ → `prisma migrate deploy`
2. دائمًا → `prisma generate` (يستخدم URL مؤقت إذا لم يوجد `DATABASE_URL`)
3. دائمًا → `next build`
