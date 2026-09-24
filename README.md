# ERP — مصنع أعلاف (عُمان)

نظام ERP مخصص لمصنع أعلاف في سلطنة عمان، مبني كتطبيق **Next.js Full-Stack** (App Router + Route Handlers) مع PostgreSQL + Prisma، وواجهة عربية/RTL وتتبع كامل للحركات.

## بنية المشروع (Monorepo)

```
apps/
  web/          # Next.js (واجهة ERP)
  workforce/    # Next.js (نظام الفرق والمهام — مستقل عن ERP)
packages/
  database/           # Prisma schema + migrations + seed + generated client
  workforce-database/ # Prisma schema + generated client لنظام الفرق والمهام
  shared/             # Types/Zod مشتركة
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

### 2b) تشغيل نظام الفرق والمهام (Workforce)

1) انسخ `apps/workforce/.env.example` إلى `apps/workforce/.env` واضبط:
- `WORKFORCE_DATABASE_URL`
- `WORKFORCE_API_KEY`

2) شغّل:

```bash
pnpm dev:workforce
```

افتح `http://localhost:3001`.

### 3) الـ API

الـ API جزء من تطبيق Next.js نفسه عبر `app/api/*`، ولا يوجد مشروع NestJS منفصل.

## وثائق التصميم

- `docs/day2-complete.md` — تأكيد اكتمال اليوم ٢
- `docs/day4-complete.md` — تأكيد اكتمال اليوم ٤ (أرصدة + دفتر المخزون)
- `docs/day14-complete.md` — إغلاق خطة الأسبوعين (المسار الكامل + النسخ الاحتياطي)
- `docs/dev-plan-2-weeks.md` — تقرير خطة أسبوعين + أسئلة الاستضافة وشكل المنتج
- `docs/implementation-plan.md` — خطة قديمة، ليست وصفاً للنظام العامل
- `docs/data-model.md` — المستند الحي `ErpDocument` وأرشيف الجداول العلائقية
- `docs/workflows.md`
- `docs/rbac.md` — الأدوار الثلاثة وصلاحيات `publicState`



## التشغيل اليومي

النظام يربط الشراء والاستلام والتصنيع والبيع والحسابات في دفتر واحد. بدون `DATABASE_URL` تُحفظ البيانات في ملف محلي مع نسخة يومية لمدة 30 يوماً. مع Postgres يصبح جدول `ErpDocument` هو المصدر السحابي وتبقى النسخة المحلية احتياطاً إضافياً.

حسابات التجربة (كلمة المرور `Admin123!`):

| الدور | البريد |
| --- | --- |
| المدير العام | `gm@factory.local` أو `admin@factory.local` |
| المحاسب والموارد البشرية | `accounts@factory.local` |
| المستودع والإنتاج والمبيعات | `ops@factory.local` |

```bash
pnpm test:erp
pnpm dev
```

التفاصيل التشغيلية في `docs/user-manual-ar.md` والاستضافة في `docs/hosting-oman.md`.

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

## Vercel — إذا فشل Login بـ 500

افتح `/api/health` على الدومين. يجب أن ترى:

```json
{ "success": true, "data": { "databaseConfigured": true, "jwtConfigured": true, "databaseReachable": true, "bootstrapped": true } }
```

إذا كانت القيم `false`، أضف في Vercel → Settings → Environment Variables (Production + Preview):

| Variable | مثال |
|----------|------|
| `DATABASE_URL` أو `POSTGRES_PRISMA_URL` / `POSTGRES_URL` | رابط Postgres (Vercel Storage أو Neon) |
| `JWT_SECRET` | سلسلة عشوائية طويلة |
| `SETUP_TOKEN` | توكن سري للتهيئة الأولى |

أسهل طريقة: من مشروع Vercel → **Storage** → أنشئ/اربط **Postgres** → اربطه بالمشروع → Redeploy.

ثم أعد Deploy. بعد نجاح الاتصال نفّذ bootstrap مرة واحدة (بالـ SETUP_TOKEN) لإنشاء أول مستخدم.
