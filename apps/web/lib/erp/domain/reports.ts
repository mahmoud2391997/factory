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

export function traceProduct(state: ReportState, productId: string) {
  const product = state.products.find((item) => item.id === productId)
  const orders = state.productionOrders.filter((order) => order.productId === productId)
  const sales = state.invoices.filter((invoice) => invoice.lines.some((line) => line.productId === productId))
  const materialIds = new Set(orders.flatMap((order) => order.expected.map((line) => line.materialId)))
  const receipts = state.goodsReceipts.filter((receipt) => receipt.lines.some((line) => materialIds.has(line.materialId)))
  const purchaseOrders = state.purchaseOrders.filter((order) => receipts.some((receipt) => receipt.purchaseOrderId === order.id))
  return { product, orders, sales, receipts, purchaseOrders }
}
