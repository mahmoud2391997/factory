import type { Permission, RoleKey } from './permissions'

export const SCHEMA_VERSION = 2

export type WarehouseKey = 'WH_RAW' | 'WH_MFG' | 'WH_FG'
export type ItemType = 'MATERIAL' | 'PRODUCT'
export type VatTreatment = 'STANDARD' | 'ZERO' | 'EXEMPT'

export type Company = {
  nameAr: string
  nameEn: string
  address: string
  city: string
  country: string
  phone: string
  email: string
  crNumber: string
  vatNumber: string
  currency: 'OMR'
  vatRatePct: number
  varianceThresholdPct: number
  notifyEmail: string
  requireQcBeforeUse?: boolean
  /** OMR per bag when no packaging material cost is on hand. */
  bagUnitCost?: number
  packagingMaterialId?: string
  /** OMR per ton, used when completion has no manual line for that type. */
  costRates?: {
    ELECTRICITY?: number
    GAS?: number
    LABOR?: number
    TRANSPORT?: number
    MAINTENANCE?: number
    OVERHEAD?: number
  }
}

export type AppUser = {
  id: string
  email: string
  fullName: string
  role: RoleKey
  passwordHash: string
  active: boolean
  /** When true, the session may only change this user's own password. */
  mustChangePassword?: boolean
  /** Bumped to revoke previously issued JWT cookies. */
  tokenVersion?: number
}

export type Account = {
  code: string
  nameAr: string
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
}

export type Material = {
  id: string
  code: string
  nameAr: string
  category: string
  unit: string
  minQty: number
  vatTreatment: VatTreatment
  barcode: string
  active: boolean
  qcLimits?: { minMoisture?: number; maxMoisture?: number; minProtein?: number; maxProtein?: number; minAsh?: number; maxAsh?: number }
}

export type Product = {
  id: string
  code: string
  nameAr: string
  unit: string
  salePrice: number
  vatTreatment: VatTreatment
  barcode: string
  bagKg: number
  active: boolean
  qcLimits?: { minMoisture?: number; maxMoisture?: number; minProtein?: number; maxProtein?: number; minAsh?: number; maxAsh?: number }
}

export type Supplier = {
  id: string
  code: string
  nameAr: string
  vatNumber: string
  phone: string
  email: string
  address: string
}

export type Customer = {
  id: string
  code: string
  nameAr: string
  vatNumber: string
  phone: string
  email: string
  address: string
}

export type Employee = {
  id: string
  code: string
  nameAr: string
  department: string
  jobTitle: string
  basicSalary: number
  active: boolean
}

export type Recipe = {
  id: string
  productId: string
  nameAr: string
  baseOutputQty: number
  items: Array<{ materialId: string; qty: number }>
}

export type Balance = {
  id: string
  warehouse: WarehouseKey
  itemType: ItemType
  itemId: string
  batchNo: string
  qty: number
  unitCost: number
  expiryDate: string | null
  receivedAt: string
}

export type LedgerType =
  | 'PURCHASE_RECEIPT'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'PRODUCTION_CONSUMPTION'
  | 'PRODUCTION_OUTPUT'
  | 'SALE'
  | 'WITHDRAWAL'
  | 'ADJUSTMENT'

export type LedgerEntry = {
  id: string
  at: string
  type: LedgerType
  warehouse: WarehouseKey
  itemType: ItemType
  itemId: string
  batchNo: string
  qty: number
  unitCost: number
  prevQty: number
  newQty: number
  refType: string
  refId: string
  userId: string
  notes: string
}

export type PurchaseOrder = {
  id: string
  number: string
  supplierId: string
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PARTIALLY_RECEIVED' | 'RECEIVED'
  notes: string
  lines: Array<{ materialId: string; qty: number; unitCost: number; receivedQty: number }>
  createdBy: string
  createdAt: string
  decidedBy?: string
  decidedAt?: string
}

export type GoodsReceipt = {
  id: string
  number: string
  purchaseOrderId: string
  at: string
  createdBy: string
  lines: Array<{ materialId: string; qty: number; unitCost: number; batchNo: string; expiryDate: string | null }>
}

export type StockTransfer = {
  id: string
  number: string
  from: WarehouseKey
  to: WarehouseKey
  at: string
  createdBy: string
  notes: string
  lines: Array<{ itemType: ItemType; itemId: string; batchNo: string; qty: number }>
}

export type StockAdjustment = {
  id: string
  number: string
  warehouse: WarehouseKey
  itemType: ItemType
  itemId: string
  batchNo: string
  qtyDelta: number
  unitCost: number
  reason: string
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
  createdBy: string
  createdAt: string
  decidedBy?: string
}

export type ProductionOrder = {
  id: string
  number: string
  productId: string
  recipeId: string
  plannedQty: number
  status: 'RELEASED' | 'COMPLETED'
  expected: Array<{ materialId: string; expectedQty: number; actualQty: number; wasteQty: number }>
  actualOutputQty: number
  totalCost: number
  unitCost: number
  outputBatch: string
  varianceReason: string
  createdBy: string
  createdAt: string
  completedAt?: string
}

export type SalesInvoice = {
  id: string
  number: string
  customerId: string
  status: 'DRAFT' | 'CONFIRMED' | 'PARTIAL' | 'PAID'
  issuedAt: string
  notes: string
  lines: Array<{
    productId: string
    qty: number
    unitPrice: number
    vatTreatment: VatTreatment
    vatRatePct: number
    net: number
    vat: number
    total: number
    batchNo: string
    unitCost: number
  }>
  subtotal: number
  vatAmount: number
  total: number
  paidAmount: number
  createdBy: string
}

export type SalesPayment = {
  id: string
  number: string
  invoiceId: string
  amount: number
  method: string
  at: string
  createdBy: string
}

export type Withdrawal = {
  id: string
  number: string
  reason: string
  at: string
  createdBy: string
  lines: Array<{ productId: string; qty: number; batchNo: string; unitCost: number }>
  totalCost: number
}

export type Expense = {
  id: string
  number: string
  category: string
  description: string
  amount: number
  vatTreatment: VatTreatment
  payFrom: 'BANK' | 'CREDIT'
  status: 'PENDING_APPROVAL' | 'POSTED' | 'REJECTED'
  vatAmount: number
  total: number
  createdBy: string
  createdAt: string
  decidedBy?: string
}

export type JournalLine = { accountCode: string; debit: number; credit: number }

export type JournalEntry = {
  id: string
  number: string
  at: string
  memo: string
  refType: string
  refId: string
  lines: JournalLine[]
}

export type Attendance = {
  id: string
  employeeId: string
  date: string
  checkIn: string
  checkOut: string
  source: 'MANUAL' | 'CSV' | 'DEVICE'
}

export type PayrollLine = {
  employeeId: string
  basic: number
  overtimeHours: number
  overtimeAmount: number
  allowances: number
  deductions: number
  gross: number
  net: number
}

export type PayrollRun = {
  id: string
  number: string
  month: string
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'PAID' | 'REJECTED'
  lines: PayrollLine[]
  totalNet: number
  createdBy: string
  createdAt: string
  decidedBy?: string
}

export type PlantStoppage = {
  id: string
  at: string
  minutes: number
  area: string
  reason: string
}

export type Notification = {
  id: string
  kind: 'LOW_STOCK' | 'APPROVAL' | 'EXPIRY' | 'INFO' | 'QC'
  title: string
  body: string
  dedupeKey: string
  roles: RoleKey[]
  read: boolean
  emailStatus: 'pending' | 'sent' | 'skipped'
  at: string
}

export type AuditLog = {
  id: string
  at: string
  userId: string
  userName: string
  action: string
  entity: string
  entityId: string
  detail: string
}


export type CostLineType =
  | 'RAW_MATERIAL'
  | 'BAGS'
  | 'ELECTRICITY'
  | 'GAS'
  | 'LABOR'
  | 'TRANSPORT'
  | 'MAINTENANCE'
  | 'OVERHEAD'

export type CostLine = { type: CostLineType; amount: number }

export type QcResult = 'UNTESTED' | 'PENDING' | 'PASSED' | 'FAILED' | 'HOLD'

export type ProductionLot = {
  id: string
  lotNo: string
  productionOrderId: string
  productId: string
  /** Null on lots synthesized from a v1 order: nobody was recorded. */
  operatorId: string | null
  manufacturedAt: string
  inputKg: number
  expectedOutputKg: number
  actualOutputKg: number
  wasteKg: number
  varianceKg: number
  variancePct: number
  materials: Array<{ materialId: string; sourceBatchNo: string; supplierId: string | null; qty: number; unitCost: number }>
  costLines: CostLine[]
  totalCost: number
  costPerTon: number
  salePricePerTon?: number
  marginPerTon?: number
  marginPct?: number
  deliveries: Array<{
    invoiceId?: string
    withdrawalId?: string
    customerId?: string
    qty: number
    at: string
    /** exact = the line named this lot alone. proportional = the line listed several lots and the qty was split. */
    allocation?: 'exact' | 'proportional'
    /** Qty on the same line that named a batch with no lot. Shown in the trace; not added to this lot's sold qty. */
    unallocatedQty?: number
    unallocatedNote?: string
  }>
  qcStatus?: QcResult
  /** Synthesized from a v1 completed order. Cost is raw material only. */
  legacy?: boolean
  legacyNote?: string
}

export type QualitySample = {
  id: string
  type: 'RAW_MATERIAL' | 'FINISHED_PRODUCT'
  materialId?: string
  batchNo?: string
  supplierId?: string
  lotNo?: string
  sampledBy: string
  sampledAt: string
  moisturePct?: number
  proteinPct?: number
  ashPct?: number
  notes?: string
  result: 'PENDING' | 'PASSED' | 'FAILED' | 'HOLD'
}

export type ErpState = {
  schemaVersion: number
  revision: number
  company: Company
  rolePermissions: Record<RoleKey, Permission[]>
  users: AppUser[]
  accounts: Account[]
  warehouses: Array<{ key: WarehouseKey; nameAr: string }>
  materials: Material[]
  products: Product[]
  suppliers: Supplier[]
  customers: Customer[]
  employees: Employee[]
  recipes: Recipe[]
  balances: Balance[]
  ledger: LedgerEntry[]
  purchaseOrders: PurchaseOrder[]
  goodsReceipts: GoodsReceipt[]
  transfers: StockTransfer[]
  adjustments: StockAdjustment[]
  productionOrders: ProductionOrder[]
  lots: ProductionLot[]
  qualitySamples: QualitySample[]
  invoices: SalesInvoice[]
  payments: SalesPayment[]
  withdrawals: Withdrawal[]
  expenses: Expense[]
  journals: JournalEntry[]
  attendance: Attendance[]
  payrolls: PayrollRun[]
  stoppages: PlantStoppage[]
  notifications: Notification[]
  auditLogs: AuditLog[]
  sequences: Record<string, number>
  /** Server-side idempotency log for POST commands (bounded). */
  idempotency?: Array<{
    key: string
    userId: string
    action: string
    at: string
    message: string
  }>
  /** Qty left behind after older ledger lines were copied to the archive. */
  ledgerBaselines?: Array<{ warehouse: WarehouseKey; itemType: ItemType; itemId: string; batchNo: string; qty: number }>
  /** Debit/credit totals of journal lines copied to the archive. */
  journalOpenings?: Array<{ accountCode: string; debit: number; credit: number }>
}

export type Actor = {
  id: string
  name: string
  role: RoleKey
  permissions: readonly string[]
  mustChangePassword?: boolean
}

export type Clock = {
  now: () => string
  id: (prefix: string) => string
}

export type Command =
  | { action: 'createMaterial'; input: { code: string; nameAr: string; category: string; unit?: string; minQty: number; vatTreatment?: VatTreatment; barcode?: string } }
  | { action: 'createProduct'; input: { code: string; nameAr: string; unit?: string; salePrice: number; vatTreatment?: VatTreatment; barcode?: string; bagKg?: number } }
  | { action: 'createSupplier'; input: { nameAr: string; vatNumber?: string; phone?: string; email?: string; address?: string } }
  | { action: 'createCustomer'; input: { nameAr: string; vatNumber?: string; phone?: string; email?: string; address?: string } }
  | { action: 'createEmployee'; input: { nameAr: string; department: string; jobTitle: string; basicSalary: number } }
  | { action: 'createRecipe'; input: { productId: string; nameAr: string; baseOutputQty: number; items: Array<{ materialId: string; qty: number }> } }
  | { action: 'updateCompany'; input: Partial<Company> }
  | { action: 'fundBank'; input: { amount: number; memo?: string } }
  | { action: 'createPurchaseOrder'; input: { supplierId: string; notes?: string; lines: Array<{ materialId: string; qty: number; unitCost: number }> } }
  | { action: 'decidePurchaseOrder'; input: { id: string; decision: 'APPROVED' | 'REJECTED' } }
  | { action: 'receiveGoods'; input: { purchaseOrderId: string; lines: Array<{ materialId: string; qty: number; batchNo: string; expiryDate?: string | null; unitCost?: number }> } }
  | { action: 'transferStock'; input: { from: WarehouseKey; to: WarehouseKey; notes?: string; lines: Array<{ itemType: ItemType; itemId: string; batchNo: string; qty: number }> } }
  | { action: 'requestAdjustment'; input: { warehouse: WarehouseKey; itemType: ItemType; itemId: string; batchNo: string; qtyDelta: number; unitCost?: number; reason: string } }
  | { action: 'decideAdjustment'; input: { id: string; decision: 'APPROVED' | 'REJECTED' } }
  | { action: 'createProductionOrder'; input: { productId: string; recipeId: string; plannedQty: number } }
  | { action: 'completeProduction'; input: { productionOrderId: string; operatorId: string; actuals: Array<{ materialId: string; actualQty: number; wasteQty?: number }>; actualOutputQty: number; varianceReason?: string; costLines?: Array<{ type: 'ELECTRICITY' | 'GAS' | 'LABOR' | 'TRANSPORT' | 'MAINTENANCE' | 'OVERHEAD'; amount: number }> } }
  | { action: 'createInvoice'; input: { customerId: string; notes?: string; lines: Array<{ productId: string; qty: number; unitPrice?: number }> } }
  | { action: 'confirmInvoice'; input: { id: string } }
  | { action: 'recordPayment'; input: { invoiceId: string; amount: number; method?: string } }
  | { action: 'createWithdrawal'; input: { reason: string; lines: Array<{ productId: string; qty: number }> } }
  | { action: 'createExpense'; input: { category: string; description: string; amount: number; vatTreatment?: VatTreatment; payFrom?: 'BANK' | 'CREDIT' } }
  | { action: 'decideExpense'; input: { id: string; decision: 'POSTED' | 'REJECTED' } }
  | { action: 'recordAttendance'; input: { employeeId: string; date: string; checkIn: string; checkOut: string; source?: Attendance['source'] } }
  | { action: 'importAttendance'; input: { csv: string } }
  | { action: 'createPayroll'; input: { month: string; lines: Array<{ employeeId: string; overtimeHours?: number; allowances?: number; deductions?: number }> } }
  | { action: 'decidePayroll'; input: { id: string; decision: 'APPROVED' | 'REJECTED' } }
  | { action: 'payPayroll'; input: { id: string } }
  | { action: 'markNotificationRead'; input: { id: string } }
  | { action: 'scanBarcode'; input: { code: string } }
  | { action: 'setRolePermissions'; input: { role: RoleKey; permissions: string[] } }
  | { action: 'setUserPassword'; input: { userId: string; passwordHash: string } }
  | { action: 'archiveHistory'; input: { olderThanDays: number; nowIso?: string } }
  | { action: 'createQualitySample'; input: { type: 'RAW_MATERIAL' | 'FINISHED_PRODUCT'; materialId?: string; batchNo?: string; supplierId?: string; lotNo?: string; moisturePct?: number; proteinPct?: number; ashPct?: number; notes?: string; result?: 'PASSED' | 'FAILED' | 'HOLD'; reason?: string } }
  | { action: 'updateQualityResult'; input: { sampleId: string; result: 'PASSED' | 'FAILED' | 'HOLD'; reason: string } }
  | { action: 'setQcLimits'; input: { itemType: 'MATERIAL' | 'PRODUCT'; itemId: string; limits: { minMoisture?: number; maxMoisture?: number; minProtein?: number; maxProtein?: number; minAsh?: number; maxAsh?: number } } }

export type CommandOk = {
  ok: true
  state: ErpState
  message: string
  extra?: Record<string, unknown>
}

export type CommandResult = CommandOk | { ok: false; error: string }

export type PublicUser = Omit<AppUser, 'passwordHash'>
export type PublicState = Omit<ErpState, 'users'> & { users: PublicUser[] }
