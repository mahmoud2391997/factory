# إعداد قاعدة البيانات على Vercel

هذا الملف ملخص مختصر؛ الإجراء الكامل والآمن للاختبار اليدوي موجود في [TEST-ON-VERCEL.md](./TEST-ON-VERCEL.md). استخدمه مرجعًا أساسيًا لتجهيز Neon، التهيئة، smoke، seed، وحدود Vercel.

## الإعداد المختصر

- اضبط **Root Directory** على جذر المستودع (`.`). يوجد ملف `vercel.json` واحد في الجذر.
- استخدم `DATABASE_URL` المجمع/pooled لتشغيل التطبيق و`DATABASE_URL_UNPOOLED` المباشر/unpooled لتطبيق migrations متى توفر.
- أضف `sslmode=require` إلى الرابطين إذا لم يضفه مزوّد قاعدة البيانات.
- اضبط `JWT_SECRET` و`SETUP_TOKEN` على قيم عشوائية قوية ومختلفة. لا تضع الأسرار في Git ولا تشاركها في طلبات الدعم.
- اترك `APP_MODE` فارغًا أو `production`. لا تجمع وضع demo مع قاعدة بيانات.
- لا يحتوي Prisma schema على `directUrl`؛ `scripts/vercel-build.sh` يمرّر رابط الاتصال المباشر إلى migration عند توفره.

## التحقق

```bash
BASE_URL='https://<your-vercel-domain>'
curl -i "$BASE_URL/api/health"
```

في الإنتاج، حقل `data` في الصحة يحتوي فقط `status` و`bootstrapped` و`demoMode`. الجاهزية تعيد `status="ok"` ورمز 200؛ عدم الجاهزية يعيد `status="degraded"` ورمز 503. لا تعتمد على حقول `databaseConfigured` أو `databaseReachable` أو `jwtConfigured`؛ لا تُعرض في استجابة الإنتاج.

لتهيئة أول مسؤول، أرسل `POST /api/setup/bootstrap` على قاعدة فارغة فقط مع ترويسة `x-setup-token` وJSON يحوي `email`, `password`, `fullName`. لا تستخدم بيانات اعتماد افتراضية مشتركة. معاني 200 و400 و401 و410 و500، والأوامر الدقيقة، موثقة في [TEST-ON-VERCEL.md](./TEST-ON-VERCEL.md).

**تنبيه:** لا تشغّل `scripts/seed-test-data.mjs` إلا على قاعدة اختبار معزولة ومع `--confirm-test-db`. لا تنفّذ `prisma db push`.
