import * as fs from 'fs'

const path = 'apps/web/lib/erp/domain/types.ts'
let content = fs.readFileSync(path, 'utf8')

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

if (!content.includes('export type ProductionLot = {')) {
  content = content.replace('export type ErpState = {', newTypes + '\nexport type ErpState = {')
}

content = content.replace(
  'productionOrders: ProductionOrder[]',
  'productionOrders: ProductionOrder[]\n  lots: ProductionLot[]\n  qualitySamples: QualitySample[]'
)

fs.writeFileSync(path, content)
