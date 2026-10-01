# خطة المهام: إصلاح الاختبارات، سير عمل CI، وربط سبعة أوامر

هذا الملف يقسم متطلبات `spec.md` إلى شرائح عمودية ذرية مرتبة حسب التبعية، مع أولوية ومتطلبات اختبار لكل مهمة.

---

## المهمة 1: إصلاح collections.today في اختبار dashboard (A.1)

**الأولوية**: عالية  
**الحالة**: pending  
**معيار القبول الأصل**: rule A.1  
**السبب المقترح للخلل** (يُثبّت أو يُبدّل أثناء التنفيذ):
- تحليل التوقيت في `seedClockStart` وعدد الخطوات `step` بين `completeProduction` و`recordPayment`: إذا تجاوز مجموع تقدّمات الساعات منتصف ليل Muscat (أي عبر حدود اليوم عند تطبيق MUSCAT_OFFSET_MS)، فإن `payment.at` يقع في يوم Muscat مختلف عن `productionOrder.completedAt`.
- كذلك، `factoryStatus` في `reports.ts` تستخدم مجموعة `activity` التي تشمل `productionOrders.completedAt` و`invoices.issuedAt` فقط، **لا تشمل** `payments.at`؛ لذلك إذا وقع الدفع في يوم مختلف، فلن يُحسب ضمن `collections.today` ليوم النشاط الصناعي المطلوب.

**خيارات الإصلاح (يُختار أحدها مع التبرير)**:
1. **إصلاح `seed.ts`**: تعديل عدد ساعات `CONFIRM_INVOICE_ADVANCES` أو ترتيب الخطوات لضمان وقوع `recordPayment` في نفس يوم Muscat لـ `completedAt`.
2. **إصلاح `reports.ts`**: إضافة تواريخ الدفعات إلى مجموعة `activity` داخل `factoryStatus`، بحيث يصبح يوم الدفع مرشحاً صالحاً لتحديد `day` عندما يكون هو الأحدث المتاح.
3. **تحديث الاختبار فقط** إذا ثبت أن التوقع الحالي (50) يعتمد على افتراض قديم خاطئ.

**متطلبات الاختبار (Test Requirements)**:
- rule: تشغيل اختبار وحيد: `dashboard.test.ts` "seeded factory exposes a held batch..." ويمرّ بدون أخطاء مع `assert.equal(status.collections.today, 50)`.
- rule: تشغيل `pnpm test:erp` كاملاً ويمرّ (يجب تسجيل عدّاد الاختبارات الناجحة والفاشلة).
- rule: تشغيل `pnpm build` ويمرّ بنجاح.

---

## المهمة 2: تحديث رسالة رفض صلاحية طلب الإجازة (A.2)

**الأولوية**: عالية  
**الحالة**: pending  
**معيار القبول الأصل**: rule A.2  

**الوصف**:
- إن كان ملف `leave-request.test.ts` غير موجود، يتم إنشاؤه في `apps/web/lib/erp/domain/` مع نموذج الاختبار المحدد:
  - اسم الاختبار: `"operations cannot approve leave requests by default"`.
  - يستخدم ممثلاً بدور `OPERATIONS` يحاول تنفيذ `decideLeaveRequest`.
  - التوقع: النتيجة `!ok`، و`result.error` يساوي بالضبط `"ليست لديك صلاحية لهذا الإجراء"` (لا regex `/غير مصرح/`).
- إن كان الاختبار موجوداً مسبقاً، يتم تحديث شرط التطابق فقط مع الحفاظ على سلوك الرفض نفسه.

**متطلبات الاختبار**:
- rule: اختبار leave-request وحيد يمرّ مع الرسالة الجديدة `"ليست لديك صلاحية لهذا الإجراء"`.
- rule: `pnpm test:erp` كاملاً يمرّ (عدّاد).
- rule: `pnpm build` يمرّ.

---

## المهمة 3: تشغيل الاختبارات بثلاثة تواريخ ERP_NOW مختلفة (A.3)

**الأولوية**: عالية  
**الحالة**: pending  
**المعيار الأصلي**: rule A.3  
**التبعية**: تعتمد على إكمال المهمة 1 والمهمة 2.

**الوصف**:
- تشغيل `pnpm test:erp` مع:
  1. `ERP_NOW="2026-01-15T08:00:00.000Z"`
  2. `ERP_NOW="2026-06-30T08:00:00.000Z"`
  3. `ERP_NOW="2026-12-01T08:00:00.000Z"`
- التسجيل: لكل تشغيل، عدّاد `pass` و`fail` و`duration_ms`.
- شرط النجاح: ثلاث عمليات تشغيل تعطي `fail 0` جميعاً.

**متطلبات الاختبار**:
- rule: كل تشغيل من الثلاثة يمرّ (fail=0).
- rule: `pnpm build` يمرّ مرة إضافية كتأكيد نهائي لصحة Task A ككل.

---

## المهمة 4: إنشاء سير عمل GitHub Actions CI (B)

**الأولوية**: متوسطة  
**الحالة**: pending  
**المعيار الأصلي**: rule B  

**الوصف**:
- إنشاء الدليل `.github/workflows/` إن لم يكن موجوداً.
- إنشاء ملف `.github/workflows/ci.yml` يحتوي على:
  - `name: CI`
  - `on: [push, pull_request]` (يُفضّل تقييد `pull_request` على `main` فقط إن أمكن، دون فقدان push العام).
  - Job واحد، `ci`، يعمل على `ubuntu-latest`.
  - الخطوات بالترتيب التالي:
    1. `actions/checkout@v4`
    2. إعداد Node.js بالإصدار المطابق لـ `.nvmrc` أو `22`، مع إعداد `pnpm` (استخدام `pnpm/action-setup` أو طريقة `corepack enable` مع `setup-node`).
    3. `pnpm install` مع `frozen-lockfile` إن أمكن، وتفعيل `cache` لـ pnpm.
    4. `pnpm test:erp` مع تمرير متغيّرات بيئة وهمية كافية لنجاح البناء (مثل `DATABASE_URL=postgres://postgres:dummy@localhost:5432/dummy`، وأي مفاتيح أخرى يحتاجها التطبيق مثل `AUTH_SECRET=dummy_secret_1234567890` — يُكتشف من ملف env.example أو build الفاشل).
    5. `pnpm build` بنفس متغيّرات البيئة الوهمية.
  - قاعدة بيانات فعلية **غير مطلوبة**.

**متطلبات الاختبار**:
- rule: صحة بناء الجملة (YAML lint): التأكد من صحة بناء `ci.yml` يدويًا أو باستخدام مدقق بناء.
- rule: تشغيل محلي لمحاكاة الخطوات: تمرير `pnpm test:erp` و`pnpm build` مع نفس متغيّرات البيئة الوهمية المذكورة في ملف CI يمرّان بنجاح (هذا دليل على أن السير العمل سيمرّ على GitHub).
- rubric: **صحة ومتانة CI (0-2)** —
  - 2: تمرير متغيّرات كاملة + cache + frozen-lockfile، ولا توجد خطوات زائدة أو ناقصة.
  - 1: الخطوات الأربعة الأساسية موجودة ولكن بدون cache أو بدون `frozen-lockfile`.
  - 0: إغفال متغيّرات بيئة أساسية يمنع البناء من النجاح.

---

## المهمة 5: ربط الأمر fundBank (C.4)

**الأولوية**: متوسطة  
**الحالة**: pending  
**المعيار الأصلي**: rule C.1  

**الشاشة**: `financialOps` أو `companySettings` داخل `screens-office.tsx`.

**الوصف**:
- البحث عن الدور/الصلاحية في `engine.ts` للأمر `fundBank` (مفتاح الصلاحية من جدول `PERMISSION`).
- إضافة زر "إيداع في البنك" / نموذج `FormDialog` يجمع:
  - `amount` (الرقم، إلزامي، موجب).
  - `memo` (الملاحظة، اختياري).
- قبل الإرسال: `can(ctx.permissions, 'المفتاح')`.
- رسائل عربية: إذا كان `amount <= 0` → رسالة عربية في `InlineError` (مثل "المبلغ يجب أن يكون أكبر من صفر").
- استدعاء: `ctx.act('fundBank', { amount: Number(amount), memo })`.
- إنشاء اختبار محرك في ملف اختبار مناسب (مثل `bank.test.ts` إن وجد أو `engine.test.ts`) يؤكد أن:
  - مستخدم بدون الصلاحية المطلوبة يفشل مع "ليست لديك صلاحية لهذا الإجراء".
  - مستخدم بالصلاحية + مبلغ صالح → البنك يزداد بالمبلغ والدفعة موجودة في `state.bankTransactions` أو الحساب 1500 في `balances` (حسب التنفيذ الحالي).

**متطلبات الاختبار**:
- rule: يمرّ `pnpm test:erp` مع اختبار `fundBank` الجديد/الموجود.
- rule: يمرّ `pnpm build`.
- rule: الشاشة المقصودة في `screens-office.tsx` تحتوي على نموذج الإرسال مع فحص الصلاحيات والتحقّقات العربية.

---

## المهمة 6: ربط الأمر updateVehicle (C.7)

**الأولوية**: متوسطة  
**الحالة**: pending  
**المعيار الأصلي**: rule C.2  
**التبعية**: لا توجد (يمكن العمل عليها بالتوازي مع 5، ولكن تنفيذ تسلسلي لأغراض الـ commit).

**الشاشة**: قسم الأسطول (`fleet`) في `screens-office.tsx` (بجانب `createVehicle` و`addFuelLog` و`addVehicleService`).

**الوصف**:
- صلاحية الأمر في `engine.ts`: البحث عنها ضمن جدول `PERMISSION`.
- إضافة نموذج تعديل مركبة ضمن شاشة الأسطول (مثل: قائمة منسدلة تختار `vehicle.id` ثم حقول):
  - إلزامي: `id` (المركبة المختارة).
  - اختيارية: `plateNo`, `type`, `nameAr`, `active` (checkbox)، `inspectionExpiryDate`, `insuranceExpiryDate`, `ownershipExpiryDate`, `kmPerLiter`.
- تحقّق عربي: إذا تم تمرير `kmPerLiter` يجب أن يكون ≥ 0.
- استدعاء: `ctx.act('updateVehicle', {...})`.
- اختبار محرك: التأكد من أن التعديل يغيّر الحقول في `state.vehicles` وأن المستخدم بدون صلاحية يرفض.

**متطلبات الاختبار**:
- rule: يمرّ `pnpm test:erp` مع اختبار `updateVehicle`.
- rule: يمرّ `pnpm build`.
- rule: وجود نموذج التعديل في الشاشة مع فحص صلاحيات وتحقّقات عربية.

---

## المهمة 7: ربط الأمر setCustomerPricing (C.6)

**الأولوية**: متوسطة  
**الحالة**: pending  
**المعيار الأصلي**: rule C.3  

**الشاشة**: `customer` داخل `screens-ops.tsx` (ضمن عرض العميل).

**الوصف**:
- صلاحية الأمر: البحث عنها في `engine.ts`.
- داخل قسم عرض العميل، نموذج "تسعير خاص" يختار:
  - المنتج (`productId` من القائمة المنسدلة للمنتجات النشطة).
  - السعر (`price`، رقم موجب، إلزامي).
- تحقّق عربي: "السعر يجب أن يكون موجباً".
- استدعاء: `ctx.act('setCustomerPricing', { productId, customerId, price: Number(price) })`.
- اختبار محرك يؤكد إنشاء/تحديث صف تسعير العميل في `state.customerRecipes` أو أي موقع تخزين مناسب حسب التنفيذ الحالي (انظر `types.ts`).

**متطلبات الاختبار**:
- rule: يمرّ `pnpm test:erp`.
- rule: يمرّ `pnpm build`.
- rule: الشاشة والنموذج مع الفحص والتحقق العربي موجودان.

---

## المهمة 8: ربط الأمر setAlternativeBagWeights (C.5)

**الأولوية**: متوسطة  
**الحالة**: pending  
**المعيار الأصلي**: rule C.4  

**الشاشة**: `product` داخل `screens-ops.tsx` (ضمن عرض المنتج/محرر المنتج).

**الوصف**:
- صلاحية الأمر: البحث عنها في `engine.ts`.
- داخل قسم المنتج، إضافة نموذج "أوزان أكياس بديلة":
  - قائمة بأوزان الأكياس (مثل إدخال كل وزن في حقل `TextInput` متعدد مع زر إضافة صف، أو قائمة مفصولة بفواصل ثم تحويلها إلى `number[]`).
  - التأكد من أن كل وزن > 0.
- تحقّق عربي: "وزن الكيس يجب أن يكون أكبر من صفر".
- استدعاء: `ctx.act('setAlternativeBagWeights', { productId, bagKg: [25, 40, 50] })` (مثال).
- اختبار محرك يؤكد أن الأوزان البديلة تخزّن في المنتج المقابل ضمن `state.products`.

**متطلبات الاختبار**:
- rule: يمرّ `pnpm test:erp`.
- rule: يمرّ `pnpm build`.
- rule: الشاشة والنموذج مع الفحص والتحقق العربي موجودان.

---

## المهمة 9: ربط الأمر addCompanyDocumentAttachment (C.1)

**الأولوية**: متوسطة  
**الحالة**: pending  
**المعيار الأصلي**: rule C.5  

**الشاشة**: `documents` داخل `screens-office.tsx`.

**الوصف**:
- صلاحية الأمر: البحث عنها في `engine.ts`.
- ضمن قسم الوثائق، لكل وثيقة زر "إضافة مرفق" يفتح `FormDialog` يحوي:
  - اختيار ملف (input[type=file])، ثم استدعاء واجهة برمجة التطبيقات `/api/erp/documents/[documentId]/attachments` لرفع البايتات والحصول على `{id, fileName, mediaType, sizeBytes}` (انظر الملفات المقابلة في `api/erp/documents/.../attachments/route.ts`).
  - بعد نجاح الرفع، استدعاء `ctx.act('addCompanyDocumentAttachment', { documentId, id, fileName, mediaType, sizeBytes })`.
- رسائل عربية للملف: "يرجى اختيار ملف" عند الإرسال بلا ملف.
- فحص صلاحية قبل الرفع والبعد.
- اختبار محرك (أو اختبار route) يؤكد أن المرفق يضاف إلى وثيقة الشركة في `state.companyDocuments[].attachments` (حسب هيكل البيانات).

**متطلبات الاختبار**:
- rule: يمرّ `pnpm test:erp` (اختبار محرك فقط؛ لا يلزم اختبار ملفات فعلي).
- rule: يمرّ `pnpm build`.
- rule: الشاشة والنموذج مع الفحص والتحقق العربي موجودان (مع تعليق IF/بدون ربط فعلي بالملفات إن لم يكن ممكناً — الهدف الأساسي هو dispatcher).

---

## المهمة 10: ربط الأمر addQualitySampleAttachment (C.2)

**الأولوية**: متوسطة  
**الحالة**: pending  
**المعيار الأصلي**: rule C.6  

**الشاشة**: `qualitySample` داخل `screens-qc.tsx`.

**الوصف**:
- صلاحية الأمر: البحث عنها في `engine.ts`.
- نمط مشابه للمهمة 9 ولكن لعينة الجودة:
  - لكل عينة، زر "إضافة مرفق" → اختيار ملف → استدعاء `/api/erp/quality-samples/[sampleId]/attachments`.
  - ثم `ctx.act('addQualitySampleAttachment', { sampleId, id, fileName, mediaType, sizeBytes })`.
- رسائل عربية مطابقة للمهمة 9.
- اختبار محرك: التأكد من إضافة المرفق إلى العينة المقابلة ورفض المستخدم بدون الصلاحية.

**متطلبات الاختبار**:
- rule: يمرّ `pnpm test:erp`.
- rule: يمرّ `pnpm build`.
- rule: الشاشة والنموذج مع الفحص والتحقق العربي موجودان.

---

## المهمة 11: ربط الأمر advanceInvoiceDelivery (C.3)

**الأولوية**: متوسطة  
**الحالة**: pending  
**المعيار الأصلي**: rule C.7  

**الشاشة**: `invoiceDelivery` داخل `screens-ops.tsx`.

**الوصف**:
- صلاحية الأمر: البحث عنها في `engine.ts`.
- في شاشة تسليم الفواتير:
  - اختيار `invoiceId` (الفاتورة غير المسلّمة بالكامل بعد).
  - اختيار `step` (الخطوة الحالية من `DeliveryStep` في `types.ts`).
  - `notes` اختياري، واختيارياً: `recipientName` و`recipientPhone` و`location` (إذا توفرت واجهة GPS بسيطة — غير مطلوبة؛ يمكن قبول الحقول كنص فقط أو إغفالها).
- رسائل عربية: "الخطوة مطلوبة" واسم المستلم إذا تم طلبه.
- استدعاء: `ctx.act('advanceInvoiceDelivery', { invoiceId, step, notes, deliveryProof: {...} })`.
- اختبار محرك: التأكد من أن الفاتورة تقدّم خطوة التسليم ورفضها بدون صلاحية.

**متطلبات الاختبار**:
- rule: يمرّ `pnpm test:erp`.
- rule: يمرّ `pnpm build`.
- rule: الشاشة والنموذج مع الفحص والتحقق العربي موجودان.

---

## المهمة 12: إعادة توليد وتحديث docs/command-coverage.md (C.8)

**الأولوية**: متوسطة  
**الحالة**: pending  
**المعيار الأصلي**: rule C.8  
**التبعية**: تعتمد على إكمال المهام من 5 إلى 11 بنجاح.

**الوصف**:
- قراءة قائمة `Command` الكاملة من `types.ts`.
- قراءة جميع استدعاءات `ctx.act('...')` من:
  - `screens-ops.tsx`
  - `screens-office.tsx`
  - `screens-qc.tsx`
  - `screens-factory.tsx`
  - `lot-view.tsx`
- إنشاء/تحديث خريطة لكل أمر:
  - إما مسار ملف وشاشة المكوّن التي تستدعيه.
  - أو سبب صريح "محرك فقط" للأوامر التي لا تُستدعى من واجهة (مثل أوامر داخلية أو أوامر مسؤول النظام لا تحتاج واجهة في هذا المشروع، مثلاً `archiveHistory` إذا لم يكن مربوطاً — مع التأكيد صراحة على السبب).
- تحديث الجدول والقائمة في `docs/command-coverage.md` بالترتيب الحالي، مع ضمان تغطية الأوامر السبعة المضافة في هذا الإصدار.
- التشاور مع هيكل الملف الحالي قبل الكتابة للحفاظ على نفس الأسلوب.

**متطلبات الاختبار**:
- rule: البحث النصي في الوثيقة عن كل من: `fundBank`, `updateVehicle`, `setCustomerPricing`, `setAlternativeBagWeights`, `addCompanyDocumentAttachment`, `addQualitySampleAttachment`, `advanceInvoiceDelivery` — كل واحد منها يجب أن يظهر مرتبطاً بشاشة/مكوّن صريحة.
- rule: لا يوجد أمر في `Command` يغيب عن الوثيقة دون ذكر سبب "محرك فقط" صريح.
- rule: يمرّ `pnpm test:erp` و`pnpm build` مرة أخيرة كتدقيق نهائي.

---

## قائمة سريعة: حالة الـ commit لكل مهمة

| المهمة | وصف مختصر | الملفات المتأثرة المتوقعة |
|---|---|---|
| 1 (A.1) | إصلاح dashboard collections.today=0 | `seed.ts` و/أو `reports.ts` و/أو `dashboard.test.ts` |
| 2 (A.2) | تحديث رسالة صلاحية إجازة | إنشاء/تعديل `leave-request.test.ts` |
| 3 (A.3) | تشغيل الاختبارات 3 تواريخ | لا تعديل ملفات (دليل تشغيل فقط) |
| 4 (B) | CI workflow | `.github/workflows/ci.yml` |
| 5 (C.4) | fundBank UI dispatcher | `screens-office.tsx` + ملف اختبار (bank أو engine) |
| 6 (C.7) | updateVehicle UI dispatcher | `screens-office.tsx` + ملف اختبار fleet/engine |
| 7 (C.6) | setCustomerPricing UI dispatcher | `screens-ops.tsx` + ملف اختبار sales/engine |
| 8 (C.5) | setAlternativeBagWeights UI dispatcher | `screens-ops.tsx` + ملف اختبار inventory/engine |
| 9 (C.1) | addCompanyDocumentAttachment dispatcher | `screens-office.tsx` + ملف اختبار documents/engine |
| 10 (C.2) | addQualitySampleAttachment dispatcher | `screens-qc.tsx` + ملف اختبار qc/engine |
| 11 (C.3) | advanceInvoiceDelivery dispatcher | `screens-ops.tsx` + ملف اختبار sales/engine |
| 12 (C.8) | تحديث command-coverage.md | `docs/command-coverage.md` |

---

**ملاحظات التنفيذ**:
- يُفضّل أن تبدأ المهام عالية الأولوية (1 و2 و3) قبل المهام المتوسطة.
- تمرير `pnpm test:erp` و`pnpm build` بعد كل مهمة فرعية هو شرط لا غنى عنه لتعيين الحالة إلى `completed`.
- يتم تسجيل أدلّة الإكمال لكل مهمة: عدد الاختبارات `pass` و`fail` و`duration`، ومسارات الملفات المعدلة، وأسماء الاختبارات المضافة/المعدّلة.
