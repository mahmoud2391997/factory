import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, applyCommand, defaultClock } from './engine'
import { inventoryIntegrity, packagingCountReport } from './reports'
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
    action: 'createPackagingMaterial',
    input: { code: 'PKG-BAG', nameAr: 'كيس', category: 'BAG', quantity: 1000, unit: 'قطعة', unitCost: 0.02, minStock: 100 },
  })
  return { clock, state, gm, packagingId: state.packagingMaterials[0]!.id }
}

test('a packaging count records the variance and waits for approval', () => {
  const { clock, state, gm, packagingId } = setup()
  let s = state
  s = must(s, gm, clock, {
    action: 'recordPackagingCount',
    input: { packagingMaterialId: packagingId, date: '2026-09-21', countedQty: 950 },
  })
  const count = s.packagingCounts[0]!
  assert.equal(count.status, 'PENDING_APPROVAL')
  assert.equal(count.expectedQty, 1000)
  assert.equal(count.countedQty, 950)
  assert.equal(count.varianceQty, -50)
  assert.equal(count.varianceValue, -1)
  // Stock is not touched until approval.
  assert.equal(s.packagingMaterials[0]!.quantity, 1000)
})

test('approving a count posts a ledger adjustment and records the waste value', () => {
  const clock = createClock('2026-09-21T08:00:00.000Z')
  let s = emptyState('x')
  const gm = actor(s, 'user-gm')
  s = must(s, gm, clock, {
    action: 'createPackagingMaterial',
    input: { code: 'PKG-BAG', nameAr: 'كيس', category: 'BAG', quantity: 1000, unit: 'قطعة', unitCost: 0.02, minStock: 100 },
  })
  const packagingId = s.packagingMaterials[0]!.id
  s = must(s, gm, clock, {
    action: 'recordPackagingCount',
    input: { packagingMaterialId: packagingId, date: '2026-09-21', countedQty: 950 },
  })
  const count = s.packagingCounts[0]!
  s = must(s, gm, clock, { action: 'decidePackagingCount', input: { id: count.id, decision: 'APPROVED' } })
  assert.equal(s.packagingCounts[0]!.status, 'APPROVED')
  // Stock reconciled to the counted quantity.
  assert.equal(s.packagingMaterials[0]!.quantity, 950)
  // A ledger ADJUSTMENT entry was posted (not bypassed).
  const ledgerEntry = s.ledger.find((row) => row.refType === 'packagingCount' && row.refId === count.id)
  assert.ok(ledgerEntry, 'a ledger entry should be posted')
  assert.equal(ledgerEntry!.type, 'ADJUSTMENT')
  assert.equal(ledgerEntry!.newQty, 950)
  // The waste value (50 × 0.02 = 1) was recorded through the journal.
  const journal = s.journals.find((entry) => entry.refType === 'packagingCount' && entry.refId === count.id)
  assert.ok(journal, 'a journal entry should record the waste value')
  assert.ok(journal!.lines.some((line) => line.accountCode === '6300' && line.debit === 1))
  // Inventory integrity holds.
  assert.equal(inventoryIntegrity(s).ok, true)
})

test('rejecting a count leaves stock untouched', () => {
  const { clock, state, gm, packagingId } = setup()
  let s = state
  s = must(s, gm, clock, {
    action: 'recordPackagingCount',
    input: { packagingMaterialId: packagingId, date: '2026-09-21', countedQty: 900 },
  })
  const count = s.packagingCounts[0]!
  s = must(s, gm, clock, { action: 'decidePackagingCount', input: { id: count.id, decision: 'REJECTED' } })
  assert.equal(s.packagingCounts[0]!.status, 'REJECTED')
  assert.equal(s.packagingMaterials[0]!.quantity, 1000)
  assert.equal(s.ledger.filter((row) => row.refType === 'packagingCount').length, 0)
})

test('the per-material report shows in/out, expected vs counted, waste and cost', () => {
  const { clock, state, gm, packagingId } = setup()
  let s = state
  s = must(s, gm, clock, {
    action: 'recordPackagingCount',
    input: { packagingMaterialId: packagingId, date: '2026-09-21', countedQty: 950 },
  })
  const count = s.packagingCounts[0]!
  s = must(s, gm, clock, { action: 'decidePackagingCount', input: { id: count.id, decision: 'APPROVED' } })
  const rows = packagingCountReport(s)
  const row = rows.find((item) => item.packagingMaterialId === packagingId)!
  assert.equal(row.expectedBalance, 950)
  assert.equal(row.lastCountedBalance, 950)
  assert.equal(row.varianceQty, -50)
  assert.equal(row.wasteValue, 1)
})
