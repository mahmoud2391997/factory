# تغطية أوامر ERP

هذا الجدول يطابق كل عضو في `Command` داخل `apps/web/lib/erp/domain/types.ts` مع شاشة التشغيل التي تستدعيه. الأوامر المساعدة (الموافقات والاعتمادات) تظهر في سجل الكيان الأب بدلاً من شاشة إنشاء منفصلة. وجود شاشة لا يعني أن أي تكامل خارجي مذكور في متطلبات المنتج قد أُنجز.

| المجال | أوامر المحرك | شاشة التشغيل |
|---|---|---|
| الأصناف والجهات | `createMaterial`, `createProduct`, `createSupplier`, `createCustomer`, `createEmployee`, `updateEmployee` | المخزون `material` / `product`، المشتريات `supplier`، المبيعات `customer`، والموظفون `employee` |
| الوصفات والتسعير | `createRecipe`, `createCustomerRecipe`, `setCustomerPricing`, `setAlternativeBagWeights`, `setVarianceThresholds` | الإنتاج `recipe` / `customerRecipe`؛ محرر حدود الانحراف في شاشة المنتج/الوصفة |
| إعدادات الشركة والحساب | `updateCompany`, `fundBank` | الإعدادات، والمالية/عمليات البنك |
| الشراء والاستلام | `createPurchaseOrder`, `decidePurchaseOrder`, `receiveGoods` | أوامر الشراء `purchaseOrder` والاستلام `goodsReceipt`؛ قرار الشراء داخل سجل الطلب |
| المخزون | `transferStock`, `requestAdjustment`, `decideAdjustment`, `scanBarcode` | التحويل `stockTransfer`، التسوية `stockAdjustment`، ومحطة المسح `barcode` |
| الإنتاج والتكاليف | `createProductionOrder`, `completeProduction`, `decideProductionCost`, `recalculateLotCosts` | أمر الإنتاج `productionOrder`، اعتماد تكلفة الدفعة من عرض الدفعة، وإعادة الحساب من المالية/إقفال الشهر |
| المبيعات والتحصيل والسحب | `createInvoice`, `confirmInvoice`, `recordPayment`, `createWithdrawal` | الفواتير `salesInvoice`، التحصيل `salesPayment`، والسحب `withdrawal`؛ التأكيد والتحصيل ضمن سجل الفاتورة |
| المصروفات والموظفون | `createExpense`, `decideExpense`, `recordAttendance`, `importAttendance`, `createPayroll`, `decidePayroll`, `payPayroll` | المصروفات `expense`، الحضور `attendance`، العمل الإضافي `overtime`، والرواتب `payroll`؛ القرارات داخل سجلاتها |
| الجودة والاستدعاء | `createQualitySample`, `updateQualityResult`, `setQcLimits`, `addQualitySampleAttachment`, `holdLot`, `releaseLot`, `recallLot`, `holdRawBatch`, `releaseRawBatch` | العينات والحدود ومرفقات المختبر `qualitySample`، جودة المورد `supplierQuality`، والحجر/الاستدعاء/التتبع الأمامي في `lotTrace` |
| قطع الغيار والتعبئة | `createSparePart`, `recordSparePartUsage`, `createPackagingMaterial`, `recordPackagingConsumption` | امتدادات المخزون `inventoryExtensions`، وصرف القطع واستهلاك التعبئة في سياق الماكينة/أمر الإنتاج |
| علاقات الموردين | `createSupplierTemplate`, `sendSupplierCommunication`, `approveSupplierCommunication` | قوالب ومراسلات الموردين `supplierTemplate` / `supplierCommunication`؛ الاعتماد داخل سجل الرسالة |
| الميزان والتوزيع والتسليم | `recordScaleReading`, `createDistributionPoint`, `closeDistributionDay`, `advanceInvoiceDelivery` | الميزان `scaleReading`، نقاط التوزيع والإغلاق `distributionPoint` / `distributionClosing`، وتسليم الفاتورة `invoiceDelivery` |
| المرافق والصيانة | `recordUtilitiesReading`, `createMachine`, `createMaintenanceSchedule`, `recordMaintenance` | قراءة المرافق `utilitiesReading`، الآلات `machine`، جداول الصيانة `maintenanceSchedule`، وسجلها `maintenanceRecord` |
| البنك | `recordBankTransaction`, `matchBankTransaction` | سجل معاملات البنك والمطابقة `bankTransaction` |
| الأسطول | `createVehicle`, `updateVehicle`, `addFuelLog`, `addVehicleService`, `createTrip`, `requestTripCostAllocation`, `decideTripCostAllocation` | الأسطول `fleet`، الوقود `fleetFuel`، والرحلات `fleetTrips`؛ توزيع التوصيل حسب كميات دفعات الفاتورة ثم اعتماد محاسبي مستقل |
| الالتزامات والوثائق | `createObligation`, `decideObligation`, `payObligationInstallment`, `createCompanyDocument`, `renewCompanyDocument`, `addCompanyDocumentAttachment` | الالتزامات والأقساط `obligation`، ومركز الوثائق والتجديد والمرفقات `documents` |
| المستخدمون والتدقيق | `setRolePermissions`, `setUserPassword`, `archiveHistory` | المستخدمون/الصلاحيات `users`، الأرشفة من الإعدادات، وسجل التدقيق `auditLog` |
| الإشعارات | `markNotificationRead` | الإشعارات `notification` |

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
- الإضافات الحالية تخص الأوامر/الشاشات المذكورة فقط؛ تبقى الأدوار الإضافية، محول الميزان، والترجمة الشاملة موثقة كعمل تالٍ ولا تُعد منجزة بمجرد وجود command.
- تكلفة رحلة مرتبطة بفاتورة لا تدخل تكلفة الدفعات إلا بعد اعتماد المحاسبة؛ اعتمادها يحدّث الدفعات المرتبطة مباشرة.
