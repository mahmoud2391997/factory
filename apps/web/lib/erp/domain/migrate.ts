import { money, qty } from './money'
import type { ErpState, ProductionLot } from './types'
import { SCHEMA_VERSION } from './types'

export const LEGACY_LOT_NOTE = 'legacy: raw-material cost only'

/** Upgrade a stored ErpState document to the current schema. v1 has no lot records. */
export function migrateErpState(state: ErpState): ErpState {
  state.lots ??= []
  state.qualitySamples ??= []
  if (!state.accounts?.some((account) => account.code === '2600')) {
    state.accounts = state.accounts ?? []
    state.accounts.push({ code: '2600', nameAr: 'مستحقات تكاليف الإنتاج', type: 'LIABILITY' })
  }
  if (state.schemaVersion === SCHEMA_VERSION) return state
  if (state.schemaVersion !== 1) throw new Error('إصدار بيانات المصنع غير مدعوم')

  for (const order of state.productionOrders ?? []) {
    if (order.status !== 'COMPLETED') continue
    if (state.lots.some((lot) => lot.productionOrderId === order.id)) continue
    const inputKg = qty((order.expected ?? []).reduce((sum, line) => sum + (line.actualQty || 0), 0))
    const wasteKg = qty((order.expected ?? []).reduce((sum, line) => sum + (line.wasteQty || 0), 0))
    const lotNo = order.outputBatch || order.number
    const deliveries: ProductionLot['deliveries'] = []
    for (const invoice of state.invoices ?? []) {
      if (invoice.status === 'DRAFT') continue
      for (const line of invoice.lines) {
        const batches = line.batchNo.split(',').map((part) => part.trim()).filter(Boolean)
        if (batches.length === 1 && batches[0] === lotNo) {
          deliveries.push({
            invoiceId: invoice.id,
            customerId: invoice.customerId,
            qty: line.qty,
            at: invoice.issuedAt,
          })
        }
      }
    }
    for (const withdrawal of state.withdrawals ?? []) {
      for (const line of withdrawal.lines) {
        const batches = line.batchNo.split(',').map((part) => part.trim()).filter(Boolean)
        if (batches.length === 1 && batches[0] === lotNo) {
          deliveries.push({ withdrawalId: withdrawal.id, qty: line.qty, at: withdrawal.at })
        }
      }
    }
    const totalCost = money(order.totalCost || 0)
    state.lots.push({
      id: `migrated-lot-${order.id}`,
      lotNo,
      productionOrderId: order.id,
      productId: order.productId,
      operatorId: state.employees?.[0]?.id || order.createdBy || 'legacy',
      manufacturedAt: order.completedAt || order.createdAt,
      inputKg,
      expectedOutputKg: qty(order.actualOutputQty || 0),
      actualOutputKg: qty(order.actualOutputQty || 0),
      wasteKg,
      varianceKg: 0,
      variancePct: 0,
      materials: [],
      costLines: [{ type: 'RAW_MATERIAL', amount: totalCost }],
      totalCost,
      costPerTon: order.actualOutputQty > 0 ? money((totalCost / order.actualOutputQty) * 1000) : 0,
      deliveries,
      qcStatus: 'PASSED',
      legacy: true,
      legacyNote: LEGACY_LOT_NOTE,
    })
  }

  state.schemaVersion = SCHEMA_VERSION
  return state
}
