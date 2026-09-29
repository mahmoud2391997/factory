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
