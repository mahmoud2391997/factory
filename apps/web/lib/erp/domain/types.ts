import type { Permission, RoleKey } from './permissions'

export const SCHEMA_VERSION = 3

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
  /**
   * A manual production cost above this amount (OMR) waits for approval.
   * 0 means every positive manual line waits. A very high value posts immediately.
   */
  costApprovalThreshold?: number
  /** OMR per ton, used when completion has no manual line for that type. */
  costRates?: {
    ELECTRICITY?: number
    GAS?: number
    LABOR?: number
    TRANSPORT?: number
    MAINTENANCE?: number
    OVERHEAD?: number
  }
  /** Flag trips when actual fuel exceeds expected by this percentage (default 15%). */
  fuelVarianceThresholdPct?: number
  /** Obligations above this amount (OMR) need approval. */
  obligationApprovalThreshold?: number
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
  /** ID card expiry date for document expiry alerts. */
  idExpiryDate?: string
  /** Residence permit expiry date for document expiry alerts. */
  residenceExpiryDate?: string
  /** Employment contract expiry date for document expiry alerts. */
  contractExpiryDate?: string
}

export type Recipe = {
  id: string
  productId: string
  nameAr: string
  baseOutputQty: number
  items: Array<{ materialId: string; qty: number }>
}

export type Vehicle = {
  id: string
  code: string
  plateNo: string
  type: string
  nameAr: string
  active: boolean
  /** Vehicle inspection expiry date. */
  inspectionExpiryDate?: string
  /** Insurance expiry date. */
  insuranceExpiryDate?: string
  /** Ownership/registration expiry date. */
  ownershipExpiryDate?: string
  /** Current odometer reading in km. */
  currentOdometer: number
  /** Expected fuel efficiency: km per liter. */
  kmPerLiter?: number
}

export type VehicleService = {
  id: string
  vehicleId: string
  date: string
  kind: 'PERIODIC' | 'TIRES' | 'OIL' | 'PARTS' | 'REPAIR'
  description: string
  cost: number
  odometer: number
  /** Next service due date. */
  nextDueDate?: string
  /** Next service due odometer reading. */
  nextDueKm?: number
  supplierId?: string
  createdBy: string
  createdAt: string
}

export type FuelLog = {
  id: string
  vehicleId: string
  date: string
  liters: number
  cost: number
  odometer: number
  driverId: string
  station?: string
  createdBy: string
  createdAt: string
}

export type Trip = {
  id: string
  vehicleId: string
  driverId: string
  date: string
  destination: string
  km: number
  loadKg: number
  fuelLiters: number
  customerId?: string
  invoiceId?: string
  cost: number
  /** Optional driver cost line. */
  driverCost?: number
  /** Reason for abnormal fuel consumption. */
  fuelVarianceReason?: string
  createdBy: string
  createdAt: string
}

export type Obligation = {
  id: string
  beneficiary: string
  description: string
  kind: 'LOAN' | 'INSTALLMENT' | 'RENT' | 'OTHER'
  total: number
  installmentAmount: number
  firstDueDate: string
  frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME'
  numberOfInstallments?: number
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  createdBy: string
  createdAt: string
  decidedBy?: string
  decidedAt?: string
}

export type ObligationScheduleLine = {
  id: string
  obligationId: string
  dueDate: string
  amount: number
  paidAmount: number
  status: 'PENDING' | 'PAID' | 'OVERDUE'
}

export type ObligationPayment = {
  id: string
  obligationId: string
  scheduleLineId: string
  amount: number
  date: string
  method: string
  reference?: string
  createdBy: string
  createdAt: string
}

export type CompanyDocument = {
  id: string
  title: string
  kind: 'LICENSE' | 'OWNERSHIP' | 'INSURANCE' | 'CONTRACT' | 'LEASE' | 'GOV_PERMIT' | 'CERTIFICATE' | 'INSPECTION' | 'OTHER'
  /** Optional entity link. */
  entityType?: 'COMPANY' | 'VEHICLE' | 'EMPLOYEE' | 'SUPPLIER' | 'CUSTOMER' | 'MACHINE'
  entityId?: string
  issueDate: string
  expiryDate?: string
  cost?: number
  renewalOwnerId?: string
  notes?: string
  /** File attachment reference (stored separately). */
  attachmentId?: string
  createdBy: string
  createdAt: string
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

export type PendingCostLine = {
  id: string
  type: Exclude<CostLineType, 'RAW_MATERIAL' | 'BAGS'>
  amount: number
  status: 'PENDING_APPROVAL'
}

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
  /** Manual lines above the company threshold. Excluded from totals until approved. */
  pendingCostLines?: PendingCostLine[]
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
  /** Last applied default-permission introduction. Missing means 0. */
  permissionsVersion?: number
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
  /** Phase 3: Fleet management. */
  vehicles: Vehicle[]
  vehicleServices: VehicleService[]
  fuelLogs: FuelLog[]
  trips: Trip[]
  /** Phase 3: Financial obligations. */
  obligations: Obligation[]
  obligationScheduleLines: ObligationScheduleLine[]
  obligationPayments: ObligationPayment[]
  /** Phase 3: Company documents. */
  companyDocuments: CompanyDocument[]
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
  | { action: 'decideProductionCost'; input: { lotId: string; lineId: string; decision: 'APPROVED' | 'REJECTED' } }
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
  | { action: 'createVehicle'; input: { code: string; plateNo: string; type: string; nameAr: string; kmPerLiter?: number } }
  | { action: 'updateVehicle'; input: { id: string; plateNo?: string; type?: string; nameAr?: string; active?: boolean; inspectionExpiryDate?: string; insuranceExpiryDate?: string; ownershipExpiryDate?: string; kmPerLiter?: number } }
  | { action: 'addFuelLog'; input: { vehicleId: string; date: string; liters: number; cost: number; odometer: number; driverId: string; station?: string } }
  | { action: 'addVehicleService'; input: { vehicleId: string; date: string; kind: VehicleService['kind']; description: string; cost: number; odometer: number; nextDueDate?: string; nextDueKm?: number; supplierId?: string } }
  | { action: 'createTrip'; input: { vehicleId: string; driverId: string; date: string; destination: string; km: number; loadKg: number; fuelLiters: number; customerId?: string; invoiceId?: string; driverCost?: number; fuelVarianceReason?: string } }
  | { action: 'createObligation'; input: { beneficiary: string; description: string; kind: Obligation['kind']; total: number; installmentAmount: number; firstDueDate: string; frequency: Obligation['frequency']; numberOfInstallments?: number } }
  | { action: 'decideObligation'; input: { id: string; decision: 'APPROVED' | 'REJECTED' } }
  | { action: 'payObligationInstallment'; input: { scheduleLineId: string; amount: number; method: string; reference?: string } }
  | { action: 'createCompanyDocument'; input: { title: string; kind: CompanyDocument['kind']; entityType?: CompanyDocument['entityType']; entityId?: string; issueDate: string; expiryDate?: string; cost?: number; renewalOwnerId?: string; notes?: string; attachmentId?: string } }
  | { action: 'renewCompanyDocument'; input: { id: string; issueDate: string; expiryDate?: string; cost?: number; notes?: string; attachmentId?: string } }

export type CommandOk = {
  ok: true
  state: ErpState
  message: string
  extra?: Record<string, unknown>
}

export type CommandResult = CommandOk | { ok: false; error: string }

export type PublicUser = Omit<AppUser, 'passwordHash'>
export type PublicState = Omit<ErpState, 'users'> & { users: PublicUser[] }
