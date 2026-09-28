import assert from 'node:assert/strict'
import { test } from 'node:test'

import { lotEconomics } from './costing'
import { actorFromUser, applyCommand } from './engine'
import { trialBalance } from './reports'
import { createClock, emptyState } from './seed'
import type { Actor, Command, ErpState } from './types'

function who(state: ErpState, id: string): Actor {
  const found = actorFromUser(state, id)
  assert.ok(found)
  return found
}

function must(state: ErpState, clock: ReturnType<typeof createClock>, command: Command, id = 'user-gm') {
  const result = applyCommand(state, who(state, id), command, clock)
  if (!result.ok) throw new Error(`${command.action}: ${result.error}`)
  return result.state
}

function prepare(threshold?: number) {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = emptyState('approve')
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-A', nameAr: 'ذرة', category: 'حبوب', minQty: 1, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createProduct', input: { code: 'FG-A', nameAr: 'علف', salePrice: 0.5, vatTreatment: 'ZERO', bagKg: 50 } })
  state = must(state, clock, { action: 'createSupplier', input: { nameAr: 'مورد' } })
  state = must(state, clock, { action: 'createCustomer', input: { nameAr: 'عميل' } })
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'مشغّل', department: 'الإنتاج', jobTitle: 'مشغّل', basicSalary: 300 } })
  state = must(state, clock, {
    action: 'updateCompany',
    input: { bagUnitCost: 0.1, costRates: { ELECTRICITY: 4, GAS: 3 }, ...(threshold != null ? { costApprovalThreshold: threshold } : {}) },
  })
  const material = state.materials[0]!
  const product = state.products[0]!
  const supplier = state.suppliers[0]!
  const customer = state.customers[0]!
  const operator = state.employees[0]!
  state = must(state, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId: supplier.id, lines: [{ materialId: material.id, qty: 1000, unitCost: 0.05 }] },
  })
  const poId = state.purchaseOrders[0]!.id
  state = must(state, clock, { action: 'decidePurchaseOrder', input: { id: poId, decision: 'APPROVED' } })
  state = must(state, clock, {
    action: 'receiveGoods',
    input: { purchaseOrderId: poId, lines: [{ materialId: material.id, qty: 1000, batchNo: 'B-A' }] },
  })
  state = must(state, clock, {
    action: 'transferStock',
    input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: material.id, batchNo: 'B-A', qty: 1000 }] },
  })
  state = must(state, clock, {
    action: 'createRecipe',
    input: { productId: product.id, nameAr: 'وصفة', baseOutputQty: 1000, items: [{ materialId: material.id, qty: 1000 }] },
  })
  state = must(state, clock, { action: 'createProductionOrder', input: { productId: product.id, recipeId: state.recipes[0]!.id, plannedQty: 1000 } })
  return { state, clock, material, product, customer, operator }
}

test('pending line is excluded from totals and journals until approval updates the margin', () => {
  const ready = prepare()
  let { state } = ready
  const { clock, material, product, customer, operator } = ready
  state = must(state, clock, {
    action: 'completeProduction',
    input: {
      productionOrderId: state.productionOrders[0]!.id,
      operatorId: operator.id,
      actualOutputQty: 1000,
      actuals: [{ materialId: material.id, actualQty: 1000 }],
      costLines: [{ type: 'GAS', amount: 7 }],
    },
  })
  const lot = state.lots[0]!
  assert.equal(lot.pendingCostLines?.[0]?.amount, 7)
  assert.equal(lot.pendingCostLines?.[0]?.status, 'PENDING_APPROVAL')
  assert.equal(lot.costLines.some((line) => line.type === 'GAS'), false)
  assert.equal(lot.totalCost, 56)
  assert.equal(lot.costPerTon, 56)
  assert.equal(state.journals.some((entry) => entry.lines.some((line) => line.accountCode === '2600' && line.credit === 7)), false)
  assert.equal(trialBalance(state).balanced, true)
  const denied = applyCommand(state, who(state, 'user-ops'), { action: 'decideProductionCost', input: { lotId: lot.id, lineId: lot.pendingCostLines![0]!.id, decision: 'APPROVED' } }, clock)
  assert.equal(denied.ok, false)
  state = must(state, clock, { action: 'createInvoice', input: { customerId: customer.id, lines: [{ productId: product.id, qty: 100, unitPrice: 0.2 }] } })
  state = must(state, clock, { action: 'confirmInvoice', input: { id: state.invoices[0]!.id } })
  const sold = state.lots[0]!
  assert.equal(sold.marginPerTon, 144)
  assert.equal(lotEconomics(sold).provisionalMarginPerTon, 137)
  state = must(state, clock, { action: 'decideProductionCost', input: { lotId: sold.id, lineId: sold.pendingCostLines![0]!.id, decision: 'APPROVED' } }, 'user-acc')
  const approved = state.lots[0]!
  assert.equal(approved.pendingCostLines?.length ?? 0, 0)
  assert.equal(approved.costLines.find((line) => line.type === 'GAS')?.amount, 7)
  assert.equal(approved.totalCost, 63)
  assert.equal(approved.marginPerTon, 137)
  assert.ok(state.journals.some((entry) => entry.memo.includes('اعتماد') && entry.lines.some((line) => line.accountCode === '2600' && line.credit === 7)))
  assert.equal(trialBalance(state).balanced, true)
  assert.ok(state.auditLogs.some((entry) => entry.action === 'اعتماد تكلفة إنتاج'))
})

test('rejection removes the manual line and the threshold decides what waits', () => {
  const ready = prepare(5)
  let { state } = ready
  const { clock, material, operator } = ready
  state = must(state, clock, {
    action: 'completeProduction',
    input: {
      productionOrderId: state.productionOrders[0]!.id,
      operatorId: operator.id,
      actualOutputQty: 1000,
      actuals: [{ materialId: material.id, actualQty: 1000 }],
      costLines: [
        { type: 'GAS', amount: 5 },
        { type: 'LABOR', amount: 6 },
      ],
    },
  })
  const lot = state.lots[0]!
  assert.equal(lot.costLines.find((line) => line.type === 'GAS')?.amount, 5)
  assert.equal(lot.pendingCostLines?.length, 1)
  assert.equal(lot.pendingCostLines?.[0]?.type, 'LABOR')
  const before = lot.totalCost
  state = must(state, clock, { action: 'decideProductionCost', input: { lotId: lot.id, lineId: lot.pendingCostLines![0]!.id, decision: 'REJECTED' } })
  const rejected = state.lots[0]!
  assert.equal(rejected.pendingCostLines?.length ?? 0, 0)
  assert.equal(rejected.costLines.some((line) => line.type === 'LABOR'), false)
  assert.equal(rejected.totalCost, before)
  assert.ok(state.auditLogs.some((entry) => entry.action === 'رفض تكلفة إنتاج'))
  assert.equal(trialBalance(state).balanced, true)
})

test('rejecting a manual line falls back to the per-ton rate', () => {
  const ready = prepare()
  let { state } = ready
  const { clock, material, operator } = ready
  state = must(state, clock, {
    action: 'completeProduction',
    input: {
      productionOrderId: state.productionOrders[0]!.id,
      operatorId: operator.id,
      actualOutputQty: 1000,
      actuals: [{ materialId: material.id, actualQty: 1000 }],
      costLines: [{ type: 'GAS', amount: 7 }],
    },
  })
  const lot = state.lots[0]!
  state = must(state, clock, { action: 'decideProductionCost', input: { lotId: lot.id, lineId: lot.pendingCostLines![0]!.id, decision: 'REJECTED' } })
  const rejected = state.lots[0]!
  assert.equal(rejected.costLines.find((line) => line.type === 'GAS')?.amount, 3)
  assert.equal(rejected.totalCost, 59)
  assert.equal(trialBalance(state).balanced, true)
})
