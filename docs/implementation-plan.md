# خطة تنفيذ نظام ERP لمصنع أعلاف (عُمان) — Custom (غير Odoo)

هذه الوثيقة تُحدد الخطة التنفيذية المختصرة والقرارات المعمارية الأساسية لبناء نظام ERP مخصص لمصنع أعلاف في سلطنة عمان، مع قابلية التتبع من **المشتريات → المواد الخام → المستودعات → التصنيع → المنتجات النهائية → المبيعات/السحوبات → المحاسبة → التقارير**.

> مبدأ حاكم: **منطق الأعمال وسلامة الحركات > جمال الواجهة**  
> مبدأ حاكم: **لا يوجد “تعديل مخزون” بدون حركة دفتر مخزون + Audit**

## 1) الهدف التشغيلي (Business Objective)

تمكين الإدارة من الإجابة على أسئلة التتبع التالية في أي وقت:

- مصدر المواد الخام (مورد/أمر شراء/استلام/دفعة/مستودع).
- الرصيد الحالي لكل مادة/دفعة/مستودع.
- ما الذي تم تحويله للتصنيع وما الذي تم استهلاكه فعلياً وما الهدر والانحراف.
- تكلفة الإنتاج (مواد + تكاليف إضافية قابلة للتهيئة) وقيمة المبيعات.
- أثر كل عملية على دفتر المخزون وقيود المحاسبة.
- من قام بالعملية ومتى ولماذا (Audit).

## 2) الاستراتيجية التنفيذية (Phased but demo-first)

### المرحلة A — الأساس (Foundation)
- Monorepo: `apps/web` (Next.js) + `apps/api` (NestJS) + `packages/database` (Prisma) + `packages/shared`.
- Postgres + Prisma migrations.
- Auth: JWT + Refresh Tokens + Password hashing + Rate limiting.
- RBAC: Roles/Permissions + Guards.
- Company Settings (لغة، RTL، العملة OMR، نسب الانحراف…).
- Audit Logs (عام ومركزي).

### المرحلة B — نواة المخزون (Inventory Core)
- مستودعات (3 ثابتة Seed) + مواقع داخل المستودع.
- مواد خام + فئات + دفعات + انتهاء صلاحية.
- دفتر مخزون (Inventory Ledger) + جدول أرصدة (Balance snapshot) يمنع السالب.
- مشتريات: Purchase Order + Goods Receipt.
- تحويلات: Stock Transfer.
- تعديل مخزون: Stock Adjustment (صلاحيات + سبب + Audit).

### المرحلة C — التصنيع (Manufacturing)
- منتجات نهائية + BOM/Recipe (وصفة + yield/قاعدة حساب).
- أمر إنتاج + طلب/صرف مواد + استهلاك فعلي + هدر + مخرجات.
- مقارنة Expected vs Actual + إلزام سبب إذا تجاوزت النسبة المسموح بها.
- إغلاق الإنتاج داخل Transaction واحدة.

### المرحلة D — المبيعات + المحاسبة (Sales & Accounting)
- فواتير مبيعات + تحصيلات + سحوبات.
- محرك ضريبي (قابل للتهيئة) لعُمان.
- قيود يومية تلقائية من كل عملية (استلام/بيع/استهلاك/إنتاج).

### المرحلة E — الباقي (HR/Reports/Tasks/Integrations)
- حضور/إضافي عبر مزودات (Providers) قابلة للتبديل.
- تقارير تشغيلية حقيقية مستخرجة من البيانات.
- مهام وإشعارات مع تجميع bulk.
- تكاملات (Fingerprint/Scale/Devices) عبر Adapters.

## 3) قرارات معمارية رئيسية

### 3.1 دفتر المخزون هو المصدر (Ledger-first)

لا يتم تعديل المخزون مباشرة. كل حركة تُسجل كـ `InventoryTransaction`، ومعها تحديث ذَرّي لجدول `InventoryBalance` داخل نفس المعاملة.

- **Ledger**: سجل دائم قابل للتدقيق.
- **Balance snapshot**: للقراءة السريعة ومنع السالب.

### 3.2 المعاملات الذرّية (Transactional Safety)

كل عمليات “تؤثر على المخزون/الحسابات” تنفّذ ضمن `BEGIN … COMMIT`، وبداخلها:

- Validations (صلاحيات + توافر مخزون + حالة المستند).
- Locks للأرصدة المطلوبة (منع التنافس).
- كتابة الحركات + تحديث الأرصدة.
- إنشاء قيود محاسبية.
- Audit Log.

### 3.3 التتبع عبر References

كل سجل تشغيلي يُنتج:
- Document number آمن تحت التوازي (Sequence).
- Reference type + reference id في دفتر المخزون.
- AuditLog مرتبط بالكيان + old/new.

### 3.4 التسعير/التكلفة (Costing)

الحد الأدنى: **Weighted Average Cost** لكل مادة/مستودع (وبشكل قابل للامتداد لاحقاً).

- عند الاستلام: تحديث متوسط التكلفة.
- عند الاستهلاك/البيع: استخدام تكلفة المتوسط الحالية.

### 3.5 محاسبة مرتبطة بالعمليات (Connected Accounting)

المحاسبة ليست CRUD منفصل. كل عملية تولد قيود:
- استلام مشتريات: Debit Inventory / Credit AP.
- بيع: Debit AR / Credit Revenue / Credit Tax Payable + قيد COGS/Inventory.
- استهلاك للإنتاج: Debit WIP / Credit Raw Inventory.
- إنتاج نهائي: Debit Finished Goods / Credit WIP.

## 4) وحدات الـ API (NestJS Modules)

```
auth/
rbac/
users/
settings/
audit/
suppliers/
materials/
warehouses/
inventory/
purchasing/
manufacturing/
products/
sales/
accounting/
tax/
reports/
notifications/
integrations/
```

## 5) واجهة المستخدم (Arabic-first ERP UX)

- `dir="rtl"` + مكونات shadcn/ui + Tables/Filters/Pagination.
- UX ERP: Sidebar + Topbar + Breadcrumbs + Status badges + Dialogs + Toasts.
- عدم بناء صفحات شكلية قبل جاهزية المسارات الأساسية (Demo workflow).

## 6) معيار القبول (Demo Workflow)

يجب أن يعمل التالي بعد التثبيت والـ seed:

1) إنشاء مورد  
2) إنشاء مواد خام  
3) إنشاء Purchase Order  
4) إنشاء Goods Receipt (يضيف للمستودع 1 + ledger + AP)  
5) إنشاء منتج نهائي  
6) إنشاء Recipe/BOM  
7) إنشاء Production Order (حساب Expected)  
8) تحويل مواد: Warehouse1 → Warehouse2  
9) إكمال الإنتاج (Actual consumption + Waste + variance + Output) داخل Transaction واحدة  
10) إضافة المنتج النهائي إلى Warehouse3  
11) إنشاء Sales Invoice وتأكيدها (تخفيض المخزون + AR/Revenue/Tax + COGS)  
12) فتح صفحة تتبع المنتج النهائي ورؤية السلسلة: Supplier → PO → GR → Txns → Production → Sale → Accounting.

