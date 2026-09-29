import { approvedTripTransportCost, COST_LABEL } from './costing'
import { almostEqual, money, qty } from './money'
import type { ErpState, ItemType, SalesInvoice, WarehouseKey } from './types'

type ReportState = Omit<ErpState, 'users'> & { users: Array<unknown> }

const MUSCAT_OFFSET_MS = 4 * 60 * 60 * 1000
const STALE_DAYS = 7

export function muscatDay(iso: string) {
  return new Date(Date.parse(iso) + MUSCAT_OFFSET_MS).toISOString().slice(0, 10)
}

function daysBetween(fromDay: string, toDay: string) {
  const from = Date.parse(`${fromDay}T00:00:00.000Z`)
  const to = Date.parse(`${toDay}T00:00:00.000Z`)
  return Math.round((to - from) / 86_400_000)
}

function sameDay(iso: string | undefined, day: string) {
  return Boolean(iso) && muscatDay(iso!) === day
}

function balanceKey(warehouse: string, itemType: string, itemId: string, batchNo: string) {
  return `${warehouse}|${itemType}|${itemId}|${batchNo}`
}

/** Day 4 invariant: every balance equals the sum of its ledger movements, and each movement carries prev/new qty. */
export function inventoryIntegrity(state: ReportState) {
  const issues: string[] = []
  const rebuilt = new Map<string, number>()
  for (const base of state.ledgerBaselines ?? []) {
    rebuilt.set(balanceKey(base.warehouse, base.itemType, base.itemId, base.batchNo), base.qty)
  }
  const chronological = [...state.ledger].reverse()

  for (const entry of chronological) {
    const key = balanceKey(entry.warehouse, entry.itemType, entry.itemId, entry.batchNo)
    const before = rebuilt.get(key) ?? 0
    if (!almostEqual(before, entry.prevQty)) {
      issues.push(`الحركة ${entry.id}: الرصيد قبل الحركة ${entry.prevQty} لا يطابق التسلسل ${before}`)
    }
    const after = qty(before + entry.qty)
    if (!almostEqual(after, entry.newQty)) {
      issues.push(`الحركة ${entry.id}: الرصيد بعد الحركة ${entry.newQty} لا يطابق ${after}`)
    }
    if (entry.newQty < -0.0001) {
      issues.push(`الحركة ${entry.id}: رصيد سالب ${entry.newQty}`)
    }
    rebuilt.set(key, entry.newQty)
  }

  const seen = new Set<string>()
  for (const row of state.balances) {
    const key = balanceKey(row.warehouse, row.itemType, row.itemId, row.batchNo)
    seen.add(key)
    const fromLedger = rebuilt.get(key) ?? 0
    if (!almostEqual(fromLedger, row.qty)) {
      issues.push(`الرصيد ${key}: الكمية ${row.qty} لا تطابق مجموع الحركات ${fromLedger}`)
    }
    if (row.qty < -0.0001) {
      issues.push(`الرصيد ${key}: كمية سالبة ${row.qty}`)
    }
  }

  for (const [key, fromLedger] of rebuilt) {
    if (seen.has(key)) continue
    if (!almostEqual(fromLedger, 0)) {
      issues.push(`مفتاح الحركة ${key} بلا صف رصيد والكمية ${fromLedger}`)
    }
  }

  return { ok: issues.length === 0, issues }
}

export function accountName(state: ReportState, code: string) {
  return state.accounts.find((account) => account.code === code)?.nameAr ?? code
}

export function trialBalance(state: ReportState) {
  const totals = new Map<string, { debit: number; credit: number }>()
  for (const account of state.accounts) totals.set(account.code, { debit: 0, credit: 0 })
  for (const opening of state.journalOpenings ?? []) {
    const current = totals.get(opening.accountCode) ?? { debit: 0, credit: 0 }
    current.debit = money(current.debit + opening.debit)
    current.credit = money(current.credit + opening.credit)
    totals.set(opening.accountCode, current)
  }
  for (const entry of state.journals) {
    for (const line of entry.lines) {
      const current = totals.get(line.accountCode) ?? { debit: 0, credit: 0 }
      current.debit = money(current.debit + line.debit)
      current.credit = money(current.credit + line.credit)
      totals.set(line.accountCode, current)
    }
  }
  const rows = [...totals.entries()].map(([code, amounts]) => {
    const account = state.accounts.find((item) => item.code === code)
    const net = money(amounts.debit - amounts.credit)
    return {
      code,
      nameAr: account?.nameAr ?? code,
      type: account?.type ?? 'EXPENSE',
      debit: amounts.debit,
      credit: amounts.credit,
      balance: net,
    }
  })
  const debit = money(rows.reduce((sum, row) => sum + row.debit, 0))
  const credit = money(rows.reduce((sum, row) => sum + row.credit, 0))
  return { rows, debit, credit, balanced: Math.abs(debit - credit) < 0.001 }
}

export function profitAndLoss(state: ReportState) {
  const tb = trialBalance(state)
  const revenue = money(
    tb.rows.filter((row) => row.type === 'REVENUE').reduce((sum, row) => sum + (row.credit - row.debit), 0),
  )
  const expense = money(
    tb.rows.filter((row) => row.type === 'EXPENSE').reduce((sum, row) => sum + (row.debit - row.credit), 0),
  )
  return { revenue, expense, profit: money(revenue - expense), rows: tb.rows.filter((row) => row.type === 'REVENUE' || row.type === 'EXPENSE') }
}

export function vatReturn(state: ReportState, month?: string) {
  const inMonth = (iso: string) => !month || iso.slice(0, 7) === month
  const output = money(
    state.invoices
      .filter((invoice) => invoice.status !== 'DRAFT' && inMonth(invoice.issuedAt))
      .reduce((sum, invoice) => sum + invoice.vatAmount, 0),
  )
  const inputPurchases = money(
    state.journals
      .filter((entry) => entry.refType === 'goodsReceipt' && inMonth(entry.at))
      .flatMap((entry) => entry.lines)
      .filter((line) => line.accountCode === '2300')
      .reduce((sum, line) => sum + line.debit, 0),
  )
  const inputExpenses = money(
    state.journals
      .filter((entry) => entry.refType === 'expense' && inMonth(entry.at))
      .flatMap((entry) => entry.lines)
      .filter((line) => line.accountCode === '2300')
      .reduce((sum, line) => sum + line.debit, 0),
  )
  const input = money(inputPurchases + inputExpenses)
  return {
    month: month ?? 'الكل',
    outputVat: output,
    inputVat: input,
    netPayable: money(output - input),
  }
}

export function stockRows(state: ReportState) {
  return state.balances
    .filter((row) => row.qty > 0)
    .map((row) => {
      const material = row.itemType === 'MATERIAL' ? state.materials.find((item) => item.id === row.itemId) : undefined
      const product = row.itemType === 'PRODUCT' ? state.products.find((item) => item.id === row.itemId) : undefined
      return {
        ...row,
        code: material?.code ?? product?.code ?? '',
        nameAr: material?.nameAr ?? product?.nameAr ?? row.itemId,
        unit: material?.unit ?? product?.unit ?? '',
        value: money(row.qty * row.unitCost),
      }
    })
    .sort((a, b) => a.warehouse.localeCompare(b.warehouse) || a.nameAr.localeCompare(b.nameAr, 'ar'))
}

export function itemOnHand(state: ReportState, itemType: ItemType, itemId: string, warehouse?: WarehouseKey) {
  return qty(
    state.balances
      .filter((row) => row.itemType === itemType && row.itemId === itemId && (!warehouse || row.warehouse === warehouse))
      .reduce((sum, row) => sum + row.qty, 0),
  )
}

function openInvoice(invoice: SalesInvoice) {
  return invoice.status === 'DRAFT' || invoice.status === 'CONFIRMED' || invoice.status === 'PARTIAL'
}

type FactorySnapshot = Pick<
  ErpState,
  'materials' | 'customers' | 'balances' | 'ledger' | 'productionOrders' | 'invoices' | 'stoppages'
> &
  Partial<
    Pick<
      ErpState,
      | 'lots'
      | 'qualitySamples'
      | 'payments'
      | 'products'
      | 'suppliers'
      | 'vehicles'
      | 'obligations'
      | 'obligationScheduleLines'
      | 'companyDocuments'
      | 'maintenanceSchedules'
      | 'maintenanceRecords'
      | 'utilitiesReadings'
    >
  >

/** Factory day for the general manager: production, sales, margin, stock, and run quality. */
export function factoryStatus(state: FactorySnapshot, nowIso = new Date().toISOString()) {
  const requested = muscatDay(nowIso)
  const activity = new Set<string>()
  for (const order of state.productionOrders) {
    if (order.status === 'COMPLETED' && order.completedAt) activity.add(muscatDay(order.completedAt))
  }
  for (const invoice of state.invoices) {
    if (invoice.status !== 'DRAFT') activity.add(muscatDay(invoice.issuedAt))
  }
  const days = [...activity].sort().reverse()
  const eligible = days.filter((day) => day <= requested)
  const day = eligible[0] ?? days[0] ?? requested
  const month = day.slice(0, 7)

  const touched = state.productionOrders.filter(
    (order) => sameDay(order.createdAt, day) || sameDay(order.completedAt, day),
  )
  const plannedKg = qty(touched.reduce((sum, order) => sum + order.plannedQty, 0))
  const completedToday = touched.filter((order) => order.status === 'COMPLETED' && sameDay(order.completedAt, day))
  const actualKg = qty(completedToday.reduce((sum, order) => sum + order.actualOutputQty, 0))
  const executionPct = plannedKg > 0 ? Math.round((actualKg / plannedKg) * 1000) / 10 : 0
  const producedCost = money(completedToday.reduce((sum, order) => sum + order.totalCost, 0))

  const posted = (invoice: SalesInvoice) => invoice.status !== 'DRAFT'
  const salesOn = (invoice: SalesInvoice, match: (iso: string) => boolean) => posted(invoice) && match(invoice.issuedAt)
  const salesNet = (invoices: SalesInvoice[]) => money(invoices.reduce((sum, invoice) => sum + invoice.subtotal, 0))
  const todayInvoices = state.invoices.filter((invoice) => salesOn(invoice, (iso) => muscatDay(iso) === day))
  const monthInvoices = state.invoices.filter((invoice) => salesOn(invoice, (iso) => muscatDay(iso).slice(0, 7) === month && muscatDay(iso) <= day))
  const openInvoices = state.invoices.filter(openInvoice)
  const soldKg = qty(todayInvoices.reduce((sum, invoice) => sum + invoice.lines.reduce((lineSum, line) => lineSum + line.qty, 0), 0))
  const soldNet = salesNet(todayInvoices)
  const costPerTon = actualKg > 0 ? money((producedCost / actualKg) * 1000) : 0
  const avgPricePerTon = soldKg > 0 ? money((soldNet / soldKg) * 1000) : 0

  const runningOut = state.materials
    .filter((material) => material.active && material.minQty > 0)
    .map((material) => ({
      id: material.id,
      nameAr: material.nameAr,
      unit: material.unit,
      onHand: itemOnHand(state as ReportState, 'MATERIAL', material.id),
      minQty: material.minQty,
    }))
    .filter((row) => row.onHand <= row.minQty)
    .sort((a, b) => a.onHand / a.minQty - b.onHand / b.minQty)

  const outbound = new Set(['PRODUCTION_CONSUMPTION', 'SALE', 'WITHDRAWAL', 'TRANSFER_OUT'])
  const stagnant = state.materials
    .filter((material) => material.active)
    .map((material) => {
      const onHand = itemOnHand(state as ReportState, 'MATERIAL', material.id)
      const moves = state.ledger.filter((entry) => entry.itemType === 'MATERIAL' && entry.itemId === material.id)
      const lastOut = moves.filter((entry) => outbound.has(entry.type)).sort((a, b) => (a.at < b.at ? 1 : -1))[0]
      const lastMove = moves.sort((a, b) => (a.at < b.at ? 1 : -1))[0]
      const since = lastOut?.at ?? lastMove?.at
      const idleDays = since ? daysBetween(muscatDay(since), day) : STALE_DAYS
      return { id: material.id, nameAr: material.nameAr, unit: material.unit, onHand, idleDays }
    })
    .filter((row) => row.onHand > 0 && row.idleDays >= STALE_DAYS)
    .sort((a, b) => b.idleDays - a.idleDays)

  const reservedMap = new Map<string, number>()
  for (const order of state.productionOrders) {
    if (order.status !== 'RELEASED') continue
    for (const line of order.expected) {
      const openQty = qty(Math.max(0, line.expectedQty - line.actualQty))
      if (openQty <= 0) continue
      reservedMap.set(line.materialId, qty((reservedMap.get(line.materialId) ?? 0) + openQty))
    }
  }
  for (const row of state.balances) {
    if (row.warehouse !== 'WH_MFG' || row.itemType !== 'MATERIAL' || row.qty <= 0) continue
    reservedMap.set(row.itemId, qty((reservedMap.get(row.itemId) ?? 0) + row.qty))
  }
  const reserved = [...reservedMap.entries()]
    .map(([materialId, reservedQty]) => ({
      id: materialId,
      nameAr: state.materials.find((item) => item.id === materialId)?.nameAr ?? materialId,
      unit: state.materials.find((item) => item.id === materialId)?.unit ?? 'كجم',
      qty: reservedQty,
    }))
    .sort((a, b) => b.qty - a.qty)

  const wasteKg = qty(completedToday.reduce((sum, order) => sum + order.expected.reduce((lineSum, line) => lineSum + line.wasteQty, 0), 0))
  const consumedKg = qty(completedToday.reduce((sum, order) => sum + order.expected.reduce((lineSum, line) => lineSum + line.actualQty, 0), 0))
  const deviations = completedToday
    .flatMap((order) =>
      order.expected
        .filter((line) => line.expectedQty > 0)
        .map((line) => ({
          materialId: line.materialId,
          nameAr: state.materials.find((item) => item.id === line.materialId)?.nameAr ?? line.materialId,
          expectedQty: line.expectedQty,
          actualQty: line.actualQty,
          diffPct: Math.round(((line.actualQty - line.expectedQty) / line.expectedQty) * 1000) / 10,
          reason: order.varianceReason,
        })),
    )
    .filter((line) => Math.abs(line.diffPct) >= 0.1)
    .sort((a, b) => Math.abs(b.diffPct) - Math.abs(a.diffPct))

  const stoppages = (state.stoppages ?? []).filter((item) => muscatDay(item.at) === day)

  const samples = state.qualitySamples ?? []
  const latestQc = new Map<string, (typeof samples)[number]>()
  for (const sample of [...samples].sort((a, b) => a.sampledAt.localeCompare(b.sampledAt))) {
    const key = sample.type === 'FINISHED_PRODUCT' ? `lot:${sample.lotNo}` : `raw:${sample.materialId}:${sample.batchNo}`
    latestQc.set(key, sample)
  }
  const awaiting = [...latestQc.values()].filter((sample) => sample.result === 'FAILED' || sample.result === 'HOLD')
  const monthSamples = samples.filter((sample) => {
    const sampleDay = muscatDay(sample.sampledAt)
    return sampleDay.slice(0, 7) === month && sampleDay <= day && sample.result !== 'PENDING'
  })
  const monthPassed = monthSamples.filter((sample) => sample.result === 'PASSED').length
  const monthLots = (state.lots ?? []).filter((lot) => {
    const lotDay = muscatDay(lot.manufacturedAt)
    return lotDay.slice(0, 7) === month && lotDay <= day
  })
  const monthCost = money(monthLots.reduce((sum, lot) => sum + lot.totalCost, 0))
  const monthKg = qty(monthLots.reduce((sum, lot) => sum + lot.actualOutputKg, 0))
  const breakdownMap = new Map<string, number>()
  for (const lot of monthLots) {
    for (const line of lot.costLines) breakdownMap.set(line.type, money((breakdownMap.get(line.type) ?? 0) + line.amount))
  }
  const payments = state.payments ?? []
  const collected = (match: (iso: string) => boolean) =>
    money(payments.filter((payment) => match(payment.at)).reduce((sum, payment) => sum + payment.amount, 0))
  const aging = { d0_30: 0, d31_60: 0, d61: 0 }
  for (const invoice of openInvoices) {
    const age = daysBetween(muscatDay(invoice.issuedAt), day)
    const outstanding = money(invoice.total - invoice.paidAmount)
    if (age <= 30) aging.d0_30 = money(aging.d0_30 + outstanding)
    else if (age <= 60) aging.d31_60 = money(aging.d31_60 + outstanding)
    else aging.d61 = money(aging.d61 + outstanding)
  }

  return {
    day,
    month,
    shifted: day !== requested,
    production: { plannedKg, actualKg, executionPct },
    sales: {
      today: salesNet(todayInvoices),
      todayCount: todayInvoices.length,
      month: salesNet(monthInvoices),
      monthCount: monthInvoices.length,
      openCount: openInvoices.length,
      openOutstanding: money(openInvoices.reduce((sum, invoice) => sum + (invoice.total - invoice.paidAmount), 0)),
      openOrders: openInvoices.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        customer: state.customers.find((item) => item.id === invoice.customerId)?.nameAr ?? invoice.customerId,
        outstanding: money(invoice.total - invoice.paidAmount),
        status: invoice.status,
      })),
    },
    profit: {
      costPerTon,
      avgPricePerTon,
      marginPerTon: money(avgPricePerTon - costPerTon),
    },
    inventory: {
      value: money(stockRows(state as ReportState).reduce((sum, row) => sum + row.value, 0)),
      runningOut,
      stagnant,
      reserved,
    },
    operations: {
      wasteKg,
      wastePct: consumedKg > 0 ? Math.round((wasteKg / consumedKg) * 1000) / 10 : 0,
      deviations,
      stoppages,
      stoppageMinutes: stoppages.reduce((sum, item) => sum + item.minutes, 0),
    },
    qc: {
      awaiting: awaiting.map((sample) => ({
        id: sample.id,
        result: sample.result,
        label: sample.type === 'FINISHED_PRODUCT' ? `دفعة ${sample.lotNo}` : `خامة ${sample.batchNo}`,
      })),
      monthPassRate: monthSamples.length > 0 ? money((monthPassed / monthSamples.length) * 100) : null,
      monthSamples: monthSamples.length,
    },
    cost: {
      avgCostPerTon: monthKg > 0 ? money((monthCost / monthKg) * 1000) : 0,
      breakdown: [...breakdownMap.entries()].map(([type, amount]) => ({
        type,
        label: COST_LABEL[type as keyof typeof COST_LABEL] ?? type,
        amount,
        pct: monthCost > 0 ? money((amount / monthCost) * 100) : 0,
      })),
    },
    lowestMarginLots: (state.lots ?? [])
      .filter((lot) => lot.marginPerTon != null)
      .map((lot) => ({
        lotNo: lot.lotNo,
        productName: (state.products ?? []).find((item) => item.id === lot.productId)?.nameAr ?? lot.productId,
        marginPerTon: lot.marginPerTon ?? 0,
        marginPct: lot.marginPct ?? 0,
      }))
      .sort((a, b) => a.marginPerTon - b.marginPerTon)
      .slice(0, 5),
    collections: {
      today: collected((iso) => muscatDay(iso) === day),
      month: collected((iso) => muscatDay(iso).slice(0, 7) === month && muscatDay(iso) <= day),
    },
    aging,
  }
}

/** One raw material, from the dock to the sale: the nine questions the mill owner asked. */
export function materialStatement(state: ReportState, materialId: string) {
  const material = state.materials.find((item) => item.id === materialId)
  if (!material) return null
  const movements = state.ledger.filter((entry) => entry.itemType === 'MATERIAL' && entry.itemId === materialId)
  const receivedQty = qty(movements.filter((entry) => entry.type === 'PURCHASE_RECEIPT').reduce((sum, entry) => sum + entry.qty, 0))
  const consumedQty = qty(movements.filter((entry) => entry.type === 'PRODUCTION_CONSUMPTION').reduce((sum, entry) => sum + Math.abs(entry.qty), 0))
  const onHand = itemOnHand(state, 'MATERIAL', materialId)
  const warehouses = (['WH_RAW', 'WH_MFG', 'WH_FG'] as const)
    .map((warehouse) => ({ warehouse, qty: itemOnHand(state, 'MATERIAL', materialId, warehouse) }))
    .filter((row) => row.qty > 0)

  const completed = state.productionOrders.filter(
    (order) => order.status === 'COMPLETED' && order.expected.some((line) => line.materialId === materialId),
  )
  const lines = completed.map((order) => {
    const line = order.expected.find((item) => item.materialId === materialId)!
    const recipe = state.recipes.find((item) => item.id === order.recipeId)
    const recipeItem = recipe?.items.find((item) => item.materialId === materialId)
    const recipeQty =
      recipe && recipeItem && recipe.baseOutputQty > 0 ? qty(order.actualOutputQty * (recipeItem.qty / recipe.baseOutputQty)) : line.expectedQty
    return {
      orderId: order.id,
      number: order.number,
      productId: order.productId,
      productName: state.products.find((item) => item.id === order.productId)?.nameAr ?? order.productId,
      expectedQty: line.expectedQty,
      actualQty: line.actualQty,
      wasteQty: line.wasteQty,
      outputQty: order.actualOutputQty,
      plannedQty: order.plannedQty,
      recipeQty,
      reason: order.varianceReason,
      diffPct: line.expectedQty > 0 ? Math.round(((line.actualQty - line.expectedQty) / line.expectedQty) * 1000) / 10 : 0,
    }
  })
  const outputKg = qty(lines.reduce((sum, line) => sum + line.outputQty, 0))
  const wasteQty = qty(lines.reduce((sum, line) => sum + line.wasteQty, 0))
  const expectedQty = qty(lines.reduce((sum, line) => sum + line.expectedQty, 0))
  const actualQty = qty(lines.reduce((sum, line) => sum + line.actualQty, 0))
  const recipeQty = qty(lines.reduce((sum, line) => sum + line.recipeQty, 0))
  const productIds = new Set(lines.map((line) => line.productId))
  const soldQty = qty(
    state.invoices
      .filter((invoice) => invoice.status !== 'DRAFT')
      .flatMap((invoice) => invoice.lines)
      .filter((line) => productIds.has(line.productId))
      .reduce((sum, line) => sum + line.qty, 0),
  )
  const withdrawnQty = qty(
    state.withdrawals.flatMap((row) => row.lines).filter((line) => productIds.has(line.productId)).reduce((sum, line) => sum + line.qty, 0),
  )
  const productOnHand = qty([...productIds].reduce((sum, productId) => sum + itemOnHand(state, 'PRODUCT', productId), 0))
  const gapPct = recipeQty > 0 ? (Math.abs(actualQty - recipeQty) / recipeQty) * 100 : 0
  const aligned = lines.length === 0 || gapPct - state.company.varianceThresholdPct <= 0.001
  const reasons = [...new Set(lines.map((line) => line.reason.trim()).filter(Boolean))]
  const stoppages = (state.stoppages ?? []).filter((item) =>
    completed.some((order) => order.completedAt && muscatDay(order.completedAt) === muscatDay(item.at)),
  )
  const shortfallKg = qty(lines.reduce((sum, line) => sum + Math.max(0, line.plannedQty - line.outputQty), 0))

  return {
    material,
    receivedQty,
    consumedQty,
    onHand,
    warehouses,
    lines,
    outputKg,
    productCount: lines.length,
    soldQty,
    withdrawnQty,
    productOnHand,
    expectedQty,
    actualQty,
    recipeQty,
    wasteQty,
    aligned,
    gapPct: Math.round(gapPct * 10) / 10,
    reasons,
    stoppages,
    shortfallKg,
    belowMin: material.minQty > 0 && onHand <= material.minQty,
    balanceMatches: Math.abs(qty(receivedQty - consumedQty - onHand)) < 0.001,
  }
}

export const UNKNOWN_OPERATOR = 'غير معروف (بيانات قديمة)'

export function operatorLabel(employees: Array<{ id: string; nameAr: string }>, operatorId?: string | null) {
  if (!operatorId) return UNKNOWN_OPERATOR
  return employees.find((item) => item.id === operatorId)?.nameAr ?? UNKNOWN_OPERATOR
}

export function traceLot(state: ReportState, lotNo: string) {
  const lot = (state.lots ?? []).find((item) => item.lotNo === lotNo)
  if (!lot) return null
  const product = state.products.find((item) => item.id === lot.productId) ?? null
  const operator = lot.operatorId ? (state.employees.find((item) => item.id === lot.operatorId) ?? null) : null
  const operatorName = operatorLabel(state.employees, lot.operatorId)
  const rawBatches = lot.materials.map((line) => ({
    ...line,
    materialName: state.materials.find((item) => item.id === line.materialId)?.nameAr ?? line.materialId,
    supplierName: line.supplierId ? (state.suppliers.find((item) => item.id === line.supplierId)?.nameAr ?? line.supplierId) : null,
  }))
  const suppliers = rawBatches
    .map((line) => (line.supplierId ? (state.suppliers.find((item) => item.id === line.supplierId) ?? null) : null))
    .filter((item, index, list): item is NonNullable<typeof item> => Boolean(item) && list.findIndex((other) => other?.id === item?.id) === index)
  const customers = lot.deliveries
    .map((delivery) => (delivery.customerId ? (state.customers.find((item) => item.id === delivery.customerId) ?? null) : null))
    .filter((item, index, list): item is NonNullable<typeof item> => Boolean(item) && list.findIndex((other) => other?.id === item?.id) === index)
  const samples = (state.qualitySamples ?? []).filter((item) => item.type === 'FINISHED_PRODUCT' && item.lotNo === lot.lotNo)
  return { lot, product, operator, operatorName, rawBatches, suppliers, customers, deliveries: lot.deliveries, samples }
}

export function productionCostSummary(state: ReportState, fromDay?: string, toDay?: string) {
  const lots = (state.lots ?? []).filter((lot) => {
    const day = muscatDay(lot.manufacturedAt)
    if (fromDay && day < fromDay) return false
    if (toDay && day > toDay) return false
    return true
  })
  const grand = money(lots.reduce((sum, lot) => sum + lot.totalCost, 0))
  const outputKg = qty(lots.reduce((sum, lot) => sum + lot.actualOutputKg, 0))
  const byTypeMap = new Map<string, number>()
  for (const lot of lots) {
    for (const line of lot.costLines) byTypeMap.set(line.type, money((byTypeMap.get(line.type) ?? 0) + line.amount))
  }
  const byType = [...byTypeMap.entries()].map(([type, amount]) => ({
    type,
    label: COST_LABEL[type as keyof typeof COST_LABEL] ?? type,
    amount,
    pct: grand > 0 ? money((amount / grand) * 100) : 0,
  }))
  const byProduct = state.products
    .map((product) => {
      const rows = lots.filter((lot) => lot.productId === product.id)
      const cost = money(rows.reduce((sum, lot) => sum + lot.totalCost, 0))
      const kg = qty(rows.reduce((sum, lot) => sum + lot.actualOutputKg, 0))
      return { productId: product.id, nameAr: product.nameAr, lots: rows.length, outputKg: kg, totalCost: cost, costPerTon: kg > 0 ? money((cost / kg) * 1000) : 0 }
    })
    .filter((row) => row.lots > 0)
  return { lots, grand, outputKg, costPerTon: outputKg > 0 ? money((grand / outputKg) * 1000) : 0, byType, byProduct }
}

export type ProfitabilityGroupBy = 'PRODUCT' | 'CUSTOMER' | 'MONTH'

export type ProfitabilityRow = {
  key: string
  label: string
  lots: number
  outputKg: number
  cost: number
  costPerTon: number
  soldQty: number
  revenue: number
  avgSalePricePerTon: number | null
  marginValue: number
  marginPct: number | null
}

/** Revenue booked on a lot delivery, read from the invoice line that names the lot. */
function deliveryRevenue(state: ReportState, lot: NonNullable<ReportState['lots']>[number], delivery: { invoiceId?: string; withdrawalId?: string; qty: number }): number {
  if (!delivery.invoiceId) return 0
  const invoice = state.invoices.find((item) => item.id === delivery.invoiceId)
  if (!invoice) return 0
  const line = invoice.lines.find((item) => item.batchNo === lot.lotNo) ?? invoice.lines.find((item) => item.productId === lot.productId)
  if (!line) return 0
  return money(delivery.qty * line.unitPrice)
}

/** Profitability by product, customer or month: cost/ton, average sale price/ton, margin value and %. */
export function profitabilityReport(state: ReportState, groupBy: ProfitabilityGroupBy = 'PRODUCT'): ProfitabilityRow[] {
  const lots = state.lots ?? []
  const rows = new Map<string, { label: string; lots: number; outputKg: number; cost: number; soldQty: number; revenue: number }>()
  const ensure = (key: string, label: string) => {
    if (!rows.has(key)) rows.set(key, { label, lots: 0, outputKg: 0, cost: 0, soldQty: 0, revenue: 0 })
    return rows.get(key)!
  }
  if (groupBy === 'CUSTOMER') {
    for (const lot of lots) {
      for (const delivery of lot.deliveries) {
        const customer = delivery.customerId ? state.customers.find((item) => item.id === delivery.customerId) : undefined
        const key = customer?.id ?? 'INTERNAL'
        const row = ensure(key, customer?.nameAr ?? 'سحب داخلي')
        row.outputKg = qty(row.outputKg + delivery.qty)
        row.soldQty = qty(row.soldQty + delivery.qty)
        const productionCost = money(Math.max(0, lot.totalCost - approvedTripTransportCost(state, lot.lotNo)))
        const productionShare = lot.actualOutputKg > 0
          ? money((productionCost * delivery.qty) / lot.actualOutputKg)
          : money((lot.costPerTon * delivery.qty) / 1000)
        const deliveryTransport = delivery.invoiceId
          ? money((state.tripCostAllocations ?? [])
            .filter((allocation) => allocation.status === 'APPROVED')
            .filter((allocation) => state.trips.find((trip) => trip.id === allocation.tripId)?.invoiceId === delivery.invoiceId)
            .reduce((sum, allocation) => sum + allocation.allocations
              .filter((line) => line.lotNo === lot.lotNo)
              .reduce((lineSum, line) => lineSum + line.amount, 0), 0))
          : 0
        row.cost = money(row.cost + productionShare + deliveryTransport)
        row.revenue = money(row.revenue + deliveryRevenue(state, lot, delivery))
      }
    }
  } else {
    for (const lot of lots) {
      const key = groupBy === 'PRODUCT' ? lot.productId : muscatDay(lot.manufacturedAt).slice(0, 7)
      const label = groupBy === 'PRODUCT' ? (state.products.find((item) => item.id === lot.productId)?.nameAr ?? lot.productId) : key
      const row = ensure(key, label)
      row.lots += 1
      row.outputKg = qty(row.outputKg + lot.actualOutputKg)
      row.cost = money(row.cost + lot.totalCost)
      for (const delivery of lot.deliveries) {
        row.soldQty = qty(row.soldQty + delivery.qty)
        row.revenue = money(row.revenue + deliveryRevenue(state, lot, delivery))
      }
    }
  }
  return [...rows.entries()]
    .map(([key, row]) => {
      const basisKg = row.outputKg > 0 ? row.outputKg : row.soldQty
      const costPerTon = basisKg > 0 ? money((row.cost / basisKg) * 1000) : 0
      const avgSalePricePerTon = row.soldQty > 0 ? money((row.revenue / row.soldQty) * 1000) : null
      const marginValue = money(row.revenue - row.cost)
      const marginPct = row.revenue > 0 ? money((marginValue / row.revenue) * 100) : null
      return { key, label: row.label, lots: row.lots, outputKg: row.outputKg, cost: row.cost, costPerTon, soldQty: row.soldQty, revenue: row.revenue, avgSalePricePerTon, marginValue, marginPct }
    })
    .sort((a, b) => b.marginValue - a.marginValue)
}

export type VarianceGroupBy = 'PRODUCT' | 'SHIFT' | 'OPERATOR' | 'MACHINE' | 'MONTH'

export type VarianceRow = {
  key: string
  label: string
  lots: number
  expectedKg: number
  actualKg: number
  varianceKg: number
  variancePct: number
  wasteKg: number
  warning: number
  critical: number
}

function pct2(value: number) {
  return Math.round(value * 100) / 100
}

/**
 * Variance / waste grouped by product, shift, operator, line (machine) or month.
 * Uses the completed lot's expected vs actual output and the severity recorded on the order.
 */
export function varianceReport(state: ReportState, groupBy: VarianceGroupBy = 'PRODUCT'): VarianceRow[] {
  const lots = state.lots ?? []
  const orders = new Map((state.productionOrders ?? []).map((order) => [order.id, order]))
  const rows = new Map<string, { label: string; lots: number; expectedKg: number; actualKg: number; wasteKg: number; warning: number; critical: number }>()
  const ensure = (key: string, label: string) => {
    if (!rows.has(key)) rows.set(key, { label, lots: 0, expectedKg: 0, actualKg: 0, wasteKg: 0, warning: 0, critical: 0 })
    return rows.get(key)!
  }
  for (const lot of lots) {
    const order = orders.get(lot.productionOrderId)
    let key = ''
    let label = ''
    if (groupBy === 'PRODUCT') {
      key = lot.productId
      label = state.products.find((item) => item.id === lot.productId)?.nameAr ?? lot.productId
    } else if (groupBy === 'SHIFT') {
      key = order?.shift ?? 'UNSET'
      label = order?.shift ?? 'غير محدد'
    } else if (groupBy === 'OPERATOR') {
      key = lot.operatorId ?? 'UNSET'
      label = operatorLabel(state.employees, lot.operatorId)
    } else if (groupBy === 'MACHINE') {
      key = order?.machineId ?? 'UNSET'
      label = (state.machines ?? []).find((item) => item.id === order?.machineId)?.nameAr ?? 'غير محدد'
    } else {
      key = muscatDay(lot.manufacturedAt).slice(0, 7)
      label = key
    }
    const row = ensure(key, label)
    row.lots += 1
    row.expectedKg = qty(row.expectedKg + lot.expectedOutputKg)
    row.actualKg = qty(row.actualKg + lot.actualOutputKg)
    row.wasteKg = qty(row.wasteKg + lot.wasteKg)
    if (order?.varianceLevel === 'WARNING') row.warning += 1
    if (order?.varianceLevel === 'CRITICAL') row.critical += 1
  }
  return [...rows.entries()]
    .map(([key, row]) => {
      const varianceKg = qty(row.actualKg - row.expectedKg)
      const variancePct = row.expectedKg > 0 ? pct2((varianceKg / row.expectedKg) * 100) : 0
      return { key, label: row.label, lots: row.lots, expectedKg: row.expectedKg, actualKg: row.actualKg, varianceKg, variancePct, wasteKg: row.wasteKg, warning: row.warning, critical: row.critical }
    })
    .sort((a, b) => a.variancePct - b.variancePct)
}

export function supplierQuality(state: ReportState, supplierId: string) {
  const supplier = state.suppliers.find((item) => item.id === supplierId) ?? null
  const samples = (state.qualitySamples ?? []).filter((item) => item.supplierId === supplierId)
  const decided = samples.filter((item) => item.result !== 'PENDING')
  const passed = decided.filter((item) => item.result === 'PASSED').length
  const average = (key: 'moisturePct' | 'proteinPct') => {
    const rows = samples.filter((item) => item[key] != null)
    if (rows.length === 0) return null
    return money(rows.reduce((sum, item) => sum + (item[key] ?? 0), 0) / rows.length)
  }
  return {
    supplier,
    samples: samples.length,
    passRate: decided.length > 0 ? money((passed / decided.length) * 100) : null,
    avgMoisture: average('moisturePct'),
    avgProtein: average('proteinPct'),
  }
}

export function traceSupplierBatch(state: ReportState, materialId: string, batchNo: string) {
  const material = state.materials.find((item) => item.id === materialId) ?? null
  const lots = (state.lots ?? []).filter((lot) => lot.materials.some((line) => line.materialId === materialId && line.sourceBatchNo === batchNo))
  const supplierIds = new Set(lots.flatMap((lot) => lot.materials.filter((line) => line.materialId === materialId && line.sourceBatchNo === batchNo).map((line) => line.supplierId).filter(Boolean)))
  const suppliers = [...supplierIds].map((id) => state.suppliers.find((item) => item.id === id)).filter((item): item is NonNullable<typeof item> => Boolean(item))
  return { material, batchNo, suppliers, lots }
}

export type LotListFilter = {
  productId?: string
  fromDay?: string
  toDay?: string
  qcStatus?: string
  marginSign?: 'all' | 'negative' | 'positive'
}

export function filterLots(state: ReportState, filter: LotListFilter = {}) {
  return (state.lots ?? []).filter((lot) => {
    if (filter.productId && lot.productId !== filter.productId) return false
    const day = muscatDay(lot.manufacturedAt)
    if (filter.fromDay && day < filter.fromDay) return false
    if (filter.toDay && day > filter.toDay) return false
    if (filter.qcStatus && (lot.qcStatus ?? 'UNTESTED') !== filter.qcStatus) return false
    if (filter.marginSign === 'negative' && !(lot.marginPerTon != null && lot.marginPerTon < 0)) return false
    if (filter.marginSign === 'positive' && !(lot.marginPerTon != null && lot.marginPerTon > 0)) return false
    return true
  })
}

export function lotExportRows(state: ReportState, filter: LotListFilter = {}) {
  const rows: Array<Array<string | number>> = [['رقم الدفعة', 'المنتج', 'المشغّل', 'تاريخ التصنيع', 'الجودة', 'تكلفة الطن', 'سعر البيع للطن', 'الهامش للطن', 'الهامش %', 'قديم']]
  for (const lot of filterLots(state, filter)) {
    rows.push([
      lot.lotNo,
      state.products.find((item) => item.id === lot.productId)?.nameAr ?? lot.productId,
      operatorLabel(state.employees, lot.operatorId),
      muscatDay(lot.manufacturedAt),
      lot.qcStatus ?? 'UNTESTED',
      lot.costPerTon,
      lot.salePricePerTon ?? '',
      lot.marginPerTon ?? '',
      lot.marginPct ?? '',
      lot.legacy ? 'نعم' : '',
    ])
  }
  return rows
}

export function traceCustomer(state: ReportState, customerId: string) {
  const customer = state.customers.find((item) => item.id === customerId) ?? null
  const lots = (state.lots ?? []).filter((lot) => lot.deliveries.some((delivery) => delivery.customerId === customerId))
  return { customer, lots }
}

/** One month of purchasing/consumption history for a raw material. */
export type MaterialPriceMonth = {
  month: string
  purchasedQty: number
  purchasedValue: number
  avgPrice: number
  minPrice: number
  maxPrice: number
  usedQty: number
  transportCost: number
  landedUnitCost: number
}

export type MaterialPriceAnalysis = {
  material: ReportState['materials'][number]
  /** Latest unit cost actually received, or 0 when never purchased. */
  currentPrice: number
  /** Weighted average unit cost across all receipts. */
  avgPrice: number
  minPrice: number
  maxPrice: number
  purchasedQty: number
  purchasedValue: number
  usedQty: number
  transportCost: number
  /** (purchased value + allocated transport) / purchased qty. */
  landedUnitCost: number
  suppliers: Array<{ id: string; nameAr: string; qty: number; avgPrice: number }>
  months: MaterialPriceMonth[]
}

/**
 * Raw material price analysis (#16): monthly average, highest and lowest price,
 * the supplier, quantity purchased, quantity used, transport cost and the landed
 * cost that reaches the factory, plus a month-by-month series for charting.
 *
 * Transport is allocated to each material by its share of that month's total
 * purchased quantity, so a material bought in a heavy haul month carries its part
 * of the freight.
 */
export function materialPriceAnalysis(state: ReportState, materialId?: string): MaterialPriceAnalysis[] {
  const materials = materialId ? state.materials.filter((item) => item.id === materialId) : state.materials

  type ReceiptRow = { at: string; month: string; qty: number; unitCost: number; supplierId: string | null }
  const receiptsByMaterial = new Map<string, ReceiptRow[]>()
  const monthPurchasedQty = new Map<string, number>()
  const monthTripCost = new Map<string, number>()

  for (const receipt of state.goodsReceipts) {
    const order = state.purchaseOrders.find((po) => po.id === receipt.purchaseOrderId)
    const month = muscatDay(receipt.at).slice(0, 7)
    for (const line of receipt.lines) {
      const rows = receiptsByMaterial.get(line.materialId) ?? []
      rows.push({ at: receipt.at, month, qty: line.qty, unitCost: line.unitCost, supplierId: order?.supplierId ?? null })
      receiptsByMaterial.set(line.materialId, rows)
      monthPurchasedQty.set(month, qty((monthPurchasedQty.get(month) ?? 0) + line.qty))
    }
  }

  for (const trip of state.trips ?? []) {
    if (trip.cost <= 0) continue
    const month = muscatDay(trip.date).slice(0, 7)
    monthTripCost.set(month, money((monthTripCost.get(month) ?? 0) + trip.cost))
  }

  return materials.map((material) => {
    const rows = receiptsByMaterial.get(material.id) ?? []

    const monthMap = new Map<string, { qty: number; value: number; min: number; max: number }>()
    for (const row of rows) {
      const bucket = monthMap.get(row.month) ?? { qty: 0, value: 0, min: Infinity, max: 0 }
      bucket.qty = qty(bucket.qty + row.qty)
      bucket.value = money(bucket.value + row.qty * row.unitCost)
      bucket.min = Math.min(bucket.min, row.unitCost)
      bucket.max = Math.max(bucket.max, row.unitCost)
      monthMap.set(row.month, bucket)
    }

    const usedByMonth = new Map<string, number>()
    for (const entry of state.ledger) {
      if (entry.itemType !== 'MATERIAL' || entry.itemId !== material.id) continue
      if (entry.type !== 'PRODUCTION_CONSUMPTION') continue
      const month = muscatDay(entry.at).slice(0, 7)
      usedByMonth.set(month, qty((usedByMonth.get(month) ?? 0) + Math.abs(entry.qty)))
    }

    const months: MaterialPriceMonth[] = [...new Set([...monthMap.keys(), ...usedByMonth.keys()])]
      .sort()
      .map((month) => {
        const bucket = monthMap.get(month)
        const purchasedQty = bucket ? bucket.qty : 0
        const purchasedValue = bucket ? bucket.value : 0
        const totalMonthQty = monthPurchasedQty.get(month) ?? 0
        const share = totalMonthQty > 0 ? purchasedQty / totalMonthQty : 0
        const transportCost = money((monthTripCost.get(month) ?? 0) * share)
        const landedUnitCost = purchasedQty > 0 ? money((purchasedValue + transportCost) / purchasedQty) : 0
        return {
          month,
          purchasedQty,
          purchasedValue,
          avgPrice: purchasedQty > 0 ? money(purchasedValue / purchasedQty) : 0,
          minPrice: bucket ? bucket.min : 0,
          maxPrice: bucket ? bucket.max : 0,
          usedQty: usedByMonth.get(month) ?? 0,
          transportCost,
          landedUnitCost,
        }
      })

    const purchasedQty = qty(rows.reduce((sum, row) => sum + row.qty, 0))
    const purchasedValue = money(rows.reduce((sum, row) => sum + row.qty * row.unitCost, 0))
    const transportCost = money(months.reduce((sum, month) => sum + month.transportCost, 0))
    const usedQty = qty(months.reduce((sum, month) => sum + month.usedQty, 0))
    const prices = rows.map((row) => row.unitCost)
    const latestRow = rows.reduce<ReceiptRow | null>(
      (latest, row) => (latest === null || row.at > latest.at ? row : latest),
      null,
    )

    const supplierMap = new Map<string, { qty: number; value: number }>()
    for (const row of rows) {
      if (!row.supplierId) continue
      const bucket = supplierMap.get(row.supplierId) ?? { qty: 0, value: 0 }
      bucket.qty = qty(bucket.qty + row.qty)
      bucket.value = money(bucket.value + row.qty * row.unitCost)
      supplierMap.set(row.supplierId, bucket)
    }
    const suppliers = [...supplierMap.entries()]
      .map(([id, bucket]) => ({
        id,
        nameAr: state.suppliers.find((supplier) => supplier.id === id)?.nameAr ?? id,
        qty: bucket.qty,
        avgPrice: bucket.qty > 0 ? money(bucket.value / bucket.qty) : 0,
      }))
      .sort((a, b) => b.qty - a.qty)

    return {
      material,
      currentPrice: latestRow ? latestRow.unitCost : 0,
      avgPrice: purchasedQty > 0 ? money(purchasedValue / purchasedQty) : 0,
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      purchasedQty,
      purchasedValue,
      usedQty,
      transportCost,
      landedUnitCost: purchasedQty > 0 ? money((purchasedValue + transportCost) / purchasedQty) : 0,
      suppliers,
      months,
    }
  })
}

export function obligationForecast(state: ReportState, firstMonth: string, monthCount = 12) {
  if (!/^\d{4}-\d{2}$/.test(firstMonth)) throw new Error('شهر بداية التوقع غير صحيح')
  if (!Number.isInteger(monthCount) || monthCount < 1 || monthCount > 120) throw new Error('عدد أشهر التوقع غير صحيح')
  const start = new Date(`${firstMonth}-01T00:00:00.000Z`)
  const months = Array.from({ length: monthCount }, (_, offset) => {
    const date = new Date(start)
    date.setUTCMonth(date.getUTCMonth() + offset)
    return { month: date.toISOString().slice(0, 7), amount: 0, installments: 0 }
  })
  const activeObligationIds = new Set(state.obligations.filter((item) => item.status === 'ACTIVE').map((item) => item.id))
  const byMonth = new Map(months.map((item) => [item.month, item]))
  for (const line of state.obligationScheduleLines) {
    if (!activeObligationIds.has(line.obligationId) || line.status === 'PAID') continue
    const month = byMonth.get(line.dueDate.slice(0, 7))
    if (!month) continue
    month.amount = money(month.amount + Math.max(0, line.amount - line.paidAmount))
    month.installments += 1
  }
  return months.map((item) => ({ ...item, amount: money(item.amount) }))
}

export function machineCostsByMachine(state: ReportState) {
  return state.machines.map((machine) => {
    const maintenanceCost = money(
      state.maintenanceRecords.filter((record) => record.machineId === machine.id).reduce((sum, record) => sum + record.cost, 0),
    )
    const issuedPartsCost = money(
      state.sparePartUsages.filter((usage) => usage.machineId === machine.id).reduce((sum, usage) => sum + usage.cost, 0),
    )
    return {
      machineId: machine.id,
      maintenanceCost,
      issuedPartsCost,
      totalCost: money(maintenanceCost + issuedPartsCost),
    }
  })
}

export function unmatchedBankTransactions(state: ReportState) {
  return state.bankTransactions.filter((transaction) => transaction.status !== 'MATCHED')
}

export function packagingVarianceSummary(state: ReportState) {
  return state.packagingMaterials.map((material) => {
    const records = state.packagingConsumption.filter((item) => item.packagingMaterialId === material.id)
    const expected = qty(records.reduce((sum, item) => sum + item.calculatedQty, 0))
    const actual = qty(records.reduce((sum, item) => sum + item.quantity, 0))
    return {
      packagingMaterialId: material.id,
      expected,
      actual,
      variance: qty(actual - expected),
      cost: money(records.reduce((sum, item) => sum + item.cost, 0)),
    }
  })
}

export function utilitiesPerTon(state: ReportState) {
  return state.utilitiesReadings.map((reading) => ({
    readingId: reading.id,
    month: reading.readingDate.slice(0, 7),
    utility: reading.utility,
    consumption: reading.consumption,
    productionTon: reading.productionTon,
    costPerTon: reading.costPerTon,
  }))
}

export type RecallTarget = { lotNo?: string; materialId?: string; batchNo?: string }

export function recallReport(state: ReportState, target: RecallTarget) {
  const lotNo = target.lotNo?.trim()
  const materialId = target.materialId?.trim()
  const batchNo = target.batchNo?.trim()
  if (Boolean(lotNo) === Boolean(materialId && batchNo)) throw new Error('حدد دفعة إنتاج أو دفعة خام واحدة')

  const matchingLots = lotNo
    ? state.lots.filter((lot) => lot.lotNo === lotNo)
    : state.lots.filter((lot) => lot.materials.some((line) => line.materialId === materialId && line.sourceBatchNo === batchNo))
  const deliveries = matchingLots.flatMap((lot) => lot.deliveries.map((delivery) => {
    const invoice = delivery.invoiceId ? state.invoices.find((item) => item.id === delivery.invoiceId) : undefined
    return {
      lotNo: lot.lotNo,
      product: state.products.find((item) => item.id === lot.productId)?.nameAr ?? lot.productId,
      customerId: delivery.customerId,
      customer: delivery.customerId ? state.customers.find((item) => item.id === delivery.customerId)?.nameAr ?? delivery.customerId : 'سحب داخلي',
      quantityKg: delivery.qty,
      invoiceNo: invoice?.number ?? null,
      date: invoice?.issuedAt.slice(0, 10) ?? delivery.at.slice(0, 10),
      withdrawalId: delivery.withdrawalId ?? null,
    }
  }))
  const customerMap = new Map<string, { customerId: string; customer: string; quantityKg: number; invoiceNumbers: Set<string> }>()
  for (const delivery of deliveries) {
    if (!delivery.customerId) continue
    const current = customerMap.get(delivery.customerId) ?? {
      customerId: delivery.customerId,
      customer: delivery.customer,
      quantityKg: 0,
      invoiceNumbers: new Set<string>(),
    }
    current.quantityKg = qty(current.quantityKg + delivery.quantityKg)
    if (delivery.invoiceNo) current.invoiceNumbers.add(delivery.invoiceNo)
    customerMap.set(delivery.customerId, current)
  }
  const rawBatch = materialId && batchNo
    ? matchingLots.flatMap((lot) => lot.materials.filter((line) => line.materialId === materialId && line.sourceBatchNo === batchNo))
    : []
  const supplierIds = [...new Set(rawBatch.map((line) => line.supplierId).filter((id): id is string => Boolean(id)))]
  return {
    target: lotNo ? { type: 'LOT' as const, lotNo } : { type: 'RAW_BATCH' as const, materialId: materialId!, batchNo: batchNo! },
    materialName: materialId ? state.materials.find((item) => item.id === materialId)?.nameAr ?? materialId : null,
    suppliers: supplierIds.map((id) => state.suppliers.find((item) => item.id === id)?.nameAr ?? id),
    lots: matchingLots.map((lot) => ({ lotNo: lot.lotNo, product: state.products.find((item) => item.id === lot.productId)?.nameAr ?? lot.productId, manufacturedAt: lot.manufacturedAt.slice(0, 10), quantityKg: lot.actualOutputKg })),
    deliveries,
    affectedCustomers: [...customerMap.values()].map((item) => ({
      customerId: item.customerId,
      customer: item.customer,
      quantityKg: qty(item.quantityKg),
      invoiceNumbers: [...item.invoiceNumbers],
    })),
  }
}

export function canViewRecallReport(permissions: readonly string[]) {
  return permissions.includes('reports.read') || permissions.includes('qc.read')
}
