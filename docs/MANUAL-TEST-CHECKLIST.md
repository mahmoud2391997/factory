# قائمة التحقق للاختبار اليدوي | Manual Test Checklist

> **الترتيب:** استخدم فرع Vercel/Neon معزولًا للاختبار فقط. لا تشغّل seed أو اختبارات الكتابة على قاعدة أعمال. اتبع الترتيب لأن كل مرحلة تعتمد على بيانات المرحلة السابقة. الأرقام أدناه مأخوذة من `apps/web/lib/erp/domain/flow-audit.test.ts` و`apps/web/lib/erp/domain/units.test.ts` و`apps/web/lib/erp/domain/engine.test.ts`، وبيانات الأدوار الرئيسية من `scripts/seed-test-data.mjs`.
>
> **Order:** Use an isolated Vercel/Neon test branch only. Never seed or run write tests against a business database. Follow the order because each phase depends on the previous phase. Numbers below match the cited flow/unit/engine tests and the role fixture in `scripts/seed-test-data.mjs`.

## 0. بيئة الاختبار والحسابات | Test environment and accounts

### [ ] 0.1 نشر التطبيق وتهيئة أول مدير | Deploy and bootstrap the first owner
- **العربية — الإجراء:** انشر من جذر المستودع، ثم افحص `/api/health`. على قاعدة فارغة، نفّذ `POST /api/setup/bootstrap` مرة واحدة باستخدام `x-setup-token` وJSON يحتوي `email` و`password` و`fullName`.
- **المتوقع:** قبل التهيئة تكون الصحة `degraded` و`bootstrapped=false` (HTTP 503). بعد التهيئة الناجحة تكون `status="ok"` و`bootstrapped=true` و`demoMode=false` (HTTP 200). يفرض الحساب تغيير كلمة المرور.
- **تحقق البيانات:** صف `ErpDocument` واحد بمعرّف `main` وإصدار موجب؛ لا تظهر تشخيصات قاعدة البيانات في استجابة الصحة.
- **English — Action:** Deploy from the repository root, check `/api/health`, then bootstrap exactly once on an empty database using `x-setup-token` and JSON `email`, `password`, and `fullName`.
- **Expected:** Before bootstrap, health is `degraded` with `bootstrapped=false` (HTTP 503). After success it is `status="ok"`, `bootstrapped=true`, `demoMode=false` (HTTP 200). The first owner must change the password.
- **Data check:** One `ErpDocument` row with id `main` and a positive version; health does not expose database diagnostics.

### [ ] 0.2 إنشاء بيانات اختبار الأدوار | Seed role-based test fixtures
- **العربية — الإجراء:** على قاعدة الاختبار المعزولة فقط، نفّذ الأمر الوارد في دليل Vercel مع `--confirm-test-db` و`SEED_TEST_PASSWORD` مؤقتة، ثم سجّل الدخول بحسابات الاختبار.
- **المتوقع:** يتحقق السكربت من `WH_RAW` و`WH_MFG` و`WH_FG`، ويضيف عند الحاجة موردين، عميلين، 4 مواد خام، منتجًا ووصفة، مركبة، ماكينة، نقطة توزيع، و6 مستخدمين: ACCOUNTANT وOPERATIONS وQUALITY وSTOREKEEPER وDRIVER وSALES. العملية قابلة لإعادة التشغيل دون تكرار السجلات.
- **تحقق البيانات:** تقرير السكربت يبيّن created/updated/skipped؛ كل مستخدم اختبار يبدأ بـ `mustChangePassword=true`. لا يُنشأ مخزون افتتاحي تلقائيًا.
- **English — Action:** On the isolated test database only, run the Vercel guide’s seed command with `--confirm-test-db` and a temporary `SEED_TEST_PASSWORD`, then sign in as the test users.
- **Expected:** The script verifies `WH_RAW`, `WH_MFG`, `WH_FG`; ensures 2 suppliers, 2 customers, 4 raw materials, 1 product and recipe, 1 vehicle, 1 machine, 1 distribution point, and 6 users (ACCOUNTANT, OPERATIONS, QUALITY, STOREKEEPER, DRIVER, SALES). Re-running does not duplicate fixtures.
- **Data check:** The script reports created/updated/skipped counts. Each test user has `mustChangePassword=true`; no opening stock is seeded.

## 1. البيانات الرئيسية | Master data

### [ ] 1.1 تحقق من الصنف والباركود والوصفة | Verify item, barcode, and recipe master data
- **العربية — الإجراء:** افتح المواد الخام والمنتجات والوصفات، وابحث عن `SEED-RM-01` و`SEED-FG-01`، ثم امسح باركود مادة موجودة.
- **المتوقع:** يظهر المنتج بوحدة/وزن الكيس 50 كجم، والسعر 0.25 ر.ع. لكل وحدة كما أنشأه seed؛ تؤدي الوصفة الاختبارية إلى 1,000 كجم ناتج أساسي من أربع مواد، 250 كجم لكل مادة.
- **تحقق البيانات:** المسح يعيد الصنف الصحيح ويضيف سجل تدقيق؛ كمية المخزون تبقى صفرًا قبل الاستلام.
- **English — Action:** Open materials, products, and recipes; find `SEED-RM-01` and `SEED-FG-01`, then scan a material barcode.
- **Expected:** The seed product shows 50 kg bag weight and OMR 0.25 per unit; the test recipe has 1,000 kg base output from four 250 kg material lines.
- **Data check:** The scan resolves the item and creates an audit entry; stock stays at zero before receipt.

### [ ] 1.2 تحقق من المورد والعميل والموظفين والأصول | Verify suppliers, customers, people, and assets
- **العربية — الإجراء:** راجع الموردين والعملاء والموظفين والمركبات والماكينات ونقاط التوزيع التي أنشأها seed، وأضف سجلًا رئيسيًا واحدًا من كل نوع عند الحاجة.
- **المتوقع:** لا تتكرر الأكواد أو الأسماء الفريدة؛ تظهر مواقع المخزون الثلاثة والمركبة/الماكينة/نقطة التوزيع الاختبارية.
- **تحقق البيانات:** الأعداد الأولية في seed هي موردان وعميلان و4 مواد ومنتج واحد ووصفة واحدة ومركبة واحدة وماكينة واحدة ونقطة توزيع واحدة.
- **English — Action:** Review seeded suppliers, customers, employees, vehicles, machines, and distribution points; add one record of each type if needed.
- **Expected:** Unique codes/names cannot be duplicated; all three stock locations and the seeded vehicle, machine, and distribution point are visible.
- **Data check:** Seed baseline is 2 suppliers, 2 customers, 4 materials, 1 product, 1 recipe, 1 vehicle, 1 machine, and 1 distribution point.

## 2. الشراء والاستلام والمخزون | Purchasing, receiving, and stock

### [ ] 2.1 طلب شراء وعرض سعر واستلام | Purchase request, quotation, and goods receipt
- **العربية — الإجراء:** نفّذ سلسلة الشراء في Flow Chain 1: 5,000 كجم ذرة بسعر 0.11 ر.ع./كجم، ثم اعتمد الأمر واستلم الدفعة `CORN-B2026-01`.
- **المتوقع:** استلام 5,000 كجم إلى `WH_RAW` بتكلفة وحدة 0.11 ر.ع.؛ قيمة المخزون/المورد الدائن 550 ر.ع.
- **تحقق البيانات:** دفتر المخزون يسجل 0 ← 5,000؛ قيد الاستلام مدين 550 في 1100 ودائن 550 في 2100؛ ميزان المراجعة متوازن (إجمالي المدين = إجمالي الدائن = 550).
- **English — Action:** Run Flow Chain 1: purchase and receive 5,000 kg of corn at OMR 0.11/kg into batch `CORN-B2026-01`.
- **Expected:** `WH_RAW` receives 5,000 kg at unit cost OMR 0.11; inventory and supplier payable are OMR 550.
- **Data check:** Inventory ledger moves 0 → 5,000; receipt journal debits 550 to 1100 and credits 550 to 2100; trial balance is OMR 550 debit and credit.

### [ ] 2.2 التحويل والتسوية والمسح | Transfer, adjustment, and barcode scan
- **العربية — الإجراء:** استلم 2,000 كجم صويا بسعر 0.20 ر.ع.، وحوّل 1,500 كجم من `WH_RAW` إلى `WH_MFG`، ثم سجّل تسوية معتمدة قدرها -20 كجم.
- **المتوقع:** رصيد `WH_RAW` = 480 كجم، و`WH_MFG` = 1,500 كجم؛ تبقى الدفعة `SOY-LOT-01` قابلة للتتبع.
- **تحقق البيانات:** سجل التحويل يحتوي 1,500 كجم؛ سجل الاستلام 2,000 كجم؛ سجل التسوية -20 كجم؛ مسح `RM-SOY` ينجح. جرّب طلب صرف/تحويل يتجاوز المتاح ويجب رفضه دون رصيد سالب.
- **English — Action:** Receive 2,000 kg of soy at OMR 0.20/kg, transfer 1,500 kg from `WH_RAW` to `WH_MFG`, then approve a -20 kg adjustment.
- **Expected:** `WH_RAW` = 480 kg; `WH_MFG` = 1,500 kg; batch `SOY-LOT-01` remains traceable.
- **Data check:** Transfer line = 1,500 kg; receipt = 2,000 kg; adjustment = -20 kg; scan `RM-SOY` succeeds. Attempt an issue/transfer above available stock and confirm rejection with no negative balance.

## 3. الإنتاج والجودة | Production and quality

### [ ] 3.1 أمر الإنتاج والميزان والانحراف والتكلفة | Production order, scale, variance, and cost
- **العربية — الإجراء:** أنشئ أمرًا لإنتاج 2,000 كجم من وصفة الشعير؛ أرسل قراءة الميزان `scale-evt-101` بقيمة 2,010 كجم مرتين، أكمل الإنتاج عند 2,000 كجم، ثم اعتمد بند الغاز 25 ر.ع.
- **المتوقع:** يُسجّل الحدث مرة واحدة فقط؛ الإدخال 2,010 كجم، الناتج المتوقع 2,010 كجم، الناتج الفعلي 2,000 كجم، الانحراف -10 كجم / -0.5%. التكلفة بعد اعتماد الغاز = 185.8 ر.ع.، والتكلفة للطن = 92.9 ر.ع./طن.
- **تحقق البيانات:** يبقى 7,990 كجم شعير في `WH_MFG` ويضاف 2,000 كجم منتج إلى `WH_FG`؛ قيد الإنتاج متوازن. استهلاك 40 كيسًا من أصل 100 كيس (50 كجم/كيس، 0.20 ر.ع./كيس) يخفض المخزون إلى 60 وتكلفته 8 ر.ع. دون انحراف.
- **English — Action:** Create a 2,000 kg barley production order; submit scale event `scale-evt-101` at 2,010 kg twice; complete 2,000 kg output and approve the OMR 25 gas line.
- **Expected:** The event is recorded once; input = 2,010 kg, expected output = 2,010 kg, actual output = 2,000 kg, variance = -10 kg / -0.5%. Approved total cost = OMR 185.8; cost per ton = OMR 92.9.
- **Data check:** `WH_MFG` retains 7,990 kg barley and `WH_FG` gains 2,000 kg; production journals balance. Consume 40 bags from 100 (50 kg/bag, OMR 0.20/bag): stock becomes 60, cost is OMR 8, variance zero.

### [ ] 3.2 حجز الخام والاستدعاء | Raw quarantine and finished-lot recall
- **العربية — الإجراء:** سجّل عينة خام فاشلة للدفعة `PREMIX-FAIL`، وحاول تحويلها؛ بعد ذلك اختبر عينة منتج، بع 50 كجم من دفعة 100 كجم، واستدعِ الدفعة ثم حاول بيع 10 كجم إضافية.
- **المتوقع:** يمنع الحجز تحويل الخام؛ ويمنع الاستدعاء تأكيد الفاتورة الجديدة. لا يُحذف أو يُخصم المتبقي عند فشل التأكيد.
- **تحقق البيانات:** بعد بيع 50 كجم من المنتج تبقى 50 كجم في `WH_FG`؛ حالة الحجز `RECALLED` وسجل التتبع يربط الدفعة بالفاتورة/العميل.
- **English — Action:** Record a failed raw-material sample for `PREMIX-FAIL` and attempt a transfer; then test a product lot, sell 50 kg of a 100 kg lot, recall it, and attempt another 10 kg sale.
- **Expected:** Quarantine blocks raw-material transfer; recall blocks confirmation of the new invoice. The failed confirmation does not issue or mutate remaining stock.
- **Data check:** 50 kg remains in `WH_FG`; the hold is `RECALLED` and traceability links the lot to the invoice/customer.

## 4. المبيعات والتسليم والتحصيل | Sales, delivery, and payment

### [ ] 4.1 الفاتورة والتسليم والتحصيل | Invoice, delivery, and collection
- **العربية — الإجراء:** أنشئ فاتورة 400 كجم بسعر 0.50 ر.ع./كجم، أكّدها، مرّر التسليم عبر ACCOUNTANT → LOADER → DRIVER → CUSTOMER، ثم سجّل تحصيل 200 ر.ع. واسحب 50 كجم للاستخدام الداخلي.
- **المتوقع:** صافي الفاتورة 200 ر.ع. وضريبة القيمة المضافة صفر على الصنف ZERO؛ التحصيل يغلق الذمم بقيمة 200 ر.ع.؛ الربح الإجمالي 400 ر.ع./طن (سعر 500 ناقص تكلفة 100).
- **تحقق البيانات:** المخزون بعد الإنتاج 1,000 كجم، بعد البيع 600 كجم، وبعد السحب 550 كجم. القيود متوازنة؛ التسليم يصل إلى CUSTOMER مع إثبات الاستلام عند إدخاله.
- **English — Action:** Create and confirm a 400 kg invoice at OMR 0.50/kg; advance delivery through ACCOUNTANT → LOADER → DRIVER → CUSTOMER; collect OMR 200 and withdraw 50 kg for internal use.
- **Expected:** Net invoice = OMR 200; VAT = zero for the ZERO-rated item; OMR 200 collection clears receivables. Gross margin = OMR 400/ton (OMR 500 selling price less OMR 100 cost).
- **Data check:** Stock is 1,000 kg after production, 600 kg after sale, 550 kg after withdrawal. Journals balance; delivery reaches CUSTOMER and stores proof when entered.

## 5. الأسطول والصيانة والمالية | Fleet, maintenance, and finance

### [ ] 5.1 الوقود والرحلة وتخصيص التكلفة | Fuel, trip, and cost allocation
- **العربية — الإجراء:** سجّل 50 لترًا بتكلفة 12 ر.ع.، ثم أنشئ رحلة 60 كم وحمولة 1,000 كجم واستهلاك 15 لترًا وتكلفة سائق 30 ر.ع. اطلب تخصيص التكلفة واعتمده بالمحاسب.
- **المتوقع:** تكلفة الوقود للرحلة 3.6 ر.ع.، والتكلفة الكلية 33.6 ر.ع.؛ الطلب ينتقل `PENDING_APPROVAL` → `APPROVED` ويضيف بند نقل 33.6 ر.ع. للدفعة.
- **تحقق البيانات:** التكلفة للطن بعد التخصيص = 116.8 ر.ع./طن؛ القيود متوازنة.
- **English — Action:** Log 50 L for OMR 12; create a 60 km, 1,000 kg trip using 15 L and OMR 30 driver cost; request and approve its allocation as accountant.
- **Expected:** Trip fuel cost = OMR 3.6; total trip cost = OMR 33.6; allocation changes from `PENDING_APPROVAL` to `APPROVED` and adds OMR 33.6 transport cost to the lot.
- **Data check:** Lot cost becomes OMR 116.8/ton; journals balance.

### [ ] 5.2 الصيانة وقطع الغيار | Maintenance and spare parts
- **العربية — الإجراء:** أنشئ ماكينة وقطعة غيار برصيد 10 وحدات وتكلفة 5 ر.ع. للوحدة؛ سجّل صيانة مجدولة بتكلفة عمل 25 ر.ع. واستهلاك وحدتين، ثم سجّل صرف وحدة ثالثة بسبب منفصل.
- **المتوقع:** تكلفة الصيانة الكلية 35 ر.ع. (25 + 2×5)، ووقت التوقف 30 دقيقة، وساعات التشغيل المبلّغ عنها ساعتان. رصيد القطع 8 بعد الصيانة ثم 7 بعد الصرف المنفصل.
- **تحقق البيانات:** سجل الصيانة يرتبط بالماكينة والجدول؛ سجل صرف القطعة يبين 5 ر.ع.؛ التدقيق يسجل العمليتين.
- **English — Action:** Create a machine and a spare part with 10 units at OMR 5 each; record scheduled maintenance with OMR 25 labor cost and two parts, then issue one more part separately.
- **Expected:** Maintenance total = OMR 35 (25 + 2×5), downtime = 30 minutes, reported runtime = 2 hours. Spare balance is 8 after maintenance and 7 after the separate issue.
- **Data check:** Maintenance links to the machine/schedule; spare issue cost is OMR 5; both actions are audited.

### [ ] 5.3 التزام وقسط ومصروف وتسوية بنكية ومرافق | Obligation, installment, expense, bank match, utilities
- **العربية — الإجراء:** أنشئ التزامًا 12,000 ر.ع. على 12 قسطًا شهريًا بقيمة 1,000؛ ادفع الأول. رحّل مصروفًا 150 ر.ع. وطابق حركة بنك 150 ر.ع.؛ سجّل كهرباء من 100 إلى 145 بتكلفة 24 ر.ع. لإنتاج 10 أطنان.
- **المتوقع:** القسط الأول مدفوع 1,000؛ المصروف `POSTED` وحركة البنك `MATCHED`؛ استهلاك الكهرباء 45 وحدة وتكلفتها 2.4 ر.ع./طن.
- **تحقق البيانات:** قيد المصروف 150 ر.ع. متوازن؛ سطر جدول القسط يظهر paidAmount=1,000؛ قراءة المرافق تحفظ 45 و2.4.
- **English — Action:** Create a OMR 12,000 obligation in 12 monthly OMR 1,000 installments and pay the first. Post an OMR 150 expense, match an OMR 150 bank debit, and record electricity from 100 to 145 costing OMR 24 for 10 tons.
- **Expected:** First installment paid = OMR 1,000; expense is `POSTED`, bank transaction is `MATCHED`; consumption = 45 units and cost = OMR 2.4/ton.
- **Data check:** OMR 150 expense journal balances; installment `paidAmount=1,000`; utilities record stores 45 and 2.4.

## 6. الموظفون والمستندات | People and documents

### [ ] 6.1 الحضور والإجازة والرواتب | Attendance, leave, and payroll
- **العربية — الإجراء:** سجّل حضورًا من 08:00 إلى 17:00، واطلب إجازة سنوية يومين واعتمدها، ثم أنشئ مسير أكتوبر براتب أساسي 600 ر.ع. و5 ساعات إضافية وبدلات 50 ر.ع. واعتمده وادفعه.
- **المتوقع:** المسير ينتقل `PENDING_APPROVAL` → `APPROVED` → `PAID`؛ الإضافي 15.625 ر.ع. وصافي الراتب 665.625 ر.ع. (قبل أي خصومات).
- **تحقق البيانات:** سجل الحضور يحفظ وقت الانصراف 17:00؛ الإجازة يومان `APPROVED`؛ قيد الرواتب متوازن ويخفض رصيد البنك عند الدفع.
- **English — Action:** Record attendance 08:00–17:00, request and approve two annual-leave days, then create October payroll for OMR 600 base salary, 5 overtime hours, and OMR 50 allowances; approve and pay.
- **Expected:** Payroll moves `PENDING_APPROVAL` → `APPROVED` → `PAID`; overtime = OMR 15.625; net pay = OMR 665.625 before deductions.
- **Data check:** Attendance stores 17:00 checkout; leave is two days and `APPROVED`; payroll journal balances and payment reduces bank balance.

### [ ] 6.2 المستندات والمرفقات والتجديد | Documents, attachments, and renewal
- **العربية — الإجراء:** أنشئ مستند ترخيص بتاريخ انتهاء، أرفق PDF أو JPEG أو PNG ضمن الحدود المسموحة، ثم سجّل التجديد واربط المسؤول.
- **المتوقع:** يظهر تنبيه الاستحقاق للمستند المنتهي قريبًا؛ التجديد يحفظ تاريخًا وسجل تجديد جديدًا دون فقدان المرفقات السابقة.
- **تحقق البيانات:** سجل المستند يحتوي نوعه وتاريخ الصلاحية والمسؤول وسجل التجديد؛ الملف يبقى مرتبطًا بالسجل في التخزين الدائم المتاح.
- **English — Action:** Create a license document with an expiry date, attach a permitted PDF/JPEG/PNG within limits, then record a renewal and assign an owner.
- **Expected:** An approaching-expiry alert appears; renewal adds a new renewal-history entry without losing previous attachments.
- **Data check:** The document stores kind, expiry, owner, and renewal history; the file remains linked in the available persistent storage.

## 7. لوحة المالك والصلاحيات والتصدير | Owner dashboard, roles, and exports

### [ ] 7.1 لوحة المالك | Owner dashboard
- **العربية — الإجراء:** سجّل دخول GM بعد إدخال بيانات التدفقات، وافتح لوحة المالك ومؤشرات المخزون والإنتاج والذمم والتنبيهات.
- **المتوقع:** تظهر الأرقام من حالة ERP نفسها، لا بيانات mock؛ يعكس المتبقي 550 كجم في اختبار البيع/السحب، والمواد الخام منخفضة المخزون بحسب الحد الأدنى، والدفعة المستدعاة ضمن تنبيهات الجودة.
- **تحقق البيانات:** طابق قيمة كل مؤشر مع حالة `/api/erp` وتقرير ميزان المراجعة وسجل المخزون؛ لا تظهر بيانات رواتب/تكاليف للمستخدم غير المخول.
- **English — Action:** Sign in as GM after entering the flow data and open the owner dashboard for stock, production, receivables, and alerts.
- **Expected:** KPIs come from the ERP document, not mock data; the sales/withdrawal flow has 550 kg remaining, low-stock materials reflect minimums, and the recalled lot appears in QC alerts.
- **Data check:** Reconcile each KPI with `/api/erp`, trial balance, and inventory ledger; salary/cost data is hidden from unauthorized users.

### [ ] 7.2 اختبار الأدوار والحدود الأمنية | Role and security checks
- **العربية — الإجراء:** اختبر حسابات ACCOUNTANT وOPERATIONS وQUALITY وSTOREKEEPER وDRIVER وSALES، ثم أدخل كلمة مرور خاطئة خمس مرات لحساب اختبار.
- **المتوقع:** لا يستطيع DRIVER قراءة سجلات يوميات المحاسبة أو خدمات المركبات؛ لا يستطيع OPERATIONS تعديل المحاسبة؛ لا يستطيع ACCOUNTANT تعديل المخزون دون صلاحية. بعد خمس محاولات فاشلة يقفل الدخول مؤقتًا (60 ثانية حسب الاختبار).
- **تحقق البيانات:** الأوامر المرفوضة عبر `applyCommand` لا تغيّر الحالة؛ التصدير يحجب الأعمدة المالية وفق الصلاحية. استخدم حساب اختبار فقط لسيناريو كلمة المرور الخاطئة.
- **English — Action:** Test ACCOUNTANT, OPERATIONS, QUALITY, STOREKEEPER, DRIVER, and SALES; then enter a wrong password five times for a test account.
- **Expected:** DRIVER cannot read journals or vehicle services; OPERATIONS cannot edit accounting; ACCOUNTANT cannot adjust stock without permission. Five failed logins trigger a temporary 60-second lock per the auth test.
- **Data check:** Denied `applyCommand` calls do not mutate state; exports redact financial columns by permission. Use a test account for wrong-password scenarios.

### [ ] 7.3 التصدير والطباعة والنسخة الاحتياطية | Exports, printing, backup
- **العربية — الإجراء:** صدّر يوميات CSV وExcel، اطبع فاتورة/أمر شراء/ملصق دفعة، ثم نزّل نسخة backup JSON بحساب مخول.
- **المتوقع:** الملفات قابلة للفتح ونصوص CSV/Excel آمنة للـ Excel؛ صفحات الطباعة تعرض الأرقام واللغة الصحيحة؛ JSON صالح.
- **تحقق البيانات:** إجمالي القيد يطابق ميزان المراجعة؛ التقرير لا يكشف التكلفة أو الرواتب لغير المخولين؛ النسخة الاحتياطية قابلة للتحليل دون تغيير حالة النظام.
- **English — Action:** Export journals as CSV and Excel, print an invoice/purchase order/lot label, then download the JSON backup as an authorized user.
- **Expected:** Exports open correctly and protect spreadsheet formula cells; print pages show the right figures/language; backup is valid JSON.
- **Data check:** Journal totals match trial balance; cost/payroll columns are not exposed to unauthorized users; backup inspection does not mutate live state.

## 8. اختبارات سلبية وتزامن | Negative tests and concurrency

### [ ] 8.1 رفع ملف غير مسموح | Reject a disallowed upload
- **العربية — الإجراء:** حاول إرفاق ملف مثل `.exe` إلى مستند أو عينة جودة، ثم جرّب ملفًا مسموحًا أكبر من حد التطبيق 10 MB على بيئة اختبار.
- **المتوقع:** يرفض التطبيق النوع غير المسموح والحجم الزائد؛ تذكّر أن Vercel يحد جسم الطلب عادةً إلى 4.5 MB، وهو أقل من حد التطبيق.
- **تحقق البيانات:** لا يُنشأ مرفق يتيم ولا تتغير بيانات المستند عند الرفض.
- **English — Action:** Try attaching an `.exe` to a document/QC sample, then an allowed file larger than the app’s 10 MB limit on test only.
- **Expected:** Unsupported type and oversized files are rejected. Vercel’s typical request-body ceiling is 4.5 MB, below the application limit.
- **Data check:** Rejection creates no orphan attachment and does not alter the document.

### [ ] 8.2 تعارض تعديل من جلستين | Two-session revision conflict
- **العربية — الإجراء:** افتح جلستين/متصفحين على الحالة نفسها. عدّل المستند في الأولى، ثم احفظ من الثانية اعتمادًا على الإصدار القديم.
- **المتوقع:** تعيد المحاولة الآمنة تحميل الحالة الأحدث أو تظهر رسالة قابلة لإعادة المحاولة: «تعارض في حفظ البيانات. أعد المحاولة.» لا يُسمح بالكتابة الصامتة فوق تعديل الجلسة الأولى.
- **تحقق البيانات:** يزداد revision مرة واحدة لكل حفظ مقبول؛ يظل السجلان الصحيحان محفوظين دون تكرار.
- **English — Action:** Open two sessions on the same state. Save an edit in session one, then submit session two using its stale revision.
- **Expected:** The safe retry reloads current state or displays the retryable message “تعارض في حفظ البيانات. أعد المحاولة.” The second edit must not silently overwrite the first.
- **Data check:** Revision increments once per accepted save; both valid records remain without duplication.

### [ ] 8.3 رفض المخزون السالب | Reject negative stock
- **العربية — الإجراء:** اطلب تحويلًا أو تسوية صرفًا أكبر من الكمية المتاحة.
- **المتوقع:** يرفض الاعتماد برسالة خطأ واضحة.
- **تحقق البيانات:** الكمية في المستودع وسجل المخزون لا يصبحان سالبين، ولا يسجل قيد/حركة صرف ناجحة.
- **English — Action:** Request a transfer or negative adjustment above available stock.
- **Expected:** Approval is rejected with a clear validation error.
- **Data check:** Warehouse quantity and ledger never become negative; no successful issue movement/journal is recorded.

## ملاحظات إكمال المرحلة الثانية | Phase 2 completion addendum

أضف هنا حالات الاختبار النهائية بعد تنفيذ Phase 2: اختيار الصفوف وإلغاء/تحديد الكل مع البحث والترقيم، عمليات bulk المصرح بها والفشل الجزئي، تبديل EN/AR/HI مع استمرار `lang` و`dir`، صفحات Inventory الـ12، والتنقل الداخلي على عروض 360/768/1280px. لا تعتبر هذه الحالات مكتملة قبل تنفيذها واختبارها.

Append the final test cases here after Phase 2 implementation: row selection and select/deselect-all under search/pagination, authorized bulk actions and partial failure, EN/AR/HI persistence for `lang`/`dir`, all 12 Inventory sections, and inner navigation at 360/768/1280px. Do not mark these as complete before implementation and verification.


## 9. الإشعارات وحالة القراءة لكل مستخدم | Notifications and per-user read state

### [ ] 9.1 تحقق من المستلمين | Verify notification recipients
- **العربية — المستلمون:**
  - **GM:** إشعارات اعتماد أوامر الشراء والتسويات والمصروفات والرواتب والإجازات وجرد مواد التعبئة؛ إضافةً إلى التنبيهات المشتركة أدناه.
  - **OPERATIONS:** طلبات الشراء المعتمدة، انخفاض مخزون المواد الخام/قطع الغيار/التعبئة، قرب انتهاء دفعات المخزون، تنبيهات الجودة التشغيلية، فروقات استهلاك الوقود، وأوراق/صيانة المركبات والماكينات.
  - **ACCOUNTANT:** توزيع تكلفة الرحلات بانتظار الاعتماد، الالتزامات المالية والأقساط المستحقة/المتأخرة، وانتهاء أو قرب انتهاء مستندات الشركة والموظفين.
  - **QUALITY:** نتائج عينات الجودة المرفوضة أو المعلّقة، وتنبيهات خرق مواصفات المنتج.
  - **DRIVER:** لا يستقبل إشعارات ERP ولا يظهر له زر الجرس؛ صلاحيات السائق لا تتضمن `notifications.read`. الأدوار الأخرى لا تستقبل إشعارات ما لم تُضَف صراحةً إلى مستلمي التنبيه.
- **English — recipients:**
  - **GM:** approval alerts for purchase orders, inventory adjustments, expenses, payroll, leave, and packaging counts, plus the shared alerts below.
  - **OPERATIONS:** approved purchase requests; low raw-material/spare-part/packaging stock; expiring inventory batches; operational quality alerts; abnormal fuel use; and vehicle/machine document or maintenance alerts.
  - **ACCOUNTANT:** trip-cost allocations awaiting approval; financial obligations and due/overdue installments; and company/employee document-expiry alerts.
  - **QUALITY:** failed or held quality samples and product-specification violations.
  - **DRIVER:** receives no ERP notifications and has no bell; the default driver role does not include `notifications.read`. Other roles receive none unless explicitly named as recipients.
- **تحقق:** استخدم حسابات اختبار معزولة؛ تحقق من أن كل مستخدم يرى التنبيهات التي يشملها دوره فقط. لا تستخدم قاعدة بيانات أعمال.
- **Check:** use isolated test accounts and confirm each role sees only its addressed notifications. Never use a business database.

### [ ] 9.2 القراءة المستقلة والاستمرار بعد التحديث | Independent reads and persistence
- **العربية — الإجراء:** بحساب GM، افتح الجرس واختر تنبيهًا مشتركًا مع OPERATIONS. سجّل عدد غير المقروء، ثم فعّل «تمت القراءة» بالنقر وباستخدام لوحة المفاتيح (Tab ثم Enter).
- **المتوقع:** يُعطّل الزر أثناء الطلب؛ ينخفض العداد فورًا؛ يبقى الجرس مفتوحًا ويبقى التنبيه ظاهرًا بوصفه مقروءًا؛ تظهر رسالة نجاح/خطأ مرتبطة بالتنبيه، واسم الزر الميسر يتضمن عنوانه. حدّث الصفحة: يظل التنبيه مقروءًا للمستخدم نفسه.
- **تحقق:** سجّل الخروج، ثم ادخل بحساب OPERATIONS مختلف الدور. يجب أن يبقى التنبيه المشترك غير مقروء لهذا المستخدم، مع عداد مستقل. علّمه كمقروء ثم حدّث الصفحة للتأكد من استمرارية قراءته دون تغيير حالة المستخدم الأول.
- **توافق المستندات القديمة:** يبقى `read: true` القديم مقروءًا للجميع؛ أما التنبيهات الجديدة فتسجل القراءة لكل مستخدم، ولا تكفي قراءة مستخدم لإخفاء التنبيه عن مستلم آخر.
- **English — Action:** Sign in as GM, open the bell, choose an alert shared with OPERATIONS, record the unread count, then activate “Mark as read” by pointer and keyboard (Tab, then Enter).
- **Expected:** The action is disabled while pending; the badge decreases immediately; the bell stays open and the item remains visible as read; feedback is shown for that item and its accessible button name includes the title. Reload: the item remains read for this user.
- **Data check:** Sign out and sign in as a different-role OPERATIONS user. The same shared alert must still be unread for that user with an independent count. Mark it read, reload, and verify that state persists without changing the first user’s state.
- **Legacy compatibility:** A legacy global `read: true` remains read for everyone. New reads are per-user; one recipient’s read must not hide the alert from another recipient.

### [ ] 9.3 انتهاء الجلسة والرفض الآمن | Expired session and safe denial
- **العربية — الإجراء:** في متصفح/بيانات اختبار فقط، أبطل جلسة المستخدم أثناء ظهور تنبيه غير مقروء ثم حاول تعليمه كمقروء؛ جرّب أيضًا طلب POST غير مصرح به وطلب DRIVER محظورًا.
- **المتوقع:** تظهر رسالة مفهومة، ويُعاد تمكين الزر بعد انتهاء الطلب؛ لا يظهر رفض غير معالج ولا HTML داخل استجابة API. لا يُعاد التوجيه إلى الدخول إلا بعد تأكد `/api/auth/me` أن الجلسة منتهية. يعيد POST غير المصرح/الممنوع JSON بحالة فشل ولا يغيّر القراءة.
- **تحقق:** سجّل DRIVER: لا يظهر الجرس ولا أي تنبيه. محاولة POST مباشرةً إلى `markNotificationRead` تُرفض برسالة JSON، ويظل التنبيه غير مقروء لمستلميه.
- **English — Action:** In a test browser/data set only, invalidate the session while an unread alert is displayed and try to mark it read; also try an unauthenticated POST and a forbidden DRIVER POST.
- **Expected:** A clear error appears and the button becomes available again after the request. There is no unhandled rejection or HTML API response. Redirect to login occurs only after `/api/auth/me` confirms the session is gone. Unauthorized/forbidden POSTs return JSON failure and do not mutate read state.
- **Data check:** Sign in as DRIVER: no bell or notification is shown. A direct `markNotificationRead` POST is denied as JSON, and the recipients’ alert remains unread.

### [ ] 9.4 اللغة وإمكانية الوصول | Locale and accessibility
- **العربية — الإجراء:** كرر فتح الجرس وتعليم تنبيه كمقروء في AR وEN وHI؛ استخدم لوحة المفاتيح وتحقق من قارئ الشاشة/الاسم الميسر.
- **المتوقع:** يتغير اتجاه الصفحة إلى RTL في AR وLTR في EN/HI؛ تظهر تسميات ورسائل الإجراء باللغة المختارة؛ لا يُقص عنوان التنبيه ولا رسالة النتيجة.
- **English — Action:** Repeat opening the bell and marking an alert as read in AR, EN, and HI; exercise keyboard navigation and inspect the accessible name/status.
- **Expected:** AR uses RTL; EN/HI use LTR; action labels and feedback follow the selected locale; notification titles and results are not clipped.
