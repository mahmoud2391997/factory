import * as fs from 'fs'

let content = fs.readFileSync('apps/web/lib/erp/domain/reports.ts', 'utf8')

const match = content.match(/export function traceProduct[\s\S]*?return \{ product, orders, sales, receipts, purchaseOrders \}\n\}/)

const newTraces = `export function traceLot(state: ReportState, lotNo: string) {
  const lot = state.lots?.find(l => l.lotNo === lotNo)
  if (!lot) return null
  
  const product = state.products.find(p => p.id === lot.productId)
  const rawBatches = lot.materials
  
  const suppliers = Array.from(new Set(rawBatches.map(m => m.supplierId).filter(Boolean))).map(id => state.suppliers.find(s => s.id === id))
  
  const deliveries = lot.deliveries
  const customers = Array.from(new Set(deliveries.map(d => d.customerId).filter(Boolean))).map(id => state.customers.find(c => c.id === id))
  
  return { lot, product, rawBatches, suppliers, deliveries, customers }
}

export function traceSupplierBatch(state: ReportState, materialId: string, batchNo: string) {
  const lots = (state.lots || []).filter(l => l.materials.some(m => m.materialId === materialId && m.sourceBatchNo === batchNo))
  return { lots }
}

export function traceCustomer(state: ReportState, customerId: string) {
  const lots = (state.lots || []).filter(l => l.deliveries.some(d => d.customerId === customerId))
  return { lots }
}`

if (match) {
  content = content.replace(match[0], newTraces)
  fs.writeFileSync('apps/web/lib/erp/domain/reports.ts', content)
}

