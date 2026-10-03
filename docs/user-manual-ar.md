# دليل استخدام نظام مصنع الخليج للأعلاف

هذا الدليل للعاملين في المكتب والمصنع والإدارة. النظام يعمل من المتصفح على الحاسوب والتابلت والجوال، ويمكن تثبيت اختصار على سطح المكتب.

## الدخول

| الدور | البريد | ماذا يفعل |
| --- | --- | --- |
| المدير العام | `gm@factory.local` | كل الصلاحيات والاعتمادات والإعدادات |
| المحاسب والموارد البشرية | `accounts@factory.local` | الفواتير والتحصيل والمصروفات والرواتب والتقارير المالية وExcel |
| المستودع والإنتاج والمبيعات | `ops@factory.local` | المخزون والشراء والاستلام والإنتاج والبيع والباركود وتسجيل عينات الجودة |
| مسؤول الجودة | `quality@factory.local` | تسجيل عينات الجودة وقراءة المخزون والإنتاج والتقارير. لا يفك رفضاً ولا يعدّل حدود الفحص ولا يرى الرواتب أو القيود |
| سائق | `driver@factory.local` | الاطلاع على رحلاته وسجلات الوقود الخاصة به |
| أمين المخزن | `store@factory.local` | المخزون والتحويلات والاستلام والباركود |
| مسؤول الإنتاج | `production@factory.local` | الإنتاج والميزان ومواد التعبئة وفحوص الجودة التشغيلية |
| مسؤول الصيانة | `maintenance@factory.local` | الصيانة وقطع الغيار وتسجيل صيانة المركبات دون إدارة الرحلات |
| مسؤول المبيعات | `sales@factory.local` | المبيعات والتوزيع وتتبع التسليم |

كلمة المرور الأولية للحسابات التجريبية: `Admin123!`

الحساب `admin@factory.local` هو نفسه حساب المدير العام.

## التنقل حسب مساحات العمل

تتكون القائمة من **مساحة عمل ← قسم ← صفحة**. تعرض القائمة مساحة العمل الحالية وأقسامها فقط؛ وتظهر صفحات القسم في صف تبويبات واحد داخل المحتوى. مساحة «الرئيسية» صفحة واحدة بلا سهم، وبطاقات لوحة المالك الـ17 روابط مباشرة إلى تفاصيلها. افتح «دليل البنود» من لوحة المالك أو البحث لرؤية الفهرس المولد من إعدادات التنقل. ابحث بالمساحة أو القسم أو الصفحة أو المرادف عبر **Ctrl/⌘+K**؛ التنقل يدعم لوحة المفاتيح والجوال، ويحفظ آخر مساحة مفتوحة وحالة الطي على الجهاز.

| مساحة العمل | القسم | الصفحات وروابطها |
| --- | --- | --- |
| الرئيسية | لوحة المالك | [لوحة المالك](/) `dashboard` |
| المبيعات والتوزيع | العملاء والفواتير | [مبيعات اليوم](/sales/today) `factorySalesToday`؛ [مبيعات الشهر](/sales/month) `factorySalesMonth`؛ [طلبات مفتوحة](/sales/open-orders) `factoryOpenOrders`؛ [العملاء](/sales/parties) `customer`؛ [الفواتير](/sales) `salesInvoice`؛ [تقارير المبيعات](/sales/reports) `salesReports` |
| المبيعات والتوزيع | التحصيل والمرتجعات | [السحوبات والمرتجعات](/sales/withdrawals) `withdrawal`؛ [التحصيل](/sales/collections) `salesPayment` |
| المبيعات والتوزيع | نقاط التوزيع | [التوزيع](/sales/distribution) `distribution`؛ [نقاط التوزيع](/sales/distribution/points) `distributionPoint`؛ [الإقفال اليومي](/sales/distribution/closing) `distributionClosing` |
| المبيعات والتوزيع | دورة الفاتورة والتسليم | [التسليم](/sales/delivery) `invoiceDelivery` |
| المبيعات والتوزيع | الربحية | [تكلفة الطن](/accounting/cost) `factoryCostPerTon`؛ [متوسط السعر](/accounting/price) `factoryAvgPrice`؛ [هامش الربح](/accounting/margin) `factoryMargin`؛ [الربحية](/sales/profitability) `profitability` |
| المشتريات والموردون | المشتريات والموافقات | [الموردون](/sales/parties/suppliers) `supplier`؛ [طلبات الشراء](/sales/parties/requests) `purchaseRequest`؛ [أوامر الشراء](/sales/parties/orders) `purchaseOrder`؛ [استلام البضاعة](/sales/parties/receipts) `goodsReceipt` |
| المشتريات والموردون | التواصل مع الموردين | [علاقات الموردين](/sales/parties/relations) `supplierRelations`؛ [قوالب الرسائل](/sales/parties/templates) `supplierTemplate`؛ [مراسلات الموردين](/sales/parties/communications) `supplierCommunication` |
| المشتريات والموردون | تحليل أسعار المواد الخام | [أسعار الخام](/inventory/raw-materials/price-analysis) `materialPriceAnalysis` |
| المخازن | المواد الخام والمنتجات | [المواد الخام](/inventory/raw-materials) `material`؛ [المنتجات](/inventory/products) `product` |
| المخازن | مخزن قطع الغيار | [قطع الغيار](/inventory/extensions?kind=spare) `inventoryExtensions` |
| المخازن | مخزن مواد التعبئة والتشغيل | [مواد التعبئة](/inventory/extensions?kind=packaging) `inventoryExtensions` |
| المخازن | الحركات والجرد والتقارير | [قيمة المخزون](/inventory/raw-materials/value) `factoryStockValue`؛ [مواد قاربت النفاد](/inventory/raw-materials/running-out) `factoryRunningOut`؛ [مواد راكدة](/inventory/raw-materials/stagnant) `factoryStagnant`؛ [مواد محجوزة](/inventory/raw-materials/reserved) `factoryReserved`؛ [المستودعات](/inventory/warehouses) `warehouse`؛ [تحويل المخزون](/inventory/warehouses/transfers) `stockTransfer`؛ [تسوية المخزون](/inventory/warehouses/adjustments) `stockAdjustment`؛ [الباركود](/inventory/warehouses/barcode) `barcode`؛ [دفعات المواد](/inventory/raw-materials/batches) `materialBatch`؛ [أرصدة المخزون](/inventory/raw-materials/balances) `inventoryBalance`؛ [دفتر الحركات](/inventory/raw-materials/ledger) `inventoryTransaction`؛ [تقارير المخزون](/inventory/reports) `inventoryReports` |
| الإنتاج والجودة | التصنيع والميزان | [المخطط اليوم](/inventory/manufacturing/planned) `factoryPlanned`؛ [الفعلي](/inventory/manufacturing/actual) `factoryActual`؛ [نسبة التنفيذ](/inventory/manufacturing/execution) `factoryExecution`؛ [توقفات المصنع](/inventory/manufacturing/stoppages) `factoryStoppages`؛ [أوامر التصنيع](/inventory/manufacturing/orders) `productionOrder`؛ [الميزان](/inventory/manufacturing/scale) `scaleReading`؛ [دفعات الإنتاج](/inventory/manufacturing/lots) `productionLot`؛ [تقارير الإنتاج](/inventory/manufacturing/reports) `productionReports` |
| الإنتاج والجودة | الخلطات والأوزان | [الوصفات](/inventory/manufacturing) `recipe`؛ [مكونات الوصفة](/inventory/manufacturing/recipe-items) `recipeItem` |
| الإنتاج والجودة | خلطات العملاء | [خلطات العملاء](/inventory/manufacturing/customer-recipes) `customerRecipe` |
| الإنتاج والجودة | الجودة والتحليل الغذائي | [عينات الجودة](/inventory/manufacturing/quality) `qualitySample`؛ [جودة الموردين](/inventory/manufacturing/supplier-quality) `supplierQuality` |
| الإنتاج والجودة | تتبع الدفعات والهدر | [الهدر](/inventory/manufacturing/waste) `factoryWaste`؛ [الانحراف](/inventory/manufacturing/deviation) `factoryDeviation`؛ [تحليل الانحراف](/inventory/manufacturing/variance) `varianceReport`؛ [تتبع الدفعات](/inventory/manufacturing/lot-trace) `lotTrace`؛ [تتبع الخامة](/tasks/material) `materialTrace` |
| الأسطول والصيانة | السيارات والنقل | [المركبات](/fleet/vehicles) `fleet`؛ [الوقود](/fleet/fuel) `fleetFuel`؛ [الرحلات](/fleet/trips) `fleetTrips` |
| الأسطول والصيانة | الصيانة | [مركز الصيانة](/inventory/manufacturing/maintenance) `maintenance`؛ [الماكينات](/inventory/manufacturing/maintenance/machines) `machine`؛ [جداول الصيانة](/inventory/manufacturing/maintenance/schedules) `maintenanceSchedule`؛ [سجلات الأعطال](/inventory/manufacturing/maintenance/records) `maintenanceRecord` |
| المالية | الأقساط والالتزامات المالية | [الالتزامات](/accounting/obligations) `obligation` |
| المالية | البنك والحسابات | [دليل الحسابات](/accounting) `account`؛ [القيود اليومية](/accounting/journals) `journalEntry`؛ [معاملات البنك](/accounting/financial-ops/bank-transactions) `bankTransaction`؛ [تقارير المحاسبة](/accounting/reports) `accountingReports` |
| المالية | المصروفات والضرائب | [المصروفات](/accounting/expenses) `expense`؛ [الضرائب](/accounting/tax) `taxSettings`؛ [إقرار الضريبة](/accounting/vat) `vatReport`؛ [العمليات المالية](/accounting/financial-ops) `financialOps` |
| المالية | الكهرباء والماء والغاز | [المرافق](/accounting/financial-ops/utilities) `utilitiesReading` |
| الموظفون والوثائق | الموظفون | [ملفات الموظفين](/hr) `employee`؛ [الحضور والإجازات](/hr/attendance) `attendance`؛ [الإضافي](/hr/overtime) `overtime`؛ [الرواتب](/hr/payroll) `payroll` |
| الموظفون والوثائق | التصاريح والعقود والوثائق | [الوثائق](/accounting/documents) `documents` |
| الإدارة | المستخدمون والصلاحيات | [المستخدمون](/settings/users) `users` |
| الإدارة | الاعتمادات | [الاعتمادات](/tasks/approvals) `approvals` |
| الإدارة | الإشعارات | [الإشعارات](/notifications) `notification` |
| الإدارة | سجل العمليات | [سجل العمليات](/settings/audit) `auditLog` |
| الإدارة | الإعدادات والتقارير | [التقارير](/tasks/reports) `report`؛ [الإعدادات](/settings) `companySettings` |

**بطاقات لوحة المالك (17):** [المخطط اليوم](/inventory/manufacturing/planned) `factoryPlanned`؛ [الفعلي](/inventory/manufacturing/actual) `factoryActual`؛ [نسبة التنفيذ](/inventory/manufacturing/execution) `factoryExecution`؛ [مبيعات اليوم](/sales/today) `factorySalesToday`؛ [مبيعات الشهر](/sales/month) `factorySalesMonth`؛ [طلبات مفتوحة](/sales/open-orders) `factoryOpenOrders`؛ [تكلفة الطن](/accounting/cost) `factoryCostPerTon`؛ [متوسط السعر](/accounting/price) `factoryAvgPrice`؛ [هامش الربح](/accounting/margin) `factoryMargin`؛ [قيمة المخزون](/inventory/raw-materials/value) `factoryStockValue`؛ [مواد قاربت النفاد](/inventory/raw-materials/running-out) `factoryRunningOut`؛ [مواد راكدة](/inventory/raw-materials/stagnant) `factoryStagnant`؛ [مواد محجوزة](/inventory/raw-materials/reserved) `factoryReserved`؛ [الهدر](/inventory/manufacturing/waste) `factoryWaste`؛ [الانحراف](/inventory/manufacturing/deviation) `factoryDeviation`؛ [تحليل الانحراف](/inventory/manufacturing/variance) `varianceReport`؛ [توقفات المصنع](/inventory/manufacturing/stoppages) `factoryStoppages`.

**مسارات خاصة:** «قطع الغيار» يفتح `/inventory/extensions?kind=spare`؛ و«مواد التعبئة والتشغيل» يفتح `/inventory/extensions?kind=packaging` على شاشة المخزون الإضافي نفسها مع تبويب مختلف. المسار القديم `/inventory/extensions` يعيد التوجيه إلى عرض قطع الغيار. دليل التنقل: `/guide`.

**حدود الشاشات الحالية:** لا توجد شاشة مستقلة لمرتجعات المبيعات؛ أقرب شاشة هي السحوبات والفواتير. مقارنة الوقود المتوقع والفعلي موجودة في سجل الرحلات، وتُوزع تكلفة الرحلة على الدفعات والفواتير، لكن لا يوجد تقرير تجميعي مستقل لتكلفة النقل لكل طن/طلبية/عميل. إثبات التسليم يحفظ بيانات المستلم ووقت التسليم دون صورة. لا توجد شاشة تاريخ أسعار مخصصة لخلطات العملاء أو بوابة عميل لضبط إظهار خلطة لعميل آخر.

## المسار اليومي للمصنع

1. **أمر شراء** من شاشة المشتريات. يصل تلقائياً للمدير للاعتماد.
2. **اعتماد** من شاشة الاعتمادات أو من أمر الشراء نفسه (المدير فقط).
3. **استلام البضاعة** إلى مستودع المواد الخام، مع رقم دفعة وتاريخ صلاحية. لا يُقبل استلام أكبر من الأمر، ولا استلام قبل الاعتماد.
4. **تحويل** الكمية المطلوبة إلى مستودع التصنيع. المواد لا تُستهلك من مستودع المواد الخام مباشرة.
5. **أمر إنتاج** يختار المنتج والوصفة والكمية. النظام يحسب الكمية المتوقعة لكل مادة.
6. **إكمال الإنتاج**: اختر مشغّل الخط، وأدخل الكمية الفعلية والهدر والناتج. المتوقع يُحسب من الوصفة على ما دخل فعلاً. مثال: دخل 10000 كجم وكان المتوقع 9900 وخرج 9650، فالفارق −250 كجم (−2.53%). إذا تجاوزت النسبة حد الشركة (افتراضياً 2%) يجب كتابة السبب. يمكن إدخال تكلفة الكهرباء والغاز والأجور والنقل والصيانة والمصاريف العامة، وإلا تُحمَّل من إعدادات الشركة. الأكياس تُحسب من وزن كيس المنتج. بند أعلى من حد اعتماد التكلفة (الافتراضي 0، أي كل مبلغ موجب) يظهر «بانتظار الاعتماد» ولا يدخل الهامش حتى يعتمده المدير أو المحاسب من الدفعة أو من شاشة الاعتمادات. الناتج يدخل مستودع المنتجات النهائية برقم دفعة `LOT-التاريخ-التسلسل` وعلامته «لم يُفحص» إلى أن تُسجَّل عينة.
7. **فاتورة مبيعات** كمسودة ثم **تأكيد**. التأكيد يخصم أقدم دفعة منتج أولاً، ويسجّل العميل على تلك الدفعة بسعر الفاتورة لا بسعر القائمة.
8. **تحصيل** من المحاسب. يحوّل المبلغ من ذمم العملاء إلى البنك.
9. **دفعات الإنتاج** ثم **تتبع** لرؤية الخام ودفعة المورد والمشغّل والعملاء والتكلفة. صفِّ حسب المنتج والتاريخ والجودة وإشارة الهامش، وصدّر Excel أو CSV، واطبع شهادة التتبع. الهامش السالب بالأحمر في القائمة وفي لوحة المصنع وفي شاشة هامش الربح. **تتبع الخامة** يختار الدفعة ويعرض الدفعات المتأثرة. **عينات الجودة** تسجّل الفحص، و**جودة المورد** تعرض العدد ونسبة القبول ومتوسط الرطوبة والبروتين.

دفعة خام مرفوضة أو معلّقة لا تُحوَّل للتصنيع ولا تُستهلك. دفعة منتج مرفوضة أو معلّقة لا تُباع ولا تُسحب. دفعة «لم يُفحص» تُباع ما لم يُشترط الفحص قبل الاستخدام من الإعدادات. فك الرفض أو الحجز للمدير مع سبب. دفعة قديمة بلا مشغّل تظهر «غير معروف (بيانات قديمة)».

يمكن ربط الميزان عبر محوّل HTTP/JSON يرسل قراءة الوزن الفعلي لأمر الإنتاج والمادة. يحسب النظام المتوقع من الوصفة، ويعرض الفارق، ثم يستخدم آخر قراءة لكل مادة عند إكمال الإنتاج. تهيئة الرمز ومثال الطلب موثقان في [دليل الاستضافة](./hosting-oman.md).

لوحة **وضع المصنع اليوم** تعرض ما ينتظر إجراء جودة، ونسبة القبول، وتكلفة الطن وبنودها، وأقل الدفعات هامشاً (السالب بالأحمر هنا وفي قائمة الدفعات)، وتحصيل اليوم والشهر، وأعمار الذمم 0–30 و31–60 و61 يوماً فأكثر. كل بطاقة تفتح شاشتها إذا كانت صلاحيتك تسمح.

من الإعدادات: حد اعتماد التكلفة اليدوية، وأسعار التحميل للطن، وتكلفة الكيس. القيم السالبة والمبالغ الخارجة عن الحد تُرفض برسالة عربية.

## الفاتورة الضريبية (عُمان)

- العملة الريال العُماني بثلاثة أرقام عشرية.
- الفاتورة المطبوعة تحمل اسم المصنع وعنوانه والسجل التجاري والرقم الضريبي، وبيانات العميل، ورقم الفاتورة وتاريخها، والكمية وسعر الوحدة والمبلغ الخاضع ونسبة الضريبة وقيمتها والإجمالي.
- النسبة الافتراضية 5%. كل مادة أو منتج يمكن أن يكون خاضعاً أو صفرياً أو معفى.
- راجع المستشار الضريبي قبل اعتماد معاملة الأعلاف نهائياً؛ النظام يطبّق ما تختارونه في بطاقة الصنف.

من الفاتورة أو أمر الشراء اضغط **طباعة**. يمكن طباعة أمر التسليم من شاشة تسليم الفواتير بعد تسجيل مراحل الاعتماد وإثبات الاستلام. من المنتجات اضغط **ملصقات الباركود**.

## الباركود

في **محطة الباركود** ضع المؤشر في مربع البحث وامسح بالقارئ (قارئ USB الذي يكتب كأنه لوحة مفاتيح ثم Enter). لطباعة الملصق افتح صفحة الملصقات واطبع على طابعة الباركود أو أي طابعة ورق.

## المخزون المنخفض والاعتمادات

إذا نزل رصيد مادة إلى الحد الأدنى يُنشأ تنبيه داخل النظام. إذا ضُبط بريد SMTP يُرسل التنبيه للمدير وللعمليات. طلبات الشراء والمصروف والراتب وتعديل المخزون تُشعر المدير كذلك.

تعديل المخزون لا يغيّر الرصيد إلا بعد اعتماد المدير مع سبب مكتوب.

## الحسابات

كل استلام وبيع ومصروف وراتب يولّد قيداً متوازناً. من الشاشات المتاحة لصلاحيتك صدّر Excel أو CSV للقيود والفواتير وميزان المراجعة وإقرار الضريبة والرواتب والمخزون والدفعات والوثائق. تصدير التكلفة محجوب عن الأدوار التي لا تملك صلاحية قراءة التكلفة أو المحاسبة.

## الموارد البشرية

سجّل الحضور يدوياً أو الصق ملف CSV بالصيغة:

`كود الموظف,التاريخ,الحضور,الانصراف`

مثال: `EMP-001,2026-09-21,07:05,15:10`

جهاز البصمة لا يُربط في هذه المرحلة، لكن ملف الحضور نفسه هو نقطة الربط لاحقاً. الإضافي هو ما زاد عن 8 ساعات، ويُحسب في المسير بـ 1.25 من أجر الساعة. المسير: المحاسب يجهّز، المدير يعتمد، المحاسب يصرف من البنك.

## الصلاحيات

المدير يفتح **المستخدمون والصلاحيات** ويعلّم ما يُسمح به لكل دور، ويغيّر كلمات المرور. لا يمكن سحب إدارة المستخدمين من المدير العام.

## النسخة الاحتياطية

من **إعدادات الشركة** يمكن تنزيل نسخة JSON، وتوجد نسخة يومية على الخادم لمدة 30 يوماً. راجع وثيقة الاستضافة لطريقة النسخ السحابي.
