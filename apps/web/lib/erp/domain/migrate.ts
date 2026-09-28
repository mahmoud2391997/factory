import { money, qty } from './money'
import type { ErpState, ProductionLot } from './types'
import { SCHEMA_VERSION } from './types'

export const LEGACY_LOT_NOTE = 'legacy: raw-material cost only'

function batchTokens(batchNo: string) {
  return batchNo.split(',').map((part) => part.trim()).filter(Boolean)
}

/** Attach invoice and withdrawal lines to lots created in this pass. A line that names several batches is split evenly. */
function attributeLotDeliveries(state: ErpState, freshLotNos: Set<string>) {
  const lots = (state.lots ?? []).filter((lot) => freshLotNos.has(lot.lotNo))
  const byNo = new Map(lots.map((lot) => [lot.lotNo, lot]))
  const push = (
    batchNo: string,
    lineQty: number,
    base: { invoiceId?: string; withdrawalId?: string; customerId?: string; at: string },
  ) => {
    const tokens = batchTokens(batchNo || '')
    if (tokens.length === 0) return
    const known = tokens.filter((token) => byNo.has(token))
    const unknown = tokens.filter((token) => !byNo.has(token))
    if (known.length === 0) return
    if (tokens.length === 1) {
      byNo.get(known[0]!)!.deliveries.push({ ...base, qty: qty(lineQty), allocation: 'exact' })
      return
    }
    const share = qty(lineQty / tokens.length)
    const unallocatedQty = unknown.length > 0 ? qty(share * unknown.length) : undefined
    const unallocatedNote =
      unknown.length > 0
        ? `كمية غير مخصصة ${unallocatedQty} كجم لأن السطر يذكر دفعات بلا سجل: ${unknown.join('، ')}`
        : 'وُزّعت الكمية بالتساوي لأن السطر يذكر عدة دفعات بلا كميات منفصلة'
    for (const token of known) {
      byNo.get(token)!.deliveries.push({
        ...base,
        qty: share,
        allocation: 'proportional',
        ...(unallocatedQty != null ? { unallocatedQty } : {}),
        unallocatedNote,
      })
    }
  }

  for (const invoice of state.invoices ?? []) {
    if (invoice.status === 'DRAFT') continue
    for (const line of invoice.lines) {
      push(line.batchNo, line.qty, { invoiceId: invoice.id, customerId: invoice.customerId, at: invoice.issuedAt })
    }
  }
  for (const withdrawal of state.withdrawals ?? []) {
    for (const line of withdrawal.lines) {
      push(line.batchNo, line.qty, { withdrawalId: withdrawal.id, at: withdrawal.at })
    }
  }
}

/** Upgrade a stored ErpState document to the current schema. v1 has no lot records. */
export function migrateErpState(state: ErpState): ErpState {
  if (state.schemaVersion != null && state.schemaVersion > SCHEMA_VERSION) {
    throw new Error('إصدار بيانات المصنع غير مدعوم')
  }
  state.lots ??= []
  state.qualitySamples ??= []
  if (!state.accounts?.some((account) => account.code === '2600')) {
    state.accounts = state.accounts ?? []
    state.accounts.push({ code: '2600', nameAr: 'مستحقات تكاليف الإنتاج', type: 'LIABILITY' })
  }
  if (state.schemaVersion === SCHEMA_VERSION) return state
  if (state.schemaVersion != null && state.schemaVersion !== 1) throw new Error('إصدار بيانات المصنع غير مدعوم')

  const freshLotNos = new Set<string>()
  for (const order of state.productionOrders ?? []) {
    if (order.status !== 'COMPLETED') continue
    if (state.lots.some((lot) => lot.productionOrderId === order.id)) continue
    const inputKg = qty((order.expected ?? []).reduce((sum, line) => sum + (line.actualQty || 0), 0))
    const wasteKg = qty((order.expected ?? []).reduce((sum, line) => sum + (line.wasteQty || 0), 0))
    const lotNo = order.outputBatch || order.number
    const totalCost = money(order.totalCost || 0)
    const lot: ProductionLot = {
      id: `migrated-lot-${order.id}`,
      lotNo,
      productionOrderId: order.id,
      productId: order.productId,
      operatorId: null,
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
      deliveries: [],
      qcStatus: 'UNTESTED',
      legacy: true,
      legacyNote: LEGACY_LOT_NOTE,
    }
    state.lots.push(lot)
    freshLotNos.add(lot.lotNo)
  }

  attributeLotDeliveries(state, freshLotNos)
  state.schemaVersion = SCHEMA_VERSION
  return state
}
