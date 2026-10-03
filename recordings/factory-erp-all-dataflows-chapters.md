# جولة تدفقات العمل — فصول الفيديو

المدة: 12:26. قاعدة التحقق PostgreSQL محلية ومعزولة؛ البيانات اصطناعية.

- **00:04** — لوحة المالك
  - لوحة المالك — /
- **00:51** — السيارات والنقل
  - المركبات — /fleet/vehicles
  - الوقود — /fleet/fuel
  - الرحلات — /fleet/trips
- **01:30** — الأقساط والالتزامات المالية
  - الالتزامات — /accounting/obligations
- **02:02** — البنك والحسابات
  - معاملات البنك — /accounting/financial-ops/bank-transactions
  - المصروفات — /accounting/expenses
  - سجل العمليات — /settings/audit
- **02:31** — المشتريات والموافقات
  - طلبات الشراء — /sales/parties/requests
  - أوامر الشراء — /sales/parties/orders
  - استلام البضاعة — /sales/parties/receipts
- **03:10** — قطع الغيار ومواد التعبئة
  - قطع الغيار — /inventory/extensions?kind=spare
  - مواد التعبئة — /inventory/extensions?kind=packaging
- **03:50** — التواصل مع الموردين
  - قوالب الرسائل — /sales/parties/templates
  - مراسلات الموردين — /sales/parties/communications
- **04:16** — التصنيع والميزان والهدر
  - أوامر التصنيع — /inventory/manufacturing/orders
  - الميزان — /inventory/manufacturing/scale
  - الهدر — /inventory/manufacturing/waste
  - تحليل الانحراف — /inventory/manufacturing/variance
- **04:54** — الخلطات وأوزان الأكياس
  - الوصفات — /inventory/manufacturing
  - مكونات الوصفة — /inventory/manufacturing/recipe-items
  - المنتجات — /inventory/products
- **05:28** — خلطات العملاء
  - خلطات العملاء — /inventory/manufacturing/customer-recipes
- **06:06** — نقاط التوزيع والمبيعات
  - نقاط التوزيع — /sales/distribution/points
  - الباركود — /inventory/warehouses/barcode
  - الإقفال اليومي — /sales/distribution/closing
- **06:42** — الفاتورة والتسليم والتحصيل
  - التسليم — /sales/delivery
  - التحصيل — /sales/collections
- **07:09** — الكهرباء والماء والغاز
  - المرافق — /accounting/financial-ops/utilities
- **07:35** — التصاريح والعقود والوثائق
  - الوثائق — /accounting/documents
- **08:05** — الموظفون والحضور والرواتب
  - ملفات الموظفين — /hr
  - الحضور والإجازات — /hr/attendance
  - الإضافي — /hr/overtime
  - الرواتب — /hr/payroll
- **08:37** — تحليل أسعار المواد الخام
  - أسعار الخام — /inventory/raw-materials/price-analysis
- **09:08** — الصيانة والماكينات
  - الماكينات — /inventory/manufacturing/maintenance/machines
  - جداول الصيانة — /inventory/manufacturing/maintenance/schedules
  - سجلات الأعطال — /inventory/manufacturing/maintenance/records
- **09:38** — اللغة والصلاحيات
  - المستخدمون — /settings/users
- **10:09** — تتبع الدفعات والربحية
  - دفعات الإنتاج — /inventory/manufacturing/lots
  - تتبع الدفعات — /inventory/manufacturing/lot-trace
  - الربحية — /sales/profitability
- **10:44** — التحليل الغذائي ومقارنة الجودة
  - عينات الجودة — /inventory/manufacturing/quality
  - جودة الموردين — /inventory/manufacturing/supplier-quality
- **11:38** — الختام وحدود الاتصال
  - لوحة المالك — /

## حدود التكامل المعروضة

البنك وWhatsApp والأجهزة المادية غير موصولة في هذه البيئة؛ يوضح الصوت ذلك صراحة. استخدمت الجولة حساب تحقق محلياً، ولم تُرسل رسائل إلى موردين أو تُنفذ عمليات خارجية. تمت الموافقة عبر الواجهة على أمر شراء اصطناعي واحد في قاعدة التحقق المحلية.
