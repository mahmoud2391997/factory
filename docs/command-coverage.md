# تغطية أوامر ERP

هذا الجدول يطابق كل عضو في `Command` داخل `apps/web/lib/erp/domain/types.ts` مع شاشة التشغيل التي تستدعيه. الأوامر المساعدة (الموافقات والاعتمادات) تظهر في سجل الكيان الأب بدلاً من شاشة إنشاء منفصلة. وجود شاشة لا يعني أن أي تكامل خارجي مذكور في متطلبات المنتج قد أُنجز.

| المجال | أوامر المحرك | شاشة التشغيل |
|---|---|---|
| الأصناف والجهات | `createMaterial`, `createProduct`, `createSupplier`, `createCustomer`, `createEmployee`, `updateEmployee` | المخزون `material` / `product`، المشتريات `supplier`، المبيعات `customer`، والموظفون `employee` |
| الوصفات والتسعير | `createRecipe`, `createCustomerRecipe`, `setCustomerPricing`, `setAlternativeBagWeights`, `setVarianceThresholds` | الإنتاج `recipe` / `customerRecipe`؛ محرر حدود الانحراف في شاشة المنتج/الوصفة |
| إعدادات الشركة والحساب | `updateCompany`, `fundBank` | الإعدادات، والمالية/عمليات البنك |
| الشراء والاستلام | `createPurchaseRequest`, `addSupplierQuotation`, `selectSupplierQuotation`, `decidePurchaseRequest`, `convertRequestToPurchaseOrder`, `createPurchaseOrder`, `decidePurchaseOrder`, `receiveGoods` | طلبات الشراء `purchaseRequest` مع مقارنة عروض الموردين، أوامر الشراء `purchaseOrder` والاستلام `goodsReceipt`؛ قرار الشراء داخل سجل الطلب، والاستلام يرتبط بطلب الشراء عبر أمر الشراء |
| المخزون | `transferStock`, `requestAdjustment`, `decideAdjustment`, `scanBarcode` | التحويل `stockTransfer`، التسوية `stockAdjustment`، ومحطة المسح `barcode` |
| الإنتاج والتكاليف | `createProductionOrder`, `completeProduction`, `decideProductionCost`, `recalculateLotCosts` | أمر الإنتاج `productionOrder`، اعتماد تكلفة الدفعة من عرض الدفعة، وإعادة الحساب من المالية/إقفال الشهر |
| المبيعات والتحصيل والسحب | `createInvoice`, `confirmInvoice`, `recordPayment`, `createWithdrawal` | الفواتير `salesInvoice`، التحصيل `salesPayment`، والسحب `withdrawal`؛ التأكيد والتحصيل ضمن سجل الفاتورة |
| المصروفات والموظفون | `createExpense`, `decideExpense`, `recordAttendance`, `importAttendance`, `createLeaveRequest`, `decideLeaveRequest`, `createPayroll`, `decidePayroll`, `payPayroll` | المصروفات `expense`، الموظفون `employee` مع الإجازات، الحضور `attendance`، العمل الإضافي `overtime`، والرواتب `payroll`؛ القرارات داخل سجلاتها |
| الجودة والاستدعاء | `createQualitySample`, `updateQualityResult`, `setQcLimits`, `addQualitySampleAttachment`, `holdLot`, `releaseLot`, `recallLot`, `holdRawBatch`, `releaseRawBatch` | العينات والحدود ومرفقات المختبر `qualitySample`، جودة المورد `supplierQuality`، والحجر/الاستدعاء/التتبع الأمامي في `lotTrace` |
| قطع الغيار والتعبئة | `createSparePart`, `recordSparePartUsage`, `createPackagingMaterial`, `recordPackagingConsumption`, `recordPackagingCount`, `decidePackagingCount` | امتدادات المخزون `inventoryExtensions`، وصرف القطع واستهلاك التعبئة في سياق الماكينة/أمر الإنتاج، والجرد الفعلي لمواد التعبئة مع تقرير لكل مادة |
| علاقات الموردين | `createSupplierTemplate`, `sendSupplierCommunication`, `approveSupplierCommunication` | قوالب ومراسلات الموردين `supplierTemplate` / `supplierCommunication`؛ الاعتماد داخل سجل الرسالة |
| الميزان والتوزيع والتسليم | `recordScaleReading`, `createDistributionPoint`, `closeDistributionDay`, `advanceInvoiceDelivery` | الميزان `scaleReading`، نقاط التوزيع والإغلاق `distributionPoint` / `distributionClosing`، وتسليم الفاتورة `invoiceDelivery` |
| المرافق والصيانة | `recordUtilitiesReading`, `createMachine`, `createMaintenanceSchedule`, `recordMaintenance` | قراءة المرافق `utilitiesReading`، الآلات `machine`، جداول الصيانة `maintenanceSchedule`، وسجلها `maintenanceRecord` |
| البنك | `recordBankTransaction`, `matchBankTransaction` | سجل معاملات البنك والمطابقة `bankTransaction` |
| الأسطول | `createVehicle`, `updateVehicle`, `addFuelLog`, `addVehicleService`, `createTrip`, `requestTripCostAllocation`, `decideTripCostAllocation` | الأسطول `fleet`، الوقود `fleetFuel`، والرحلات `fleetTrips`؛ توزيع التوصيل حسب كميات دفعات الفاتورة ثم اعتماد محاسبي مستقل |
| الالتزامات والوثائق | `createObligation`, `decideObligation`, `payObligationInstallment`, `createCompanyDocument`, `renewCompanyDocument`, `addCompanyDocumentAttachment` | الالتزامات والأقساط `obligation`، ومركز الوثائق والتجديد والمرفقات `documents` |
| المستخدمون والتدقيق | `setRolePermissions`, `setUserPassword`, `archiveHistory` | المستخدمون/الصلاحيات `users`، الأرشفة من الإعدادات، وسجل التدقيق `auditLog` |
| الإشعارات | `markNotificationRead` | الإشعارات `notification` |

## خريطة القائمة الجانبية الجديدة

كل عنوان أدناه مستقل في الشريط الجانبي، وتظل المسارات القديمة كما هي. قد يوجّه أكثر من عنوان إلى الشاشة نفسها إذا كانت الشاشة القائمة تخدم الوظيفتين، مثل المخزون الإضافي والباركود.

| عنوان القائمة | مفاتيح الشاشات والمسارات الحالية |
|---|---|
| لوحة المالك | `dashboard` `/`؛ `factoryPlanned` `/inventory/manufacturing/planned`؛ `factoryActual` `/inventory/manufacturing/actual`؛ `factoryExecution` `/inventory/manufacturing/execution`؛ ملخصات المبيعات والتكلفة والمخزون والهدر عبر `/sales/today`, `/sales/month`, `/sales/open-orders`, `/accounting/cost`, `/accounting/price`, `/accounting/margin`, `/inventory/raw-materials/value`, `/inventory/raw-materials/running-out`, `/inventory/raw-materials/stagnant`, `/inventory/raw-materials/reserved`, `/inventory/manufacturing/waste`, `/inventory/manufacturing/deviation`, `/inventory/manufacturing/variance`, `/inventory/manufacturing/stoppages` |
| السيارات والنقل | `fleet` `/fleet/vehicles` (المركبات والخدمة الدورية)؛ `fleetFuel` `/fleet/fuel` (كل تعبئة)؛ `fleetTrips` `/fleet/trips` (الرحلات، المتوقع/الفعلي، وتوزيع التكلفة) |
| الأقساط والالتزامات المالية | `obligation` `/accounting/obligations` |
| البنك والحسابات | `bankTransaction` `/accounting/financial-ops/bank-transactions`؛ `auditLog` `/settings/audit` (مشترك مع النظام ومحمي بصلاحية المدير العام)؛ `account` `/accounting`؛ `journalEntry` `/accounting/journals`؛ `expense` `/accounting/expenses`؛ `financialOps` `/accounting/financial-ops`؛ `taxSettings` `/accounting/tax`؛ `vatReport` `/accounting/vat`؛ `accountingReports` `/accounting/reports` |
| المشتريات والموافقات | `purchaseRequest` `/sales/parties/requests`؛ `purchaseOrder` `/sales/parties/orders`؛ `goodsReceipt` `/sales/parties/receipts`؛ `supplier` `/sales/parties/suppliers` |
| مخزن قطع الغيار | `inventoryExtensions` `/inventory/extensions` |
| مخزن مواد التعبئة والتشغيل | `inventoryExtensions` `/inventory/extensions` |
| التواصل مع الموردين | `supplierTemplate` `/sales/parties/templates`؛ `supplierCommunication` `/sales/parties/communications`؛ `supplierRelations` `/sales/parties/relations` |
| التصنيع والميزان | `productionOrder` `/inventory/manufacturing/orders`؛ `scaleReading` `/inventory/manufacturing/scale`؛ `productionLot` `/inventory/manufacturing/lots`؛ `productionReports` `/inventory/manufacturing/reports` |
| الخلطات والأوزان | `recipe` `/inventory/manufacturing`؛ `recipeItem` `/inventory/manufacturing/recipe-items`؛ بطاقة المنتج `product` `/inventory/products` |
| خلطات العملاء | `customerRecipe` `/inventory/manufacturing/customer-recipes` |
| نقاط التوزيع | `distribution` `/sales/distribution`؛ `distributionPoint` `/sales/distribution/points`؛ `barcode` `/inventory/warehouses/barcode`؛ `distributionClosing` `/sales/distribution/closing` |
| دورة الفاتورة والتسليم | `invoiceDelivery` `/sales/delivery` |
| الكهرباء والماء والغاز | `utilitiesReading` `/accounting/financial-ops/utilities` |
| التصاريح والعقود والوثائق | `documents` `/accounting/documents` |
| الموظفون | `employee` `/hr`؛ `attendance` `/hr/attendance`؛ `overtime` `/hr/overtime`؛ `payroll` `/hr/payroll` |
| تحليل أسعار المواد الخام | `materialPriceAnalysis` `/inventory/raw-materials/price-analysis` |
| الصيانة | `maintenance` `/inventory/manufacturing/maintenance`؛ `machine` `/inventory/manufacturing/maintenance/machines`؛ `maintenanceSchedule` `/inventory/manufacturing/maintenance/schedules`؛ `maintenanceRecord` `/inventory/manufacturing/maintenance/records` |
| الجودة والتحليل الغذائي | `qualitySample` `/inventory/manufacturing/quality`؛ `supplierQuality` `/inventory/manufacturing/supplier-quality` |
| تتبع الدفعات والهدر | `lotTrace` `/inventory/manufacturing/lot-trace`؛ `factoryWaste` `/inventory/manufacturing/waste`؛ `factoryDeviation` `/inventory/manufacturing/deviation`؛ `varianceReport` `/inventory/manufacturing/variance`؛ `materialTrace` `/tasks/material` |
| الربحية | `profitability` `/sales/profitability`؛ تكلفة الطن `/accounting/cost`؛ الهامش `/accounting/margin`؛ متوسط السعر `/accounting/price` |
| المبيعات | `customer` `/sales/parties`؛ `salesInvoice` `/sales`؛ `salesPayment` `/sales/collections`؛ `withdrawal` `/sales/withdrawals`؛ `salesReports` `/sales/reports` |
| المخزون العام | `material` `/inventory/raw-materials`؛ `product` `/inventory/products`؛ `warehouse` `/inventory/warehouses`؛ `stockTransfer` `/inventory/warehouses/transfers`؛ `stockAdjustment` `/inventory/warehouses/adjustments`؛ `barcode` `/inventory/warehouses/barcode`؛ `materialBatch` `/inventory/raw-materials/batches`؛ `inventoryBalance` `/inventory/raw-materials/balances`؛ `inventoryTransaction` `/inventory/raw-materials/ledger`؛ `inventoryReports` `/inventory/reports`؛ مؤشرات الأرصدة `/inventory/raw-materials/value`, `/inventory/raw-materials/running-out`, `/inventory/raw-materials/stagnant`, `/inventory/raw-materials/reserved` |
| النظام | `users` `/settings/users`؛ `auditLog` `/settings/audit`؛ `companySettings` `/settings`؛ `report` `/tasks/reports`؛ `approvals` `/tasks/approvals`؛ `notification` `/notifications` |

**شاشات/قدرات مستقلة غير موجودة حتى الآن:** مرتجعات المبيعات (أقربها الفاتورة والسحب)؛ تقرير تجميعي لتكلفة النقل لكل طن/طلبية/عميل (الرحلة تقارن وقودها المتوقع/الفعلي ويمكن توزيع تكلفتها على الدفعات والفواتير)؛ رفع صورة إثبات التسليم (الشاشة تحفظ اسم/رقم/موقع المستلم ووقت التسليم)؛ تاريخ أسعار مخصص لخلطات العملاء؛ وضبط/بوابة عميل لإظهار وصفة لعميل آخر. الاختصارات تشير فقط إلى أقرب شاشة حالية ولا تنشئ وظائف جديدة.

## التحقق من الربط

- واجهة `Command` هي قائمة الأوامر المرجعية، وخريطة الشاشات في `apps/web/components/erp/live/workspace.tsx` تربط مفاتيح الصفحات بمكوّناتها.
- سجل `COMMAND_ACTIONS` في `apps/web/app/api/erp/route.ts` يفرض اكتمال إدراج كل أمر في API؛ إضافة أمر جديد من دون توصيله للمسار تجعل فحص TypeScript يفشل.
- اختبارات المحرك والنطاق في `apps/web/lib/erp/domain/*.test.ts` تغطي قواعد الأوامر والحسابات. يلزم تشغيل `pnpm test:erp` و`pnpm build` بعد أي تغيير في الربط.
- لوحة المالك تعرض أقسام التشغيل والمالية والتنبيهات وفق `dashboardAccess` وصلاحيات المستخدم؛ وتُحسب مواعيد الأقساط والوثائق وصيانة المركبات والماكينات بدالة قابلة للاختبار `dashboardAlerts`.
- نقطة `/api/erp/export` تدعم Excel وCSV؛ التفويض لكل نوع تقرير مستقل، وتُحجب أعمدة التكلفة عن من لا يملك صلاحية مالية. صفحات الطباعة تشمل الفاتورة وأمر الشراء والدفعة والاستدعاء والملصقات وأمر التسليم.
- بعض القرارات تقصد الظهور داخل سجلها الأصلي (مثل اعتماد الاستلام/الفاتورة/الراتب)، لذلك لم تُنشأ لها صفحات تكرارية.

## حدود التنفيذ الحالية

- معاملات البنك تُسجّل وتُطابق من الشاشة؛ لا يوجد ربط بمصرف خارجي لأن توفر API واعتماداته لم يُحددا.
- مراسلات الموردين تسجل مسار التحضير والاعتماد؛ ربط إرسال فعلي عبر WhatsApp Business أو البريد يتطلب اعتماد قناة ومزود خارجي.
- الأمر `addCompanyDocumentAttachment` يسجل بيانات الملف وتاريخ إصدار الوثيقة في سجل التدقيق؛ ترفع البايتات عبر `/api/erp/documents/[documentId]/attachments` وتُنزّل عبر مسار محمي منفصل، ولا تمر عبر JSON في `/api/erp`.
- يدعم الميزان الآن الإدخال اليدوي ومحوّلاً HTTP/JSON محمياً؛ تبقى الترجمة الشاملة للعربية والإنجليزية والهندية عملاً تالياً.
- تكلفة رحلة مرتبطة بفاتورة لا تدخل تكلفة الدفعات إلا بعد اعتماد المحاسبة؛ اعتمادها يحدّث الدفعات المرتبطة مباشرة.
