# تغطية أوامر ERP

الحالة الحالية بعد تدقيق `Command` في `apps/web/lib/erp/domain/types.ts`. «مربوط» يعني أن الشاشة موجودة وتصل إلى محرك الأوامر؛ «محرك فقط» يعني أن الأمر مدعوم في المحرك لكن لا توجد له شاشة مستقلة بعد.

| الأمر | الشاشة / المسار | الحالة |
|---|---|---|
| createMaterial, createProduct | المخزون والمستودعات | مربوط |
| createSupplier, createPurchaseOrder, decidePurchaseOrder, receiveGoods | المشتريات | مربوط |
| createCustomer, createInvoice, confirmInvoice, recordPayment, createWithdrawal | المبيعات | مربوط |
| createEmployee, updateEmployee, recordAttendance, importAttendance, createPayroll, decidePayroll, payPayroll | شؤون الموظفين / الرواتب | مربوط |
| createRecipe, createCustomerRecipe, setCustomerPricing, setAlternativeBagWeights | الإنتاج / وصفات العملاء | مربوط |
| createProductionOrder, completeProduction, decideProductionCost | الإنتاج / دفعات الإنتاج | مربوط |
| transferStock, requestAdjustment, decideAdjustment, scanBarcode | المخزون والمستودعات | مربوط |
| createExpense, decideExpense, fundBank | المالية | مربوط |
| recordPayment | الفواتير | مربوط |
| markNotificationRead | الإشعارات | مربوط |
| setRolePermissions, setUserPassword | المستخدمون والصلاحيات | مربوط |
| archiveHistory | سجل التدقيق / الأرشفة | مربوط |
| createQualitySample, updateQualityResult, setQcLimits | الجودة | مربوط |
| createSparePart, recordSparePartUsage | المخزون الإضافي | محرك فقط — لا توجد شاشة إدخال مستقلة بعد |
| createPackagingMaterial, recordPackagingConsumption | المخزون الإضافي | محرك فقط — لا توجد شاشة إدخال مستقلة بعد |
| createSupplierTemplate, sendSupplierCommunication, approveSupplierCommunication | علاقات الموردين | مربوط |
| recordScaleReading | الإنتاج / الميزان | مربوط |
| createDistributionPoint, closeDistributionDay | نقاط التوزيع | مربوط جزئياً — يلزم استكمال نموذج الإغلاق والتسوية |
| advanceInvoiceDelivery | تسليم الفواتير | مربوط |
| recordUtilitiesReading | المالية / المرافق | مربوط |
| createMachine, createMaintenanceSchedule, recordMaintenance | الإنتاج / الآلات والصيانة | مربوط جزئياً — يلزم استكمال ملف الآلة والتنبيهات |
| recordBankTransaction, matchBankTransaction | المالية / البنك | مربوط جزئياً — يلزم استكمال طابور المطابقة وسجل التدقيق |
| createVehicle, updateVehicle, addFuelLog, addVehicleService, createTrip | الأسطول | محرك فقط — لا توجد شاشة أسطول مكتملة بعد |
| createObligation, decideObligation, payObligationInstallment | الالتزامات المالية | محرك فقط — لا توجد شاشة مكتملة بعد |
| createCompanyDocument, renewCompanyDocument | الوثائق والتصاريح | محرك فقط — لا توجد شاشة مركزية أو مرفقات بعد |

الأوامر التي لا تملك شاشة مستقلة مقصودة مؤقتاً هي أوامر مساعدة (مثل `decideProductionCost` وقرارات الشراء والرواتب والمصروفات) وتظهر داخل شاشة الكيان الأب، وليست مهملة. هذا الملف يمثل خط الأساس قبل استكمال شاشات الأسطول والالتزامات والوثائق وبقية النماذج.

## ملاحظات التدقيق

- تم حذف ملفات التصحيح المؤقتة `patch.py` و`patch2.py` من جذر المستودع.
- يجب أن تبقى كل الأوامر الجديدة مربوطة بشاشة قبل اعتبار المرحلة مكتملة.
- لا توجد تغييرات على مصدر الحقيقة: حالة ERP في `ErpDocument` ومحرك الأوامر.

## خطة التغطية المتبقية

1. إضافة شاشة الأسطول وربط أوامر المركبات والوقود والصيانة والرحلات.
2. إضافة شاشة الالتزامات وجدول الأقساط والدفع والاعتماد.
3. إضافة مركز الوثائق وتجديد النسخ والمرفقات.
4. فصل شاشات قطع الغيار والتعبئة والآلات والبنك والمرافق ونقاط التوزيع عند الحاجة.
5. إضافة اختبارات selectors والحسابات لكل شاشة وتحديث التوثيق بعد كل مرحلة.

## تحديث الجلسة — تحليل أسعار المواد الخام ودعم اللغات

### 1) تحليل أسعار المواد الخام (#16) — مربوط

- دالة التقرير: `materialPriceAnalysis(state, materialId?)` في `apps/web/lib/erp/domain/reports.ts`.
  - لكل خامة: متوسط السعر (مرجّح)، أعلى/أقل سعر، آخر سعر (الحالي)، الكمية المشتراة، قيمة الشراء، الكمية المستهلكة في التصنيع، تكلفة النقل الموزّعة، والتكلفة الواصلة للمصنع (Landed).
  - تفصيل الموردين (الكمية ومتوسط السعر لكل مورد).
  - سلسلة شهرية: متوسط/أعلى/أقل سعر، الكمية المشتراة، المستهلك، النقل، وLanded لكل شهر.
  - توزيع تكلفة النقل: تُوزَّع تكلفة رحلات الشهر على كل خامة حسب حصتها من إجمالي الكمية المشتراة في نفس الشهر.
- الشاشة: `materialPriceAnalysis` — مسار `/inventory/raw-materials/price-analysis`، مع مخطط أعمدة بسيط للسعر والكمية شهرياً.
- الاختبارات: `apps/web/lib/erp/domain/material-price.test.ts` (اختباران).

### 2) دعم اللغات العربية/الإنجليزية/الهندية (#18) — مربوط

- المزوّد: `apps/web/lib/i18n/language-provider.tsx` — `LanguageProvider` + `useLanguage()`.
  - يحفظ اللغة في `localStorage` (المفتاح `erp-language`)، ويضبط `document.documentElement.lang` و`dir` (rtl للعربية، ltr لغيرها).
- المبدّل: قائمة اختيار اللغة في الشريط العلوي داخل `erp-shell.tsx`.
- الترجمة: `apps/web/lib/i18n/translations.ts` — `t(lang, key)` و`destinationLabel(lang, id, fallback)` لترجمة عناوين التنقل الجانبي.
- الاختبارات: `apps/web/lib/i18n/translations.test.ts` (أربعة اختبارات تتأكد من اكتمال المفاتيح في اللغات الثلاث).

### حالة الاختبارات

- `npx tsx --test apps/web/lib/erp/domain/*.test.ts apps/web/server/auth/*.test.ts apps/web/lib/i18n/*.test.ts` → 103 اختبار ناجح.
- `next build` ينجح دون أخطاء.

### خطة التغطية المتبقية (محدّثة)

1. استكمال نماذج إدخال قطع الغيار والتعبئة والآلات والبنك والمرافق ونقاط التوزيع داخل الشاشات المجمّعة عند الحاجة.
2. توسيع ترجمات الشاشات الداخلية لتغطية كامل نصوص الواجهة (الإطار والتنقل مُنجز).
3. إضافة اختبارات selectors لكل شاشة جديدة.
