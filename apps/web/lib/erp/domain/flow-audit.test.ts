import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, applyCommand, publicState } from './engine'
import { money } from './money'
import { traceCustomer, traceLot, trialBalance } from './reports'
import { createClock, emptyState } from './seed'
import type { Actor, Command, ErpState } from './types'

function actor(state: ErpState, id = 'user-gm'): Actor {
  const found = actorFromUser(state, id)
  assert.ok(found, `User ${id} not found`)
  return found
}

function must(state: ErpState, clock: ReturnType<typeof createClock>, command: Command, userId = 'user-gm'): ErpState {
  const user = actor(state, userId)
  const result = applyCommand(state, user, command, clock)
  if (!result.ok) {
    throw new Error(`Command failed ${command.action}: ${result.error}`)
  }
  return result.state
}

function fail(state: ErpState, clock: ReturnType<typeof createClock>, command: Command, userId = 'user-gm'): string {
  const user = actor(state, userId)
  const result = applyCommand(state, user, command, clock)
  assert.equal(result.ok, false, `Expected ${command.action} to fail`)
  return result.ok ? '' : result.error
}

// -----------------------------------------------------------------------------
// CHAIN 1: Procure-to-Pay (طلب الشراء -> المقارنة -> أمر الشراء -> الاستلام -> المورد)
// -----------------------------------------------------------------------------
test('Flow Chain 1: Procure-to-Pay lifecycle', () => {
  const clock = createClock('2026-10-01T08:00:00.000Z')
  let state = emptyState('p2p')

  // Setup entities
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-CORN', nameAr: 'ذرة صفراء مجروشة', category: 'حبوب', minQty: 500, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createSupplier', input: { nameAr: 'شركة الحبوب الوطنية' } })
  state = must(state, clock, { action: 'createSupplier', input: { nameAr: 'مطاحن الخليج' } })

  const corn = state.materials[0]!
  const supplier1 = state.suppliers[0]!
  const supplier2 = state.suppliers[1]!

  // 1. Create Purchase Request
  state = must(state, clock, {
    action: 'createPurchaseRequest',
    input: { purpose: 'MATERIAL', lines: [{ materialId: corn.id, qty: 5000 }] },
  })
  const pr = state.purchaseRequests[0]!
  assert.equal(pr.status, 'DRAFT')

  // 2. Add quotations from two suppliers
  state = must(state, clock, {
    action: 'addSupplierQuotation',
    input: { requestId: pr.id, supplierId: supplier1.id, deliveryCost: 20, lines: [{ materialId: corn.id, qty: 5000, unitCost: 0.12 }] },
  })
  state = must(state, clock, {
    action: 'addSupplierQuotation',
    input: { requestId: pr.id, supplierId: supplier2.id, deliveryCost: 15, lines: [{ materialId: corn.id, qty: 5000, unitCost: 0.11 }] },
  })
  assert.equal(state.purchaseRequests[0]!.status, 'QUOTING')

  // 3. Select better quotation (supplier2) and approve PR
  const quote2 = state.supplierQuotations.find((q) => q.supplierId === supplier2.id)!
  state = must(state, clock, { action: 'selectSupplierQuotation', input: { requestId: pr.id, quotationId: quote2.id } })
  assert.equal(state.purchaseRequests[0]!.status, 'SELECTED')

  state = must(state, clock, { action: 'decidePurchaseRequest', input: { id: pr.id, decision: 'APPROVED' } })
  assert.equal(state.purchaseRequests[0]!.status, 'APPROVED')

  // 4. Convert to Purchase Order
  state = must(state, clock, { action: 'convertRequestToPurchaseOrder', input: { id: pr.id } })
  const po = state.purchaseOrders[0]!
  assert.equal(po.supplierId, supplier2.id)
  assert.equal(po.status, 'PENDING_APPROVAL')

  // 5. Approve PO
  state = must(state, clock, { action: 'decidePurchaseOrder', input: { id: po.id, decision: 'APPROVED' } })
  assert.equal(state.purchaseOrders[0]!.status, 'APPROVED')

  // 6. Receive Goods into WH_RAW
  state = must(state, clock, {
    action: 'receiveGoods',
    input: {
      purchaseOrderId: po.id,
      lines: [{ materialId: corn.id, qty: 5000, batchNo: 'CORN-B2026-01' }],
    },
  })
  assert.equal(state.purchaseOrders[0]!.status, 'RECEIVED')

  // Verify inventory balance in WH_RAW
  const balance = state.balances.find((b) => b.itemId === corn.id && b.warehouse === 'WH_RAW')
  assert.ok(balance)
  assert.equal(balance.qty, 5000)

  // Verify accounts payable journal exists and balanced
  assert.equal(trialBalance(state).balanced, true)
})

// -----------------------------------------------------------------------------
// CHAIN 2: Inventory & Warehousing (التحويل بين المستودعات -> التسوية -> الباركود)
// -----------------------------------------------------------------------------
test('Flow Chain 2: Inventory transfers, stock adjustments, and barcode scanning', () => {
  const clock = createClock('2026-10-01T09:00:00.000Z')
  let state = emptyState('inv')

  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-SOY', nameAr: 'كسب صويا', category: 'بروتين', minQty: 100, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createSupplier', input: { nameAr: 'مورد الصويا' } })
  const soy = state.materials[0]!
  const supplier = state.suppliers[0]!

  // PO & Receive 2000kg
  state = must(state, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId: supplier.id, lines: [{ materialId: soy.id, qty: 2000, unitCost: 0.2 }] },
  })
  const poId = state.purchaseOrders[0]!.id
  state = must(state, clock, { action: 'decidePurchaseOrder', input: { id: poId, decision: 'APPROVED' } })
  state = must(state, clock, { action: 'receiveGoods', input: { purchaseOrderId: poId, lines: [{ materialId: soy.id, qty: 2000, batchNo: 'SOY-LOT-01' }] } })

  // 1. Transfer stock from WH_RAW to WH_MFG
  state = must(state, clock, {
    action: 'transferStock',
    input: {
      from: 'WH_RAW',
      to: 'WH_MFG',
      lines: [{ itemType: 'MATERIAL', itemId: soy.id, batchNo: 'SOY-LOT-01', qty: 1500 }],
    },
  })
  assert.equal(state.balances.find((b) => b.warehouse === 'WH_RAW' && b.itemId === soy.id)?.qty, 500)
  assert.equal(state.balances.find((b) => b.warehouse === 'WH_MFG' && b.itemId === soy.id)?.qty, 1500)

  // 2. Request stock adjustment in WH_RAW (difference -20kg due to spillage)
  state = must(state, clock, {
    action: 'requestAdjustment',
    input: {
      warehouse: 'WH_RAW',
      itemType: 'MATERIAL',
      itemId: soy.id,
      batchNo: 'SOY-LOT-01',
      qtyDelta: -20,
      reason: 'انبعاث غبار وتسرب أثناء التفريغ',
    },
  })
  const adj = state.adjustments[0]!
  assert.equal(adj.status, 'PENDING_APPROVAL')
  assert.equal(adj.qtyDelta, -20)

  // 3. Approve adjustment
  state = must(state, clock, { action: 'decideAdjustment', input: { id: adj.id, decision: 'APPROVED' } })
  assert.equal(state.adjustments[0]!.status, 'APPROVED')
  assert.equal(state.balances.find((b) => b.warehouse === 'WH_RAW' && b.itemId === soy.id)?.qty, 480)

  // 4. Barcode scanning verification
  const scanResult = applyCommand(state, actor(state), {
    action: 'scanBarcode',
    input: { code: 'RM-SOY' },
  }, clock)
  assert.equal(scanResult.ok, true)
  if (scanResult.ok) state = scanResult.state
  assert.ok(state.auditLogs.some((a) => a.action === 'مسح باركود'))
  assert.equal(trialBalance(state).balanced, true)
})

// -----------------------------------------------------------------------------
// CHAIN 3: Production & Manufacturing (أمر التصنيع -> الميزان -> اكتمال الدفعة -> اعتماد التكاليف)
// -----------------------------------------------------------------------------
test('Flow Chain 3: Production manufacturing, scale hopper idempotency, and cost approval', () => {
  const clock = createClock('2026-10-01T10:00:00.000Z')
  let state = emptyState('mfg')

  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-BARLEY', nameAr: 'شعير بلدي', category: 'حبوب', minQty: 100, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createProduct', input: { code: 'FG-SHEEP', nameAr: 'علف تسمين أغنام 16%', salePrice: 0.24, vatTreatment: 'ZERO', bagKg: 50 } })
  state = must(state, clock, { action: 'createSupplier', input: { nameAr: 'مورد الأعلاف' } })
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'سالم المشغّل', department: 'الإنتاج', jobTitle: 'مشغل خط الإنتاج', basicSalary: 350 } })

  const barley = state.materials[0]!
  const product = state.products[0]!
  const supplier = state.suppliers[0]!
  const operator = state.employees[0]!

  // Stock barley in WH_MFG
  state = must(state, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId: supplier.id, lines: [{ materialId: barley.id, qty: 10000, unitCost: 0.08 }] },
  })
  const poId = state.purchaseOrders[0]!.id
  state = must(state, clock, { action: 'decidePurchaseOrder', input: { id: poId, decision: 'APPROVED' } })
  state = must(state, clock, { action: 'receiveGoods', input: { purchaseOrderId: poId, lines: [{ materialId: barley.id, qty: 10000, batchNo: 'BARLEY-1' }] } })
  state = must(state, clock, { action: 'transferStock', input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: barley.id, batchNo: 'BARLEY-1', qty: 10000 }] } })

  // 1. Create Recipe & Production Order
  state = must(state, clock, {
    action: 'createRecipe',
    input: { productId: product.id, nameAr: 'خلطة التسمين الأساسية', baseOutputQty: 1000, items: [{ materialId: barley.id, qty: 1000 }] },
  })
  const recipe = state.recipes[0]!
  state = must(state, clock, {
    action: 'createProductionOrder',
    input: { productId: product.id, recipeId: recipe.id, plannedQty: 2000 },
  })
  const order = state.productionOrders[0]!
  assert.equal(order.status, 'RELEASED')

  // 2. Hopper scale reading with idempotency eventId
  state = must(state, clock, {
    action: 'recordScaleReading',
    input: { eventId: 'scale-evt-101', scaleId: 'hopper-main', productionOrderId: order.id, materialId: barley.id, actualQty: 2010 },
  }, 'user-production')

  // Re-transmitting same eventId must be idempotent
  state = must(state, clock, {
    action: 'recordScaleReading',
    input: { eventId: 'scale-evt-101', scaleId: 'hopper-main', productionOrderId: order.id, materialId: barley.id, actualQty: 2010 },
  }, 'user-production')

  // 3. Complete production with gas cost lines
  state = must(state, clock, {
    action: 'completeProduction',
    input: {
      productionOrderId: order.id,
      operatorId: operator.id,
      actualOutputQty: 2000,
      actuals: [{ materialId: barley.id, actualQty: 2010 }],
      costLines: [{ type: 'GAS', amount: 25 }],
    },
  })
  assert.equal(state.productionOrders[0]!.status, 'COMPLETED')
  const lot = state.lots[0]!
  assert.ok(lot)
  assert.equal(lot.actualOutputKg, 2000)
  assert.equal(lot.pendingCostLines?.[0]?.amount, 25)

  // 4. Cost approval by accountant
  state = must(state, clock, {
    action: 'decideProductionCost',
    input: { lotId: lot.id, lineId: lot.pendingCostLines![0]!.id, decision: 'APPROVED' },
  }, 'user-acc')

  const updatedLot = state.lots.find((l) => l.id === lot.id)!
  assert.equal(updatedLot.costLines.find((c) => c.type === 'GAS')?.amount, 25)
  assert.equal(trialBalance(state).balanced, true)
})

// -----------------------------------------------------------------------------
// CHAIN 4: Quality & Recall Traceability (فحص الجودة -> الحجز -> الاستدعاء -> التتبع)
// -----------------------------------------------------------------------------
test('Flow Chain 4: Quality controls, raw quarantine, finished lot recall, and forward/backward trace', () => {
  const clock = createClock('2026-10-01T11:00:00.000Z')
  let state = emptyState('qc')

  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-PREMIX', nameAr: 'بريمكس فيتامينات', category: 'إضافات', minQty: 10, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createProduct', input: { code: 'FG-POULTRY', nameAr: 'علف دواجن بياض', salePrice: 0.35, vatTreatment: 'ZERO', bagKg: 50 } })
  state = must(state, clock, { action: 'createSupplier', input: { nameAr: 'المورد التقني' } })
  state = must(state, clock, { action: 'createCustomer', input: { nameAr: 'مزرعة الوادي للدواجن' } })
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'فني المختبر', department: 'الجودة', jobTitle: 'فني جودة', basicSalary: 400 } })

  const premix = state.materials[0]!
  const product = state.products[0]!
  const supplier = state.suppliers[0]!
  const customer = state.customers[0]!

  // Set QC limits
  state = must(state, clock, { action: 'setQcLimits', input: { itemType: 'MATERIAL', itemId: premix.id, limits: { maxMoisture: 10 } } })

  // Receive Premix with failed sample
  state = must(state, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId: supplier.id, lines: [{ materialId: premix.id, qty: 100, unitCost: 2 }] },
  })
  const poFail = state.purchaseOrders[0]!
  state = must(state, clock, { action: 'decidePurchaseOrder', input: { id: poFail.id, decision: 'APPROVED' } })
  state = must(state, clock, { action: 'receiveGoods', input: { purchaseOrderId: poFail.id, lines: [{ materialId: premix.id, qty: 100, batchNo: 'PREMIX-FAIL' }] } })

  // 1. High moisture sample causes FAILED status
  state = must(state, clock, {
    action: 'createQualitySample',
    input: { type: 'RAW_MATERIAL', materialId: premix.id, batchNo: 'PREMIX-FAIL', supplierId: supplier.id, moisturePct: 15 },
  }, 'user-qc')
  assert.equal(state.qualitySamples[0]!.result, 'FAILED')

  // Attempt to transfer failed raw batch must fail
  const transferError = fail(state, clock, {
    action: 'transferStock',
    input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: premix.id, batchNo: 'PREMIX-FAIL', qty: 50 }] },
  })
  assert.match(transferError, /مرفوضة/)

  // 2. Second PO and valid batch received, produced, then tested finished lot
  state = must(state, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId: supplier.id, lines: [{ materialId: premix.id, qty: 100, unitCost: 2 }] },
  })
  const poPass = state.purchaseOrders.find((p) => p.status === 'PENDING_APPROVAL')!
  state = must(state, clock, { action: 'decidePurchaseOrder', input: { id: poPass.id, decision: 'APPROVED' } })
  state = must(state, clock, { action: 'receiveGoods', input: { purchaseOrderId: poPass.id, lines: [{ materialId: premix.id, qty: 100, batchNo: 'PREMIX-PASS' }] } })

  state = must(state, clock, {
    action: 'createQualitySample',
    input: { type: 'RAW_MATERIAL', materialId: premix.id, batchNo: 'PREMIX-PASS', supplierId: supplier.id, moisturePct: 8 },
  }, 'user-qc')
  assert.equal(state.qualitySamples.find((s) => s.batchNo === 'PREMIX-PASS')?.result, 'PASSED')

  state = must(state, clock, { action: 'transferStock', input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: premix.id, batchNo: 'PREMIX-PASS', qty: 100 }] } })
  state = must(state, clock, { action: 'createRecipe', input: { productId: product.id, nameAr: 'وصفة بياض', baseOutputQty: 100, items: [{ materialId: premix.id, qty: 100 }] } })
  state = must(state, clock, { action: 'createProductionOrder', input: { productId: product.id, recipeId: state.recipes[0]!.id, plannedQty: 100 } })
  state = must(state, clock, { action: 'completeProduction', input: { productionOrderId: state.productionOrders[0]!.id, operatorId: state.employees[0]!.id, actualOutputQty: 100, actuals: [{ materialId: premix.id, actualQty: 100 }] } })

  const lot = state.lots[0]!

  // 3. Sell lot to customer
  state = must(state, clock, { action: 'createInvoice', input: { customerId: customer.id, lines: [{ productId: product.id, qty: 50, unitPrice: 0.35 }] } })
  const invoiceId = state.invoices[0]!.id
  state = must(state, clock, { action: 'confirmInvoice', input: { id: invoiceId } })

  // 4. Recall the lot
  state = must(state, clock, { action: 'recallLot', input: { lotNo: lot.lotNo, reason: 'اشتباه تلوث مايكوتوكسين' } })
  const hold = state.qualityHolds.find((h) => h.lotNo === lot.lotNo && h.status === 'RECALLED')
  assert.ok(hold, 'Quality hold must be created for recalled lot')
  assert.equal(hold.status, 'RECALLED')

  // 5. Trace verifies lot and customer delivery are connected
  const traced = traceLot(state, lot.lotNo)
  assert.ok(traced)
  assert.ok(traced.customers.some((c) => c.id === customer.id))

  const custTrace = traceCustomer(state, customer.id)
  assert.ok(custTrace.lots.some((l) => l.lotNo === lot.lotNo))
  assert.equal(trialBalance(state).balanced, true)
})

// -----------------------------------------------------------------------------
// CHAIN 5: Order-to-Cash & Delivery (الفاتورة -> الاعتماد -> مراحل التسليم -> التحصيل)
// -----------------------------------------------------------------------------
test('Flow Chain 5: Order-to-Cash, delivery stages, and customer payment collection', () => {
  const clock = createClock('2026-10-01T12:00:00.000Z')
  let state = emptyState('o2c')

  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-1', nameAr: 'خام', category: 'حبوب', minQty: 10, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createProduct', input: { code: 'FG-1', nameAr: 'منتج جاهز', salePrice: 0.5, vatTreatment: 'ZERO', bagKg: 50 } })
  state = must(state, clock, { action: 'createSupplier', input: { nameAr: 'مورد' } })
  state = must(state, clock, { action: 'createCustomer', input: { nameAr: 'عميل مسقط التجاري' } })
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'مشغل', department: 'الإنتاج', jobTitle: 'مشغل', basicSalary: 300 } })

  // Produce 1000kg product
  state = must(state, clock, { action: 'createPurchaseOrder', input: { supplierId: state.suppliers[0]!.id, lines: [{ materialId: state.materials[0]!.id, qty: 1000, unitCost: 0.1 }] } })
  state = must(state, clock, { action: 'decidePurchaseOrder', input: { id: state.purchaseOrders[0]!.id, decision: 'APPROVED' } })
  state = must(state, clock, { action: 'receiveGoods', input: { purchaseOrderId: state.purchaseOrders[0]!.id, lines: [{ materialId: state.materials[0]!.id, qty: 1000, batchNo: 'B1' }] } })
  state = must(state, clock, { action: 'transferStock', input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: state.materials[0]!.id, batchNo: 'B1', qty: 1000 }] } })
  state = must(state, clock, { action: 'createRecipe', input: { productId: state.products[0]!.id, nameAr: 'وصفة', baseOutputQty: 1000, items: [{ materialId: state.materials[0]!.id, qty: 1000 }] } })
  state = must(state, clock, { action: 'createProductionOrder', input: { productId: state.products[0]!.id, recipeId: state.recipes[0]!.id, plannedQty: 1000 } })
  state = must(state, clock, { action: 'completeProduction', input: { productionOrderId: state.productionOrders[0]!.id, operatorId: state.employees[0]!.id, actualOutputQty: 1000, actuals: [{ materialId: state.materials[0]!.id, actualQty: 1000 }] } })

  const customer = state.customers[0]!
  const product = state.products[0]!

  // 1. Create Invoice & Confirm
  state = must(state, clock, { action: 'createInvoice', input: { customerId: customer.id, lines: [{ productId: product.id, qty: 400, unitPrice: 0.5 }] } })
  const invoice = state.invoices[0]!
  assert.equal(invoice.status, 'DRAFT')
  assert.equal(invoice.total, 200)

  state = must(state, clock, { action: 'confirmInvoice', input: { id: invoice.id } })
  const confirmed = state.invoices[0]!
  assert.equal(confirmed.status, 'CONFIRMED')

  // 2. Advance Delivery: LOADER -> DRIVER -> CUSTOMER
  state = must(state, clock, { action: 'advanceInvoiceDelivery', input: { invoiceId: invoice.id, step: 'LOADER', notes: 'تم التحميل في المستودع' } })
  let delivery = state.invoiceDeliveries.find((d) => d.invoiceId === invoice.id)!
  assert.equal(delivery.currentStep, 'LOADER')

  state = must(state, clock, { action: 'advanceInvoiceDelivery', input: { invoiceId: invoice.id, step: 'DRIVER', notes: 'في طريق التسليم' } })
  delivery = state.invoiceDeliveries.find((d) => d.invoiceId === invoice.id)!
  assert.equal(delivery.currentStep, 'DRIVER')

  state = must(state, clock, { action: 'advanceInvoiceDelivery', input: { invoiceId: invoice.id, step: 'CUSTOMER', notes: 'تم التسليم وتوقيع العميل' } })
  delivery = state.invoiceDeliveries.find((d) => d.invoiceId === invoice.id)!
  assert.equal(delivery.currentStep, 'CUSTOMER')

  // 3. Record Payment against invoice
  state = must(state, clock, { action: 'recordPayment', input: { invoiceId: invoice.id, amount: 200, method: 'BANK_TRANSFER' } })
  assert.equal(state.invoices[0]!.paidAmount, 200)
  assert.equal(state.invoices[0]!.status, 'PAID')

  // 4. Sample withdrawal
  state = must(state, clock, {
    action: 'createWithdrawal',
    input: {
      reason: 'عينات ترويجية مجانية',
      lines: [{ productId: product.id, qty: 50 }],
    },
  })
  assert.equal(state.withdrawals.length, 1)
  assert.equal(trialBalance(state).balanced, true)
})

// -----------------------------------------------------------------------------
// CHAIN 6: Fleet & Logistics Cost Allocation (شاحنة -> رحلة توصيل -> طلب توزيع تكلفة -> اعتماد محاسبي)
// -----------------------------------------------------------------------------
test('Flow Chain 6: Fleet management and trip delivery cost allocation to production lots', () => {
  const clock = createClock('2026-10-01T13:00:00.000Z')
  let state = emptyState('fleet-flow')

  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-F', nameAr: 'خام', category: 'حبوب', minQty: 10, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createProduct', input: { code: 'FG-F', nameAr: 'علف', salePrice: 0.4, vatTreatment: 'ZERO', bagKg: 50 } })
  state = must(state, clock, { action: 'createSupplier', input: { nameAr: 'مورد' } })
  state = must(state, clock, { action: 'createCustomer', input: { nameAr: 'عميل بركاء' } })
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'السائق خالد', department: 'النقل', jobTitle: 'سائق شاحنة', basicSalary: 350 } })
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'المشغل', department: 'الإنتاج', jobTitle: 'مشغل', basicSalary: 300 } })

  const driver = state.employees.find((e) => e.jobTitle.includes('سائق'))!
  const operator = state.employees.find((e) => e.jobTitle.includes('مشغل'))!

  // Produce lot
  state = must(state, clock, { action: 'createPurchaseOrder', input: { supplierId: state.suppliers[0]!.id, lines: [{ materialId: state.materials[0]!.id, qty: 2000, unitCost: 0.1 }] } })
  state = must(state, clock, { action: 'decidePurchaseOrder', input: { id: state.purchaseOrders[0]!.id, decision: 'APPROVED' } })
  state = must(state, clock, { action: 'receiveGoods', input: { purchaseOrderId: state.purchaseOrders[0]!.id, lines: [{ materialId: state.materials[0]!.id, qty: 2000, batchNo: 'B-FL' }] } })
  state = must(state, clock, { action: 'transferStock', input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: state.materials[0]!.id, batchNo: 'B-FL', qty: 2000 }] } })
  state = must(state, clock, { action: 'createRecipe', input: { productId: state.products[0]!.id, nameAr: 'وصفة', baseOutputQty: 2000, items: [{ materialId: state.materials[0]!.id, qty: 2000 }] } })
  state = must(state, clock, { action: 'createProductionOrder', input: { productId: state.products[0]!.id, recipeId: state.recipes[0]!.id, plannedQty: 2000 } })
  state = must(state, clock, { action: 'completeProduction', input: { productionOrderId: state.productionOrders[0]!.id, operatorId: operator.id, actualOutputQty: 2000, actuals: [{ materialId: state.materials[0]!.id, actualQty: 2000 }] } })

  // Create invoice and vehicle
  state = must(state, clock, { action: 'createInvoice', input: { customerId: state.customers[0]!.id, lines: [{ productId: state.products[0]!.id, qty: 1000, unitPrice: 0.4 }] } })
  const invoice = state.invoices[0]!
  state = must(state, clock, { action: 'confirmInvoice', input: { id: invoice.id } })

  // 1. Create Vehicle and fuel log
  state = must(state, clock, { action: 'createVehicle', input: { code: 'TRK-01', plateNo: '9988-AA', type: 'TRUCK', nameAr: 'شاحنة مارسيدس' } })
  const vehicle = state.vehicles[0]!
  state = must(state, clock, { action: 'addFuelLog', input: { vehicleId: vehicle.id, driverId: driver.id, date: '2026-10-01', liters: 50, cost: 12, odometer: 1050 } })

  // 2. Create Trip linked to invoice
  state = must(state, clock, {
    action: 'createTrip',
    input: {
      vehicleId: vehicle.id,
      driverId: driver.id,
      date: '2026-10-01',
      destination: 'بركاء',
      km: 60,
      loadKg: 1000,
      fuelLiters: 15,
      invoiceId: invoice.id,
      driverCost: 30,
    },
  })
  const trip = state.trips[0]!

  // 3. Request Trip Cost Allocation
  state = must(state, clock, { action: 'requestTripCostAllocation', input: { tripId: trip.id } })
  const allocRequest = state.tripCostAllocations[0]!
  assert.equal(allocRequest.status, 'PENDING_APPROVAL')

  // 4. Decide trip cost allocation (Accountant approval)
  state = must(state, clock, { action: 'decideTripCostAllocation', input: { id: allocRequest.id, decision: 'APPROVED' } }, 'user-acc')
  assert.equal(state.tripCostAllocations[0]!.status, 'APPROVED')

  // Verify transport cost line was added to lot and trial balance remains balanced
  const updatedLot = state.lots[0]!
  const transportLine = updatedLot.costLines.find((l) => l.type === 'TRANSPORT')
  assert.ok(transportLine, 'Transport cost line must be added to lot')
  assert.equal(trialBalance(state).balanced, true)
})

// -----------------------------------------------------------------------------
// CHAIN 7: Obligations, Financial Ops & Payroll (الالتزامات -> البنك -> المصروفات -> الرواتب)
// -----------------------------------------------------------------------------
test('Flow Chain 7: Financial obligations, bank reconciliation, expense approvals, and payroll processing', () => {
  const clock = createClock('2026-10-01T14:00:00.000Z')
  let state = emptyState('fin')

  state.company.obligationApprovalThreshold = 50000
  state = must(state, clock, { action: 'fundBank', input: { amount: 50000, memo: 'تمويل رأس المال المبدئي' } })
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'أحمد المحاسب', department: 'المالية', jobTitle: 'محاسب عام', basicSalary: 600 } })
  const employee = state.employees[0]!

  // 1. Create company obligation & pay installment
  state = must(state, clock, {
    action: 'createObligation',
    input: {
      beneficiary: 'بنك التنمية العماني',
      description: 'قرض تمويل صوامع الغلال',
      kind: 'LOAN',
      total: 12000,
      installmentAmount: 1000,
      firstDueDate: '2026-10-01',
      frequency: 'MONTHLY',
      numberOfInstallments: 12,
    },
  })
  const obligation = state.obligations[0]!
  assert.equal(obligation.status, 'ACTIVE')
  assert.equal(state.obligationScheduleLines.length, 12)

  // Pay first installment
  const scheduleLine = state.obligationScheduleLines[0]!
  state = must(state, clock, {
    action: 'payObligationInstallment',
    input: {
      scheduleLineId: scheduleLine.id,
      amount: 1000,
      date: '2026-10-01',
      method: 'تحويل بنكي',
      reference: 'REF-101',
    },
  })
  assert.equal(state.obligationPayments.length, 1)
  assert.equal(state.obligationPayments[0]!.amount, 1000)

  // 2. Expense lifecycle
  state = must(state, clock, {
    action: 'createExpense',
    input: {
      category: 'MAINTENANCE',
      description: 'شراء زيوت وفلاتر للضاغط',
      amount: 150,
    },
  })
  const exp = state.expenses[0]!
  state = must(state, clock, { action: 'decideExpense', input: { id: exp.id, decision: 'POSTED' } })
  assert.equal(state.expenses[0]!.status, 'POSTED')

  // 3. Bank transactions & matching to expense
  state = must(state, clock, {
    action: 'recordBankTransaction',
    input: {
      bankAccount: 'OM12345678',
      transactionId: 'TX-BANK-101',
      date: '2026-10-01',
      amount: 150,
      type: 'DEBIT',
      description: 'سداد مصروف صيانة شيك 101',
    },
  })
  const bankTx = state.bankTransactions[0]!
  assert.equal(bankTx.status, 'UNMATCHED')

  state = must(state, clock, {
    action: 'matchBankTransaction',
    input: { transactionId: 'TX-BANK-101', matchTo: { type: 'EXPENSE', id: exp.id } },
  })
  assert.equal(state.bankTransactions[0]!.status, 'MATCHED')

  // 4. Leave request & approval
  state = must(state, clock, {
    action: 'createLeaveRequest',
    input: {
      employeeId: employee.id,
      type: 'ANNUAL',
      from: '2026-10-10',
      to: '2026-10-12',
      days: 2,
      reason: 'ظرف عائلي طارئ',
    },
  })
  const leave = state.leaveRequests[0]!
  state = must(state, clock, { action: 'decideLeaveRequest', input: { id: leave.id, decision: 'APPROVED' } })
  assert.equal(state.leaveRequests[0]!.status, 'APPROVED')

  // 5. Payroll creation, approval, and disbursement
  state = must(state, clock, {
    action: 'createPayroll',
    input: {
      month: '2026-10',
      lines: [{ employeeId: employee.id, overtimeHours: 5, allowances: 50, deductions: 0 }],
    },
  })
  const payroll = state.payrolls[0]!
  assert.equal(payroll.status, 'PENDING_APPROVAL')

  state = must(state, clock, { action: 'decidePayroll', input: { id: payroll.id, decision: 'APPROVED' } })
  assert.equal(state.payrolls[0]!.status, 'APPROVED')

  state = must(state, clock, { action: 'payPayroll', input: { id: payroll.id } })
  assert.equal(state.payrolls[0]!.status, 'PAID')

  // Final check: All double-entry journals generated throughout this chain remain balanced
  assert.equal(trialBalance(state).balanced, true)
})
