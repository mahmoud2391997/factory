export type MovementTone = 'success' | 'warning' | 'info'

export type Movement = {
  id: string
  type: string
  detail: string
  amount: string
  createdAt: number
  tone: MovementTone
}

export type ModuleRow = {
  ref: string
  detail: string
  value: string
  status: string
  notes?: string
  data?: Record<string, unknown>
  createdAt: number
}

export type ModuleSummary = {
  title: string
  description: string
  stats: string[]
  rows: ModuleRow[]
}

export const productionData = [
  { name: 'السبت', production: 18, sales: 14 },
  { name: 'الأحد', production: 25, sales: 18 },
  { name: 'الإثنين', production: 21, sales: 20 },
  { name: 'الثلاثاء', production: 32, sales: 25 },
  { name: 'الأربعاء', production: 28, sales: 22 },
  { name: 'الخميس', production: 38, sales: 30 },
  { name: 'الجمعة', production: 35, sales: 27 },
]

export const stockData = [
  { name: 'ذرة صفراء', value: 42, color: '#1d7f72' },
  { name: 'كسب صويا', value: 28, color: '#c79546' },
  { name: 'نخالة قمح', value: 18, color: '#7d9b61' },
  { name: 'إضافات', value: 12, color: '#d8b878' },
]

const now = Date.now()
const minutes = (count: number) => count * 60 * 1000

export const seedMovements: Movement[] = [
  {
    id: 'MOV-2481',
    type: 'إنتاج مكتمل',
    detail: 'علف تسمين مواشي - دفعة #PR-1048',
    amount: '+ 12,500 كجم',
    createdAt: now - minutes(18),
    tone: 'success',
  },
  {
    id: 'MOV-2480',
    type: 'صرف مواد خام',
    detail: 'ذرة صفراء - أمر إنتاج #PR-1048',
    amount: '- 8,200 كجم',
    createdAt: now - minutes(42),
    tone: 'warning',
  },
  {
    id: 'MOV-2479',
    type: 'فاتورة مبيعات',
    detail: 'شركة الخليج للأعلاف',
    amount: '- 4,500 كجم',
    createdAt: now - minutes(60),
    tone: 'info',
  },
  {
    id: 'MOV-2478',
    type: 'استلام مواد',
    detail: 'كسب صويا - شركة المطاحن العمانية',
    amount: '+ 25,000 كجم',
    createdAt: now - minutes(180),
    tone: 'success',
  },
]

export const moduleSummarySeed: Record<string, ModuleSummary> = {
  'المواد الخام': {
    title: 'المواد الخام',
    description: 'إدارة الأصناف، الموردين، الدُفعات، الصلاحية وحركات الاستلام والاستهلاك.',
    stats: ['٢٤ صنف', '٣ موردين', '٤ أصناف منخفضة'],
    rows: [
      { ref: 'RM-001', detail: 'ذرة صفراء', value: '١٨,٤٠٠ كجم', status: 'نشط', createdAt: now - minutes(400) },
      { ref: 'RM-002', detail: 'كسب صويا', value: '٦,٢٥٠ كجم', status: 'منخفض', createdAt: now - minutes(520) },
      { ref: 'RM-003', detail: 'نخالة قمح', value: '٩,٨٠٠ كجم', status: 'نشط', createdAt: now - minutes(680) },
    ],
  },
  'المستودعات': {
    title: 'المستودعات الثلاثة',
    description: 'سجل حركات متكامل من الاستلام حتى التحويل والتصنيع والمنتج النهائي.',
    stats: ['١ المواد الخام', '٢ التصنيع', '٣ المنتجات النهائية'],
    rows: [
      { ref: 'WH-01', detail: 'مستودع المواد الخام', value: '٢٤ صنف', status: 'نشط', createdAt: now - minutes(500) },
      { ref: 'WH-02', detail: 'مستودع التصنيع', value: '٣ أوامر', status: 'قيد التنفيذ', createdAt: now - minutes(750) },
      { ref: 'WH-03', detail: 'مستودع المنتجات', value: '٥٦,٢٢٠ كجم', status: 'نشط', createdAt: now - minutes(900) },
    ],
  },
  'التصنيع': {
    title: 'التصنيع والإنتاج',
    description: 'أوامر إنتاج، وصفات BOM، الاستهلاك الفعلي، الفاقد وفروقات الإنتاج.',
    stats: ['PR-1048 قيد المراجعة', '٩٢٪ كفاءة', '١.٨٪ فاقد'],
    rows: [
      { ref: 'PR-1048', detail: 'علف تسمين مواشي', value: '١٢,٥٠٠ كجم', status: 'مكتمل', createdAt: now - minutes(55) },
      { ref: 'PR-1047', detail: 'علف دواجن بادئ', value: '٨,٠٠٠ كجم', status: 'قيد التنفيذ', createdAt: now - minutes(190) },
      { ref: 'PR-1046', detail: 'علف أغنام', value: '٦,٥٠٠ كجم', status: 'بانتظار التخطيط', createdAt: now - minutes(620) },
    ],
  },
  'المنتجات': {
    title: 'المنتجات والوصفات',
    description: 'المنتجات النهائية، أسعار البيع، تكلفة الإنتاج والوصفات المرتبطة بها.',
    stats: ['١٢ منتج نشط', '١٢ وصفة BOM', '٣ أصناف منخفضة'],
    rows: [
      { ref: 'FG-001', detail: 'علف تسمين مواشي', value: '٢٥٠ ر.ع/طن', status: 'متوفر', createdAt: now - minutes(840) },
      { ref: 'FG-002', detail: 'علف دواجن بادئ', value: '٢١٥ ر.ع/طن', status: 'متوفر', createdAt: now - minutes(940) },
      { ref: 'FG-003', detail: 'علف أغنام', value: '٢٣٠ ر.ع/طن', status: 'منخفض', createdAt: now - minutes(1140) },
    ],
  },
  'المبيعات': {
    title: 'المبيعات والسحب',
    description: 'فواتير البيع، السحب الداخلي، العملاء، التحصيل والضريبة القابلة للتهيئة.',
    stats: ['٣٨ فاتورة', '٤٢,٦٨٠ ر.ع', '٣ مستحقات'],
    rows: [
      { ref: 'INV-2038', detail: 'شركة الخليج للأعلاف', value: '١,٢٠٠ كجم', status: 'مدفوعة', createdAt: now - minutes(75) },
      { ref: 'INV-2037', detail: 'مزارع الباطنة', value: '٨٠٠ كجم', status: 'آجلة', createdAt: now - minutes(155) },
      { ref: 'WD-091', detail: 'سحب داخلي للمجمع', value: '٣٥٠ كجم', status: 'معتمد', createdAt: now - minutes(310) },
    ],
  },
  'العملاء والموردين': {
    title: 'العملاء والموردون',
    description: 'دليل الأطراف التجارية والفواتير المدينة والدائنة ومواعيد الاستحقاق.',
    stats: ['١٨ عميل', '٣ موردين', '٥ مستحقات'],
    rows: [
      { ref: 'C-001', detail: 'شركة الخليج للأعلاف', value: '١,٢٨٠ ر.ع', status: 'عميل', createdAt: now - minutes(600) },
      { ref: 'S-001', detail: 'المطاحن العمانية', value: '٨,٤٠٠ ر.ع', status: 'مورد', createdAt: now - minutes(890) },
      { ref: 'C-002', detail: 'مزارع الباطنة', value: '٢,١٠٠ ر.ع', status: 'عميل', createdAt: now - minutes(1010) },
    ],
  },
  'الحسابات': {
    title: 'الحسابات والضريبة',
    description: 'الإيرادات والمصروفات والمقبوضات والمدفوعات وتقارير الضريبة بإعداد مركزي.',
    stats: ['إيرادات ٤٢,٦٨٠ ر.ع', 'مصروفات ١٨,٣٢٠ ر.ع', 'ضريبة قابلة للتعديل'],
    rows: [
      { ref: 'إيرادات المبيعات', detail: '٤٢,٦٨٠ ر.ع', value: 'دخل', status: 'مُرحل', createdAt: now - minutes(920) },
      { ref: 'رواتب ونقل', detail: '١٢,٨٠٠ ر.ع', value: 'مصروف', status: 'مُرحل', createdAt: now - minutes(1020) },
      { ref: 'ضريبة القيمة المضافة', detail: 'إعدادات الشركة', value: 'ضريبة', status: 'قابل للتعديل', createdAt: now - minutes(1170) },
    ],
  },
  'الموظفين': {
    title: 'الموظفون والموارد البشرية',
    description: 'ملفات الموظفين، الأقسام، الرواتب، الحالة وسجل النشاط.',
    stats: ['٤٨ موظف', '٦ أقسام', '٩٢٪ حضور'],
    rows: [
      { ref: 'EMP-001', detail: 'خالد البلوشي', value: 'الإنتاج', status: 'نشط', createdAt: now - minutes(1200) },
      { ref: 'EMP-002', detail: 'سالم الحارثي', value: 'المستودعات', status: 'نشط', createdAt: now - minutes(1450) },
      { ref: 'EMP-003', detail: 'نورة العامرية', value: 'الحسابات', status: 'نشط', createdAt: now - minutes(1600) },
    ],
  },
  'الحضور والانصراف': {
    title: 'الحضور والانصراف والبصمة',
    description: 'واجهة استيراد CSV/API أو إدخال يدوي جاهزة للربط مع أجهزة البصمة.',
    stats: ['٤٤ حاضر', '٢ غائب', '٢ متأخر'],
    rows: [
      { ref: 'خالد البلوشي', detail: '٠٦:٥٨', value: '١٥:١٢', status: 'مكتمل', createdAt: now - minutes(610) },
      { ref: 'سالم الحارثي', detail: '٠٧:٢٠', value: '١٥:٠٥', status: 'متأخر', createdAt: now - minutes(610) },
      { ref: 'نورة العامرية', detail: '٠٧:٠٠', value: '—', status: 'غياب جزئي', createdAt: now - minutes(610) },
    ],
  },
  'الإضافي': {
    title: 'الإضافي والموافقات',
    description: 'حساب الساعات الإضافية وفق جدول الموظف وقواعد الشركة مع اعتماد المدير.',
    stats: ['١٨.٥ ساعة', '٣ بانتظار الاعتماد', '١,٢٤٠ ر.ع'],
    rows: [
      { ref: 'خالد البلوشي', detail: '٢.٥ ساعة', value: '١٠٪', status: 'بانتظار الاعتماد', createdAt: now - minutes(380) },
      { ref: 'سالم الحارثي', detail: '٤ ساعات', value: '١٥٪', status: 'معتمد', createdAt: now - minutes(480) },
      { ref: 'فريق الصيانة', detail: '١٢ ساعة', value: '١٥٪', status: 'معتمد', createdAt: now - minutes(720) },
    ],
  },
  'المهام': {
    title: 'المهام والتواصل الداخلي',
    description: 'مهام المكتب الافتراضي والمصنع والمجمع مع المسؤولية والموعد النهائي والتعليقات.',
    stats: ['١٢ مهمة مفتوحة', '٧ متأخرة', '٢٤ مكتملة'],
    rows: [
      { ref: 'TASK-089', detail: 'مراجعة فاقد PR-1048', value: 'عالية', status: 'متأخرة', createdAt: now - minutes(220) },
      { ref: 'TASK-088', detail: 'تجهيز شحنة العميل', value: 'عاجلة', status: 'قيد التنفيذ', createdAt: now - minutes(90) },
      { ref: 'TASK-087', detail: 'تحديث سجل البصمة', value: 'متوسطة', status: 'مكتملة', createdAt: now - minutes(600) },
    ],
  },
  'التقارير': {
    title: 'التقارير والتحليلات',
    description: 'تقارير المخزون والتصنيع والمبيعات والحسابات والموظفين مع تصفية وتصدير.',
    stats: ['١٨ تقريراً', 'تصدير Excel', 'طباعة PDF'],
    rows: [
      { ref: 'تقرير حركة المخزون', detail: 'سبتمبر ٢٠٢٦', value: 'كل المستودعات', status: 'جاهز', createdAt: now - minutes(780) },
      { ref: 'مقارنة الاستهلاك', detail: 'PR-1048', value: 'مواد خام', status: 'جاهز', createdAt: now - minutes(980) },
      { ref: 'ملخص الربح والخسارة', detail: 'شهري', value: 'الحسابات', status: 'جاهز', createdAt: now - minutes(1180) },
    ],
  },
  'الإشعارات': {
    title: 'الإشعارات',
    description: 'تنبيهات المخزون والإنتاج والفروقات والفواتير والمهام دون تكرار للعمليات الجماعية.',
    stats: ['٤ غير مقروءة', '٢ منخفض المخزون', '١ اعتماد'],
    rows: [
      { ref: 'مخزون منخفض', detail: 'كسب الصويا وصل للحد الأدنى', value: 'منذ ١٨ دقيقة', status: 'جديد', createdAt: now - minutes(18) },
      { ref: 'فروقات إنتاج', detail: 'PR-1048 يحتاج سبباً', value: 'منذ ٤٢ دقيقة', status: 'جديد', createdAt: now - minutes(42) },
      { ref: 'مهمة متأخرة', detail: 'مراجعة الفاقد', value: 'اليوم', status: 'مفتوح', createdAt: now - minutes(120) },
    ],
  },
  'سجل العمليات': {
    title: 'سجل العمليات والتدقيق',
    description: 'أثر كامل لكل تغيير: المستخدم، الكيان، الوقت، القيم قبل وبعد والمرجع.',
    stats: ['٢,٤٨١ حركة', 'آخر تحديث الآن', 'تتبع كامل'],
    rows: [
      { ref: 'محمد البلوشي', detail: 'إكمال أمر إنتاج', value: 'PR-1048', status: 'اليوم ١٠:٢٢', createdAt: now - minutes(50) },
      { ref: 'سالم الحارثي', detail: 'تحويل مخزون', value: 'MOV-2480', status: 'اليوم ٠٩:٤٢', createdAt: now - minutes(90) },
      { ref: 'نورة العامرية', detail: 'تغيير سعر منتج', value: 'FG-002', status: 'أمس ١٦:٠٥', createdAt: now - minutes(1500) },
    ],
  },
}

export function toArabicDigits(value: number) {
  return `${value}`.replace(/\d/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)] ?? digit)
}

export function formatRelativeTimeAr(createdAt: number) {
  const diffMs = Date.now() - createdAt
  if (diffMs < 30_000) return 'الآن'

  const minutesCount = Math.floor(diffMs / 60_000)
  if (minutesCount < 60) return `منذ ${toArabicDigits(minutesCount)} دقيقة`

  const hoursCount = Math.floor(minutesCount / 60)
  if (hoursCount < 24) return `منذ ${toArabicDigits(hoursCount)} ساعة`

  const daysCount = Math.floor(hoursCount / 24)
  return `منذ ${toArabicDigits(daysCount)} يوم`
}

function modulePrefix(moduleTitle: string) {
  if (moduleTitle.includes('المواد')) return 'RM'
  if (moduleTitle.includes('مستودع') || moduleTitle.includes('المستودعات')) return 'WH'
  if (moduleTitle.includes('تصنيع') || moduleTitle.includes('الإنتاج')) return 'PR'
  if (moduleTitle.includes('مبيعات')) return 'INV'
  if (moduleTitle.includes('موظف')) return 'EMP'
  if (moduleTitle.includes('مهمة')) return 'TASK'
  return moduleTitle.slice(0, 3).toUpperCase()
}

export function createModuleRow(params: {
  moduleTitle: string
  detail: string
  value: string
  status: string
  notes?: string
  data?: Record<string, unknown>
  createdAt?: number
}): ModuleRow {
  const createdAt = params.createdAt ?? Date.now()
  const suffix = `${createdAt}`.slice(-4)
  return {
    ref: `${modulePrefix(params.moduleTitle)}-${suffix}`,
    detail: params.detail,
    value: params.value,
    status: params.status,
    notes: params.notes,
    data: params.data,
    createdAt,
  }
}

export function createMovementFromRow(moduleTitle: string, row: ModuleRow): Movement {
  const id = `MOV-${`${row.createdAt}`.slice(-4)}`

  const isProduction = moduleTitle.includes('تصنيع')
  const isSales = moduleTitle.includes('مبيعات')
  const isMaterial = moduleTitle.includes('مواد خام')

  const type = isProduction
    ? 'إنتاج جديد'
    : isSales
      ? 'فاتورة/عملية مبيعات'
      : isMaterial
        ? 'عملية مواد خام'
        : `سجل ${moduleTitle}`

  const tone: MovementTone = isProduction ? 'success' : isSales ? 'info' : isMaterial ? 'warning' : 'info'
  const amountPrefix = isSales ? '-' : '+'
  const amount = row.value && row.value !== '—' ? `${amountPrefix} ${row.value}` : '—'

  return {
    id,
    type,
    detail: `${row.detail}${row.notes ? ` • ${row.notes}` : ''}`,
    amount,
    createdAt: row.createdAt,
    tone,
  }
}

