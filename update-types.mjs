import * as fs from 'fs'

const path = 'apps/web/lib/erp/domain/types.ts'
let content = fs.readFileSync(path, 'utf8')

content = content.replace('export const SCHEMA_VERSION = 1', 'export const SCHEMA_VERSION = 2')

const newTypes = `
export type ProductionLot = {
  id: string
  lotNo: string
  productionOrderId: string
  productId: string
  operatorId: string
  manufacturedAt: string
  inputKg: number
  expectedOutputKg: number
  actualOutputKg: number
  wasteKg: number
  varianceKg: number
  variancePct: number
  materials: Array<{ materialId: string; sourceBatchNo: string; supplierId: string | null; qty: number; unitCost: number }>
  costLines: Array<{ type: string; amount: number }>
  totalCost: number
  costPerTon: number
  salePricePerTon?: number
  marginPerTon?: number
  marginPct?: number
  deliveries: Array<{ invoiceId?: string; withdrawalId?: string; customerId?: string; qty: number; at: string }>
  qcStatus?: 'PENDING' | 'PASSED' | 'FAILED' | 'HOLD'
  legacy?: boolean
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
`

// Insert new types before ErpState
content = content.replace('export type ErpState = {', newTypes + '\nexport type ErpState = {')

// Add lots and qualitySamples to ErpState
content = content.replace(
  'productionOrders: ProductionOrder[]',
  'productionOrders: ProductionOrder[]\n  lots: ProductionLot[]\n  qualitySamples: QualitySample[]'
)

// Add qc settings to Company
const companyReplacement = `export type Company = {
  nameAr: string
  taxRegistrationNumber: string
  taxRatePct: number
  taxInclusivePricing: boolean
  currencyCode: string
  productionVarianceThresholdPct: number
  requireQcBeforeUse?: boolean
  costRates?: {
    ELECTRICITY?: number
    GAS?: number
    LABOR?: number
    TRANSPORT?: number
    MAINTENANCE?: number
    OVERHEAD?: number
  }
}`
content = content.replace(/export type Company = \{[^}]+\}/m, companyReplacement)

// Update Company settings in Command
content = content.replace(
  /action: 'updateCompany'; input: Partial<Company>/,
  "action: 'updateCompany'; input: Partial<Company>"
)

// Add QC commands to Command
const qcCommands = `
  | { action: 'createQualitySample'; input: { type: 'RAW_MATERIAL' | 'FINISHED_PRODUCT'; materialId?: string; batchNo?: string; supplierId?: string; lotNo?: string; moisturePct?: number; proteinPct?: number; ashPct?: number; notes?: string; result?: 'PASSED' | 'FAILED' | 'HOLD' } }
  | { action: 'updateQualityResult'; input: { sampleId: string; result: 'PASSED' | 'FAILED' | 'HOLD'; reason: string } }`
content = content.replace('export type Command =', 'export type Command =' + qcCommands)


fs.writeFileSync(path, content)
