import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Factory,
  FileText,
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
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
export const ERP_NAV: ErpMainTab[] = [
  {
    id: 'dashboard',
    label: 'لوحة التحكم',
    icon: LayoutDashboard,
    permission: [],
    subs: [
      {
        id: 'overview',
        label: 'نظرة عامة',
        entityKey: 'dashboard',
        description: 'ملخص العمليات والمخزون والمبيعات',
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
        id: 'batches',
        label: 'دفعات المواد',
        entityKey: 'materialBatch',
        description: 'رقم الدفعة، الصلاحية، والمورد',
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
        id: 'warehouses',
        label: 'المستودعات الثلاثة',
        entityKey: 'warehouse',
        description: 'WH_RAW / WH_MFG / WH_FG والمواقع',
        permission: ['warehouses.read', 'inventory.read'],
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
        description: 'بيانات الموردين والرقم الضريبي',
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
        label: 'الوصفات BOM',
        entityKey: 'recipe',
        description: 'وصفة الإنتاج وكمية المخرجات الأساسية',
      },
      {
        id: 'recipe-items',
        label: 'مكونات الوصفة',
        entityKey: 'recipeItem',
        description: 'المواد والكميات داخل كل وصفة',
      },
      {
        id: 'production-orders',
        label: 'أوامر الإنتاج',
        entityKey: 'productionOrder',
        description: 'المخطط مقابل الفعلي والهدر وسبب الانحراف',
      },
    ],
  },
  {
    id: 'sales',
    label: 'المبيعات والسحب',
    icon: ShoppingCart,
    permission: ['sales.read'],
    subs: [
      {
        id: 'customers',
        label: 'العملاء',
        entityKey: 'customer',
        description: 'بيانات العملاء',
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
        id: 'payments',
        label: 'التحصيلات',
        entityKey: 'salesPayment',
        description: 'تحصيلات مرتبطة بالفواتير',
      },
    ],
  },
  {
    id: 'accounting',
    label: 'الحسابات والضرائب',
    icon: FileText,
    permission: ['accounting.read', 'tax.read'],
    subs: [
      {
        id: 'accounts',
        label: 'دليل الحسابات',
        entityKey: 'account',
        description: 'شجرة الحسابات',
        permission: ['accounting.read'],
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
        id: 'vat-report',
        label: 'إقرار الضريبة',
        entityKey: 'vatReport',
        description: 'ضريبة المخرجات والمدخلات وصافي المستحق',
        permission: ['tax.read', 'accounting.read'],
      },
      {
        id: 'tax-settings',
        label: 'إعدادات الضريبة',
        entityKey: 'taxSettings',
        description: 'معدل الضريبة ورقم التسجيل في عُمان',
        permission: ['tax.read', 'settings.read'],
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
    label: 'التقارير والنظام',
    icon: BarChart3,
    permission: ['reports.read', 'audit.read', 'notifications.read', 'settings.read'],
    subs: [
      {
        id: 'reports',
        label: 'التقارير',
        entityKey: 'report',
        description: 'تقارير التتبع والمخزون والإنتاج',
        permission: ['reports.read'],
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
      {
        id: 'settings',
        label: 'إعدادات الشركة',
        entityKey: 'companySettings',
        description: 'العملة، نسبة الانحراف، والضريبة',
        permission: ['settings.read'],
      },
      {
        id: 'tasks',
        label: 'المهام',
        entityKey: 'task',
        description: 'مهام تشغيلية للمتابعة',
        permission: ['notifications.read'],
      },
      {
        id: 'approvals',
        label: 'الاعتمادات',
        entityKey: 'approvals',
        description: 'أوامر الشراء والمصروفات والرواتب وتعديل المخزون',
        permission: ['approvals.decide', 'purchasing.po.approve'],
      },
      {
        id: 'users',
        label: 'المستخدمون والصلاحيات',
        entityKey: 'users',
        description: 'الأدوار الثلاثة وصلاحيات كل دور',
        permission: ['users.manage'],
      },
    ],
  },
]

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
