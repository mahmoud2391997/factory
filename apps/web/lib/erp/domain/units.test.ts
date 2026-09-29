import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, applyCommand } from './engine'
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

/** Material + product + received stock + completed production lot of 9650 kg. */
function producedState(clock: ReturnType<typeof createClock>) {
  let state = emptyState('units')
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-U', nameAr: 'ذرة', category: 'حبوب', minQty: 1, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createProduct', input: { code: 'FG-U', nameAr: 'علف', salePrice: 0.2, vatTreatment: 'ZERO', bagKg: 50 } })
  state = must(state, clock, { action: 'createSupplier', input: { nameAr: 'مورد' } })
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'مشغّل', department: 'الإنتاج', jobTitle: 'مشغّل خط', basicSalary: 400 } })
  const material = state.materials[0]!
  const product = state.products[0]!
  state = must(state, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId: state.suppliers[0]!.id, lines: [{ materialId: material.id, qty: 10000, unitCost: 0.08 }] },
  })
  const poId = state.purchaseOrders[0]!.id
  state = must(state, clock, { action: 'decidePurchaseOrder', input: { id: poId, decision: 'APPROVED' } })
  state = must(state, clock, { action: 'receiveGoods', input: { purchaseOrderId: poId, lines: [{ materialId: material.id, qty: 10000, batchNo: 'B-U-1' }] } })
  state = must(state, clock, {
    action: 'createRecipe',
    input: { productId: product.id, nameAr: 'وصفة', baseOutputQty: 9900, items: [{ materialId: material.id, qty: 10000 }] },
  })
  state = must(state, clock, {
    action: 'transferStock',
    input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: material.id, batchNo: 'B-U-1', qty: 10000 }] },
  })
  state = must(state, clock, { action: 'createProductionOrder', input: { productId: product.id, recipeId: state.recipes[0]!.id, plannedQty: 9900 } })
  state = must(state, clock, {
    action: 'completeProduction',
    input: {
      productionOrderId: state.productionOrders[0]!.id,
      operatorId: state.employees[0]!.id,
      actualOutputQty: 9650,
      varianceReason: 'رطوبة',
      actuals: [{ materialId: material.id, actualQty: 10000, wasteQty: 20 }],
    },
  })
  return state
}

test('packaging consumption expects bags from the lot output and the product bag weight', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = producedState(clock)
  const lotNo = state.lots[0]!.lotNo
  const orderId = state.productionOrders[0]!.id

  state = must(state, clock, {
    action: 'createPackagingMaterial',
    input: { code: 'BAG-50', nameAr: 'كيس 50 كجم', category: 'BAG', quantity: 1000, unit: 'كيس', unitCost: 0.05, minStock: 100 },
  })
  const bagId = state.packagingMaterials[0]!.id

  state = must(state, clock, {
    action: 'recordPackagingConsumption',
    input: { packagingMaterialId: bagId, productionOrderId: orderId, lotNo, quantity: 200 },
  })
  const consumption = state.packagingConsumption[0]!
  // 9650 kg at 50 kg per bag = 193 bags expected, 200 issued.
  assert.equal(consumption.calculatedQty, 193)
  assert.equal(consumption.variance, 7)
  assert.equal(consumption.cost, 10)
})

test('packaging consumption honours an explicit per-ton rate', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = producedState(clock)
  const lotNo = state.lots[0]!.lotNo
  const orderId = state.productionOrders[0]!.id

  state = must(state, clock, {
    action: 'createPackagingMaterial',
    input: { code: 'INK-1', nameAr: 'حبر', category: 'INK', quantity: 150, unit: 'لتر', unitCost: 2, minStock: 5, expectedPerTon: 10 },
  })
  state = must(state, clock, {
    action: 'recordPackagingConsumption',
    input: { packagingMaterialId: state.packagingMaterials[0]!.id, productionOrderId: orderId, lotNo, quantity: 100 },
  })
  // 9.65 tons at 10 units per ton = 96.5 expected.
  assert.equal(state.packagingConsumption[0]!.calculatedQty, 96.5)
  assert.equal(state.packagingConsumption[0]!.variance, 3.5)
})

test('packaging without a definable rate expects what was issued', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = producedState(clock)
  state = must(state, clock, {
    action: 'createPackagingMaterial',
    input: { code: 'THR-1', nameAr: 'خيط', category: 'THREAD', quantity: 50, unit: 'بكرة', unitCost: 1, minStock: 5 },
  })
  state = must(state, clock, {
    action: 'recordPackagingConsumption',
    input: {
      packagingMaterialId: state.packagingMaterials[0]!.id,
      productionOrderId: state.productionOrders[0]!.id,
      lotNo: state.lots[0]!.lotNo,
      quantity: 12,
    },
  })
  assert.equal(state.packagingConsumption[0]!.calculatedQty, 12)
  assert.equal(state.packagingConsumption[0]!.variance, 0)
})

test('packaging consumption cannot overdraw stock or charge a lot to another order', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = producedState(clock)
  state = must(state, clock, {
    action: 'createPackagingMaterial',
    input: { code: 'BAG-LIMIT', nameAr: 'أكياس محدودة', category: 'BAG', quantity: 10, unit: 'كيس', unitCost: 0.1, minStock: 1 },
  })
  const result = applyCommand(state, actor(state), {
    action: 'recordPackagingConsumption',
    input: {
      packagingMaterialId: state.packagingMaterials[0]!.id,
      productionOrderId: state.productionOrders[0]!.id,
      lotNo: state.lots[0]!.lotNo,
      quantity: 11,
    },
  }, clock)
  assert.equal(result.ok, false)
  assert.equal(state.packagingMaterials[0]!.quantity, 10)
})

test('distribution closing reconciles money against money and goods against goods', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = producedState(clock)
  const productId = state.products[0]!.id
  state = must(state, clock, {
    action: 'createDistributionPoint',
    input: { code: 'DP-1', nameAr: 'نقطة مسقط', location: 'مسقط', managerId: state.employees[0]!.id, phone: '99999999' },
  })
  const pointId = state.distributionPoints[0]!.id

  // 10 tons sold at 0.2 = 2 OMR, minus the 0.2 refund on the returned ton = 1.8 expected.
  // 20 opening - 10 sold + 1 returned = 11 expected closing, counted 11.
  state = must(state, clock, {
    action: 'closeDistributionDay',
    input: {
      pointId,
      date: '2026-09-29',
      openingStock: { [productId]: 20 },
      sales: { [productId]: 10 },
      returns: { [productId]: 1 },
      closingStock: { [productId]: 11 },
      cash: 1.3,
      transfers: 0.5,
    },
  })
  const matched = state.distributionClosings[0]!
  assert.equal(matched.variance, 0)
  assert.equal(matched.stockVariance, 0)
  assert.equal(matched.status, 'RECONCILED')

  // One ton of goods missing and one rial missing: both variances surface, in their own units.
  state = must(state, clock, {
    action: 'closeDistributionDay',
    input: {
      pointId,
      date: '2026-09-28',
      openingStock: { [productId]: 20 },
      sales: { [productId]: 10 },
      returns: { [productId]: 0 },
      closingStock: { [productId]: 9 },
      cash: 1,
      transfers: 0,
    },
  })
  const off = state.distributionClosings[0]!
  assert.equal(off.variance, -1)
  assert.equal(off.stockVariance, 1)
  assert.equal(off.status, 'DISCREPANCY')
})

test('maintenance adds reported run hours, never downtime, to operating hours', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = emptyState('units-maintenance')
  state = must(state, clock, { action: 'createMachine', input: { code: 'M-1', nameAr: 'مكبس 1', type: 'PRESS', location: 'الخط 1' } })
  const machineId = state.machines[0]!.id

  state = must(state, clock, {
    action: 'recordMaintenance',
    input: {
      machineId,
      type: 'PREVENTIVE',
      startDate: '2026-09-29T08:00:00.000Z',
      endDate: '2026-09-29T09:30:00.000Z',
      description: 'تزييت وتغيير فلتر',
      cost: 20,
      sparePartsUsed: [],
      operatingMinutes: 480,
    },
  })
  const machine = state.machines[0]!
  const record = state.maintenanceRecords[0]!
  assert.equal(record.downtimeMinutes, 90)
  assert.equal(record.operatingMinutes, 480)
  assert.equal(machine.operatingHours, 8)

  const rejected = applyCommand(state, actor(state), {
    action: 'recordMaintenance',
    input: {
      machineId,
      type: 'ROUTINE',
      startDate: '2026-09-30T08:00:00.000Z',
      endDate: '2026-09-30T09:00:00.000Z',
      description: 'فحص',
      cost: 0,
      sparePartsUsed: [],
      operatingMinutes: -5,
    },
  }, clock)
  assert.equal(rejected.ok, false)
})

test('spare part usage requires a compatible machine and reason before deducting stock', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = emptyState('spare-part-issue')
  state = must(state, clock, { action: 'createMachine', input: { code: 'M-1', nameAr: 'مكبس', type: 'PRESS', location: 'الخط 1' } })
  const machineId = state.machines[0]!.id
  state = must(state, clock, { action: 'createSparePart', input: { code: 'SP-1', nameAr: 'سير', quantity: 2, unitCost: 5, minStock: 1, machineIds: [machineId] } })
  const sparePartId = state.spareParts[0]!.id

  const missingReason = applyCommand(state, actor(state), {
    action: 'recordSparePartUsage',
    input: { sparePartId, machineId, quantity: 1, reason: '  ' },
  }, clock)
  assert.equal(missingReason.ok, false)
  assert.equal(state.spareParts[0]!.quantity, 2)

  state = must(state, clock, { action: 'recordSparePartUsage', input: { sparePartId, machineId, quantity: 1, reason: 'استبدال سير' } })
  assert.equal(state.spareParts[0]!.quantity, 1)
  assert.equal(state.sparePartUsages[0]!.cost, 5)
})

test('maintenance validates spare inventory and derives its cost from current unit cost', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = emptyState('maintenance-parts')
  state = must(state, clock, { action: 'createMachine', input: { code: 'M-1', nameAr: 'مكبس', type: 'PRESS', location: 'الخط 1' } })
  const machineId = state.machines[0]!.id
  state = must(state, clock, { action: 'createSparePart', input: { code: 'SP-1', nameAr: 'فلتر', quantity: 1, unitCost: 7, minStock: 0 } })
  const sparePartId = state.spareParts[0]!.id
  const command: Command = {
    action: 'recordMaintenance',
    input: {
      machineId, type: 'PREVENTIVE', startDate: '2026-09-29', endDate: '2026-09-29', description: 'استبدال الفلتر',
      cost: 10, sparePartsUsed: [{ sparePartId, quantity: 2, cost: 0 }],
    },
  }
  const rejected = applyCommand(state, actor(state), command, clock)
  assert.equal(rejected.ok, false)
  assert.equal(state.spareParts[0]!.quantity, 1)
  state = must(state, clock, { ...command, input: { ...command.input, sparePartsUsed: [{ sparePartId, quantity: 1, cost: 0 }] } })
  assert.equal(state.maintenanceRecords[0]!.cost, 17)
  assert.equal(state.maintenanceRecords[0]!.sparePartsUsed[0]!.cost, 7)
  assert.equal(state.spareParts[0]!.quantity, 0)
})
