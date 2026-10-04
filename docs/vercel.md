# Vercel Deployment (Monorepo)

يحتوي المستودع تطبيق Next.js واحدًا داخل `apps/web`، لكن إعداد Vercel الوحيد موجود في جذر المستودع.

## إعداد مشروع Vercel

- **Root Directory:** جذر المستودع (`.`)، وليس `apps/web`.
- **Framework Preset:** Next.js.
- **Install Command:** `pnpm install --frozen-lockfile`.
- **Build Command:** `pnpm vercel-build`، وهو يستدعي `scripts/vercel-build.sh`.
- **Output Directory:** القيمة المصرّح بها في `vercel.json` هي `apps/web/.next`؛ لا تنشئ إعدادًا ثانيًا داخل التطبيق.

اختيار جذر المستودع ضروري لاكتشاف `pnpm-workspace.yaml` و`packages/database` وملف القفل الموحد. سكربت البناء يتحقق من البيئة، ويولّد Prisma، ويطبّق migrations عند توافر قاعدة البيانات، ثم يبني تطبيق الويب.

## متغيرات البيئة

راجع [TEST-ON-VERCEL.md](./TEST-ON-VERCEL.md) للإعداد الكامل على Neon والتحقق اليدوي. باختصار:

- `DATABASE_URL`: رابط اتصال مجمع/pooled لتشغيل التطبيق.
- `DATABASE_URL_UNPOOLED` أو اسم Neon/Vercel مباشر مدعوم: رابط direct/unpooled لتطبيق migrations.
- أضف `sslmode=require` إلى الرابطين إذا لم يضفه المزوّد.
- `JWT_SECRET` و`SETUP_TOKEN`: قيم عشوائية قوية، مختلفة، وغير ملتزمة إلى Git.
- لا تستخدم `APP_MODE=demo` مع قاعدة بيانات.

لا يحتوي `packages/database/prisma/schema.prisma` على `directUrl`. يتولى `scripts/vercel-build.sh` اختيار رابط direct وتمريره إلى `prisma migrate deploy`؛ يظل `DATABASE_URL` رابط تشغيل التطبيق.

## الصحة والتهيئة

في الإنتاج يعيد `/api/health` داخل `data` الحقول العامة فقط `status`, `bootstrapped`, `demoMode`. الحالة الجاهزة تكون HTTP 200 و`status="ok"`; الحالة غير الجاهزة تكون HTTP 503 و`status="degraded"`. لا تعتمد على `databaseReachable` أو `jwtConfigured` أو غيرها من حقول التشخيص غير المعروضة.

لتهيئة أول GM، استخدم `POST /api/setup/bootstrap` مع `x-setup-token` وJSON يحتوي `email`, `password`, `fullName` على قاعدة اختبار فارغة فقط. أكمل تغيير كلمة مرور المسؤول بعد نجاح التهيئة. معاني رموز HTTP وحماية seed موضحة في الدليل الشامل [TEST-ON-VERCEL.md](./TEST-ON-VERCEL.md).

ملف `packages/database/prisma/seed.ts` لا يزرع بيانات ERP. تُنشأ حالة التطبيق الأولى عبر bootstrap؛ بيانات الاختبار الإضافية تُنشأ يدويًا وبحذر باستخدام `scripts/seed-test-data.mjs` على قاعدة اختبار معزولة فقط.
