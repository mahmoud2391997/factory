import type { LucideIcon } from 'lucide-react'
import { CarFront, Factory, Landmark, LayoutDashboard, Settings, ShoppingCart, Users, Warehouse } from 'lucide-react'

export type NavRelatedLink = { entityKey: string; label: string }
export type NavPage = { id: string; entityKey: string; href: string; label: string; description: string; keywords: string[]; permission: string[]; tab: boolean; canonical?: boolean; queryView?: { param: string; value: string }; relatedLinks?: NavRelatedLink[] }
export type NavSection = { id: string; label: string; keywords: string[]; pages: NavPage[] }
export type NavWorkspace = { id: string; label: string; icon: LucideIcon; keywords: string[]; sections: NavSection[] }
export type NavRedirect = { from: string; to: string }

/** The sole navigation catalog: workspace → section → canonical page. */
export const NAV_CONFIG: { workspaces: NavWorkspace[]; utilityPages: NavPage[]; redirects: NavRedirect[]; homeWidgetEntityKeys: string[] } = {
  workspaces: [
    { id: "home", label: "الرئيسية", icon: LayoutDashboard, keywords: ["الرئيسية", "لوحة التحكم"], sections: [
      { id: "owner", label: "لوحة المالك", keywords: ["الرئيسية", "مؤشرات", "dashboard"], pages: [
        {"id":"dashboard","entityKey":"dashboard","href":"/","label":"لوحة المالك","description":"ملخص الإنتاج والمبيعات والربحية والمخزون","keywords":["وضع المصنع اليوم","الرئيسية","لوحة المالك"],"permission":["users.manage"],"tab":false},
      ] },
    ] },
    { id: "sales", label: "المبيعات والتوزيع", icon: ShoppingCart, keywords: ["عملاء", "مبيعات", "توزيع"], sections: [
      { id: "customers", label: "العملاء والفواتير", keywords: ["العملاء", "الفواتير", "الطلبات"], pages: [
        {"id":"factorySalesToday","entityKey":"factorySalesToday","href":"/sales/today","label":"مبيعات اليوم","description":"صافي فواتير اليوم قبل الضريبة","keywords":["المبيعات والتوزيع","العملاء والفواتير"],"permission":["users.manage"],"tab":true},
        {"id":"factorySalesMonth","entityKey":"factorySalesMonth","href":"/sales/month","label":"مبيعات الشهر","description":"صافي مبيعات شهر التشغيل حتى اليوم","keywords":["المبيعات والتوزيع","العملاء والفواتير"],"permission":["users.manage"],"tab":true},
        {"id":"factoryOpenOrders","entityKey":"factoryOpenOrders","href":"/sales/open-orders","label":"طلبات مفتوحة","description":"فواتير لم تُحصَّل بالكامل","keywords":["الطلبات المفتوحة","المبيعات والتوزيع","العملاء والفواتير"],"permission":["users.manage"],"tab":true},
        {"id":"customer","entityKey":"customer","href":"/sales/parties","label":"العملاء","description":"العملاء والفواتير","keywords":["المبيعات والتوزيع","العملاء والفواتير"],"permission":["sales.read"],"tab":true},
        {"id":"salesInvoice","entityKey":"salesInvoice","href":"/sales","label":"الفواتير","description":"فواتير مع الضريبة والحالة","keywords":["الطلبات والفواتير","المبيعات والتوزيع","العملاء والفواتير"],"permission":["sales.read"],"tab":true},
        {"id":"salesReports","entityKey":"salesReports","href":"/sales/reports","label":"تقارير المبيعات","description":"تحليلات المبيعات","keywords":["المبيعات والتوزيع","العملاء والفواتير"],"permission":["sales.read"],"tab":true},
      ] },
      { id: "collections", label: "التحصيل والمرتجعات", keywords: ["التحصيل", "السداد", "مرتجعات"], pages: [
        {"id":"withdrawal","entityKey":"withdrawal","href":"/sales/withdrawals","label":"السحوبات والمرتجعات","description":"أقرب شاشة موجودة: السحوبات والفواتير؛ لا توجد شاشة مرتجعات مستقلة بعد.","keywords":["المبيعات والتوزيع","التحصيل والمرتجعات"],"permission":["sales.read"],"tab":true},
        {"id":"salesPayment","entityKey":"salesPayment","href":"/sales/collections","label":"التحصيل","description":"ما دخل الصندوق أو البنك مقابل الفواتير","keywords":["المبيعات والتوزيع","التحصيل والمرتجعات"],"permission":["sales.payments.manage","sales.read"],"tab":true},
      ] },
      { id: "distribution", label: "نقاط التوزيع", keywords: ["التوزيع", "الباركود"], pages: [
        {"id":"distribution","entityKey":"distribution","href":"/sales/distribution","label":"التوزيع","description":"نقاط التوزيع والتسليم","keywords":["المبيعات والتوزيع","نقاط التوزيع"],"permission":["distribution.read"],"tab":true,"relatedLinks":[{"entityKey":"barcode","label":"مسح باركود المخزون"}]},
        {"id":"distributionPoint","entityKey":"distributionPoint","href":"/sales/distribution/points","label":"نقاط التوزيع","description":"إدارة مواقع التوزيع ومسؤوليها","keywords":["نقاط التوزيع وأرصدة كل نقطة","المبيعات والتوزيع","نقاط التوزيع","رصيد"],"permission":["distribution.read"],"tab":true},
        {"id":"distributionClosing","entityKey":"distributionClosing","href":"/sales/distribution/closing","label":"الإقفال اليومي","description":"إقفال يومي ومطابقة المبيعات والمخزون والتحصيل","keywords":["المبيعات والتوزيع","نقاط التوزيع"],"permission":["distribution.read"],"tab":true},
      ] },
      { id: "delivery", label: "دورة الفاتورة والتسليم", keywords: ["التسليم", "إثبات التسليم"], pages: [
        {"id":"invoiceDelivery","entityKey":"invoiceDelivery","href":"/sales/delivery","label":"التسليم","description":"مراحل اعتماد الفاتورة حتى التسليم للعميل","keywords":["المحاسب ← التحميل ← السائق ← العميل وإثبات التسليم","المبيعات والتوزيع","دورة الفاتورة والتسليم","تسليم","إثبات تسليم"],"permission":["delivery.track","sales.read"],"tab":true},
      ] },
      { id: "profitability", label: "الربحية", keywords: ["هامش", "تكلفة الطن"], pages: [
        {"id":"factoryCostPerTon","entityKey":"factoryCostPerTon","href":"/accounting/cost","label":"تكلفة الطن","description":"تكلفة الطن المنتج في يوم التشغيل","keywords":["المبيعات والتوزيع","الربحية"],"permission":[],"tab":true},
        {"id":"factoryAvgPrice","entityKey":"factoryAvgPrice","href":"/accounting/price","label":"متوسط السعر","description":"متوسط سعر بيع الطن في فواتير اليوم","keywords":["متوسط سعر البيع","المبيعات والتوزيع","الربحية"],"permission":[],"tab":true},
        {"id":"factoryMargin","entityKey":"factoryMargin","href":"/accounting/margin","label":"هامش الربح","description":"متوسط سعر البيع ناقص تكلفة الطن","keywords":["هامش الربح/طن","المبيعات والتوزيع","الربحية"],"permission":[],"tab":true},
        {"id":"profitability","entityKey":"profitability","href":"/sales/profitability","label":"الربحية","description":"تكلفة الطن ومتوسط سعر البيع والهامش حسب المنتج أو العميل أو الشهر","keywords":["الربحية حسب المنتج والعميل","المبيعات والتوزيع","الربحية"],"permission":["sales.read"],"tab":true},
      ] },
    ] },
    { id: "purchasing", label: "المشتريات والموردون", icon: ShoppingCart, keywords: ["مشتريات", "موردون", "عروض"], sections: [
      { id: "purchasing", label: "المشتريات والموافقات", keywords: ["طلبات الشراء", "الاعتماد", "الموردون"], pages: [
        {"id":"supplier","entityKey":"supplier","href":"/sales/parties/suppliers","label":"الموردون","description":"ملفات الموردين؛ تحليل الأسعار في شاشة تحليل أسعار المواد الخام.","keywords":["ملف الموردين وآخر أسعار الشراء","المشتريات والموردون","المشتريات والموافقات"],"permission":["purchasing.read"],"tab":true,"relatedLinks":[{"entityKey":"supplierCommunication","label":"مراسلات الموردين"}]},
        {"id":"purchaseRequest","entityKey":"purchaseRequest","href":"/sales/parties/requests","label":"طلبات الشراء","description":"طلب → عروض الموردين → اختيار المورد → اعتماد → أمر شراء","keywords":["طلبات الشراء وعروض الأسعار والمقارنة والاعتماد","المشتريات والموردون","المشتريات والموافقات","طلب شراء","موافقة"],"permission":["purchasing.read"],"tab":true},
        {"id":"purchaseOrder","entityKey":"purchaseOrder","href":"/sales/parties/orders","label":"أوامر الشراء","description":"أوامر الشراء وحالتها","keywords":["المشتريات والموردون","المشتريات والموافقات"],"permission":["purchasing.read"],"tab":true},
        {"id":"goodsReceipt","entityKey":"goodsReceipt","href":"/sales/parties/receipts","label":"استلام البضاعة","description":"استلام إلى مستودع المواد الخام","keywords":["استلام البضاعة والفواتير","المشتريات والموردون","المشتريات والموافقات"],"permission":["purchasing.read"],"tab":true},
      ] },
      { id: "communications", label: "التواصل مع الموردين", keywords: ["رسائل", "عروض", "مراسلات"], pages: [
        {"id":"supplierRelations","entityKey":"supplierRelations","href":"/sales/parties/relations","label":"علاقات الموردين","description":"التواصل والقوالب","keywords":["العروض داخل ملف المورد وعلاقات الموردين","المشتريات والموردون","التواصل مع الموردين"],"permission":["suppliers.communicate"],"tab":true},
        {"id":"supplierTemplate","entityKey":"supplierTemplate","href":"/sales/parties/templates","label":"قوالب الرسائل","description":"قوالب طلبات الأسعار والاستفسارات","keywords":["المشتريات والموردون","التواصل مع الموردين"],"permission":["suppliers.communicate"],"tab":true},
        {"id":"supplierCommunication","entityKey":"supplierCommunication","href":"/sales/parties/communications","label":"مراسلات الموردين","description":"الرسائل المجهزة والمعتمدة والمرسلة","keywords":["تجهيز الرسالة واعتماد المسؤول وسجل المراسلات","المشتريات والموردون","التواصل مع الموردين","رسائل مورد","اعتماد رسالة"],"permission":["suppliers.communicate"],"tab":true},
      ] },
      { id: "raw-prices", label: "تحليل أسعار المواد الخام", keywords: ["أسعار المواد", "المواد الخام", "التكلفة الواصلة"], pages: [
        {"id":"materialPriceAnalysis","entityKey":"materialPriceAnalysis","href":"/inventory/raw-materials/price-analysis","label":"أسعار الخام","description":"متوسط وأعلى وأقل سعر شهرياً، المورد، الكمية المشتراة والمستهلكة، تكلفة النقل، والتكلفة الواصلة للمصنع","keywords":["متوسط وأعلى وأقل سعر والمورد والكمية والتكلفة الواصلة","المشتريات والموردون","تحليل أسعار المواد الخام"],"permission":["inventory.read"],"tab":true},
      ] },
    ] },
    { id: "inventory", label: "المخازن", icon: Warehouse, keywords: ["مخزون", "مستودع", "قطع غيار"], sections: [
      { id: "materials", label: "المواد الخام والمنتجات", keywords: ["مواد", "منتجات", "أصناف"], pages: [
        {"id":"material","entityKey":"material","href":"/inventory/raw-materials","label":"المواد الخام","description":"أصناف المواد الخام والحد الأدنى والوحدة","keywords":["المخازن","المواد الخام والمنتجات","خامات","مواد خام"],"permission":["inventory.read"],"tab":true},
        {"id":"product","entityKey":"product","href":"/inventory/products","label":"المنتجات","description":"أقرب شاشة موجودة: بطاقة المنتج والوصفة الحالية.","keywords":["الأوزان وتكلفة المنتج بالخلطة الحالية","المنتجات النهائية","المخازن","المواد الخام والمنتجات"],"permission":["inventory.read","production.read"],"tab":true},
      ] },
      { id: "spares", label: "مخزن قطع الغيار", keywords: ["قطع غيار", "صيانة", "قطع"], pages: [
        {"id":"inventoryExtensions","entityKey":"inventoryExtensions","href":"/inventory/extensions?kind=spare","label":"قطع الغيار","description":"المخزون الإضافي الحالي؛ صرف التعبئة والجرد مرتبطان بأوامر الإنتاج.","keywords":["القطع والأكواد والصرف والحد الأدنى والماكينة","الأكياس والخيوط والحبر والأوراق والملصقات","المخازن","مخزن قطع الغيار","قطع غيار","قطع","spare","spare parts"],"permission":["packaging.read","spareparts.read"],"tab":true,"queryView":{"param":"kind","value":"spare"}},
      ] },
      { id: "packaging", label: "مخزن مواد التعبئة والتشغيل", keywords: ["تعبئة", "أكياس", "خيوط"], pages: [
        {"id":"inventoryExtensions-packaging","entityKey":"inventoryExtensions","href":"/inventory/extensions?kind=packaging","label":"مواد التعبئة","description":"المخزون الإضافي الحالي؛ صرف التعبئة والجرد مرتبطان بأوامر الإنتاج.","keywords":["القطع والأكواد والصرف والحد الأدنى والماكينة","الأكياس والخيوط والحبر والأوراق والملصقات","المخازن","مخزن مواد التعبئة والتشغيل","قطع غيار","قطع","spare","spare parts"],"permission":["packaging.read","spareparts.read"],"tab":true,"canonical":false,"queryView":{"param":"kind","value":"packaging"}},
      ] },
      { id: "movement", label: "الحركات والجرد والتقارير", keywords: ["حركات", "مخزون", "جرد", "تقارير"], pages: [
        {"id":"factoryStockValue","entityKey":"factoryStockValue","href":"/inventory/raw-materials/value","label":"قيمة المخزون","description":"قيمة الأرصدة الحالية بالتكلفة","keywords":["المخازن","الحركات والجرد والتقارير"],"permission":[],"tab":true},
        {"id":"factoryRunningOut","entityKey":"factoryRunningOut","href":"/inventory/raw-materials/running-out","label":"مواد قاربت النفاد","description":"مواد رصيدها عند الحد الأدنى أو دونه","keywords":["المواد التي ستنفد","المخازن","الحركات والجرد والتقارير"],"permission":[],"tab":true},
        {"id":"factoryStagnant","entityKey":"factoryStagnant","href":"/inventory/raw-materials/stagnant","label":"مواد راكدة","description":"مواد بلا حركة صادرة منذ 7 أيام","keywords":["المواد الراكدة","المخازن","الحركات والجرد والتقارير"],"permission":[],"tab":true},
        {"id":"factoryReserved","entityKey":"factoryReserved","href":"/inventory/raw-materials/reserved","label":"مواد محجوزة","description":"مواد مخصصة للإنتاج أو في مستودع التصنيع","keywords":["المواد المحجوزة","المخازن","الحركات والجرد والتقارير"],"permission":[],"tab":true},
        {"id":"warehouse","entityKey":"warehouse","href":"/inventory/warehouses","label":"المستودعات","description":"أرصدة المستودعات والتحويلات","keywords":["المخازن","المواد الخام والمنتجات"],"permission":["inventory.read","warehouses.read"],"tab":true},
        {"id":"stockTransfer","entityKey":"stockTransfer","href":"/inventory/warehouses/transfers","label":"تحويل المخزون","description":"تحويل بين المستودعات الثلاثة","keywords":["تحويلات المخزون","المخازن","المواد الخام والمنتجات"],"permission":["inventory.read","inventory.transfer.create"],"tab":true},
        {"id":"stockAdjustment","entityKey":"stockAdjustment","href":"/inventory/warehouses/adjustments","label":"تسوية المخزون","description":"تعديل مع سبب إلزامي واعتماد المدير","keywords":["تعديل المخزون","المخازن","المواد الخام والمنتجات"],"permission":["inventory.adjust"],"tab":true},
        {"id":"barcode","entityKey":"barcode","href":"/inventory/warehouses/barcode","label":"الباركود","description":"مسح الأصناف وطباعة الملصقات","keywords":["مسح الباركود","محطة الباركود","المخازن","الحركات والجرد والتقارير"],"permission":["barcode.scan","inventory.read"],"tab":true},
        {"id":"materialBatch","entityKey":"materialBatch","href":"/inventory/raw-materials/batches","label":"دفعات المواد","description":"رقم الدفعة، الصلاحية، والمورد","keywords":["المخازن","المواد الخام والمنتجات"],"permission":["inventory.read"],"tab":true},
        {"id":"inventoryBalance","entityKey":"inventoryBalance","href":"/inventory/raw-materials/balances","label":"أرصدة المخزون","description":"الرصيد الحالي ومتوسط التكلفة","keywords":["المخازن","المواد الخام والمنتجات"],"permission":["inventory.read"],"tab":true},
        {"id":"inventoryTransaction","entityKey":"inventoryTransaction","href":"/inventory/raw-materials/ledger","label":"دفتر الحركات","description":"كل حركة مخزون قابلة للتدقيق","keywords":["المخازن","المواد الخام والمنتجات"],"permission":["inventory.ledger.read","inventory.read"],"tab":true},
        {"id":"inventoryReports","entityKey":"inventoryReports","href":"/inventory/reports","label":"تقارير المخزون","description":"التحليلات والتقارير المخزنية","keywords":["المخازن","المواد الخام والمنتجات"],"permission":["inventory.read"],"tab":true},
      ] },
    ] },
    { id: "production", label: "الإنتاج والجودة", icon: Factory, keywords: ["إنتاج", "جودة", "ميزان"], sections: [
      { id: "manufacturing", label: "التصنيع والميزان", keywords: ["تصنيع", "ميزان", "إنتاج"], pages: [
        {"id":"factoryPlanned","entityKey":"factoryPlanned","href":"/inventory/manufacturing/planned","label":"المخطط اليوم","description":"الكمية المخططة لإنتاج اليوم","keywords":["الإنتاج والجودة","التصنيع والميزان"],"permission":["users.manage"],"tab":true},
        {"id":"factoryActual","entityKey":"factoryActual","href":"/inventory/manufacturing/actual","label":"الفعلي","description":"الكمية التي خرجت فعلياً من خط الإنتاج","keywords":["الإنتاج والجودة","التصنيع والميزان"],"permission":["users.manage"],"tab":true},
        {"id":"factoryExecution","entityKey":"factoryExecution","href":"/inventory/manufacturing/execution","label":"نسبة التنفيذ","description":"الفعلي مقارنة بالمخطط","keywords":["الإنتاج والجودة","التصنيع والميزان"],"permission":["users.manage"],"tab":true},
        {"id":"factoryStoppages","entityKey":"factoryStoppages","href":"/inventory/manufacturing/stoppages","label":"توقفات المصنع","description":"توقفات الخط في يوم التشغيل","keywords":["الإنتاج والجودة","التصنيع والميزان"],"permission":["users.manage"],"tab":true},
        {"id":"productionOrder","entityKey":"productionOrder","href":"/inventory/manufacturing/orders","label":"أوامر التصنيع","description":"أوامر الإنتاج والدفعات","keywords":["الإنتاج والجودة","التصنيع والميزان"],"permission":["production.read"],"tab":true},
        {"id":"scaleReading","entityKey":"scaleReading","href":"/inventory/manufacturing/scale","label":"الميزان","description":"قراءات الميزان وربطها بالإنتاج","keywords":["الميزان وقراءات الخام","الإنتاج والجودة","التصنيع والميزان","ميزان","وزن","scale"],"permission":["scale.read"],"tab":true},
        {"id":"productionLot","entityKey":"productionLot","href":"/inventory/manufacturing/lots","label":"دفعات الإنتاج","description":"دفعة الإنتاج وربط الخام والمورد والعامل والعميل","keywords":["المنتج النهائي ودفعات الإنتاج","الإنتاج والجودة","التصنيع والميزان"],"permission":["production.read"],"tab":true},
        {"id":"productionReports","entityKey":"productionReports","href":"/inventory/manufacturing/reports","label":"تقارير الإنتاج","description":"تحليلات الإنتاج والمصنع","keywords":["تكلفة الطن الفعلية وتقارير الإنتاج","الإنتاج والجودة","التصنيع والميزان"],"permission":["production.read"],"tab":true},
      ] },
      { id: "recipes", label: "الخلطات والأوزان", keywords: ["وصفات", "خلطات", "أوزان"], pages: [
        {"id":"recipe","entityKey":"recipe","href":"/inventory/manufacturing","label":"الوصفات","description":"وصفات الإنتاج والعميل","keywords":["الوصفات والأوزان","الإنتاج والجودة","الخلطات والأوزان"],"permission":["production.read"],"tab":true,"relatedLinks":[{"entityKey":"product","label":"المنتجات"}]},
        {"id":"recipeItem","entityKey":"recipeItem","href":"/inventory/manufacturing/recipe-items","label":"مكونات الوصفة","description":"مكونات كل وصفة وكمياتها بالنسبة لأساس الإنتاج","keywords":["الإنتاج والجودة","الخلطات والأوزان"],"permission":["production.read"],"tab":true},
      ] },
      { id: "customer-recipes", label: "خلطات العملاء", keywords: ["خلطات العملاء", "وصفات خاصة"], pages: [
        {"id":"customerRecipe","entityKey":"customerRecipe","href":"/inventory/manufacturing/customer-recipes","label":"خلطات العملاء","description":"وصفات وأسعار مخصصة لكل عميل","keywords":["وصفات العملاء والأسعار الخاصة","الإنتاج والجودة","خلطات العملاء","خلطات خاصة","سعر عميل"],"permission":["production.read","recipes.custom"],"tab":true},
      ] },
      { id: "quality", label: "الجودة والتحليل الغذائي", keywords: ["جودة", "مختبر", "تحليل"], pages: [
        {"id":"qualitySample","entityKey":"qualitySample","href":"/inventory/manufacturing/quality","label":"عينات الجودة","description":"عينات الجودة وجودة المورد","keywords":["عينات الخام والمنتج والتحليل المخبري","الإنتاج والجودة","الجودة والتحليل الغذائي","مختبر","عينة"],"permission":["qc.read"],"tab":true},
        {"id":"supplierQuality","entityKey":"supplierQuality","href":"/inventory/manufacturing/supplier-quality","label":"جودة الموردين","description":"عدد العينات ونسبة القبول ومتوسط الرطوبة والبروتين","keywords":["مقارنة الجودة والمواصفة وجودة الموردين","الإنتاج والجودة","الجودة والتحليل الغذائي"],"permission":["qc.read"],"tab":true},
      ] },
      { id: "trace", label: "تتبع الدفعات والهدر", keywords: ["دفعات", "هدر", "انحراف", "تتبع"], pages: [
        {"id":"factoryWaste","entityKey":"factoryWaste","href":"/inventory/manufacturing/waste","label":"الهدر","description":"كمية الهدر في إنتاج اليوم","keywords":["تحليل الهدر","الإنتاج والجودة","تتبع الدفعات والهدر","هدر","فاقد"],"permission":[],"tab":true},
        {"id":"factoryDeviation","entityKey":"factoryDeviation","href":"/inventory/manufacturing/deviation","label":"الانحراف","description":"الفرق بين المتوقع في الوصفة والمصروف فعلياً","keywords":["الانحراف عن الوصفة","تحليل الانحراف","الإنتاج والجودة","تتبع الدفعات والهدر"],"permission":[],"tab":true},
        {"id":"varianceReport","entityKey":"varianceReport","href":"/inventory/manufacturing/variance","label":"تحليل الانحراف","description":"الانحراف والهدر حسب المنتج والوردية والمشغّل والخط والشهر","keywords":["الدفعات والانحراف حسب المنتج والوردية","الإنتاج والجودة","تتبع الدفعات والهدر"],"permission":[],"tab":true},
        {"id":"lotTrace","entityKey":"lotTrace","href":"/inventory/manufacturing/lot-trace","label":"تتبع الدفعات","description":"تتبع الخامات والعملاء والجودة والتكلفة المرتبطة بكل دفعة","keywords":["تتبع الخامة والاستدعاء","الإنتاج والجودة","تتبع الدفعات والهدر"],"permission":["production.read"],"tab":true},
        {"id":"materialTrace","entityKey":"materialTrace","href":"/tasks/material","label":"تتبع الخامة","description":"دخول الخامة واستهلاكها والمتبقي والمنتج المباع والهدر وسبب الفرق","keywords":["تتبع الخامة من الاستلام إلى الاستهلاك","الإنتاج والجودة","تتبع الدفعات والهدر"],"permission":["inventory.read","reports.read"],"tab":true},
      ] },
    ] },
    { id: "fleet", label: "الأسطول والصيانة", icon: CarFront, keywords: ["مركبات", "وقود", "صيانة"], sections: [
      { id: "vehicles", label: "السيارات والنقل", keywords: ["سيارات", "أسطول", "وقود", "رحلات", "ديزل"], pages: [
        {"id":"fleet","entityKey":"fleet","href":"/fleet/vehicles","label":"المركبات","description":"ملف المركبة وسجل خدماتها؛ وثائق الملكية والتأمين والتنبيهات في مركز الوثائق.","keywords":["المركبات والصيانة الدورية والإطارات والزيوت","الأسطول والصيانة","السيارات والنقل"],"permission":["fleet.manage","fleet.service.manage"],"tab":true},
        {"id":"fleetFuel","entityKey":"fleetFuel","href":"/fleet/fuel","label":"الوقود","description":"سجل كل تعبئة؛ الرحلات تعرض مقارنة المتوقع بالفعلي وتنبيه الانحراف.","keywords":["الوقود والاستهلاك المتوقع مقابل الفعلي","الأسطول والصيانة","السيارات والنقل","ديزل","تعبئة","وقود","fuel"],"permission":["fleet.read"],"tab":true},
        {"id":"fleetTrips","entityKey":"fleetTrips","href":"/fleet/trips","label":"الرحلات","description":"السائق والوجهة والمسافة والحمولة والديزل؛ يمكن توزيع التكلفة على الدفعات والفواتير.","keywords":["الرحلات وتكلفة النقل","الأسطول والصيانة","السيارات والنقل"],"permission":["fleet.read"],"tab":true},
      ] },
      { id: "maintenance", label: "الصيانة", keywords: ["صيانة", "ماكينات", "أعطال"], pages: [
        {"id":"maintenance","entityKey":"maintenance","href":"/inventory/manufacturing/maintenance","label":"مركز الصيانة","description":"الآلات وجداول الصيانة","keywords":["الأسطول والصيانة","الصيانة"],"permission":["maintenance.read"],"tab":true},
        {"id":"machine","entityKey":"machine","href":"/inventory/manufacturing/maintenance/machines","label":"الماكينات","description":"سجل الآلات ومواقعها وتكاليفها التشغيلية","keywords":["ملف كل ماكينة","الأسطول والصيانة","الصيانة"],"permission":["maintenance.read"],"tab":true},
        {"id":"maintenanceSchedule","entityKey":"maintenanceSchedule","href":"/inventory/manufacturing/maintenance/schedules","label":"جداول الصيانة","description":"خطط الصيانة الوقائية ومواعيدها","keywords":["الأسطول والصيانة","الصيانة"],"permission":["maintenance.read"],"tab":true},
        {"id":"maintenanceRecord","entityKey":"maintenanceRecord","href":"/inventory/manufacturing/maintenance/records","label":"سجلات الأعطال","description":"الأعمال المنفذة والتكاليف والتوقفات","keywords":["الأعطال والتكلفة والتوقف وقطع الغيار المستخدمة","الأسطول والصيانة","الصيانة"],"permission":["maintenance.read"],"tab":true},
      ] },
    ] },
    { id: "finance", label: "المالية", icon: Landmark, keywords: ["حسابات", "مال", "التزامات"], sections: [
      { id: "obligations", label: "الأقساط والالتزامات المالية", keywords: ["أقساط", "التزامات", "دفعات"], pages: [
        {"id":"obligation","entityKey":"obligation","href":"/accounting/obligations","label":"الالتزامات","description":"الالتزامات والأقساط والاستحقاقات القادمة.","keywords":["جدول الالتزامات والدفعات والمتبقي والتنبيهات القادمة","المالية","الأقساط والالتزامات المالية","أقساط","استحقاقات"],"permission":["obligations.read"],"tab":true},
      ] },
      { id: "bank", label: "البنك والحسابات", keywords: ["بنك", "مطابقة", "قيود", "حسابات"], pages: [
        {"id":"account","entityKey":"account","href":"/accounting","label":"دليل الحسابات","description":"الحسابات والقيود والمصروفات","keywords":["المالية","البنك والحسابات"],"permission":["accounting.read","tax.read"],"tab":true},
        {"id":"journalEntry","entityKey":"journalEntry","href":"/accounting/journals","label":"القيود اليومية","description":"قيود مرتبطة بالعمليات","keywords":["المالية","البنك والحسابات"],"permission":["accounting.read"],"tab":true},
        {"id":"bankTransaction","entityKey":"bankTransaction","href":"/accounting/financial-ops/bank-transactions","label":"معاملات البنك","description":"تسجيل ومطابقة معاملات البنك وسجل التدقيق البنكي","keywords":["معاملات البنك والمطابقة","المالية","البنك والحسابات"],"permission":["bank.read"],"tab":true,"relatedLinks":[{"entityKey":"auditLog","label":"سجل العمليات"}]},
        {"id":"accountingReports","entityKey":"accountingReports","href":"/accounting/reports","label":"تقارير المحاسبة","description":"التكلفة والهامش والربحية","keywords":["المالية","البنك والحسابات"],"permission":["accounting.read","tax.read"],"tab":true},
      ] },
      { id: "expenses", label: "المصروفات والضرائب", keywords: ["مصروفات", "ضرائب", "ضريبة"], pages: [
        {"id":"expense","entityKey":"expense","href":"/accounting/expenses","label":"المصروفات","description":"مصروفات بانتظار الاعتماد ثم الترحيل","keywords":["المصروفات والاعتمادات","المالية","المصروفات والضرائب"],"permission":["accounting.read","expenses.manage"],"tab":true},
        {"id":"taxSettings","entityKey":"taxSettings","href":"/accounting/tax","label":"الضرائب","description":"ضريبة القيمة المضافة","keywords":["المالية","المصروفات والضرائب"],"permission":["tax.read"],"tab":true},
        {"id":"vatReport","entityKey":"vatReport","href":"/accounting/vat","label":"إقرار الضريبة","description":"ضريبة المخرجات والمدخلات وصافي المستحق","keywords":["المالية","المصروفات والضرائب"],"permission":["accounting.read","tax.read"],"tab":true},
        {"id":"financialOps","entityKey":"financialOps","href":"/accounting/financial-ops","label":"العمليات المالية","description":"المرافق والبنك والالتزامات","keywords":["المالية","المصروفات والضرائب"],"permission":["bank.read","utilities.read"],"tab":true},
      ] },
      { id: "utilities", label: "الكهرباء والماء والغاز", keywords: ["كهرباء", "ماء", "غاز", "مرافق"], pages: [
        {"id":"utilitiesReading","entityKey":"utilitiesReading","href":"/accounting/financial-ops/utilities","label":"المرافق","description":"تسجيل ومقارنة استهلاك الكهرباء والماء والغاز","keywords":["قراءات المرافق والاستهلاك لكل طن والمقارنة الشهرية","المالية","الكهرباء والماء والغاز"],"permission":["utilities.read"],"tab":true},
      ] },
    ] },
    { id: "people", label: "الموظفون والوثائق", icon: Users, keywords: ["موظفون", "وثائق", "عقود"], sections: [
      { id: "employees", label: "الموظفون", keywords: ["موظفون", "رواتب", "حضور", "إجازات"], pages: [
        {"id":"employee","entityKey":"employee","href":"/hr","label":"ملفات الموظفين","description":"بيانات الموظفين والأقسام","keywords":["ملفات الموظفين والعقود والإقامات","الموظفون والوثائق","الموظفون"],"permission":["employees.read"],"tab":true},
        {"id":"attendance","entityKey":"attendance","href":"/hr/attendance","label":"الحضور والإجازات","description":"سجل الحضور (يدوي / CSV / جهاز)","keywords":["الموظفون والوثائق","الموظفون"],"permission":["attendance.read"],"tab":true},
        {"id":"overtime","entityKey":"overtime","href":"/hr/overtime","label":"الإضافي","description":"ساعات إضافية محسوبة من الحضور","keywords":["الموظفون والوثائق","الموظفون"],"permission":["attendance.read","payroll.manage"],"tab":true},
        {"id":"payroll","entityKey":"payroll","href":"/hr/payroll","label":"الرواتب","description":"مسير الرواتب والاعتماد والصرف","keywords":["الموظفون والوثائق","الموظفون"],"permission":["employees.read","payroll.manage"],"tab":true},
      ] },
      { id: "documents", label: "التصاريح والعقود والوثائق", keywords: ["وثائق", "عقود", "تصاريح", "تراخيص"], pages: [
        {"id":"documents","entityKey":"documents","href":"/accounting/documents","label":"الوثائق","description":"سجل الوثائق وتواريخ الانتهاء والتجديد","keywords":["الوثائق والتراخيص والملكية والتأمين والعقود والإيجارات","الموظفون والوثائق","التصاريح والعقود والوثائق","انتهاء","تراخيص"],"permission":["documents.read"],"tab":true},
      ] },
    ] },
    { id: "admin", label: "الإدارة", icon: Settings, keywords: ["إدارة", "مستخدمون", "صلاحيات"], sections: [
      { id: "users", label: "المستخدمون والصلاحيات", keywords: ["مستخدمون", "صلاحيات"], pages: [
        {"id":"users","entityKey":"users","href":"/settings/users","label":"المستخدمون","description":"الأدوار وصلاحيات كل دور","keywords":["المستخدمون والصلاحيات","الإدارة"],"permission":["users.manage"],"tab":true},
      ] },
      { id: "approvals", label: "الاعتمادات", keywords: ["موافقات", "اعتمادات"], pages: [
        {"id":"approvals","entityKey":"approvals","href":"/tasks/approvals","label":"الاعتمادات","description":"الموافقات المعلقة","keywords":["الإدارة","المستخدمون والصلاحيات"],"permission":["approvals.decide"],"tab":true},
      ] },
      { id: "notifications", label: "الإشعارات", keywords: ["تنبيهات", "إشعارات"], pages: [
        {"id":"notification","entityKey":"notification","href":"/notifications","label":"الإشعارات","description":"تنبيهات النظام","keywords":["الإدارة","المستخدمون والصلاحيات"],"permission":["notifications.read"],"tab":false},
      ] },
      { id: "audit", label: "سجل العمليات", keywords: ["تدقيق", "سجل"], pages: [
        {"id":"auditLog","entityKey":"auditLog","href":"/settings/audit","label":"سجل العمليات","description":"سجل التدقيق الحالي متاح للمدير العام من هنا ومن قسم النظام.","keywords":["سجل التدقيق البنكي","الإدارة","سجل العمليات"],"permission":["audit.read"],"tab":false},
      ] },
      { id: "settings", label: "الإعدادات والتقارير", keywords: ["إعدادات", "تقارير", "الشركة"], pages: [
        {"id":"report","entityKey":"report","href":"/tasks/reports","label":"التقارير","description":"تقارير شاملة","keywords":["الإدارة","المستخدمون والصلاحيات"],"permission":["reports.read"],"tab":true},
        {"id":"companySettings","entityKey":"companySettings","href":"/settings","label":"الإعدادات","description":"إعدادات الشركة والمستخدمين","keywords":["الإدارة","المستخدمون والصلاحيات"],"permission":["settings.read"],"tab":true},
      ] },
    ] },
  ],
  utilityPages: [
    { id: 'navigation-guide', entityKey: 'navigationGuide', href: '/guide', label: 'دليل البنود', description: 'فهرس أقسام ومسارات النظام.', keywords: ['دليل', 'فهرس', 'أقسام', 'صفحات', 'navigation guide'], permission: [], tab: false },
  ],
  redirects: [
    { from: '/inventory/extensions', to: '/inventory/extensions?kind=spare' },
  ],
  homeWidgetEntityKeys: [
    'factoryPlanned', 'factoryActual', 'factoryExecution', 'factorySalesToday', 'factorySalesMonth', 'factoryOpenOrders',
    'factoryCostPerTon', 'factoryAvgPrice', 'factoryMargin', 'factoryStockValue', 'factoryRunningOut', 'factoryStagnant',
    'factoryReserved', 'factoryWaste', 'factoryDeviation', 'varianceReport', 'factoryStoppages',
  ],
}

export const MAX_VISIBLE_PAGE_TABS = 7
export const ALL_NAV_PAGES: NavPage[] = [
  ...NAV_CONFIG.workspaces.flatMap((workspace) => workspace.sections.flatMap((section) => section.pages)),
  ...NAV_CONFIG.utilityPages,
]

export function canonicalPages() {
  return ALL_NAV_PAGES.filter((page) => page.canonical !== false)
}

export function pageForEntity(entityKey: string) {
  return canonicalPages().find((page) => page.entityKey === entityKey) ?? NAV_CONFIG.utilityPages.find((page) => page.entityKey === entityKey) ?? null
}

export function pageForId(pageId: string) {
  return ALL_NAV_PAGES.find((page) => page.id === pageId) ?? null
}
