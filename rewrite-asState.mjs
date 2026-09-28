import * as fs from 'fs'

let content = fs.readFileSync('apps/web/server/erp/store.ts', 'utf8')

const newAsState = `function asState(value: unknown): ErpState {
  if (!value || typeof value !== 'object') throw new Error('ملف البيانات تالف')
  let state = value as any

  if (state.schemaVersion === 1) {
    // Migrate v1 to v2
    state.lots = []
    state.qualitySamples = []
    
    // Synthesize lots from completed production orders
    if (state.productionOrders) {
      for (const order of state.productionOrders) {
        if (order.status === 'COMPLETED') {
          const lotId = 'migrated-lot-' + order.id
          
          let inputKg = 0
          if (order.expected) {
             for (const e of order.expected) inputKg += e.actualQty || 0
          }
          
          state.lots.push({
            id: lotId,
            lotNo: order.outputBatch || order.number,
            productionOrderId: order.id,
            productId: order.productId,
            operatorId: state.users?.[0]?.id || 'unknown', // default operator
            manufacturedAt: order.completedAt || new Date().toISOString(),
            inputKg,
            expectedOutputKg: order.actualOutputQty,
            actualOutputQty: order.actualOutputQty,
            wasteKg: 0,
            varianceKg: 0,
            variancePct: 0,
            materials: [], // Cannot determine previous materials reliably here
            costLines: [{ type: 'RAW_MATERIAL', amount: order.totalCost }],
            totalCost: order.totalCost,
            costPerTon: order.unitCost * 1000,
            deliveries: [],
            qcStatus: 'PASSED',
            legacy: true // flagged as legacy: raw-material cost only
          })
        }
      }
    }
    
    state.schemaVersion = 2
  }

  if (state.schemaVersion !== SCHEMA_VERSION) throw new Error('إصدار بيانات المصنع غير مدعوم')
  return state as ErpState
}`

const match = content.match(/function asState\([\s\S]*?return state\n}/)
if (match) {
  content = content.replace(match[0], newAsState)
  fs.writeFileSync('apps/web/server/erp/store.ts', content)
} else {
  throw new Error("Could not find asState")
}
