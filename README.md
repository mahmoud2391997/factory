# ERP — مصنع أعلاف (عُمان)

نظام ERP مخصص لمصنع أعلاف في سلطنة عمان، مبني كتطبيق ويب حديث (Next.js + NestJS + PostgreSQL + Prisma) مع واجهة عربية/RTL وتتبع كامل للحركات.

## بنية المشروع (Monorepo)

```
apps/
  web/          # Next.js (واجهة ERP)
  api/          # NestJS (REST API)
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

### 3) تشغيل الـ API

```bash
pnpm dev:api
```

## وثائق التصميم

- `docs/implementation-plan.md`
- `docs/data-model.md`
- `docs/workflows.md`
- `docs/rbac.md`

