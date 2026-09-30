import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, applyCommand, publicState } from './engine'
import { money } from './money'
import { factoryStatus, muscatDay, traceCustomer, traceLot, trialBalance } from './reports'
import { buildSeedState, createClock } from './seed'
import type { Command, ErpState } from './types'

function must(state: ErpState, clock: ReturnType<typeof createClock>, command: Command, id = 'user-gm') {
  const actor = actorFromUser(state, id)
  assert.ok(actor)
  const result = applyCommand(state, actor, command, clock)
  if (!result.ok) throw new Error(`${command.action}: ${result.error}`)
  return result.state
}

test('seeded mill: quality, lot, invoice, traces, journals, and dashboard agree', () => {
  const clock = createClock()
  let state = buildSeedState('e2e')
  const beforeJournals = state.journals.length
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-E2E', nameAr: 'ذرة التحقق', category: 'حبوب', minQty: 1, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createProduct', input: { code: 'FG-E2E', nameAr: 'علف التحقق', salePrice: 0.3, vatTreatment: 'ZERO', bagKg: 50 } })
  state = must(state, clock, { action: 'createSupplier', input: { nameAr: 'مورد التحقق' } })
  state = must(state, clock, { action: 'createCustomer', input: { nameAr: 'عميل التحقق' } })
  const material = state.materials.find((item) => item.code === 'RM-E2E')!
  const product = state.products.find((item) => item.code === 'FG-E2E')!
  const supplier = state.suppliers.find((item) => item.nameAr === 'مورد التحقق')!
  const customer = state.customers.find((item) => item.nameAr === 'عميل التحقق')!
  const operator = state.employees.find((item) => item.jobTitle.includes('مشغ'))!
  state = must(state, clock, { action: 'setQcLimits', input: { itemType: 'MATERIAL', itemId: material.id, limits: { maxMoisture: 14 } } })
  state = must(state, clock, { action: 'setQcLimits', input: { itemType: 'PRODUCT', itemId: product.id, limits: { maxMoisture: 13 } } })
  state = must(state, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId: supplier.id, lines: [{ materialId: material.id, qty: 1000, unitCost: 0.04 }] },
  })
  const poId = state.purchaseOrders.find((item) => item.lines.some((line) => line.materialId === material.id))!.id
  state = must(state, clock, { action: 'decidePurchaseOrder', input: { id: poId, decision: 'APPROVED' } })
  state = must(state, clock, {
    action: 'receiveGoods',
    input: { purchaseOrderId: poId, lines: [{ materialId: material.id, qty: 1000, batchNo: 'B-E2E' }] },
  })
  state = must(
    state,
    clock,
    { action: 'createQualitySample', input: { type: 'RAW_MATERIAL', materialId: material.id, batchNo: 'B-E2E', supplierId: supplier.id, moisturePct: 11 } },
    'user-qc',
  )
  assert.equal(state.qualitySamples.find((sample) => sample.batchNo === 'B-E2E')?.result, 'PASSED')
  state = must(state, clock, {
    action: 'transferStock',
    input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: material.id, batchNo: 'B-E2E', qty: 1000 }] },
  })
  state = must(state, clock, {
    action: 'createRecipe',
    input: { productId: product.id, nameAr: 'وصفة التحقق', baseOutputQty: 1000, items: [{ materialId: material.id, qty: 1000 }] },
  })
  state = must(state, clock, { action: 'createProductionOrder', input: { productId: product.id, recipeId: state.recipes[0]!.id, plannedQty: 1000 } })
  const order = state.productionOrders.find((item) => item.productId === product.id)!
  state.scaleReadings.unshift({
    id: 'legacy-scale-reading',
    materialId: material.id,
    productionOrderId: order.id,
    expectedQty: 1000,
    actualQty: 990,
    variance: -10,
    timestamp: '2025-01-01T00:00:00.000Z',
    operatorId: 'user-production',
    scaleId: 'MANUAL',
  })
  state = must(state, clock, {
    action: 'recordScaleReading',
    input: { eventId: 'hopper-1-000042', materialId: material.id, productionOrderId: order.id, actualQty: 995, scaleId: 'hopper-1' },
  }, 'user-production')
  assert.equal(state.scaleReadings[0]?.expectedQty, 1000)
  assert.equal(publicState(state, []).scaleReadings.length, 0)
  assert.equal(publicState(state, state.rolePermissions.PRODUCTION).scaleReadings.length, 2)
  state = must(state, clock, {
    action: 'recordScaleReading',
    input: { eventId: 'hopper-1-000042', materialId: material.id, productionOrderId: order.id, actualQty: 995, scaleId: 'hopper-1' },
  }, 'user-production')
  assert.equal(state.scaleReadings.length, 2)
  const productionActor = actorFromUser(state, 'user-production')
  assert.ok(productionActor)
  const reusedEvent = applyCommand(state, productionActor, {
    action: 'recordScaleReading',
    input: { eventId: 'hopper-1-000042', materialId: material.id, productionOrderId: order.id, actualQty: 990, scaleId: 'hopper-1' },
  }, clock)
  assert.equal(reusedEvent.ok, false)
  state = must(state, clock, {
    action: 'completeProduction',
    input: {
      productionOrderId: order.id,
      operatorId: operator.id,
      actualOutputQty: 995,
      actuals: [{ materialId: material.id, actualQty: 1000 }],
      costLines: [{ type: 'GAS', amount: 8 }],
    },
  })
  let lot = state.lots.find((item) => item.productId === product.id)!
  assert.equal(state.productionOrders.find((item) => item.id === order.id)?.expected[0]?.actualQty, 995)
  assert.equal(lot.materials[0]?.qty, 995)
  assert.equal(lot.operatorId, operator.id)
  assert.equal(lot.pendingCostLines?.[0]?.amount, 8)
  assert.equal(lot.costLines.some((line) => line.type === 'GAS'), false)
  state = must(state, clock, { action: 'decideProductionCost', input: { lotId: lot.id, lineId: lot.pendingCostLines![0]!.id, decision: 'APPROVED' } }, 'user-acc')
  lot = state.lots.find((item) => item.id === lot.id)!
  assert.equal(lot.costLines.find((line) => line.type === 'GAS')?.amount, 8)
  state = must(
    state,
    clock,
    { action: 'createQualitySample', input: { type: 'FINISHED_PRODUCT', lotNo: lot.lotNo, moisturePct: 10 } },
    'user-qc',
  )
  lot = state.lots.find((item) => item.id === lot.id)!
  assert.equal(lot.qcStatus, 'PASSED')
  state = must(state, clock, { action: 'createInvoice', input: { customerId: customer.id, lines: [{ productId: product.id, qty: 100, unitPrice: 0.25 }] } })
  const invoice = state.invoices.find((item) => item.customerId === customer.id)!
  state = must(state, clock, { action: 'confirmInvoice', input: { id: invoice.id } })
  lot = state.lots.find((item) => item.id === lot.id)!
  const traced = traceLot(state, lot.lotNo)
  const customers = traceCustomer(state, customer.id)
  assert.ok(traced)
  assert.equal(traced.operatorName, operator.nameAr)
  assert.equal(traced.rawBatches[0]?.sourceBatchNo, 'B-E2E')
  assert.equal(traced.rawBatches[0]?.supplierName, 'مورد التحقق')
  assert.ok(traced.customers.some((item) => item.id === customer.id))
  assert.ok(customers.lots.some((item) => item.lotNo === lot.lotNo))
  assert.equal(lot.salePricePerTon, 250)
  assert.equal(trialBalance(state).balanced, true)
  assert.ok(state.journals.length > beforeJournals)

  const status = factoryStatus(state, new Date().toISOString())
  const monthPayments = state.payments.filter((payment) => {
    const day = muscatDay(payment.at)
    return day.slice(0, 7) === status.month && day <= status.day
  })
  assert.equal(status.collections.month, money(monthPayments.reduce((sum, payment) => sum + payment.amount, 0)))
  const monthLots = state.lots.filter((item) => {
    const day = muscatDay(item.manufacturedAt)
    return day.slice(0, 7) === status.month && day <= status.day
  })
  const monthCost = money(monthLots.reduce((sum, item) => sum + item.totalCost, 0))
  const monthKg = monthLots.reduce((sum, item) => sum + item.actualOutputKg, 0)
  assert.equal(status.cost.avgCostPerTon, monthKg > 0 ? money((monthCost / monthKg) * 1000) : 0)
  const lowest = [...state.lots].filter((item) => item.marginPerTon != null).sort((a, b) => (a.marginPerTon ?? 0) - (b.marginPerTon ?? 0))[0]
  assert.equal(status.lowestMarginLots[0]?.lotNo, lowest?.lotNo)

  state = must(state, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId: supplier.id, lines: [{ materialId: material.id, qty: 200, unitCost: 0.04 }] },
  })
  const badPo = state.purchaseOrders.find((item) => item.status === 'PENDING_APPROVAL' && item.lines.some((line) => line.materialId === material.id))!
  state = must(state, clock, { action: 'decidePurchaseOrder', input: { id: badPo.id, decision: 'APPROVED' } })
  state = must(state, clock, {
    action: 'receiveGoods',
    input: { purchaseOrderId: badPo.id, lines: [{ materialId: material.id, qty: 200, batchNo: 'B-E2E-BAD' }] },
  })
  state = must(
    state,
    clock,
    { action: 'createQualitySample', input: { type: 'RAW_MATERIAL', materialId: material.id, batchNo: 'B-E2E-BAD', supplierId: supplier.id, moisturePct: 20 } },
    'user-qc',
  )
  const actor = actorFromUser(state, 'user-gm')
  assert.ok(actor)
  const blockedTransfer = applyCommand(
    state,
    actor,
    { action: 'transferStock', input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: material.id, batchNo: 'B-E2E-BAD', qty: 50 }] } },
    clock,
  )
  assert.equal(blockedTransfer.ok, false)
  if (!blockedTransfer.ok) assert.match(blockedTransfer.error, /مرفوضة/)

  const heldSample = state.qualitySamples.find((sample) => sample.lotNo === lot.lotNo)!
  state = must(state, clock, { action: 'updateQualityResult', input: { sampleId: heldSample.id, result: 'HOLD', reason: 'إعادة فحص' } })
  state = must(state, clock, { action: 'createInvoice', input: { customerId: customer.id, lines: [{ productId: product.id, qty: 10, unitPrice: 0.25 }] } })
  const blockedInvoice = state.invoices.find((item) => item.status === 'DRAFT' && item.customerId === customer.id)!
  const blockedSale = applyCommand(state, actor, { action: 'confirmInvoice', input: { id: blockedInvoice.id } }, clock)
  assert.equal(blockedSale.ok, false)
  if (!blockedSale.ok) assert.match(blockedSale.error, /معلّقة/)
  state = must(state, clock, { action: 'updateQualityResult', input: { sampleId: heldSample.id, result: 'PASSED', reason: 'اكتمل الفحص' } })
  state = must(state, clock, { action: 'confirmInvoice', input: { id: blockedInvoice.id } })
  assert.equal(trialBalance(state).balanced, true)
  assert.ok(traceLot(state, lot.lotNo)?.deliveries.some((delivery) => delivery.qty === 10))
})
