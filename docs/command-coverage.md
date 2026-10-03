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

## خريطة مساحات العمل والأقسام والصفحات

هذه الخريطة تقابل الكتالوج الوحيد في `apps/web/lib/nav/config.ts`. مستوى القائمة الجانبية الأول مساحة العمل، والثاني أقسام المساحة النشطة؛ صفحات القسم تظهر مرة واحدة في تبويبات المحتوى. كل رابط أدناه يحتفظ بمساره الحالي، ما عدا عرض المخزون الإضافي الذي يميز القطع عن مواد التعبئة بمعامل `kind`.

| مساحة العمل | القسم | الصفحة | مفتاح الشاشة | المسار |
|---|---|---|---|---|
| الرئيسية | لوحة المالك | لوحة المالك | `dashboard` | `/` |
| المبيعات والتوزيع | العملاء والفواتير | مبيعات اليوم | `factorySalesToday` | `/sales/today` |
| المبيعات والتوزيع | العملاء والفواتير | مبيعات الشهر | `factorySalesMonth` | `/sales/month` |
| المبيعات والتوزيع | العملاء والفواتير | طلبات مفتوحة | `factoryOpenOrders` | `/sales/open-orders` |
| المبيعات والتوزيع | العملاء والفواتير | العملاء | `customer` | `/sales/parties` |
| المبيعات والتوزيع | العملاء والفواتير | الفواتير | `salesInvoice` | `/sales` |
| المبيعات والتوزيع | العملاء والفواتير | تقارير المبيعات | `salesReports` | `/sales/reports` |
| المبيعات والتوزيع | التحصيل والمرتجعات | السحوبات والمرتجعات | `withdrawal` | `/sales/withdrawals` |
| المبيعات والتوزيع | التحصيل والمرتجعات | التحصيل | `salesPayment` | `/sales/collections` |
| المبيعات والتوزيع | نقاط التوزيع | التوزيع | `distribution` | `/sales/distribution` |
| المبيعات والتوزيع | نقاط التوزيع | نقاط التوزيع | `distributionPoint` | `/sales/distribution/points` |
| المبيعات والتوزيع | نقاط التوزيع | الإقفال اليومي | `distributionClosing` | `/sales/distribution/closing` |
| المبيعات والتوزيع | دورة الفاتورة والتسليم | التسليم | `invoiceDelivery` | `/sales/delivery` |
| المبيعات والتوزيع | الربحية | تكلفة الطن | `factoryCostPerTon` | `/accounting/cost` |
| المبيعات والتوزيع | الربحية | متوسط السعر | `factoryAvgPrice` | `/accounting/price` |
| المبيعات والتوزيع | الربحية | هامش الربح | `factoryMargin` | `/accounting/margin` |
| المبيعات والتوزيع | الربحية | الربحية | `profitability` | `/sales/profitability` |
| المشتريات والموردون | المشتريات والموافقات | الموردون | `supplier` | `/sales/parties/suppliers` |
| المشتريات والموردون | المشتريات والموافقات | طلبات الشراء | `purchaseRequest` | `/sales/parties/requests` |
| المشتريات والموردون | المشتريات والموافقات | أوامر الشراء | `purchaseOrder` | `/sales/parties/orders` |
| المشتريات والموردون | المشتريات والموافقات | استلام البضاعة | `goodsReceipt` | `/sales/parties/receipts` |
| المشتريات والموردون | التواصل مع الموردين | علاقات الموردين | `supplierRelations` | `/sales/parties/relations` |
| المشتريات والموردون | التواصل مع الموردين | قوالب الرسائل | `supplierTemplate` | `/sales/parties/templates` |
| المشتريات والموردون | التواصل مع الموردين | مراسلات الموردين | `supplierCommunication` | `/sales/parties/communications` |
| المشتريات والموردون | تحليل أسعار المواد الخام | أسعار الخام | `materialPriceAnalysis` | `/inventory/raw-materials/price-analysis` |
| المخازن | المواد الخام والمنتجات | المواد الخام | `material` | `/inventory/raw-materials` |
| المخازن | المواد الخام والمنتجات | المنتجات | `product` | `/inventory/products` |
| المخازن | مخزن قطع الغيار | قطع الغيار | `inventoryExtensions` | `/inventory/extensions?kind=spare` |
| المخازن | مخزن مواد التعبئة والتشغيل | مواد التعبئة | `inventoryExtensions` (عرض بديل) | `/inventory/extensions?kind=packaging` |
| المخازن | الحركات والجرد والتقارير | قيمة المخزون | `factoryStockValue` | `/inventory/raw-materials/value` |
| المخازن | الحركات والجرد والتقارير | مواد قاربت النفاد | `factoryRunningOut` | `/inventory/raw-materials/running-out` |
| المخازن | الحركات والجرد والتقارير | مواد راكدة | `factoryStagnant` | `/inventory/raw-materials/stagnant` |
| المخازن | الحركات والجرد والتقارير | مواد محجوزة | `factoryReserved` | `/inventory/raw-materials/reserved` |
| المخازن | الحركات والجرد والتقارير | المستودعات | `warehouse` | `/inventory/warehouses` |
| المخازن | الحركات والجرد والتقارير | تحويل المخزون | `stockTransfer` | `/inventory/warehouses/transfers` |
| المخازن | الحركات والجرد والتقارير | تسوية المخزون | `stockAdjustment` | `/inventory/warehouses/adjustments` |
| المخازن | الحركات والجرد والتقارير | الباركود | `barcode` | `/inventory/warehouses/barcode` |
| المخازن | الحركات والجرد والتقارير | دفعات المواد | `materialBatch` | `/inventory/raw-materials/batches` |
| المخازن | الحركات والجرد والتقارير | أرصدة المخزون | `inventoryBalance` | `/inventory/raw-materials/balances` |
| المخازن | الحركات والجرد والتقارير | دفتر الحركات | `inventoryTransaction` | `/inventory/raw-materials/ledger` |
| المخازن | الحركات والجرد والتقارير | تقارير المخزون | `inventoryReports` | `/inventory/reports` |
| الإنتاج والجودة | التصنيع والميزان | المخطط اليوم | `factoryPlanned` | `/inventory/manufacturing/planned` |
| الإنتاج والجودة | التصنيع والميزان | الفعلي | `factoryActual` | `/inventory/manufacturing/actual` |
| الإنتاج والجودة | التصنيع والميزان | نسبة التنفيذ | `factoryExecution` | `/inventory/manufacturing/execution` |
| الإنتاج والجودة | التصنيع والميزان | توقفات المصنع | `factoryStoppages` | `/inventory/manufacturing/stoppages` |
| الإنتاج والجودة | التصنيع والميزان | أوامر التصنيع | `productionOrder` | `/inventory/manufacturing/orders` |
| الإنتاج والجودة | التصنيع والميزان | الميزان | `scaleReading` | `/inventory/manufacturing/scale` |
| الإنتاج والجودة | التصنيع والميزان | دفعات الإنتاج | `productionLot` | `/inventory/manufacturing/lots` |
| الإنتاج والجودة | التصنيع والميزان | تقارير الإنتاج | `productionReports` | `/inventory/manufacturing/reports` |
| الإنتاج والجودة | الخلطات والأوزان | الوصفات | `recipe` | `/inventory/manufacturing` |
| الإنتاج والجودة | الخلطات والأوزان | مكونات الوصفة | `recipeItem` | `/inventory/manufacturing/recipe-items` |
| الإنتاج والجودة | خلطات العملاء | خلطات العملاء | `customerRecipe` | `/inventory/manufacturing/customer-recipes` |
| الإنتاج والجودة | الجودة والتحليل الغذائي | عينات الجودة | `qualitySample` | `/inventory/manufacturing/quality` |
| الإنتاج والجودة | الجودة والتحليل الغذائي | جودة الموردين | `supplierQuality` | `/inventory/manufacturing/supplier-quality` |
| الإنتاج والجودة | تتبع الدفعات والهدر | الهدر | `factoryWaste` | `/inventory/manufacturing/waste` |
| الإنتاج والجودة | تتبع الدفعات والهدر | الانحراف | `factoryDeviation` | `/inventory/manufacturing/deviation` |
| الإنتاج والجودة | تتبع الدفعات والهدر | تحليل الانحراف | `varianceReport` | `/inventory/manufacturing/variance` |
| الإنتاج والجودة | تتبع الدفعات والهدر | تتبع الدفعات | `lotTrace` | `/inventory/manufacturing/lot-trace` |
| الإنتاج والجودة | تتبع الدفعات والهدر | تتبع الخامة | `materialTrace` | `/tasks/material` |
| الأسطول والصيانة | السيارات والنقل | المركبات | `fleet` | `/fleet/vehicles` |
| الأسطول والصيانة | السيارات والنقل | الوقود | `fleetFuel` | `/fleet/fuel` |
| الأسطول والصيانة | السيارات والنقل | الرحلات | `fleetTrips` | `/fleet/trips` |
| الأسطول والصيانة | الصيانة | مركز الصيانة | `maintenance` | `/inventory/manufacturing/maintenance` |
| الأسطول والصيانة | الصيانة | الماكينات | `machine` | `/inventory/manufacturing/maintenance/machines` |
| الأسطول والصيانة | الصيانة | جداول الصيانة | `maintenanceSchedule` | `/inventory/manufacturing/maintenance/schedules` |
| الأسطول والصيانة | الصيانة | سجلات الأعطال | `maintenanceRecord` | `/inventory/manufacturing/maintenance/records` |
| المالية | الأقساط والالتزامات المالية | الالتزامات | `obligation` | `/accounting/obligations` |
| المالية | البنك والحسابات | دليل الحسابات | `account` | `/accounting` |
| المالية | البنك والحسابات | القيود اليومية | `journalEntry` | `/accounting/journals` |
| المالية | البنك والحسابات | معاملات البنك | `bankTransaction` | `/accounting/financial-ops/bank-transactions` |
| المالية | البنك والحسابات | تقارير المحاسبة | `accountingReports` | `/accounting/reports` |
| المالية | المصروفات والضرائب | المصروفات | `expense` | `/accounting/expenses` |
| المالية | المصروفات والضرائب | الضرائب | `taxSettings` | `/accounting/tax` |
| المالية | المصروفات والضرائب | إقرار الضريبة | `vatReport` | `/accounting/vat` |
| المالية | المصروفات والضرائب | العمليات المالية | `financialOps` | `/accounting/financial-ops` |
| المالية | الكهرباء والماء والغاز | المرافق | `utilitiesReading` | `/accounting/financial-ops/utilities` |
| الموظفون والوثائق | الموظفون | ملفات الموظفين | `employee` | `/hr` |
| الموظفون والوثائق | الموظفون | الحضور والإجازات | `attendance` | `/hr/attendance` |
| الموظفون والوثائق | الموظفون | الإضافي | `overtime` | `/hr/overtime` |
| الموظفون والوثائق | الموظفون | الرواتب | `payroll` | `/hr/payroll` |
| الموظفون والوثائق | التصاريح والعقود والوثائق | الوثائق | `documents` | `/accounting/documents` |
| الإدارة | المستخدمون والصلاحيات | المستخدمون | `users` | `/settings/users` |
| الإدارة | الاعتمادات | الاعتمادات | `approvals` | `/tasks/approvals` |
| الإدارة | الإشعارات | الإشعارات | `notification` | `/notifications` |
| الإدارة | سجل العمليات | سجل العمليات | `auditLog` | `/settings/audit` |
| الإدارة | الإعدادات والتقارير | التقارير | `report` | `/tasks/reports` |
| الإدارة | الإعدادات والتقارير | الإعدادات | `companySettings` | `/settings` |
| مشتركة | الأدلة | دليل البنود | `navigationGuide` | `/guide` |

**بطاقات لوحة المالك:** `factoryPlanned`، `factoryActual`، `factoryExecution`، `factorySalesToday`، `factorySalesMonth`، `factoryOpenOrders`، `factoryCostPerTon`، `factoryAvgPrice`، `factoryMargin`، `factoryStockValue`، `factoryRunningOut`، `factoryStagnant`، `factoryReserved`، `factoryWaste`، `factoryDeviation`، `varianceReport`، `factoryStoppages`؛ كل بطاقة تفتح صفحة التفاصيل المطابقة متى سمحت الصلاحية.

**إعادة التوجيه:** `/inventory/extensions` ← `/inventory/extensions?kind=spare` للروابط القديمة؛ `/inventory/extensions?kind=packaging` يفتح تبويب مواد التعبئة. احتفظنا ببقية المسارات كما هي. `inventoryExtensions` له مسار قانوني واحد لقطع الغيار، وعرض التعبئة البديل يختلف بمفتاح صفحة ومعامل الاستعلام.

**قدرات غير متاحة كشاشات مستقلة:** لا توجد شاشة مرتجعات مستقلة (الأقرب السحوبات/الفواتير)، ولا تقرير تجميعي لتكلفة النقل لكل طن أو طلبية أو عميل، ولا إرفاق صورة لإثبات التسليم، ولا شاشة تاريخ أسعار مخصصة لخلطات العملاء أو بوابة عميل. تظل روابط هذه الوظائف قريبة من الشاشات الحالية ولا تضيف سلوكاً تجارياً جديداً.

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
