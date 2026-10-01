import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, applyCommand, defaultClock } from './engine'
import { createClock, emptyState } from './seed'
import type { Actor, ErpState } from './types'

function actor(state: ErpState, id: string): Actor {
  const found = actorFromUser(state, id)
  assert.ok(found)
  return found
}

function must(state: ErpState, who: Actor, clock: ReturnType<typeof defaultClock>, command: Parameters<typeof applyCommand>[2]) {
  const result = applyCommand(state, who, command, clock)
  if (!result.ok) throw new Error(result.error)
  return result.state
}

function setup() {
  const clock = createClock('2026-09-21T08:00:00.000Z')
  let state = emptyState('x')
  const gm = actor(state, 'user-gm')
  state = must(state, gm, clock, {
    action: 'createMaterial',
    input: { code: 'RM-TEST', nameAr: 'اختبار', category: 'حبوب', minQty: 1, vatTreatment: 'ZERO' },
  })
  state = must(state, gm, clock, { action: 'createSupplier', input: { nameAr: 'مورد أول' } })
  state = must(state, gm, clock, { action: 'createSupplier', input: { nameAr: 'مورد ثانٍ' } })
  return { clock, state, gm, materialId: state.materials[0]!.id, supplierA: state.suppliers[0]!.id, supplierB: state.suppliers[1]!.id }
}

test('purchase request flows draft → quoting → selected → approved → converted', () => {
  const { clock, state, gm, materialId, supplierA, supplierB } = setup()
  let s = state
  s = must(s, gm, clock, {
    action: 'createPurchaseRequest',
    input: { purpose: 'MATERIAL', lines: [{ materialId, qty: 100 }] },
  })
  const request = s.purchaseRequests[0]!
  assert.equal(request.status, 'DRAFT')
  assert.equal(request.approvalTier, 'OPERATIONS')
  assert.equal(request.lines[0]!.lastUnitCost, 0)

  s = must(s, gm, clock, {
    action: 'addSupplierQuotation',
    input: { requestId: request.id, supplierId: supplierA, deliveryCost: 5, lines: [{ materialId, qty: 100, unitCost: 1 }] },
  })
  assert.equal(s.purchaseRequests[0]!.status, 'QUOTING')
  const quoteA = s.supplierQuotations.find((item) => item.supplierId === supplierA)!
  assert.equal(quoteA.total, 105)

  s = must(s, gm, clock, {
    action: 'addSupplierQuotation',
    input: { requestId: request.id, supplierId: supplierB, deliveryCost: 0, lines: [{ materialId, qty: 100, unitCost: 0.9 }] },
  })
  const quoteB = s.supplierQuotations.find((item) => item.supplierId === supplierB)!
  assert.equal(quoteB.total, 90)

  // Selecting the higher quote without a reason fails.
  const noReason = applyCommand(s, gm, {
    action: 'selectSupplierQuotation',
    input: { requestId: request.id, quotationId: quoteA.id },
  }, clock)
  assert.equal(noReason.ok, false)

  s = must(s, gm, clock, {
    action: 'selectSupplierQuotation',
    input: { requestId: request.id, quotationId: quoteB.id },
  })
  assert.equal(s.purchaseRequests[0]!.status, 'SELECTED')
  assert.equal(s.purchaseRequests[0]!.selectedQuotationId, quoteB.id)

  s = must(s, gm, clock, { action: 'decidePurchaseRequest', input: { id: request.id, decision: 'APPROVED' } })
  assert.equal(s.purchaseRequests[0]!.status, 'APPROVED')

  s = must(s, gm, clock, { action: 'convertRequestToPurchaseOrder', input: { id: request.id } })
  assert.equal(s.purchaseRequests[0]!.status, 'CONVERTED')
  const po = s.purchaseOrders[0]!
  assert.equal(po.purchaseRequestId, request.id)
  assert.equal(po.supplierId, supplierB)
  assert.equal(po.lines[0]!.unitCost, 0.9)
})

test('a request above the operations threshold needs GM approval', () => {
  const { clock, state, gm, materialId, supplierA } = setup()
  let s = state
  s = must(s, gm, clock, {
    action: 'createPurchaseRequest',
    input: { purpose: 'MATERIAL', lines: [{ materialId, qty: 5000 }] },
  })
  const request = s.purchaseRequests[0]!
  // No receipt yet, so the estimate is 0 → OPERATIONS tier. Add a receipt first.
  assert.equal(request.approvalTier, 'OPERATIONS')
  s = must(s, gm, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId: supplierA, lines: [{ materialId, qty: 10, unitCost: 2 }] },
  })
  const otherPo = s.purchaseOrders[0]!
  s = must(s, gm, clock, { action: 'decidePurchaseOrder', input: { id: otherPo.id, decision: 'APPROVED' } })
  s = must(s, gm, clock, {
    action: 'receiveGoods',
    input: { purchaseOrderId: otherPo.id, lines: [{ materialId, qty: 10, batchNo: 'B1' }] },
  })

  s = must(s, gm, clock, {
    action: 'createPurchaseRequest',
    input: { purpose: 'MATERIAL', lines: [{ materialId, qty: 5000 }] },
  })
  const big = s.purchaseRequests[0]!
  assert.equal(big.lines[0]!.lastUnitCost, 2)
  assert.equal(big.approvalTier, 'GM')

  s = must(s, gm, clock, {
    action: 'addSupplierQuotation',
    input: { requestId: big.id, supplierId: supplierA, lines: [{ materialId, qty: 5000, unitCost: 2 }] },
  })
  const quote = s.supplierQuotations[0]!
  s = must(s, gm, clock, { action: 'selectSupplierQuotation', input: { requestId: big.id, quotationId: quote.id } })

  // OPERATIONS cannot approve a GM-tier request.
  const ops = actor(s, 'user-ops')
  const denied = applyCommand(s, ops, { action: 'decidePurchaseRequest', input: { id: big.id, decision: 'APPROVED' } }, clock)
  assert.equal(denied.ok, false)
  assert.match(denied.error, /المدير العام/)

  s = must(s, gm, clock, { action: 'decidePurchaseRequest', input: { id: big.id, decision: 'APPROVED' } })
  assert.equal(s.purchaseRequests[0]!.status, 'APPROVED')
})

test('goods receipt stays linked back to the purchase request', () => {
  const { clock, state, gm, materialId, supplierB } = setup()
  let s = state
  s = must(s, gm, clock, {
    action: 'createPurchaseRequest',
    input: { purpose: 'MATERIAL', lines: [{ materialId, qty: 50 }] },
  })
  const request = s.purchaseRequests[0]!
  s = must(s, gm, clock, {
    action: 'addSupplierQuotation',
    input: { requestId: request.id, supplierId: supplierB, lines: [{ materialId, qty: 50, unitCost: 1 }] },
  })
  const quote = s.supplierQuotations[0]!
  s = must(s, gm, clock, { action: 'selectSupplierQuotation', input: { requestId: request.id, quotationId: quote.id } })
  s = must(s, gm, clock, { action: 'decidePurchaseRequest', input: { id: request.id, decision: 'APPROVED' } })
  s = must(s, gm, clock, { action: 'convertRequestToPurchaseOrder', input: { id: request.id } })
  const po = s.purchaseOrders[0]!
  s = must(s, gm, clock, { action: 'decidePurchaseOrder', input: { id: po.id, decision: 'APPROVED' } })
  s = must(s, gm, clock, {
    action: 'receiveGoods',
    input: { purchaseOrderId: po.id, lines: [{ materialId, qty: 50, batchNo: 'B-REQ' }] },
  })
  const receipt = s.goodsReceipts[0]!
  assert.equal(receipt.purchaseOrderId, po.id)
  assert.equal(receipt.purchaseRequestId, request.id)
})

test('quotation lines must match the request and totals include delivery', () => {
  const { clock, state, gm, materialId, supplierA } = setup()
  let s = state
  s = must(s, gm, clock, {
    action: 'createPurchaseRequest',
    input: { purpose: 'MATERIAL', lines: [{ materialId, qty: 10 }] },
  })
  const request = s.purchaseRequests[0]!
  const badLine = applyCommand(s, gm, {
    action: 'addSupplierQuotation',
    input: { requestId: request.id, supplierId: supplierA, lines: [{ materialId: 'missing', qty: 10, unitCost: 1 }] },
  }, clock)
  assert.equal(badLine.ok, false)

  s = must(s, gm, clock, {
    action: 'addSupplierQuotation',
    input: { requestId: request.id, supplierId: supplierA, deliveryCost: 2.5, lines: [{ materialId, qty: 10, unitCost: 1 }] },
  })
  const quote = s.supplierQuotations[0]!
  assert.equal(quote.total, 12.5)
  assert.equal(quote.deliveryCost, 2.5)
})
