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
- لا يُكمل الأمر إلا وهو `RELEASED`، والمشغّل موظف نشط.
- يجب أن تتوفر المواد في `WH_MFG`، والصرف FIFO. كل دفعة خام تُربط بموردها عبر إذن الاستلام ثم أمر الشراء.
- الناتج المتوقع يُحسب من الوصفة على الكمية الداخلة فعلاً. الفارق = الناتج الفعلي − المتوقع. إذا تجاوزت النسبة المطلقة `varianceThresholdPct` فالسبب إلزامي ويُنشأ تنبيه.
- يُنشأ سجل في `lots` ورقمه `LOT-YYYYMMDD-###`، ويُخزَّن المنتج النهائي بهذا الرقم.
- دفعة خام `FAILED` أو `HOLD` لا تُحوَّل إلى التصنيع ولا تُستهلك. دفعة منتج بنفس الحالة لا تُفوتر ولا تُسحب. دفعة `UNTESTED` (بلا عينة) تُمنع فقط إذا كان `requireQcBeforeUse` مفعّلاً.

### Transaction (ذَرّية)
1) Load `ProductionOrder` + `Recipe` + expected materials.
2) Validation الحالة.
3) Lock لكل `InventoryBalance` لمواد WH_MFG المطلوبة.
4) لكل مادة: خصم `actualQty` من WH_MFG بـ FIFO، وledger `PRODUCTION_CONSUMPTION`، وتسجيل رقم الدفعة والمورد على الدفعة.
5) تكلفة الدفعة = خام + أكياس + بنود يدوية أو أسعار التحميل للطن. بند يدوي أعلى من `costApprovalThreshold` (الافتراضي 0، أي كل مبلغ موجب) يبقى `PENDING_APPROVAL` ولا يُرحَّل حتى يعتمده المدير أو المحاسب. الرفض يحذف البند؛ إن وُجد سعر تحميل للطن يُطبَّق مكانه. رفع الحد كثيراً يرحّل البند فوراً. الهدر يُحفظ على سطر المادة ولا يُنشأ له دفتر منفصل.
6) إضافة المنتج النهائي إلى WH_FG برقم الدفعة، مع ledger `PRODUCTION_OUTPUT`.
7) قيود محاسبية:
   - الاستهلاك: مدين تشغيل / دائن مخزون خام
   - التكاليف الأخرى: مدين تشغيل / دائن `2600` مستحقات تكاليف الإنتاج
   - الإخراج: مدين منتج نهائي بكامل التكلفة / دائن تشغيل
8) تحديث حالة أمر الإنتاج `COMPLETED` + حفظ `actualOutputQty`, `totalCost`, `unitCost`.
9) AuditLog، وتنبيه واحد إذا تجاوز الفارق حد الشركة.

تأكيد الفاتورة والسحب الداخلي يصرفان المنتج النهائي FIFO حسب رقم الدفعة، ويسجّلان التسليم على الدفعة مع العميل (الفاتورة فقط). سعر البيع للطن هو المتوسط الموزون لسعر الفاتورة الفعلي.

عينة الجودة تُنشأ من شاشة العينات. النتيجة المقترحة من الحدود يمكن تجاوزها بسبب مكتوب. فك `FAILED` أو `HOLD` أمر منفصل بصلاحية `qc.release`. تنبيه الرفض أو الحجز يصل للمدير والتشغيل، ولا يتكرر ما دام التنبيه السابق غير مقروء.

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

