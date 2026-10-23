import assert from 'node:assert/strict'
import { test } from 'node:test'
import { actorFromUser, applyCommand } from './engine'
import { stockRows, trialBalance } from './reports'
import { money } from './money'
import { createClock, emptyState } from './seed'
import type { Command } from './types'

function fixture(pending = false) {
  let state = emptyState('synthetic-production-value')
  const clock = createClock('2026-10-23T08:00:00.000Z')
  function command(command: Command, user = 'user-gm') {
    const result = applyCommand(state, actorFromUser(state, user)!, command, clock)
    assert(result.ok, `${command.action}: ${result.ok ? '' : result.error}`)
    state = result.state
    return state
  }
  command({ action: 'createMaterial', input: { code: 'RM', nameAr: 'خامة اختبار', category: 'اختبار', minQty: 0, vatTreatment: 'ZERO' } })
  command({ action: 'createProduct', input: { code: 'FG', nameAr: 'منتج اختبار', salePrice: 1, vatTreatment: 'ZERO', bagKg: 50 } })
  command({ action: 'createSupplier', input: { nameAr: 'مورد اصطناعي' } })
  command({ action: 'createCustomer', input: { nameAr: 'عميل اصطناعي' } })
  command({ action: 'createEmployee', input: { nameAr: 'مشغل اصطناعي', department: 'اختبار', jobTitle: 'مشغل', basicSalary: 0 } })
  command({ action: 'updateCompany', input: { bagUnitCost: 0, costRates: {}, costApprovalThreshold: pending ? 0 : 1_000_000, returnWindowDays: 7 } })
  const materialId = state.materials[0]!.id, productId = state.products[0]!.id
  command({ action: 'createPurchaseOrder', input: { supplierId: state.suppliers[0]!.id, lines: [{ materialId, qty: 17000, unitCost: 0.1 }] } })
  const purchaseOrderId = state.purchaseOrders[0]!.id
  command({ action: 'decidePurchaseOrder', input: { id: purchaseOrderId, decision: 'APPROVED' } })
  command({ action: 'receiveGoods', input: { purchaseOrderId, lines: [{ materialId, qty: 17000, batchNo: 'VALUE-RM' }] } })
  command({ action: 'transferStock', input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: materialId, batchNo: 'VALUE-RM', qty: 17000 }] } })
  command({ action: 'createRecipe', input: { productId, nameAr: 'وصفة اختبار', baseOutputQty: 17000, items: [{ materialId, qty: 17000 }] } })
  command({ action: 'createProductionOrder', input: { productId, recipeId: state.recipes[0]!.id, plannedQty: 17000 } })
  command({ action: 'completeProduction', input: { productionOrderId: state.productionOrders[0]!.id, operatorId: state.employees[0]!.id, actualOutputQty: 17000, actuals: [{ materialId, actualQty: 17000 }], costLines: [{ type: 'GAS', amount: 488.75 }] } })
  function sale(qty: number) {
    command({ action: 'createInvoice', input: { customerId: state.customers[0]!.id, lines: [{ productId, qty, unitPrice: 1 }] } })
    const id = state.invoices[0]!.id
    command({ action: 'confirmInvoice', input: { id } })
    return state.invoices.find(item => item.id === id)!
  }
  function reconcile() {
    const inventory = money(stockRows(state).filter(row => row.itemType === 'PRODUCT').reduce((sum, row) => sum + row.value, 0))
    const account = (code: string) => money(state.journals.flatMap(entry => entry.lines).filter(line => line.accountCode === code).reduce((sum, line) => sum + line.debit - line.credit, 0))
    assert.equal(inventory, account('1300'), 'physical carrying value must equal finished-goods control account')
    assert.equal(money(inventory + account('5100')), state.lots[0]!.totalCost, 'inventory plus cost of sales must conserve production cost')
    assert(trialBalance(state).balanced)
  }
  return { state: () => state, command, sale, reconcile, productId }
}

test('17-ton production preserves 2188.750 through partial sale, transfer, return and final depletion', () => {
  const f = fixture()
  assert.equal(f.state().lots[0]!.totalCost, 2188.75)
  f.reconcile()
  const invoice = f.sale(500)
  f.reconcile()
  const batchNo = invoice.lines[0]!.allocations![0]!.batchNo
  f.command({ action: 'transferStock', input: { from: 'WH_FG', to: 'WH_MFG', lines: [{ itemType: 'PRODUCT', itemId: f.productId, batchNo, qty: 1000 }] } })
  f.reconcile()
  f.command({ action: 'transferStock', input: { from: 'WH_MFG', to: 'WH_FG', lines: [{ itemType: 'PRODUCT', itemId: f.productId, batchNo, qty: 1000 }] } })
  f.command({ action: 'createSalesReturn', input: { requestId: 'value-return', invoiceId: invoice.id, invoiceLineIndex: 0, sourceBatchNo: batchNo, qty: 500, reason: 'مرتجع اختبار' } }, 'user-sales')
  const id = f.state().salesReturns![0]!.id
  f.command({ action: 'decideSalesReturn', input: { id, decision: 'APPROVED', received: true, receiptReference: 'SYNTHETIC', note: 'استلام اختبار' } })
  f.reconcile()
  f.command({ action: 'decideSalesReturnQuality', input: { id, result: 'PASSED', note: 'فحص اختبار' } }, 'user-qc')
  f.sale(17000)
  f.reconcile()
  assert.equal(stockRows(f.state()).filter(row => row.itemType === 'PRODUCT').reduce((sum, row) => sum + row.value, 0), 0)
})

test('pending cost approval before sale preserves full batch value', () => {
  const f = fixture(true), lot = f.state().lots[0]!
  f.command({ action: 'decideProductionCost', input: { lotId: lot.id, lineId: lot.pendingCostLines![0]!.id, decision: 'APPROVED' } })
  f.reconcile()
  f.sale(17000)
  f.reconcile()
})

test('late cost approval fails atomically after sale until the accountant defines its settlement policy', () => {
  const f = fixture(true), invoice = structuredClone(f.sale(500)), lot = f.state().lots[0]!
  const before = structuredClone(f.state())
  const result = applyCommand(f.state(), actorFromUser(f.state(), 'user-gm')!, { action: 'decideProductionCost', input: { lotId: lot.id, lineId: lot.pendingCostLines![0]!.id, decision: 'APPROVED' } }, createClock())
  assert.equal(result.ok, false)
  assert.deepEqual(f.state(), before)
  f.reconcile()
  assert.deepEqual(f.state().invoices.find(item => item.id === invoice.id), invoice)
})
