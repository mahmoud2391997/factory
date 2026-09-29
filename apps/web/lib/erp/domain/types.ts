import type { Permission, RoleKey } from './permissions'

export const SCHEMA_VERSION = 9

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
  /** How approved production payroll is spread across the month. Defaults to per ton. */
  laborAllocationBasis?: 'PER_TON' | 'PER_HOUR'
  /**
   * Coded reasons offered when a critical variance is closed. When empty, only a free-text
   * note is required (keeps pre-existing documents behaving exactly as before).
   */
  varianceReasonCodes?: string[]
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
  /** Nutritional analysis specification limits. */
  qcLimits?: { 
    minMoisture?: number; 
    maxMoisture?: number; 
    minProtein?: number; 
    maxProtein?: number; 
    minAsh?: number; 
    maxAsh?: number
    minEnergy?: number
    maxEnergy?: number
    minFat?: number
    maxFat?: number
    minFiber?: number
    maxFiber?: number
    minCalcium?: number
    maxCalcium?: number
    minPhosphorus?: number
    maxPhosphorus?: number
  }
  /** Last known lab analysis values for this material. */
  labAnalysis?: {
    moisturePct?: number
    proteinPct?: number
    ashPct?: number
    energy?: number
    fatPct?: number
    fiberPct?: number
    calciumPct?: number
    phosphorusPct?: number
    lastLabDate?: string
  }
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
  /** Nutritional analysis specification limits. */
  qcLimits?: { 
    minMoisture?: number; 
    maxMoisture?: number; 
    minProtein?: number; 
    maxProtein?: number; 
    minAsh?: number; 
    maxAsh?: number
    minEnergy?: number
    maxEnergy?: number
    minFat?: number
    maxFat?: number
    minFiber?: number
    maxFiber?: number
    minCalcium?: number
    maxCalcium?: number
    minPhosphorus?: number
    maxPhosphorus?: number
  }
  /** Alternative bag weights supported (e.g., 40kg, 50kg). */
  alternativeBagKg?: number[]
  /** Customer-specific pricing: customerId -> special price. */
  customerPricing?: Record<string, number>
  /** Pricing history for this product. */
  priceHistory?: Array<{ customerId?: string; price: number; effectiveFrom: string; effectiveTo?: string }>
  /** Output variance % that flags the lot for the manager. Falls back to the recipe, then the company value. */
  varianceWarningPct?: number
  /** Output variance % that needs a coded reason to close and alerts the owner. Falls back to the recipe, then the company value. */
  varianceCriticalPct?: number
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
  /** Output variance % that flags the lot for the manager. Falls back to the company value. */
  varianceWarningPct?: number
  /** Output variance % that needs a coded reason to close and alerts the owner. Falls back to the company value. */
  varianceCriticalPct?: number
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

export type TripCostAllocation = {
  id: string
  tripId: string
  allocations: Array<{ lotNo: string; quantityKg: number; amount: number }>
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
  createdBy: string
  createdAt: string
  decidedBy?: string
  decidedAt?: string
  decisionReason?: string
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
  status: 'PENDING_APPROVAL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
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
  attachments?: CompanyDocumentAttachment[]
  renewalHistory?: CompanyDocumentRenewal[]
  createdBy: string
  createdAt: string
}

export type CompanyDocumentAttachment = {
  id: string
  fileName: string
  mediaType: 'application/pdf' | 'image/jpeg' | 'image/png'
  sizeBytes: number
  issueDate: string
  uploadedBy: string
  uploadedAt: string
}

export type CompanyDocumentRenewal = {
  issueDate: string
  expiryDate?: string
  cost?: number
  notes?: string
  attachmentIds: string[]
  renewedBy: string
  renewedAt: string
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
  /** Production line / machine the order runs on. Optional on old orders; drives maintenance allocation. */
  machineId?: string
  /** Shift the order runs in. Optional on old orders. */
  shift?: 'MORNING' | 'EVENING' | 'NIGHT'
  /** Coded reason for a critical variance. Optional on old orders. */
  varianceReasonCode?: string
  /** Variance severity computed at completion. Optional on old orders (treated as NORMAL). */
  varianceLevel?: 'NORMAL' | 'WARNING' | 'CRITICAL'
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
  kind: 'LOW_STOCK' | 'APPROVAL' | 'EXPIRY' | 'INFO' | 'QC' | 'OBLIGATION'
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

/** ACTUAL = read from real records (utilities, payroll, maintenance, trips, packaging). ESTIMATED = fallback company rate. MANUAL = entered on the completion form. */
export type CostBasis = 'ACTUAL' | 'ESTIMATED' | 'MANUAL'

export type CostLine = { type: CostLineType; amount: number; basis?: CostBasis; source?: string }

export type PendingCostLine = {
  id: string
  type: Exclude<CostLineType, 'RAW_MATERIAL' | 'BAGS'>
  amount: number
  status: 'PENDING_APPROVAL'
}

export type QcResult = 'UNTESTED' | 'PENDING' | 'PASSED' | 'FAILED' | 'HOLD'

/** Nutritional analysis calculated from recipe ingredients. */
export type NutritionalProfile = {
  moisturePct: number
  proteinPct: number
  ashPct: number
  energy: number
  fatPct: number
  fiberPct: number
  calciumPct: number
  phosphorusPct: number
}

/** Comparison between calculated, lab, and specification values. */
export type NutritionalComparison = {
  parameter: string
  calculated: number
  lab?: number
  specMin?: number
  specMax?: number
  variance?: number
  inSpec: boolean
}

/** Spare parts inventory item. */
export type SparePart = {
  id: string
  code: string
  nameAr: string
  description?: string
  quantity: number
  unitCost: number
  minStock: number
  supplierId?: string
  /** Machine(s) that use this part. */
  machineIds?: string[]
  active: boolean
}

/** Spare parts usage record. */
export type SparePartUsage = {
  id: string
  sparePartId: string
  machineId: string
  date: string
  quantity: number
  cost: number
  reason: string
  usedBy: string
  maintenanceId?: string
}

/** Packaging materials inventory item. */
export type PackagingMaterial = {
  id: string
  code: string
  nameAr: string
  category: 'BAG' | 'THREAD' | 'INK' | 'PAPER' | 'LABEL' | 'OTHER'
  quantity: number
  unit: string
  unitCost: number
  minStock: number
  supplierId?: string
  active: boolean
  /** Expected units consumed per ton of finished output. Bags default to 1000 / product.bagKg. */
  expectedPerTon?: number
}

/** Packaging consumption linked to production. */
export type PackagingConsumption = {
  id: string
  packagingMaterialId: string
  productionOrderId: string
  lotNo: string
  date: string
  quantity: number
  cost: number
  calculatedQty: number
  variance: number
}

/** Supplier communication template. */
export type SupplierTemplate = {
  id: string
  nameAr: string
  subject: string
  body: string
  kind: 'QUOTE_REQUEST' | 'INQUIRY' | 'ORDER' | 'OTHER'
  active: boolean
}

/** Supplier communication record. */
export type SupplierCommunication = {
  id: string
  supplierId: string
  templateId?: string
  subject: string
  body: string
  sentBy: string
  sentAt: string
  channel: 'EMAIL' | 'WHATSAPP' | 'OTHER'
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'SENT' | 'FAILED'
  approvedBy?: string
  approvedAt?: string
  response?: string
  responseAt?: string
  quoteAttachmentId?: string
}

/** Scale/weighing integration reading. */
export type ScaleReading = {
  id: string
  materialId: string
  productionOrderId: string
  expectedQty: number
  actualQty: number
  variance: number
  timestamp: string
  operatorId: string
  scaleId: string
}

/** Distribution point. */
export type DistributionPoint = {
  id: string
  code: string
  nameAr: string
  location: string
  managerId: string
  phone: string
  active: boolean
}

/** Distribution point daily closing. */
export type DistributionClosing = {
  id: string
  pointId: string
  date: string
  openingStock: Record<string, number>
  sales: Record<string, number>
  returns: Record<string, number>
  closingStock: Record<string, number>
  cash: number
  transfers: number
  /** Money variance in OMR: takings received minus the value of net sales. */
  variance: number
  /** Goods variance in tons: expected closing stock minus the counted closing stock. */
  stockVariance?: number
  closedBy: string
  closedAt: string
  status: 'PENDING' | 'RECONCILED' | 'DISCREPANCY'
}

/** Invoice delivery workflow step. */
export type DeliveryStep = 'ACCOUNTANT' | 'LOADER' | 'DRIVER' | 'CUSTOMER'

export type InvoiceDelivery = {
  id: string
  invoiceId: string
  currentStep: DeliveryStep
  steps: Array<{
    step: DeliveryStep
    completedBy: string
    completedAt: string
    notes?: string
  }>
  deliveryProof?: {
    recipientName: string
    recipientPhone?: string
    photoAttachmentId?: string
    signatureAttachmentId?: string
    location?: { lat: number; lng: number }
    deliveredAt: string
  }
}

/** Utilities consumption record. */
export type UtilitiesReading = {
  id: string
  utility: 'ELECTRICITY' | 'WATER' | 'GAS'
  readingDate: string
  previousReading: number
  currentReading: number
  consumption: number
  cost: number
  productionTon: number
  costPerTon: number
  notes?: string
}

/** Machine maintenance record. */
export type Machine = {
  id: string
  code: string
  nameAr: string
  type: string
  location: string
  active: boolean
  /** Last maintenance date. */
  lastMaintenanceDate?: string
  /** Next maintenance due date. */
  nextMaintenanceDate?: string
  /** Total operating hours. */
  operatingHours: number
}

export type MaintenanceSchedule = {
  id: string
  machineId: string
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'HOURS_BASED'
  description: string
  interval: number
  lastCompleted: string
  nextDue: string
  /** machine.operatingHours when the schedule was last completed; baseline for HOURS_BASED. */
  hoursAtLastCompletion?: number
  sparePartIds?: string[]
  estimatedCost: number
  assignedTo: string
}

export type MaintenanceRecord = {
  id: string
  machineId: string
  scheduleId?: string
  type: 'ROUTINE' | 'EMERGENCY' | 'PREVENTIVE'
  startDate: string
  endDate: string
  downtimeMinutes: number
  /** Run hours reported at service time, in minutes. Feeds machine.operatingHours. */
  operatingMinutes?: number
  description: string
  cost: number
  sparePartsUsed: Array<{ sparePartId: string; quantity: number; cost: number }>
  performedBy: string
  notes?: string
}

/** Bank integration transaction. */
export type BankTransaction = {
  id: string
  bankAccount: string
  transactionId: string
  date: string
  amount: number
  type: 'CREDIT' | 'DEBIT'
  description: string
  reference?: string
  matched: boolean
  matchedTo?: { type: 'INVOICE' | 'SUPPLIER' | 'EXPENSE'; id: string }
  matchedBy?: string
  matchedAt?: string
  status: 'UNMATCHED' | 'MATCHED' | 'REVIEW_NEEDED'
}

/** Customer-specific recipe. */
export type CustomerRecipe = {
  id: string
  customerId: string
  productId: string
  recipeId: string
  nameAr: string
  baseOutputQty: number
  items: Array<{ materialId: string; qty: number }>
  costPerTon: number
  salePrice: number
  marginPerTon: number
  active: boolean
  effectiveFrom: string
  effectiveTo?: string
}

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
  energy?: number
  fatPct?: number
  fiberPct?: number
  calciumPct?: number
  phosphorusPct?: number
  notes?: string
  result: 'PENDING' | 'PASSED' | 'FAILED' | 'HOLD'
}

export type QualityHold = {
  id: string
  targetType: 'LOT' | 'RAW_BATCH'
  lotNo?: string
  materialId?: string
  batchNo: string
  status: 'HELD' | 'RELEASED' | 'RECALLED'
  reason: string
  createdBy: string
  createdAt: string
  resolvedBy?: string
  resolvedAt?: string
  resolutionReason?: string
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
  qualityHolds: QualityHold[]
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
  tripCostAllocations: TripCostAllocation[]
  /** Phase 3: Financial obligations. */
  obligations: Obligation[]
  obligationScheduleLines: ObligationScheduleLine[]
  obligationPayments: ObligationPayment[]
  /** Phase 3: Company documents. */
  companyDocuments: CompanyDocument[]
  /** Phase 4: Spare parts inventory. */
  spareParts: SparePart[]
  sparePartUsages: SparePartUsage[]
  /** Phase 4: Packaging materials. */
  packagingMaterials: PackagingMaterial[]
  packagingConsumption: PackagingConsumption[]
  /** Phase 4: Supplier communication. */
  supplierTemplates: SupplierTemplate[]
  supplierCommunications: SupplierCommunication[]
  /** Phase 4: Scale integration. */
  scaleReadings: ScaleReading[]
  /** Phase 4: Distribution points. */
  distributionPoints: DistributionPoint[]
  distributionClosings: DistributionClosing[]
  /** Phase 4: Invoice delivery workflow. */
  invoiceDeliveries: InvoiceDelivery[]
  /** Phase 4: Utilities tracking. */
  utilitiesReadings: UtilitiesReading[]
  /** Phase 4: Machine maintenance. */
  machines: Machine[]
  maintenanceSchedules: MaintenanceSchedule[]
  maintenanceRecords: MaintenanceRecord[]
  /** Phase 4: Bank integration. */
  bankTransactions: BankTransaction[]
  /** Phase 4: Customer-specific recipes. */
  customerRecipes: CustomerRecipe[]
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
  | { action: 'createProduct'; input: { code: string; nameAr: string; unit?: string; salePrice: number; vatTreatment?: VatTreatment; barcode?: string; bagKg?: number; varianceWarningPct?: number; varianceCriticalPct?: number } }
  | { action: 'createSupplier'; input: { nameAr: string; vatNumber?: string; phone?: string; email?: string; address?: string } }
  | { action: 'createCustomer'; input: { nameAr: string; vatNumber?: string; phone?: string; email?: string; address?: string } }
  | { action: 'createEmployee'; input: { nameAr: string; department: string; jobTitle: string; basicSalary: number } }
  | { action: 'updateEmployee'; input: { id: string; nameAr?: string; department?: string; jobTitle?: string; basicSalary?: number; active?: boolean; idExpiryDate?: string; residenceExpiryDate?: string; contractExpiryDate?: string } }
  | { action: 'createRecipe'; input: { productId: string; nameAr: string; baseOutputQty: number; items: Array<{ materialId: string; qty: number }>; varianceWarningPct?: number; varianceCriticalPct?: number } }
  | { action: 'setVarianceThresholds'; input: { productId?: string; recipeId?: string; warningPct?: number | null; criticalPct?: number | null } }
  | { action: 'updateCompany'; input: Partial<Company> }
  | { action: 'fundBank'; input: { amount: number; memo?: string } }
  | { action: 'createPurchaseOrder'; input: { supplierId: string; notes?: string; lines: Array<{ materialId: string; qty: number; unitCost: number }> } }
  | { action: 'decidePurchaseOrder'; input: { id: string; decision: 'APPROVED' | 'REJECTED' } }
  | { action: 'receiveGoods'; input: { purchaseOrderId: string; lines: Array<{ materialId: string; qty: number; batchNo: string; expiryDate?: string | null; unitCost?: number }> } }
  | { action: 'transferStock'; input: { from: WarehouseKey; to: WarehouseKey; notes?: string; lines: Array<{ itemType: ItemType; itemId: string; batchNo: string; qty: number }> } }
  | { action: 'requestAdjustment'; input: { warehouse: WarehouseKey; itemType: ItemType; itemId: string; batchNo: string; qtyDelta: number; unitCost?: number; reason: string } }
  | { action: 'decideAdjustment'; input: { id: string; decision: 'APPROVED' | 'REJECTED' } }
  | { action: 'createProductionOrder'; input: { productId: string; recipeId: string; plannedQty: number; machineId?: string; shift?: 'MORNING' | 'EVENING' | 'NIGHT' } }
  | { action: 'completeProduction'; input: { productionOrderId: string; operatorId: string; actuals: Array<{ materialId: string; actualQty: number; wasteQty?: number }>; actualOutputQty: number; varianceReason?: string; varianceReasonCode?: string; costLines?: Array<{ type: 'ELECTRICITY' | 'GAS' | 'LABOR' | 'TRANSPORT' | 'MAINTENANCE' | 'OVERHEAD'; amount: number }> } }
  | { action: 'decideProductionCost'; input: { lotId: string; lineId: string; decision: 'APPROVED' | 'REJECTED' } }
  | { action: 'recalculateLotCosts'; input: { month: string } }
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
  | { action: 'setQcLimits'; input: { itemType: 'MATERIAL' | 'PRODUCT'; itemId: string; limits: { minMoisture?: number; maxMoisture?: number; minProtein?: number; maxProtein?: number; minAsh?: number; maxAsh?: number; minEnergy?: number; maxEnergy?: number; minFat?: number; maxFat?: number; minFiber?: number; maxFiber?: number; minCalcium?: number; maxCalcium?: number; minPhosphorus?: number; maxPhosphorus?: number } } }
  | { action: 'holdLot'; input: { lotNo: string; reason: string } }
  | { action: 'releaseLot'; input: { lotNo: string; reason: string } }
  | { action: 'recallLot'; input: { lotNo: string; reason: string } }
  | { action: 'holdRawBatch'; input: { materialId: string; batchNo: string; reason: string } }
  | { action: 'releaseRawBatch'; input: { materialId: string; batchNo: string; reason: string } }
  | { action: 'createSparePart'; input: { code: string; nameAr: string; description?: string; quantity: number; unitCost: number; minStock: number; supplierId?: string; machineIds?: string[] } }
  | { action: 'recordSparePartUsage'; input: { sparePartId: string; machineId: string; quantity: number; reason: string; maintenanceId?: string } }
  | { action: 'createPackagingMaterial'; input: { code: string; nameAr: string; category: 'BAG' | 'THREAD' | 'INK' | 'PAPER' | 'LABEL' | 'OTHER'; quantity: number; unit: string; unitCost: number; minStock: number; supplierId?: string; expectedPerTon?: number } }
  | { action: 'recordPackagingConsumption'; input: { packagingMaterialId: string; productionOrderId: string; lotNo: string; quantity: number } }
  | { action: 'createSupplierTemplate'; input: { nameAr: string; subject: string; body: string; kind: 'QUOTE_REQUEST' | 'INQUIRY' | 'ORDER' | 'OTHER' } }
  | { action: 'sendSupplierCommunication'; input: { supplierId: string; templateId?: string; subject: string; body: string; channel: 'EMAIL' | 'WHATSAPP' | 'OTHER' } }
  | { action: 'approveSupplierCommunication'; input: { id: string } }
  | { action: 'recordScaleReading'; input: { materialId: string; productionOrderId: string; expectedQty: number; actualQty: number; scaleId: string } }
  | { action: 'createDistributionPoint'; input: { code: string; nameAr: string; location: string; managerId: string; phone: string } }
  | { action: 'closeDistributionDay'; input: { pointId: string; date: string; openingStock: Record<string, number>; sales: Record<string, number>; returns: Record<string, number>; closingStock: Record<string, number>; cash: number; transfers: number } }
  | { action: 'advanceInvoiceDelivery'; input: { invoiceId: string; step: DeliveryStep; notes?: string; deliveryProof?: { recipientName: string; recipientPhone?: string; location?: { lat: number; lng: number } } } }
  | { action: 'recordUtilitiesReading'; input: { utility: 'ELECTRICITY' | 'WATER' | 'GAS'; readingDate: string; previousReading: number; currentReading: number; cost: number; productionTon: number; notes?: string } }
  | { action: 'createMachine'; input: { code: string; nameAr: string; type: string; location: string } }
  | { action: 'createMaintenanceSchedule'; input: { machineId: string; type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'HOURS_BASED'; description: string; interval: number; sparePartIds?: string[]; estimatedCost: number; assignedTo: string } }
  | { action: 'recordMaintenance'; input: { machineId: string; scheduleId?: string; type: 'ROUTINE' | 'EMERGENCY' | 'PREVENTIVE'; startDate: string; endDate: string; description: string; cost: number; sparePartsUsed: Array<{ sparePartId: string; quantity: number; cost: number }>; operatingMinutes?: number; notes?: string } }
  | { action: 'recordBankTransaction'; input: { bankAccount: string; transactionId: string; date: string; amount: number; type: 'CREDIT' | 'DEBIT'; description: string; reference?: string } }
  | { action: 'matchBankTransaction'; input: { transactionId: string; matchTo: { type: 'INVOICE' | 'SUPPLIER' | 'EXPENSE'; id: string } } }
  | { action: 'createCustomerRecipe'; input: { customerId: string; productId: string; recipeId: string; nameAr: string; baseOutputQty: number; items: Array<{ materialId: string; qty: number }>; salePrice: number; effectiveFrom: string } }
  | { action: 'setCustomerPricing'; input: { productId: string; customerId: string; price: number } }
  | { action: 'setAlternativeBagWeights'; input: { productId: string; bagKg: number[] } }
  | { action: 'createVehicle'; input: { code: string; plateNo: string; type: string; nameAr: string; kmPerLiter?: number } }
  | { action: 'updateVehicle'; input: { id: string; plateNo?: string; type?: string; nameAr?: string; active?: boolean; inspectionExpiryDate?: string; insuranceExpiryDate?: string; ownershipExpiryDate?: string; kmPerLiter?: number } }
  | { action: 'addFuelLog'; input: { vehicleId: string; date: string; liters: number; cost: number; odometer: number; driverId: string; station?: string } }
  | { action: 'addVehicleService'; input: { vehicleId: string; date: string; kind: VehicleService['kind']; description: string; cost: number; odometer: number; nextDueDate?: string; nextDueKm?: number; supplierId?: string } }
  | { action: 'createTrip'; input: { vehicleId: string; driverId: string; date: string; destination: string; km: number; loadKg: number; fuelLiters: number; customerId?: string; invoiceId?: string; driverCost?: number; fuelVarianceReason?: string } }
  | { action: 'requestTripCostAllocation'; input: { tripId: string } }
  | { action: 'decideTripCostAllocation'; input: { id: string; decision: 'APPROVED' | 'REJECTED'; reason?: string } }
  | { action: 'createObligation'; input: { beneficiary: string; description: string; kind: Obligation['kind']; total: number; installmentAmount: number; firstDueDate: string; frequency: Obligation['frequency']; numberOfInstallments?: number } }
  | { action: 'decideObligation'; input: { id: string; decision: 'APPROVED' | 'REJECTED' } }
  | { action: 'payObligationInstallment'; input: { scheduleLineId: string; amount: number; date?: string; method: string; reference?: string } }
  | { action: 'createCompanyDocument'; input: { title: string; kind: CompanyDocument['kind']; entityType?: CompanyDocument['entityType']; entityId?: string; issueDate: string; expiryDate?: string; cost?: number; renewalOwnerId?: string; notes?: string; attachmentId?: string } }
  | { action: 'renewCompanyDocument'; input: { id: string; issueDate: string; expiryDate?: string; cost?: number; notes?: string; attachmentId?: string } }
  | { action: 'addCompanyDocumentAttachment'; input: { documentId: string; id: string; fileName: string; mediaType: CompanyDocumentAttachment['mediaType']; sizeBytes: number } }

export type CommandOk = {
  ok: true
  state: ErpState
  message: string
  extra?: Record<string, unknown>
}

export type CommandResult = CommandOk | { ok: false; error: string }

export type PublicUser = Omit<AppUser, 'passwordHash'>
export type PublicState = Omit<ErpState, 'users'> & { users: PublicUser[] }
