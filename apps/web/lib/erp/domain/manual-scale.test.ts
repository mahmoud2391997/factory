import assert from 'node:assert/strict'
import { test } from 'node:test'
import { actorFromUser, applyCommand } from './engine'
import { createClock, emptyState } from './seed'
import type { Command } from './types'

function fixture() {
  const clock = createClock('2026-10-16T08:00:00.000Z')
  let state = emptyState('synthetic-test-only')
  function command(command: Command, id = 'user-gm') {
    const actor = actorFromUser(state, id)!
    const result = applyCommand(state, actor, command, clock)
    if (result.ok) state = result.state
    return result
  }
  for (const entry of [
    { action: 'createMaterial', input: { code: 'MANUAL-RM', nameAr: 'خامة اختبار', category: 'اختبار', minQty: 0, vatTreatment: 'ZERO' } },
    { action: 'createProduct', input: { code: 'MANUAL-FG', nameAr: 'منتج اختبار', salePrice: 1, vatTreatment: 'ZERO', bagKg: 50 } },
  ] as Command[]) assert(command(entry).ok)
  const materialId = state.materials[0]!.id, productId = state.products[0]!.id
  assert(command({ action: 'createRecipe', input: { productId, nameAr: 'وصفة اختبار', baseOutputQty: 100, items: [{ materialId, qty: 100 }] } }).ok)
  assert(command({ action: 'createProductionOrder', input: { productId, recipeId: state.recipes[0]!.id, plannedQty: 100 } }).ok)
  const input = { materialId, productionOrderId: state.productionOrders[0]!.id, scaleId: 'MANUAL', actualQty: 100 }
  return { command, input, state: () => state }
}

test('manual gross minus tare records net, operator and auditable original measurements', () => {
  const f = fixture()
  assert(f.command({ action: 'recordScaleReading', input: { ...f.input, grossQty: 160.125, tareQty: 60.125 } }, 'user-production').ok)
  const reading = f.state().scaleReadings[0]!
  assert.equal(reading.actualQty, 100)
  assert.equal(reading.grossQty, 160.125)
  assert.equal(reading.tareQty, 60.125)
  assert.equal(reading.operatorId, 'user-production')
  assert.equal(reading.usedForProduction, true)
  assert.match(f.state().auditLogs[0]!.detail, /صافي 100.*إجمالي 160.125.*فارغ 60.125/)
})

test('manual net-only remains supported and driver cannot write either mode', () => {
  const f = fixture()
  assert.equal(f.command({ action: 'recordScaleReading', input: f.input }, 'user-driver').ok, false)
  assert.equal(f.state().scaleReadings.length, 0)
  assert(f.command({ action: 'recordScaleReading', input: f.input }, 'user-production').ok)
  assert.equal(f.state().scaleReadings[0]!.grossQty, undefined)
})

test('manual weighing rejects partial, nonfinite, negative, reversed or mismatched measurements without a reading', () => {
  for (const extra of [
    { grossQty: 160 }, { tareQty: 60 }, { grossQty: NaN, tareQty: 60 },
    { grossQty: Infinity, tareQty: 60 }, { grossQty: -1, tareQty: 0 },
    { grossQty: 60, tareQty: 160 }, { grossQty: 160, tareQty: -60 },
    { grossQty: 160, tareQty: 50 }, { grossQty: Number.MAX_VALUE, tareQty: 0 },
    { actualQty: NaN }, { actualQty: Infinity }, { actualQty: -1 },
  ]) {
    const f = fixture(), beforeAudit = f.state().auditLogs.length
    assert.equal(f.command({ action: 'recordScaleReading', input: { ...f.input, ...extra } }).ok, false)
    assert.equal(f.state().scaleReadings.length, 0)
    assert.equal(f.state().auditLogs.length, beforeAudit)
  }
})

test('scale event replay remains idempotent and changed gross/tare evidence cannot reuse its event', () => {
  const f = fixture()
  const input = { ...f.input, eventId: 'manual-ticket-1', grossQty: 160, tareQty: 60 }
  assert(f.command({ action: 'recordScaleReading', input }).ok)
  assert(f.command({ action: 'recordScaleReading', input }).ok)
  assert.equal(f.state().scaleReadings.length, 1)
  assert.equal(f.command({ action: 'recordScaleReading', input: { ...input, grossQty: 170, tareQty: 70 } }).ok, false)
  assert.equal(f.state().scaleReadings.length, 1)
})
