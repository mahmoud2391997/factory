import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, applyCommand } from './engine'
import { LEGACY_LOT_NOTE, migrateErpState } from './migrate'
import { lotQcBlock } from './qc'
import { operatorLabel, traceCustomer, traceLot, traceSupplierBatch, UNKNOWN_OPERATOR, trialBalance } from './reports'
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

test('completing production creates a lot linked to the source batch, supplier, operator, and customer', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = emptyState('lots')
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-LOT', nameAr: 'ذرة التتبع', category: 'حبوب', minQty: 1, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createProduct', input: { code: 'FG-LOT', nameAr: 'علف التتبع', salePrice: 0.2, vatTreatment: 'ZERO', bagKg: 50 } })
  state = must(state, clock, { action: 'createSupplier', input: { nameAr: 'مورد الدفعة' } })
  state = must(state, clock, { action: 'createCustomer', input: { nameAr: 'عميل الدفعة' } })
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'مشغّل الدفعة', department: 'الإنتاج', jobTitle: 'مشغّل خط', basicSalary: 400 } })
  const material = state.materials[0]!
  const product = state.products[0]!
  const supplier = state.suppliers[0]!
  const customer = state.customers[0]!
  const operator = state.employees[0]!

  state = must(state, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId: supplier.id, lines: [{ materialId: material.id, qty: 10000, unitCost: 0.08 }] },
  })
  const poId = state.purchaseOrders[0]!.id
  state = must(state, clock, { action: 'decidePurchaseOrder', input: { id: poId, decision: 'APPROVED' } })
  state = must(state, clock, {
    action: 'receiveGoods',
    input: { purchaseOrderId: poId, lines: [{ materialId: material.id, qty: 10000, batchNo: 'B-RAW-1' }] },
  })
  state = must(state, clock, {
    action: 'createRecipe',
    input: { productId: product.id, nameAr: 'وصفة 99%', baseOutputQty: 9900, items: [{ materialId: material.id, qty: 10000 }] },
  })
  const recipe = state.recipes[0]!
  state = must(state, clock, {
    action: 'transferStock',
    input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: material.id, batchNo: 'B-RAW-1', qty: 10000 }] },
  })
  state = must(state, clock, { action: 'createProductionOrder', input: { productId: product.id, recipeId: recipe.id, plannedQty: 9900 } })
  const order = state.productionOrders[0]!
  const missing = applyCommand(state, actor(state), {
    action: 'completeProduction',
    input: {
      productionOrderId: order.id,
      operatorId: operator.id,
      actualOutputQty: 9650,
      actuals: [{ materialId: material.id, actualQty: 10000, wasteQty: 20 }],
    },
  }, clock)
  assert.equal(missing.ok, false)
  if (!missing.ok) assert.match(missing.error, /سبب الانحراف/)

  state = must(state, clock, {
    action: 'completeProduction',
    input: {
      productionOrderId: order.id,
      operatorId: operator.id,
      actualOutputQty: 9650,
      varianceReason: 'رطوبة أعلى من المختبر',
      actuals: [{ materialId: material.id, actualQty: 10000, wasteQty: 20 }],
    },
  })
  const lotNo = state.lots[0]!.lotNo
  const lot = state.lots[0]!
  assert.match(lot.lotNo, /^LOT-20260929-\d{3}$/)
  assert.equal(lot.productionOrderId, order.id)
  assert.equal(lot.operatorId, operator.id)
  assert.equal(lot.inputKg, 10000)
  assert.equal(lot.expectedOutputKg, 9900)
  assert.equal(lot.actualOutputKg, 9650)
  assert.equal(lot.varianceKg, -250)
  assert.equal(lot.variancePct, -2.53)
  assert.equal(lot.materials[0]?.sourceBatchNo, 'B-RAW-1')
  assert.equal(lot.materials[0]?.supplierId, supplier.id)
  assert.equal(lot.legacy, undefined)
  assert.equal(lot.costLines.length, 1)
  assert.equal(lot.costLines[0]?.type, 'RAW_MATERIAL')
  const varianceNote = state.notifications.find((item) => item.dedupeKey === `var:${order.id}`)
  assert.ok(varianceNote)
  assert.match(varianceNote.title, /انحراف/)

  state = must(state, clock, {
    action: 'createInvoice',
    input: { customerId: customer.id, lines: [{ productId: product.id, qty: 1000, unitPrice: 0.25 }] },
  })
  const invoice = state.invoices[0]!
  state = must(state, clock, { action: 'confirmInvoice', input: { id: invoice.id } })
  const sold = state.lots.find((item) => item.lotNo === lotNo)!
  assert.equal(sold.deliveries.some((item) => item.invoiceId === invoice.id && item.customerId === customer.id && item.qty === 1000), true)
  assert.equal(sold.salePricePerTon, 250)

  state = must(state, clock, { action: 'createWithdrawal', input: { reason: 'عينة', lines: [{ productId: product.id, qty: 50 }] } })
  const withdrawal = state.withdrawals[0]!
  const afterWithdrawal = state.lots.find((item) => item.lotNo === lotNo)!
  assert.ok(afterWithdrawal.deliveries.some((item) => item.withdrawalId === withdrawal.id && item.qty === 50))

  const forward = traceLot(state, lotNo)
  assert.equal(forward?.operator?.id, operator.id)
  assert.equal(forward?.rawBatches[0]?.sourceBatchNo, 'B-RAW-1')
  assert.ok(forward?.suppliers.some((item) => item.id === supplier.id))
  assert.ok(forward?.customers.some((item) => item.id === customer.id))
  const backward = traceSupplierBatch(state, material.id, 'B-RAW-1')
  assert.ok(backward.lots.some((item) => item.lotNo === lot.lotNo))
  assert.ok(backward.suppliers.some((item) => item.id === supplier.id))
  const byCustomer = traceCustomer(state, customer.id)
  assert.ok(byCustomer.lots.some((item) => item.lotNo === lot.lotNo))
  assert.equal(trialBalance(state).balanced, true)
})

test('finished goods leave the oldest lot first', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = emptyState('fifo')
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-FIFO', nameAr: 'ذرة', category: 'حبوب', minQty: 1, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createProduct', input: { code: 'FG-FIFO', nameAr: 'علف', salePrice: 0.2, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createSupplier', input: { nameAr: 'مورد' } })
  state = must(state, clock, { action: 'createCustomer', input: { nameAr: 'عميل أول' } })
  state = must(state, clock, { action: 'createCustomer', input: { nameAr: 'عميل ثان' } })
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'مشغّل', department: 'الإنتاج', jobTitle: 'مشغّل', basicSalary: 300 } })
  const material = state.materials[0]!
  const product = state.products[0]!
  const supplier = state.suppliers[0]!
  const operator = state.employees[0]!
  state = must(state, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId: supplier.id, lines: [{ materialId: material.id, qty: 2000, unitCost: 0.05 }] },
  })
  const poId = state.purchaseOrders[0]!.id
  state = must(state, clock, { action: 'decidePurchaseOrder', input: { id: poId, decision: 'APPROVED' } })
  state = must(state, clock, {
    action: 'receiveGoods',
    input: { purchaseOrderId: poId, lines: [{ materialId: material.id, qty: 2000, batchNo: 'B-FIFO' }] },
  })
  state = must(state, clock, {
    action: 'createRecipe',
    input: { productId: product.id, nameAr: 'وصفة', baseOutputQty: 1000, items: [{ materialId: material.id, qty: 1000 }] },
  })
  const recipe = state.recipes[0]!
  state = must(state, clock, {
    action: 'transferStock',
    input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: material.id, batchNo: 'B-FIFO', qty: 2000 }] },
  })
  const produce = (output: number) => {
    state = must(state, clock, { action: 'createProductionOrder', input: { productId: product.id, recipeId: recipe.id, plannedQty: output } })
    const order = state.productionOrders[0]!
    state = must(state, clock, {
      action: 'completeProduction',
      input: {
        productionOrderId: order.id,
        operatorId: operator.id,
        actualOutputQty: output,
        actuals: [{ materialId: material.id, actualQty: output }],
      },
    })
    clock.advance(1)
  }
  produce(1000)
  produce(800)
  const olderNo = state.lots.find((lot) => lot.actualOutputKg === 1000)!.lotNo
  const newerNo = state.lots.find((lot) => lot.actualOutputKg === 800)!.lotNo
  const firstCustomer = state.customers.find((item) => item.nameAr === 'عميل أول')!
  const secondCustomer = state.customers.find((item) => item.nameAr === 'عميل ثان')!
  state = must(state, clock, { action: 'createInvoice', input: { customerId: firstCustomer.id, lines: [{ productId: product.id, qty: 1000 }] } })
  state = must(state, clock, { action: 'confirmInvoice', input: { id: state.invoices[0]!.id } })
  const older = state.lots.find((lot) => lot.lotNo === olderNo)!
  const newer = state.lots.find((lot) => lot.lotNo === newerNo)!
  assert.equal(older.deliveries.reduce((sum, item) => sum + item.qty, 0), 1000)
  assert.equal(newer.deliveries.length, 0)
  state = must(state, clock, { action: 'createInvoice', input: { customerId: secondCustomer.id, lines: [{ productId: product.id, qty: 100 }] } })
  state = must(state, clock, { action: 'confirmInvoice', input: { id: state.invoices[0]!.id } })
  const newerAfter = state.lots.find((lot) => lot.lotNo === newerNo)!
  assert.ok(newerAfter.deliveries.some((item) => item.customerId === secondCustomer.id && item.qty === 100))
  assert.equal(traceCustomer(state, secondCustomer.id).lots[0]?.lotNo, newerNo)
})

test('v1 completed orders become legacy lots with raw-material cost only', () => {
  const clock = createClock('2026-01-02T04:00:00.000Z')
  const current = emptyState('mig')
  const v1 = {
    ...current,
    schemaVersion: 1 as const,
    lots: undefined,
    qualitySamples: undefined,
    productionOrders: [
      {
        id: 'ord-old',
        number: 'PR-2026-001',
        productId: 'prd-old',
        recipeId: 'rcp-old',
        plannedQty: 1000,
        status: 'COMPLETED' as const,
        expected: [{ materialId: 'mat-old', expectedQty: 1000, actualQty: 1000, wasteQty: 5 }],
        actualOutputQty: 980,
        totalCost: 80,
        unitCost: 0.0816,
        outputBatch: 'FG-OLD',
        varianceReason: '',
        createdBy: 'user-gm',
        createdAt: clock.now(),
        completedAt: clock.now(),
      },
    ],
    invoices: [
      {
        id: 'inv-old',
        number: 'INV-2026-001',
        customerId: 'cus-old',
        status: 'CONFIRMED' as const,
        issuedAt: clock.now(),
        notes: '',
        lines: [
          {
            productId: 'prd-old',
            qty: 100,
            unitPrice: 0.2,
            vatTreatment: 'ZERO' as const,
            vatRatePct: 0,
            net: 20,
            vat: 0,
            total: 20,
            batchNo: 'FG-OLD',
            unitCost: 0.08,
          },
        ],
        subtotal: 20,
        vatAmount: 0,
        total: 20,
        paidAmount: 0,
        createdBy: 'user-gm',
      },
    ],
  }
  const migrated = migrateErpState(v1 as unknown as ErpState)
  assert.equal(migrated.schemaVersion, 3)
  assert.equal(migrated.lots.length, 1)
  const lot = migrated.lots[0]!
  assert.equal(lot.lotNo, 'FG-OLD')
  assert.equal(lot.legacy, true)
  assert.equal(lot.legacyNote, LEGACY_LOT_NOTE)
  assert.deepEqual(lot.costLines, [{ type: 'RAW_MATERIAL', amount: 80 }])
  assert.equal(lot.deliveries[0]?.customerId, 'cus-old')
  assert.equal(lot.deliveries[0]?.qty, 100)
  assert.equal(lot.operatorId, null)
  assert.equal(lot.qcStatus, 'UNTESTED')
  assert.equal(migrateErpState(migrated).lots.length, 1)
})

function legacyDocument() {
  const clock = createClock('2026-01-02T04:00:00.000Z')
  const current = emptyState('mig')
  return {
    ...current,
    schemaVersion: 1 as const,
    lots: undefined,
    qualitySamples: undefined,
    employees: [{ id: 'emp-1', code: 'E1', nameAr: 'خالد', department: 'الإنتاج', jobTitle: 'مشغّل', basicSalary: 1, active: true }],
    productionOrders: [
      {
        id: 'ord-a',
        number: 'PR-A',
        productId: 'prd-old',
        recipeId: 'rcp-old',
        plannedQty: 1000,
        status: 'COMPLETED' as const,
        expected: [],
        actualOutputQty: 500,
        totalCost: 40,
        unitCost: 0.08,
        outputBatch: 'FG-A',
        varianceReason: '',
        createdBy: 'user-gm',
        createdAt: clock.now(),
        completedAt: clock.now(),
      },
      {
        id: 'ord-b',
        number: 'PR-B',
        productId: 'prd-old',
        recipeId: 'rcp-old',
        plannedQty: 1000,
        status: 'COMPLETED' as const,
        expected: [],
        actualOutputQty: 500,
        totalCost: 40,
        unitCost: 0.08,
        outputBatch: 'FG-B',
        varianceReason: '',
        createdBy: 'user-gm',
        createdAt: clock.now(),
        completedAt: clock.now(),
      },
    ],
    invoices: [
      {
        id: 'inv-multi',
        number: 'INV-M',
        customerId: 'cus-old',
        status: 'CONFIRMED' as const,
        issuedAt: clock.now(),
        notes: '',
        lines: [
          {
            productId: 'prd-old',
            qty: 90,
            unitPrice: 0.2,
            vatTreatment: 'ZERO' as const,
            vatRatePct: 0,
            net: 18,
            vat: 0,
            total: 18,
            batchNo: 'FG-A, FG-B, FG-MISSING',
            unitCost: 0.08,
          },
        ],
        subtotal: 18,
        vatAmount: 0,
        total: 18,
        paidAmount: 0,
        createdBy: 'user-gm',
      },
    ],
  }
}

test('legacy lot has no operator and status UNTESTED', () => {
  const migrated = migrateErpState(legacyDocument() as unknown as ErpState)
  for (const lot of migrated.lots) {
    assert.equal(lot.operatorId, null)
    assert.equal(lot.qcStatus, 'UNTESTED')
    assert.equal(lot.legacy, true)
    assert.equal(operatorLabel(migrated.employees, lot.operatorId), UNKNOWN_OPERATOR)
    const trace = traceLot(migrated, lot.lotNo)
    assert.equal(trace?.operator, null)
    assert.equal(trace?.operatorName, UNKNOWN_OPERATOR)
  }
})

test('multi-batch invoice line is split and the unknown batch is not dropped', () => {
  const migrated = migrateErpState(legacyDocument() as unknown as ErpState)
  const a = migrated.lots.find((lot) => lot.lotNo === 'FG-A')!
  const b = migrated.lots.find((lot) => lot.lotNo === 'FG-B')!
  assert.equal(a.deliveries[0]?.allocation, 'proportional')
  assert.equal(a.deliveries[0]?.qty, 30)
  assert.equal(b.deliveries[0]?.qty, 30)
  assert.equal(a.deliveries[0]?.unallocatedQty, 30)
  assert.match(a.deliveries[0]?.unallocatedNote ?? '', /FG-MISSING/)
  assert.match(traceLot(migrated, 'FG-A')?.deliveries[0]?.unallocatedNote ?? '', /غير مخصصة/)
})

test('the migration is idempotent and a future schema fails', () => {
  const migrated = migrateErpState(legacyDocument() as unknown as ErpState)
  const snapshot = JSON.stringify(migrated)
  assert.equal(JSON.stringify(migrateErpState(migrated)), snapshot)
  assert.throws(() => migrateErpState({ ...emptyState('x'), schemaVersion: 9 } as ErpState), /إصدار بيانات المصنع غير مدعوم/)
})

test('requireQcBeforeUse blocks an untested legacy lot only when it is on', () => {
  const migrated = migrateErpState(legacyDocument() as unknown as ErpState)
  migrated.company.requireQcBeforeUse = false
  assert.equal(lotQcBlock(migrated, 'FG-A'), null)
  migrated.company.requireQcBeforeUse = true
  assert.match(lotQcBlock(migrated, 'FG-A') ?? '', /يتطلب الفحص قبل الاستخدام/)
})

test('UI-facing selectors do not throw for a lot without an operator', () => {
  const migrated = migrateErpState(legacyDocument() as unknown as ErpState)
  assert.doesNotThrow(() => {
    for (const lot of migrated.lots) {
      operatorLabel(migrated.employees, lot.operatorId)
      const trace = traceLot(migrated, lot.lotNo)
      assert.ok(trace)
      assert.equal(trace.operatorName, UNKNOWN_OPERATOR)
    }
  })
})
