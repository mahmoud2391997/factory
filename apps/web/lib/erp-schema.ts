export type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'date' | 'checkbox'

export type SchemaField = {
  key: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  unit?: string
  min?: number
  max?: number
  step?: number
  options?: Array<{ value: string; label: string }>
  /** Show in table columns */
  column?: boolean
  defaultValue?: string | number | boolean
}

export type EntitySchema = {
  key: string
  title: string
  description: string
  docPrefix: string
  primaryLabelKey: string
  fields: SchemaField[]
  statusKey?: string
  seed?: Array<Record<string, unknown>>
}

const warehouseOptions = [
  { value: 'WH_RAW', label: 'مستودع المواد الخام (WH_RAW)' },
  { value: 'WH_MFG', label: 'مستودع التصنيع (WH_MFG)' },
  { value: 'WH_FG', label: 'مستودع المنتجات النهائية (WH_FG)' },
]

const txnTypes = [
  'PURCHASE_RECEIPT',
  'TRANSFER_OUT',
  'TRANSFER_IN',
  'PRODUCTION_CONSUMPTION',
  'PRODUCTION_WASTE',
  'PRODUCTION_OUTPUT',
  'SALE',
  'WITHDRAWAL',
  'RETURN',
  'ADJUSTMENT',
].map((value) => ({ value, label: value }))

export const ENTITY_SCHEMAS: Record<string, EntitySchema> = {
  material: {
    key: 'material',
    title: 'المواد الخام',
    description: 'Material — أصناف المواد الخام',
    docPrefix: 'RM',
    primaryLabelKey: 'nameAr',
    statusKey: 'status',
    fields: [
      { key: 'code', label: 'كود المادة', type: 'text', required: true, column: true, placeholder: 'RM-001' },
      { key: 'nameAr', label: 'اسم المادة', type: 'text', required: true, column: true },
      { key: 'category', label: 'التصنيف', type: 'text', column: true, placeholder: 'حبوب / بروتين / إضافات' },
      { key: 'unit', label: 'وحدة القياس', type: 'select', required: true, column: true, defaultValue: 'كجم', options: [
        { value: 'كجم', label: 'كجم' },
        { value: 'طن', label: 'طن' },
        { value: 'كيس', label: 'كيس' },
      ] },
      { key: 'minQty', label: 'الحد الأدنى', type: 'number', min: 0, column: true, unit: 'كجم' },
      { key: 'status', label: 'الحالة', type: 'select', required: true, column: true, defaultValue: 'نشط', options: [
        { value: 'نشط', label: 'نشط' },
        { value: 'منخفض', label: 'منخفض' },
        { value: 'موقوف', label: 'موقوف' },
      ] },
      { key: 'notes', label: 'ملاحظات', type: 'textarea' },
    ],
    seed: [
      { code: 'RM-001', nameAr: 'ذرة صفراء', category: 'حبوب', unit: 'كجم', minQty: 5000, status: 'نشط' },
      { code: 'RM-002', nameAr: 'كسب صويا', category: 'بروتين', unit: 'كجم', minQty: 3000, status: 'منخفض' },
      { code: 'RM-003', nameAr: 'نخالة قمح', category: 'حبوب', unit: 'كجم', minQty: 2000, status: 'نشط' },
    ],
  },

  materialBatch: {
    key: 'materialBatch',
    title: 'دفعات المواد',
    description: 'MaterialBatch — رقم دفعة وصلاحية',
    docPrefix: 'BAT',
    primaryLabelKey: 'batchNo',
    statusKey: 'status',
    fields: [
      { key: 'batchNo', label: 'رقم الدفعة', type: 'text', required: true, column: true },
      { key: 'materialCode', label: 'كود المادة', type: 'text', required: true, column: true, placeholder: 'RM-001' },
      { key: 'supplierName', label: 'المورد', type: 'text', column: true },
      { key: 'qty', label: 'الكمية', type: 'number', min: 0, column: true, unit: 'كجم', required: true },
      { key: 'expiryDate', label: 'تاريخ الصلاحية', type: 'date', column: true },
      { key: 'receivedAt', label: 'تاريخ الاستلام', type: 'date', column: true },
      { key: 'warehouseKey', label: 'المستودع', type: 'select', required: true, column: true, defaultValue: 'WH_RAW', options: warehouseOptions },
      { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'متاح', column: true, options: [
        { value: 'متاح', label: 'متاح' },
        { value: 'محجوز', label: 'محجوز' },
        { value: 'منتهي', label: 'منتهي' },
      ] },
      { key: 'notes', label: 'ملاحظات', type: 'textarea' },
    ],
    seed: [
      { batchNo: 'B-2401', materialCode: 'RM-001', supplierName: 'المطاحن العمانية', qty: 25000, expiryDate: '2026-12-01', receivedAt: '2026-09-01', warehouseKey: 'WH_RAW', status: 'متاح' },
    ],
  },

  product: {
    key: 'product',
    title: 'المنتجات النهائية',
    description: 'Product — منتجات جاهزة',
    docPrefix: 'FG',
    primaryLabelKey: 'nameAr',
    statusKey: 'status',
    fields: [
      { key: 'code', label: 'كود المنتج', type: 'text', required: true, column: true },
      { key: 'nameAr', label: 'اسم المنتج', type: 'text', required: true, column: true },
      { key: 'category', label: 'التصنيف', type: 'text', column: true },
      { key: 'unit', label: 'الوحدة', type: 'select', defaultValue: 'كجم', column: true, options: [
        { value: 'كجم', label: 'كجم' },
        { value: 'طن', label: 'طن' },
      ] },
      { key: 'salePricePerTon', label: 'سعر البيع / طن', type: 'number', min: 0, column: true, unit: 'ر.ع' },
      { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'متوفر', column: true, options: [
        { value: 'متوفر', label: 'متوفر' },
        { value: 'منخفض', label: 'منخفض' },
        { value: 'موقوف', label: 'موقوف' },
      ] },
      { key: 'notes', label: 'ملاحظات', type: 'textarea' },
    ],
    seed: [
      { code: 'FG-001', nameAr: 'علف تسمين مواشي', category: 'مواشي', unit: 'كجم', salePricePerTon: 250, status: 'متوفر' },
      { code: 'FG-002', nameAr: 'علف دواجن بادئ', category: 'دواجن', unit: 'كجم', salePricePerTon: 215, status: 'متوفر' },
    ],
  },

  warehouse: {
    key: 'warehouse',
    title: 'المستودعات',
    description: 'Warehouse + WarehouseLocation',
    docPrefix: 'WH',
    primaryLabelKey: 'nameAr',
    statusKey: 'status',
    fields: [
      { key: 'key', label: 'مفتاح المستودع', type: 'select', required: true, column: true, options: warehouseOptions },
      { key: 'nameAr', label: 'الاسم', type: 'text', required: true, column: true },
      { key: 'locationCode', label: 'كود الموقع', type: 'text', column: true, placeholder: 'A1' },
      { key: 'locationName', label: 'اسم الموقع', type: 'text', column: true },
      { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'نشط', column: true, options: [
        { value: 'نشط', label: 'نشط' },
        { value: 'موقوف', label: 'موقوف' },
      ] },
    ],
    seed: [
      { key: 'WH_RAW', nameAr: 'مستودع المواد الخام', locationCode: 'A1', locationName: 'منطقة A1', status: 'نشط' },
      { key: 'WH_MFG', nameAr: 'مستودع التصنيع', locationCode: 'M1', locationName: 'منطقة M1', status: 'نشط' },
      { key: 'WH_FG', nameAr: 'مستودع المنتجات النهائية', locationCode: 'F1', locationName: 'منطقة F1', status: 'نشط' },
    ],
  },

  inventoryBalance: {
    key: 'inventoryBalance',
    title: 'أرصدة المخزون',
    description: 'InventoryBalance — رصيد حي',
    docPrefix: 'BAL',
    primaryLabelKey: 'itemCode',
    fields: [
      { key: 'itemType', label: 'نوع الصنف', type: 'select', required: true, column: true, options: [
        { value: 'MATERIAL', label: 'مادة خام' },
        { value: 'PRODUCT', label: 'منتج نهائي' },
      ] },
      { key: 'itemCode', label: 'كود الصنف', type: 'text', required: true, column: true },
      { key: 'itemName', label: 'اسم الصنف', type: 'text', required: true, column: true },
      { key: 'warehouseKey', label: 'المستودع', type: 'select', required: true, column: true, options: warehouseOptions },
      { key: 'batchNo', label: 'الدفعة (اختياري)', type: 'text', column: true },
      { key: 'qtyOnHand', label: 'الكمية الحالية', type: 'number', min: 0, required: true, column: true, unit: 'كجم' },
      { key: 'weightedAvgUnitCost', label: 'متوسط التكلفة', type: 'number', min: 0, column: true, unit: 'ر.ع' },
    ],
    seed: [
      { itemType: 'MATERIAL', itemCode: 'RM-001', itemName: 'ذرة صفراء', warehouseKey: 'WH_RAW', batchNo: 'B-2401', qtyOnHand: 18400, weightedAvgUnitCost: 0.12 },
      { itemType: 'PRODUCT', itemCode: 'FG-001', itemName: 'علف تسمين مواشي', warehouseKey: 'WH_FG', qtyOnHand: 56220, weightedAvgUnitCost: 0.22 },
    ],
  },

  inventoryTransaction: {
    key: 'inventoryTransaction',
    title: 'دفتر الحركات',
    description: 'InventoryTransaction — Ledger',
    docPrefix: 'MOV',
    primaryLabelKey: 'type',
    fields: [
      { key: 'type', label: 'نوع الحركة', type: 'select', required: true, column: true, options: txnTypes },
      { key: 'itemType', label: 'نوع الصنف', type: 'select', required: true, column: true, options: [
        { value: 'MATERIAL', label: 'مادة خام' },
        { value: 'PRODUCT', label: 'منتج نهائي' },
      ] },
      { key: 'itemCode', label: 'كود الصنف', type: 'text', required: true, column: true },
      { key: 'warehouseKey', label: 'المستودع', type: 'select', required: true, column: true, options: warehouseOptions },
      { key: 'quantity', label: 'الكمية', type: 'number', required: true, column: true, unit: 'كجم' },
      { key: 'unitCost', label: 'تكلفة الوحدة', type: 'number', min: 0, column: true, unit: 'ر.ع' },
      { key: 'referenceType', label: 'مرجع العملية', type: 'text', column: true, placeholder: 'GoodsReceipt / ProductionOrder' },
      { key: 'referenceId', label: 'رقم المرجع', type: 'text', column: true },
      { key: 'notes', label: 'ملاحظات', type: 'textarea' },
    ],
    seed: [
      { type: 'PURCHASE_RECEIPT', itemType: 'MATERIAL', itemCode: 'RM-002', warehouseKey: 'WH_RAW', quantity: 25000, unitCost: 0.15, referenceType: 'GoodsReceipt', referenceId: 'GR-1001' },
    ],
  },

  stockTransfer: {
    key: 'stockTransfer',
    title: 'تحويلات المخزون',
    description: 'StockTransfer',
    docPrefix: 'TR',
    primaryLabelKey: 'docNo',
    statusKey: 'status',
    fields: [
      { key: 'docNo', label: 'رقم التحويل', type: 'text', required: true, column: true },
      { key: 'fromWarehouse', label: 'من مستودع', type: 'select', required: true, column: true, options: warehouseOptions },
      { key: 'toWarehouse', label: 'إلى مستودع', type: 'select', required: true, column: true, options: warehouseOptions },
      { key: 'itemCode', label: 'كود الصنف', type: 'text', required: true, column: true },
      { key: 'quantity', label: 'الكمية', type: 'number', min: 0, required: true, column: true, unit: 'كجم' },
      { key: 'transferDate', label: 'تاريخ التحويل', type: 'date', column: true },
      { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'مكتمل', column: true, options: [
        { value: 'مسودة', label: 'مسودة' },
        { value: 'مكتمل', label: 'مكتمل' },
        { value: 'ملغي', label: 'ملغي' },
      ] },
      { key: 'notes', label: 'ملاحظات', type: 'textarea' },
    ],
    seed: [
      { docNo: 'TR-501', fromWarehouse: 'WH_RAW', toWarehouse: 'WH_MFG', itemCode: 'RM-001', quantity: 8200, transferDate: '2026-09-19', status: 'مكتمل' },
    ],
  },

  stockAdjustment: {
    key: 'stockAdjustment',
    title: 'تعديل المخزون',
    description: 'StockAdjustment — سبب إلزامي',
    docPrefix: 'ADJ',
    primaryLabelKey: 'docNo',
    statusKey: 'status',
    fields: [
      { key: 'docNo', label: 'رقم التعديل', type: 'text', required: true, column: true },
      { key: 'warehouseKey', label: 'المستودع', type: 'select', required: true, column: true, options: warehouseOptions },
      { key: 'itemCode', label: 'كود الصنف', type: 'text', required: true, column: true },
      { key: 'quantityDelta', label: 'التغيير (+/-)', type: 'number', required: true, column: true, unit: 'كجم' },
      { key: 'reason', label: 'السبب', type: 'textarea', required: true, column: true },
      { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'معتمد', column: true, options: [
        { value: 'مسودة', label: 'مسودة' },
        { value: 'معتمد', label: 'معتمد' },
      ] },
    ],
    seed: [
      {
        docNo: 'ADJ-001',
        warehouseKey: 'WH_RAW',
        itemCode: 'RAW-SOY',
        quantityDelta: -50,
        reason: 'تسوية جرد دوري بعد وزن الميزان',
        status: 'معتمد',
      },
    ],
  },

  supplier: {
    key: 'supplier',
    title: 'الموردون',
    description: 'Supplier',
    docPrefix: 'SUP',
    primaryLabelKey: 'nameAr',
    statusKey: 'status',
    fields: [
      { key: 'code', label: 'كود المورد', type: 'text', required: true, column: true },
      { key: 'nameAr', label: 'الاسم', type: 'text', required: true, column: true },
      { key: 'phone', label: 'الهاتف', type: 'text', column: true },
      { key: 'email', label: 'البريد', type: 'text', column: true },
      { key: 'taxNo', label: 'الرقم الضريبي', type: 'text', column: true },
      { key: 'address', label: 'العنوان', type: 'textarea' },
      { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'نشط', column: true, options: [
        { value: 'نشط', label: 'نشط' },
        { value: 'موقوف', label: 'موقوف' },
      ] },
    ],
    seed: [
      { code: 'SUP-01', nameAr: 'شركة المطاحن العمانية', phone: '96890000001', taxNo: 'OM-TAX-100', status: 'نشط' },
    ],
  },

  purchaseOrder: {
    key: 'purchaseOrder',
    title: 'أوامر الشراء',
    description: 'PurchaseOrder',
    docPrefix: 'PO',
    primaryLabelKey: 'docNo',
    statusKey: 'status',
    fields: [
      { key: 'docNo', label: 'رقم الأمر', type: 'text', required: true, column: true },
      { key: 'supplierCode', label: 'كود المورد', type: 'text', required: true, column: true },
      { key: 'orderDate', label: 'تاريخ الأمر', type: 'date', required: true, column: true },
      { key: 'materialCode', label: 'كود المادة', type: 'text', required: true, column: true },
      { key: 'quantity', label: 'الكمية', type: 'number', min: 0, required: true, column: true, unit: 'كجم' },
      { key: 'unitPrice', label: 'سعر الوحدة', type: 'number', min: 0, column: true, unit: 'ر.ع' },
      { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'معتمد', column: true, options: [
        { value: 'مسودة', label: 'مسودة' },
        { value: 'معتمد', label: 'معتمد' },
        { value: 'مستلم جزئياً', label: 'مستلم جزئياً' },
        { value: 'مكتمل', label: 'مكتمل' },
        { value: 'ملغي', label: 'ملغي' },
      ] },
      { key: 'notes', label: 'ملاحظات', type: 'textarea' },
    ],
    seed: [
      { docNo: 'PO-220', supplierCode: 'SUP-01', orderDate: '2026-09-10', materialCode: 'RM-002', quantity: 25000, unitPrice: 0.15, status: 'مكتمل' },
    ],
  },

  goodsReceipt: {
    key: 'goodsReceipt',
    title: 'استلام البضاعة',
    description: 'GoodsReceipt → WH_RAW + Ledger',
    docPrefix: 'GR',
    primaryLabelKey: 'docNo',
    statusKey: 'status',
    fields: [
      { key: 'docNo', label: 'رقم الاستلام', type: 'text', required: true, column: true },
      { key: 'poDocNo', label: 'أمر الشراء', type: 'text', required: true, column: true },
      { key: 'warehouseKey', label: 'المستودع', type: 'select', required: true, column: true, defaultValue: 'WH_RAW', options: warehouseOptions },
      { key: 'receiptDate', label: 'تاريخ الاستلام', type: 'date', required: true, column: true },
      { key: 'materialCode', label: 'كود المادة', type: 'text', required: true, column: true },
      { key: 'batchNo', label: 'رقم الدفعة', type: 'text', column: true },
      { key: 'quantity', label: 'الكمية المستلمة', type: 'number', min: 0, required: true, column: true, unit: 'كجم' },
      { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'مؤكد', column: true, options: [
        { value: 'مسودة', label: 'مسودة' },
        { value: 'مؤكد', label: 'مؤكد' },
      ] },
      { key: 'notes', label: 'ملاحظات', type: 'textarea' },
    ],
    seed: [
      { docNo: 'GR-1001', poDocNo: 'PO-220', warehouseKey: 'WH_RAW', receiptDate: '2026-09-12', materialCode: 'RM-002', batchNo: 'B-2402', quantity: 25000, status: 'مؤكد' },
    ],
  },

  recipe: {
    key: 'recipe',
    title: 'الوصفات BOM',
    description: 'Recipe — baseOutputQty',
    docPrefix: 'RCP',
    primaryLabelKey: 'nameAr',
    statusKey: 'status',
    fields: [
      { key: 'code', label: 'كود الوصفة', type: 'text', required: true, column: true },
      { key: 'nameAr', label: 'اسم الوصفة', type: 'text', required: true, column: true },
      { key: 'productCode', label: 'كود المنتج', type: 'text', required: true, column: true },
      { key: 'baseOutputQty', label: 'كمية المخرجات الأساسية', type: 'number', min: 0, required: true, column: true, unit: 'كجم', defaultValue: 1000 },
      { key: 'yieldPct', label: 'نسبة العائد %', type: 'number', min: 0, max: 100, column: true, defaultValue: 98 },
      { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'نشط', column: true, options: [
        { value: 'نشط', label: 'نشط' },
        { value: 'مسودة', label: 'مسودة' },
      ] },
      { key: 'notes', label: 'ملاحظات', type: 'textarea' },
    ],
    seed: [
      { code: 'RCP-01', nameAr: 'وصفة علف تسمين', productCode: 'FG-001', baseOutputQty: 1000, yieldPct: 98, status: 'نشط' },
    ],
  },

  recipeItem: {
    key: 'recipeItem',
    title: 'مكونات الوصفة',
    description: 'RecipeItem',
    docPrefix: 'RCI',
    primaryLabelKey: 'materialCode',
    fields: [
      { key: 'recipeCode', label: 'كود الوصفة', type: 'text', required: true, column: true },
      { key: 'materialCode', label: 'كود المادة', type: 'text', required: true, column: true },
      { key: 'qty', label: 'الكمية لكل قاعدة مخرجات', type: 'number', min: 0, required: true, column: true, unit: 'كجم' },
      { key: 'notes', label: 'ملاحظات', type: 'textarea' },
    ],
    seed: [
      { recipeCode: 'RCP-01', materialCode: 'RM-001', qty: 620 },
      { recipeCode: 'RCP-01', materialCode: 'RM-002', qty: 280 },
      { recipeCode: 'RCP-01', materialCode: 'RM-003', qty: 100 },
    ],
  },

  productionOrder: {
    key: 'productionOrder',
    title: 'أوامر الإنتاج',
    description: 'ProductionOrder — Expected vs Actual + هدر',
    docPrefix: 'PR',
    primaryLabelKey: 'docNo',
    statusKey: 'status',
    fields: [
      { key: 'docNo', label: 'رقم الأمر', type: 'text', required: true, column: true },
      { key: 'productCode', label: 'كود المنتج', type: 'text', required: true, column: true },
      { key: 'recipeCode', label: 'كود الوصفة', type: 'text', required: true, column: true },
      { key: 'plannedQty', label: 'الكمية المخططة', type: 'number', min: 0, required: true, column: true, unit: 'كجم' },
      { key: 'actualQty', label: 'الكمية الفعلية', type: 'number', min: 0, column: true, unit: 'كجم' },
      { key: 'expectedMaterialQty', label: 'استهلاك متوقع', type: 'number', min: 0, column: true, unit: 'كجم' },
      { key: 'actualMaterialQty', label: 'استهلاك فعلي', type: 'number', min: 0, column: true, unit: 'كجم' },
      { key: 'wasteQty', label: 'كمية الهدر', type: 'number', min: 0, column: true, unit: 'كجم' },
      { key: 'wastePct', label: 'نسبة الهدر %', type: 'number', min: 0, max: 100, column: true },
      { key: 'varianceReason', label: 'سبب الفرق / التأخير', type: 'textarea', column: true },
      { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'قيد التنفيذ', column: true, options: [
        { value: 'بانتظار التخطيط', label: 'بانتظار التخطيط' },
        { value: 'قيد التنفيذ', label: 'قيد التنفيذ' },
        { value: 'مكتمل', label: 'مكتمل' },
        { value: 'ملغي', label: 'ملغي' },
      ] },
      { key: 'notes', label: 'ملاحظات', type: 'textarea' },
    ],
    seed: [
      {
        docNo: 'PR-1048',
        productCode: 'FG-001',
        recipeCode: 'RCP-01',
        plannedQty: 15000,
        actualQty: 12500,
        expectedMaterialQty: 12755,
        actualMaterialQty: 13000,
        wasteQty: 245,
        wastePct: 1.8,
        varianceReason: 'رطوبة أعلى من المعتاد في الذرة',
        status: 'مكتمل',
      },
    ],
  },

  customer: {
    key: 'customer',
    title: 'العملاء',
    description: 'Customer',
    docPrefix: 'CUS',
    primaryLabelKey: 'nameAr',
    statusKey: 'status',
    fields: [
      { key: 'code', label: 'كود العميل', type: 'text', required: true, column: true },
      { key: 'nameAr', label: 'الاسم', type: 'text', required: true, column: true },
      { key: 'phone', label: 'الهاتف', type: 'text', column: true },
      { key: 'email', label: 'البريد', type: 'text', column: true },
      { key: 'taxNo', label: 'الرقم الضريبي', type: 'text', column: true },
      { key: 'address', label: 'العنوان', type: 'textarea' },
      { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'نشط', column: true, options: [
        { value: 'نشط', label: 'نشط' },
        { value: 'موقوف', label: 'موقوف' },
      ] },
    ],
    seed: [
      { code: 'CUS-01', nameAr: 'شركة الخليج للأعلاف', phone: '96891111111', status: 'نشط' },
    ],
  },

  salesInvoice: {
    key: 'salesInvoice',
    title: 'فواتير المبيعات',
    description: 'SalesInvoice + ضريبة',
    docPrefix: 'INV',
    primaryLabelKey: 'docNo',
    statusKey: 'status',
    fields: [
      { key: 'docNo', label: 'رقم الفاتورة', type: 'text', required: true, column: true },
      { key: 'customerCode', label: 'كود العميل', type: 'text', required: true, column: true },
      { key: 'invoiceDate', label: 'تاريخ الفاتورة', type: 'date', required: true, column: true },
      { key: 'productCode', label: 'كود المنتج', type: 'text', required: true, column: true },
      { key: 'quantity', label: 'الكمية', type: 'number', min: 0, required: true, column: true, unit: 'كجم' },
      { key: 'unitPrice', label: 'سعر الوحدة', type: 'number', min: 0, column: true, unit: 'ر.ع' },
      { key: 'taxRatePct', label: 'نسبة الضريبة %', type: 'number', min: 0, max: 100, column: true, defaultValue: 5 },
      { key: 'warehouseKey', label: 'مستودع الصرف', type: 'select', defaultValue: 'WH_FG', column: true, options: warehouseOptions },
      { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'آجلة', column: true, options: [
        { value: 'مسودة', label: 'مسودة' },
        { value: 'آجلة', label: 'آجلة' },
        { value: 'مدفوعة', label: 'مدفوعة' },
        { value: 'ملغاة', label: 'ملغاة' },
      ] },
      { key: 'notes', label: 'ملاحظات', type: 'textarea' },
    ],
    seed: [
      { docNo: 'INV-880', customerCode: 'CUS-01', invoiceDate: '2026-09-18', productCode: 'FG-001', quantity: 4500, unitPrice: 0.25, taxRatePct: 5, warehouseKey: 'WH_FG', status: 'آجلة' },
    ],
  },

  withdrawal: {
    key: 'withdrawal',
    title: 'السحوبات',
    description: 'Withdrawal من WH_FG',
    docPrefix: 'WD',
    primaryLabelKey: 'docNo',
    statusKey: 'status',
    fields: [
      { key: 'docNo', label: 'رقم السحب', type: 'text', required: true, column: true },
      { key: 'partyName', label: 'الجهة', type: 'text', required: true, column: true },
      { key: 'productCode', label: 'كود المنتج', type: 'text', required: true, column: true },
      { key: 'quantity', label: 'الكمية', type: 'number', min: 0, required: true, column: true, unit: 'كجم' },
      { key: 'warehouseKey', label: 'المستودع', type: 'select', defaultValue: 'WH_FG', column: true, options: warehouseOptions },
      { key: 'withdrawDate', label: 'تاريخ السحب', type: 'date', column: true },
      { key: 'reason', label: 'سبب السحب', type: 'textarea', column: true },
      { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'مؤكد', column: true, options: [
        { value: 'مسودة', label: 'مسودة' },
        { value: 'مؤكد', label: 'مؤكد' },
      ] },
    ],
    seed: [
      {
        docNo: 'WD-001',
        partyName: 'شركة الباطنة التجارية',
        productCode: 'FG-BROILER',
        quantity: 800,
        warehouseKey: 'WH_FG',
        withdrawDate: '2026-09-18',
        reason: 'سحب طلبية عميل',
        status: 'مؤكد',
      },
    ],
  },

  salesPayment: {
    key: 'salesPayment',
    title: 'التحصيلات',
    description: 'SalesPayment',
    docPrefix: 'PAY',
    primaryLabelKey: 'docNo',
    statusKey: 'status',
    fields: [
      { key: 'docNo', label: 'رقم التحصيل', type: 'text', required: true, column: true },
      { key: 'invoiceDocNo', label: 'رقم الفاتورة', type: 'text', required: true, column: true },
      { key: 'amount', label: 'المبلغ', type: 'number', min: 0, required: true, column: true, unit: 'ر.ع' },
      { key: 'paymentDate', label: 'تاريخ التحصيل', type: 'date', column: true },
      { key: 'method', label: 'طريقة الدفع', type: 'select', defaultValue: 'تحويل', column: true, options: [
        { value: 'نقدي', label: 'نقدي' },
        { value: 'تحويل', label: 'تحويل' },
        { value: 'شيك', label: 'شيك' },
      ] },
      { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'مستلم', column: true, options: [
        { value: 'مستلم', label: 'مستلم' },
        { value: 'ملغي', label: 'ملغي' },
      ] },
    ],
    seed: [
      {
        docNo: 'PAY-001',
        invoiceDocNo: 'INV-2038',
        amount: 1280,
        paymentDate: '2026-09-19',
        method: 'تحويل',
        status: 'مستلم',
      },
    ],
  },

  account: {
    key: 'account',
    title: 'دليل الحسابات',
    description: 'Account — Chart of Accounts',
    docPrefix: 'ACC',
    primaryLabelKey: 'nameAr',
    statusKey: 'status',
    fields: [
      { key: 'code', label: 'كود الحساب', type: 'text', required: true, column: true },
      { key: 'nameAr', label: 'اسم الحساب', type: 'text', required: true, column: true },
      { key: 'type', label: 'النوع', type: 'select', required: true, column: true, options: [
        { value: 'ASSET', label: 'أصول' },
        { value: 'LIABILITY', label: 'التزامات' },
        { value: 'EQUITY', label: 'حقوق ملكية' },
        { value: 'REVENUE', label: 'إيرادات' },
        { value: 'EXPENSE', label: 'مصروفات' },
      ] },
      { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'نشط', column: true, options: [
        { value: 'نشط', label: 'نشط' },
        { value: 'موقوف', label: 'موقوف' },
      ] },
    ],
    seed: [
      { code: '1100', nameAr: 'المخزون', type: 'ASSET', status: 'نشط' },
      { code: '2100', nameAr: 'الذمم الدائنة', type: 'LIABILITY', status: 'نشط' },
      { code: '4100', nameAr: 'إيرادات المبيعات', type: 'REVENUE', status: 'نشط' },
      { code: '2200', nameAr: 'ضريبة مستحقة', type: 'LIABILITY', status: 'نشط' },
    ],
  },

  journalEntry: {
    key: 'journalEntry',
    title: 'القيود اليومية',
    description: 'JournalEntry',
    docPrefix: 'JE',
    primaryLabelKey: 'docNo',
    statusKey: 'status',
    fields: [
      { key: 'docNo', label: 'رقم القيد', type: 'text', required: true, column: true },
      { key: 'entryDate', label: 'التاريخ', type: 'date', required: true, column: true },
      { key: 'referenceType', label: 'مرجع العملية', type: 'text', column: true },
      { key: 'referenceId', label: 'رقم المرجع', type: 'text', column: true },
      { key: 'debitAccount', label: 'حساب مدين', type: 'text', required: true, column: true },
      { key: 'creditAccount', label: 'حساب دائن', type: 'text', required: true, column: true },
      { key: 'amount', label: 'المبلغ', type: 'number', min: 0, required: true, column: true, unit: 'ر.ع' },
      { key: 'memo', label: 'البيان', type: 'textarea', column: true },
      { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'مرحّل', column: true, options: [
        { value: 'مسودة', label: 'مسودة' },
        { value: 'مرحّل', label: 'مرحّل' },
      ] },
    ],
    seed: [
      {
        docNo: 'JE-001',
        entryDate: '2026-09-18',
        referenceType: 'GoodsReceipt',
        referenceId: 'GR-001',
        debitAccount: '1100',
        creditAccount: '2100',
        amount: 4500,
        memo: 'استلام مواد خام — قيد تجريبي',
        status: 'مرحّل',
      },
    ],
  },

  taxSettings: {
    key: 'taxSettings',
    title: 'إعدادات الضريبة',
    description: 'CompanySettings — Tax',
    docPrefix: 'TAX',
    primaryLabelKey: 'taxRegistrationNumber',
    fields: [
      { key: 'taxRegistrationNumber', label: 'رقم التسجيل الضريبي', type: 'text', column: true },
      { key: 'taxRatePct', label: 'نسبة الضريبة %', type: 'number', min: 0, max: 100, column: true, defaultValue: 5 },
      { key: 'taxInclusivePricing', label: 'الأسعار تشمل الضريبة', type: 'checkbox', column: true, defaultValue: false },
      { key: 'currencyCode', label: 'العملة', type: 'text', defaultValue: 'OMR', column: true },
      { key: 'productionVarianceThresholdPct', label: 'حد انحراف الإنتاج %', type: 'number', min: 0, column: true, defaultValue: 2.5 },
    ],
    seed: [
      { taxRegistrationNumber: 'OM-VAT-0001', taxRatePct: 5, taxInclusivePricing: false, currencyCode: 'OMR', productionVarianceThresholdPct: 2.5 },
    ],
  },

  employee: {
    key: 'employee',
    title: 'الموظفون',
    description: 'Employee',
    docPrefix: 'EMP',
    primaryLabelKey: 'nameAr',
    statusKey: 'status',
    fields: [
      { key: 'code', label: 'كود الموظف', type: 'text', required: true, column: true },
      { key: 'nameAr', label: 'الاسم', type: 'text', required: true, column: true },
      { key: 'department', label: 'القسم', type: 'select', column: true, options: [
        { value: 'الإنتاج', label: 'الإنتاج' },
        { value: 'المستودعات', label: 'المستودعات' },
        { value: 'المبيعات', label: 'المبيعات' },
        { value: 'الحسابات', label: 'الحسابات' },
        { value: 'الإدارة', label: 'الإدارة' },
      ] },
      { key: 'jobTitle', label: 'المسمى الوظيفي', type: 'text', column: true },
      { key: 'hireDate', label: 'تاريخ التعيين', type: 'date', column: true },
      { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'نشط', column: true, options: [
        { value: 'نشط', label: 'نشط' },
        { value: 'إجازة', label: 'إجازة' },
        { value: 'منتهي', label: 'منتهي' },
      ] },
    ],
    seed: [
      { code: 'EMP-001', nameAr: 'سعيد الشحري', department: 'الإنتاج', jobTitle: 'مشغل خط', hireDate: '2024-01-10', status: 'نشط' },
    ],
  },

  attendance: {
    key: 'attendance',
    title: 'الحضور والانصراف',
    description: 'Attendance',
    docPrefix: 'ATT',
    primaryLabelKey: 'employeeCode',
    statusKey: 'status',
    fields: [
      { key: 'employeeCode', label: 'كود الموظف', type: 'text', required: true, column: true },
      { key: 'date', label: 'التاريخ', type: 'date', required: true, column: true },
      { key: 'checkIn', label: 'حضور', type: 'text', column: true, placeholder: '07:55' },
      { key: 'checkOut', label: 'انصراف', type: 'text', column: true, placeholder: '16:05' },
      { key: 'source', label: 'المصدر', type: 'select', defaultValue: 'يدوي', column: true, options: [
        { value: 'يدوي', label: 'يدوي' },
        { value: 'CSV', label: 'CSV' },
        { value: 'جهاز بصمة', label: 'جهاز بصمة' },
      ] },
      { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'حضور كامل', column: true, options: [
        { value: 'حضور كامل', label: 'حضور كامل' },
        { value: 'غياب جزئي', label: 'غياب جزئي' },
        { value: 'غياب', label: 'غياب' },
      ] },
    ],
    seed: [
      {
        employeeCode: 'EMP-001',
        date: '2026-09-20',
        checkIn: '07:55',
        checkOut: '16:05',
        source: 'يدوي',
        status: 'حضور كامل',
      },
    ],
  },

  overtime: {
    key: 'overtime',
    title: 'الإضافي',
    description: 'Overtime',
    docPrefix: 'OT',
    primaryLabelKey: 'employeeCode',
    statusKey: 'status',
    fields: [
      { key: 'employeeCode', label: 'كود الموظف', type: 'text', required: true, column: true },
      { key: 'date', label: 'التاريخ', type: 'date', required: true, column: true },
      { key: 'hours', label: 'الساعات', type: 'number', min: 0, required: true, column: true },
      { key: 'reason', label: 'السبب', type: 'textarea', column: true },
      { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'بانتظار الموافقة', column: true, options: [
        { value: 'بانتظار الموافقة', label: 'بانتظار الموافقة' },
        { value: 'معتمد', label: 'معتمد' },
        { value: 'مرفوض', label: 'مرفوض' },
      ] },
    ],
    seed: [
      {
        employeeCode: 'EMP-001',
        date: '2026-09-19',
        hours: 2,
        reason: 'إكمال أمر إنتاج مسائي',
        status: 'معتمد',
      },
    ],
  },

  report: {
    key: 'report',
    title: 'التقارير',
    description: 'تقارير تشغيلية',
    docPrefix: 'RPT',
    primaryLabelKey: 'nameAr',
    statusKey: 'status',
    fields: [
      { key: 'nameAr', label: 'اسم التقرير', type: 'text', required: true, column: true },
      { key: 'period', label: 'الفترة', type: 'text', column: true },
      { key: 'scope', label: 'النطاق', type: 'text', column: true },
      { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'جاهز', column: true, options: [
        { value: 'جاهز', label: 'جاهز' },
        { value: 'قيد التجهيز', label: 'قيد التجهيز' },
      ] },
    ],
    seed: [
      { nameAr: 'تقرير تتبع المواد → الإنتاج → البيع', period: 'سبتمبر 2026', scope: 'كل المستودعات', status: 'جاهز' },
      { nameAr: 'تقرير الهدر والانحراف', period: 'هذا الأسبوع', scope: 'التصنيع', status: 'جاهز' },
    ],
  },

  notification: {
    key: 'notification',
    title: 'الإشعارات',
    description: 'Notification',
    docPrefix: 'NTF',
    primaryLabelKey: 'title',
    statusKey: 'status',
    fields: [
      { key: 'title', label: 'العنوان', type: 'text', required: true, column: true },
      { key: 'body', label: 'النص', type: 'textarea', required: true, column: true },
      { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'جديد', column: true, options: [
        { value: 'جديد', label: 'جديد' },
        { value: 'مقروء', label: 'مقروء' },
      ] },
    ],
    seed: [
      { title: 'مخزون منخفض', body: 'كسب الصويا وصل للحد الأدنى', status: 'جديد' },
    ],
  },

  auditLog: {
    key: 'auditLog',
    title: 'سجل العمليات',
    description: 'AuditLog',
    docPrefix: 'AUD',
    primaryLabelKey: 'action',
    fields: [
      { key: 'action', label: 'الإجراء', type: 'text', required: true, column: true },
      { key: 'entity', label: 'الكيان', type: 'text', required: true, column: true },
      { key: 'entityId', label: 'معرّف السجل', type: 'text', column: true },
      { key: 'userName', label: 'المستخدم', type: 'text', column: true },
      { key: 'at', label: 'الوقت', type: 'text', column: true },
      { key: 'notes', label: 'تفاصيل', type: 'textarea', column: true },
    ],
    seed: [
      {
        action: 'إنشاء',
        entity: 'PurchaseOrder',
        entityId: 'PO-001',
        userName: 'مدير النظام',
        at: '2026-09-18 10:22',
        notes: 'إنشاء أمر شراء تجريبي',
      },
    ],
  },

  companySettings: {
    key: 'companySettings',
    title: 'إعدادات الشركة',
    description: 'CompanySettings',
    docPrefix: 'CFG',
    primaryLabelKey: 'currencyCode',
    fields: [
      { key: 'currencyCode', label: 'العملة', type: 'text', defaultValue: 'OMR', column: true },
      { key: 'productionVarianceThresholdPct', label: 'حد انحراف الإنتاج %', type: 'number', min: 0, column: true, defaultValue: 2.5 },
      { key: 'taxRegistrationNumber', label: 'الرقم الضريبي', type: 'text', column: true },
      { key: 'taxRatePct', label: 'نسبة الضريبة %', type: 'number', min: 0, column: true, defaultValue: 5 },
      { key: 'taxInclusivePricing', label: 'شامل الضريبة', type: 'checkbox', column: true },
    ],
    seed: [
      { currencyCode: 'OMR', productionVarianceThresholdPct: 2.5, taxRegistrationNumber: 'OM-VAT-0001', taxRatePct: 5, taxInclusivePricing: false },
    ],
  },

  task: {
    key: 'task',
    title: 'المهام',
    description: 'مهام تشغيلية',
    docPrefix: 'TSK',
    primaryLabelKey: 'title',
    statusKey: 'status',
    fields: [
      { key: 'title', label: 'المهمة', type: 'text', required: true, column: true },
      { key: 'assignee', label: 'المسؤول', type: 'text', column: true },
      { key: 'dueDate', label: 'الاستحقاق', type: 'date', column: true },
      { key: 'status', label: 'الحالة', type: 'select', defaultValue: 'مفتوح', column: true, options: [
        { value: 'مفتوح', label: 'مفتوح' },
        { value: 'قيد التنفيذ', label: 'قيد التنفيذ' },
        { value: 'مكتمل', label: 'مكتمل' },
        { value: 'متأخر', label: 'متأخر' },
      ] },
      { key: 'notes', label: 'ملاحظات', type: 'textarea' },
    ],
    seed: [
      {
        title: 'مراجعة أرصدة مستودع المواد',
        assignee: 'سعيد الشحري',
        dueDate: '2026-09-22',
        status: 'قيد التنفيذ',
        notes: 'قبل استلام الشحنة القادمة',
      },
    ],
  },
}

export function getEntitySchema(key: string) {
  return ENTITY_SCHEMAS[key]
}
