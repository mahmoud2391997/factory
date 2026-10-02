import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Factory,
  FileText,
  LayoutDashboard,
  ShoppingCart,
  Truck,
  CarFront,
  Users,
  Warehouse,
  Landmark,
  Package,
  MessageSquare,
  Wrench,
  ClipboardCheck,
  Droplets,
  Scale,
  Fuel,
  Gauge,
  ShieldCheck,
  Receipt,
  ChartBar,
} from 'lucide-react'

export type ErpSubTab = {
  id: string
  label: string
  entityKey: string
  description: string
  permission?: string[]
}

export type ErpMainTab = {
  id: string
  label: string
  icon: LucideIcon
  permission?: string[]
  subs: ErpSubTab[]
}

/**
 * ERP navigation: main modules → sub pages (schema-backed entities).
 */
const LEGACY_ERP_NAV: ErpMainTab[] = [
  {
    id: 'dashboard',
    label: 'لوحة التحكم',
    icon: LayoutDashboard,
    permission: [],
    subs: [
      {
        id: 'overview',
        label: 'وضع المصنع اليوم',
        entityKey: 'dashboard',
        description: 'ملخص الإنتاج والمبيعات والربحية والمخزون',
      },
      {
        id: 'planned-today',
        label: 'المخطط اليوم',
        entityKey: 'factoryPlanned',
        description: 'الكمية المخططة لإنتاج اليوم',
      },
      {
        id: 'actual-today',
        label: 'الفعلي',
        entityKey: 'factoryActual',
        description: 'الكمية التي خرجت فعلياً من خط الإنتاج',
      },
      {
        id: 'execution-rate',
        label: 'نسبة التنفيذ',
        entityKey: 'factoryExecution',
        description: 'الفعلي مقارنة بالمخطط',
      },
      {
        id: 'sales-today',
        label: 'مبيعات اليوم',
        entityKey: 'factorySalesToday',
        description: 'صافي فواتير اليوم قبل الضريبة',
      },
      {
        id: 'sales-month',
        label: 'مبيعات الشهر',
        entityKey: 'factorySalesMonth',
        description: 'صافي مبيعات شهر التشغيل حتى اليوم',
      },
      {
        id: 'open-orders',
        label: 'الطلبات المفتوحة',
        entityKey: 'factoryOpenOrders',
        description: 'فواتير لم تُحصَّل بالكامل',
      },
      {
        id: 'cost-per-ton',
        label: 'تكلفة الطن',
        entityKey: 'factoryCostPerTon',
        description: 'تكلفة الطن المنتج في يوم التشغيل',
      },
      {
        id: 'avg-sale-price',
        label: 'متوسط سعر البيع',
        entityKey: 'factoryAvgPrice',
        description: 'متوسط سعر بيع الطن في فواتير اليوم',
      },
      {
        id: 'margin-per-ton',
        label: 'هامش الربح/طن',
        entityKey: 'factoryMargin',
        description: 'متوسط سعر البيع ناقص تكلفة الطن',
      },
      {
        id: 'stock-value',
        label: 'قيمة المخزون',
        entityKey: 'factoryStockValue',
        description: 'قيمة الأرصدة الحالية بالتكلفة',
      },
      {
        id: 'running-out',
        label: 'المواد التي ستنفد',
        entityKey: 'factoryRunningOut',
        description: 'مواد رصيدها عند الحد الأدنى أو دونه',
      },
      {
        id: 'stagnant',
        label: 'المواد الراكدة',
        entityKey: 'factoryStagnant',
        description: 'مواد بلا حركة صادرة منذ 7 أيام',
      },
      {
        id: 'reserved',
        label: 'المواد المحجوزة',
        entityKey: 'factoryReserved',
        description: 'مواد مخصصة للإنتاج أو في مستودع التصنيع',
      },
      {
        id: 'waste',
        label: 'الهدر',
        entityKey: 'factoryWaste',
        description: 'كمية الهدر في إنتاج اليوم',
      },
      {
        id: 'recipe-variance',
        label: 'الانحراف عن الوصفة',
        entityKey: 'factoryDeviation',
        description: 'الفرق بين المتوقع في الوصفة والمصروف فعلياً',
      },
      {
        id: 'variance-report',
        label: 'تحليل الانحراف',
        entityKey: 'varianceReport',
        description: 'الانحراف والهدر حسب المنتج والوردية والمشغّل والخط والشهر',
      },
      {
        id: 'stoppages',
        label: 'توقفات المصنع',
        entityKey: 'factoryStoppages',
        description: 'توقفات الخط في يوم التشغيل',
      },
    ],
  },
  {
    id: 'inventory',
    label: 'المخزون والمستودعات',
    icon: Warehouse,
    permission: ['inventory.read', 'warehouses.read'],
    subs: [
      {
        id: 'materials',
        label: 'المواد الخام',
        entityKey: 'material',
        description: 'أصناف المواد الخام والحد الأدنى والوحدة',
        permission: ['inventory.read'],
      },
      {
        id: 'products',
        label: 'المنتجات النهائية',
        entityKey: 'product',
        description: 'المنتجات الجاهزة وأسعار البيع',
        permission: ['inventory.read', 'production.read'],
      },
      {
        id: 'inventory-extensions',
        label: 'المخزون الإضافي',
        entityKey: 'inventoryExtensions',
        description: 'قطع الغيار ومواد التعبئة',
        permission: ['spareparts.read', 'packaging.read'],
      },
      {
        id: 'warehouses',
        label: 'المستودعات',
        entityKey: 'warehouse',
        description: 'أرصدة المستودعات والتحويلات',
        permission: ['warehouses.read', 'inventory.read'],
      },
      {
        id: 'transfers',
        label: 'تحويلات المخزون',
        entityKey: 'stockTransfer',
        description: 'تحويل بين المستودعات الثلاثة',
        permission: ['inventory.transfer.create', 'inventory.read'],
      },
      {
        id: 'adjustments',
        label: 'تعديل المخزون',
        entityKey: 'stockAdjustment',
        description: 'تعديل مع سبب إلزامي واعتماد المدير',
        permission: ['inventory.adjust'],
      },
      {
        id: 'barcode',
        label: 'محطة الباركود',
        entityKey: 'barcode',
        description: 'مسح الأصناف وطباعة الملصقات',
        permission: ['barcode.scan', 'inventory.read'],
      },
      {
        id: 'batches',
        label: 'دفعات المواد',
        entityKey: 'materialBatch',
        description: 'رقم الدفعة، الصلاحية، والمورد',
        permission: ['inventory.read'],
      },
      {
        id: 'balances',
        label: 'أرصدة المخزون',
        entityKey: 'inventoryBalance',
        description: 'الرصيد الحالي ومتوسط التكلفة',
        permission: ['inventory.read'],
      },
      {
        id: 'ledger',
        label: 'دفتر الحركات',
        entityKey: 'inventoryTransaction',
        description: 'كل حركة مخزون قابلة للتدقيق',
        permission: ['inventory.ledger.read', 'inventory.read'],
      },
      {
        id: 'inventory-reports',
        label: 'تقارير المخزون',
        entityKey: 'inventoryReports',
        description: 'التحليلات والتقارير المخزنية',
        permission: ['inventory.read'],
      },
      {
        id: 'material-price-analysis',
        label: 'تحليل أسعار المواد الخام',
        entityKey: 'materialPriceAnalysis',
        description: 'متوسط وأعلى وأقل سعر شهرياً، المورد، الكمية المشتراة والمستهلكة، تكلفة النقل، والتكلفة الواصلة للمصنع',
        permission: ['inventory.read'],
      },
    ],
  },
  {
    id: 'purchasing',
    label: 'المشتريات',
    icon: Truck,
    permission: ['purchasing.read'],
    subs: [
      {
        id: 'suppliers',
        label: 'الموردون',
        entityKey: 'supplier',
        description: 'الموردون وأوامر الشراء',
      },
      {
        id: 'supplier-relations',
        label: 'علاقات الموردين',
        entityKey: 'supplierRelations',
        description: 'التواصل والقوالب',
        permission: ['suppliers.communicate'],
      },
      {
        id: 'supplier-templates',
        label: 'قوالب الرسائل',
        entityKey: 'supplierTemplate',
        description: 'قوالب طلبات الأسعار والاستفسارات',
        permission: ['suppliers.communicate'],
      },
      {
        id: 'supplier-communications',
        label: 'مراسلات الموردين',
        entityKey: 'supplierCommunication',
        description: 'الرسائل المجهزة والمعتمدة والمرسلة',
        permission: ['suppliers.communicate'],
      },
      {
        id: 'purchase-requests',
        label: 'طلبات الشراء',
        entityKey: 'purchaseRequest',
        description: 'طلب → عروض الموردين → اختيار المورد → اعتماد → أمر شراء',
      },
      {
        id: 'purchase-orders',
        label: 'أوامر الشراء',
        entityKey: 'purchaseOrder',
        description: 'أوامر الشراء وحالتها',
      },
      {
        id: 'goods-receipts',
        label: 'استلام البضاعة',
        entityKey: 'goodsReceipt',
        description: 'استلام إلى مستودع المواد الخام',
      },
    ],
  },
  {
    id: 'manufacturing',
    label: 'التصنيع',
    icon: Factory,
    permission: ['production.read'],
    subs: [
      {
        id: 'recipes',
        label: 'الوصفات',
        entityKey: 'recipe',
        description: 'وصفات الإنتاج والعميل',
      },
      {
        id: 'recipe-items',
        label: 'مكونات الوصفات',
        entityKey: 'recipeItem',
        description: 'مكونات كل وصفة وكمياتها بالنسبة لأساس الإنتاج',
        permission: ['production.read'],
      },
      {
        id: 'customer-recipes',
        label: 'وصفات العملاء',
        entityKey: 'customerRecipe',
        description: 'وصفات وأسعار مخصصة لكل عميل',
        permission: ['production.read', 'recipes.custom'],
      },
      {
        id: 'production-orders',
        label: 'أوامر الإنتاج',
        entityKey: 'productionOrder',
        description: 'أوامر الإنتاج والدفعات',
      },
      {
        id: 'scale',
        label: 'الميزان',
        entityKey: 'scaleReading',
        description: 'قراءات الميزان وربطها بالإنتاج',
        permission: ['scale.read'],
      },
      {
        id: 'production-lots',
        label: 'دفعات الإنتاج',
        entityKey: 'productionLot',
        description: 'دفعة الإنتاج وربط الخام والمورد والعامل والعميل',
        permission: ['production.read'],
      },
      {
        id: 'lot-trace',
        label: 'تتبع دفعات الإنتاج',
        entityKey: 'lotTrace',
        description: 'تتبع الخامات والعملاء والجودة والتكلفة المرتبطة بكل دفعة',
        permission: ['production.read'],
      },
      {
        id: 'quality',
        label: 'الجودة',
        entityKey: 'qualitySample',
        description: 'عينات الجودة وجودة المورد',
        permission: ['qc.read'],
      },
      {
        id: 'supplier-quality',
        label: 'جودة المورد',
        entityKey: 'supplierQuality',
        description: 'عدد العينات ونسبة القبول ومتوسط الرطوبة والبروتين',
        permission: ['qc.read'],
      },
      {
        id: 'maintenance',
        label: 'الصيانة',
        entityKey: 'maintenance',
        description: 'الآلات وجداول الصيانة',
        permission: ['maintenance.read'],
      },
      {
        id: 'machines',
        label: 'الآلات',
        entityKey: 'machine',
        description: 'سجل الآلات ومواقعها وتكاليفها التشغيلية',
        permission: ['maintenance.read'],
      },
      {
        id: 'maintenance-schedules',
        label: 'جداول الصيانة',
        entityKey: 'maintenanceSchedule',
        description: 'خطط الصيانة الوقائية ومواعيدها',
        permission: ['maintenance.read'],
      },
      {
        id: 'maintenance-records',
        label: 'سجلات الصيانة',
        entityKey: 'maintenanceRecord',
        description: 'الأعمال المنفذة والتكاليف والتوقفات',
        permission: ['maintenance.read'],
      },
      {
        id: 'production-reports',
        label: 'تقارير الإنتاج',
        entityKey: 'productionReports',
        description: 'تحليلات الإنتاج والمصنع',
      },
    ],
  },
  {
    id: 'sales',
    label: 'المبيعات',
    icon: ShoppingCart,
    permission: ['sales.read'],
    subs: [
      {
        id: 'customers',
        label: 'العملاء',
        entityKey: 'customer',
        description: 'العملاء والفواتير',
      },
      {
        id: 'invoices',
        label: 'فواتير المبيعات',
        entityKey: 'salesInvoice',
        description: 'فواتير مع الضريبة والحالة',
      },
      {
        id: 'withdrawals',
        label: 'السحوبات',
        entityKey: 'withdrawal',
        description: 'سحب من مستودع المنتجات',
      },
      {
        id: 'collections',
        label: 'التحصيلات',
        entityKey: 'salesPayment',
        description: 'ما دخل الصندوق أو البنك مقابل الفواتير',
        permission: ['sales.read', 'sales.payments.manage'],
      },
      {
        id: 'distribution',
        label: 'التوزيع',
        entityKey: 'distribution',
        description: 'نقاط التوزيع والتسليم',
        permission: ['distribution.read'],
      },
      {
        id: 'distribution-points',
        label: 'نقاط التوزيع',
        entityKey: 'distributionPoint',
        description: 'إدارة مواقع التوزيع ومسؤوليها',
        permission: ['distribution.read'],
      },
      {
        id: 'distribution-closings',
        label: 'إقفال التوزيع',
        entityKey: 'distributionClosing',
        description: 'إقفال يومي ومطابقة المبيعات والمخزون والتحصيل',
        permission: ['distribution.read'],
      },
      {
        id: 'invoice-delivery',
        label: 'تسليم الفواتير',
        entityKey: 'invoiceDelivery',
        description: 'مراحل اعتماد الفاتورة حتى التسليم للعميل',
        permission: ['delivery.track', 'sales.read'],
      },
      {
        id: 'sales-reports',
        label: 'تقارير المبيعات',
        entityKey: 'salesReports',
        description: 'تحليلات المبيعات',
      },
      {
        id: 'profitability',
        label: 'تحليل الربحية',
        entityKey: 'profitability',
        description: 'تكلفة الطن ومتوسط سعر البيع والهامش حسب المنتج أو العميل أو الشهر',
      },
    ],
  },
  {
    id: 'fleet',
    label: 'الأسطول',
    icon: CarFront,
    permission: ['fleet.read'],
    subs: [
      { id: 'vehicles', label: 'المركبات', entityKey: 'fleet', description: 'المركبات والوثائق والعدادات', permission: ['fleet.read', 'fleet.service.manage', 'fleet.manage'] },
      { id: 'fleet-fuel', label: 'الوقود', entityKey: 'fleetFuel', description: 'سجل الوقود والاستهلاك', permission: ['fleet.read'] },
      { id: 'fleet-trips', label: 'الرحلات', entityKey: 'fleetTrips', description: 'الرحلات والتكاليف والمسافات', permission: ['fleet.read'] },
    ],
  },
  {
    id: 'accounting',
    label: 'الحسابات',
    icon: FileText,
    permission: ['accounting.read', 'tax.read'],
    subs: [
      {
        id: 'accounts',
        label: 'المحاسبة',
        entityKey: 'account',
        description: 'الحسابات والقيود والمصروفات',
      },
      {
        id: 'journals',
        label: 'القيود اليومية',
        entityKey: 'journalEntry',
        description: 'قيود مرتبطة بالعمليات',
        permission: ['accounting.read'],
      },
      {
        id: 'expenses',
        label: 'المصروفات',
        entityKey: 'expense',
        description: 'مصروفات بانتظار الاعتماد ثم الترحيل',
        permission: ['expenses.manage', 'accounting.read'],
      },
      {
        id: 'tax',
        label: 'الضرائب',
        entityKey: 'taxSettings',
        description: 'ضريبة القيمة المضافة',
        permission: ['tax.read'],
      },
      {
        id: 'vat-report',
        label: 'إقرار الضريبة',
        entityKey: 'vatReport',
        description: 'ضريبة المخرجات والمدخلات وصافي المستحق',
        permission: ['tax.read', 'accounting.read'],
      },
      {
        id: 'financial-operations',
        label: 'العمليات المالية',
        entityKey: 'financialOps',
        description: 'المرافق والبنك والالتزامات',
        permission: ['utilities.read', 'bank.read'],
      },
      {
        id: 'utilities-readings',
        label: 'قراءات المرافق',
        entityKey: 'utilitiesReading',
        description: 'تسجيل ومقارنة استهلاك الكهرباء والماء والغاز',
        permission: ['utilities.read'],
      },
      {
        id: 'bank-transactions',
        label: 'معاملات البنك',
        entityKey: 'bankTransaction',
        description: 'تسجيل ومطابقة معاملات البنك وسجل التدقيق البنكي',
        permission: ['bank.read'],
      },
      {
        id: 'obligations',
        label: 'الالتزامات المالية',
        entityKey: 'obligation',
        description: 'الالتزامات والأقساط والاستحقاقات القادمة',
        permission: ['obligations.read'],
      },
      {
        id: 'documents',
        label: 'الوثائق والتصاريح',
        entityKey: 'documents',
        description: 'سجل الوثائق وتواريخ الانتهاء والتجديد',
        permission: ['documents.read'],
      },
      {
        id: 'accounting-reports',
        label: 'تقارير المحاسبة',
        entityKey: 'accountingReports',
        description: 'التكلفة والهامش والربحية',
      },
    ],
  },
  {
    id: 'hr',
    label: 'الموارد البشرية',
    icon: Users,
    permission: ['employees.read', 'attendance.read', 'overtime.read'],
    subs: [
      {
        id: 'employees',
        label: 'الموظفون',
        entityKey: 'employee',
        description: 'بيانات الموظفين والأقسام',
        permission: ['employees.read'],
      },
      {
        id: 'attendance',
        label: 'الحضور والانصراف',
        entityKey: 'attendance',
        description: 'سجل الحضور (يدوي / CSV / جهاز)',
        permission: ['attendance.read'],
      },
      {
        id: 'overtime',
        label: 'الإضافي',
        entityKey: 'overtime',
        description: 'ساعات إضافية محسوبة من الحضور',
        permission: ['attendance.read', 'payroll.manage'],
      },
      {
        id: 'payroll',
        label: 'الرواتب',
        entityKey: 'payroll',
        description: 'مسير الرواتب والاعتماد والصرف',
        permission: ['payroll.manage', 'employees.read'],
      },
    ],
  },
  {
    id: 'system',
    label: 'النظام',
    icon: BarChart3,
    permission: ['reports.read', 'audit.read', 'notifications.read', 'settings.read'],
    subs: [
      {
        id: 'reports',
        label: 'التقارير',
        entityKey: 'report',
        description: 'تقارير شاملة',
        permission: ['reports.read'],
      },
      {
        id: 'material-trace',
        label: 'تتبع الخامة',
        entityKey: 'materialTrace',
        description: 'دخول الخامة واستهلاكها والمتبقي والمنتج المباع والهدر وسبب الفرق',
        permission: ['reports.read', 'inventory.read'],
      },
      {
        id: 'settings',
        label: 'الإعدادات',
        entityKey: 'companySettings',
        description: 'إعدادات الشركة والمستخدمين',
        permission: ['settings.read'],
      },
      {
        id: 'approvals',
        label: 'الاعتمادات',
        entityKey: 'approvals',
        description: 'الموافقات المعلقة',
        permission: ['approvals.decide'],
      },
      {
        id: 'users',
        label: 'المستخدمون والصلاحيات',
        entityKey: 'users',
        description: 'الأدوار وصلاحيات كل دور',
        permission: ['users.manage'],
      },
      {
        id: 'notifications',
        label: 'الإشعارات',
        entityKey: 'notification',
        description: 'تنبيهات النظام',
        permission: ['notifications.read'],
      },
      {
        id: 'audit',
        label: 'سجل العمليات',
        entityKey: 'auditLog',
        description: 'من فعل ماذا ومتى',
        permission: ['audit.read'],
      },
    ],
  },
]

/** Build the owner-facing navigation from the prior screens, preserving entity keys and effective access. */
const LEGACY_SUBS = new Map<string, ErpSubTab>()
for (const legacyMain of LEGACY_ERP_NAV) {
  for (const legacySub of legacyMain.subs) {
    LEGACY_SUBS.set(legacySub.entityKey, {
      ...legacySub,
      permission: [...(legacySub.permission ?? legacyMain.permission ?? [])],
    })
  }
}

function screen(entityKey: string, label?: string, id?: string, description?: string): ErpSubTab {
  const existing = LEGACY_SUBS.get(entityKey)
  if (!existing) throw new Error(`شاشة غير معروفة في التنقل: ${entityKey}`)
  return {
    ...existing,
    id: id ?? existing.id,
    label: label ?? existing.label,
    description: description ?? existing.description,
    permission: [...(existing.permission ?? [])],
  }
}

function main(id: string, label: string, icon: LucideIcon, subs: ErpSubTab[]): ErpMainTab {
  return {
    id,
    label,
    icon,
    permission: [...new Set(subs.flatMap((sub) => sub.permission ?? []))],
    subs,
  }
}

export const ERP_NAV: ErpMainTab[] = [
  main('dashboard', 'لوحة المالك', LayoutDashboard, [
    screen('dashboard'), screen('factoryPlanned'), screen('factoryActual'), screen('factoryExecution'),
    screen('factorySalesToday'), screen('factorySalesMonth'), screen('factoryOpenOrders'), screen('factoryCostPerTon'),
    screen('factoryAvgPrice'), screen('factoryMargin'), screen('factoryStockValue'), screen('factoryRunningOut'),
    screen('factoryStagnant'), screen('factoryReserved'), screen('factoryWaste'), screen('factoryDeviation'),
    screen('varianceReport'), screen('factoryStoppages'),
  ].map((sub) => ({ ...sub, permission: ['users.manage'] }))),
  main('fleet-transport', 'السيارات والنقل', CarFront, [
    screen('fleet', 'المركبات', 'vehicles', 'ملف المركبة وبياناتها؛ الوثائق المرتبطة متاحة في مركز الوثائق.'),
    screen('fleet', 'الصيانة الدورية والإطارات والزيوت', 'vehicle-service', 'أقرب شاشة موجودة: ملف المركبات وسجل خدماتها.'),
    screen('fleetFuel', 'الوقود — كل تعبئة', 'fuel', 'سجل تعبئات الوقود والاستهلاك.'),
    screen('fleetTrips', 'الرحلات — السائق والوجهة والمسافة والحمولة والتكلفة', 'trips', 'تسجيل الرحلات وتكلفتها.'),
    screen('fleetFuel', 'الاستهلاك المتوقع مقابل الفعلي', 'fuel-variance', 'أقرب شاشة موجودة: سجل الوقود واستهلاك المركبة.'),
    screen('fleetTrips', 'تكلفة النقل لكل طن أو طلبية أو عميل', 'transport-cost', 'أقرب شاشة موجودة: الرحلات وتوزيع تكلفتها على الفواتير.'),
  ]),
  main('obligations', 'الأقساط والالتزامات المالية', Receipt, [
    screen('obligation', 'جدول الالتزامات والدفعات والمتبقي والتنبيهات القادمة', 'obligations-table', 'الالتزامات والأقساط والاستحقاقات القادمة.'),
  ]),
  main('bank-accounts', 'البنك والحسابات', Landmark, [
    screen('bankTransaction', 'معاملات البنك والمطابقة وسجل التدقيق', 'bank-reconciliation'),
    screen('account', 'دليل الحسابات', 'accounts'),
    screen('journalEntry', 'القيود اليومية', 'journals'),
    screen('expense', 'المصروفات والاعتمادات', 'expenses'),
    screen('financialOps', 'العمليات المالية', 'financial-operations'),
    screen('taxSettings', 'الضرائب', 'tax-settings'),
    screen('vatReport', 'إقرار الضريبة', 'vat-report'),
    screen('accountingReports', 'تقارير المحاسبة', 'accounting-reports'),
  ]),
  main('purchasing', 'المشتريات والموافقات', ShoppingCart, [
    screen('purchaseRequest', 'طلبات الشراء وعروض الأسعار والمقارنة والاعتماد', 'purchase-requests'),
    screen('purchaseOrder', 'أوامر الشراء', 'purchase-orders'),
    screen('goodsReceipt', 'استلام البضاعة والفواتير', 'goods-receipts'),
    screen('supplier', 'ملف الموردين وآخر أسعار الشراء', 'suppliers', 'ملفات الموردين؛ تحليل الأسعار في شاشة تحليل أسعار المواد الخام.'),
  ]),
  main('spare-parts', 'مخزن قطع الغيار', Package, [
    screen('inventoryExtensions', 'القطع والأكواد والصرف والحد الأدنى والماكينة', 'spare-parts', 'شاشة المخزون الإضافي الحالية تشمل قطع الغيار ومواد التعبئة.'),
  ]),
  main('packaging', 'مخزن مواد التعبئة والتشغيل', Boxes, [
    screen('inventoryExtensions', 'الأكياس والخيوط والحبر والأوراق والملصقات', 'packaging-stock', 'المخزون الإضافي الحالي؛ صرف التعبئة والجرد مرتبطان بأوامر الإنتاج.'),
  ]),
  main('supplier-communications', 'التواصل مع الموردين', MessageSquare, [
    screen('supplierTemplate', 'قوالب الرسائل', 'supplier-templates'),
    screen('supplierCommunication', 'تجهيز الرسالة واعتماد المسؤول وسجل المراسلات', 'supplier-communications'),
    screen('supplierRelations', 'العروض داخل ملف المورد وعلاقات الموردين', 'supplier-relations'),
  ]),
  main('manufacturing-scale', 'التصنيع والميزان', Factory, [
    screen('productionOrder', 'أوامر التصنيع', 'production-orders'),
    screen('scaleReading', 'الميزان وقراءات الخام', 'scale-readings'),
    screen('productionLot', 'المنتج النهائي ودفعات الإنتاج', 'production-lots'),
    screen('productionReports', 'تكلفة الطن الفعلية وتقارير الإنتاج', 'production-reports'),
  ]),
  main('recipes', 'الخلطات والأوزان', Scale, [
    screen('recipe', 'الوصفات والأوزان', 'recipes'),
    screen('recipeItem', 'مكونات الوصفة', 'recipe-items'),
    screen('product', 'الأوزان وتكلفة المنتج بالخلطة الحالية', 'recipe-product-cost', 'أقرب شاشة موجودة: بطاقة المنتج والوصفة الحالية.'),
  ]),
  main('customer-recipes', 'خلطات العملاء', Users, [
    screen('customerRecipe', 'وصفات العملاء والأسعار الخاصة', 'customer-recipes'),
  ]),
  main('distribution', 'نقاط التوزيع', Route, [
    screen('distribution', 'التوزيع', 'distribution-hub'),
    screen('distributionPoint', 'نقاط التوزيع وأرصدة كل نقطة', 'distribution-points'),
    screen('barcode', 'مسح الباركود', 'distribution-barcode'),
    screen('distributionClosing', 'الإقفال اليومي', 'distribution-closing'),
  ]),
  main('invoice-delivery', 'دورة الفاتورة والتسليم', ClipboardCheck, [
    screen('invoiceDelivery', 'المحاسب ← التحميل ← السائق ← العميل وإثبات التسليم', 'invoice-delivery'),
  ]),
  main('utilities', 'الكهرباء والماء والغاز', Droplets, [
    screen('utilitiesReading', 'قراءات المرافق والاستهلاك لكل طن والمقارنة الشهرية', 'utilities-readings'),
  ]),
  main('documents', 'التصاريح والعقود والوثائق', FileArchive, [
    screen('documents', 'الوثائق والتراخيص والملكية والتأمين والعقود والإيجارات', 'company-documents'),
  ]),
  main('employees', 'الموظفون', Users, [
    screen('employee', 'ملفات الموظفين والعقود والإقامات', 'employees'),
    screen('attendance', 'الحضور والإجازات', 'attendance'),
    screen('overtime', 'الإضافي', 'overtime'),
    screen('payroll', 'الرواتب', 'payroll'),
  ]),
  main('raw-material-analysis', 'تحليل أسعار المواد الخام', ChartBar, [
    screen('materialPriceAnalysis', 'متوسط وأعلى وأقل سعر والمورد والكمية والتكلفة الواصلة', 'material-price-analysis'),
  ]),
  main('maintenance', 'الصيانة', Wrench, [
    screen('machine', 'ملف كل ماكينة', 'machines'),
    screen('maintenanceSchedule', 'جداول الصيانة', 'maintenance-schedules'),
    screen('maintenanceRecord', 'الأعطال والتكلفة والتوقف وقطع الغيار المستخدمة', 'maintenance-records'),
    screen('maintenance', 'مركز الصيانة', 'maintenance-hub'),
  ]),
  main('quality', 'الجودة والتحليل الغذائي', ShieldCheck, [
    screen('qualitySample', 'عينات الخام والمنتج والتحليل المخبري', 'quality-samples'),
    screen('supplierQuality', 'مقارنة الجودة والمواصفة وجودة الموردين', 'supplier-quality'),
  ]),
  main('batch-tracking', 'تتبع الدفعات والهدر', ClipboardList, [
    screen('lotTrace', 'تتبع الخامة والاستدعاء', 'lot-trace'),
    screen('factoryWaste', 'تحليل الهدر', 'waste-analysis'),
    screen('factoryDeviation', 'تحليل الانحراف', 'deviation-analysis'),
    screen('varianceReport', 'الدفعات والانحراف حسب المنتج والوردية', 'batch-variance'),
    screen('materialTrace', 'تتبع الخامة من الاستلام إلى الاستهلاك', 'material-trace'),
  ]),
  main('profitability', 'الربحية', BarChart3, [
    screen('profitability', 'الربحية حسب المنتج والعميل', 'profitability-analysis'),
    screen('factoryCostPerTon', 'تكلفة الطن', 'profit-cost-per-ton'),
    screen('factoryMargin', 'هامش الربح', 'profit-margin'),
    screen('factoryAvgPrice', 'متوسط سعر البيع', 'profit-average-price'),
  ]),
  main('sales', 'المبيعات', ShoppingCart, [
    screen('customer', 'العملاء', 'customers'),
    screen('salesInvoice', 'الطلبات والفواتير', 'sales-invoices'),
    screen('salesPayment', 'التحصيل', 'sales-payments'),
    screen('withdrawal', 'السحوبات والمرتجعات', 'withdrawals-returns', 'أقرب شاشة موجودة: السحوبات والفواتير؛ لا توجد شاشة مرتجعات مستقلة بعد.'),
    screen('salesReports', 'تقارير المبيعات', 'sales-reports'),
  ]),
  main('inventory', 'المخزون العام', Warehouse, [
    screen('material', 'المواد الخام', 'raw-materials'),
    screen('product', 'المنتجات النهائية', 'finished-products'),
    screen('warehouse', 'المستودعات', 'warehouses'),
    screen('stockTransfer', 'تحويلات المخزون', 'stock-transfers'),
    screen('stockAdjustment', 'تعديل المخزون', 'stock-adjustments'),
    screen('barcode', 'محطة الباركود', 'inventory-barcode'),
    screen('materialBatch', 'دفعات المواد', 'material-batches'),
    screen('inventoryBalance', 'أرصدة المخزون', 'inventory-balances'),
    screen('inventoryTransaction', 'دفتر الحركات', 'inventory-ledger'),
    screen('inventoryReports', 'تقارير المخزون', 'inventory-reports'),
    screen('factoryStockValue', 'قيمة المخزون', 'inventory-value'),
    screen('factoryRunningOut', 'المواد التي ستنفد', 'inventory-low-stock'),
    screen('factoryStagnant', 'المواد الراكدة', 'inventory-stagnant'),
    screen('factoryReserved', 'المواد المحجوزة', 'inventory-reserved'),
  ]),
  main('system', 'النظام', Settings, [
    screen('users', 'المستخدمون والصلاحيات', 'users'),
    screen('auditLog', 'سجل العمليات', 'audit-log'),
    screen('companySettings', 'الإعدادات', 'settings'),
    screen('report', 'التقارير', 'reports'),
    screen('approvals', 'الاعتمادات', 'approvals'),
    screen('notification', 'الإشعارات', 'notifications'),
  ]),
]

const LEGACY_ENTITY_KEYS = new Set(LEGACY_SUBS.keys())
for (const entityKey of LEGACY_ENTITY_KEYS) {
  if (!ERP_NAV.some((item) => item.subs.some((sub) => sub.entityKey === entityKey))) {
    throw new Error(`شاشة قديمة غير موجودة في التنقل الجديد: ${entityKey}`)
  }
}

/** Visual groups for the sidebar. Ids stay the existing modules so routes do not change. */
export const NAV_SECTIONS: Array<{ id: string; label: string; mainIds: string[] }> = [
  { id: 'overview', label: 'نظرة عامة', mainIds: ['dashboard'] },
  { id: 'operations', label: 'العمليات والإنتاج', mainIds: ['manufacturing-scale', 'recipes', 'customer-recipes', 'raw-material-analysis', 'utilities', 'quality', 'batch-tracking'] },
  { id: 'purchasing-stores', label: 'المشتريات والمخازن', mainIds: ['purchasing', 'spare-parts', 'packaging', 'supplier-communications', 'inventory'] },
  { id: 'finance', label: 'المالية', mainIds: ['obligations', 'bank-accounts', 'profitability'] },
  { id: 'sales-distribution', label: 'المبيعات والتوزيع', mainIds: ['sales', 'distribution', 'invoice-delivery'] },
  { id: 'fleet-maintenance', label: 'الأسطول والصيانة', mainIds: ['fleet-transport', 'maintenance'] },
  { id: 'hr', label: 'الموارد البشرية', mainIds: ['employees'] },
  { id: 'admin', label: 'الإدارة', mainIds: ['documents', 'system'] },
]
export function sectionForMain(mainId: string) {
  return NAV_SECTIONS.find((section) => section.mainIds.includes(mainId)) ?? NAV_SECTIONS[NAV_SECTIONS.length - 1]!
}

export function findNavByEntity(entityKey: string) {
  for (const main of ERP_NAV) {
    for (const sub of main.subs) {
      if (sub.entityKey === entityKey || sub.id === entityKey) {
        return { main, sub }
      }
    }
  }
  return null
}

export function canAccessMain(permissions: string[], main: ErpMainTab) {
  if (!main.permission || main.permission.length === 0) return true
  return main.permission.some((p) => permissions.includes(p))
}

export function canAccessSub(permissions: string[], sub: ErpSubTab, main: ErpMainTab) {
  const needed = sub.permission ?? main.permission ?? []
  if (needed.length === 0) return true
  return needed.some((p) => permissions.includes(p))
}
