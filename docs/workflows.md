# التدفقات الأساسية (Workflows) — معاملات ذرّية + تتبع كامل

هذه الوثيقة تصف التدفقات التشغيلية “التي تجعل النظام ERP فعلياً” وليس CRUD.

## 1) استلام بضاعة (Goods Receipt) من Purchase Order

### المدخلات
- `purchaseOrderId`
- عناصر مستلمة: `materialId`, `qtyReceived`, `unitCost`, `batchNo?`, `expiryDate?`, `warehouseLocationId?`

### قواعد
- لا يمكن الاستلام إلا من PO بحالة `APPROVED/ORDERED/PARTIALLY_RECEIVED`.
- لا يمكن أن يتجاوز مجموع المستلم كمية الـ PO (إلا بإذن إعدادات/صلاحية خاصة).

### Transaction (ذَرّية)

1) تحميل PO + items + supplier.
2) Validation للحالة والكميات.
3) إنشاء `GoodsReceipt` + `GoodsReceiptItem`.
4) لكل عنصر:
   - إنشاء/جلب `MaterialBatch` (إن لزم).
   - قفل `InventoryBalance` للمفتاح (material+warehouse+batch).
   - حساب المتوسط المرجّح وتحديث `InventoryBalance`.
   - إنشاء `InventoryTransaction` نوع `PURCHASE_RECEIPT` مع `previousBalanceQty/newBalanceQty`.
5) إنشاء `JournalEntry`:
   - Debit: Inventory (raw materials)
   - Credit: Accounts Payable (supplier)
6) تحديث PO status: `PARTIALLY_RECEIVED` أو `RECEIVED`.
7) إنشاء `AuditLog` + `Notification` (واحد فقط).

## 2) تحويل مخزون بين مستودعين (Stock Transfer)

### المدخلات
- `sourceWarehouseId`, `destWarehouseId`
- items: `materialId/productId`, `batchId?`, `qty`

### Transaction
1) Validation (صلاحيات، منع نقل داخل نفس المستودع، الكميات > 0).
2) لكل item:
   - قفل `InventoryBalance` في المصدر.
   - التأكد من عدم السالب.
   - طرح من المصدر + إضافة للوجهة (قفل رصيد الوجهة أيضاً).
   - إنشاء حركتين ledger (OUT/IN) أو حركة واحدة تحمل المصدر/الوجهة (حسب التصميم).
3) `AuditLog`.

## 3) إنشاء أمر إنتاج (Production Order) وحساب المتوقع

### المدخلات
- `productId`, `recipeId`, `plannedQty`, `operatorId?`, `machine?`, `productionDate?`

### قواعد
- `recipe.baseOutputQty > 0`
- كل `RecipeItem.qty > 0`

### الناتج
- حساب `expectedQty` لكل مادة داخل `ProductionMaterial`:
  - `expectedQty = plannedQty * (recipeItem.qty / recipe.baseOutputQty)`

## 4) إكمال الإنتاج (Production Completion) — الأهم

### المدخلات
- `productionOrderId`
- `actualConsumption[]`: per material `actualQty`
- `waste[]`: (اختياري) per material أو عام
- `actualOutputQty`
- `varianceReasons[]` (مطلوبة عند تجاوز العتبة)

### قواعد
- لا يمكن الإكمال إلا إذا الحالة تسمح (`IN_PRODUCTION` مثلاً).
- يجب أن تتوفر المواد في `WH_MFG` (مستودع التصنيع)، لأن المواد لا “تختفي” من WH_RAW.
- إلزام سبب إذا \( |diffPct| > settings.productionVarianceThresholdPct \).

### Transaction (ذَرّية)
1) Load `ProductionOrder` + `Recipe` + expected materials.
2) Validation الحالة.
3) Lock لكل `InventoryBalance` لمواد WH_MFG المطلوبة.
4) لكل مادة:
   - حساب الانحراف `diff = actual - expected` + `diffPct`.
   - التأكد من توفر المخزون على الأقل `actualQty` (منع السالب).
   - خصم `actualQty` من WH_MFG وإضافة ledger `PRODUCTION_CONSUMPTION`.
   - إذا كان الهدر مسجل منفصل: ledger `PRODUCTION_WASTE` (أو تضمينه ضمن الاستهلاك مع tag).
5) حساب تكلفة الإنتاج:
   - مجموع `actualQty * unitCost` (من متوسط التكلفة وقت الحركة)
   - + تكاليف إضافية مهيأة (Overhead) إن وجدت.
6) إضافة المنتج النهائي إلى WH_FG:
   - تحديث `InventoryBalance` للمنتج النهائي
   - ledger `PRODUCTION_OUTPUT`
7) قيود محاسبية:
   - الاستهلاك: Debit WIP / Credit Raw Inventory
   - الإخراج: Debit Finished Goods / Credit WIP
8) تحديث حالة أمر الإنتاج `COMPLETED` + حفظ `actualOutputQty`, `totalCost`, `unitCost`.
9) AuditLog + Notification (واحد).

## 5) تأكيد فاتورة مبيعات (Sales Invoice Confirm)

### Transaction
1) Validation الحالة (DRAFT → CONFIRMED).
2) Lock أرصدة WH_FG للمنتجات.
3) التأكد من توفر المخزون.
4) خصم المخزون + ledger `SALE`.
5) قيود محاسبية:
   - Debit AR / Credit Revenue / Credit Tax Payable
   - Debit COGS / Credit Finished Goods Inventory
6) AuditLog + Notification.

