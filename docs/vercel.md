# Vercel Deployment (Monorepo)

هذا الريبو يحتوي أكثر من تطبيق، لذلك يجب نشر الواجهة فقط.

## إعدادات مشروع Vercel للواجهة (Next.js)

- **Root Directory**: `apps/web`
- **Include source files outside of the Root Directory**: ✅ (مهم للوصول إلى `packages/*`)
- **Install Command**: `pnpm install --frozen-lockfile`
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`

> تم إضافة ملف `apps/web/vercel.json` لنفس الإعدادات.

