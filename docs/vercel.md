# Vercel Deployment (Monorepo)

هذا الريبو يحتوي Next.js Full-Stack واحد (ويب + API داخل `apps/web`).

## إعدادات مشروع Vercel للواجهة (Next.js)

- **Root Directory**: `apps/web`
- **Include source files outside of the Root Directory**: ✅ (مهم للوصول إلى `packages/*`)
- **Install Command**: `pnpm install --frozen-lockfile`
- **Build Command**: `pnpm build` (يشغّل `prisma migrate deploy` ثم `prisma generate` ثم `next build`)
- **Output Directory**: `.next`

> تم إضافة ملف `apps/web/vercel.json` لنفس الإعدادات.

