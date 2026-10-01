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
  state = must(state, gm, clock, { action: 'createSupplier', input: { nameAr: 'مورد' } })
  return { clock, state, gm, materialId: state.materials[0]!.id, supplierId: state.suppliers[0]!.id }
}

function poTotal(order: { lines: Array<{ qty: number; unitCost: number }> }) {
  return order.lines.reduce((sum, line) => sum + line.qty * line.unitCost, 0)
}

test('operations may approve a PO exactly at the tier but not above it', () => {
  const { clock, state, gm, materialId, supplierId } = setup()
  let s = state
  // Exactly 100 OMR (default tier boundary) → OPERATIONS may approve.
  s = must(s, gm, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId, lines: [{ materialId, qty: 1000, unitCost: 0.1 }] },
  })
  const atTier = s.purchaseOrders[0]!
  assert.equal(poTotal(atTier), 100)
  const opsApprove = applyCommand(s, actor(s, 'user-ops'), { action: 'decidePurchaseOrder', input: { id: atTier.id, decision: 'APPROVED' } }, clock)
  assert.equal(opsApprove.ok, true)

  // Just above the tier → OPERATIONS rejected, GM accepted.
  s = must(s, gm, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId, lines: [{ materialId, qty: 1001, unitCost: 0.1 }] },
  })
  const above = s.purchaseOrders[0]!
  assert.ok(poTotal(above) > 100)
  const opsDenied = applyCommand(s, actor(s, 'user-ops'), { action: 'decidePurchaseOrder', input: { id: above.id, decision: 'APPROVED' } }, clock)
  assert.equal(opsDenied.ok, false)
  assert.match(opsDenied.error, /المدير العام/)
  s = must(s, gm, clock, { action: 'decidePurchaseOrder', input: { id: above.id, decision: 'APPROVED' } })
  assert.equal(s.purchaseOrders.find((o) => o.id === above.id)!.status, 'APPROVED')
})

test('custom company tiers override the default', () => {
  const { clock, state, gm, materialId, supplierId } = setup()
  let s = state
  s = must(s, gm, clock, { action: 'updateCompany', input: { poApprovalTiers: [{ upTo: 50, requiredRole: 'OPERATIONS' }] } })
  // 60 OMR is above the custom 50 tier → OPERATIONS rejected.
  s = must(s, gm, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId, lines: [{ materialId, qty: 600, unitCost: 0.1 }] },
  })
  const po = s.purchaseOrders[0]!
  assert.equal(poTotal(po), 60)
  const opsDenied = applyCommand(s, actor(s, 'user-ops'), { action: 'decidePurchaseOrder', input: { id: po.id, decision: 'APPROVED' } }, clock)
  assert.equal(opsDenied.ok, false)
  // 40 OMR is within the custom tier → OPERATIONS accepted.
  s = must(s, gm, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId, lines: [{ materialId, qty: 400, unitCost: 0.1 }] },
  })
  const small = s.purchaseOrders[0]!
  const opsOk = applyCommand(s, actor(s, 'user-ops'), { action: 'decidePurchaseOrder', input: { id: small.id, decision: 'APPROVED' } }, clock)
  assert.equal(opsOk.ok, true)
})

test('maintenance and spare-part purchases cannot move before approval', () => {
  const { clock, state, gm, materialId, supplierId } = setup()
  let s = state
  // A spare-part request cannot be converted before approval.
  s = must(s, gm, clock, {
    action: 'createPurchaseRequest',
    input: { purpose: 'SPARE_PART', lines: [{ materialId, qty: 10 }] },
  })
  const request = s.purchaseRequests[0]!
  s = must(s, gm, clock, {
    action: 'addSupplierQuotation',
    input: { requestId: request.id, supplierId, lines: [{ materialId, qty: 10, unitCost: 1 }] },
  })
  const quote = s.supplierQuotations[0]!
  s = must(s, gm, clock, { action: 'selectSupplierQuotation', input: { requestId: request.id, quotationId: quote.id } })
  const earlyConvert = applyCommand(s, gm, { action: 'convertRequestToPurchaseOrder', input: { id: request.id } }, clock)
  assert.equal(earlyConvert.ok, false)
  assert.match(earlyConvert.error, /قبل اعتماده/)

  // A maintenance PO cannot be received before approval.
  s = must(s, gm, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId, purpose: 'MAINTENANCE', lines: [{ materialId, qty: 10, unitCost: 1 }] },
  })
  const po = s.purchaseOrders[0]!
  const earlyReceive = applyCommand(s, gm, {
    action: 'receiveGoods',
    input: { purchaseOrderId: po.id, lines: [{ materialId, qty: 10, batchNo: 'B1' }] },
  }, clock)
  assert.equal(earlyReceive.ok, false)
  assert.match(earlyReceive.error, /قبل اعتماد/)

  // After approval both work.
  s = must(s, gm, clock, { action: 'decidePurchaseOrder', input: { id: po.id, decision: 'APPROVED' } })
  s = must(s, gm, clock, {
    action: 'receiveGoods',
    input: { purchaseOrderId: po.id, lines: [{ materialId, qty: 10, batchNo: 'B1' }] },
  })
  assert.equal(s.purchaseOrders.find((o) => o.id === po.id)!.status, 'RECEIVED')
})

test('a rejected purchase request cannot be converted', () => {
  const { clock, state, gm, materialId, supplierId } = setup()
  let s = state
  s = must(s, gm, clock, {
    action: 'createPurchaseRequest',
    input: { purpose: 'MATERIAL', lines: [{ materialId, qty: 10 }] },
  })
  const request = s.purchaseRequests[0]!
  s = must(s, gm, clock, {
    action: 'addSupplierQuotation',
    input: { requestId: request.id, supplierId, lines: [{ materialId, qty: 10, unitCost: 1 }] },
  })
  const quote = s.supplierQuotations[0]!
  s = must(s, gm, clock, { action: 'selectSupplierQuotation', input: { requestId: request.id, quotationId: quote.id } })
  s = must(s, gm, clock, { action: 'decidePurchaseRequest', input: { id: request.id, decision: 'REJECTED' } })
  const converted = applyCommand(s, gm, { action: 'convertRequestToPurchaseOrder', input: { id: request.id } }, clock)
  assert.equal(converted.ok, false)
})
