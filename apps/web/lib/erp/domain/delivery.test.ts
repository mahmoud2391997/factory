import assert from 'node:assert/strict'
import test from 'node:test'
import { actorFromUser, applyCommand } from './engine'
import { buildSeedState, createClock } from './seed'

test('delivery starts at accountant, persists all stages, and rejects skipped or repeated stages', () => {
  let state = buildSeedState()
  const actor = actorFromUser(state, 'user-gm')!
  const invoiceId = state.invoices.find(i => i.status !== 'DRAFT')!.id
  const clock = createClock('2026-10-05T10:00:00.000Z')
  const start = applyCommand(state, actor, { action: 'advanceInvoiceDelivery', input: { invoiceId, step: 'ACCOUNTANT' } }, clock)
  assert.ok(start.ok)
  if (!start.ok) return
  state = start.state
  assert.equal(state.invoiceDeliveries[0]!.currentStep, 'ACCOUNTANT')
  assert.deepEqual(state.invoiceDeliveries[0]!.steps.map(s => s.step), ['ACCOUNTANT'])
  for (const step of ['ACCOUNTANT', 'CUSTOMER'] as const) {
    assert.equal(applyCommand(state, actor, { action: 'advanceInvoiceDelivery', input: { invoiceId, step } }, clock).ok, false)
  }
  for (const step of ['LOADER', 'DRIVER', 'CUSTOMER'] as const) {
    const result = applyCommand(state, actor, { action: 'advanceInvoiceDelivery', input: { invoiceId, step } }, clock)
    assert.ok(result.ok)
    if (!result.ok) return
    state = result.state
  }
  assert.deepEqual(state.invoiceDeliveries[0]!.steps.map(s => s.step), ['ACCOUNTANT', 'LOADER', 'DRIVER', 'CUSTOMER'])
  const draft = structuredClone(state)
  draft.invoices.find(i => i.id === invoiceId)!.status = 'DRAFT'
  draft.invoiceDeliveries = []
  assert.equal(applyCommand(draft, actor, { action: 'advanceInvoiceDelivery', input: { invoiceId, step: 'ACCOUNTANT' } }, clock).ok, false)
})
