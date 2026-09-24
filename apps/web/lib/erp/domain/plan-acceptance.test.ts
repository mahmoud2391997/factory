import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, applyCommand, publicState } from './engine'
import { DEFAULT_ROLE_PERMISSIONS } from './permissions'
import { inventoryIntegrity, itemOnHand, materialStatement, muscatDay, traceProduct, trialBalance, vatReturn } from './reports'
import { createClock, emptyState } from './seed'
import type { Actor, ErpState } from './types'

function actor(state: ErpState, id: string): Actor {
  const found = actorFromUser(state, id)
  assert.ok(found)
  return found
}

function must(state: ErpState, who: Actor, clock: ReturnType<typeof createClock>, command: Parameters<typeof applyCommand>[2]) {
  const result = applyCommand(state, who, command, clock)
  if (!result.ok) throw new Error(`${command.action}: ${result.error}`)
  return result.state
}

test('days 5–13: supplier to sale on one balanced mill path', () => {
  const clock = createClock('2026-09-24T04:00:00.000Z')
  let state = emptyState('plan')
  const gm = () => actor(state, 'user-gm')
  const ops = () => actor(state, 'user-ops')
  const acc = () => actor(state, 'user-acc')

  assert.equal(state.company.currency, 'OMR')
  assert.equal(state.company.vatRatePct, 5)
  assert.equal(ops().permissions.includes('accounting.manage'), false)
  assert.equal(acc().permissions.includes('inventory.adjust'), false)

  state = must(state, gm(), clock, {
    action: 'createMaterial',
    input: { code: 'RM-PLAN', nameAr: 'ذرة الخطة', category: 'حبوب', minQty: 100, vatTreatment: 'STANDARD' },
  })
  state = must(state, gm(), clock, {
    action: 'createMaterial',
    input: { code: 'RM-ADJ', nameAr: 'مادة التعديل', category: 'اختبار', minQty: 1, vatTreatment: 'ZERO' },
  })
  state = must(state, gm(), clock, {
    action: 'createProduct',
    input: { code: 'FG-PLAN', nameAr: 'علف الخطة', salePrice: 0.2, vatTreatment: 'STANDARD' },
  })
  state = must(state, gm(), clock, {
    action: 'createSupplier',
    input: { nameAr: 'مورد الخطة', vatNumber: 'OM2200000002' },
  })
  state = must(state, gm(), clock, {
    action: 'createCustomer',
    input: { nameAr: 'عميل الخطة', vatNumber: 'OM3300000003' },
  })

  const corn = state.materials.find((item) => item.code === 'RM-PLAN')!
  const adjMaterial = state.materials.find((item) => item.code === 'RM-ADJ')!
  const product = state.products.find((item) => item.code === 'FG-PLAN')!
  const supplier = state.suppliers[0]!
  const customer = state.customers[0]!

  state = must(state, ops(), clock, {
    action: 'createPurchaseOrder',
    input: { supplierId: supplier.id, lines: [{ materialId: corn.id, qty: 1000, unitCost: 0.1 }] },
  })
  const poId = state.purchaseOrders[0]!.id
  assert.equal(state.purchaseOrders[0]!.status, 'PENDING_APPROVAL')

  const opsApprove = applyCommand(state, ops(), { action: 'decidePurchaseOrder', input: { id: poId, decision: 'APPROVED' } }, clock)
  assert.equal(opsApprove.ok, false)

  const early = applyCommand(
    state,
    ops(),
    { action: 'receiveGoods', input: { purchaseOrderId: poId, lines: [{ materialId: corn.id, qty: 1000, batchNo: 'B-PLAN', expiryDate: '2027-09-24' }] } },
    clock,
  )
  assert.equal(early.ok, false)

  state = must(state, gm(), clock, { action: 'decidePurchaseOrder', input: { id: poId, decision: 'APPROVED' } })
  const over = applyCommand(
    state,
    ops(),
    { action: 'receiveGoods', input: { purchaseOrderId: poId, lines: [{ materialId: corn.id, qty: 1001, batchNo: 'B-PLAN' }] } },
    clock,
  )
  assert.equal(over.ok, false)

  state = must(state, ops(), clock, {
    action: 'receiveGoods',
    input: { purchaseOrderId: poId, lines: [{ materialId: corn.id, qty: 1000, batchNo: 'B-PLAN', expiryDate: '2027-09-24' }] },
  })
  assert.equal(state.purchaseOrders[0]!.status, 'RECEIVED')
  assert.equal(itemOnHand(state, 'MATERIAL', corn.id, 'WH_RAW'), 1000)
  const receipt = state.goodsReceipts[0]!
  const receiptLedger = state.ledger.find((row) => row.refId === receipt.id && row.type === 'PURCHASE_RECEIPT')
  assert.ok(receiptLedger)
  assert.equal(receiptLedger.prevQty, 0)
  assert.equal(receiptLedger.newQty, 1000)
  assert.ok(
    state.journals.some(
      (entry) =>
        entry.refType === 'goodsReceipt' &&
        entry.refId === receipt.id &&
        entry.lines.some((line) => line.accountCode === '1100' && line.debit === 100) &&
        entry.lines.some((line) => line.accountCode === '2100' && line.credit === 105) &&
        entry.lines.some((line) => line.accountCode === '2300' && line.debit === 5),
    ),
  )

  const sameWarehouse = applyCommand(
    state,
    ops(),
    { action: 'transferStock', input: { from: 'WH_RAW', to: 'WH_RAW', lines: [{ itemType: 'MATERIAL', itemId: corn.id, batchNo: 'B-PLAN', qty: 1 }] } },
    clock,
  )
  assert.equal(sameWarehouse.ok, false)
  const tooMuch = applyCommand(
    state,
    ops(),
    { action: 'transferStock', input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: corn.id, batchNo: 'B-PLAN', qty: 1001 }] } },
    clock,
  )
  assert.equal(tooMuch.ok, false)

  state = must(state, ops(), clock, {
    action: 'transferStock',
    input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: corn.id, batchNo: 'B-PLAN', qty: 600 }] },
  })
  assert.equal(itemOnHand(state, 'MATERIAL', corn.id, 'WH_RAW'), 400)
  assert.equal(itemOnHand(state, 'MATERIAL', corn.id, 'WH_MFG'), 600)
  const transfer = state.transfers[0]!
  assert.equal(state.ledger.filter((row) => row.refId === transfer.id && row.type === 'TRANSFER_OUT').length, 1)
  assert.equal(state.ledger.filter((row) => row.refId === transfer.id && row.type === 'TRANSFER_IN').length, 1)

  const noReason = applyCommand(
    state,
    ops(),
    {
      action: 'requestAdjustment',
      input: { warehouse: 'WH_RAW', itemType: 'MATERIAL', itemId: adjMaterial.id, batchNo: 'B-ADJ', qtyDelta: 50, unitCost: 0.05, reason: '   ' },
    },
    clock,
  )
  assert.equal(noReason.ok, false)
  state = must(state, ops(), clock, {
    action: 'requestAdjustment',
    input: { warehouse: 'WH_RAW', itemType: 'MATERIAL', itemId: adjMaterial.id, batchNo: 'B-ADJ', qtyDelta: 50, unitCost: 0.05, reason: 'جرد افتتاحي' },
  })
  const adjustmentId = state.adjustments[0]!.id
  assert.equal(itemOnHand(state, 'MATERIAL', adjMaterial.id), 0)
  const opsAdjust = applyCommand(state, ops(), { action: 'decideAdjustment', input: { id: adjustmentId, decision: 'APPROVED' } }, clock)
  assert.equal(opsAdjust.ok, false)
  state = must(state, gm(), clock, { action: 'decideAdjustment', input: { id: adjustmentId, decision: 'APPROVED' } })
  assert.equal(itemOnHand(state, 'MATERIAL', adjMaterial.id, 'WH_RAW'), 50)
  assert.equal(state.ledger.find((row) => row.refId === adjustmentId)?.type, 'ADJUSTMENT')

  state = must(state, ops(), clock, {
    action: 'createRecipe',
    input: { productId: product.id, nameAr: 'وصفة الخطة', baseOutputQty: 1000, items: [{ materialId: corn.id, qty: 600 }] },
  })
  const recipe = state.recipes[0]!
  state = must(state, ops(), clock, {
    action: 'createProductionOrder',
    input: { productId: product.id, recipeId: recipe.id, plannedQty: 1000 },
  })
  const order = state.productionOrders[0]!
  assert.equal(order.expected[0]!.expectedQty, 600)
  assert.equal(order.status, 'RELEASED')

  const completedRun = applyCommand(
    state,
    ops(),
    {
      action: 'completeProduction',
      input: {
        productionOrderId: order.id,
        actualOutputQty: 980,
        actuals: [{ materialId: corn.id, actualQty: 600, wasteQty: 20 }],
      },
    },
    clock,
  )
  assert.equal(completedRun.ok, true)

  state = completedRun.ok ? completedRun.state : state
  const completed = state.productionOrders.find((item) => item.id === order.id)!
  assert.equal(completed.status, 'COMPLETED')
  assert.equal(completed.actualOutputQty, 980)
  assert.equal(completed.expected[0]!.actualQty, 600)
  assert.equal(completed.expected[0]!.wasteQty, 20)
  assert.equal(itemOnHand(state, 'MATERIAL', corn.id, 'WH_MFG'), 0)
  assert.equal(itemOnHand(state, 'PRODUCT', product.id, 'WH_FG'), 980)
  assert.ok(state.ledger.some((row) => row.refId === order.id && row.type === 'PRODUCTION_CONSUMPTION'))
  assert.ok(state.ledger.some((row) => row.refId === order.id && row.type === 'PRODUCTION_OUTPUT' && row.warehouse === 'WH_FG'))
  assert.ok(state.journals.some((entry) => entry.refId === order.id && entry.lines.some((line) => line.accountCode === '1200' && line.debit > 0)))
  assert.ok(state.journals.some((entry) => entry.refId === order.id && entry.lines.some((line) => line.accountCode === '1300' && line.debit > 0)))

  state = must(state, ops(), clock, {
    action: 'transferStock',
    input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: corn.id, batchNo: 'B-PLAN', qty: 66 }] },
  })
  state = must(state, ops(), clock, {
    action: 'createProductionOrder',
    input: { productId: product.id, recipeId: recipe.id, plannedQty: 100 },
  })
  const varianceOrder = state.productionOrders[0]!
  assert.equal(varianceOrder.expected[0]!.expectedQty, 60)
  const missingReason = applyCommand(
    state,
    ops(),
    {
      action: 'completeProduction',
      input: {
        productionOrderId: varianceOrder.id,
        actualOutputQty: 95,
        actuals: [{ materialId: corn.id, actualQty: 66, wasteQty: 2 }],
      },
    },
    clock,
  )
  assert.equal(missingReason.ok, false)
  if (!missingReason.ok) assert.match(missingReason.error, /سبب الانحراف/)
  state = must(state, ops(), clock, {
    action: 'completeProduction',
    input: {
      productionOrderId: varianceOrder.id,
      actualOutputQty: 95,
      varianceReason: 'رطوبة أعلى في الذرة',
      actuals: [{ materialId: corn.id, actualQty: 66, wasteQty: 2 }],
    },
  })
  assert.equal(itemOnHand(state, 'PRODUCT', product.id, 'WH_FG'), 1075)

  const fgBeforeSale = itemOnHand(state, 'PRODUCT', product.id, 'WH_FG')
  state = must(state, ops(), clock, {
    action: 'createInvoice',
    input: { customerId: customer.id, lines: [{ productId: product.id, qty: 100 }] },
  })
  const invoice = state.invoices[0]!
  assert.equal(invoice.status, 'DRAFT')
  assert.equal(invoice.subtotal, 20)
  assert.equal(invoice.vatAmount, 1)
  assert.equal(invoice.total, 21)
  assert.equal(itemOnHand(state, 'PRODUCT', product.id, 'WH_FG'), fgBeforeSale)
  const accConfirm = applyCommand(state, acc(), { action: 'confirmInvoice', input: { id: invoice.id } }, clock)
  assert.equal(accConfirm.ok, false)
  state = must(state, ops(), clock, { action: 'confirmInvoice', input: { id: invoice.id } })
  assert.equal(state.invoices[0]!.status, 'CONFIRMED')
  assert.equal(itemOnHand(state, 'PRODUCT', product.id, 'WH_FG'), 975)
  assert.ok(state.ledger.some((row) => row.refId === invoice.id && row.type === 'SALE' && row.qty === -100))
  assert.ok(state.journals.some((entry) => entry.refId === invoice.id && entry.lines.some((line) => line.accountCode === '4100' && line.credit === 20)))
  assert.ok(state.journals.some((entry) => entry.refId === invoice.id && entry.lines.some((line) => line.accountCode === '2200' && line.credit === 1)))
  assert.ok(state.journals.some((entry) => entry.refId === invoice.id && entry.lines.some((line) => line.accountCode === '5100' && line.debit > 0)))

  const oversell = applyCommand(
    state,
    ops(),
    { action: 'createInvoice', input: { customerId: customer.id, lines: [{ productId: product.id, qty: 5000 }] } },
    clock,
  )
  assert.equal(oversell.ok, true)
  if (!oversell.ok) return
  const oversellConfirm = applyCommand(oversell.state, ops(), { action: 'confirmInvoice', input: { id: oversell.state.invoices[0]!.id } }, clock)
  assert.equal(oversellConfirm.ok, false)

  state = must(state, acc(), clock, { action: 'recordPayment', input: { invoiceId: invoice.id, amount: 21, method: 'تحويل بنكي' } })
  assert.equal(state.invoices.find((item) => item.id === invoice.id)!.status, 'PAID')
  state = must(state, ops(), clock, {
    action: 'createWithdrawal',
    input: { reason: 'عينة جودة', lines: [{ productId: product.id, qty: 10 }] },
  })
  assert.equal(itemOnHand(state, 'PRODUCT', product.id, 'WH_FG'), 965)
  assert.ok(state.ledger.some((row) => row.type === 'WITHDRAWAL' && row.itemId === product.id))

  state = must(state, gm(), clock, { action: 'updateCompany', input: { vatRatePct: 10, currency: 'OMR' } })
  assert.equal(state.company.vatRatePct, 10)
  assert.equal(state.company.currency, 'OMR')
  const opsSettings = applyCommand(state, ops(), { action: 'updateCompany', input: { vatRatePct: 5 } }, clock)
  assert.equal(opsSettings.ok, false)
  state = must(state, ops(), clock, {
    action: 'createInvoice',
    input: { customerId: customer.id, lines: [{ productId: product.id, qty: 10 }] },
  })
  assert.equal(state.invoices[0]!.vatAmount, 0.2)
  assert.equal(state.invoices[0]!.status, 'DRAFT')

  const tb = trialBalance(state)
  assert.equal(tb.balanced, true)
  const vat = vatReturn(state, muscatDay(invoice.issuedAt).slice(0, 7))
  assert.equal(vat.outputVat, 1)
  assert.equal(vat.inputVat, 5)
  assert.equal(inventoryIntegrity(state).ok, true, inventoryIntegrity(state).issues.join(' | '))

  const trace = traceProduct(state, product.id)
  assert.ok(trace.purchaseOrders.some((item) => item.id === poId && item.supplierId === supplier.id))
  assert.ok(trace.receipts.some((item) => item.id === receipt.id))
  assert.ok(trace.orders.some((item) => item.id === order.id && item.status === 'COMPLETED'))
  assert.ok(trace.sales.some((item) => item.id === invoice.id && item.status === 'PAID'))

  const statement = materialStatement(state, corn.id)
  assert.ok(statement)
  assert.equal(statement.receivedQty, 1000)
  assert.equal(statement.consumedQty, 666)
  assert.equal(statement.onHand, 334)
  assert.equal(statement.balanceMatches, true)
  assert.equal(statement.wasteQty, 22)
  assert.equal(statement.soldQty, 100)
  assert.equal(statement.withdrawnQty, 10)
  assert.equal(statement.productOnHand, 965)
  assert.equal(statement.outputKg, 1075)
  assert.ok(statement.reasons.includes('رطوبة أعلى في الذرة'))

  const hidden = publicState(state, ops().permissions)
  assert.deepEqual(hidden.journals, [])
  assert.deepEqual(hidden.auditLogs, [])
  assert.deepEqual(hidden.payrolls, [])
  assert.ok(hidden.materials.length > 0)
  assert.ok(state.auditLogs.some((row) => row.action === 'استلام بضاعة'))
  assert.ok(state.auditLogs.some((row) => row.action === 'تأكيد فاتورة'))

  const stripped = DEFAULT_ROLE_PERMISSIONS.OPERATIONS.filter((permission) => permission !== 'sales.confirm')
  state = must(state, gm(), clock, { action: 'setRolePermissions', input: { role: 'OPERATIONS', permissions: [...stripped] } })
  const blockedSale = applyCommand(state, ops(), { action: 'confirmInvoice', input: { id: state.invoices[0]!.id } }, clock)
  assert.equal(blockedSale.ok, false)
  state = must(state, gm(), clock, {
    action: 'setRolePermissions',
    input: { role: 'OPERATIONS', permissions: [...DEFAULT_ROLE_PERMISSIONS.OPERATIONS] },
  })
  assert.equal(ops().permissions.includes('sales.confirm'), true)
})
