import type { Permission } from './domain/permissions'

/** Owner-facing descriptions; permission identifiers remain internal. */
export const PERMISSION_LABELS: Record<Permission, string> = {
  "users.read": "الاطلاع على أسماء المستخدمين وأدوارهم",
  "users.manage": "إضافة المستخدمين وتعديل حساباتهم وكلمات مرورهم",
  "roles.read": "الاطلاع على صلاحيات الأدوار الوظيفية",
  "roles.manage": "تحديد ما يسمح به لكل دور وظيفي",
  "settings.read": "الاطلاع على إعدادات الشركة والنظام",
  "settings.update": "تغيير إعدادات الشركة والنظام",
  "approvals.decide": "قبول الطلبات المعلقة أو رفضها",
  "reports.read": "الاطلاع على التقارير",
  "audit.read": "معرفة من نفّذ كل عملية ومتى",
  "notifications.read": "قراءة تنبيهات النظام",
  "warehouses.read": "الاطلاع على المستودعات وأرصدتها",
  "warehouses.manage": "إضافة المستودعات وتعديل بياناتها",
  "inventory.read": "الاطلاع على الأصناف والكميات المتاحة",
  "inventory.transfer.create": "نقل المواد بين المستودعات",
  "inventory.adjust": "تعديل رصيد المخزون وتسوية فروق الجرد",
  "inventory.ledger.read": "مراجعة سجل دخول المواد وخروجها",
  "barcode.scan": "مسح الباركود للتعرف على الأصناف",
  "packaging.read": "الاطلاع على الأكياس ومواد التعبئة وأرصدتها",
  "packaging.manage": "إضافة الأكياس ومواد التعبئة وتسجيل حركاتها وجردها",
  "spareparts.read": "الاطلاع على قطع الغيار وأرصدتها",
  "spareparts.manage": "إضافة قطع الغيار وتسجيل حركاتها وجردها",
  "purchasing.read": "الاطلاع على المشتريات وطلبات الشراء",
  "purchasing.request.create": "طلب شراء مواد يحتاجها المصنع",
  "purchasing.request.approve": "اعتماد طلبات شراء المواد",
  "purchasing.quotation.manage": "تسجيل عروض أسعار الموردين ومقارنتها",
  "purchasing.po.create": "إعداد أمر شراء للمورد",
  "purchasing.po.approve": "الموافقة على أوامر الشراء ضمن حدود الدور",
  "purchasing.gr.create": "تسجيل المواد المستلمة من المورد",
  "suppliers.communicate": "تسجيل التواصل والمتابعة مع الموردين",
  "suppliers.approve": "اعتماد الموردين",
  "production.read": "الاطلاع على الخلطات وأوامر الإنتاج والدفعات",
  "production.create": "إعداد الخلطات وإنشاء أوامر الإنتاج",
  "production.complete": "تسجيل الإنتاج الفعلي وإكمال أمر الإنتاج",
  "production.cost.approve": "اعتماد تكلفة الإنتاج",
  "production.cost.recalculate": "إعادة حساب تكلفة الإنتاج عند إغلاق الشهر",
  "production.variance.thresholds": "تحديد حدود اختلاف الاستهلاك عن الخلطة",
  "recipes.custom": "إعداد خلطات خاصة للعملاء",
  "scale.read": "الاطلاع على قراءات الميزان",
  "scale.manage": "تسجيل قراءات الميزان وربطها بالإنتاج",
  "qc.read": "الاطلاع على عينات الجودة ونتائج الفحص",
  "qc.manage": "تسجيل عينات الجودة ونتائج التحليل",
  "qc.release": "السماح باستخدام الدفعات بعد مراجعة الجودة",
  "qc.limits": "تحديد المواصفات وحدود قبول نتائج الجودة",
  "sales.read": "الاطلاع على العملاء والفواتير والمبيعات",
  "sales.create": "إضافة العملاء وإعداد فواتير البيع",
  "sales.confirm": "تأكيد فواتير البيع وصرف المنتجات من المخزون",
  "sales.payments.manage": "تسجيل المبالغ المحصلة من العملاء",
  "pricing.custom": "تحديد أسعار خاصة للعملاء",
  "distribution.read": "الاطلاع على نقاط التوزيع",
  "distribution.manage": "إضافة نقاط التوزيع وتعديل بياناتها",
  "delivery.track": "متابعة تسليم الطلبات",
  "accounting.read": "الاطلاع على الحسابات والقيود والتقارير المالية",
  "accounting.manage": "إضافة الحسابات وإدارة القيود المحاسبية",
  "tax.read": "الاطلاع على الضرائب والإقرارات",
  "tax.manage": "إعداد الضرائب وإدارة بياناتها",
  "expenses.manage": "تسجيل المصروفات وتعديلها",
  "expenses.approve": "اعتماد المصروفات",
  "bank.read": "الاطلاع على حسابات البنك وحركاته",
  "bank.manage": "تسجيل حركات البنك وتسويتها",
  "obligations.read": "الاطلاع على الالتزامات والمبالغ المستحقة",
  "obligations.manage": "تسجيل الالتزامات ومواعيد استحقاقها",
  "obligations.pay": "تسجيل سداد الالتزامات المستحقة",
  "documents.read": "الاطلاع على وثائق الشركة",
  "documents.manage": "إضافة وثائق الشركة وتعديلها",
  "utilities.read": "الاطلاع على استهلاك الكهرباء والماء والخدمات",
  "utilities.manage": "تسجيل استهلاك الخدمات وتكاليفها",
  "employees.read": "الاطلاع على بيانات الموظفين",
  "employees.manage": "إضافة الموظفين وتعديل بياناتهم",
  "attendance.read": "الاطلاع على الحضور والإجازات",
  "attendance.manage": "تسجيل الحضور والإجازات وتعديلها",
  "payroll.manage": "إعداد الرواتب وحساب المستحقات",
  "payroll.approve": "اعتماد الرواتب قبل صرفها",
  "payroll.pay": "تسجيل صرف رواتب الموظفين",
  "fleet.read": "الاطلاع على الرحلات والوقود المتاحين لهذا الحساب",
  "fleet.manage": "إضافة المركبات وتنظيم الرحلات وتكاليفها",
  "fleet.service.manage": "تسجيل صيانة المركبات وخدماتها",
  "maintenance.read": "الاطلاع على الماكينات وسجلات الصيانة",
  "maintenance.manage": "إضافة الماكينات وتسجيل أعمال صيانتها"
}

export const PERMISSION_GROUPS: { title: string; permissions: Permission[] }[] = [
  {
    "title": "الحسابات وإدارة النظام",
    "permissions": [
      "users.read",
      "users.manage",
      "roles.read",
      "roles.manage",
      "settings.read",
      "settings.update",
      "approvals.decide",
      "reports.read",
      "audit.read",
      "notifications.read"
    ]
  },
  {
    "title": "استلام المواد ومتابعة المخزون",
    "permissions": [
      "warehouses.read",
      "warehouses.manage",
      "inventory.read",
      "inventory.transfer.create",
      "inventory.adjust",
      "inventory.ledger.read",
      "barcode.scan",
      "packaging.read",
      "packaging.manage",
      "spareparts.read",
      "spareparts.manage"
    ]
  },
  {
    "title": "شراء المواد والتعامل مع الموردين",
    "permissions": [
      "purchasing.read",
      "purchasing.request.create",
      "purchasing.request.approve",
      "purchasing.quotation.manage",
      "purchasing.po.create",
      "purchasing.po.approve",
      "purchasing.gr.create",
      "suppliers.communicate",
      "suppliers.approve"
    ]
  },
  {
    "title": "تحضير الخلطات وتنفيذ الإنتاج",
    "permissions": [
      "production.read",
      "production.create",
      "production.complete",
      "production.cost.approve",
      "production.cost.recalculate",
      "production.variance.thresholds",
      "recipes.custom",
      "scale.read",
      "scale.manage"
    ]
  },
  {
    "title": "فحص الجودة والسماح باستخدام الدفعات",
    "permissions": [
      "qc.read",
      "qc.manage",
      "qc.release",
      "qc.limits"
    ]
  },
  {
    "title": "بيع المنتجات وتحصيل قيمتها",
    "permissions": [
      "sales.read",
      "sales.create",
      "sales.confirm",
      "sales.payments.manage",
      "pricing.custom",
      "distribution.read",
      "distribution.manage",
      "delivery.track"
    ]
  },
  {
    "title": "الحسابات والمدفوعات والوثائق",
    "permissions": [
      "accounting.read",
      "accounting.manage",
      "tax.read",
      "tax.manage",
      "expenses.manage",
      "expenses.approve",
      "bank.read",
      "bank.manage",
      "obligations.read",
      "obligations.manage",
      "obligations.pay",
      "documents.read",
      "documents.manage",
      "utilities.read",
      "utilities.manage"
    ]
  },
  {
    "title": "الموظفون والحضور والرواتب",
    "permissions": [
      "employees.read",
      "employees.manage",
      "attendance.read",
      "attendance.manage",
      "payroll.manage",
      "payroll.approve",
      "payroll.pay"
    ]
  },
  {
    "title": "الرحلات وصيانة المصنع",
    "permissions": [
      "fleet.read",
      "fleet.manage",
      "fleet.service.manage",
      "maintenance.read",
      "maintenance.manage"
    ]
  }
]
