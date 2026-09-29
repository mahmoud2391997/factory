import { money, qty } from './money'
import type { CostBasis, CostLine, CostLineType, ErpState, Product, ProductionLot } from './types'

export const ALLOCATED_COST_TYPES = ['ELECTRICITY', 'GAS', 'LABOR', 'TRANSPORT', 'MAINTENANCE', 'OVERHEAD'] as const
export type AllocatedCostType = (typeof ALLOCATED_COST_TYPES)[number]

export const COST_LABEL: Record<CostLine['type'], string> = {
  RAW_MATERIAL: 'مواد خام',
  BAGS: 'أكياس',
  ELECTRICITY: 'كهرباء',
  GAS: 'غاز',
  LABOR: 'أجور',
  TRANSPORT: 'نقل',
  MAINTENANCE: 'صيانة',
  OVERHEAD: 'مصاريف عامة',
}

const MUSCAT_OFFSET_MS = 4 * 60 * 60 * 1000

function monthOf(iso: string) {
  return new Date(Date.parse(iso) + MUSCAT_OFFSET_MS).toISOString().slice(0, 7)
}

function dayOf(iso: string) {
  return new Date(Date.parse(iso) + MUSCAT_OFFSET_MS).toISOString().slice(0, 10)
}

function hoursBetween(checkIn: string, checkOut: string) {
  const [ih, im] = checkIn.split(':').map(Number)
  const [oh, om] = checkOut.split(':').map(Number)
  if (![ih, im, oh, om].every((n) => Number.isFinite(n))) return 0
  return Math.max(0, oh + om / 60 - (ih + im / 60))
}

/** Context the completion form and the month-close recalculation both supply. */
export type CostContext = {
  /** ISO timestamp the lot was manufactured. Drives which month's actuals are used. */
  manufacturedAt?: string
  /** Raw material consumed (kg). Transport is allocated on input tonnage. */
  inputKg?: number
  /** Machine / production line. Drives machine-scoped maintenance allocation. */
  machineId?: string
  productionOrderId?: string
  /** Set on recalculation so recorded packaging consumption can be picked up. */
  lotNo?: string
  /**
   * True when the lot being costed is already recorded in state.lots (month-close recalculation).
   * Its output tons are then already part of the month total and must not be added again.
   */
  alreadyCounted?: boolean
}

export function packagingUnitCost(state: ErpState) {
  const materialId = state.company.packagingMaterialId
  if (materialId) {
    for (const receipt of state.goodsReceipts) {
      const line = receipt.lines.find((item) => item.materialId === materialId)
      if (line && line.unitCost > 0) return line.unitCost
    }
    const balance = state.balances.find((row) => row.itemType === 'MATERIAL' && row.itemId === materialId && row.unitCost > 0)
    if (balance) return balance.unitCost
  }
  return state.company.bagUnitCost ?? 0
}

/** Real per-ton utilities rate from UtilitiesReading records in the month. Water folds into overhead. */
export function utilitiesRatePerTon(state: ErpState, month: string) {
  const readings = (state.utilitiesReadings ?? []).filter((reading) => monthOf(reading.readingDate) === month)
  const result: Partial<Record<CostLineType, { ratePerTon: number; source: string }>> = {}
  const mapping: Array<[typeof readings[number]['utility'], CostLineType]> = [
    ['ELECTRICITY', 'ELECTRICITY'],
    ['GAS', 'GAS'],
    ['WATER', 'OVERHEAD'],
  ]
  for (const [utility, type] of mapping) {
    const rows = readings.filter((reading) => reading.utility === utility)
    if (rows.length === 0) continue
    const cost = money(rows.reduce((sum, reading) => sum + reading.cost, 0))
    const tons = qty(rows.reduce((sum, reading) => sum + reading.productionTon, 0))
    if (cost <= 0 || tons <= 0) continue
    result[type] = { ratePerTon: cost / tons, source: `قراءات المرافق ${month}` }
  }
  return result
}

function isProductionEmployee(department: string) {
  return /إنتاج|production|feed mill|mill/i.test(department)
}

/** Approved production payroll for the month spread over month tons (or attendance hours on the lot's day). */
function laborAllocation(state: ErpState, month: string, context: CostContext, outputTons: number) {
  const payrolls = (state.payrolls ?? []).filter((run) => run.month === month && (run.status === 'APPROVED' || run.status === 'PAID'))
  if (payrolls.length === 0) return null
  const lines = payrolls
    .flatMap((run) => run.lines)
    .filter((line) => {
      const employee = state.employees.find((item) => item.id === line.employeeId)
      return employee ? isProductionEmployee(employee.department) : false
    })
  const total = money(lines.reduce((sum, line) => sum + line.net, 0))
  if (total <= 0) return null
  const basis = state.company.laborAllocationBasis ?? 'PER_TON'
  if (basis === 'PER_HOUR') {
    const productionIds = new Set(lines.map((line) => line.employeeId))
    const monthHours = (state.attendance ?? [])
      .filter((row) => productionIds.has(row.employeeId) && monthOf(row.date) === month)
      .reduce((sum, row) => sum + hoursBetween(row.checkIn, row.checkOut), 0)
    const day = context.manufacturedAt ? dayOf(context.manufacturedAt) : ''
    const dayHours = (state.attendance ?? [])
      .filter((row) => productionIds.has(row.employeeId) && dayOf(row.date) === day)
      .reduce((sum, row) => sum + hoursBetween(row.checkIn, row.checkOut), 0)
    if (monthHours > 0 && dayHours > 0) {
      return { amount: money((total / monthHours) * dayHours), source: `أجور الإنتاج ${month} (بالساعة)` }
    }
    return null
  }
  const extraTons = context.alreadyCounted ? 0 : outputTons
  const monthTons = qty(
    (state.lots ?? []).filter((lot) => monthOf(lot.manufacturedAt) === month).reduce((sum, lot) => sum + lot.actualOutputKg, 0) / 1000 + extraTons,
  )
  if (monthTons <= 0) return null
  return { amount: money((total / monthTons) * outputTons), source: `أجور الإنتاج ${month} (بالطن)` }
}

function machineTons(state: ErpState, machineId: string, month: string, extraTons: number) {
  const tons = (state.lots ?? [])
    .filter((lot) => monthOf(lot.manufacturedAt) === month)
    .filter((lot) => state.productionOrders.find((order) => order.id === lot.productionOrderId)?.machineId === machineId)
    .reduce((sum, lot) => sum + lot.actualOutputKg, 0)
  return qty(tons / 1000 + extraTons)
}

/** Maintenance records + spare-part usage. Machine-scoped when the order names a machine, else spread over the month. */
function maintenanceAllocation(state: ErpState, month: string, context: CostContext, outputTons: number) {
  const machineId = context.machineId
  const records = (state.maintenanceRecords ?? []).filter(
    (record) => monthOf(record.startDate) === month && (!machineId || record.machineId === machineId),
  )
  const usages = (state.sparePartUsages ?? []).filter(
    (usage) => monthOf(usage.date) === month && (!machineId || usage.machineId === machineId),
  )
  const cost = money(records.reduce((sum, record) => sum + record.cost, 0) + usages.reduce((sum, usage) => sum + usage.cost, 0))
  if (cost <= 0) return null
  const machine = machineId ? state.machines.find((item) => item.id === machineId) : undefined
  const scope = machineId ? `صيانة ${machine?.nameAr ?? 'الآلة'} ${month}` : `صيانة المصنع ${month}`
  const extraTons = context.alreadyCounted ? 0 : outputTons
  const monthTons = machineId
    ? machineTons(state, machineId, month, extraTons)
    : qty((state.lots ?? []).filter((lot) => monthOf(lot.manufacturedAt) === month).reduce((sum, lot) => sum + lot.actualOutputKg, 0) / 1000 + extraTons)
  if (monthTons <= 0) return null
  return { amount: money((cost / monthTons) * outputTons), source: scope }
}

/** Inbound trip cost spread over the tonnage carried, then charged to the lot on its input tonnage. */
function transportAllocation(state: ErpState, month: string, inputTons: number) {
  const trips = (state.trips ?? []).filter((trip) => !trip.invoiceId && monthOf(trip.date) === month)
  const cost = money(trips.reduce((sum, trip) => sum + trip.cost, 0))
  const tons = qty(trips.reduce((sum, trip) => sum + trip.loadKg / 1000, 0))
  if (cost <= 0 || tons <= 0 || inputTons <= 0) return null
  return { amount: money((cost / tons) * inputTons), source: `نقل الخامات ${month}` }
}

export function approvedTripTransportCost(state: Pick<ErpState, 'tripCostAllocations'>, lotNo: string) {
  return money((state.tripCostAllocations ?? [])
    .filter((allocation) => allocation.status === 'APPROVED')
    .reduce((sum, allocation) => sum + allocation.allocations
      .filter((line) => line.lotNo === lotNo)
      .reduce((lineSum, line) => lineSum + line.amount, 0), 0))
}

export function transportCostBreakdown(state: ErpState, outputKg: number, context: CostContext) {
  const month = context.manufacturedAt ? monthOf(context.manufacturedAt) : ''
  const inputTons = context.inputKg != null ? context.inputKg / 1000 : outputKg / 1000
  const inbound = month ? transportAllocation(state, month, inputTons) : null
  const outboundAmount = context.lotNo ? approvedTripTransportCost(state, context.lotNo) : 0
  const inboundAmount = inbound?.amount ?? 0
  const amount = money(inboundAmount + outboundAmount)
  if (amount <= 0) return null
  const sources = [
    inbound?.source,
    ...(context.lotNo
      ? (state.tripCostAllocations ?? [])
        .filter((allocation) => allocation.status === 'APPROVED')
        .filter((allocation) => allocation.allocations.some((line) => line.lotNo === context.lotNo))
        .map((allocation) => `رحلة توصيل ${allocation.tripId}`)
      : []),
  ].filter((source): source is string => Boolean(source))
  return {
    line: { type: 'TRANSPORT' as const, amount, basis: 'ACTUAL' as const, source: sources.join('، ') },
    inboundAmount,
    outboundAmount,
  }
}

/** Bags: recorded packaging consumption wins, otherwise the bag weight estimate. */
export function packagingCostLine(state: ErpState, product: Product | undefined, outputKg: number, lotNo?: string): CostLine | null {
  if (lotNo) {
    const rows = (state.packagingConsumption ?? []).filter((row) => row.lotNo === lotNo)
    const cost = money(rows.reduce((sum, row) => sum + row.cost, 0))
    if (cost > 0) return { type: 'BAGS', amount: cost, basis: 'ACTUAL', source: `استهلاك تعبئة فعلي ${lotNo}` }
  }
  const bagKg = product?.bagKg ?? 0
  const bags = bagKg > 0 ? qty(outputKg / bagKg) : 0
  const amount = money(bags * packagingUnitCost(state))
  return amount > 0 ? { type: 'BAGS', amount, basis: 'ESTIMATED', source: 'تقدير من وزن الكيس' } : null
}

/**
 * Build one allocated cost line from real records, falling back to the company rate.
 * Returns null when there is neither an actual nor a configured rate.
 */
export function allocateCostType(state: ErpState, type: AllocatedCostType, outputKg: number, context: CostContext = {}): CostLine | null {
  const tons = outputKg / 1000
  const month = context.manufacturedAt ? monthOf(context.manufacturedAt) : ''
  const inputTons = context.inputKg != null ? context.inputKg / 1000 : tons
  if (month) {
    if (type === 'ELECTRICITY' || type === 'GAS' || type === 'OVERHEAD') {
      const actual = utilitiesRatePerTon(state, month)[type]
      if (actual && actual.ratePerTon > 0) {
        return { type, amount: money(actual.ratePerTon * tons), basis: 'ACTUAL', source: actual.source }
      }
    }
    if (type === 'LABOR') {
      const actual = laborAllocation(state, month, context, tons)
      if (actual && actual.amount > 0) return { type, amount: actual.amount, basis: 'ACTUAL', source: actual.source }
    }
    if (type === 'MAINTENANCE') {
      const actual = maintenanceAllocation(state, month, context, tons)
      if (actual && actual.amount > 0) return { type, amount: actual.amount, basis: 'ACTUAL', source: actual.source }
    }
    if (type === 'TRANSPORT') {
      const actual = transportCostBreakdown(state, outputKg, context)
      if (actual) return actual.line
    }
  }
  const rate = state.company.costRates?.[type] ?? 0
  const amount = money(rate * tons)
  return amount > 0 ? { type, amount, basis: 'ESTIMATED', source: 'سعر تقديري من الإعدادات' } : null
}

export function buildLotCostLines(
  state: ErpState,
  product: Product | undefined,
  outputKg: number,
  rawAmount: number,
  manual: Array<{ type: AllocatedCostType; amount: number }> = [],
  context: CostContext = {},
): CostLine[] {
  const lines: CostLine[] = [{ type: 'RAW_MATERIAL', amount: money(rawAmount), basis: 'ACTUAL', source: 'صرف FIFO' }]
  const bags = packagingCostLine(state, product, outputKg, context.lotNo)
  if (bags) lines.push(bags)
  const manualByType = new Map(manual.map((line) => [line.type, line]))
  for (const type of ALLOCATED_COST_TYPES) {
    const entered = manualByType.get(type)
    if (entered) {
      if (money(entered.amount) > 0) lines.push({ type, amount: money(entered.amount), basis: 'MANUAL', source: 'إدخال يدوي' })
      continue
    }
    const allocated = allocateCostType(state, type, outputKg, context)
    if (allocated) lines.push(allocated)
  }
  return lines
}

/** Posted margin uses approved cost only. Provisional adds lines still waiting for approval. */
export function lotEconomics(lot: Pick<ProductionLot, 'totalCost' | 'actualOutputKg' | 'costPerTon' | 'salePricePerTon' | 'marginPerTon' | 'marginPct' | 'pendingCostLines'>) {
  const pending = money((lot.pendingCostLines ?? []).reduce((sum, line) => sum + line.amount, 0))
  const provisionalTotal = money(lot.totalCost + pending)
  const provisionalCostPerTon = lot.actualOutputKg > 0 ? money((provisionalTotal / lot.actualOutputKg) * 1000) : 0
  const provisionalMarginPerTon = lot.salePricePerTon != null ? money(lot.salePricePerTon - provisionalCostPerTon) : undefined
  const provisionalMarginPct =
    lot.salePricePerTon != null && lot.salePricePerTon !== 0 && provisionalMarginPerTon != null
      ? money((provisionalMarginPerTon / lot.salePricePerTon) * 100)
      : undefined
  return { pending, provisionalTotal, provisionalCostPerTon, provisionalMarginPerTon, provisionalMarginPct }
}
