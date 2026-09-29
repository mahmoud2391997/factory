import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, applyCommand } from './engine'
import { materialPriceAnalysis } from './reports'
import { createClock, emptyState } from './seed'
import type { Actor, Command, ErpState } from './types'

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

function receive(
  state: ErpState,
  clock: ReturnType<typeof createClock>,
  materialId: string,
  supplierId: string,
  qty: number,
  unitCost: number,
  batchNo: string,
) {
  state = must(state, clock, { action: 'createPurchaseOrder', input: { supplierId, lines: [{ materialId, qty, unitCost }] } })
  const poId = state.purchaseOrders[0]!.id
  state = must(state, clock, { action: 'decidePurchaseOrder', input: { id: poId, decision: 'APPROVED' } })
  state = must(state, clock, { action: 'receiveGoods', input: { purchaseOrderId: poId, lines: [{ materialId, qty, batchNo }] } })
  return state
}

test('material price analysis averages, ranges, uses, transport and landed cost by month', () => {
  const clock = createClock('2026-09-05T04:00:00.000Z')
  let state = emptyState('material-price')
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-P', nameAr: 'ذرة', category: 'حبوب', minQty: 1, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createSupplier', input: { nameAr: 'مورد أ' } })
  state = must(state, clock, { action: 'createSupplier', input: { nameAr: 'مورد ب' } })
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'مشغّل', department: 'الإنتاج', jobTitle: 'مشغّل', basicSalary: 300 } })
  const material = state.materials[0]!
  const supplierA = state.suppliers.find((supplier) => supplier.nameAr === 'مورد أ')!
  const supplierB = state.suppliers.find((supplier) => supplier.nameAr === 'مورد ب')!

  // September: 1000 kg at 0.050 from supplier A.
  state = receive(state, clock, material.id, supplierA.id, 1000, 0.05, 'B-SEP')

  // October: 500 kg at 0.080 from supplier B.
  clock.advance(24 * 35)
  state = receive(state, clock, material.id, supplierB.id, 500, 0.08, 'B-OCT')

  // A trip in October carries 6.000 OMR of freight (0.3/L default * 20 L).
  state = must(state, clock, { action: 'createVehicle', input: { code: 'V1', plateNo: '12345', type: 'TRUCK', nameAr: 'شاحنة' } })
  state = must(state, clock, {
    action: 'createTrip',
    input: { vehicleId: state.vehicles[0]!.id, driverId: state.employees[0]?.id ?? 'user-gm', date: '2026-10-20', destination: 'ميناء', km: 120, loadKg: 500, fuelLiters: 20 },
  })

  // Consume the September batch in production.
  state = must(state, clock, { action: 'createProduct', input: { code: 'FG-P', nameAr: 'علف', salePrice: 0.5, vatTreatment: 'ZERO', bagKg: 50 } })
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'مشغّل', department: 'الإنتاج', jobTitle: 'مشغّل', basicSalary: 300 } })
  state = must(state, clock, { action: 'transferStock', input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: material.id, batchNo: 'B-SEP', qty: 1000 }] } })
  state = must(state, clock, { action: 'createRecipe', input: { productId: state.products[0]!.id, nameAr: 'وصفة', baseOutputQty: 1000, items: [{ materialId: material.id, qty: 1000 }] } })
  state = must(state, clock, { action: 'createProductionOrder', input: { productId: state.products[0]!.id, recipeId: state.recipes[0]!.id, plannedQty: 1000 } })
  state = must(state, clock, {
    action: 'completeProduction',
    input: { productionOrderId: state.productionOrders[0]!.id, operatorId: state.employees[0]!.id, actualOutputQty: 1000, actuals: [{ materialId: material.id, actualQty: 1000 }] },
  })

  const [row] = materialPriceAnalysis(state, material.id)
  assert.ok(row)
  assert.equal(row.purchasedQty, 1500)
  assert.equal(row.purchasedValue, 90) // 1000*0.05 + 500*0.08
  assert.equal(row.avgPrice, 0.06)
  assert.equal(row.minPrice, 0.05)
  assert.equal(row.maxPrice, 0.08)
  assert.equal(row.currentPrice, 0.08)
  assert.equal(row.usedQty, 1000)
  // Freight is allocated to October (the only month with a trip).
  assert.equal(row.transportCost, 6)
  // Landed = (90 + 6) / 1500.
  assert.equal(row.landedUnitCost, 0.064)
  assert.equal(row.suppliers.length, 2)
  assert.equal(row.suppliers[0]!.nameAr, 'مورد أ')

  const sep = row.months.find((month) => month.month === '2026-09')
  const oct = row.months.find((month) => month.month === '2026-10')
  assert.ok(sep && oct)
  assert.equal(sep.purchasedQty, 1000)
  assert.equal(sep.avgPrice, 0.05)
  // Production ran in October (after the clock advanced), so consumption lands there.
  assert.equal(sep.usedQty, 0)
  assert.equal(oct.purchasedQty, 500)
  assert.equal(oct.avgPrice, 0.08)
  assert.equal(oct.usedQty, 1000)
  assert.equal(oct.transportCost, 6)
})

test('material price analysis returns a row per material and tolerates no receipts', () => {
  const clock = createClock('2026-09-05T04:00:00.000Z')
  let state = emptyState('material-price-empty')
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-A', nameAr: 'أ', category: 'حبوب', minQty: 0 } })
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-B', nameAr: 'ب', category: 'حبوب', minQty: 0 } })
  const rows = materialPriceAnalysis(state)
  assert.equal(rows.length, 2)
  assert.equal(rows[0]!.purchasedQty, 0)
  assert.equal(rows[0]!.landedUnitCost, 0)
  assert.deepEqual(rows[0]!.months, [])
})
