import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, applyCommand } from './engine'
import { migrateErpState } from './migrate'
import { varianceReport } from './reports'
import { createClock, emptyState } from './seed'
import { SCHEMA_VERSION, type Actor, type Command, type ErpState, type ProductionOrder } from './types'

function actor(state: ErpState, id = 'user-gm'): Actor {
  const found = actorFromUser(state, id)
  assert.ok(found)
  return found
}

function must(state: ErpState, clock: ReturnType<typeof createClock>, command: Command, id = 'user-gm') {
  const result = applyCommand(state, actor(state, id), command, clock)
  if (!result.ok) throw new Error(`${command.action}: ${result.error}`)
  return result.state
}

/** Build a minimal state with one material, one product, one recipe and a stocked manufacturing warehouse. */
function buildBase(clock: ReturnType<typeof createClock>, recipeOutput = 9900) {
  let state = emptyState('variance')
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-V', nameAr: 'ذرة', category: 'حبوب', minQty: 1, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createProduct', input: { code: 'FG-V', nameAr: 'علف', salePrice: 0.2, vatTreatment: 'ZERO', bagKg: 50 } })
  state = must(state, clock, { action: 'createSupplier', input: { nameAr: 'مورد' } })
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'مشغّل', department: 'الإنتاج', jobTitle: 'مشغّل خط', basicSalary: 400 } })
  const material = state.materials[0]!
  const product = state.products[0]!
  const supplier = state.suppliers[0]!
  const operator = state.employees[0]!
  state = must(state, clock, { action: 'createPurchaseOrder', input: { supplierId: supplier.id, lines: [{ materialId: material.id, qty: 10000, unitCost: 0.08 }] } })
  const poId = state.purchaseOrders[0]!.id
  state = must(state, clock, { action: 'decidePurchaseOrder', input: { id: poId, decision: 'APPROVED' } })
  state = must(state, clock, { action: 'receiveGoods', input: { purchaseOrderId: poId, lines: [{ materialId: material.id, qty: 10000, batchNo: 'B-V-1' }] } })
  state = must(state, clock, { action: 'createRecipe', input: { productId: product.id, nameAr: 'وصفة', baseOutputQty: recipeOutput, items: [{ materialId: material.id, qty: 10000 }] } })
  const recipe = state.recipes[0]!
  state = must(state, clock, { action: 'transferStock', input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: material.id, batchNo: 'B-V-1', qty: 10000 }] } })
  return { state, material, product, recipe, operator }
}

test('company threshold is the fallback when neither product nor recipe define one', () => {
  const clock = createClock('2026-05-04T04:00:00.000Z')
  const { state, product, recipe, operator, material } = buildBase(clock)
  let next = must(state, clock, { action: 'createProductionOrder', input: { productId: product.id, recipeId: recipe.id, plannedQty: 9900 } })
  const order = next.productionOrders[0]!
  // 9900 expected, produce 9650 → -2.53% (above the company 2% default → critical)
  next = must(next, clock, {
    action: 'completeProduction',
    input: { productionOrderId: order.id, operatorId: operator.id, actualOutputQty: 9650, varianceReason: 'رطوبة', actuals: [{ materialId: material.id, actualQty: 10000 }] },
  })
  assert.equal(next.productionOrders[0]!.varianceLevel, 'CRITICAL')
})

test('product threshold takes precedence over recipe and company', () => {
  const clock = createClock('2026-05-04T04:00:00.000Z')
  const { state, product, recipe, operator, material } = buildBase(clock)
  // Product allows up to 5% critical; recipe says 1%; company says 2%. -2.53% should be NORMAL.
  let next = must(state, clock, { action: 'setVarianceThresholds', input: { productId: product.id, warningPct: 3, criticalPct: 5 } })
  next = must(next, clock, { action: 'setVarianceThresholds', input: { recipeId: recipe.id, warningPct: 1, criticalPct: 1 } })
  next = must(next, clock, { action: 'createProductionOrder', input: { productId: product.id, recipeId: recipe.id, plannedQty: 9900 } })
  const order = next.productionOrders[0]!
  next = must(next, clock, {
    action: 'completeProduction',
    input: { productionOrderId: order.id, operatorId: operator.id, actualOutputQty: 9650, actuals: [{ materialId: material.id, actualQty: 10000 }] },
  })
  assert.equal(next.productionOrders[0]!.varianceLevel, 'NORMAL')
})

test('recipe threshold applies when the product has none', () => {
  const clock = createClock('2026-05-04T04:00:00.000Z')
  const { state, product, recipe, operator, material } = buildBase(clock)
  // Recipe: warning 3%, critical 5% → -2.53% is NORMAL even though company default is 2%.
  let next = must(state, clock, { action: 'setVarianceThresholds', input: { recipeId: recipe.id, warningPct: 3, criticalPct: 5 } })
  next = must(next, clock, { action: 'createProductionOrder', input: { productId: product.id, recipeId: recipe.id, plannedQty: 9900 } })
  const order = next.productionOrders[0]!
  next = must(next, clock, {
    action: 'completeProduction',
    input: { productionOrderId: order.id, operatorId: operator.id, actualOutputQty: 9650, actuals: [{ materialId: material.id, actualQty: 10000 }] },
  })
  assert.equal(next.productionOrders[0]!.varianceLevel, 'NORMAL')
})

test('warning level notifies the manager but needs no reason', () => {
  const clock = createClock('2026-05-04T04:00:00.000Z')
  const { state, product, recipe, operator, material } = buildBase(clock)
  // Warning 2%, critical 10% → -2.53% is a WARNING: flag + notification, no reason required.
  let next = must(state, clock, { action: 'setVarianceThresholds', input: { productId: product.id, warningPct: 2, criticalPct: 10 } })
  next = must(next, clock, { action: 'createProductionOrder', input: { productId: product.id, recipeId: recipe.id, plannedQty: 9900 } })
  const order = next.productionOrders[0]!
  next = must(next, clock, {
    action: 'completeProduction',
    input: { productionOrderId: order.id, operatorId: operator.id, actualOutputQty: 9650, actuals: [{ materialId: material.id, actualQty: 10000 }] },
  })
  assert.equal(next.productionOrders[0]!.varianceLevel, 'WARNING')
  const note = next.notifications.find((item) => item.dedupeKey === `varwarn:${order.id}`)
  assert.ok(note)
  assert.ok(note!.roles.includes('OPERATIONS'))
})

test('critical level requires a coded reason and a note, then alerts the owner', () => {
  const clock = createClock('2026-05-04T04:00:00.000Z')
  const { state, product, recipe, operator, material } = buildBase(clock)
  let next = must(state, clock, { action: 'setVarianceThresholds', input: { productId: product.id, warningPct: 1, criticalPct: 2 } })
  next = must(next, clock, { action: 'createProductionOrder', input: { productId: product.id, recipeId: recipe.id, plannedQty: 9900 } })
  const order = next.productionOrders[0]!
  const baseInput = { productionOrderId: order.id, operatorId: operator.id, actualOutputQty: 9650, actuals: [{ materialId: material.id, actualQty: 10000 }] }

  // No reason code configured yet → free-text reason alone is enough (legacy behaviour).
  const legacy = applyCommand(next, actor(next), { action: 'completeProduction', input: { ...baseInput, varianceReason: 'رطوبة' } }, clock)
  assert.equal(legacy.ok, true)

  // Configure reason codes → a critical lot now needs a valid code plus a note.
  let configured = must(next, clock, { action: 'updateCompany', input: { varianceReasonCodes: ['MOISTURE', 'MACHINE'] } })
  const missingCode = applyCommand(configured, actor(configured), { action: 'completeProduction', input: { ...baseInput, varianceReason: 'رطوبة' } }, clock)
  assert.equal(missingCode.ok, false)
  if (!missingCode.ok) assert.match(missingCode.error, /رمز سبب الانحراف/)

  const badCode = applyCommand(configured, actor(configured), { action: 'completeProduction', input: { ...baseInput, varianceReason: 'رطوبة', varianceReasonCode: 'NOPE' } }, clock)
  assert.equal(badCode.ok, false)

  const noNote = applyCommand(configured, actor(configured), { action: 'completeProduction', input: { ...baseInput, varianceReasonCode: 'MOISTURE' } }, clock)
  assert.equal(noNote.ok, false)
  if (!noNote.ok) assert.match(noNote.error, /ملاحظة/)

  configured = must(configured, clock, { action: 'completeProduction', input: { ...baseInput, varianceReason: 'رطوبة أعلى', varianceReasonCode: 'MOISTURE' } })
  const done = configured.productionOrders[0]!
  assert.equal(done.varianceLevel, 'CRITICAL')
  assert.equal(done.varianceReasonCode, 'MOISTURE')
  const ownerNote = configured.notifications.find((item) => item.dedupeKey === `varcrit:${order.id}`)
  assert.ok(ownerNote)
  assert.deepEqual(ownerNote!.roles, ['GM'])
})

test('v5 documents migrate to v6 without changing existing behaviour', () => {
  const clock = createClock('2026-05-04T04:00:00.000Z')
  const { state } = buildBase(clock)
  const legacyOrder: ProductionOrder = {
    id: 'ord-legacy',
    number: 'PR-OLD',
    productId: state.products[0]!.id,
    recipeId: state.recipes[0]!.id,
    plannedQty: 9900,
    status: 'COMPLETED',
    expected: [],
    actualOutputQty: 9900,
    totalCost: 0,
    unitCost: 0,
    outputBatch: 'LOT-OLD',
    varianceReason: '',
    createdBy: 'user-gm',
    createdAt: '2026-05-01T00:00:00.000Z',
  }
  const v5 = { ...state, schemaVersion: 5 as const, productionOrders: [legacyOrder] }
  const migrated = migrateErpState(v5 as unknown as ErpState)
  assert.equal(migrated.schemaVersion, SCHEMA_VERSION)
  assert.deepEqual(migrated.company.varianceReasonCodes, [])
  assert.equal(migrated.productionOrders[0]!.varianceLevel, 'NORMAL')
  // No thresholds are forced, so the company default still governs.
  assert.equal(migrated.products[0]!.varianceWarningPct, undefined)
  assert.equal(migrated.recipes[0]!.varianceCriticalPct, undefined)
})

test('variance report groups by product, shift, operator, machine and month', () => {
  const clock = createClock('2026-05-04T04:00:00.000Z')
  let { state, product, recipe, operator, material } = buildBase(clock)
  state = must(state, clock, { action: 'createMachine', input: { code: 'M1', nameAr: 'خط 1', type: 'MIXER', location: 'الصالة' } })
  const machine = state.machines[0]!
  state = must(state, clock, { action: 'createProductionOrder', input: { productId: product.id, recipeId: recipe.id, plannedQty: 9900, machineId: machine.id, shift: 'MORNING' } })
  const order = state.productionOrders[0]!
  state = must(state, clock, {
    action: 'completeProduction',
    input: { productionOrderId: order.id, operatorId: operator.id, actualOutputQty: 9650, varianceReason: 'رطوبة', actuals: [{ materialId: material.id, actualQty: 10000 }] },
  })

  const byProduct = varianceReport(state, 'PRODUCT')
  assert.equal(byProduct.length, 1)
  assert.equal(byProduct[0]!.lots, 1)
  assert.equal(byProduct[0]!.expectedKg, 9900)
  assert.equal(byProduct[0]!.actualKg, 9650)
  assert.equal(byProduct[0]!.varianceKg, -250)
  assert.equal(byProduct[0]!.variancePct, -2.53)
  assert.equal(byProduct[0]!.critical, 1)

  const byShift = varianceReport(state, 'SHIFT')
  assert.equal(byShift[0]!.key, 'MORNING')

  const byOperator = varianceReport(state, 'OPERATOR')
  assert.equal(byOperator[0]!.key, operator.id)

  const byMachine = varianceReport(state, 'MACHINE')
  assert.equal(byMachine[0]!.key, machine.id)
  assert.equal(byMachine[0]!.label, 'خط 1')

  const byMonth = varianceReport(state, 'MONTH')
  assert.equal(byMonth[0]!.key, '2026-05')
})

test('setVarianceThresholds validates bounds and target', () => {
  const clock = createClock('2026-05-04T04:00:00.000Z')
  const { state, product, recipe } = buildBase(clock)
  const both = applyCommand(state, actor(state), { action: 'setVarianceThresholds', input: { productId: product.id, recipeId: recipe.id } }, clock)
  assert.equal(both.ok, false)
  const none = applyCommand(state, actor(state), { action: 'setVarianceThresholds', input: {} }, clock)
  assert.equal(none.ok, false)
  const badRange = applyCommand(state, actor(state), { action: 'setVarianceThresholds', input: { productId: product.id, warningPct: 120 } }, clock)
  assert.equal(badRange.ok, false)
  const inverted = applyCommand(state, actor(state), { action: 'setVarianceThresholds', input: { productId: product.id, warningPct: 5, criticalPct: 2 } }, clock)
  assert.equal(inverted.ok, false)
})

test('clearing a product threshold falls back to the recipe value', () => {
  const clock = createClock('2026-05-04T04:00:00.000Z')
  const { state, product, recipe, operator, material } = buildBase(clock)
  let next = must(state, clock, { action: 'setVarianceThresholds', input: { recipeId: recipe.id, warningPct: 3, criticalPct: 5 } })
  next = must(next, clock, { action: 'setVarianceThresholds', input: { productId: product.id, warningPct: 1, criticalPct: 2 } })
  // Clear the product override → recipe (3/5) governs, so -2.53% becomes NORMAL.
  next = must(next, clock, { action: 'setVarianceThresholds', input: { productId: product.id, warningPct: null, criticalPct: null } })
  assert.equal(next.products[0]!.varianceWarningPct, undefined)
  next = must(next, clock, { action: 'createProductionOrder', input: { productId: product.id, recipeId: recipe.id, plannedQty: 9900 } })
  const order = next.productionOrders[0]!
  next = must(next, clock, {
    action: 'completeProduction',
    input: { productionOrderId: order.id, operatorId: operator.id, actualOutputQty: 9650, actuals: [{ materialId: material.id, actualQty: 10000 }] },
  })
  assert.equal(next.productionOrders[0]!.varianceLevel, 'NORMAL')
})
