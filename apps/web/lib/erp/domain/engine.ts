import { applyArchive, planArchive } from './archive'
import { money, qty, round3 } from './money'
import { ALLOCATED_COST_TYPES, allocateCostType, buildLotCostLines, COST_LABEL, packagingCostLine, type CostContext } from './costing'
import { lotQcBlock, rawBatchQcBlock, releasesBlock, suggestQcResult } from './qc'
import { PERMISSIONS, type Permission, type RoleKey } from './permissions'
import type {
  Actor,
  Balance,
  Clock,
  Command,
  CommandResult,
  ErpState,
  PublicState,
  ItemType,
  JournalLine,
  LedgerType,
  Notification,
  ProductionLot,
  VatTreatment,
  WarehouseKey,
  Vehicle,
  VehicleService,
  FuelLog,
  Trip,
  Obligation,
  ObligationScheduleLine,
  ObligationPayment,
  NutritionalProfile,
  NutritionalComparison,
  SparePart,
  SparePartUsage,
  PackagingMaterial,
  PackagingConsumption,
  SupplierTemplate,
  SupplierCommunication,
  ScaleReading,
  DistributionPoint,
  DistributionClosing,
  DeliveryStep,
  InvoiceDelivery,
  UtilitiesReading,
  Machine,
  MaintenanceSchedule,
  MaintenanceRecord,
  BankTransaction,
  CustomerRecipe,
  CompanyDocument,
  Recipe,
  QualitySample,
  ProductionOrder,
} from './types'

const INVENTORY_ACCOUNT: Record<ItemType, string> = {
  MATERIAL: '1100',
  PRODUCT: '1300',
}

export function defaultClock(): Clock {
  let n = 0
  return {
    now: () => new Date().toISOString(),
    id: (prefix) => {
      n += 1
      return `${prefix}-${Date.now().toString(36)}-${n.toString(36)}`
    },
  }
}

function fail(error: string): CommandResult {
  return { ok: false, error }
}

function allow(actor: Actor, permission: string): CommandResult | null {
  if (!actor.permissions.includes(permission)) return fail('ليست لديك صلاحية لهذا الإجراء')
  return null
}

function yearOf(iso: string) {
  return iso.slice(0, 4)
}

const MUSCAT_OFFSET_MS = 4 * 60 * 60 * 1000
function monthOf(iso: string) {
  return new Date(Date.parse(iso) + MUSCAT_OFFSET_MS).toISOString().slice(0, 7)
}

function pct2(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function nextLotNo(state: ErpState, at: string) {
  const day = at.slice(0, 10).replaceAll('-', '')
  const key = `LOT-${day}`
  const next = (state.sequences[key] ?? 0) + 1
  state.sequences[key] = next
  return `LOT-${day}-${String(next).padStart(3, '0')}`
}

function supplierForBatch(state: ErpState, materialId: string, batchNo: string) {
  const receipt = state.goodsReceipts.find((item) =>
    item.lines.some((line) => line.materialId === materialId && line.batchNo === batchNo),
  )
  if (!receipt) return null
  return state.purchaseOrders.find((item) => item.id === receipt.purchaseOrderId)?.supplierId ?? null
}

function invoiceUnitPrice(state: ErpState, lot: ProductionLot, invoiceId: string) {
  const invoice = state.invoices.find((item) => item.id === invoiceId)
  if (!invoice) return 0
  const matches = (batchNo: string) => batchNo.split(',').map((part) => part.trim()).includes(lot.lotNo)
  const line =
    invoice.lines.find((item) => item.productId === lot.productId && matches(item.batchNo)) ??
    invoice.lines.find((item) => item.productId === lot.productId)
  return line?.unitPrice ?? 0
}

function refreshLotSale(state: ErpState, lot: ProductionLot) {
  let net = 0
  let sold = 0
  for (const delivery of lot.deliveries) {
    if (!delivery.invoiceId) continue
    net = money(net + delivery.qty * invoiceUnitPrice(state, lot, delivery.invoiceId))
    sold = qty(sold + delivery.qty)
  }
  if (sold <= 0) {
    delete lot.salePricePerTon
    delete lot.marginPerTon
    delete lot.marginPct
    return
  }
  lot.salePricePerTon = money((net / sold) * 1000)
  lot.marginPerTon = money(lot.salePricePerTon - lot.costPerTon)
  lot.marginPct = lot.salePricePerTon !== 0 ? money((lot.marginPerTon / lot.salePricePerTon) * 100) : 0
}

function recordLotDelivery(state: ErpState, productId: string, batchNo: string, delivery: ProductionLot['deliveries'][number]) {
  const lot = state.lots?.find((item) => item.lotNo === batchNo && item.productId === productId)
  if (!lot) return
  lot.deliveries.push(delivery)
  refreshLotSale(state, lot)
}

/** Calculate nutritional profile from recipe ingredients. */
function calculateRecipeNutrition(state: ErpState, recipe: Recipe): NutritionalProfile {
  let totalMoisture = 0
  let totalProtein = 0
  let totalAsh = 0
  let totalEnergy = 0
  let totalFat = 0
  let totalFiber = 0
  let totalCalcium = 0
  let totalPhosphorus = 0
  let totalQty = 0

  for (const item of recipe.items) {
    const material = state.materials.find((m) => m.id === item.materialId)
    if (!material?.labAnalysis) continue

    const qty = item.qty
    totalQty += qty

    // Weighted average calculation
    totalMoisture += (material.labAnalysis.moisturePct ?? 0) * qty
    totalProtein += (material.labAnalysis.proteinPct ?? 0) * qty
    totalAsh += (material.labAnalysis.ashPct ?? 0) * qty
    totalEnergy += (material.labAnalysis.energy ?? 0) * qty
    totalFat += (material.labAnalysis.fatPct ?? 0) * qty
    totalFiber += (material.labAnalysis.fiberPct ?? 0) * qty
    totalCalcium += (material.labAnalysis.calciumPct ?? 0) * qty
    totalPhosphorus += (material.labAnalysis.phosphorusPct ?? 0) * qty
  }

  if (totalQty === 0) {
    return {
      moisturePct: 0,
      proteinPct: 0,
      ashPct: 0,
      energy: 0,
      fatPct: 0,
      fiberPct: 0,
      calciumPct: 0,
      phosphorusPct: 0,
    }
  }

  return {
    moisturePct: pct2(totalMoisture / totalQty),
    proteinPct: pct2(totalProtein / totalQty),
    ashPct: pct2(totalAsh / totalQty),
    energy: pct2(totalEnergy / totalQty),
    fatPct: pct2(totalFat / totalQty),
    fiberPct: pct2(totalFiber / totalQty),
    calciumPct: pct2(totalCalcium / totalQty),
    phosphorusPct: pct2(totalPhosphorus / totalQty),
  }
}

/** Compare calculated nutrition with lab results and specifications. */
function compareNutrition(calculated: NutritionalProfile, lab?: QualitySample, spec?: { minMoisture?: number; maxMoisture?: number; minProtein?: number; maxProtein?: number; minAsh?: number; maxAsh?: number; minEnergy?: number; maxEnergy?: number; minFat?: number; maxFat?: number; minFiber?: number; maxFiber?: number; minCalcium?: number; maxCalcium?: number; minPhosphorus?: number; maxPhosphorus?: number }): NutritionalComparison[] {
  const parameters: Array<{ key: keyof NutritionalProfile; label: string; unit: string }> = [
    { key: 'moisturePct', label: 'الرطوبة', unit: '%' },
    { key: 'proteinPct', label: 'البروتين', unit: '%' },
    { key: 'ashPct', label: 'الرماد', unit: '%' },
    { key: 'energy', label: 'الطاقة', unit: 'MJ/kg' },
    { key: 'fatPct', label: 'الدهون', unit: '%' },
    { key: 'fiberPct', label: 'الألياف', unit: '%' },
    { key: 'calciumPct', label: 'الكالسيوم', unit: '%' },
    { key: 'phosphorusPct', label: 'الفوسفور', unit: '%' },
  ]

  return parameters.map(({ key, label, unit }) => {
    const calculatedValue = calculated[key]
    const labValue = lab ? (lab as any)[key] : undefined
    const specMin = spec ? (spec as any)[`min${key.charAt(0).toUpperCase() + key.slice(1).replace('Pct', '')}`] : undefined
    const specMax = spec ? (spec as any)[`max${key.charAt(0).toUpperCase() + key.slice(1).replace('Pct', '')}`] : undefined

    const variance = labValue !== undefined ? pct2(labValue - calculatedValue) : undefined
    const inSpec = labValue !== undefined && specMin !== undefined && specMax !== undefined
      ? labValue >= specMin && labValue <= specMax
      : true

    return {
      parameter: label,
      calculated: calculatedValue,
      lab: labValue,
      specMin,
      specMax,
      variance,
      inSpec,
    }
  })
}

/** Automatically match bank transaction to invoice, supplier, or expense. */
function autoMatchBankTransaction(state: ErpState, transaction: BankTransaction): { type: 'INVOICE' | 'SUPPLIER' | 'EXPENSE'; id: string } | null {
  if (transaction.type === 'CREDIT') {
    // Try to match with customer payment
    for (const invoice of state.invoices) {
      if (invoice.status === 'PAID') continue
      const customer = state.customers.find((c) => c.id === invoice.customerId)
      if (!customer) continue
      // Match by customer name in description or approximate amount
      if (transaction.description.includes(customer.nameAr) || Math.abs(transaction.amount - (invoice.total - invoice.paidAmount)) < 1) {
        return { type: 'INVOICE', id: invoice.id }
      }
    }
  } else if (transaction.type === 'DEBIT') {
    // Try to match with supplier payment
    for (const supplier of state.suppliers) {
      if (transaction.description.includes(supplier.nameAr)) {
        return { type: 'SUPPLIER', id: supplier.id }
      }
    }
    // Try to match with expense
    for (const expense of state.expenses) {
      if (expense.status === 'POSTED') continue
      if (transaction.description.includes(expense.description) || Math.abs(transaction.amount - expense.total) < 1) {
        return { type: 'EXPENSE', id: expense.id }
      }
    }
  }
  return null
}

/** Calculate landed cost including transport. Freight is spread over the tonnage carried in the receipt's month. */
function calculateLandedCost(state: ErpState, materialId: string, batchNo: string): number {
  const balance = state.balances.find((b) => b.itemId === materialId && b.batchNo === batchNo && b.itemType === 'MATERIAL')
  if (!balance) return 0

  const materialCost = balance.unitCost
  const receipt = state.goodsReceipts.find((r) => r.lines.some((l) => l.materialId === materialId && l.batchNo === batchNo))
  if (!receipt) return materialCost

  const line = receipt.lines.find((l) => l.materialId === materialId && l.batchNo === batchNo)
  const lineQty = line?.qty ?? 0
  if (lineQty <= 0) return materialCost

  // Inbound trips (no invoice) in the receipt's month, spread over the tonnage they carried.
  const month = monthOf(receipt.at)
  const trips = state.trips.filter((trip) => !trip.invoiceId && monthOf(trip.date) === month)
  const tripCost = money(trips.reduce((sum, trip) => sum + trip.cost, 0))
  const carriedTons = qty(trips.reduce((sum, trip) => sum + trip.loadKg / 1000, 0))
  if (tripCost <= 0 || carriedTons <= 0) return materialCost

  const allocatedTotal = money((tripCost / carriedTons) * (lineQty / 1000))
  return money(materialCost + allocatedTotal / lineQty)
}

function nextNumber(state: ErpState, docType: string, at: string) {
  const key = `${docType}-${yearOf(at)}`
  const current = state.sequences[key] ?? 0
  const next = current + 1
  state.sequences[key] = next
  return `${docType}-${yearOf(at)}-${String(next).padStart(3, '0')}`
}

function audit(state: ErpState, actor: Actor, clock: Clock, action: string, entity: string, entityId: string, detail: string) {
  state.auditLogs.unshift({
    id: clock.id('aud'),
    at: clock.now(),
    userId: actor.id,
    userName: actor.name,
    action,
    entity,
    entityId,
    detail,
  })
  if (state.auditLogs.length > 1000) state.auditLogs.length = 1000
}

function notify(
  state: ErpState,
  clock: Clock,
  kind: Notification['kind'],
  title: string,
  body: string,
  roles: RoleKey[],
  dedupeKey: string,
) {
  if (dedupeKey && state.notifications.some((item) => !item.read && item.dedupeKey === dedupeKey)) return
  state.notifications.unshift({
    id: clock.id('ntf'),
    kind,
    title,
    body,
    dedupeKey,
    roles,
    read: false,
    emailStatus: 'pending',
    at: clock.now(),
  })
  if (state.notifications.length > 300) state.notifications.length = 300
}

function postJournal(
  state: ErpState,
  clock: Clock,
  memo: string,
  refType: string,
  refId: string,
  lines: JournalLine[],
) {
  const cleaned = lines
    .map((line) => ({
      accountCode: line.accountCode,
      debit: money(line.debit),
      credit: money(line.credit),
    }))
    .filter((line) => line.debit > 0 || line.credit > 0)
  const debit = money(cleaned.reduce((sum, line) => sum + line.debit, 0))
  const credit = money(cleaned.reduce((sum, line) => sum + line.credit, 0))
  if (Math.abs(debit - credit) > 0.001) {
    throw new Error(`قيد غير متوازن: مدين ${debit} دائن ${credit}`)
  }
  if (cleaned.length === 0) return
  const at = clock.now()
  state.journals.unshift({
    id: clock.id('je'),
    number: nextNumber(state, 'JE', at),
    at,
    memo,
    refType,
    refId,
    lines: cleaned,
  })
}

function vatAmount(net: number, treatment: VatTreatment, ratePct: number) {
  if (treatment !== 'STANDARD') return 0
  return money(net * (ratePct / 100))
}

function findMaterial(state: ErpState, id: string) {
  return state.materials.find((item) => item.id === id && item.active)
}

function findProduct(state: ErpState, id: string) {
  return state.products.find((item) => item.id === id && item.active)
}

function itemName(state: ErpState, itemType: ItemType, itemId: string) {
  if (itemType === 'MATERIAL') return state.materials.find((item) => item.id === itemId)?.nameAr ?? itemId
  return state.products.find((item) => item.id === itemId)?.nameAr ?? itemId
}

/**
 * Weighted-average cost of a raw material across every warehouse that still holds it.
 * Falls back to the most recent purchase price so a recipe can be costed before the first receipt.
 */
function materialUnitCost(state: ErpState, materialId: string) {
  const rows = state.balances.filter((row) => row.itemType === 'MATERIAL' && row.itemId === materialId && row.qty > 0)
  const totalQty = rows.reduce((sum, row) => sum + row.qty, 0)
  if (totalQty > 0) return money(rows.reduce((sum, row) => sum + row.qty * row.unitCost, 0) / totalQty)
  const receipt = state.goodsReceipts.find((item) => item.lines.some((line) => line.materialId === materialId))
  const line = receipt?.lines.find((entry) => entry.materialId === materialId)
  return line ? money(line.unitCost) : 0
}

function onHand(state: ErpState, warehouse: WarehouseKey, itemType: ItemType, itemId: string, batchNo?: string) {
  return qty(
    state.balances
      .filter(
        (row) =>
          row.warehouse === warehouse &&
          row.itemType === itemType &&
          row.itemId === itemId &&
          (batchNo ? row.batchNo === batchNo : true),
      )
      .reduce((sum, row) => sum + row.qty, 0),
  )
}

function upsertBalance(
  state: ErpState,
  clock: Clock,
  input: {
    warehouse: WarehouseKey
    itemType: ItemType
    itemId: string
    batchNo: string
    qtyDelta: number
    unitCost: number
    expiryDate?: string | null
    receivedAt?: string
  },
) {
  let row = state.balances.find(
    (item) =>
      item.warehouse === input.warehouse &&
      item.itemType === input.itemType &&
      item.itemId === input.itemId &&
      item.batchNo === input.batchNo,
  )
  if (!row) {
    row = {
      id: clock.id('bal'),
      warehouse: input.warehouse,
      itemType: input.itemType,
      itemId: input.itemId,
      batchNo: input.batchNo,
      qty: 0,
      unitCost: money(input.unitCost),
      expiryDate: input.expiryDate ?? null,
      receivedAt: input.receivedAt ?? clock.now(),
    }
    state.balances.push(row)
  }
  const prev = row.qty
  const next = qty(row.qty + input.qtyDelta)
  if (next < -0.0001) return { error: 'الكمية غير كافية في المستودع' as const, prev, row }
  if (input.qtyDelta > 0) {
    const incoming = input.qtyDelta
    const cost = input.unitCost
    row.unitCost = prev + incoming === 0 ? money(cost) : money((prev * row.unitCost + incoming * cost) / (prev + incoming))
    if (input.expiryDate) row.expiryDate = input.expiryDate
  }
  row.qty = next
  return { prev, next, row }
}

function addLedger(
  state: ErpState,
  clock: Clock,
  actor: Actor,
  input: {
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
    notes?: string
  },
) {
  state.ledger.unshift({
    id: clock.id('led'),
    at: clock.now(),
    type: input.type,
    warehouse: input.warehouse,
    itemType: input.itemType,
    itemId: input.itemId,
    batchNo: input.batchNo,
    qty: qty(input.qty),
    unitCost: money(input.unitCost),
    prevQty: qty(input.prevQty),
    newQty: qty(input.newQty),
    refType: input.refType,
    refId: input.refId,
    userId: actor.id,
    notes: input.notes ?? '',
  })
}

function issueBatch(
  state: ErpState,
  clock: Clock,
  actor: Actor,
  input: {
    warehouse: WarehouseKey
    itemType: ItemType
    itemId: string
    batchNo: string
    qty: number
    type: LedgerType
    refType: string
    refId: string
  },
) {
  const row = state.balances.find(
    (item) =>
      item.warehouse === input.warehouse &&
      item.itemType === input.itemType &&
      item.itemId === input.itemId &&
      item.batchNo === input.batchNo &&
      item.qty > 0,
  )
  if (!row || row.qty + 0.0001 < input.qty) {
    return { error: `الرصيد غير كافٍ للدفعة ${input.batchNo}` }
  }
  const prev = row.qty
  row.qty = qty(row.qty - input.qty)
  addLedger(state, clock, actor, {
    type: input.type,
    warehouse: input.warehouse,
    itemType: input.itemType,
    itemId: input.itemId,
    batchNo: input.batchNo,
    qty: -input.qty,
    unitCost: row.unitCost,
    prevQty: prev,
    newQty: row.qty,
    refType: input.refType,
    refId: input.refId,
  })
  return { unitCost: row.unitCost, cost: money(input.qty * row.unitCost) }
}

function fifoIssue(
  state: ErpState,
  clock: Clock,
  actor: Actor,
  input: {
    warehouse: WarehouseKey
    itemType: ItemType
    itemId: string
    qty: number
    type: LedgerType
    refType: string
    refId: string
  },
) {
  const needQty = qty(input.qty)
  const available = onHand(state, input.warehouse, input.itemType, input.itemId)
  if (available + 0.0001 < needQty) {
    return { error: `الرصيد غير كافٍ في المستودع (${available} متاح / ${needQty} مطلوب)` }
  }
  const rows = state.balances
    .filter(
      (item) =>
        item.warehouse === input.warehouse &&
        item.itemType === input.itemType &&
        item.itemId === input.itemId &&
        item.qty > 0,
    )
    .slice()
    .sort((a, b) => a.receivedAt.localeCompare(b.receivedAt) || a.batchNo.localeCompare(b.batchNo))
  let left = needQty
  let cost = 0
  const lines: Array<{ batchNo: string; qty: number; unitCost: number }> = []
  for (const row of rows) {
    if (left <= 0) break
    if (input.itemType === 'MATERIAL' && input.type === 'PRODUCTION_CONSUMPTION') {
      const blocked = rawBatchQcBlock(state, input.itemId, row.batchNo)
      if (blocked) return { error: blocked }
    }
    if (input.itemType === 'PRODUCT' && (input.type === 'SALE' || input.type === 'WITHDRAWAL')) {
      const blocked = lotQcBlock(state, row.batchNo)
      if (blocked) return { error: blocked }
    }
    const take = qty(Math.min(row.qty, left))
    const issued = issueBatch(state, clock, actor, {
      warehouse: input.warehouse,
      itemType: input.itemType,
      itemId: input.itemId,
      batchNo: row.batchNo,
      qty: take,
      type: input.type,
      refType: input.refType,
      refId: input.refId,
    })
    if ('error' in issued && issued.error) return { error: issued.error }
    if (!('error' in issued)) {
      cost = money(cost + issued.cost)
      lines.push({ batchNo: row.batchNo, qty: take, unitCost: issued.unitCost })
      left = qty(left - take)
    }
  }
  if (left > 0.001) return { error: 'تعذر صرف الكمية بالكامل' }
  return { cost, lines }
}

function refreshAlerts(state: ErpState, clock: Clock) {
  const today = clock.now().slice(0, 10)
  for (const material of state.materials) {
    if (!material.active) continue
    const total = qty(
      state.balances
        .filter((row) => row.itemType === 'MATERIAL' && row.itemId === material.id)
        .reduce((sum, row) => sum + row.qty, 0),
    )
    const dedupeKey = `low:${material.id}`
    if (total <= material.minQty) {
      notify(
        state,
        clock,
        'LOW_STOCK',
        `مخزون منخفض: ${material.nameAr}`,
        `الرصيد ${total} ${material.unit} والحد الأدنى ${material.minQty}.`,
        ['GM', 'OPERATIONS'],
        dedupeKey,
      )
    } else {
      for (const note of state.notifications) {
        if (note.dedupeKey === dedupeKey && !note.read) note.read = true
      }
    }
  }
  const horizon = new Date(clock.now())
  horizon.setUTCDate(horizon.getUTCDate() + 30)
  const horizonIso = horizon.toISOString().slice(0, 10)
  for (const row of state.balances) {
    if (!row.expiryDate || row.qty <= 0) continue
    if (row.expiryDate <= horizonIso) {
      notify(
        state,
        clock,
        'EXPIRY',
        `دفعة قاربت الانتهاء: ${row.batchNo}`,
        `${itemName(state, row.itemType, row.itemId)} — الصلاحية ${row.expiryDate} والكمية ${row.qty}.`,
        ['GM', 'OPERATIONS'],
        `exp:${row.batchNo}:${today}`,
      )
    }
  }
  // QC specification alerts for finished products
  for (const lot of state.lots ?? []) {
    if (!lot.qcStatus || lot.qcStatus === 'UNTESTED') continue
    const product = state.products.find((p) => p.id === lot.productId)
    if (!product?.qcLimits) continue

    const latestSample = state.qualitySamples
      .filter((s) => s.lotNo === lot.lotNo && s.type === 'FINISHED_PRODUCT')
      .sort((a, b) => b.sampledAt.localeCompare(a.sampledAt))[0]

    if (!latestSample || latestSample.result === 'PENDING') continue

    const { minMoisture, maxMoisture, minProtein, maxProtein, minAsh, maxAsh, minEnergy, maxEnergy, minFat, maxFat, minFiber, maxFiber, minCalcium, maxCalcium, minPhosphorus, maxPhosphorus } = product.qcLimits

    const violations: string[] = []
    if (minMoisture !== undefined && (latestSample.moisturePct ?? 0) < minMoisture) violations.push(`الرطوبة ${latestSample.moisturePct}% < ${minMoisture}%`)
    if (maxMoisture !== undefined && (latestSample.moisturePct ?? 0) > maxMoisture) violations.push(`الرطوبة ${latestSample.moisturePct}% > ${maxMoisture}%`)
    if (minProtein !== undefined && (latestSample.proteinPct ?? 0) < minProtein) violations.push(`البروتين ${latestSample.proteinPct}% < ${minProtein}%`)
    if (maxProtein !== undefined && (latestSample.proteinPct ?? 0) > maxProtein) violations.push(`البروتين ${latestSample.proteinPct}% > ${maxProtein}%`)
    if (minAsh !== undefined && (latestSample.ashPct ?? 0) < minAsh) violations.push(`الرماد ${latestSample.ashPct}% < ${minAsh}%`)
    if (maxAsh !== undefined && (latestSample.ashPct ?? 0) > maxAsh) violations.push(`الرماد ${latestSample.ashPct}% > ${maxAsh}%`)
    if (minEnergy !== undefined && (latestSample.energy ?? 0) < minEnergy) violations.push(`الطاقة ${latestSample.energy} < ${minEnergy}`)
    if (maxEnergy !== undefined && (latestSample.energy ?? 0) > maxEnergy) violations.push(`الطاقة ${latestSample.energy} > ${maxEnergy}`)
    if (minFat !== undefined && (latestSample.fatPct ?? 0) < minFat) violations.push(`الدهون ${latestSample.fatPct}% < ${minFat}%`)
    if (maxFat !== undefined && (latestSample.fatPct ?? 0) > maxFat) violations.push(`الدهون ${latestSample.fatPct}% > ${maxFat}%`)
    if (minFiber !== undefined && (latestSample.fiberPct ?? 0) < minFiber) violations.push(`الألياف ${latestSample.fiberPct}% < ${minFiber}%`)
    if (maxFiber !== undefined && (latestSample.fiberPct ?? 0) > maxFiber) violations.push(`الألياف ${latestSample.fiberPct}% > ${maxFiber}%`)
    if (minCalcium !== undefined && (latestSample.calciumPct ?? 0) < minCalcium) violations.push(`الكالسيوم ${latestSample.calciumPct}% < ${minCalcium}%`)
    if (maxCalcium !== undefined && (latestSample.calciumPct ?? 0) > maxCalcium) violations.push(`الكالسيوم ${latestSample.calciumPct}% > ${maxCalcium}%`)
    if (minPhosphorus !== undefined && (latestSample.phosphorusPct ?? 0) < minPhosphorus) violations.push(`الفوسفور ${latestSample.phosphorusPct}% < ${minPhosphorus}%`)
    if (maxPhosphorus !== undefined && (latestSample.phosphorusPct ?? 0) > maxPhosphorus) violations.push(`الفوسفور ${latestSample.phosphorusPct}% > ${maxPhosphorus}%`)

    if (violations.length > 0) {
      notify(
        state,
        clock,
        'QC',
        `خرق مواصفات الجودة: ${lot.lotNo}`,
        `${product.nameAr}: ${violations.join(', ')}`,
        ['GM', 'QUALITY'],
        `qc:${lot.id}:${today}`,
      )
    }
  }
  refreshDocumentAlerts(state, clock, today)
  refreshEntityAlerts(state, clock, today)
  refreshObligationAlerts(state, clock)
}

function cloneState(state: ErpState): ErpState {
  return structuredClone(state)
}

function ok(state: ErpState, message: string, extra?: Record<string, unknown>): CommandResult {
  return { ok: true, state, message, extra }
}

export function applyCommand(source: ErpState, actor: Actor, command: Command, clock: Clock = defaultClock()): CommandResult {
  const denied = authorize(actor, command)
  if (denied) return denied
  const state = cloneState(source)
  try {
    const result = run(state, actor, command, clock)
    if (!result.ok) return result
    refreshAlerts(result.state, clock)
    return result
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'تعذر تنفيذ العملية')
  }
}

function authorize(actor: Actor, command: Command): CommandResult | null {
  if (actor.mustChangePassword) {
    if (command.action === 'setUserPassword' && command.input.userId === actor.id) return null
    return fail('يجب تغيير كلمة المرور قبل استخدام النظام')
  }
  const map: Record<Command['action'], string> = {
    createMaterial: 'inventory.read',
    createProduct: 'production.read',
    createSupplier: 'purchasing.po.create',
    createCustomer: 'sales.create',
    createEmployee: 'employees.manage',
    updateEmployee: 'employees.manage',
    createRecipe: 'production.create',
    setVarianceThresholds: 'production.variance.thresholds',
    updateCompany: 'settings.update',
    fundBank: 'settings.update',
    createPurchaseOrder: 'purchasing.po.create',
    decidePurchaseOrder: 'purchasing.po.approve',
    receiveGoods: 'purchasing.gr.create',
    transferStock: 'inventory.transfer.create',
    requestAdjustment: 'inventory.adjust',
    decideAdjustment: 'approvals.decide',
    createProductionOrder: 'production.create',
    completeProduction: 'production.complete',
    decideProductionCost: 'production.cost.approve',
    recalculateLotCosts: 'production.cost.recalculate',
    createInvoice: 'sales.create',
    confirmInvoice: 'sales.confirm',
    recordPayment: 'sales.payments.manage',
    createWithdrawal: 'sales.create',
    createExpense: 'expenses.manage',
    decideExpense: 'expenses.approve',
    recordAttendance: 'attendance.manage',
    importAttendance: 'attendance.manage',
    createPayroll: 'payroll.manage',
    decidePayroll: 'payroll.approve',
    payPayroll: 'payroll.pay',
    markNotificationRead: 'notifications.read',
    scanBarcode: 'barcode.scan',
    setRolePermissions: 'users.manage',
    setUserPassword: 'users.manage',
    archiveHistory: 'settings.update',
    createQualitySample: 'qc.manage',
    updateQualityResult: 'qc.manage',
    setQcLimits: 'qc.limits',
    createVehicle: 'fleet.manage',
    updateVehicle: 'fleet.manage',
    addFuelLog: 'fleet.manage',
    addVehicleService: 'fleet.manage',
    createTrip: 'fleet.manage',
    createObligation: 'obligations.manage',
    decideObligation: 'approvals.decide',
    payObligationInstallment: 'obligations.pay',
    createCompanyDocument: 'documents.manage',
    renewCompanyDocument: 'documents.manage',
    createSparePart: 'spareparts.manage',
    recordSparePartUsage: 'spareparts.manage',
    createPackagingMaterial: 'packaging.manage',
    recordPackagingConsumption: 'packaging.manage',
    createSupplierTemplate: 'suppliers.communicate',
    sendSupplierCommunication: 'suppliers.communicate',
    approveSupplierCommunication: 'suppliers.approve',
    recordScaleReading: 'scale.manage',
    createDistributionPoint: 'distribution.manage',
    closeDistributionDay: 'distribution.manage',
    advanceInvoiceDelivery: 'delivery.track',
    recordUtilitiesReading: 'utilities.manage',
    createMachine: 'maintenance.manage',
    createMaintenanceSchedule: 'maintenance.manage',
    recordMaintenance: 'maintenance.manage',
    recordBankTransaction: 'bank.manage',
    matchBankTransaction: 'bank.manage',
    createCustomerRecipe: 'recipes.custom',
    setCustomerPricing: 'pricing.custom',
    setAlternativeBagWeights: 'production.create',
  }
  return allow(actor, map[command.action])
}

function run(state: ErpState, actor: Actor, command: Command, clock: Clock): CommandResult {
  switch (command.action) {
    case 'createMaterial':
      return createMaterial(state, actor, command.input, clock)
    case 'createProduct':
      return createProduct(state, actor, command.input, clock)
    case 'createSupplier':
      return createParty(state, actor, 'suppliers', command.input, clock)
    case 'createCustomer':
      return createParty(state, actor, 'customers', command.input, clock)
    case 'createEmployee':
      return createEmployee(state, actor, command.input, clock)
    case 'updateEmployee':
      return updateEmployee(state, actor, command.input, clock)
    case 'createRecipe':
      return createRecipe(state, actor, command.input, clock)
    case 'setVarianceThresholds':
      return setVarianceThresholds(state, actor, command.input, clock)
    case 'updateCompany':
      return updateCompany(state, actor, command.input, clock)
    case 'fundBank':
      return fundBank(state, actor, command.input, clock)
    case 'createPurchaseOrder':
      return createPurchaseOrder(state, actor, command.input, clock)
    case 'decidePurchaseOrder':
      return decidePurchaseOrder(state, actor, command.input, clock)
    case 'receiveGoods':
      return receiveGoods(state, actor, command.input, clock)
    case 'transferStock':
      return transferStock(state, actor, command.input, clock)
    case 'requestAdjustment':
      return requestAdjustment(state, actor, command.input, clock)
    case 'decideAdjustment':
      return decideAdjustment(state, actor, command.input, clock)
    case 'createProductionOrder':
      return createProductionOrder(state, actor, command.input, clock)
    case 'completeProduction':
      return completeProduction(state, actor, command.input, clock)
    case 'decideProductionCost':
      return decideProductionCost(state, actor, command.input, clock)
    case 'recalculateLotCosts':
      return recalculateLotCosts(state, actor, command.input, clock)
    case 'createInvoice':
      return createInvoice(state, actor, command.input, clock)
    case 'confirmInvoice':
      return confirmInvoice(state, actor, command.input, clock)
    case 'recordPayment':
      return recordPayment(state, actor, command.input, clock)
    case 'createWithdrawal':
      return createWithdrawal(state, actor, command.input, clock)
    case 'createExpense':
      return createExpense(state, actor, command.input, clock)
    case 'decideExpense':
      return decideExpense(state, actor, command.input, clock)
    case 'recordAttendance':
      return recordAttendance(state, actor, command.input, clock)
    case 'importAttendance':
      return importAttendance(state, actor, command.input, clock)
    case 'createPayroll':
      return createPayroll(state, actor, command.input, clock)
    case 'decidePayroll':
      return decidePayroll(state, actor, command.input, clock)
    case 'payPayroll':
      return payPayroll(state, actor, command.input, clock)
    case 'markNotificationRead':
      return markNotificationRead(state, actor, command.input, clock)
    case 'scanBarcode':
      return scanBarcode(state, actor, command.input, clock)
    case 'setRolePermissions':
      return setRolePermissions(state, actor, command.input, clock)
    case 'setUserPassword':
      return setUserPassword(state, actor, command.input, clock)
    case 'archiveHistory':
      return archiveHistory(state, actor, command.input, clock)
    case 'createQualitySample':
      return createQualitySample(state, actor, command.input, clock)
    case 'updateQualityResult':
      return updateQualityResult(state, actor, command.input, clock)
    case 'setQcLimits':
      return setQcLimits(state, actor, command.input, clock)
    case 'createVehicle':
      return createVehicle(state, actor, command.input, clock)
    case 'updateVehicle':
      return updateVehicle(state, actor, command.input, clock)
    case 'addFuelLog':
      return addFuelLog(state, actor, command.input, clock)
    case 'addVehicleService':
      return addVehicleService(state, actor, command.input, clock)
    case 'createTrip':
      return createTrip(state, actor, command.input, clock)
    case 'createObligation':
      return createObligation(state, actor, command.input, clock)
    case 'decideObligation':
      return decideObligation(state, actor, command.input, clock)
    case 'payObligationInstallment':
      return payObligationInstallment(state, actor, command.input, clock)
    case 'createCompanyDocument':
      return createCompanyDocument(state, actor, command.input, clock)
    case 'renewCompanyDocument':
      return renewCompanyDocument(state, actor, command.input, clock)
    case 'createSparePart':
      return createSparePart(state, actor, command.input, clock)
    case 'recordSparePartUsage':
      return recordSparePartUsage(state, actor, command.input, clock)
    case 'createPackagingMaterial':
      return createPackagingMaterial(state, actor, command.input, clock)
    case 'recordPackagingConsumption':
      return recordPackagingConsumption(state, actor, command.input, clock)
    case 'createSupplierTemplate':
      return createSupplierTemplate(state, actor, command.input, clock)
    case 'sendSupplierCommunication':
      return sendSupplierCommunication(state, actor, command.input, clock)
    case 'approveSupplierCommunication':
      return approveSupplierCommunication(state, actor, command.input, clock)
    case 'recordScaleReading':
      return recordScaleReading(state, actor, command.input, clock)
    case 'createDistributionPoint':
      return createDistributionPoint(state, actor, command.input, clock)
    case 'closeDistributionDay':
      return closeDistributionDay(state, actor, command.input, clock)
    case 'advanceInvoiceDelivery':
      return advanceInvoiceDelivery(state, actor, command.input, clock)
    case 'recordUtilitiesReading':
      return recordUtilitiesReading(state, actor, command.input, clock)
    case 'createMachine':
      return createMachine(state, actor, command.input, clock)
    case 'createMaintenanceSchedule':
      return createMaintenanceSchedule(state, actor, command.input, clock)
    case 'recordMaintenance':
      return recordMaintenance(state, actor, command.input, clock)
    case 'recordBankTransaction':
      return recordBankTransaction(state, actor, command.input, clock)
    case 'matchBankTransaction':
      return matchBankTransaction(state, actor, command.input, clock)
    case 'createCustomerRecipe':
      return createCustomerRecipe(state, actor, command.input, clock)
    case 'setCustomerPricing':
      return setCustomerPricing(state, actor, command.input, clock)
    case 'setAlternativeBagWeights':
      return setAlternativeBagWeights(state, actor, command.input, clock)
    default:
      return fail('إجراء غير معروف')
  }
}

function createMaterial(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createMaterial' }>['input'], clock: Clock): CommandResult {
  const code = input.code.trim().toUpperCase()
  if (!code || !input.nameAr.trim()) return fail('كود المادة والاسم مطلوبان')
  if (state.materials.some((item) => item.code === code)) return fail('كود المادة مستخدم')
  if (input.minQty < 0) return fail('الحد الأدنى غير صحيح')
  const material = {
    id: clock.id('mat'),
    code,
    nameAr: input.nameAr.trim(),
    category: input.category.trim() || 'عام',
    unit: input.unit?.trim() || 'كجم',
    minQty: qty(input.minQty),
    vatTreatment: input.vatTreatment ?? 'STANDARD',
    barcode: (input.barcode || code).trim(),
    active: true,
  }
  state.materials.unshift(material)
  audit(state, actor, clock, 'إنشاء مادة', 'material', material.id, material.nameAr)
  return ok(state, 'تم حفظ المادة الخام')
}

function createProduct(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createProduct' }>['input'], clock: Clock): CommandResult {
  const code = input.code.trim().toUpperCase()
  if (!code || !input.nameAr.trim()) return fail('كود المنتج والاسم مطلوبان')
  if (state.products.some((item) => item.code === code)) return fail('كود المنتج مستخدم')
  if (input.salePrice < 0) return fail('سعر البيع غير صحيح')
  const varianceInvalid =
    bounded(input.varianceWarningPct, 0, 100, 'حد الانحراف التحذيري يجب أن يكون بين 0 و 100') ||
    bounded(input.varianceCriticalPct, 0, 100, 'حد الانحراف الحرج يجب أن يكون بين 0 و 100')
  if (varianceInvalid) return fail(varianceInvalid)
  const product = {
    id: clock.id('prd'),
    code,
    nameAr: input.nameAr.trim(),
    unit: input.unit?.trim() || 'كجم',
    salePrice: money(input.salePrice),
    vatTreatment: input.vatTreatment ?? 'STANDARD',
    barcode: (input.barcode || code).trim(),
    bagKg: qty(input.bagKg ?? 50),
    active: true,
    ...(input.varianceWarningPct != null ? { varianceWarningPct: round3(input.varianceWarningPct) } : {}),
    ...(input.varianceCriticalPct != null ? { varianceCriticalPct: round3(input.varianceCriticalPct) } : {}),
  }
  state.products.unshift(product)
  audit(state, actor, clock, 'إنشاء منتج', 'product', product.id, product.nameAr)
  return ok(state, 'تم حفظ المنتج النهائي')
}

function createParty(
  state: ErpState,
  actor: Actor,
  kind: 'suppliers' | 'customers',
  input: { nameAr: string; vatNumber?: string; phone?: string; email?: string; address?: string },
  clock: Clock,
): CommandResult {
  if (!input.nameAr.trim()) return fail('الاسم مطلوب')
  const list = state[kind]
  const prefix = kind === 'suppliers' ? 'S' : 'C'
  const party = {
    id: clock.id(prefix.toLowerCase()),
    code: `${prefix}-${String(list.length + 1).padStart(3, '0')}`,
    nameAr: input.nameAr.trim(),
    vatNumber: input.vatNumber?.trim() ?? '',
    phone: input.phone?.trim() ?? '',
    email: input.email?.trim() ?? '',
    address: input.address?.trim() ?? '',
  }
  list.unshift(party)
  audit(state, actor, clock, kind === 'suppliers' ? 'إنشاء مورد' : 'إنشاء عميل', kind, party.id, party.nameAr)
  return ok(state, kind === 'suppliers' ? 'تم حفظ المورد' : 'تم حفظ العميل')
}

function createEmployee(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createEmployee' }>['input'], clock: Clock): CommandResult {
  if (!input.nameAr.trim()) return fail('اسم الموظف مطلوب')
  if (input.basicSalary < 0) return fail('الراتب غير صحيح')
  const employee = {
    id: clock.id('emp'),
    code: `EMP-${String(state.employees.length + 1).padStart(3, '0')}`,
    nameAr: input.nameAr.trim(),
    department: input.department.trim() || 'عام',
    jobTitle: input.jobTitle.trim() || 'موظف',
    basicSalary: money(input.basicSalary),
    active: true,
  }
  state.employees.unshift(employee)
  audit(state, actor, clock, 'إنشاء موظف', 'employee', employee.id, employee.nameAr)
  return ok(state, 'تم حفظ الموظف')
}

function updateEmployee(state: ErpState, actor: Actor, input: Extract<Command, { action: 'updateEmployee' }>['input'], clock: Clock): CommandResult {
  const employee = state.employees.find((item) => item.id === input.id)
  if (!employee) return fail('الموظف غير موجود')
  for (const date of [input.idExpiryDate, input.residenceExpiryDate, input.contractExpiryDate]) {
    if (date !== undefined && !isDay(date)) return fail('تاريخ الانتهاء غير صحيح')
  }
  if (input.basicSalary !== undefined && input.basicSalary < 0) return fail('الراتب غير صحيح')
  if (input.nameAr !== undefined) {
    if (!input.nameAr.trim()) return fail('اسم الموظف مطلوب')
    employee.nameAr = input.nameAr.trim()
  }
  if (input.department !== undefined) employee.department = input.department.trim() || employee.department
  if (input.jobTitle !== undefined) employee.jobTitle = input.jobTitle.trim() || employee.jobTitle
  if (input.basicSalary !== undefined) employee.basicSalary = money(input.basicSalary)
  if (input.active !== undefined) employee.active = input.active
  if (input.idExpiryDate !== undefined) employee.idExpiryDate = input.idExpiryDate
  if (input.residenceExpiryDate !== undefined) employee.residenceExpiryDate = input.residenceExpiryDate
  if (input.contractExpiryDate !== undefined) employee.contractExpiryDate = input.contractExpiryDate
  audit(state, actor, clock, 'تحديث ملف موظف', 'employee', employee.id, employee.nameAr)
  return ok(state, 'تم تحديث الموظف')
}

function createRecipe(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createRecipe' }>['input'], clock: Clock): CommandResult {
  if (!findProduct(state, input.productId)) return fail('المنتج غير موجود')
  if (input.baseOutputQty <= 0) return fail('كمية المخرجات الأساسية يجب أن تكون أكبر من صفر')
  if (input.items.length === 0) return fail('أضف مكونات الوصفة')
  for (const item of input.items) {
    if (!findMaterial(state, item.materialId)) return fail('إحدى المواد غير موجودة')
    if (item.qty <= 0) return fail('كمية المكوّن يجب أن تكون أكبر من صفر')
  }
  const varianceInvalid =
    bounded(input.varianceWarningPct, 0, 100, 'حد الانحراف التحذيري يجب أن يكون بين 0 و 100') ||
    bounded(input.varianceCriticalPct, 0, 100, 'حد الانحراف الحرج يجب أن يكون بين 0 و 100')
  if (varianceInvalid) return fail(varianceInvalid)
  const recipe = {
    id: clock.id('rcp'),
    productId: input.productId,
    nameAr: input.nameAr.trim() || 'وصفة',
    baseOutputQty: qty(input.baseOutputQty),
    items: input.items.map((item) => ({ materialId: item.materialId, qty: qty(item.qty) })),
    ...(input.varianceWarningPct != null ? { varianceWarningPct: round3(input.varianceWarningPct) } : {}),
    ...(input.varianceCriticalPct != null ? { varianceCriticalPct: round3(input.varianceCriticalPct) } : {}),
  }
  state.recipes.unshift(recipe)
  audit(state, actor, clock, 'إنشاء وصفة', 'recipe', recipe.id, recipe.nameAr)
  return ok(state, 'تم حفظ الوصفة')
}

/**
 * Per-product / per-recipe variance thresholds. Passing `null` clears a threshold so it
 * falls back to the next level (recipe → company). Exactly one of productId / recipeId
 * must be supplied.
 */
function setVarianceThresholds(
  state: ErpState,
  actor: Actor,
  input: Extract<Command, { action: 'setVarianceThresholds' }>['input'],
  clock: Clock,
): CommandResult {
  const hasProduct = !!input.productId
  const hasRecipe = !!input.recipeId
  if (hasProduct === hasRecipe) return fail('حدّد المنتج أو الوصفة')
  const invalid =
    bounded(input.warningPct ?? undefined, 0, 100, 'حد الانحراف التحذيري يجب أن يكون بين 0 و 100') ||
    bounded(input.criticalPct ?? undefined, 0, 100, 'حد الانحراف الحرج يجب أن يكون بين 0 و 100')
  if (invalid) return fail(invalid)
  const warning = input.warningPct == null ? null : round3(input.warningPct)
  const critical = input.criticalPct == null ? null : round3(input.criticalPct)
  if (warning != null && critical != null && warning - critical > 0.001) {
    return fail('حد التحذير لا يمكن أن يتجاوز الحد الحرج')
  }
  let label = ''
  let entityId = ''
  if (hasProduct) {
    const product = findProduct(state, input.productId!)
    if (!product) return fail('المنتج غير موجود')
    if (warning == null) delete product.varianceWarningPct
    else product.varianceWarningPct = warning
    if (critical == null) delete product.varianceCriticalPct
    else product.varianceCriticalPct = critical
    label = product.nameAr
    entityId = product.id
  } else {
    const recipe = state.recipes.find((item) => item.id === input.recipeId)
    if (!recipe) return fail('الوصفة غير موجودة')
    if (warning == null) delete recipe.varianceWarningPct
    else recipe.varianceWarningPct = warning
    if (critical == null) delete recipe.varianceCriticalPct
    else recipe.varianceCriticalPct = critical
    label = recipe.nameAr
    entityId = recipe.id
  }
  audit(
    state,
    actor,
    clock,
    'تحديث حدود الانحراف',
    hasProduct ? 'product' : 'recipe',
    entityId,
    `${label} — تحذير ${warning ?? 'افتراضي'}% / حرج ${critical ?? 'افتراضي'}%`,
  )
  return ok(state, 'تم حفظ حدود الانحراف')
}

function bounded(value: number | undefined, min: number, max: number, message: string) {
  if (value == null) return null
  if (!Number.isFinite(value) || value < min || value > max) return message
  return null
}

function updateCompany(state: ErpState, actor: Actor, input: Extract<Command, { action: 'updateCompany' }>['input'], clock: Clock): CommandResult {
  const invalid =
    bounded(input.vatRatePct, 0, 100, 'نسبة الضريبة يجب أن تكون بين 0 و 100') ||
    bounded(input.varianceThresholdPct, 0, 100, 'حد الانحراف يجب أن يكون بين 0 و 100') ||
    bounded(input.bagUnitCost, 0, 1000, 'تكلفة الكيس يجب أن تكون بين 0 و 1000') ||
    bounded(input.costApprovalThreshold, 0, 1_000_000, 'حد اعتماد التكلفة يجب أن يكون بين 0 و 1000000')
  if (invalid) return fail(invalid)
  if (input.costRates) {
    for (const value of Object.values(input.costRates)) {
      const message = bounded(value, 0, 10000, 'سعر التحميل للطن يجب أن يكون بين 0 و 10000')
      if (message) return fail(message)
    }
  }
  state.company = {
    ...state.company,
    ...input,
    vatRatePct: input.vatRatePct != null ? round3(input.vatRatePct) : state.company.vatRatePct,
    varianceThresholdPct:
      input.varianceThresholdPct != null ? round3(input.varianceThresholdPct) : state.company.varianceThresholdPct,
    costApprovalThreshold:
      input.costApprovalThreshold != null ? money(input.costApprovalThreshold) : state.company.costApprovalThreshold,
    currency: 'OMR',
  }
  audit(state, actor, clock, 'تحديث إعدادات الشركة', 'company', 'company', state.company.nameAr)
  return ok(state, 'تم حفظ إعدادات الشركة')
}

function fundBank(state: ErpState, actor: Actor, input: Extract<Command, { action: 'fundBank' }>['input'], clock: Clock): CommandResult {
  const amount = money(input.amount)
  if (amount <= 0) return fail('مبلغ التمويل غير صحيح')
  postJournal(state, clock, input.memo?.trim() || 'تمويل رأس المال', 'capital', 'bank', [
    { accountCode: '1500', debit: amount, credit: 0 },
    { accountCode: '3100', debit: 0, credit: amount },
  ])
  audit(state, actor, clock, 'تمويل البنك', 'journal', 'capital', String(amount))
  return ok(state, 'تم تسجيل تمويل رأس المال')
}

function createPurchaseOrder(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createPurchaseOrder' }>['input'], clock: Clock): CommandResult {
  if (!state.suppliers.some((item) => item.id === input.supplierId)) return fail('المورد غير موجود')
  if (input.lines.length === 0) return fail('أضف بنود أمر الشراء')
  const lines = []
  for (const line of input.lines) {
    if (!findMaterial(state, line.materialId)) return fail('إحدى المواد غير موجودة')
    if (line.qty <= 0 || line.unitCost < 0) return fail('كمية أو سعر البند غير صحيح')
    lines.push({
      materialId: line.materialId,
      qty: qty(line.qty),
      unitCost: money(line.unitCost),
      receivedQty: 0,
    })
  }
  const at = clock.now()
  const po = {
    id: clock.id('po'),
    number: nextNumber(state, 'PO', at),
    supplierId: input.supplierId,
    status: 'PENDING_APPROVAL' as const,
    notes: input.notes?.trim() ?? '',
    lines,
    createdBy: actor.id,
    createdAt: at,
  }
  state.purchaseOrders.unshift(po)
  notify(state, clock, 'APPROVAL', `اعتماد أمر شراء ${po.number}`, 'أمر شراء بانتظار اعتماد المدير العام.', ['GM'], `appr:po:${po.id}`)
  audit(state, actor, clock, 'إنشاء أمر شراء', 'purchaseOrder', po.id, po.number)
  return ok(state, `تم إرسال ${po.number} للاعتماد`, { id: po.id, number: po.number })
}

function decidePurchaseOrder(state: ErpState, actor: Actor, input: Extract<Command, { action: 'decidePurchaseOrder' }>['input'], clock: Clock): CommandResult {
  const po = state.purchaseOrders.find((item) => item.id === input.id)
  if (!po) return fail('أمر الشراء غير موجود')
  if (po.status !== 'PENDING_APPROVAL') return fail('لا يمكن اعتماد أمر الشراء في هذه الحالة')
  po.status = input.decision
  po.decidedBy = actor.id
  po.decidedAt = clock.now()
  audit(state, actor, clock, input.decision === 'APPROVED' ? 'اعتماد أمر شراء' : 'رفض أمر شراء', 'purchaseOrder', po.id, po.number)
  return ok(state, input.decision === 'APPROVED' ? `تم اعتماد ${po.number}` : `تم رفض ${po.number}`)
}

function receiveGoods(state: ErpState, actor: Actor, input: Extract<Command, { action: 'receiveGoods' }>['input'], clock: Clock): CommandResult {
  const po = state.purchaseOrders.find((item) => item.id === input.purchaseOrderId)
  if (!po) return fail('أمر الشراء غير موجود')
  if (po.status !== 'APPROVED' && po.status !== 'PARTIALLY_RECEIVED') return fail('الاستلام متاح بعد اعتماد أمر الشراء فقط')
  if (input.lines.length === 0) return fail('أدخل الكميات المستلمة')
  const receiptLines = []
  let net = 0
  let vat = 0
  const receiptId = clock.id('gr')
  for (const line of input.lines) {
    const poLine = po.lines.find((item) => item.materialId === line.materialId)
    const material = findMaterial(state, line.materialId)
    if (!poLine || !material) return fail('البند ليس ضمن أمر الشراء')
    const receiveQty = qty(line.qty)
    if (receiveQty <= 0) return fail('كمية الاستلام يجب أن تكون أكبر من صفر')
    if (qty(poLine.receivedQty + receiveQty) > poLine.qty + 0.001) return fail(`الكمية تتجاوز أمر الشراء للمادة ${material.nameAr}`)
    const batchNo = line.batchNo.trim()
    if (!batchNo) return fail('رقم الدفعة مطلوب')
    const unitCost = money(line.unitCost ?? poLine.unitCost)
    const posted = upsertBalance(state, clock, {
      warehouse: 'WH_RAW',
      itemType: 'MATERIAL',
      itemId: material.id,
      batchNo,
      qtyDelta: receiveQty,
      unitCost,
      expiryDate: line.expiryDate ?? null,
    })
    if ('error' in posted && posted.error) return fail(posted.error)
    if (!posted.row || posted.prev == null || posted.next == null) return fail('تعذر تحديث الرصيد')
    addLedger(state, clock, actor, {
      type: 'PURCHASE_RECEIPT',
      warehouse: 'WH_RAW',
      itemType: 'MATERIAL',
      itemId: material.id,
      batchNo,
      qty: receiveQty,
      unitCost,
      prevQty: posted.prev,
      newQty: posted.next,
      refType: 'goodsReceipt',
      refId: receiptId,
    })
    poLine.receivedQty = qty(poLine.receivedQty + receiveQty)
    const lineNet = money(receiveQty * unitCost)
    net = money(net + lineNet)
    vat = money(vat + vatAmount(lineNet, material.vatTreatment, state.company.vatRatePct))
    receiptLines.push({
      materialId: material.id,
      qty: receiveQty,
      unitCost,
      batchNo,
      expiryDate: line.expiryDate ?? null,
    })
  }
  const at = clock.now()
  const receipt = {
    id: receiptId,
    number: nextNumber(state, 'GR', at),
    purchaseOrderId: po.id,
    at,
    createdBy: actor.id,
    lines: receiptLines,
  }
  state.goodsReceipts.unshift(receipt)
  const fully = po.lines.every((line) => line.receivedQty + 0.001 >= line.qty)
  po.status = fully ? 'RECEIVED' : 'PARTIALLY_RECEIVED'
  postJournal(state, clock, `استلام مشتريات ${receipt.number}`, 'goodsReceipt', receipt.id, [
    { accountCode: '1100', debit: net, credit: 0 },
    { accountCode: '2300', debit: vat, credit: 0 },
    { accountCode: '2100', debit: 0, credit: money(net + vat) },
  ])
  audit(state, actor, clock, 'استلام بضاعة', 'goodsReceipt', receipt.id, receipt.number)
  return ok(state, `تم الاستلام ${receipt.number} إلى مستودع المواد الخام`, { id: receipt.id, number: receipt.number })
}

function transferStock(state: ErpState, actor: Actor, input: Extract<Command, { action: 'transferStock' }>['input'], clock: Clock): CommandResult {
  if (input.from === input.to) return fail('لا يمكن التحويل إلى نفس المستودع')
  if (input.lines.length === 0) return fail('أضف بنود التحويل')
  const at = clock.now()
  const transfer = {
    id: clock.id('tr'),
    number: nextNumber(state, 'TR', at),
    from: input.from,
    to: input.to,
    at,
    createdBy: actor.id,
    notes: input.notes?.trim() ?? '',
    lines: [] as Array<{ itemType: ItemType; itemId: string; batchNo: string; qty: number }>,
  }
  for (const line of input.lines) {
    const amount = qty(line.qty)
    if (amount <= 0) return fail('كمية التحويل غير صحيحة')
    const exists = line.itemType === 'MATERIAL' ? findMaterial(state, line.itemId) : findProduct(state, line.itemId)
    if (!exists) return fail('الصنف غير موجود')
    if (line.itemType === 'MATERIAL' && input.to === 'WH_MFG') {
      const blocked = rawBatchQcBlock(state, line.itemId, line.batchNo.trim())
      if (blocked) return fail(blocked)
    }
    const issued = issueBatch(state, clock, actor, {
      warehouse: input.from,
      itemType: line.itemType,
      itemId: line.itemId,
      batchNo: line.batchNo.trim(),
      qty: amount,
      type: 'TRANSFER_OUT',
      refType: 'stockTransfer',
      refId: transfer.id,
    })
    if ('error' in issued && issued.error) return fail(issued.error)
    const unitCost = 'unitCost' in issued ? issued.unitCost : 0
    const source = state.balances.find(
      (row) =>
        row.warehouse === input.from &&
        row.itemType === line.itemType &&
        row.batchNo === line.batchNo.trim() &&
        row.itemId === line.itemId,
    )
    const posted = upsertBalance(state, clock, {
      warehouse: input.to,
      itemType: line.itemType,
      itemId: line.itemId,
      batchNo: line.batchNo.trim(),
      qtyDelta: amount,
      unitCost: unitCost ?? 0,
      expiryDate: source?.expiryDate ?? null,
      receivedAt: source?.receivedAt,
    })
    if ('error' in posted && posted.error) return fail(posted.error)
    if (!posted.row || posted.prev == null || posted.next == null) return fail('تعذر تحديث رصيد الوجهة')
    addLedger(state, clock, actor, {
      type: 'TRANSFER_IN',
      warehouse: input.to,
      itemType: line.itemType,
      itemId: line.itemId,
      batchNo: line.batchNo.trim(),
      qty: amount,
      unitCost: unitCost ?? 0,
      prevQty: posted.prev,
      newQty: posted.next,
      refType: 'stockTransfer',
      refId: transfer.id,
    })
    transfer.lines.push({ itemType: line.itemType, itemId: line.itemId, batchNo: line.batchNo.trim(), qty: amount })
  }
  state.transfers.unshift(transfer)
  audit(state, actor, clock, 'تحويل مخزون', 'stockTransfer', transfer.id, transfer.number)
  return ok(state, `تم التحويل ${transfer.number}`)
}

function requestAdjustment(state: ErpState, actor: Actor, input: Extract<Command, { action: 'requestAdjustment' }>['input'], clock: Clock): CommandResult {
  if (!input.reason.trim()) return fail('سبب التعديل مطلوب')
  if (input.qtyDelta === 0) return fail('كمية التعديل لا يمكن أن تكون صفراً')
  const exists = input.itemType === 'MATERIAL' ? findMaterial(state, input.itemId) : findProduct(state, input.itemId)
  if (!exists) return fail('الصنف غير موجود')
  const at = clock.now()
  const adjustment = {
    id: clock.id('adj'),
    number: nextNumber(state, 'ADJ', at),
    warehouse: input.warehouse,
    itemType: input.itemType,
    itemId: input.itemId,
    batchNo: input.batchNo.trim() || 'ADJ',
    qtyDelta: qty(input.qtyDelta),
    unitCost: money(input.unitCost ?? 0),
    reason: input.reason.trim(),
    status: 'PENDING_APPROVAL' as const,
    createdBy: actor.id,
    createdAt: at,
  }
  state.adjustments.unshift(adjustment)
  notify(state, clock, 'APPROVAL', `اعتماد تعديل مخزون ${adjustment.number}`, adjustment.reason, ['GM'], `appr:adj:${adjustment.id}`)
  audit(state, actor, clock, 'طلب تعديل مخزون', 'stockAdjustment', adjustment.id, adjustment.number)
  return ok(state, `تم إرسال ${adjustment.number} للاعتماد`)
}

function decideAdjustment(state: ErpState, actor: Actor, input: Extract<Command, { action: 'decideAdjustment' }>['input'], clock: Clock): CommandResult {
  const adjustment = state.adjustments.find((item) => item.id === input.id)
  if (!adjustment) return fail('التعديل غير موجود')
  if (adjustment.status !== 'PENDING_APPROVAL') return fail('تمت معالجة التعديل')
  if (input.decision === 'REJECTED') {
    adjustment.status = 'REJECTED'
    adjustment.decidedBy = actor.id
    audit(state, actor, clock, 'رفض تعديل مخزون', 'stockAdjustment', adjustment.id, adjustment.number)
    return ok(state, `تم رفض ${adjustment.number}`)
  }
  const account = adjustment.itemType === 'PRODUCT' ? '1300' : '1100'
  if (adjustment.qtyDelta > 0) {
    const unitCost = adjustment.unitCost
    const posted = upsertBalance(state, clock, {
      warehouse: adjustment.warehouse,
      itemType: adjustment.itemType,
      itemId: adjustment.itemId,
      batchNo: adjustment.batchNo,
      qtyDelta: adjustment.qtyDelta,
      unitCost,
    })
    if ('error' in posted && posted.error) return fail(posted.error)
    if (!posted.row || posted.prev == null || posted.next == null) return fail('تعذر تحديث الرصيد')
    addLedger(state, clock, actor, {
      type: 'ADJUSTMENT',
      warehouse: adjustment.warehouse,
      itemType: adjustment.itemType,
      itemId: adjustment.itemId,
      batchNo: adjustment.batchNo,
      qty: adjustment.qtyDelta,
      unitCost,
      prevQty: posted.prev,
      newQty: posted.next,
      refType: 'stockAdjustment',
      refId: adjustment.id,
      notes: adjustment.reason,
    })
    const value = money(adjustment.qtyDelta * unitCost)
    postJournal(state, clock, `تعديل مخزون ${adjustment.number}`, 'stockAdjustment', adjustment.id, [
      { accountCode: account, debit: value, credit: 0 },
      { accountCode: '6300', debit: 0, credit: value },
    ])
  } else {
    const issued = issueBatch(state, clock, actor, {
      warehouse: adjustment.warehouse,
      itemType: adjustment.itemType,
      itemId: adjustment.itemId,
      batchNo: adjustment.batchNo,
      qty: Math.abs(adjustment.qtyDelta),
      type: 'ADJUSTMENT',
      refType: 'stockAdjustment',
      refId: adjustment.id,
    })
    if ('error' in issued && issued.error) return fail(issued.error)
    const value = 'cost' in issued ? (issued.cost ?? 0) : 0
    postJournal(state, clock, `تعديل مخزون ${adjustment.number}`, 'stockAdjustment', adjustment.id, [
      { accountCode: '6300', debit: value, credit: 0 },
      { accountCode: account, debit: 0, credit: value },
    ])
  }
  adjustment.status = 'APPROVED'
  adjustment.decidedBy = actor.id
  audit(state, actor, clock, 'اعتماد تعديل مخزون', 'stockAdjustment', adjustment.id, adjustment.number)
  return ok(state, `تم اعتماد ${adjustment.number}`)
}

function createProductionOrder(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createProductionOrder' }>['input'], clock: Clock): CommandResult {
  const product = findProduct(state, input.productId)
  const recipe = state.recipes.find((item) => item.id === input.recipeId && item.productId === input.productId)
  if (!product || !recipe) return fail('المنتج أو الوصفة غير موجودة')
  if (input.plannedQty <= 0) return fail('الكمية المخططة غير صحيحة')
  if (recipe.baseOutputQty <= 0) return fail('أساس الوصفة غير صحيح')
  if (input.machineId && !(state.machines ?? []).some((item) => item.id === input.machineId)) {
    return fail('الآلة أو خط الإنتاج غير موجود')
  }
  const at = clock.now()
  const order = {
    id: clock.id('prdord'),
    number: nextNumber(state, 'PR', at),
    productId: product.id,
    recipeId: recipe.id,
    plannedQty: qty(input.plannedQty),
    status: 'RELEASED' as const,
    expected: recipe.items.map((item) => ({
      materialId: item.materialId,
      expectedQty: qty(input.plannedQty * (item.qty / recipe.baseOutputQty)),
      actualQty: 0,
      wasteQty: 0,
    })),
    actualOutputQty: 0,
    totalCost: 0,
    unitCost: 0,
    outputBatch: '',
    varianceReason: '',
    createdBy: actor.id,
    createdAt: at,
    ...(input.machineId ? { machineId: input.machineId } : {}),
    ...(input.shift ? { shift: input.shift } : {}),
  }
  state.productionOrders.unshift(order)
  audit(state, actor, clock, 'إنشاء أمر إنتاج', 'productionOrder', order.id, order.number)
  return ok(state, `تم فتح ${order.number}`, { id: order.id, number: order.number })
}

/**
 * Resolve the warning / critical variance thresholds for a production order.
 * Precedence: product → recipe → company default. The company value is used for both
 * warning and critical when nothing more specific is configured, preserving legacy behaviour.
 */
function resolveVarianceThresholds(
  state: ErpState,
  order: ProductionOrder,
  recipe: Recipe,
): { warningPct: number; criticalPct: number } {
  const product = findProduct(state, order.productId)
  const company = state.company.varianceThresholdPct
  return {
    warningPct: product?.varianceWarningPct ?? recipe.varianceWarningPct ?? company,
    criticalPct: product?.varianceCriticalPct ?? recipe.varianceCriticalPct ?? company,
  }
}

function completeProduction(state: ErpState, actor: Actor, input: Extract<Command, { action: 'completeProduction' }>['input'], clock: Clock): CommandResult {
  const order = state.productionOrders.find((item) => item.id === input.productionOrderId)
  if (!order) return fail('أمر الإنتاج غير موجود')
  if (order.status !== 'RELEASED') return fail('أمر الإنتاج مكتمل بالفعل')
  if (input.actualOutputQty <= 0) return fail('كمية الناتج يجب أن تكون أكبر من صفر')
  const operator = state.employees.find((item) => item.id === input.operatorId && item.active)
  if (!operator) return fail('مشغّل الإنتاج غير موجود')
  const recipe = state.recipes.find((item) => item.id === order.recipeId)
  if (!recipe) return fail('الوصفة غير موجودة')

  let inputKg = 0
  let wasteKg = 0
  for (const expected of order.expected) {
    const actual = input.actuals.find((item) => item.materialId === expected.materialId)
    const actualQty = qty(actual?.actualQty ?? expected.expectedQty)
    const waste = qty(actual?.wasteQty ?? 0)
    if (actualQty < 0 || waste < 0) return fail('الكميات الفعلية غير صحيحة')
    if (waste - actualQty > 0.001) return fail('الهدر لا يمكن أن يتجاوز الكمية المصروفة')
    if (!findMaterial(state, expected.materialId)) return fail('مادة الوصفة غير موجودة')
    inputKg = qty(inputKg + actualQty)
    wasteKg = qty(wasteKg + waste)
  }

  const recipeInputTotal = qty(recipe.items.reduce((sum, item) => sum + item.qty, 0))
  const expectedOutputKg = recipeInputTotal > 0 ? qty((inputKg / recipeInputTotal) * recipe.baseOutputQty) : 0
  const actualOutputKg = qty(input.actualOutputQty)
  const varianceKg = qty(actualOutputKg - expectedOutputKg)
  const variancePct = expectedOutputKg > 0 ? pct2((varianceKg / expectedOutputKg) * 100) : 0
  const thresholds = resolveVarianceThresholds(state, order, recipe)
  const absVariancePct = Math.abs(variancePct)
  const isCritical = absVariancePct - thresholds.criticalPct > 0.001
  const isWarning = !isCritical && absVariancePct - thresholds.warningPct > 0.001
  const varianceLevel: 'NORMAL' | 'WARNING' | 'CRITICAL' = isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'NORMAL'
  const reasonCodes = state.company.varianceReasonCodes ?? []
  if (isCritical) {
    if (reasonCodes.length > 0) {
      const code = input.varianceReasonCode?.trim()
      if (!code || !reasonCodes.includes(code)) {
        return fail(`الانحراف الكلي (${variancePct}%) تجاوز الحد الحرج — اختر رمز سبب الانحراف`)
      }
      if (!input.varianceReason?.trim()) {
        return fail(`الانحراف الكلي (${variancePct}%) تجاوز الحد الحرج — ملاحظة السبب مطلوبة`)
      }
    } else if (!input.varianceReason?.trim()) {
      return fail(`الانحراف الكلي (${variancePct}%) تجاوز الحد المسموح — سبب الانحراف مطلوب`)
    }
  }

  let rawCost = 0
  const lotMaterials: ProductionLot['materials'] = []
  for (const expected of order.expected) {
    const actual = input.actuals.find((item) => item.materialId === expected.materialId)
    const actualQty = qty(actual?.actualQty ?? expected.expectedQty)
    const waste = qty(actual?.wasteQty ?? 0)
    const material = findMaterial(state, expected.materialId)!
    if (actualQty > 0) {
      const issued = fifoIssue(state, clock, actor, {
        warehouse: 'WH_MFG',
        itemType: 'MATERIAL',
        itemId: expected.materialId,
        qty: actualQty,
        type: 'PRODUCTION_CONSUMPTION',
        refType: 'productionOrder',
        refId: order.id,
      })
      if ('error' in issued && issued.error) {
        return fail(`${material.nameAr}: ${issued.error}. حوّل المواد إلى مستودع التصنيع أولاً.`)
      }
      if (!('error' in issued)) {
        rawCost = money(rawCost + issued.cost)
        for (const line of issued.lines) {
          lotMaterials.push({
            materialId: expected.materialId,
            sourceBatchNo: line.batchNo,
            supplierId: supplierForBatch(state, expected.materialId, line.batchNo),
            qty: line.qty,
            unitCost: line.unitCost,
          })
        }
      }
    }
    expected.actualQty = actualQty
    expected.wasteQty = waste
  }

  const product = findProduct(state, order.productId)
  const manual = input.costLines ?? []
  for (const line of manual) {
    if (!Number.isFinite(line.amount) || line.amount < 0) return fail('مبلغ بند التكلفة غير صحيح')
  }
  const threshold = state.company.costApprovalThreshold ?? 0
  const pendingManual = manual.filter((line) => money(line.amount) > threshold)
  const pendingTypes = new Set(pendingManual.map((line) => line.type))
  const built = buildLotCostLines(state, product, actualOutputKg, rawCost, manual, {
    manufacturedAt: clock.now(),
    inputKg,
    machineId: order.machineId,
    productionOrderId: order.id,
  })
  const costLines = built.filter((line) => !pendingTypes.has(line.type as (typeof pendingManual)[number]['type']))
  const pendingCostLines = pendingManual
    .filter((line) => money(line.amount) > 0)
    .map((line) => ({
      id: clock.id('pcost'),
      type: line.type,
      amount: money(line.amount),
      status: 'PENDING_APPROVAL' as const,
    }))
  const totalCost = money(costLines.reduce((sum, line) => sum + line.amount, 0))
  const extraCost = money(totalCost - rawCost)
  const outputQty = actualOutputKg
  const unitCost = outputQty > 0 ? money(totalCost / outputQty) : 0
  const lotNo = nextLotNo(state, clock.now())

  const posted = upsertBalance(state, clock, {
    warehouse: 'WH_FG',
    itemType: 'PRODUCT',
    itemId: order.productId,
    batchNo: lotNo,
    qtyDelta: outputQty,
    unitCost,
  })
  if ('error' in posted && posted.error) return fail(posted.error)
  if (!posted.row || posted.prev == null || posted.next == null) return fail('تعذر إضافة المنتج النهائي')
  
  addLedger(state, clock, actor, {
    type: 'PRODUCTION_OUTPUT',
    warehouse: 'WH_FG',
    itemType: 'PRODUCT',
    itemId: order.productId,
    batchNo: lotNo,
    qty: outputQty,
    unitCost: unitCost ?? 0,
    prevQty: posted.prev,
    newQty: posted.next,
    refType: 'productionOrder',
    refId: order.id,
  })
  
  postJournal(state, clock, `استهلاك إنتاج ${order.number}`, 'productionOrder', order.id, [
    { accountCode: '1200', debit: rawCost, credit: 0 },
    { accountCode: '1100', debit: 0, credit: rawCost },
  ])
  postJournal(state, clock, `تكاليف إنتاج إضافية ${order.number}`, 'productionOrder', order.id, [
    { accountCode: '1200', debit: extraCost, credit: 0 },
    { accountCode: '2600', debit: 0, credit: extraCost },
  ])
  postJournal(state, clock, `إخراج إنتاج ${order.number}`, 'productionOrder', order.id, [
    { accountCode: '1300', debit: totalCost, credit: 0 },
    { accountCode: '1200', debit: 0, credit: totalCost },
  ])
  
  order.status = 'COMPLETED'
  order.actualOutputQty = outputQty
  order.totalCost = totalCost
  order.unitCost = unitCost
  order.outputBatch = lotNo
  order.varianceReason = input.varianceReason?.trim() ?? ''
  order.varianceReasonCode = input.varianceReasonCode?.trim() ?? ''
  order.varianceLevel = varianceLevel
  order.completedAt = clock.now()
  
  const lot = {
    id: clock.id('lot'),
    lotNo,
    productionOrderId: order.id,
    productId: order.productId,
    operatorId: input.operatorId,
    manufacturedAt: clock.now(),
    inputKg,
    expectedOutputKg,
    actualOutputKg,
    wasteKg,
    varianceKg,
    variancePct,
    materials: lotMaterials,
    costLines,
    pendingCostLines,
    totalCost,
    costPerTon: outputQty > 0 ? money((totalCost / outputQty) * 1000) : 0,
    deliveries: [],
    qcStatus: 'UNTESTED' as const
  }
  state.lots = state.lots ?? []
  state.lots.unshift(lot)

  if (isCritical) {
    notify(
      state,
      clock,
      'INFO',
      `انحراف حرج في إنتاج ${lotNo}`,
      `${varianceKg} كجم (${variancePct}%) — ${order.varianceReason}${order.varianceReasonCode ? ` [${order.varianceReasonCode}]` : ''}`,
      ['GM'],
      `varcrit:${order.id}`,
    )
  } else if (isWarning) {
    notify(
      state,
      clock,
      'INFO',
      `انحراف إنتاج ${lotNo}`,
      `${varianceKg} كجم (${variancePct}%) — تجاوز حد التحذير`,
      ['GM', 'OPERATIONS'],
      `varwarn:${order.id}`,
    )
  }
  if (pendingCostLines.length > 0) {
    notify(
      state,
      clock,
      'APPROVAL',
      `اعتماد تكلفة ${lotNo}`,
      'بنود تكلفة يدوية بانتظار اعتماد المدير أو المحاسب.',
      ['GM', 'ACCOUNTANT'],
      `cost:${lot.id}`,
    )
  }
  audit(state, actor, clock, 'إكمال الإنتاج', 'productionOrder', order.id, lotNo)
  return ok(state, pendingCostLines.length > 0 ? `اكتمل ${order.number} وتم إنشاء الدفعة ${lotNo}، وبعض بنود التكلفة بانتظار الاعتماد` : `اكتمل ${order.number} وتم إنشاء الدفعة ${lotNo}`)
}

function syncLotValuation(state: ErpState, lot: ProductionLot) {
  const totalCost = money(lot.costLines.reduce((sum, line) => sum + line.amount, 0))
  lot.totalCost = totalCost
  lot.costPerTon = lot.actualOutputKg > 0 ? money((totalCost / lot.actualOutputKg) * 1000) : 0
  const order = state.productionOrders.find((item) => item.id === lot.productionOrderId)
  if (order) {
    order.totalCost = totalCost
    order.unitCost = lot.actualOutputKg > 0 ? money(totalCost / lot.actualOutputKg) : 0
  }
  const row = state.balances.find(
    (item) => item.warehouse === 'WH_FG' && item.itemType === 'PRODUCT' && item.itemId === lot.productId && item.batchNo === lot.lotNo,
  )
  if (row) row.unitCost = lot.costPerTon > 0 && lot.actualOutputKg > 0 ? money(totalCost / lot.actualOutputKg) : row.unitCost
  refreshLotSale(state, lot)
}

function postAbsorbedCost(state: ErpState, clock: Clock, memo: string, refId: string, amount: number) {
  postJournal(state, clock, memo, 'productionLot', refId, [
    { accountCode: '1200', debit: amount, credit: 0 },
    { accountCode: '2600', debit: 0, credit: amount },
  ])
  postJournal(state, clock, `إخراج ${memo}`, 'productionLot', refId, [
    { accountCode: '1300', debit: amount, credit: 0 },
    { accountCode: '1200', debit: 0, credit: amount },
  ])
}

function decideProductionCost(
  state: ErpState,
  actor: Actor,
  input: Extract<Command, { action: 'decideProductionCost' }>['input'],
  clock: Clock,
): CommandResult {
  const lot = state.lots?.find((item) => item.id === input.lotId)
  if (!lot) return fail('دفعة الإنتاج غير موجودة')
  const index = (lot.pendingCostLines ?? []).findIndex((line) => line.id === input.lineId)
  if (index < 0) return fail('بند التكلفة غير موجود أو اعتُمد')
  const pending = lot.pendingCostLines![index]!
  lot.pendingCostLines = lot.pendingCostLines!.filter((line) => line.id !== pending.id)
  if (input.decision === 'APPROVED') {
    lot.costLines.push({ type: pending.type, amount: pending.amount })
    syncLotValuation(state, lot)
    postAbsorbedCost(state, clock, `اعتماد تكلفة ${COST_LABEL[pending.type]} ${lot.lotNo}`, lot.id, pending.amount)
    audit(state, actor, clock, 'اعتماد تكلفة إنتاج', 'productionLot', lot.id, `${pending.type} ${pending.amount}`)
    return ok(state, 'تم اعتماد بند التكلفة')
  }
  const order = state.productionOrders.find((item) => item.id === lot.productionOrderId)
  const allocated = allocateCostType(state, pending.type, lot.actualOutputKg, {
    manufacturedAt: lot.manufacturedAt,
    inputKg: lot.inputKg,
    machineId: order?.machineId,
    productionOrderId: lot.productionOrderId,
  })
  if (allocated && allocated.amount > 0) {
    lot.costLines.push(allocated)
    syncLotValuation(state, lot)
    postAbsorbedCost(state, clock, `تحميل ${COST_LABEL[pending.type]} بعد رفض البند اليدوي ${lot.lotNo}`, lot.id, allocated.amount)
  }
  audit(state, actor, clock, 'رفض تكلفة إنتاج', 'productionLot', lot.id, `${pending.type} ${pending.amount}`)
  return ok(state, allocated && allocated.amount > 0 ? 'رُفض البند اليدوي وطُبّق التحميل الفعلي' : 'رُفض بند التكلفة')
}

/** Post an absorbed-cost adjustment for a signed delta (positive adds cost, negative removes it). */
function postCostAdjustment(state: ErpState, clock: Clock, memo: string, refId: string, delta: number) {
  const amount = money(Math.abs(delta))
  if (amount <= 0) return
  if (delta > 0) {
    postJournal(state, clock, memo, 'productionLot', refId, [
      { accountCode: '1200', debit: amount, credit: 0 },
      { accountCode: '2600', debit: 0, credit: amount },
    ])
    postJournal(state, clock, `إخراج ${memo}`, 'productionLot', refId, [
      { accountCode: '1300', debit: amount, credit: 0 },
      { accountCode: '1200', debit: 0, credit: amount },
    ])
    return
  }
  postJournal(state, clock, memo, 'productionLot', refId, [
    { accountCode: '2600', debit: amount, credit: 0 },
    { accountCode: '1200', debit: 0, credit: amount },
  ])
  postJournal(state, clock, `إخراج ${memo}`, 'productionLot', refId, [
    { accountCode: '1200', debit: amount, credit: 0 },
    { accountCode: '1300', debit: 0, credit: amount },
  ])
}

/**
 * Month-close recalculation. Replaces ESTIMATED lines with ACTUAL ones now that the month's
 * utilities, payroll, maintenance and packaging records are complete. Manual lines are never touched.
 */
function recalculateLotCosts(
  state: ErpState,
  actor: Actor,
  input: Extract<Command, { action: 'recalculateLotCosts' }>['input'],
  clock: Clock,
): CommandResult {
  const month = input.month?.trim() ?? ''
  if (!/^\d{4}-\d{2}$/.test(month)) return fail('صيغة الشهر غير صحيحة (YYYY-MM)')
  const lots = (state.lots ?? []).filter((lot) => monthOf(lot.manufacturedAt) === month)
  if (lots.length === 0) return fail('لا توجد دفعات إنتاج في هذا الشهر')
  let changed = 0
  for (const lot of lots) {
    const order = state.productionOrders.find((item) => item.id === lot.productionOrderId)
    const product = state.products.find((item) => item.id === lot.productId)
    const context: CostContext = {
      manufacturedAt: lot.manufacturedAt,
      inputKg: lot.inputKg,
      machineId: order?.machineId,
      productionOrderId: lot.productionOrderId,
      lotNo: lot.lotNo,
      alreadyCounted: true,
    }
    const before = money(lot.costLines.reduce((sum, line) => sum + line.amount, 0))
    const changes: string[] = []
    for (const type of ALLOCATED_COST_TYPES) {
      const index = lot.costLines.findIndex((line) => line.type === type)
      const current = index >= 0 ? lot.costLines[index] : undefined
      if (current?.basis === 'MANUAL') continue
      const next = allocateCostType(state, type, lot.actualOutputKg, context)
      if (!next || next.basis !== 'ACTUAL') continue
      if (current && current.amount === next.amount && current.basis === 'ACTUAL') continue
      if (index >= 0) lot.costLines[index] = next
      else lot.costLines.push(next)
      changes.push(`${COST_LABEL[type]} ${current?.amount ?? 0}→${next.amount}`)
    }
    const bagIndex = lot.costLines.findIndex((line) => line.type === 'BAGS')
    const currentBag = bagIndex >= 0 ? lot.costLines[bagIndex] : undefined
    if (currentBag?.basis !== 'MANUAL') {
      const bagLine = packagingCostLine(state, product, lot.actualOutputKg, lot.lotNo)
      if (bagLine && bagLine.basis === 'ACTUAL' && (!currentBag || currentBag.amount !== bagLine.amount)) {
        if (bagIndex >= 0) lot.costLines[bagIndex] = bagLine
        else lot.costLines.push(bagLine)
        changes.push(`أكياس ${currentBag?.amount ?? 0}→${bagLine.amount}`)
      }
    }
    const after = money(lot.costLines.reduce((sum, line) => sum + line.amount, 0))
    const delta = money(after - before)
    if (delta !== 0) {
      syncLotValuation(state, lot)
      postCostAdjustment(state, clock, `إعادة حساب تكلفة ${lot.lotNo}`, lot.id, delta)
      changed += 1
    }
    if (changes.length > 0) {
      audit(state, actor, clock, 'إعادة حساب تكلفة دفعة', 'productionLot', lot.id, `${lot.lotNo}: ${before} → ${after} (${changes.join('، ')})`)
    }
  }
  if (changed === 0) return ok(state, `لا تغييرات: تكاليف شهر ${month} محدّثة بالفعل`)
  return ok(state, `أُعيد حساب ${changed} دفعة لشهر ${month}`)
}

function createInvoice(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createInvoice' }>['input'], clock: Clock): CommandResult {
  if (!state.customers.some((item) => item.id === input.customerId)) return fail('العميل غير موجود')
  if (input.lines.length === 0) return fail('أضف بنود الفاتورة')
  const lines = []
  let subtotal = 0
  let vatTotal = 0
  for (const line of input.lines) {
    const product = findProduct(state, line.productId)
    if (!product) return fail('المنتج غير موجود')
    if (line.qty <= 0) return fail('كمية البيع غير صحيحة')
    const unitPrice = money(line.unitPrice ?? product.salePrice)
    const net = money(line.qty * unitPrice)
    const rate = state.company.vatRatePct
    const vat = vatAmount(net, product.vatTreatment, rate)
    subtotal = money(subtotal + net)
    vatTotal = money(vatTotal + vat)
    lines.push({
      productId: product.id,
      qty: qty(line.qty),
      unitPrice,
      vatTreatment: product.vatTreatment,
      vatRatePct: product.vatTreatment === 'STANDARD' ? rate : 0,
      net,
      vat,
      total: money(net + vat),
      batchNo: '',
      unitCost: 0,
    })
  }
  const at = clock.now()
  const invoice = {
    id: clock.id('inv'),
    number: nextNumber(state, 'INV', at),
    customerId: input.customerId,
    status: 'DRAFT' as const,
    issuedAt: at,
    notes: input.notes?.trim() ?? '',
    lines,
    subtotal,
    vatAmount: vatTotal,
    total: money(subtotal + vatTotal),
    paidAmount: 0,
    createdBy: actor.id,
  }
  state.invoices.unshift(invoice)
  audit(state, actor, clock, 'إنشاء فاتورة', 'salesInvoice', invoice.id, invoice.number)
  return ok(state, `تم حفظ مسودة ${invoice.number}`, { id: invoice.id, number: invoice.number })
}

function confirmInvoice(state: ErpState, actor: Actor, input: Extract<Command, { action: 'confirmInvoice' }>['input'], clock: Clock): CommandResult {
  const invoice = state.invoices.find((item) => item.id === input.id)
  if (!invoice) return fail('الفاتورة غير موجودة')
  if (invoice.status !== 'DRAFT') return fail('الفاتورة مؤكدة بالفعل')
  let cogs = 0
  for (const line of invoice.lines) {
    const issued = fifoIssue(state, clock, actor, {
      warehouse: 'WH_FG',
      itemType: 'PRODUCT',
      itemId: line.productId,
      qty: line.qty,
      type: 'SALE',
      refType: 'salesInvoice',
      refId: invoice.id,
    })
    if ('error' in issued && issued.error) {
      const product = findProduct(state, line.productId)
      return fail(`${product?.nameAr ?? 'المنتج'}: ${issued.error}`)
    }
    if (!('error' in issued)) {
      cogs = money(cogs + issued.cost)
      line.batchNo = issued.lines.map((item) => item.batchNo).join(', ')
      line.unitCost = line.qty > 0 ? money(issued.cost / line.qty) : 0
      
      for (const issuedLine of issued.lines) {
        recordLotDelivery(state, line.productId, issuedLine.batchNo, {
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          qty: issuedLine.qty,
          at: clock.now(),
        })
      }
    }
  }
  invoice.status = 'CONFIRMED'
  invoice.issuedAt = clock.now()
  postJournal(state, clock, `فاتورة مبيعات ${invoice.number}`, 'salesInvoice', invoice.id, [
    { accountCode: '1400', debit: invoice.total, credit: 0 },
    { accountCode: '4100', debit: 0, credit: invoice.subtotal },
    { accountCode: '2200', debit: 0, credit: invoice.vatAmount },
  ])
  postJournal(state, clock, `تكلفة مبيعات ${invoice.number}`, 'salesInvoice', invoice.id, [
    { accountCode: '5100', debit: cogs, credit: 0 },
    { accountCode: '1300', debit: 0, credit: cogs },
  ])
  audit(state, actor, clock, 'تأكيد فاتورة', 'salesInvoice', invoice.id, invoice.number)
  return ok(state, `تم تأكيد ${invoice.number} وخصم المخزون`)
}

function recordPayment(state: ErpState, actor: Actor, input: Extract<Command, { action: 'recordPayment' }>['input'], clock: Clock): CommandResult {
  const invoice = state.invoices.find((item) => item.id === input.invoiceId)
  if (!invoice) return fail('الفاتورة غير موجودة')
  if (invoice.status === 'DRAFT') return fail('أكّد الفاتورة قبل التحصيل')
  const amount = money(input.amount)
  if (amount <= 0) return fail('مبلغ التحصيل غير صحيح')
  const outstanding = money(invoice.total - invoice.paidAmount)
  if (amount - outstanding > 0.001) return fail(`المبلغ أكبر من المتبقي (${outstanding} ر.ع.)`)
  const at = clock.now()
  const payment = {
    id: clock.id('pay'),
    number: nextNumber(state, 'PAY', at),
    invoiceId: invoice.id,
    amount,
    method: input.method?.trim() || 'تحويل بنكي',
    at,
    createdBy: actor.id,
  }
  state.payments.unshift(payment)
  invoice.paidAmount = money(invoice.paidAmount + amount)
  invoice.status = invoice.total - invoice.paidAmount <= 0.001 ? 'PAID' : 'PARTIAL'
  postJournal(state, clock, `تحصيل ${payment.number}`, 'salesPayment', payment.id, [
    { accountCode: '1500', debit: amount, credit: 0 },
    { accountCode: '1400', debit: 0, credit: amount },
  ])
  audit(state, actor, clock, 'تحصيل فاتورة', 'salesPayment', payment.id, payment.number)
  return ok(state, `تم تسجيل التحصيل ${payment.number}`)
}

function createWithdrawal(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createWithdrawal' }>['input'], clock: Clock): CommandResult {
  if (!input.reason.trim()) return fail('سبب السحب مطلوب')
  if (input.lines.length === 0) return fail('أضف بنود السحب')
  const at = clock.now()
  const withdrawal = {
    id: clock.id('wd'),
    number: nextNumber(state, 'WD', at),
    reason: input.reason.trim(),
    at,
    createdBy: actor.id,
    lines: [] as Array<{ productId: string; qty: number; batchNo: string; unitCost: number }>,
    totalCost: 0,
  }
  let totalCost = 0
  for (const line of input.lines) {
    if (!findProduct(state, line.productId)) return fail('المنتج غير موجود')
    if (line.qty <= 0) return fail('كمية السحب غير صحيحة')
    const issued = fifoIssue(state, clock, actor, {
      warehouse: 'WH_FG',
      itemType: 'PRODUCT',
      itemId: line.productId,
      qty: line.qty,
      type: 'WITHDRAWAL',
      refType: 'withdrawal',
      refId: withdrawal.id,
    })
    if ('error' in issued && issued.error) return fail(issued.error)
    if (!('error' in issued)) {
      totalCost = money(totalCost + issued.cost)
      withdrawal.lines.push({
        productId: line.productId,
        qty: qty(line.qty),
        batchNo: issued.lines.map((item) => item.batchNo).join(', '),
        unitCost: line.qty > 0 ? money(issued.cost / line.qty) : 0,
      })
      for (const issuedLine of issued.lines) {
        recordLotDelivery(state, line.productId, issuedLine.batchNo, {
          withdrawalId: withdrawal.id,
          qty: issuedLine.qty,
          at,
        })
      }
    }
  }
  withdrawal.totalCost = totalCost
  state.withdrawals.unshift(withdrawal)
  postJournal(state, clock, `سحب داخلي ${withdrawal.number}`, 'withdrawal', withdrawal.id, [
    { accountCode: '6200', debit: totalCost, credit: 0 },
    { accountCode: '1300', debit: 0, credit: totalCost },
  ])
  audit(state, actor, clock, 'سحب داخلي', 'withdrawal', withdrawal.id, withdrawal.number)
  return ok(state, `تم السحب ${withdrawal.number}`)
}

function createExpense(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createExpense' }>['input'], clock: Clock): CommandResult {
  if (!input.description.trim()) return fail('وصف المصروف مطلوب')
  if (input.amount <= 0) return fail('مبلغ المصروف غير صحيح')
  const treatment = input.vatTreatment ?? 'STANDARD'
  const net = money(input.amount)
  const vat = vatAmount(net, treatment, state.company.vatRatePct)
  const at = clock.now()
  const expense = {
    id: clock.id('exp'),
    number: nextNumber(state, 'EXP', at),
    category: input.category.trim() || 'تشغيل',
    description: input.description.trim(),
    amount: net,
    vatTreatment: treatment,
    payFrom: input.payFrom ?? 'BANK',
    status: 'PENDING_APPROVAL' as const,
    vatAmount: vat,
    total: money(net + vat),
    createdBy: actor.id,
    createdAt: at,
  }
  state.expenses.unshift(expense)
  notify(state, clock, 'APPROVAL', `اعتماد مصروف ${expense.number}`, expense.description, ['GM'], `appr:exp:${expense.id}`)
  audit(state, actor, clock, 'إنشاء مصروف', 'expense', expense.id, expense.number)
  return ok(state, `تم إرسال ${expense.number} للاعتماد`)
}

function decideExpense(state: ErpState, actor: Actor, input: Extract<Command, { action: 'decideExpense' }>['input'], clock: Clock): CommandResult {
  const expense = state.expenses.find((item) => item.id === input.id)
  if (!expense) return fail('المصروف غير موجود')
  if (expense.status !== 'PENDING_APPROVAL') return fail('تمت معالجة المصروف')
  if (input.decision === 'REJECTED') {
    expense.status = 'REJECTED'
    expense.decidedBy = actor.id
    audit(state, actor, clock, 'رفض مصروف', 'expense', expense.id, expense.number)
    return ok(state, `تم رفض ${expense.number}`)
  }
  const creditAccount = expense.payFrom === 'BANK' ? '1500' : '2100'
  postJournal(state, clock, `مصروف ${expense.number}`, 'expense', expense.id, [
    { accountCode: '6200', debit: expense.amount, credit: 0 },
    { accountCode: '2300', debit: expense.vatAmount, credit: 0 },
    { accountCode: creditAccount, debit: 0, credit: expense.total },
  ])
  expense.status = 'POSTED'
  expense.decidedBy = actor.id
  audit(state, actor, clock, 'ترحيل مصروف', 'expense', expense.id, expense.number)
  return ok(state, `تم ترحيل ${expense.number}`)
}

function recordAttendance(state: ErpState, actor: Actor, input: Extract<Command, { action: 'recordAttendance' }>['input'], clock: Clock): CommandResult {
  if (!state.employees.some((item) => item.id === input.employeeId && item.active)) return fail('الموظف غير موجود')
  if (!input.date || !input.checkIn) return fail('التاريخ ووقت الحضور مطلوبان')
  const row = {
    id: clock.id('att'),
    employeeId: input.employeeId,
    date: input.date,
    checkIn: input.checkIn,
    checkOut: input.checkOut || '',
    source: input.source ?? 'MANUAL',
  }
  state.attendance.unshift(row)
  audit(state, actor, clock, 'تسجيل حضور', 'attendance', row.id, input.date)
  return ok(state, 'تم تسجيل الحضور')
}

function importAttendance(state: ErpState, actor: Actor, input: Extract<Command, { action: 'importAttendance' }>['input'], clock: Clock): CommandResult {
  const lines = input.csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  let count = 0
  for (const line of lines) {
    if (line.startsWith('employee')) continue
    const [code, date, checkIn, checkOut] = line.split(',').map((part) => part.trim())
    const employee = state.employees.find((item) => item.code === code)
    if (!employee || !date || !checkIn) continue
    state.attendance.unshift({
      id: clock.id('att'),
      employeeId: employee.id,
      date,
      checkIn,
      checkOut: checkOut ?? '',
      source: 'CSV',
    })
    count += 1
  }
  if (count === 0) return fail('لم يُستورد أي صف. الصيغة: كود الموظف,التاريخ,الحضور,الانصراف')
  audit(state, actor, clock, 'استيراد حضور', 'attendance', 'csv', `${count} صف`)
  return ok(state, `تم استيراد ${count} سجل حضور`)
}

function hoursBetween(checkIn: string, checkOut: string) {
  const [ih, im] = checkIn.split(':').map(Number)
  const [oh, om] = checkOut.split(':').map(Number)
  if (![ih, im, oh, om].every((n) => Number.isFinite(n))) return 0
  return Math.max(0, oh + om / 60 - (ih + im / 60))
}

function createPayroll(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createPayroll' }>['input'], clock: Clock): CommandResult {
  if (!/^\d{4}-\d{2}$/.test(input.month)) return fail('الشهر بصيغة YYYY-MM')
  if (state.payrolls.some((item) => item.month === input.month && item.status !== 'REJECTED')) return fail('يوجد مسير لهذا الشهر')
  if (input.lines.length === 0) return fail('أضف موظفين للمسير')
  const lines = []
  for (const line of input.lines) {
    const employee = state.employees.find((item) => item.id === line.employeeId && item.active)
    if (!employee) return fail('موظف غير موجود في المسير')
    const overtimeHours = qty(line.overtimeHours ?? 0)
    const hourly = employee.basicSalary / 30 / 8
    const overtimeAmount = money(overtimeHours * hourly * 1.25)
    const allowances = money(line.allowances ?? 0)
    const deductions = money(line.deductions ?? 0)
    const gross = money(employee.basicSalary + overtimeAmount + allowances)
    const net = money(gross - deductions)
    if (net < 0) return fail(`صافي راتب ${employee.nameAr} سالب`)
    lines.push({
      employeeId: employee.id,
      basic: employee.basicSalary,
      overtimeHours,
      overtimeAmount,
      allowances,
      deductions,
      gross,
      net,
    })
  }
  const at = clock.now()
  const payroll = {
    id: clock.id('payr'),
    number: nextNumber(state, 'PRL', at),
    month: input.month,
    status: 'PENDING_APPROVAL' as const,
    lines,
    totalNet: money(lines.reduce((sum, line) => sum + line.net, 0)),
    createdBy: actor.id,
    createdAt: at,
  }
  state.payrolls.unshift(payroll)
  notify(state, clock, 'APPROVAL', `اعتماد مسير ${payroll.month}`, `الصافي ${payroll.totalNet} ر.ع.`, ['GM'], `appr:prl:${payroll.id}`)
  audit(state, actor, clock, 'إنشاء مسير رواتب', 'payroll', payroll.id, payroll.number)
  return ok(state, `تم إرسال مسير ${payroll.month} للاعتماد`)
}

function decidePayroll(state: ErpState, actor: Actor, input: Extract<Command, { action: 'decidePayroll' }>['input'], clock: Clock): CommandResult {
  const payroll = state.payrolls.find((item) => item.id === input.id)
  if (!payroll) return fail('المسير غير موجود')
  if (payroll.status !== 'PENDING_APPROVAL') return fail('تمت معالجة المسير')
  if (input.decision === 'REJECTED') {
    payroll.status = 'REJECTED'
    payroll.decidedBy = actor.id
    audit(state, actor, clock, 'رفض مسير', 'payroll', payroll.id, payroll.number)
    return ok(state, `تم رفض ${payroll.number}`)
  }
  const gross = money(payroll.lines.reduce((sum, line) => sum + line.gross, 0))
  const deductions = money(payroll.lines.reduce((sum, line) => sum + line.deductions, 0))
  postJournal(state, clock, `رواتب ${payroll.month}`, 'payroll', payroll.id, [
    { accountCode: '6100', debit: gross, credit: 0 },
    { accountCode: '2400', debit: 0, credit: payroll.totalNet },
    { accountCode: '2500', debit: 0, credit: deductions },
  ])
  payroll.status = 'APPROVED'
  payroll.decidedBy = actor.id
  audit(state, actor, clock, 'اعتماد مسير رواتب', 'payroll', payroll.id, payroll.number)
  return ok(state, `تم اعتماد مسير ${payroll.month}`)
}

function payPayroll(state: ErpState, actor: Actor, input: Extract<Command, { action: 'payPayroll' }>['input'], clock: Clock): CommandResult {
  const payroll = state.payrolls.find((item) => item.id === input.id)
  if (!payroll) return fail('المسير غير موجود')
  if (payroll.status !== 'APPROVED') return fail('اعتمد المسير قبل الصرف')
  postJournal(state, clock, `صرف رواتب ${payroll.month}`, 'payroll', payroll.id, [
    { accountCode: '2400', debit: payroll.totalNet, credit: 0 },
    { accountCode: '1500', debit: 0, credit: payroll.totalNet },
  ])
  payroll.status = 'PAID'
  audit(state, actor, clock, 'صرف رواتب', 'payroll', payroll.id, payroll.number)
  return ok(state, `تم صرف رواتب ${payroll.month}`)
}

function markNotificationRead(state: ErpState, actor: Actor, input: Extract<Command, { action: 'markNotificationRead' }>['input'], clock: Clock): CommandResult {
  const note = state.notifications.find((item) => item.id === input.id)
  if (!note) return fail('الإشعار غير موجود')
  note.read = true
  audit(state, actor, clock, 'قراءة إشعار', 'notification', note.id, note.title)
  return ok(state, 'تم تعليم الإشعار كمقروء')
}

function scanBarcode(state: ErpState, actor: Actor, input: Extract<Command, { action: 'scanBarcode' }>['input'], clock: Clock): CommandResult {
  const code = input.code.trim()
  if (!code) return fail('مرّر الباركود أو اكتبه')
  const material = state.materials.find((item) => item.barcode === code || item.code === code)
  const product = state.products.find((item) => item.barcode === code || item.code === code)
  if (!material && !product) return fail('لا يوجد صنف بهذا الباركود')
  const itemType: ItemType = material ? 'MATERIAL' : 'PRODUCT'
  const itemId = material?.id ?? product!.id
  const balances = state.balances.filter((row) => row.itemType === itemType && row.itemId === itemId && row.qty > 0)
  audit(state, actor, clock, 'مسح باركود', itemType === 'MATERIAL' ? 'material' : 'product', itemId, code)
  return ok(state, material ? material.nameAr : product!.nameAr, {
    itemType,
    itemId,
    code: material?.code ?? product!.code,
    nameAr: material?.nameAr ?? product!.nameAr,
    balances,
  })
}

function setRolePermissions(state: ErpState, actor: Actor, input: Extract<Command, { action: 'setRolePermissions' }>['input'], clock: Clock): CommandResult {
  const allowed = new Set<string>(PERMISSIONS)
  const next = input.permissions.filter((item): item is Permission => allowed.has(item))
  if (input.role === 'GM' && !next.includes('users.manage')) return fail('لا يمكن سحب إدارة المستخدمين من المدير العام')
  state.rolePermissions[input.role] = next
  audit(state, actor, clock, 'تحديث صلاحيات', 'role', input.role, `${next.length} صلاحية`)
  return ok(state, 'تم تحديث صلاحيات الدور')
}

function archiveHistory(state: ErpState, actor: Actor, input: Extract<Command, { action: 'archiveHistory' }>['input'], clock: Clock): CommandResult {
  if (!Number.isFinite(input.olderThanDays) || input.olderThanDays < 1) return fail('مدة الأرشفة غير صحيحة')
  const plan = planArchive(state, input.olderThanDays, input.nowIso ?? clock.now())
  applyArchive(state, plan)
  const count = plan.ledger.length + plan.journals.length + plan.auditLogs.length
  audit(state, actor, clock, 'أرشفة السجلات', 'archive', plan.cutoffIso, `${count} سجل`)
  return ok(state, count ? `تمت أرشفة ${count} سجل أقدم من ${input.olderThanDays} يوماً` : 'لا توجد سجلات أقدم من المدة المحددة', {
    ledger: plan.ledger.length,
    journals: plan.journals.length,
    auditLogs: plan.auditLogs.length,
  })
}

function cleanLimits(limits: Extract<Command, { action: 'setQcLimits' }>['input']['limits']) {
  const next: typeof limits = {}
  const keys = ['minMoisture', 'maxMoisture', 'minProtein', 'maxProtein', 'minAsh', 'maxAsh'] as const
  for (const key of keys) {
    const value = limits[key]
    if (value == null || value === ('' as unknown)) continue
    if (!Number.isFinite(value) || value < 0 || value > 100) return { error: 'حد الجودة يجب أن يكون بين 0 و 100' }
    next[key] = round3(value)
  }
  const pairs = [
    ['minMoisture', 'maxMoisture'],
    ['minProtein', 'maxProtein'],
    ['minAsh', 'maxAsh'],
  ] as const
  for (const [minKey, maxKey] of pairs) {
    if (next[minKey] != null && next[maxKey] != null && next[minKey]! > next[maxKey]!) return { error: 'الحد الأدنى للجودة أكبر من الحد الأعلى' }
  }
  return { limits: next }
}

function syncLotQc(state: ErpState, lotNo: string | undefined, result: 'PASSED' | 'FAILED' | 'HOLD' | 'PENDING') {
  if (!lotNo) return
  const lot = state.lots?.find((item) => item.lotNo === lotNo)
  if (lot) lot.qcStatus = result
}

function notifyQc(state: ErpState, clock: Clock, sample: { type: string; result: string; materialId?: string; batchNo?: string; lotNo?: string; id: string }) {
  if (sample.result !== 'FAILED' && sample.result !== 'HOLD') return
  const label = sample.result === 'FAILED' ? 'مرفوضة' : 'معلّقة'
  const target = sample.type === 'FINISHED_PRODUCT' ? `دفعة ${sample.lotNo}` : `خامة ${sample.batchNo}`
  notify(
    state,
    clock,
    'QC',
    `جودة ${label}: ${target}`,
    sample.type === 'FINISHED_PRODUCT' ? 'لا يمكن بيع الدفعة أو سحبها حتى تُفك.' : 'لا يمكن تحويل الدفعة للتصنيع أو استهلاكها حتى تُفك.',
    ['GM', 'OPERATIONS', 'QUALITY'],
    `qc:${sample.type}:${sample.materialId ?? ''}:${sample.batchNo ?? ''}:${sample.lotNo ?? ''}:${sample.result}`,
  )
}

function createQualitySample(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createQualitySample' }>['input'], clock: Clock): CommandResult {
  state.qualitySamples ??= []
  const reading = { moisturePct: input.moisturePct, proteinPct: input.proteinPct, ashPct: input.ashPct }
  for (const value of Object.values(reading)) {
    if (value != null && (!Number.isFinite(value) || value < 0 || value > 100)) return fail('نسبة الفحص يجب أن تكون بين 0 و 100')
  }
  let limits: ReturnType<typeof cleanLimits>['limits']
  if (input.type === 'RAW_MATERIAL') {
    if (!input.materialId || !input.batchNo?.trim()) return fail('المادة ورقم الدفعة مطلوبان لعينة الخام')
    const material = state.materials.find((item) => item.id === input.materialId)
    if (!material) return fail('المادة غير موجودة')
    if (input.supplierId && !state.suppliers.some((item) => item.id === input.supplierId)) return fail('المورد غير موجود')
    limits = material.qcLimits
  } else {
    if (!input.lotNo?.trim()) return fail('رقم دفعة الإنتاج مطلوب')
    const lot = state.lots?.find((item) => item.lotNo === input.lotNo)
    if (!lot) return fail('دفعة الإنتاج غير موجودة')
    limits = state.products.find((item) => item.id === lot.productId)?.qcLimits
  }
  const suggested = suggestQcResult(limits, reading)
  const chosen = input.result ?? suggested
  if (input.result && input.result !== suggested && !input.reason?.trim()) return fail('تجاوز النتيجة المقترحة يحتاج سبباً')
  if (releasesBlock(suggested, chosen) && !actor.permissions.includes('qc.release')) {
    return fail('ليست لديك صلاحية لفك الحجز أو تجاوز الرفض')
  }
  if (releasesBlock(suggested, chosen) && !input.reason?.trim()) return fail('فك الحجز أو تجاوز الرفض يحتاج سبباً')
  const sample = {
    id: clock.id('qc'),
    type: input.type,
    materialId: input.materialId,
    batchNo: input.batchNo?.trim(),
    supplierId: input.supplierId,
    lotNo: input.lotNo?.trim(),
    sampledBy: actor.id,
    sampledAt: clock.now(),
    moisturePct: input.moisturePct != null ? round3(input.moisturePct) : undefined,
    proteinPct: input.proteinPct != null ? round3(input.proteinPct) : undefined,
    ashPct: input.ashPct != null ? round3(input.ashPct) : undefined,
    notes: input.notes?.trim() || undefined,
    result: chosen,
  }
  state.qualitySamples.unshift(sample)
  if (sample.type === 'FINISHED_PRODUCT') syncLotQc(state, sample.lotNo, sample.result)
  notifyQc(state, clock, sample)
  const detail = input.result && input.result !== suggested ? `تجاوز ${suggested} إلى ${chosen}: ${input.reason?.trim()}` : chosen
  audit(state, actor, clock, input.result && input.result !== suggested ? 'تجاوز نتيجة الجودة' : 'تسجيل عينة جودة', 'qualitySample', sample.id, detail)
  return ok(state, 'تم تسجيل عينة الجودة')
}

function updateQualityResult(state: ErpState, actor: Actor, input: Extract<Command, { action: 'updateQualityResult' }>['input'], clock: Clock): CommandResult {
  const sample = state.qualitySamples?.find((item) => item.id === input.sampleId)
  if (!sample) return fail('عينة الجودة غير موجودة')
  if (!input.reason?.trim()) return fail('سبب تغيير النتيجة مطلوب')
  if (releasesBlock(sample.result, input.result) && !actor.permissions.includes('qc.release')) {
    return fail('ليست لديك صلاحية لفك الحجز أو تجاوز الرفض')
  }
  const previous = sample.result
  sample.result = input.result
  if (sample.type === 'FINISHED_PRODUCT') syncLotQc(state, sample.lotNo, sample.result)
  notifyQc(state, clock, sample)
  audit(state, actor, clock, 'تغيير نتيجة الجودة', 'qualitySample', sample.id, `${previous} → ${input.result}: ${input.reason.trim()}`)
  return ok(state, 'تم تحديث نتيجة الجودة')
}

function setQcLimits(state: ErpState, actor: Actor, input: Extract<Command, { action: 'setQcLimits' }>['input'], clock: Clock): CommandResult {
  const cleaned = cleanLimits(input.limits)
  if ('error' in cleaned && cleaned.error) return fail(cleaned.error)
  if (input.itemType === 'MATERIAL') {
    const material = state.materials.find((item) => item.id === input.itemId)
    if (!material) return fail('المادة غير موجودة')
    material.qcLimits = cleaned.limits
  } else {
    const product = state.products.find((item) => item.id === input.itemId)
    if (!product) return fail('المنتج غير موجود')
    product.qcLimits = cleaned.limits
  }
  audit(state, actor, clock, 'تحديث حدود الجودة', input.itemType === 'MATERIAL' ? 'material' : 'product', input.itemId, 'حدود الرطوبة والبروتين والرماد')
  return ok(state, 'تم حفظ حدود الجودة')
}

function createVehicle(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createVehicle' }>['input'], clock: Clock): CommandResult {
  const code = input.code.trim().toUpperCase()
  if (!code || !input.plateNo.trim() || !input.type.trim() || !input.nameAr.trim()) {
    return fail('كود المركبة ورقم اللوحة والنوع والاسم مطلوبة')
  }
  if (state.vehicles.some((item) => item.code === code)) return fail('كود المركبة مستخدم')
  if (state.vehicles.some((item) => item.plateNo === input.plateNo.trim())) return fail('رقم اللوحة مستخدم')
  if (input.kmPerLiter !== undefined && (input.kmPerLiter <= 0 || input.kmPerLiter > 50)) {
    return fail('استهلاك الوقود غير صحيح (يجب أن يكون بين 0.1 و 50 كم/لتر)')
  }
  const vehicle: Vehicle = {
    id: clock.id('veh'),
    code,
    plateNo: input.plateNo.trim(),
    type: input.type.trim(),
    nameAr: input.nameAr.trim(),
    active: true,
    currentOdometer: 0,
    kmPerLiter: input.kmPerLiter,
  }
  state.vehicles.push(vehicle)
  audit(state, actor, clock, 'إنشاء مركبة', 'vehicle', vehicle.id, `${code} - ${input.nameAr.trim()}`)
  return ok(state, 'تم إنشاء المركبة')
}

function updateVehicle(state: ErpState, actor: Actor, input: Extract<Command, { action: 'updateVehicle' }>['input'], clock: Clock): CommandResult {
  const vehicle = state.vehicles.find((item) => item.id === input.id)
  if (!vehicle) return fail('المركبة غير موجودة')
  if (input.plateNo !== undefined) {
    const trimmed = input.plateNo.trim()
    if (!trimmed) return fail('رقم اللوحة مطلوب')
    if (state.vehicles.some((item) => item.id !== input.id && item.plateNo === trimmed)) {
      return fail('رقم اللوحة مستخدم')
    }
    vehicle.plateNo = trimmed
  }
  if (input.type !== undefined) vehicle.type = input.type.trim()
  if (input.nameAr !== undefined) vehicle.nameAr = input.nameAr.trim()
  if (input.active !== undefined) vehicle.active = input.active
  if (input.inspectionExpiryDate !== undefined) vehicle.inspectionExpiryDate = input.inspectionExpiryDate
  if (input.insuranceExpiryDate !== undefined) vehicle.insuranceExpiryDate = input.insuranceExpiryDate
  if (input.ownershipExpiryDate !== undefined) vehicle.ownershipExpiryDate = input.ownershipExpiryDate
  if (input.kmPerLiter !== undefined) {
    if (input.kmPerLiter <= 0 || input.kmPerLiter > 50) {
      return fail('استهلاك الوقود غير صحيح (يجب أن يكون بين 0.1 و 50 كم/لتر)')
    }
    vehicle.kmPerLiter = input.kmPerLiter
  }
  audit(state, actor, clock, 'تحديث مركبة', 'vehicle', vehicle.id, vehicle.code)
  return ok(state, 'تم تحديث المركبة')
}

function addFuelLog(state: ErpState, actor: Actor, input: Extract<Command, { action: 'addFuelLog' }>['input'], clock: Clock): CommandResult {
  const vehicle = state.vehicles.find((item) => item.id === input.vehicleId)
  if (!vehicle) return fail('المركبة غير موجودة')
  if (!vehicle.active) return fail('المركبة غير نشطة')
  const driver = state.employees.find((item) => item.id === input.driverId)
  if (!driver) return fail('السائق غير موجود')
  if (input.liters <= 0) return fail('كمية الوقود غير صحيحة')
  if (input.cost < 0) return fail('تكلفة الوقود غير صحيحة')
  if (input.odometer < 0) return fail('عداد الكيلومترات غير صحيح')
  
  // Validate odometer is not lower than previous reading
  const previousFuel = state.fuelLogs
    .filter((log) => log.vehicleId === input.vehicleId)
    .sort((a, b) => (a.odometer < b.odometer ? 1 : a.odometer > b.odometer ? -1 : 0))[0]
  if (previousFuel && input.odometer < previousFuel.odometer) {
    return fail(`عداد الكيلومترات (${input.odometer}) أقل من القراءة السابقة (${previousFuel.odometer})`)
  }
  
  const fuelLog: FuelLog = {
    id: clock.id('fuel'),
    vehicleId: input.vehicleId,
    date: input.date,
    liters: qty(input.liters),
    cost: money(input.cost),
    odometer: qty(input.odometer),
    driverId: input.driverId,
    station: input.station?.trim(),
    createdBy: actor.id,
    createdAt: clock.now(),
  }
  state.fuelLogs.push(fuelLog)
  vehicle.currentOdometer = qty(input.odometer)
  audit(state, actor, clock, 'تسجيل وقود', 'fuelLog', fuelLog.id, `${vehicle.code}: ${input.liters} لتر`)
  return ok(state, 'تم تسجيل الوقود')
}

function addVehicleService(state: ErpState, actor: Actor, input: Extract<Command, { action: 'addVehicleService' }>['input'], clock: Clock): CommandResult {
  const vehicle = state.vehicles.find((item) => item.id === input.vehicleId)
  if (!vehicle) return fail('المركبة غير موجودة')
  if (!vehicle.active) return fail('المركبة غير نشطة')
  if (!input.description.trim()) return fail('وصف الصيانة مطلوب')
  if (input.cost < 0) return fail('تكلفة الصيانة غير صحيحة')
  if (input.odometer < 0) return fail('عداد الكيلومترات غير صحيح')
  
  const service: VehicleService = {
    id: clock.id('srv'),
    vehicleId: input.vehicleId,
    date: input.date,
    kind: input.kind,
    description: input.description.trim(),
    cost: money(input.cost),
    odometer: qty(input.odometer),
    nextDueDate: input.nextDueDate,
    nextDueKm: input.nextDueKm !== undefined ? qty(input.nextDueKm) : undefined,
    supplierId: input.supplierId,
    createdBy: actor.id,
    createdAt: clock.now(),
  }
  state.vehicleServices.push(service)
  audit(state, actor, clock, 'تسجيل صيانة مركبة', 'vehicleService', service.id, `${vehicle.code}: ${input.kind}`)
  return ok(state, 'تم تسجيل الصيانة')
}

function createTrip(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createTrip' }>['input'], clock: Clock): CommandResult {
  const vehicle = state.vehicles.find((item) => item.id === input.vehicleId)
  if (!vehicle) return fail('المركبة غير موجودة')
  if (!vehicle.active) return fail('المركبة غير نشطة')
  const driver = state.employees.find((item) => item.id === input.driverId)
  if (!driver) return fail('السائق غير موجود')
  if (!input.destination.trim()) return fail('الوجهة مطلوبة')
  if (input.km <= 0) return fail('المسافة غير صحيحة')
  if (input.loadKg < 0) return fail('الحمولة غير صحيحة')
  if (input.fuelLiters < 0) return fail('وقود الرحلة غير صحيح')
  if (input.driverCost !== undefined && input.driverCost < 0) return fail('تكلفة السائق غير صحيحة')
  
  // Check fuel variance if vehicle has kmPerLiter
  let fuelVarianceReason = input.fuelVarianceReason
  if (vehicle.kmPerLiter && input.fuelLiters > 0) {
    const expectedLiters = input.km / vehicle.kmPerLiter
    const actualLiters = input.fuelLiters
    const threshold = state.company.fuelVarianceThresholdPct ?? 15
    const variancePct = Math.abs((actualLiters - expectedLiters) / expectedLiters) * 100
    
    if (variancePct > threshold && !fuelVarianceReason?.trim()) {
      return fail(`استهلاك الوقود (${variancePct.toFixed(1)}%) يتجاوز الحد المسموح (${threshold}%) - سبب مطلوب`)
    }
  }
  
  // Calculate trip cost (simplified: fuel cost per liter from recent logs + allocated service cost + driver cost)
  const recentFuelLogs = state.fuelLogs
    .filter((log) => log.vehicleId === input.vehicleId)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 5)
  
  const avgFuelCostPerLiter = recentFuelLogs.length > 0
    ? money(recentFuelLogs.reduce((sum, log) => sum + log.cost / log.liters, 0) / recentFuelLogs.length)
    : 0.3 // Default fallback
  
  const fuelCost = money(avgFuelCostPerLiter * input.fuelLiters)
  
  // Allocate vehicle service cost by distance: this trip's share of the vehicle's total kilometres.
  const totalServiceCost = state.vehicleServices
    .filter((srv) => srv.vehicleId === input.vehicleId)
    .reduce((sum, srv) => sum + srv.cost, 0)
  const priorKm = state.trips.filter((trip) => trip.vehicleId === input.vehicleId).reduce((sum, trip) => sum + trip.km, 0)
  const allocatedServiceCost = money(totalServiceCost * (input.km / (priorKm + input.km)))
  
  const tripCost = money(fuelCost + allocatedServiceCost + (input.driverCost || 0))
  
  const trip: Trip = {
    id: clock.id('trip'),
    vehicleId: input.vehicleId,
    driverId: input.driverId,
    date: input.date,
    destination: input.destination.trim(),
    km: qty(input.km),
    loadKg: qty(input.loadKg),
    fuelLiters: qty(input.fuelLiters),
    customerId: input.customerId,
    invoiceId: input.invoiceId,
    cost: tripCost,
    driverCost: input.driverCost,
    fuelVarianceReason: fuelVarianceReason?.trim(),
    createdBy: actor.id,
    createdAt: clock.now(),
  }
  state.trips.push(trip)
  
  // Notify if fuel variance exceeds threshold
  if (vehicle.kmPerLiter && input.fuelLiters > 0) {
    const expectedLiters = input.km / vehicle.kmPerLiter
    const actualLiters = input.fuelLiters
    const threshold = state.company.fuelVarianceThresholdPct ?? 15
    const variancePct = Math.abs((actualLiters - expectedLiters) / expectedLiters) * 100
    
    if (variancePct > threshold) {
      notify(
        state,
        clock,
        'INFO',
        `استهلاك وقود غير طبيعي: ${vehicle.code}`,
        `الرحلة إلى ${input.destination.trim()}: استهلاك ${variancePct.toFixed(1)}% أعلى من المتوقع`,
        ['GM', 'OPERATIONS'],
        `fuel-variance:${vehicle.id}:${trip.id}`,
      )
    }
  }
  
  audit(state, actor, clock, 'إنشاء رحلة', 'trip', trip.id, `${vehicle.code} → ${input.destination.trim()}`)
  return ok(state, 'تم إنشاء الرحلة')
}

function createObligation(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createObligation' }>['input'], clock: Clock): CommandResult {
  if (!input.beneficiary.trim() || !input.description.trim()) {
    return fail('المستفيد والوصف مطلوبان')
  }
  if (input.total <= 0) return fail('المبلغ الإجمالي غير صحيح')
  if (input.installmentAmount <= 0) return fail('مبلغ القسط غير صحيح')
  if (input.installmentAmount > input.total) return fail('مبلغ القسط لا يمكن أن يكون أكبر من المبلغ الإجمالي')
  if (!input.firstDueDate) return fail('تاريخ الاستحقاق الأول مطلوب')
  
  const threshold = state.company.obligationApprovalThreshold ?? 1000
  const needsApproval = input.total >= threshold
  
  const obligation: Obligation = {
    id: clock.id('obl'),
    beneficiary: input.beneficiary.trim(),
    description: input.description.trim(),
    kind: input.kind,
    total: money(input.total),
    installmentAmount: money(input.installmentAmount),
    firstDueDate: input.firstDueDate,
    frequency: input.frequency,
    numberOfInstallments: input.numberOfInstallments,
    status: needsApproval ? 'PENDING_APPROVAL' : 'ACTIVE',
    createdBy: actor.id,
    createdAt: clock.now(),
  }
  
  state.obligations.push(obligation)
  
  // Generate schedule lines
  const scheduleLines: ObligationScheduleLine[] = []
  let currentDate = new Date(input.firstDueDate)
  let remaining = input.total
  let installmentCount = 0
  
  while (remaining > 0.001 && (input.numberOfInstallments === undefined || installmentCount < input.numberOfInstallments)) {
    const amount = Math.min(input.installmentAmount, remaining)
    const scheduleLine: ObligationScheduleLine = {
      id: clock.id('osch'),
      obligationId: obligation.id,
      dueDate: currentDate.toISOString().slice(0, 10),
      amount: money(amount),
      paidAmount: 0,
      status: 'PENDING',
    }
    scheduleLines.push(scheduleLine)
    remaining -= amount
    installmentCount += 1
    
    // Advance date based on frequency
    switch (input.frequency) {
      case 'MONTHLY':
        currentDate.setMonth(currentDate.getMonth() + 1)
        break
      case 'QUARTERLY':
        currentDate.setMonth(currentDate.getMonth() + 3)
        break
      case 'YEARLY':
        currentDate.setFullYear(currentDate.getFullYear() + 1)
        break
      case 'ONE_TIME':
        remaining = 0 // Only one installment
        break
    }
  }
  
  state.obligationScheduleLines.push(...scheduleLines)
  
  if (needsApproval) {
    notify(
      state,
      clock,
      'APPROVAL',
      `التزام مالي يحتاج موافقة: ${input.beneficiary.trim()}`,
      `الالتزام: ${input.description.trim()} - المبلغ: ${input.total} ريال عماني`,
      ['GM', 'ACCOUNTANT'],
      `obligation-approval:${obligation.id}`,
    )
  }
  
  audit(state, actor, clock, 'إنشاء التزام مالي', 'obligation', obligation.id, `${input.beneficiary.trim()}: ${input.total} ريال عماني`)
  return ok(state, needsApproval ? 'تم إنشاء التزام ويحتاج موافقة' : 'تم إنشاء التزام المالي')
}

function decideObligation(state: ErpState, actor: Actor, input: Extract<Command, { action: 'decideObligation' }>['input'], clock: Clock): CommandResult {
  const obligation = state.obligations.find((item) => item.id === input.id)
  if (!obligation) return fail('الالتزام غير موجود')
  if (obligation.status !== 'PENDING_APPROVAL') return fail('الالتزام ليس في حالة انتظار الموافقة')
  
  if (input.decision === 'APPROVED') {
    obligation.status = 'ACTIVE'
    obligation.decidedBy = actor.id
    obligation.decidedAt = clock.now()
    audit(state, actor, clock, 'موافقة على التزام', 'obligation', obligation.id, obligation.description)
    return ok(state, 'تمت الموافقة على التزام')
  } else {
    obligation.status = 'CANCELLED'
    obligation.decidedBy = actor.id
    obligation.decidedAt = clock.now()
    // Cancel all schedule lines
    for (const line of state.obligationScheduleLines) {
      if (line.obligationId === obligation.id) {
        line.status = 'PENDING' // Keep as pending but obligation is cancelled
      }
    }
    audit(state, actor, clock, 'رفض التزام', 'obligation', obligation.id, obligation.description)
    return ok(state, 'تم رفض التزام')
  }
}

function payObligationInstallment(state: ErpState, actor: Actor, input: Extract<Command, { action: 'payObligationInstallment' }>['input'], clock: Clock): CommandResult {
  const scheduleLine = state.obligationScheduleLines.find((item) => item.id === input.scheduleLineId)
  if (!scheduleLine) return fail('بند القسط غير موجود')
  if (scheduleLine.status === 'PAID') return fail('هذا القسط مدفوع بالفعل')
  
  const obligation = state.obligations.find((item) => item.id === scheduleLine.obligationId)
  if (!obligation) return fail('الالتزام غير موجود')
  if (obligation.status !== 'ACTIVE') return fail('الالتزام غير نشط')
  
  if (input.amount <= 0) return fail('مبلغ الدفع غير صحيح')
  if (input.amount > (scheduleLine.amount - scheduleLine.paidAmount)) {
    return fail('مبلغ الدفع يتجاوز المبلغ المتبقي')
  }
  
  // Create payment record
  const paidAt = input.date?.trim() || clock.now().slice(0, 10)
  const payment: ObligationPayment = {
    id: clock.id('opay'),
    obligationId: obligation.id,
    scheduleLineId: scheduleLine.id,
    amount: money(input.amount),
    date: paidAt,
    method: input.method,
    reference: input.reference?.trim(),
    createdBy: actor.id,
    createdAt: clock.now(),
  }
  state.obligationPayments.push(payment)
  
  // Update schedule line
  scheduleLine.paidAmount = money(scheduleLine.paidAmount + input.amount)
  if (scheduleLine.paidAmount >= scheduleLine.amount - 0.001) {
    scheduleLine.status = 'PAID'
  }
  
  postJournal(state, clock, `دفع قسط التزام: ${obligation.description}`, 'obligationPayment', payment.id, [
    { accountCode: '2700', debit: money(input.amount), credit: 0 },
    { accountCode: '1500', debit: 0, credit: money(input.amount) },
  ])
  
  // Check if obligation is fully paid
  const totalPaid = state.obligationScheduleLines
    .filter((line) => line.obligationId === obligation.id)
    .reduce((sum, line) => sum + line.paidAmount, 0)
  
  if (totalPaid >= obligation.total - 0.001) {
    obligation.status = 'COMPLETED'
  }
  
  audit(state, actor, clock, 'دفع قسط التزام', 'obligationPayment', payment.id, `${obligation.description}: ${input.amount} ريال عماني`)
  return ok(state, 'تم دفع القسط بنجاح')
}

const DOCUMENT_KIND_LABEL: Record<CompanyDocument['kind'], string> = {
  LICENSE: 'ترخيص',
  OWNERSHIP: 'ملكية',
  INSURANCE: 'تأمين',
  CONTRACT: 'عقد',
  LEASE: 'إيجار',
  GOV_PERMIT: 'تصريح حكومي',
  CERTIFICATE: 'شهادة',
  INSPECTION: 'فحص دوري',
  OTHER: 'مستند',
}

/** Spec alert ladder for expiring documents. Widest window first: findLast picks the tightest one that still applies. */
const EXPIRY_ALERT_DAYS = [90, 60, 30, 7] as const

function daysUntil(today: string, dateIso: string) {
  const from = Date.parse(`${today}T00:00:00Z`)
  const to = Date.parse(`${dateIso.slice(0, 10)}T00:00:00Z`)
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null
  return Math.round((to - from) / 86400000)
}

function isDay(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value))
}

function isKnownPerson(state: ErpState, id: string) {
  return state.users.some((user) => user.id === id) || state.employees.some((employee) => employee.id === id)
}

function resolveDocumentEntity(state: ErpState, entityType?: CompanyDocument['entityType'], entityId?: string) {
  if (!entityType || entityType === 'COMPANY') return { ok: true as const, name: state.company.nameAr }
  if (!entityId) return { ok: false as const, error: 'الجهة المرتبطة بالمستند مطلوبة' }
  const name =
    entityType === 'VEHICLE'
      ? state.vehicles.find((item) => item.id === entityId)?.plateNo
      : entityType === 'EMPLOYEE'
        ? state.employees.find((item) => item.id === entityId)?.nameAr
        : entityType === 'SUPPLIER'
          ? state.suppliers.find((item) => item.id === entityId)?.nameAr
          : entityType === 'CUSTOMER'
            ? state.customers.find((item) => item.id === entityId)?.nameAr
            : state.machines.find((item) => item.id === entityId)?.nameAr
  if (!name) return { ok: false as const, error: 'الجهة المرتبطة بالمستند غير موجودة' }
  return { ok: true as const, name }
}

function createCompanyDocument(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createCompanyDocument' }>['input'], clock: Clock): CommandResult {
  const title = input.title.trim()
  if (!title) return fail('عنوان المستند مطلوب')
  if (!input.issueDate) return fail('تاريخ الإصدار مطلوب')
  const entity = resolveDocumentEntity(state, input.entityType, input.entityId)
  if (!entity.ok) return fail(entity.error)
  if (input.expiryDate && input.expiryDate <= input.issueDate) return fail('تاريخ الانتهاء يجب أن يكون بعد تاريخ الإصدار')
  if (input.cost !== undefined && (!Number.isFinite(input.cost) || input.cost < 0)) return fail('تكلفة المستند غير صحيحة')
  const renewalOwnerId = input.renewalOwnerId?.trim()
  if (renewalOwnerId && !isKnownPerson(state, renewalOwnerId)) return fail('المسؤول عن التجديد غير موجود')

  const document: CompanyDocument = {
    id: clock.id('doc'),
    title,
    kind: input.kind,
    entityType: input.entityType,
    entityId: input.entityId,
    issueDate: input.issueDate,
    expiryDate: input.expiryDate || undefined,
    cost: input.cost === undefined ? undefined : money(input.cost),
    renewalOwnerId: renewalOwnerId || undefined,
    notes: input.notes?.trim() || undefined,
    attachmentId: input.attachmentId?.trim() || undefined,
    createdBy: actor.id,
    createdAt: clock.now(),
  }

  state.companyDocuments.unshift(document)
  audit(state, actor, clock, 'إنشاء مستند', 'companyDocument', document.id, `${DOCUMENT_KIND_LABEL[document.kind]}: ${title} (${entity.name})`)
  return ok(state, 'تم حفظ المستند')
}

function renewCompanyDocument(state: ErpState, actor: Actor, input: Extract<Command, { action: 'renewCompanyDocument' }>['input'], clock: Clock): CommandResult {
  const document = state.companyDocuments.find((item) => item.id === input.id)
  if (!document) return fail('المستند غير موجود')
  if (!input.issueDate) return fail('تاريخ الإصدار مطلوب')
  const expiryDate = input.expiryDate === undefined ? document.expiryDate : input.expiryDate || undefined
  if (expiryDate && expiryDate <= input.issueDate) return fail('تاريخ الانتهاء يجب أن يكون بعد تاريخ الإصدار')
  if (input.cost !== undefined && (!Number.isFinite(input.cost) || input.cost < 0)) return fail('تكلفة التجديد غير صحيحة')

  document.issueDate = input.issueDate
  document.expiryDate = expiryDate
  if (input.cost !== undefined) document.cost = money(input.cost)
  if (input.notes !== undefined) document.notes = input.notes.trim() || undefined
  if (input.attachmentId !== undefined) document.attachmentId = input.attachmentId.trim() || undefined

  for (const note of state.notifications) {
    if (!note.read && note.dedupeKey.startsWith(`doc:${document.id}:`)) note.read = true
  }

  audit(state, actor, clock, 'تجديد مستند', 'companyDocument', document.id, `${document.title} — إصدار ${document.issueDate}`)
  return ok(state, 'تم تجديد المستند')
}

function refreshDocumentAlerts(state: ErpState, clock: Clock, today: string) {
  for (const document of state.companyDocuments) {
    if (!document.expiryDate) continue
    const left = daysUntil(today, document.expiryDate)
    if (left === null) continue
    const label = `${DOCUMENT_KIND_LABEL[document.kind]}: ${document.title}`
    if (left < 0) {
      notify(
        state,
        clock,
        'EXPIRY',
        `مستند منتهي: ${document.title}`,
        `${label} انتهى ${document.expiryDate}.`,
        ['GM', 'ACCOUNTANT'],
        `doc:${document.id}:expired`,
      )
      continue
    }
    const window = EXPIRY_ALERT_DAYS.findLast((days) => left <= days)
    if (window === undefined) continue
    notify(
      state,
      clock,
      'EXPIRY',
      `مستند قارب الانتهاء: ${document.title}`,
      `${label} ينتهي ${document.expiryDate} — بعد ${left} يوماً.`,
      ['GM', 'ACCOUNTANT'],
      `doc:${document.id}:expiry:${window}`,
    )
  }
}

/** Same 90/60/30/7 ladder as company documents, for any dated paper attached to an entity. */
function expiryLadder(
  state: ErpState,
  clock: Clock,
  today: string,
  key: string,
  expiryDate: string,
  expiredTitle: string,
  soonTitle: string,
  body: (left: number) => string,
  roles: RoleKey[],
) {
  const left = daysUntil(today, expiryDate)
  if (left === null) return
  if (left < 0) {
    notify(state, clock, 'EXPIRY', expiredTitle, body(left), roles, `${key}:expired`)
    return
  }
  const window = EXPIRY_ALERT_DAYS.findLast((days) => left <= days)
  if (window === undefined) return
  notify(state, clock, 'EXPIRY', soonTitle, body(left), roles, `${key}:expiry:${window}`)
}

function refreshEntityAlerts(state: ErpState, clock: Clock, today: string) {
  for (const vehicle of state.vehicles) {
    if (!vehicle.active) continue
    const papers = [
      { key: 'inspection', label: 'الفحص الدوري', date: vehicle.inspectionExpiryDate },
      { key: 'insurance', label: 'التأمين', date: vehicle.insuranceExpiryDate },
      { key: 'ownership', label: 'الملكية', date: vehicle.ownershipExpiryDate },
    ]
    for (const paper of papers) {
      if (!paper.date) continue
      expiryLadder(
        state,
        clock,
        today,
        `vehicle:${vehicle.id}:${paper.key}`,
        paper.date,
        `ورقة سيارة منتهية: ${vehicle.nameAr}`,
        `ورقة سيارة قاربت الانتهاء: ${vehicle.nameAr}`,
        (left) => `${paper.label} للسيارة ${vehicle.plateNo} ${left < 0 ? `انتهى ${paper.date}.` : `ينتهي ${paper.date} — بعد ${left} يوماً.`}`,
        ['GM', 'OPERATIONS'],
      )
    }

    // Latest service per kind with a nextDueDate drives the upcoming-maintenance alert.
    const latestServiceByKind = new Map<VehicleService['kind'], VehicleService>()
    for (const service of state.vehicleServices) {
      if (service.vehicleId !== vehicle.id || !service.nextDueDate) continue
      const current = latestServiceByKind.get(service.kind)
      if (!current || service.date > current.date) latestServiceByKind.set(service.kind, service)
    }
    for (const service of latestServiceByKind.values()) {
      expiryLadder(
        state,
        clock,
        today,
        `vehicle:${vehicle.id}:service:${service.kind}:${service.nextDueDate}`,
        service.nextDueDate!,
        `صيانة سيارة متأخرة: ${vehicle.nameAr}`,
        `صيانة سيارة قادمة: ${vehicle.nameAr}`,
        (left) =>
          left < 0
            ? `صيانة ${vehicle.plateNo} (${service.kind}) كانت مستحقة ${service.nextDueDate}.`
            : `صيانة ${vehicle.plateNo} (${service.kind}) تستحق ${service.nextDueDate} — بعد ${left} يوماً.`,
        ['GM', 'OPERATIONS'],
      )
    }
  }

  for (const employee of state.employees) {
    if (!employee.active) continue
    const papers = [
      { key: 'id', label: 'البطاقة المدنية', date: employee.idExpiryDate },
      { key: 'residence', label: 'الإقامة', date: employee.residenceExpiryDate },
      { key: 'contract', label: 'عقد العمل', date: employee.contractExpiryDate },
    ]
    for (const paper of papers) {
      if (!paper.date) continue
      expiryLadder(
        state,
        clock,
        today,
        `employee:${employee.id}:${paper.key}`,
        paper.date,
        `ورقة موظف منتهية: ${employee.nameAr}`,
        `ورقة موظف قاربت الانتهاء: ${employee.nameAr}`,
        (left) => `${paper.label} للموظف ${employee.nameAr} ${left < 0 ? `انتهت ${paper.date}.` : `تنتهي ${paper.date} — بعد ${left} يوماً.`}`,
        ['GM', 'ACCOUNTANT'],
      )
    }
  }

  for (const machine of state.machines) {
    if (!machine.active || !machine.nextMaintenanceDate) continue
    expiryLadder(
      state,
      clock,
      today,
      `machine:${machine.id}:maintenance`,
      machine.nextMaintenanceDate,
      `صيانة متأخرة: ${machine.nameAr}`,
      `صيانة قادمة: ${machine.nameAr}`,
      (left) =>
        left < 0
          ? `صيانة ${machine.nameAr} كانت مستحقة ${machine.nextMaintenanceDate}.`
          : `صيانة ${machine.nameAr} تستحق ${machine.nextMaintenanceDate} — بعد ${left} يوماً.`,
      ['GM', 'OPERATIONS'],
    )
  }

  for (const schedule of state.maintenanceSchedules) {
    if (schedule.type !== 'HOURS_BASED' || schedule.interval <= 0) continue
    const machine = state.machines.find((item) => item.id === schedule.machineId)
    if (!machine || !machine.active) continue
    const used = qty(machine.operatingHours - (schedule.hoursAtLastCompletion ?? 0))
    if (used < schedule.interval) continue
    notify(
      state,
      clock,
      'INFO',
      `صيانة مستحقة بالساعات: ${machine.nameAr}`,
      `${schedule.description} — ساعات التشغيل منذ آخر صيانة ${used} والحد ${schedule.interval}.`,
      ['GM', 'OPERATIONS'],
      `machine:${schedule.id}:hours`,
    )
  }

  for (const part of state.spareParts) {
    if (!part.active) continue
    const dedupeKey = `low-spare:${part.id}`
    if (part.quantity <= part.minStock) {
      notify(
        state,
        clock,
        'LOW_STOCK',
        `قطع غيار تحت الحد: ${part.nameAr}`,
        `الرصيد ${part.quantity} والحد الأدنى ${part.minStock}.`,
        ['GM', 'OPERATIONS'],
        dedupeKey,
      )
    } else {
      for (const note of state.notifications) {
        if (note.dedupeKey === dedupeKey && !note.read) note.read = true
      }
    }
  }

  for (const item of state.packagingMaterials) {
    if (!item.active) continue
    const dedupeKey = `low-packaging:${item.id}`
    if (item.quantity <= item.minStock) {
      notify(
        state,
        clock,
        'LOW_STOCK',
        `مادة تعبئة تحت الحد: ${item.nameAr}`,
        `الرصيد ${item.quantity} ${item.unit} والحد الأدنى ${item.minStock}.`,
        ['GM', 'OPERATIONS'],
        dedupeKey,
      )
    } else {
      for (const note of state.notifications) {
        if (note.dedupeKey === dedupeKey && !note.read) note.read = true
      }
    }
  }
}

function refreshObligationAlerts(state: ErpState, clock: Clock) {
  const today = clock.now().slice(0, 10)
  const windows = [30, 14, 7, 1] as const
  
  for (const obligation of state.obligations) {
    if (obligation.status !== 'ACTIVE') continue
    
    for (const scheduleLine of state.obligationScheduleLines) {
      if (scheduleLine.obligationId !== obligation.id) continue
      if (scheduleLine.status === 'PAID') continue
      
      const dueDate = scheduleLine.dueDate
      const daysUntilDue = Math.ceil((new Date(dueDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
      
      // Check overdue
      if (daysUntilDue < 0) {
        const dedupeKey = `obligation-overdue:${scheduleLine.id}`
        if (!state.notifications.some((n) => !n.read && n.dedupeKey === dedupeKey)) {
          notify(
            state,
            clock,
            'OBLIGATION',
            `قسط متأخر: ${obligation.beneficiary}`,
            `القسط المستحق ${dueDate} - المبلغ: ${scheduleLine.amount} ريال عماني`,
            ['GM', 'ACCOUNTANT'],
            dedupeKey,
          )
        }
        continue
      }
      
      // Check alert windows
      for (const window of windows) {
        if (daysUntilDue === window) {
          const dedupeKey = `obligation-reminder:${window}d:${scheduleLine.id}`
          if (!state.notifications.some((n) => !n.read && n.dedupeKey === dedupeKey)) {
            notify(
              state,
              clock,
              'OBLIGATION',
              `قسط يستحق خلال ${window} يوم: ${obligation.beneficiary}`,
              `الاستحقاق ${dueDate} - المبلغ: ${scheduleLine.amount} ريال عماني`,
              ['GM', 'ACCOUNTANT'],
              dedupeKey,
            )
          }
        }
      }
    }
  }
}

function setUserPassword(state: ErpState, actor: Actor, input: Extract<Command, { action: 'setUserPassword' }>['input'], clock: Clock): CommandResult {
  const user = state.users.find((item) => item.id === input.userId)
  if (!user) return fail('المستخدم غير موجود')
  if (!input.passwordHash) return fail('كلمة المرور مطلوبة')
  user.passwordHash = input.passwordHash
  user.mustChangePassword = false
  audit(state, actor, clock, 'تغيير كلمة المرور', 'user', user.id, user.email)
  return ok(state, 'تم تحديث كلمة المرور')
}

function canAny(permissions: readonly string[], keys: readonly string[]) {
  return keys.some((key) => permissions.includes(key))
}

/** Strip secrets and collections the caller is not allowed to read. */
export function publicState(state: ErpState, permissions: readonly string[], userId?: string): PublicState {
  const seeSalary = canAny(permissions, ['employees.read', 'employees.manage'])
  const seePayroll = canAny(permissions, ['payroll.manage', 'payroll.approve', 'payroll.pay'])
  const seeJournals = canAny(permissions, ['accounting.read', 'accounting.manage'])
  const seeAudit = permissions.includes('audit.read')
  const seeAttendance = canAny(permissions, ['attendance.read', 'attendance.manage'])
  const isDriver = permissions.includes('fleet.read') && !permissions.includes('fleet.manage')
  
  // DRIVER role filtering: only see own trips and fuel logs, no financial data
  const filteredTrips = isDriver && userId 
    ? state.trips.filter((trip) => trip.driverId === userId)
    : state.trips
  const filteredFuelLogs = isDriver && userId
    ? state.fuelLogs.filter((log) => log.driverId === userId)
    : state.fuelLogs
  
  return {
    ...state,
    idempotency: [],
    users: state.users.map(({ passwordHash: _password, ...user }) => user),
    employees: seeSalary
      ? state.employees
      : state.employees.map((employee) => {
          const { basicSalary: _salary, ...rest } = employee
          return rest as typeof employee
        }),
    payrolls: seePayroll ? state.payrolls : [],
    journals: seeJournals ? state.journals : [],
    auditLogs: seeAudit ? state.auditLogs : [],
    attendance: seeAttendance ? state.attendance : [],
    trips: filteredTrips,
    fuelLogs: filteredFuelLogs,
  }
}

export function actorFromUser(state: ErpState, userId: string): Actor | null {
  const user = state.users.find((item) => item.id === userId && item.active)
  if (!user) return null
  return {
    id: user.id,
    name: user.fullName,
    role: user.role,
    permissions: state.rolePermissions[user.role],
    mustChangePassword: Boolean(user.mustChangePassword),
  }
}

function createSparePart(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createSparePart' }>['input'], clock: Clock): CommandResult {
  const code = input.code.trim().toUpperCase()
  if (!code || !input.nameAr.trim()) return fail('كود القطعة والاسم مطلوبان')
  if (state.spareParts.some((item) => item.code === code)) return fail('كود القطعة مستخدم')
  const sparePart: SparePart = {
    id: clock.id('sp'),
    code,
    nameAr: input.nameAr.trim(),
    description: input.description?.trim(),
    quantity: qty(input.quantity),
    unitCost: money(input.unitCost),
    minStock: qty(input.minStock),
    supplierId: input.supplierId,
    machineIds: input.machineIds,
    active: true,
  }
  state.spareParts.unshift(sparePart)
  audit(state, actor, clock, 'إنشاء قطعة غيار', 'sparePart', sparePart.id, sparePart.nameAr)
  return ok(state, 'تم حفظ قطعة الغيار')
}

function recordSparePartUsage(state: ErpState, actor: Actor, input: Extract<Command, { action: 'recordSparePartUsage' }>['input'], clock: Clock): CommandResult {
  const sparePart = state.spareParts.find((item) => item.id === input.sparePartId)
  if (!sparePart) return fail('قطعة الغيار غير موجودة')
  if (input.quantity <= 0) return fail('الكمية غير صحيحة')
  if (input.quantity > sparePart.quantity) return fail('الكمية تتجاوز الرصيد المتاح')

  const usage: SparePartUsage = {
    id: clock.id('spu'),
    sparePartId: input.sparePartId,
    machineId: input.machineId,
    date: clock.now(),
    quantity: qty(input.quantity),
    cost: money(input.quantity * sparePart.unitCost),
    reason: input.reason.trim(),
    usedBy: actor.id,
    maintenanceId: input.maintenanceId,
  }

  sparePart.quantity = qty(sparePart.quantity - input.quantity)
  state.sparePartUsages.unshift(usage)
  audit(state, actor, clock, 'صرف قطعة غيار', 'sparePartUsage', usage.id, `${sparePart.nameAr}: ${input.quantity}`)
  return ok(state, 'تم تسجيل صرف قطعة الغيار')
}

function createPackagingMaterial(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createPackagingMaterial' }>['input'], clock: Clock): CommandResult {
  const code = input.code.trim().toUpperCase()
  if (!code || !input.nameAr.trim()) return fail('كود المادة والتسمية مطلوبان')
  if (state.packagingMaterials.some((item) => item.code === code)) return fail('كود المادة مستخدم')
  if (input.expectedPerTon !== undefined && (!Number.isFinite(input.expectedPerTon) || input.expectedPerTon < 0)) {
    return fail('معدل الاستهلاك لكل طن غير صحيح')
  }
  const packaging: PackagingMaterial = {
    id: clock.id('pkg'),
    code,
    nameAr: input.nameAr.trim(),
    category: input.category,
    quantity: qty(input.quantity),
    unit: input.unit.trim(),
    unitCost: money(input.unitCost),
    minStock: qty(input.minStock),
    supplierId: input.supplierId,
    active: true,
    expectedPerTon: input.expectedPerTon,
  }
  state.packagingMaterials.unshift(packaging)
  audit(state, actor, clock, 'إنشاء مادة تعبئة', 'packagingMaterial', packaging.id, packaging.nameAr)
  return ok(state, 'تم حفظ مادة التعبئة')
}

function recordPackagingConsumption(state: ErpState, actor: Actor, input: Extract<Command, { action: 'recordPackagingConsumption' }>['input'], clock: Clock): CommandResult {
  const packaging = state.packagingMaterials.find((item) => item.id === input.packagingMaterialId)
  if (!packaging) return fail('مادة التعبئة غير موجودة')
  if (input.quantity <= 0) return fail('الكمية غير صحيحة')

  const productionOrder = state.productionOrders.find((item) => item.id === input.productionOrderId)
  if (!productionOrder) return fail('أمر الإنتاج غير موجود')

  const lot = state.lots?.find((l) => l.lotNo === input.lotNo)
  if (!lot) return fail('الدفعة غير موجودة')

  const product = state.products.find((item) => item.id === lot.productId)
  const tons = qty(lot.actualOutputKg / 1000)
  const bagRate = product && product.bagKg > 0 ? qty(1000 / product.bagKg) : null
  const rate = packaging.expectedPerTon ?? (packaging.category === 'BAG' ? bagRate : null)
  const expectedQty = rate === null ? qty(input.quantity) : qty(tons * rate)
  const variance = qty(input.quantity - expectedQty)

  const consumption: PackagingConsumption = {
    id: clock.id('pkc'),
    packagingMaterialId: input.packagingMaterialId,
    productionOrderId: input.productionOrderId,
    lotNo: input.lotNo,
    date: clock.now(),
    quantity: qty(input.quantity),
    cost: money(input.quantity * packaging.unitCost),
    calculatedQty: expectedQty,
    variance,
  }

  packaging.quantity = qty(packaging.quantity - input.quantity)
  state.packagingConsumption.unshift(consumption)
  audit(state, actor, clock, 'استهلاك مواد تعبئة', 'packagingConsumption', consumption.id, `${packaging.nameAr}: ${input.quantity}`)
  return ok(state, 'تم تسجيل استهلاك مواد التعبئة')
}

function createSupplierTemplate(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createSupplierTemplate' }>['input'], clock: Clock): CommandResult {
  if (!input.nameAr.trim() || !input.subject.trim() || !input.body.trim()) {
    return fail('الاسم والموضوع والمحتوى مطلوبة')
  }
  const template: SupplierTemplate = {
    id: clock.id('tpl'),
    nameAr: input.nameAr.trim(),
    subject: input.subject.trim(),
    body: input.body.trim(),
    kind: input.kind,
    active: true,
  }
  state.supplierTemplates.unshift(template)
  audit(state, actor, clock, 'إنشاء قالب تواصل', 'supplierTemplate', template.id, template.nameAr)
  return ok(state, 'تم حفظ قالب التواصل')
}

function sendSupplierCommunication(state: ErpState, actor: Actor, input: Extract<Command, { action: 'sendSupplierCommunication' }>['input'], clock: Clock): CommandResult {
  const supplier = state.suppliers.find((item) => item.id === input.supplierId)
  if (!supplier) return fail('المورد غير موجود')
  if (!input.subject.trim() || !input.body.trim()) return fail('الموضوع والمحتوى مطلوبان')

  const communication: SupplierCommunication = {
    id: clock.id('sc'),
    supplierId: input.supplierId,
    templateId: input.templateId,
    subject: input.subject.trim(),
    body: input.body.trim(),
    sentBy: actor.id,
    sentAt: clock.now(),
    channel: input.channel,
    status: 'PENDING_APPROVAL',
  }

  state.supplierCommunications.unshift(communication)
  audit(state, actor, clock, 'إرسال تواصل مورد', 'supplierCommunication', communication.id, supplier.nameAr)
  return ok(state, 'تم إنشاء التواصل بانتظار الاعتماد')
}

function approveSupplierCommunication(state: ErpState, actor: Actor, input: Extract<Command, { action: 'approveSupplierCommunication' }>['input'], clock: Clock): CommandResult {
  const communication = state.supplierCommunications.find((item) => item.id === input.id)
  if (!communication) return fail('التواصل غير موجود')
  if (communication.status !== 'PENDING_APPROVAL') return fail('التواصل ليس بانتظار الاعتماد')

  communication.status = 'SENT'
  communication.approvedBy = actor.id
  communication.approvedAt = clock.now()

  audit(state, actor, clock, 'اعتماد تواصل مورد', 'supplierCommunication', communication.id, communication.subject)
  return ok(state, 'تم اعتماد وإرسال التواصل')
}

function recordScaleReading(state: ErpState, actor: Actor, input: Extract<Command, { action: 'recordScaleReading' }>['input'], clock: Clock): CommandResult {
  const material = state.materials.find((item) => item.id === input.materialId)
  if (!material) return fail('المادة الخام غير موجودة')
  const productionOrder = state.productionOrders.find((item) => item.id === input.productionOrderId)
  if (!productionOrder) return fail('أمر الإنتاج غير موجود')

  const variance = qty(input.actualQty - input.expectedQty)
  const reading: ScaleReading = {
    id: clock.id('sr'),
    materialId: input.materialId,
    productionOrderId: input.productionOrderId,
    expectedQty: qty(input.expectedQty),
    actualQty: qty(input.actualQty),
    variance,
    timestamp: clock.now(),
    operatorId: actor.id,
    scaleId: input.scaleId,
  }

  state.scaleReadings.unshift(reading)
  audit(state, actor, clock, 'قراءة ميزان', 'scaleReading', reading.id, `${material.nameAr}: ${input.actualQty} كجم`)
  return ok(state, 'تم تسجيل قراءة الميزان')
}

function createDistributionPoint(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createDistributionPoint' }>['input'], clock: Clock): CommandResult {
  const code = input.code.trim().toUpperCase()
  if (!code || !input.nameAr.trim() || !input.location.trim()) return fail('الكود والاسم والموقع مطلوبة')
  if (state.distributionPoints.some((item) => item.code === code)) return fail('كود نقطة التوزيع مستخدم')

  const point: DistributionPoint = {
    id: clock.id('dp'),
    code,
    nameAr: input.nameAr.trim(),
    location: input.location.trim(),
    managerId: input.managerId,
    phone: input.phone.trim(),
    active: true,
  }

  state.distributionPoints.unshift(point)
  audit(state, actor, clock, 'إنشاء نقطة توزيع', 'distributionPoint', point.id, point.nameAr)
  return ok(state, 'تم حفظ نقطة التوزيع')
}

function closeDistributionDay(state: ErpState, actor: Actor, input: Extract<Command, { action: 'closeDistributionDay' }>['input'], clock: Clock): CommandResult {
  const point = state.distributionPoints.find((item) => item.id === input.pointId)
  if (!point) return fail('نقطة التوزيع غير موجودة')

  const productIds = new Set([
    ...Object.keys(input.openingStock),
    ...Object.keys(input.sales),
    ...Object.keys(input.returns),
    ...Object.keys(input.closingStock),
  ])
  let goodsVariance = 0
  let expectedTakings = 0
  for (const productId of productIds) {
    const opening = input.openingStock[productId] ?? 0
    const sold = input.sales[productId] ?? 0
    const returned = input.returns[productId] ?? 0
    const closing = input.closingStock[productId] ?? 0
    goodsVariance += opening - sold + returned - closing
    const price = state.products.find((item) => item.id === productId)?.salePrice ?? 0
    expectedTakings += (sold - returned) * price
  }

  const takings = money(input.cash + input.transfers)
  const variance = money(takings - money(expectedTakings))
  const stockVariance = qty(goodsVariance)

  const closing: DistributionClosing = {
    id: clock.id('dc'),
    pointId: input.pointId,
    date: input.date,
    openingStock: input.openingStock,
    sales: input.sales,
    returns: input.returns,
    closingStock: input.closingStock,
    cash: money(input.cash),
    transfers: money(input.transfers),
    variance,
    stockVariance,
    closedBy: actor.id,
    closedAt: clock.now(),
    status: Math.abs(variance) < 0.001 && Math.abs(stockVariance) < 0.001 ? 'RECONCILED' : 'DISCREPANCY',
  }

  state.distributionClosings.unshift(closing)
  audit(state, actor, clock, 'إغلاق يوم توزيع', 'distributionClosing', closing.id, point.nameAr)
  return ok(state, `تم إغلاق اليوم ${closing.status === 'RECONCILED' ? 'مطابق' : 'مختلف'}`)
}

function advanceInvoiceDelivery(state: ErpState, actor: Actor, input: Extract<Command, { action: 'advanceInvoiceDelivery' }>['input'], clock: Clock): CommandResult {
  const invoice = state.invoices.find((item) => item.id === input.invoiceId)
  if (!invoice) return fail('الفاتورة غير موجودة')

  let delivery = state.invoiceDeliveries.find((item) => item.invoiceId === input.invoiceId)
  if (!delivery) {
    delivery = {
      id: clock.id('id'),
      invoiceId: input.invoiceId,
      currentStep: 'ACCOUNTANT',
      steps: [],
    }
    state.invoiceDeliveries.unshift(delivery)
  }

  const stepIndex = ['ACCOUNTANT', 'LOADER', 'DRIVER', 'CUSTOMER'].indexOf(input.step)
  const currentIndex = ['ACCOUNTANT', 'LOADER', 'DRIVER', 'CUSTOMER'].indexOf(delivery.currentStep)

  if (stepIndex <= currentIndex) return fail('لا يمكن الرجوع للخلف في سلم التسليم')

  delivery.steps.push({
    step: input.step,
    completedBy: actor.id,
    completedAt: clock.now(),
    notes: input.notes,
  })

  delivery.currentStep = input.step

  if (input.deliveryProof && input.step === 'CUSTOMER') {
    delivery.deliveryProof = {
      recipientName: input.deliveryProof.recipientName,
      recipientPhone: input.deliveryProof.recipientPhone,
      location: input.deliveryProof.location,
      deliveredAt: clock.now(),
    }
  }

  audit(state, actor, clock, 'تقدم تسليم فاتورة', 'invoiceDelivery', delivery.id, `المرحلة: ${input.step}`)
  return ok(state, `تم إنهاء مرحلة ${input.step}`)
}

function recordUtilitiesReading(state: ErpState, actor: Actor, input: Extract<Command, { action: 'recordUtilitiesReading' }>['input'], clock: Clock): CommandResult {
  if (input.currentReading <= input.previousReading) return fail('القراءة الحالية يجب أن تكون أكبر من السابقة')
  const consumption = input.currentReading - input.previousReading
  const costPerTon = input.productionTon > 0 ? money(input.cost / input.productionTon) : 0

  const reading: UtilitiesReading = {
    id: clock.id('ur'),
    utility: input.utility,
    readingDate: input.readingDate,
    previousReading: input.previousReading,
    currentReading: input.currentReading,
    consumption,
    cost: money(input.cost),
    productionTon: input.productionTon,
    costPerTon,
    notes: input.notes,
  }

  state.utilitiesReadings.unshift(reading)
  audit(state, actor, clock, 'قراءة مرافق', 'utilitiesReading', reading.id, `${input.utility}: ${consumption}`)
  return ok(state, 'تم تسجيل قراءة المرافق')
}

function createMachine(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createMachine' }>['input'], clock: Clock): CommandResult {
  const code = input.code.trim().toUpperCase()
  if (!code || !input.nameAr.trim() || !input.type.trim()) return fail('الكود والاسم والنوع مطلوبة')
  if (state.machines.some((item) => item.code === code)) return fail('كود الماكينة مستخدم')

  const machine: Machine = {
    id: clock.id('mach'),
    code,
    nameAr: input.nameAr.trim(),
    type: input.type.trim(),
    location: input.location.trim(),
    active: true,
    operatingHours: 0,
  }

  state.machines.unshift(machine)
  audit(state, actor, clock, 'إنشاء ماكينة', 'machine', machine.id, machine.nameAr)
  return ok(state, 'تم حفظ الماكينة')
}

function createMaintenanceSchedule(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createMaintenanceSchedule' }>['input'], clock: Clock): CommandResult {
  const machine = state.machines.find((item) => item.id === input.machineId)
  if (!machine) return fail('الماكينة غير موجودة')
  if (!input.description.trim()) return fail('الوصف مطلوب')

  const schedule: MaintenanceSchedule = {
    id: clock.id('ms'),
    machineId: input.machineId,
    type: input.type,
    description: input.description.trim(),
    interval: input.interval,
    lastCompleted: clock.now(),
    nextDue: calculateNextDue(input.type, input.interval, clock.now()),
    sparePartIds: input.sparePartIds,
    estimatedCost: money(input.estimatedCost),
    assignedTo: input.assignedTo,
  }

  state.maintenanceSchedules.unshift(schedule)
  refreshMachineDue(state, input.machineId)
  audit(state, actor, clock, 'إنشاء جدول صيانة', 'maintenanceSchedule', schedule.id, machine.nameAr)
  return ok(state, 'تم حفظ جدول الصيانة')
}

/** The machine's next due date is the earliest due date across its schedules. */
function refreshMachineDue(state: ErpState, machineId: string) {
  const machine = state.machines.find((item) => item.id === machineId)
  if (!machine) return
  const dues = state.maintenanceSchedules
    .filter((schedule) => schedule.machineId === machineId && schedule.nextDue)
    .map((schedule) => schedule.nextDue.slice(0, 10))
    .sort()
  machine.nextMaintenanceDate = dues[0]
}

function recordMaintenance(state: ErpState, actor: Actor, input: Extract<Command, { action: 'recordMaintenance' }>['input'], clock: Clock): CommandResult {
  const machine = state.machines.find((item) => item.id === input.machineId)
  if (!machine) return fail('الماكينة غير موجودة')
  if (input.operatingMinutes !== undefined && (!Number.isFinite(input.operatingMinutes) || input.operatingMinutes < 0)) {
    return fail('ساعات التشغيل المبلّغ عنها غير صحيحة')
  }

  const totalSpareCost = input.sparePartsUsed.reduce((sum, part) => sum + part.cost, 0)
  const record: MaintenanceRecord = {
    id: clock.id('mr'),
    machineId: input.machineId,
    scheduleId: input.scheduleId,
    type: input.type,
    startDate: input.startDate,
    endDate: input.endDate,
    downtimeMinutes: input.endDate ? minutesBetween(input.startDate, input.endDate) : 0,
    operatingMinutes: input.operatingMinutes,
    description: input.description.trim(),
    cost: money(input.cost + totalSpareCost),
    sparePartsUsed: input.sparePartsUsed,
    performedBy: actor.id,
    notes: input.notes,
  }

  machine.operatingHours = qty(machine.operatingHours + (record.operatingMinutes ?? 0) / 60)

  if (input.scheduleId) {
    const schedule = state.maintenanceSchedules.find((s) => s.id === input.scheduleId)
    if (schedule) {
      schedule.lastCompleted = input.endDate
      schedule.nextDue = calculateNextDue(schedule.type, schedule.interval, input.endDate)
      schedule.hoursAtLastCompletion = machine.operatingHours
      refreshMachineDue(state, machine.id)
    }
  }

  for (const part of input.sparePartsUsed) {
    const sparePart = state.spareParts.find((sp) => sp.id === part.sparePartId)
    if (sparePart) {
      sparePart.quantity = qty(sparePart.quantity - part.quantity)
    }
  }

  state.maintenanceRecords.unshift(record)
  audit(state, actor, clock, 'تسجيل صيانة', 'maintenanceRecord', record.id, machine.nameAr)
  return ok(state, 'تم تسجيل الصيانة')
}

function recordBankTransaction(state: ErpState, actor: Actor, input: Extract<Command, { action: 'recordBankTransaction' }>['input'], clock: Clock): CommandResult {
  const bankAccount = input.bankAccount.trim()
  const transactionId = input.transactionId.trim()
  if (!bankAccount || !transactionId) return fail('الحساب البنكي ورقم المعاملة مطلوبان')
  if (state.bankTransactions.some((item) => item.transactionId === transactionId)) return fail('رقم المعاملة مسجل مسبقاً')
  if (!/^\d{4}-\d{2}-\d{2}/.test(input.date) || !Number.isFinite(Date.parse(input.date))) return fail('تاريخ المعاملة غير صحيح')
  if (!Number.isFinite(input.amount) || input.amount <= 0) return fail('مبلغ المعاملة يجب أن يكون أكبر من صفر')
  if (input.type !== 'CREDIT' && input.type !== 'DEBIT') return fail('نوع المعاملة غير صحيح')

  const transaction: BankTransaction = {
    id: clock.id('bt'),
    bankAccount,
    transactionId,
    date: input.date.slice(0, 10),
    amount: money(input.amount),
    type: input.type,
    description: input.description.trim(),
    reference: input.reference,
    matched: false,
    status: 'UNMATCHED',
  }

  const autoMatch = autoMatchBankTransaction(state, transaction)
  if (autoMatch) {
    transaction.matched = true
    transaction.matchedTo = autoMatch
    transaction.matchedBy = 'SYSTEM'
    transaction.matchedAt = clock.now()
    transaction.status = 'MATCHED'
  }

  state.bankTransactions.unshift(transaction)
  audit(state, actor, clock, 'تسجيل معاملة بنكية', 'bankTransaction', transaction.id, transaction.description)
  return ok(state, autoMatch ? 'تم تسجيل ومطابقة المعاملة تلقائيًا' : 'تم تسجيل المعاملة بانتظار المطابقة')
}

function matchBankTransaction(state: ErpState, actor: Actor, input: Extract<Command, { action: 'matchBankTransaction' }>['input'], clock: Clock): CommandResult {
  const transaction = state.bankTransactions.find((item) => item.transactionId === input.transactionId)
  if (!transaction) return fail('المعاملة غير موجودة')

  const target = input.matchTo
  const targetExists =
    (target.type === 'INVOICE' && state.invoices.some((item) => item.id === target.id)) ||
    (target.type === 'SUPPLIER' && state.suppliers.some((item) => item.id === target.id)) ||
    (target.type === 'EXPENSE' && state.expenses.some((item) => item.id === target.id))
  if (!targetExists) return fail('الهدف المطابق غير موجود')

  transaction.matched = true
  transaction.matchedTo = target
  transaction.matchedBy = actor.id
  transaction.matchedAt = clock.now()
  transaction.status = 'MATCHED'

  audit(state, actor, clock, 'مطابقة معاملة بنكية', 'bankTransaction', transaction.id, target.type)
  return ok(state, 'تم مطابقة المعاملة')
}

function createCustomerRecipe(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createCustomerRecipe' }>['input'], clock: Clock): CommandResult {
  const customer = state.customers.find((item) => item.id === input.customerId)
  if (!customer) return fail('العميل غير موجود')
  const product = state.products.find((item) => item.id === input.productId)
  if (!product) return fail('المنتج غير موجود')
  const recipe = state.recipes.find((item) => item.id === input.recipeId)
  if (!recipe) return fail('الخلطة الأساسية غير موجودة')
  if (input.baseOutputQty <= 0) return fail('كمية المخرجات الأساسية يجب أن تكون أكبر من صفر')
  if (input.items.length === 0) return fail('أضف مكونات الخلطة')
  if (input.salePrice <= 0) return fail('سعر البيع يجب أن يكون أكبر من صفر')

  let materialCost = 0
  for (const item of input.items) {
    const material = findMaterial(state, item.materialId)
    if (!material) return fail('إحدى المواد غير موجودة')
    if (item.qty <= 0) return fail('كمية المكوّن يجب أن تكون أكبر من صفر')
    materialCost += qty(item.qty) * materialUnitCost(state, material.id)
  }
  const costPerTon = money((materialCost / qty(input.baseOutputQty)) * 1000)
  const marginPerTon = money(input.salePrice - costPerTon)

  const customerRecipe: CustomerRecipe = {
    id: clock.id('cr'),
    customerId: input.customerId,
    productId: input.productId,
    recipeId: input.recipeId,
    nameAr: input.nameAr.trim() || `${product.nameAr} — ${customer.nameAr}`,
    baseOutputQty: qty(input.baseOutputQty),
    items: input.items.map((item) => ({ materialId: item.materialId, qty: qty(item.qty) })),
    costPerTon,
    salePrice: money(input.salePrice),
    marginPerTon,
    active: true,
    effectiveFrom: input.effectiveFrom,
  }

  state.customerRecipes.unshift(customerRecipe)
  audit(state, actor, clock, 'إنشاء خلطة عميل', 'customerRecipe', customerRecipe.id, `${customer.nameAr}: ${customerRecipe.nameAr}`)
  return ok(state, 'تم حفظ خلطة العميل')
}

function setCustomerPricing(state: ErpState, actor: Actor, input: Extract<Command, { action: 'setCustomerPricing' }>['input'], clock: Clock): CommandResult {
  const product = state.products.find((item) => item.id === input.productId)
  if (!product) return fail('المنتج غير موجود')
  const customer = state.customers.find((item) => item.id === input.customerId)
  if (!customer) return fail('العميل غير موجود')

  if (!product.customerPricing) product.customerPricing = {}
  product.customerPricing[input.customerId] = money(input.price)

  if (!product.priceHistory) product.priceHistory = []
  product.priceHistory.push({
    customerId: input.customerId,
    price: money(input.price),
    effectiveFrom: clock.now(),
  })

  audit(state, actor, clock, 'تعديل سعر عميل', 'product', product.id, `${customer.nameAr}: ${input.price}`)
  return ok(state, 'تم حفظ سعر العميل')
}

function setAlternativeBagWeights(state: ErpState, actor: Actor, input: Extract<Command, { action: 'setAlternativeBagWeights' }>['input'], clock: Clock): CommandResult {
  const product = state.products.find((item) => item.id === input.productId)
  if (!product) return fail('المنتج غير موجود')

  product.alternativeBagKg = input.bagKg
  audit(state, actor, clock, 'تعديل أوزان الأكياس', 'product', product.id, input.bagKg.join(', '))
  return ok(state, 'تم حفظ أوزان الأكياس البديلة')
}

function calculateNextDue(type: string, interval: number, fromDate: string): string {
  const date = new Date(fromDate)
  switch (type) {
    case 'DAILY':
      date.setUTCDate(date.getUTCDate() + interval)
      break
    case 'WEEKLY':
      date.setUTCDate(date.getUTCDate() + interval * 7)
      break
    case 'MONTHLY':
      date.setUTCMonth(date.getUTCMonth() + interval)
      break
    case 'YEARLY':
      date.setUTCFullYear(date.getUTCFullYear() + interval)
      break
    case 'HOURS_BASED':
      date.setUTCFullYear(date.getUTCFullYear() + 1)
      break
    default:
      date.setUTCMonth(date.getUTCMonth() + 1)
  }
  return date.toISOString()
}

function minutesBetween(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60))
}

export { hoursBetween, INVENTORY_ACCOUNT, calculateRecipeNutrition, compareNutrition, autoMatchBankTransaction, calculateLandedCost }
