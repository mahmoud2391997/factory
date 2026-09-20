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



## تسجيل الدخول (Day 1)

1. اضبط `apps/web/.env` من `.env.example`
2. شغّل Postgres ثم: `pnpm db:deploy`
3. شغّل التطبيق: `pnpm dev`
4. أول مرة فقط — تهيئة النظام:

```bash
curl -X POST http://localhost:3000/api/setup/bootstrap \
  -H 'Content-Type: application/json' \
  -H "x-setup-token: $SETUP_TOKEN" \
  -d '{"email":"admin@factory.local","password":"Admin123!","fullName":"مدير النظام"}'
```

5. افتح `/login` وادخل بنفس البريد وكلمة المرور.
