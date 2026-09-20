# ERP — مصنع أعلاف (عُمان)

نظام ERP مخصص لمصنع أعلاف في سلطنة عمان، مبني كتطبيق **Next.js Full-Stack** (App Router + Route Handlers) مع PostgreSQL + Prisma، وواجهة عربية/RTL وتتبع كامل للحركات.

## بنية المشروع (Monorepo)

```
apps/
  web/          # Next.js (واجهة ERP)
packages/
  database/     # Prisma schema + migrations + seed + generated client
  shared/       # Types/Zod مشتركة
docs/           # تصميم معماري + نموذج بيانات + تدفقات
```

## التشغيل (Development)

### 1) تثبيت الاعتمادات

```bash
pnpm install
```

### 2) تشغيل الواجهة (Web)

```bash
pnpm dev
```

افتح `http://localhost:3000`.

### 3) الـ API

الـ API جزء من تطبيق Next.js نفسه عبر `app/api/*`، ولا يوجد مشروع NestJS منفصل.

## وثائق التصميم

- `docs/implementation-plan.md`
- `docs/data-model.md`
- `docs/workflows.md`
- `docs/rbac.md`

