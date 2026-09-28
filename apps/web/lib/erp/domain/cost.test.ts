import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, applyCommand } from './engine'
import { LEGACY_LOT_NOTE, migrateErpState } from './migrate'
import { trialBalance } from './reports'
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

test('lot cost includes bags and rates, manual lines win, and the invoice price sets the margin', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = emptyState('cost')
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-COST', nameAr: 'ذرة', category: 'حبوب', minQty: 1, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createProduct', input: { code: 'FG-COST', nameAr: 'علف', salePrice: 0.5, vatTreatment: 'ZERO', bagKg: 50 } })
  state = must(state, clock, { action: 'createSupplier', input: { nameAr: 'مورد' } })
  state = must(state, clock, { action: 'createCustomer', input: { nameAr: 'عميل' } })
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'مشغّل', department: 'الإنتاج', jobTitle: 'مشغّل', basicSalary: 300 } })
  state = must(state, clock, {
    action: 'updateCompany',
    input: { bagUnitCost: 0.1, costRates: { ELECTRICITY: 4, GAS: 99 } },
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
    input: { purchaseOrderId: poId, lines: [{ materialId: material.id, qty: 1000, batchNo: 'B-COST' }] },
  })
  state = must(state, clock, {
    action: 'transferStock',
    input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: material.id, batchNo: 'B-COST', qty: 1000 }] },
  })
  state = must(state, clock, {
    action: 'createRecipe',
    input: { productId: product.id, nameAr: 'وصفة', baseOutputQty: 1000, items: [{ materialId: material.id, qty: 1000 }] },
  })
  state = must(state, clock, { action: 'createProductionOrder', input: { productId: product.id, recipeId: state.recipes[0]!.id, plannedQty: 1000 } })
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
  assert.equal(lot.costLines.find((line) => line.type === 'RAW_MATERIAL')?.amount, 50)
  assert.equal(lot.costLines.find((line) => line.type === 'BAGS')?.amount, 2)
  assert.equal(lot.costLines.find((line) => line.type === 'ELECTRICITY')?.amount, 4)
  assert.equal(lot.costLines.find((line) => line.type === 'GAS')?.amount, 7)
  assert.equal(lot.costLines.some((line) => line.type === 'GAS' && line.amount === 99), false)
  assert.equal(lot.totalCost, 63)
  assert.equal(lot.costPerTon, 63)
  assert.ok(state.journals.some((entry) => entry.lines.some((line) => line.accountCode === '2600' && line.credit === 13)))
  assert.ok(state.journals.some((entry) => entry.lines.some((line) => line.accountCode === '1300' && line.debit === 63)))
  state = must(state, clock, {
    action: 'createInvoice',
    input: { customerId: customer.id, lines: [{ productId: product.id, qty: 100, unitPrice: 0.2 }] },
  })
  state = must(state, clock, { action: 'confirmInvoice', input: { id: state.invoices[0]!.id } })
  const sold = state.lots[0]!
  assert.equal(sold.salePricePerTon, 200)
  assert.equal(sold.marginPerTon, 137)
  assert.equal(sold.marginPct, 68.5)
  assert.equal(trialBalance(state).balanced, true)
})

test('packaging material cost replaces the company bag price', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = emptyState('bags')
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-B', nameAr: 'ذرة', category: 'حبوب', minQty: 1, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createMaterial', input: { code: 'PK-BAG', nameAr: 'كيس', category: 'تعبئة', minQty: 1, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createProduct', input: { code: 'FG-B', nameAr: 'علف', salePrice: 0.2, vatTreatment: 'ZERO', bagKg: 50 } })
  state = must(state, clock, { action: 'createSupplier', input: { nameAr: 'مورد' } })
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'مشغّل', department: 'الإنتاج', jobTitle: 'مشغّل', basicSalary: 300 } })
  const grain = state.materials.find((item) => item.code === 'RM-B')!
  const bag = state.materials.find((item) => item.code === 'PK-BAG')!
  const product = state.products[0]!
  const supplier = state.suppliers[0]!
  const operator = state.employees[0]!
  state = must(state, clock, { action: 'updateCompany', input: { bagUnitCost: 9, packagingMaterialId: bag.id } })
  for (const materialId of [grain.id, bag.id]) {
    const unitCost = materialId === bag.id ? 0.25 : 0.01
    const qty = materialId === bag.id ? 100 : 1000
    state = must(state, clock, {
      action: 'createPurchaseOrder',
      input: { supplierId: supplier.id, lines: [{ materialId, qty, unitCost }] },
    })
    const poId = state.purchaseOrders[0]!.id
    state = must(state, clock, { action: 'decidePurchaseOrder', input: { id: poId, decision: 'APPROVED' } })
    state = must(state, clock, {
      action: 'receiveGoods',
      input: { purchaseOrderId: poId, lines: [{ materialId, qty, batchNo: materialId === bag.id ? 'BAGS' : 'GRAIN', unitCost }] },
    })
  }
  state = must(state, clock, {
    action: 'transferStock',
    input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: grain.id, batchNo: 'GRAIN', qty: 1000 }] },
  })
  state = must(state, clock, {
    action: 'createRecipe',
    input: { productId: product.id, nameAr: 'وصفة', baseOutputQty: 1000, items: [{ materialId: grain.id, qty: 1000 }] },
  })
  state = must(state, clock, { action: 'createProductionOrder', input: { productId: product.id, recipeId: state.recipes[0]!.id, plannedQty: 1000 } })
  state = must(state, clock, {
    action: 'completeProduction',
    input: {
      productionOrderId: state.productionOrders[0]!.id,
      operatorId: operator.id,
      actualOutputQty: 1000,
      actuals: [{ materialId: grain.id, actualQty: 1000 }],
    },
  })
  assert.equal(state.lots[0]!.costLines.find((line) => line.type === 'BAGS')?.amount, 5)
  assert.equal(trialBalance(state).balanced, true)
})

test('legacy lots keep raw-material cost when allocation rates exist', () => {
  const base = emptyState('legacy-cost')
  const v1 = {
    ...base,
    schemaVersion: 1 as const,
    company: { ...base.company, bagUnitCost: 5, costRates: { ELECTRICITY: 80 } },
    productionOrders: [
      {
        id: 'ord-legacy',
        number: 'PR-2026-009',
        productId: 'prd',
        recipeId: 'rcp',
        plannedQty: 1000,
        status: 'COMPLETED' as const,
        expected: [],
        actualOutputQty: 1000,
        totalCost: 40,
        unitCost: 0.04,
        outputBatch: 'OLD-LOT',
        varianceReason: '',
        createdBy: 'user-gm',
        createdAt: '2026-01-01T00:00:00.000Z',
        completedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  }
  const lot = migrateErpState(v1 as unknown as ErpState).lots[0]!
  assert.equal(lot.legacy, true)
  assert.equal(lot.legacyNote, LEGACY_LOT_NOTE)
  assert.deepEqual(lot.costLines, [{ type: 'RAW_MATERIAL', amount: 40 }])
  assert.equal(lot.totalCost, 40)
})
