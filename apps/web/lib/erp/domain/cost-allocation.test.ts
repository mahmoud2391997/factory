import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, applyCommand } from './engine'
import { migrateErpState } from './migrate'
import { profitabilityReport, trialBalance } from './reports'
import { createClock, emptyState } from './seed'
import type { Actor, Command, ErpState, ProductionLot } from './types'

function actor(state: ErpState): Actor {
  const found = actorFromUser(state, 'user-gm')
  assert.ok(found)
  return found
}

function must(state: ErpState, clock: ReturnType<typeof createClock>, command: Command) {
  const result = applyCommand(state, actor(state), command, clock)
  if (!result.ok) throw new Error(`${command.action}: ${result.error}`)
  return result.state
}

/** Material, product, supplier, production operator, 10t of raw in WH_MFG and a recipe. */
function base(clock: ReturnType<typeof createClock>) {
  let state = emptyState('alloc')
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM', nameAr: 'ذرة', category: 'حبوب', minQty: 1, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createProduct', input: { code: 'FG', nameAr: 'علف', salePrice: 0.5, vatTreatment: 'ZERO', bagKg: 50 } })
  state = must(state, clock, { action: 'createSupplier', input: { nameAr: 'مورد' } })
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'مشغّل', department: 'الإنتاج', jobTitle: 'مشغّل', basicSalary: 300 } })
  const material = state.materials[0]!
  const product = state.products[0]!
  const supplier = state.suppliers[0]!
  state = must(state, clock, { action: 'createPurchaseOrder', input: { supplierId: supplier.id, lines: [{ materialId: material.id, qty: 10_000, unitCost: 0.05 }] } })
  const poId = state.purchaseOrders[0]!.id
  state = must(state, clock, { action: 'decidePurchaseOrder', input: { id: poId, decision: 'APPROVED' } })
  state = must(state, clock, { action: 'receiveGoods', input: { purchaseOrderId: poId, lines: [{ materialId: material.id, qty: 10_000, batchNo: 'B1' }] } })
  state = must(state, clock, { action: 'transferStock', input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: material.id, batchNo: 'B1', qty: 10_000 }] } })
  state = must(state, clock, { action: 'createRecipe', input: { productId: product.id, nameAr: 'وصفة', baseOutputQty: 1000, items: [{ materialId: material.id, qty: 1000 }] } })
  return { state, material, product, operator: state.employees[0]! }
}

function completeLot(state: ErpState, clock: ReturnType<typeof createClock>, inputKg: number, outputKg: number, machineId?: string) {
  state = must(state, clock, { action: 'createProductionOrder', input: { productId: state.products[0]!.id, recipeId: state.recipes[0]!.id, plannedQty: outputKg } })
  const orderId = state.productionOrders[0]!.id
  if (machineId) state.productionOrders[0]!.machineId = machineId
  state = must(state, clock, {
    action: 'completeProduction',
    input: { productionOrderId: orderId, operatorId: state.employees[0]!.id, actualOutputQty: outputKg, actuals: [{ materialId: state.materials[0]!.id, actualQty: inputKg }] },
  })
  return state
}

test('utilities use the month reading (ACTUAL) and fall back to the company rate (ESTIMATED)', () => {
  const clock = createClock('2026-09-15T04:00:00.000Z')
  let { state } = base(clock)
  state = must(state, clock, { action: 'updateCompany', input: { costRates: { ELECTRICITY: 5 } } })

  // No reading yet: fall back to the 5/ton company rate.
  state = completeLot(state, clock, 1000, 1000)
  const fallback = state.lots[0]!.costLines.find((line) => line.type === 'ELECTRICITY')!
  assert.equal(fallback.amount, 5)
  assert.equal(fallback.basis, 'ESTIMATED')

  // A September reading of 300 OMR over 100 t gives 3/ton. A second lot in the same month uses it.
  state = must(state, clock, { action: 'recordUtilitiesReading', input: { utility: 'ELECTRICITY', readingDate: '2026-09-10', previousReading: 0, currentReading: 1000, cost: 300, productionTon: 100 } })
  state = completeLot(state, clock, 2000, 2000)
  const second = state.lots[0]!.costLines.find((line) => line.type === 'ELECTRICITY')!
  assert.equal(second.amount, 6)
  assert.equal(second.basis, 'ACTUAL')
  assert.match(second.source ?? '', /قراءات المرافق/)
})

test('completion snapshots the cost; month-close recalculation replaces ESTIMATED with ACTUAL', () => {
  const clock = createClock('2026-09-15T04:00:00.000Z')
  let { state } = base(clock)
  state = must(state, clock, { action: 'updateCompany', input: { costRates: { ELECTRICITY: 5 } } })
  state = completeLot(state, clock, 1000, 1000)
  assert.equal(state.lots[0]!.costLines.find((line) => line.type === 'ELECTRICITY')!.amount, 5)

  // The reading arrives after the lot was completed: the snapshot must not move.
  state = must(state, clock, { action: 'recordUtilitiesReading', input: { utility: 'ELECTRICITY', readingDate: '2026-09-20', previousReading: 0, currentReading: 1000, cost: 400, productionTon: 100 } })
  assert.equal(state.lots[0]!.costLines.find((line) => line.type === 'ELECTRICITY')!.amount, 5)
  assert.equal(state.lots[0]!.costLines.find((line) => line.type === 'ELECTRICITY')!.basis, 'ESTIMATED')
  const before = state.lots[0]!.totalCost

  state = must(state, clock, { action: 'recalculateLotCosts', input: { month: '2026-09' } })
  const line = state.lots[0]!.costLines.find((item) => item.type === 'ELECTRICITY')!
  assert.equal(line.amount, 4)
  assert.equal(line.basis, 'ACTUAL')
  assert.notEqual(state.lots[0]!.totalCost, before)
  assert.ok(state.auditLogs.some((entry) => entry.action === 'إعادة حساب تكلفة دفعة' && entry.detail.includes('5→4')))
  assert.equal(trialBalance(state).balanced, true)
})

test('production payroll is spread over the month tons and corrected at month close', () => {
  const clock = createClock('2026-09-15T04:00:00.000Z')
  let { state } = base(clock)
  state = completeLot(state, clock, 2000, 2000)
  state = completeLot(state, clock, 3000, 3000)
  state = must(state, clock, { action: 'createPayroll', input: { month: '2026-09', lines: [{ employeeId: state.employees[0]!.id }] } })
  const payrollId = state.payrolls[0]!.id
  state = must(state, clock, { action: 'decidePayroll', input: { id: payrollId, decision: 'APPROVED' } })
  const total = state.payrolls[0]!.totalNet
  assert.ok(total > 0)

  state = must(state, clock, { action: 'recalculateLotCosts', input: { month: '2026-09' } })
  const lots = [...state.lots].sort((a, b) => a.actualOutputKg - b.actualOutputKg)
  // 5 t produced in the month: 2/5 and 3/5 of the payroll.
  assert.equal(lots[0]!.costLines.find((line) => line.type === 'LABOR')!.amount, Math.round(((total / 5) * 2 + Number.EPSILON) * 1000) / 1000)
  assert.equal(lots[1]!.costLines.find((line) => line.type === 'LABOR')!.amount, Math.round(((total / 5) * 3 + Number.EPSILON) * 1000) / 1000)
  assert.equal(lots[0]!.costLines.find((line) => line.type === 'LABOR')!.basis, 'ACTUAL')
})

test('maintenance and spare parts are allocated by machine to the lots produced on it', () => {
  const clock = createClock('2026-09-15T04:00:00.000Z')
  let { state } = base(clock)
  state = must(state, clock, { action: 'createMachine', input: { code: 'M1', nameAr: 'خط التعبئة', type: 'LINE', location: 'قاعة' } })
  const machineId = state.machines[0]!.id
  state = must(state, clock, { action: 'recordMaintenance', input: { machineId, type: 'ROUTINE', startDate: '2026-09-05', endDate: '2026-09-05', description: 'صيانة دورية', cost: 400, sparePartsUsed: [] } })

  state = completeLot(state, clock, 2000, 2000, machineId)
  state = completeLot(state, clock, 3000, 3000, machineId)
  state = must(state, clock, { action: 'recalculateLotCosts', input: { month: '2026-09' } })
  const lots = [...state.lots].sort((a, b) => a.actualOutputKg - b.actualOutputKg)
  assert.equal(lots[0]!.costLines.find((line) => line.type === 'MAINTENANCE')!.amount, 160)
  assert.equal(lots[1]!.costLines.find((line) => line.type === 'MAINTENANCE')!.amount, 240)
})

test('inbound trip cost is allocated to lots on input tonnage', () => {
  const clock = createClock('2026-09-15T04:00:00.000Z')
  let { state } = base(clock)
  state = must(state, clock, { action: 'createVehicle', input: { code: 'V1', plateNo: '1', type: 'TRUCK', nameAr: 'شاحنة' } })
  state = must(state, clock, { action: 'createTrip', input: { vehicleId: state.vehicles[0]!.id, driverId: state.employees[0]!.id, date: '2026-09-08', destination: 'ميناء', km: 100, loadKg: 10_000, fuelLiters: 0, driverCost: 100 } })
  state = completeLot(state, clock, 5000, 5000)
  const line = state.lots[0]!.costLines.find((item) => item.type === 'TRANSPORT')!
  assert.equal(line.amount, 50)
  assert.equal(line.basis, 'ACTUAL')
})

test('invoice trip cost is distributed by delivered lot quantity, requires independent approval, and is posted once', () => {
  const clock = createClock('2026-09-15T04:00:00.000Z')
  let { state } = base(clock)
  state = must(state, clock, { action: 'createCustomer', input: { nameAr: 'عميل التوصيل' } })
  const customer = state.customers[0]!
  state = completeLot(state, clock, 2000, 2000)
  state = completeLot(state, clock, 3000, 3000)
  state = must(state, clock, { action: 'createInvoice', input: { customerId: customer.id, lines: [{ productId: state.products[0]!.id, qty: 5000 }] } })
  const invoice = state.invoices[0]!
  state = must(state, clock, { action: 'confirmInvoice', input: { id: invoice.id } })
  state = must(state, clock, { action: 'createVehicle', input: { code: 'V-ALLOC', plateNo: 'ALLOC-1', type: 'TRUCK', nameAr: 'شاحنة توزيع' } })
  state = must(state, clock, { action: 'createTrip', input: { vehicleId: state.vehicles[0]!.id, driverId: state.employees[0]!.id, date: '2026-09-15', destination: 'عميل التوصيل', km: 30, loadKg: 5000, fuelLiters: 0, invoiceId: invoice.id, driverCost: 100 } })
  const trip = state.trips[0]!

  state = must(state, clock, { action: 'requestTripCostAllocation', input: { tripId: trip.id } })
  const request = state.tripCostAllocations[0]!
  const lines = [...request.allocations].sort((a, b) => a.quantityKg - b.quantityKg)
  assert.equal(request.status, 'PENDING_APPROVAL')
  assert.deepEqual(lines.map((line) => [line.quantityKg, line.amount]), [[2000, 40], [3000, 60]])

  const requesterCannotApprove = actorFromUser(state, 'user-gm')!
  const duplicateRequest = applyCommand(state, requesterCannotApprove, {
    action: 'requestTripCostAllocation',
    input: { tripId: trip.id },
  }, clock)
  assert.equal(duplicateRequest.ok, false)
  const selfApproval = applyCommand(state, requesterCannotApprove, {
    action: 'decideTripCostAllocation',
    input: { id: request.id, decision: 'APPROVED' },
  }, clock)
  assert.equal(selfApproval.ok, false)
  const operationsActor = actorFromUser(state, 'user-ops')!
  const denied = applyCommand(state, operationsActor, {
    action: 'decideTripCostAllocation',
    input: { id: request.id, decision: 'APPROVED' },
  }, clock)
  assert.equal(denied.ok, false)
  if (!denied.ok) assert.match(denied.error, /صلاحية/)

  const accountant = actorFromUser(state, 'user-acc')!
  const missingRejectionReason = applyCommand(state, accountant, {
    action: 'decideTripCostAllocation',
    input: { id: request.id, decision: 'REJECTED' },
  }, clock)
  assert.equal(missingRejectionReason.ok, false)
  if (!missingRejectionReason.ok) assert.match(missingRejectionReason.error, /سبب رفض/)
  const approved = applyCommand(state, accountant, {
    action: 'decideTripCostAllocation',
    input: { id: request.id, decision: 'APPROVED' },
  }, clock)
  if (!approved.ok) throw new Error(approved.error)
  assert.equal(approved.ok, true)
  state = approved.state

  const lots = [...state.lots].sort((a, b) => a.actualOutputKg - b.actualOutputKg)
  assert.equal(lots[0]!.costLines.find((line) => line.type === 'TRANSPORT')?.amount, 40)
  assert.equal(lots[1]!.costLines.find((line) => line.type === 'TRANSPORT')?.amount, 60)
  assert.equal(trialBalance(state).balanced, true)
  const repeated = applyCommand(state, accountant, {
    action: 'decideTripCostAllocation',
    input: { id: request.id, decision: 'APPROVED' },
  }, clock)
  assert.equal(repeated.ok, false)

  state = must(state, clock, { action: 'recalculateLotCosts', input: { month: '2026-09' } })
  const afterClose = [...state.lots].sort((a, b) => a.actualOutputKg - b.actualOutputKg)
  assert.equal(afterClose[0]!.costLines.find((line) => line.type === 'TRANSPORT')?.amount, 40)
  assert.equal(afterClose[1]!.costLines.find((line) => line.type === 'TRANSPORT')?.amount, 60)
  assert.equal(trialBalance(state).balanced, true)
})

test('approved customer delivery cost is charged only to that invoice and excluded from remaining stock value', () => {
  const clock = createClock('2026-09-15T04:00:00.000Z')
  let { state } = base(clock)
  state = must(state, clock, { action: 'createCustomer', input: { nameAr: 'عميل أ' } })
  state = must(state, clock, { action: 'createCustomer', input: { nameAr: 'عميل ب' } })
  const [customerA, customerB] = state.customers
  assert.ok(customerA && customerB)
  state = completeLot(state, clock, 2000, 2000)
  const lot = state.lots[0]!
  const baseCost = lot.totalCost
  state = must(state, clock, { action: 'createInvoice', input: { customerId: customerA.id, lines: [{ productId: state.products[0]!.id, qty: 400 }] } })
  const invoiceA = state.invoices[0]!
  state = must(state, clock, { action: 'confirmInvoice', input: { id: invoiceA.id } })
  state = must(state, clock, { action: 'createInvoice', input: { customerId: customerB.id, lines: [{ productId: state.products[0]!.id, qty: 600 }] } })
  const invoiceB = state.invoices[0]!
  state = must(state, clock, { action: 'confirmInvoice', input: { id: invoiceB.id } })
  state = must(state, clock, { action: 'createVehicle', input: { code: 'V-CUSTOMER', plateNo: 'CUS-1', type: 'TRUCK', nameAr: 'شاحنة' } })
  state = must(state, clock, { action: 'createTrip', input: { vehicleId: state.vehicles[0]!.id, driverId: state.employees[0]!.id, date: '2026-09-15', destination: 'عميل أ', km: 20, loadKg: 400, fuelLiters: 0, invoiceId: invoiceA.id, driverCost: 40 } })
  state = must(state, clock, { action: 'requestTripCostAllocation', input: { tripId: state.trips[0]!.id } })
  const request = state.tripCostAllocations[0]!
  const accountant = actorFromUser(state, 'user-acc')!
  const approved = applyCommand(state, accountant, {
    action: 'decideTripCostAllocation',
    input: { id: request.id, decision: 'APPROVED' },
  }, clock)
  if (!approved.ok) throw new Error(approved.error)
  state = approved.state

  const actualLot = state.lots.find((item) => item.lotNo === lot.lotNo)!
  assert.equal(actualLot.totalCost, baseCost + 40)
  assert.equal(state.balances.find((row) => row.batchNo === lot.lotNo)?.unitCost, Math.round((baseCost / 2000 + Number.EPSILON) * 1000) / 1000)
  const byCustomer = profitabilityReport(state, 'CUSTOMER')
  const rowA = byCustomer.find((row) => row.label === customerA.nameAr)!
  const rowB = byCustomer.find((row) => row.label === customerB.nameAr)!
  assert.equal(rowA.cost, Math.round((baseCost * 0.2 + 40 + Number.EPSILON) * 1000) / 1000)
  assert.equal(rowB.cost, Math.round((baseCost * 0.3 + Number.EPSILON) * 1000) / 1000)
  assert.equal(trialBalance(state).balanced, true)
})

test('profitability report shows margin per customer at their own price', () => {
  const clock = createClock('2026-09-15T04:00:00.000Z')
  let { state } = base(clock)
  state = must(state, clock, { action: 'createCustomer', input: { nameAr: 'عميل أ' } })
  state = must(state, clock, { action: 'createCustomer', input: { nameAr: 'عميل ب' } })
  const customerA = state.customers.find((item) => item.nameAr === 'عميل أ')!
  const customerB = state.customers.find((item) => item.nameAr === 'عميل ب')!
  state = completeLot(state, clock, 1000, 1000)

  state = must(state, clock, { action: 'createInvoice', input: { customerId: customerA.id, lines: [{ productId: state.products[0]!.id, qty: 500, unitPrice: 0.6 }] } })
  state = must(state, clock, { action: 'confirmInvoice', input: { id: state.invoices[0]!.id } })
  state = must(state, clock, { action: 'createInvoice', input: { customerId: customerB.id, lines: [{ productId: state.products[0]!.id, qty: 500, unitPrice: 0.4 }] } })
  state = must(state, clock, { action: 'confirmInvoice', input: { id: state.invoices[0]!.id } })

  const rows = profitabilityReport(state, 'CUSTOMER')
  const rowA = rows.find((row) => row.label === 'عميل أ')!
  const rowB = rows.find((row) => row.label === 'عميل ب')!
  assert.equal(rowA.avgSalePricePerTon, 600)
  assert.equal(rowB.avgSalePricePerTon, 400)
  assert.ok(rowA.marginValue > rowB.marginValue)
  assert.ok(rowA.marginPct != null && rowA.marginPct > 0)
})

test('profitability by product groups lots and reports cost per ton', () => {
  const clock = createClock('2026-09-15T04:00:00.000Z')
  let { state } = base(clock)
  state = completeLot(state, clock, 1000, 1000)
  state = completeLot(state, clock, 2000, 2000)
  const rows = profitabilityReport(state, 'PRODUCT')
  assert.equal(rows.length, 1)
  assert.equal(rows[0]!.lots, 2)
  assert.equal(rows[0]!.outputKg, 3000)
  assert.equal(rows[0]!.costPerTon, 50)
})

test('v4 lots gain a cost basis on migration and keep their totals', () => {
  const baseState = emptyState('mig')
  const lot: ProductionLot = {
    id: 'lot-1',
    lotNo: 'LOT-1',
    productionOrderId: 'ord-1',
    productId: 'prd',
    operatorId: null,
    manufacturedAt: '2026-01-01T00:00:00.000Z',
    inputKg: 1000,
    expectedOutputKg: 1000,
    actualOutputKg: 1000,
    wasteKg: 0,
    varianceKg: 0,
    variancePct: 0,
    materials: [],
    costLines: [
      { type: 'RAW_MATERIAL', amount: 40 },
      { type: 'ELECTRICITY', amount: 4 },
    ],
    totalCost: 44,
    costPerTon: 44,
    deliveries: [],
    qcStatus: 'UNTESTED',
  }
  const v4 = { ...baseState, schemaVersion: 4 as const, lots: [lot] }
  const migrated = migrateErpState(v4 as unknown as ErpState)
  assert.equal(migrated.schemaVersion, 8)
  assert.equal(migrated.lots[0]!.costLines[0]!.basis, 'ACTUAL')
  assert.equal(migrated.lots[0]!.costLines[1]!.basis, 'ESTIMATED')
  assert.equal(migrated.lots[0]!.totalCost, 44)
})
