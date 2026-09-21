import type { Permission, RoleKey } from './permissions'

export const SCHEMA_VERSION = 1

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
}

export type AppUser = {
  id: string
  email: string
  fullName: string
  role: RoleKey
  passwordHash: string
  active: boolean
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

export type Task = {
  id: string
  title: string
  assigneeRole: RoleKey
  dueDate: string
  status: 'OPEN' | 'DONE'
  createdAt: string
}

export type Notification = {
  id: string
  kind: 'LOW_STOCK' | 'APPROVAL' | 'EXPIRY' | 'INFO'
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
  invoices: SalesInvoice[]
  payments: SalesPayment[]
  withdrawals: Withdrawal[]
  expenses: Expense[]
  journals: JournalEntry[]
  attendance: Attendance[]
  payrolls: PayrollRun[]
  tasks: Task[]
  notifications: Notification[]
  auditLogs: AuditLog[]
  sequences: Record<string, number>
}

export type Actor = {
  id: string
  name: string
  role: RoleKey
  permissions: readonly string[]
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
  | { action: 'completeProduction'; input: { productionOrderId: string; actuals: Array<{ materialId: string; actualQty: number; wasteQty?: number }>; actualOutputQty: number; varianceReason?: string } }
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
  | { action: 'createTask'; input: { title: string; assigneeRole: RoleKey; dueDate: string } }
  | { action: 'updateTask'; input: { id: string; status: 'OPEN' | 'DONE' } }
  | { action: 'markNotificationRead'; input: { id: string } }
  | { action: 'scanBarcode'; input: { code: string } }
  | { action: 'setRolePermissions'; input: { role: RoleKey; permissions: string[] } }
  | { action: 'setUserPassword'; input: { userId: string; passwordHash: string } }

export type CommandOk = {
  ok: true
  state: ErpState
  message: string
  extra?: Record<string, unknown>
}

export type CommandResult = CommandOk | { ok: false; error: string }
