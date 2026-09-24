# إعداد قاعدة البيانات على Vercel (مطلوب للدخول)

الخطأ:

> إعداد قاعدة البيانات ناقص: عيّن DATABASE_URL ...

يعني **لا يوجد connection string** في Environment Variables على Vercel. هذا إعداد حسابك، وليس باگ في الكود.

## الطريقة الأسهل (مستحسنة)

1. افتح [vercel.com](https://vercel.com) → مشروع `factory` / `factory-web`
2. من الشريط الجانبي: **Storage**
3. **Create Database** → **Postgres**
4. اربطه بالمشروع (Connect to Project) لبيئات **Production** و **Preview**
5. Vercel سيضيف تلقائيًا مثل:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
6. اذهب **Deployments** → **Redeploy** لآخر deployment (بدون Cache إن أمكن)
7. افتح موقعك على `/login` — يجب أن تتحول علامات التشخيص للأخضر
8. افتح أيضًا `/api/health` وتأكد:

```json
{
  "data": {
    "databaseConfigured": true,
    "databaseReachable": true,
    "jwtConfigured": true
  }
}
```

## الطريقة اليدوية

**Settings → Environment Variables** أضف لـ Production + Preview:

| Name | Value |
|------|--------|
| `DATABASE_URL` | `postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require` |
| `JWT_SECRET` | أي نص عشوائي طويل |
| `SETUP_TOKEN` | توكن سري للتهيئة |

مصادر مجانية للرابط: [Neon](https://neon.tech) أو [Supabase](https://supabase.com) أو Vercel Postgres.

بعد الحفظ: **Redeploy**.

## تهيئة أول مستخدم (بعد ما الـ DB تشتغل)

```bash
curl -X POST https://YOUR-DOMAIN/api/setup/bootstrap \
  -H 'Content-Type: application/json' \
  -H "x-setup-token: YOUR_SETUP_TOKEN" \
  -d '{"email":"admin@factory.local","password":"Admin123!","fullName":"مدير النظام"}'
```

ثم ادخل بنفس البريد وكلمة المرور على `/login`.
