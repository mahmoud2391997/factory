# الاختبار اليدوي على Vercel + Neon

هذا الدليل يجهّز نسخة **اختبار معزولة** من نظام المصنع. لا تشغّل seed على قاعدة بيانات أعمال حقيقية.

## 1) إعداد المشروع والاتصال

- في Vercel اجعل **Root Directory = `./` (جذر المستودع)**؛ لا تستخدم `apps/web` كجذر منفصل. يوجد ملف إعداد واحد `vercel.json` في الجذر، وملف الإخراج مضبوط على `apps/web/.next` لأن أمر البناء يبني تطبيق Next داخل مساحة العمل.
- استخدم Install Command `pnpm install --frozen-lockfile` وBuild Command `pnpm vercel-build`. سكربت البناء يتحقق من الإعدادات، ويولّد Prisma، ويطبّق migrations، ثم يبني `apps/web`.
- أنشئ قاعدة Neon فارغة واربط:
  - `DATABASE_URL`: رابط **pooled** للتشغيل في Vercel.
  - `DATABASE_URL_UNPOOLED`: رابط **direct/unpooled** لتطبيق migrations. أضف `?sslmode=require` إلى كل رابط إذا لم يكن مزود Neon قد ضمّنه.
  - إذا لم يتوفر رابط direct، يمكن للسكربت محاولة migration على `DATABASE_URL` pooled؛ إن رفضه المزود، نفّذ migration محليًا بالرابط direct كما في القسم 2.
- أضف `JWT_SECRET` بطول 32 حرفًا على الأقل، و`SETUP_TOKEN` بطول 16 حرفًا على الأقل. استخدم قيمًا عشوائية مختلفة، لا كلمات المثال.
- اترك `APP_MODE` فارغًا أو `production`. لا تستخدم `APP_MODE=demo` مع أي رابط قاعدة بيانات.
- لا يحتوي `packages/database/prisma/schema.prisma` على `directUrl`. يتولى `scripts/vercel-build.sh` استخدام `DATABASE_URL_UNPOOLED` (أو أحد أسماء رابط Neon/Vercel المباشر المدعومة) مؤقتًا عند تشغيل `prisma migrate deploy`؛ ويبقى `DATABASE_URL` المجمع لاتصالات التطبيق.
- احذف **كل** متغيرات `SUPABASE_*` و`NEXT_PUBLIC_SUPABASE_*` من إعدادات Vercel لهذا الاختبار؛ وجود URL ومفتاح Supabase يجعل تسجيل الدخول يمر عبر Supabase Auth بالإضافة إلى حساب ERP.
- بعد الحفظ، نفّذ Deploy. يعرض شريط النظام `Build <commit> · <UTC build date>` لإثبات النسخة المنشورة.

مثال توليد قيم محلية (لا تلصق ناتجها في Git):

```bash
openssl rand -base64 48  # JWT_SECRET
openssl rand -base64 24  # SETUP_TOKEN
```

### تشغيل migration يدويًا من جهاز المطور عند الحاجة

استخدم الرابط direct فقط، من جذر المستودع:

```bash
DATABASE_URL="$DATABASE_URL_UNPOOLED" pnpm db:deploy
```

هذا الأمر يشغّل `prisma migrate deploy`؛ لا تستخدم `prisma db push`. لا تُرسل بيانات الاتصال إلى مستودع Git أو سجل CI.

## 2) أول نشر وتهيئة المدير

بعد نجاح النشر، تحقّق من health:

```bash
export BASE_URL='https://<your-vercel-domain>'
curl -i "$BASE_URL/api/health"
```

على قاعدة فارغة قد يكون `bootstrapped=false`؛ هذا متوقع قبل إنشاء أول مدير. أرسل طلب bootstrap **مرة واحدة** مع `SETUP_TOKEN` الذي حفظته في إعدادات Vercel:

```bash
export SETUP_TOKEN='<القيمة التي خزّنتها في Vercel>'
curl -i -c /tmp/factory-cookies.txt \
  -X POST "$BASE_URL/api/setup/bootstrap" \
  -H "x-setup-token: $SETUP_TOKEN" \
  -H 'content-type: application/json' \
  --data '{"email":"owner@example.com","password":"<temporary-password-8-chars-or-more>","fullName":"Test Owner"}'
```

رموز bootstrap المتوقعة:

- `200`: نجاح التهيئة وإنشاء GM مع `mustChangePassword=true` وإرجاع cookies. غيّر كلمة المرور المؤقتة فورًا.
- `401`: قيمة `x-setup-token` مفقودة أو غير مطابقة لـ `SETUP_TOKEN`.
- `500`: `SETUP_TOKEN` غير مضبوط على الخادم، أو وقع خطأ داخلي/اتصال أثناء التهيئة؛ افحص إعداد النشر والسجلات الخاصة دون نشر الأسرار.
- `400`: JSON غير صالح أو بريد/اسم/كلمة مرور لا تطابق التحقق (كلمة المرور 8 أحرف على الأقل).
- `410`: سبق تهيئة النظام، أو خسر طلب متزامن السباق لإنشاء المستند. لا تحاول إعادة bootstrap على قاعدة مستخدمة.

يجب ألا يفوز أكثر من طلب واحد إذا أُرسل طلبان بالتزامن.

بعدها:

```bash
curl -sS "$BASE_URL/api/health"
```

المتوقع في وضع الإنتاج: استجابة HTTP 200 بعد جاهزية النظام، وبنية البيانات داخل `data` لا تحتوي إلا `status`, `bootstrapped`, `demoMode`، مثل:

```json
{"success":true,"data":{"status":"ok","bootstrapped":true,"demoMode":false}}
```

قبل اكتمال الإعداد/عند تعذر قاعدة البيانات تكون الحالة `status="degraded"` ورمز HTTP 503، مع الحقول الثلاثة نفسها. لا تظهر أي متغيرات بيئة، ولا `databaseConfigured`/`jwtConfigured`/`databaseReachable`، ولا `demoCredentials` أو رسائل أخطاء اتصال داخلية في الإنتاج. وضع demo فقط يعرض بيانات دخوله التجريبية.

## 3) اختبارات smoke

اختبار المسارات العامة والحماية لا يحتاج بيانات تسجيل دخول:

```bash
node scripts/smoke-test.mjs "$BASE_URL" --public-only
```

اختبارات الجلسة وERP والتصدير والنسخ الاحتياطي تحتاج GM فعّالًا غيّر كلمة مروره:

```bash
SMOKE_EMAIL='owner@example.com' \
SMOKE_PASSWORD='<current-password>' \
node scripts/smoke-test.mjs https://<your-vercel-domain> --expect-prod
```

يشمل `--expect-prod` التحقق من الخروج من demo، health، الجلسة، الحالة، مجموعة صفحات، CSV وExcel، backup JSON، رفض الإجراء المجهول، ورفض `resetDemo` في الإنتاج (`400`). يعيد `--mutate` إنشاء عميل اختباري بالمفتاح نفسه مرتين، يتحقق من عدم التكرار، ثم يحذفه:

```bash
SMOKE_EMAIL='owner@example.com' SMOKE_PASSWORD='<current-password>' \
node scripts/smoke-test.mjs "$BASE_URL" --mutate
```

## 4) بيانات اختبار الأدوار

شغّل هذا **يدويًا فقط على قاعدة اختبار معزولة**. ينفّذ أوامر ERP العامة بجلسة GM؛ لا يعمل أثناء البناء. الوسيط `--confirm-test-db` تأكيد متعمد لأن الإضافة دائمة:

```bash
SMOKE_EMAIL='owner@example.com' \
SMOKE_PASSWORD='<current-password>' \
SEED_TEST_PASSWORD='TemporaryTest123!' \
node scripts/seed-test-data.mjs "$BASE_URL" --confirm-test-db
```

يتحقق السكربت من مواقع المخزون الثلاثة `WH_RAW`, `WH_MFG`, `WH_FG`، ويضيف عند غيابها موردين، عميلين، أربع مواد خام، منتجًا ووصفة، مركبة، ماكينة، نقطة توزيع، ومستخدمًا لكل من ACCOUNTANT وOPERATIONS وQUALITY وSTOREKEEPER وDRIVER وSALES. الأوامر idempotent بحسب البريد/الاسم/الكود. ينشئ المستخدمون مع `mustChangePassword=true`؛ أكمل تغيير كلمة المرور عند أول دخول. كلمة المرور الافتراضية في السكربت للاختبار فقط؛ عيّن `SEED_TEST_PASSWORD` لقيمة مؤقتة غير مستخدمة في أي مكان آخر واحذف حسابات الاختبار بعد الاختبار.

## 5) تحقق SQL بعد bootstrap

نفّذ في Neon SQL Editor بعد bootstrap. لا تعتمد على وجود سجلات تجارية مسبقة؛ القاعدة تكون فارغة قبل التهيئة:

```sql
SELECT id, version, "updatedAt"
FROM "ErpDocument"
WHERE id = 'main';

SELECT id, octet_length(payload::text) AS payload_bytes
FROM "ErpDocument"
WHERE id = 'main';

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

المتوقع: صف `main` واحد وإصدار موجب؛ بعد bootstrap يحتوي payload على حالة ERP كاملة. الحجم بالبايت يعرض حجم JSON دون تنزيله. `ArchiveRecord` يستخدمه الأرشيف؛ نماذج Prisma الإضافية غير المستخدمة وقت التشغيل موثقة في `docs/DB-MIGRATION-AUDIT.md` ولا ينبغي حذفها ضمن اختبار Vercel.

## 6) حدود Vercel المعروفة

- المرفقات والنسخ المحلية المكتوبة في `/tmp` **مؤقتة** وتُمحى؛ استخدم قاعدة البيانات/تخزينًا دائمًا للمرفقات إذا لزم حفظها.
- جسم الطلب لدى Vercel محدود عادةً بـ **4.5 MB**، حتى لو سمحت طبقة التطبيق بملف حجمه **10 MB**؛ لا تعتبر حد التطبيق ضمانًا لقبول Vercel للملف.
- حد محاولات الدخول محفوظ في الذاكرة لكل instance؛ قد يختلف بين instances، ولا يُعد مخزنًا موزعًا دائمًا.

## ما لم يُنفّذ من هذا المستودع

لم تُشغّل migrations أو bootstrap أو smoke على Neon/Vercel من بيئة العمل هذه لعدم توفر اتصال قاعدة بيانات وبيئة النشر. نفّذ الأقسام 1–5 يدويًا بعد إعداد Vercel؛ لا تعتبر نشرًا أو اتصالًا ناجحًا قبل رؤية النتائج الفعلية.
