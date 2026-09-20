# تصميم البيانات (ERD منطقي) + مبادئ العلاقات

هذه الوثيقة تُحدد نموذج البيانات المنطقي (Logical ERD) لنظام ERP الخاص بمصنع أعلاف في عُمان، مع التركيز على:

- دفتر مخزون Ledger + أرصدة Balance
- التتبع Traceability عبر مراجع الوثائق
- السلامة عبر قيود فريدة + فهارس + soft delete حيث يلزم
- استخدام Decimal للأموال والكميات (بدون float)

> ملاحظة: سيتم تمثيل هذا التصميم في `packages/database/prisma/schema.prisma` مع فهارس/قيود/علاقات مطابقة.

## 1) مفاهيم أساسية

### 1.1 المستودعات الثلاثة (Seed + ثابتة تشغيلياً)

1) `WH_RAW` — مستودع المواد الخام  
2) `WH_MFG` — مستودع التصنيع  
3) `WH_FG` — مستودع المنتجات النهائية

يمكن إضافة “مواقع” داخل كل مستودع (`WarehouseLocation`) لتتبع رف/منطقة.

### 1.2 Ledger + Balance (الأهم)

- `InventoryTransaction` يسجل كل حركة.
- `InventoryBalance` يمثل الرصيد الحالي لمفتاح (item + warehouse + batch?) ويُحدَّث ذَرّيًا مع كل حركة.

لماذا Balance؟ لتجنب جمع ملايين الحركات عند كل قراءة، ولتطبيق منع السالب عبر قفل صف الرصيد.

## 2) المفاتيح الرئيسية (Entities)

### 2.1 المستخدمين والصلاحيات

- `User`
- `Role`
- `Permission`
- `UserRole`
- `RolePermission`
- `RefreshToken`

مبدأ: RBAC granular permissions مثل `inventory.adjust`, `production.complete`, `reports.read`.

### 2.2 الشركة والإعدادات

- `CompanySettings`
  - العملة `OMR`
  - `productionVarianceThresholdPct`
  - إعدادات الضرائب (رقم التسجيل، معدل الضريبة، inclusive/exclusive)

### 2.3 الموردون والعملاء

- `Supplier`
- `Customer`

### 2.4 المواد الخام والدفعات

- `MaterialCategory`
- `Material`
- `MaterialBatch`
  - رقم دفعة + تاريخ انتهاء (اختياري) + supplierRef (اختياري)

> الدفعة لازمة للتتبع والانتهاء، ولكن بعض المواد قد لا تحتاج دفعات — لذلك دعم `batchId` اختياري في الحركات/الأرصدة حسب نوع المادة.

### 2.5 المنتجات والوصفات

- `ProductCategory`
- `Product`
- `Recipe`
- `RecipeItem`

نقطة مهمة: `Recipe` تحتوي `baseOutputQty` (مثلاً 920kg في المثال)، بحيث:

\[
expected(item) = plannedQty \times \frac{recipeItem.qty}{recipe.baseOutputQty}
\]

### 2.6 المشتريات والاستلام

- `PurchaseOrder`
- `PurchaseOrderItem`
- `GoodsReceipt`
- `GoodsReceiptItem`

الاستلام يولد Ledger + تحديث Balance + قيود محاسبة (AP/Inventory) + Audit.

### 2.7 التحويلات والتعديلات

- `StockTransfer`
- `StockTransferItem`
- `StockAdjustment`

### 2.8 التصنيع

- `ProductionOrder`
- `ProductionMaterial` (Expected & Actual per material)
- `ProductionWaste` (اختياري: per material أو عام)
- `ProductionOutput`

مبدأ: لا تختفي المواد. قبل الاستهلاك: يتم التحويل من WH_RAW → WH_MFG.  
عند الإكمال: يتم الاستهلاك من WH_MFG + إنتاج مخرجات إلى WH_FG.

### 2.9 المبيعات والسحوبات

- `SalesInvoice`
- `SalesInvoiceItem`
- `SalesPayment`
- `Withdrawal`
- `WithdrawalItem` (إذا كانت السحوبات متعددة الأصناف)

### 2.10 المحاسبة

- `Account` (Chart of Accounts)
- `JournalEntry`
- `JournalEntryLine`

كل عملية رئيسية تولد `JournalEntry` مرجعي (referenceType/referenceId).

### 2.11 السجل والتدقيق والإشعارات

- `AuditLog`
- `Notification`

Bulk operations تُجمّع في إشعار واحد.

## 3) دفتر المخزون (InventoryTransaction)

### 3.1 الأنواع

- PURCHASE_RECEIPT
- TRANSFER_OUT / TRANSFER_IN (أو TRANSFER مع سطرين)
- PRODUCTION_CONSUMPTION
- PRODUCTION_WASTE
- PRODUCTION_OUTPUT
- SALE
- WITHDRAWAL
- RETURN
- ADJUSTMENT

### 3.2 حقول رئيسية

- `id`
- `itemType` (MATERIAL | PRODUCT)
- `materialId?` / `productId?` (واحد فقط)
- `warehouseId`
- `batchId?`
- `type`
- `quantity` (Decimal, signed أو unsigned مع direction)
- `unitCost` (Decimal)
- `previousBalanceQty`, `newBalanceQty` (للتدقيق)
- `referenceType`, `referenceId` (PurchaseOrder/GoodsReceipt/ProductionOrder/SalesInvoice…)
- `createdByUserId`
- `createdAt`
- `notes`

> مبدأ: يمنع تكرار الحركة لنفس المرجع عبر unique constraint (مثل `(referenceType, referenceId, type, warehouseId, itemKey, lineNo)` حسب الحاجة).

## 4) الأرصدة (InventoryBalance)

مفتاح فريد يقترح:

- `(warehouseId, itemType, materialId, productId, batchId)`

ويحتوي:

- `qtyOnHand`
- `weightedAvgUnitCost`
- `updatedAt`

## 5) ترقيم المستندات (DocumentSequence)

جدول `DocumentSequence`:

- `scope` (company)
- `docType` (PO, GR, PR, INV, WD, TR, ADJ…)
- `year`
- `currentNumber`

التوليد يكون عبر `UPDATE … RETURNING` داخل Transaction (آمن تحت التوازي).

## 6) التتبع (Traceability Query Paths)

### 6.1 المنتج النهائي → كل شيء

`ProductBatch`/`ProductionOutput`  
→ `ProductionOrder`  
→ `ProductionMaterial` + `InventoryTransaction(PRODUCTION_CONSUMPTION)`  
→ `StockTransfer` + `InventoryTransaction(TRANSFER)`  
→ `GoodsReceipt` + `PurchaseOrder` + `Supplier`  
→ `JournalEntry` (WIP/FG/COGS/Revenue/Tax/AP/AR)  
→ `SalesInvoice`/`Withdrawal` + `InventoryTransaction(SALE/WITHDRAWAL)`  
→ `AuditLog` لكل خطوة

