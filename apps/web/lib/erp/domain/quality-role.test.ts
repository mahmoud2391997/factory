import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, applyCommand, publicState } from './engine'
import { migrateErpState } from './migrate'
import { DEFAULT_ROLE_PERMISSIONS, type RoleKey } from './permissions'
import { createClock, emptyState } from './seed'
import type { Command, ErpState } from './types'

function must(state: ErpState, clock: ReturnType<typeof createClock>, command: Command, id = 'user-gm') {
  const actor = actorFromUser(state, id)
  assert.ok(actor)
  const result = applyCommand(state, actor, command, clock)
  if (!result.ok) throw new Error(`${command.action}: ${result.error}`)
  return result.state
}

function fail(state: ErpState, clock: ReturnType<typeof createClock>, command: Command, id: string) {
  const actor = actorFromUser(state, id)
  assert.ok(actor)
  const result = applyCommand(state, actor, command, clock)
  assert.equal(result.ok, false)
  return result.ok ? '' : result.error
}

test('QUALITY can create samples but cannot release a block or edit limits', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = emptyState('role')
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-Q', nameAr: 'ذرة', category: 'حبوب', minQty: 1, vatTreatment: 'ZERO' } })
  const material = state.materials[0]!
  state = must(state, clock, { action: 'setQcLimits', input: { itemType: 'MATERIAL', itemId: material.id, limits: { maxMoisture: 12 } } })
  assert.match(fail(state, clock, { action: 'setQcLimits', input: { itemType: 'MATERIAL', itemId: material.id, limits: { maxMoisture: 10 } } }, 'user-qc'), /صلاحية/)
  state = must(
    state,
    clock,
    { action: 'createQualitySample', input: { type: 'RAW_MATERIAL', materialId: material.id, batchNo: 'B-Q', moisturePct: 9 } },
    'user-qc',
  )
  assert.equal(state.qualitySamples[0]?.result, 'PASSED')
  assert.match(
    fail(
      state,
      clock,
      {
        action: 'createQualitySample',
        input: { type: 'RAW_MATERIAL', materialId: material.id, batchNo: 'B-Q2', moisturePct: 20, result: 'PASSED', reason: 'تجاوز' },
      },
      'user-qc',
    ),
    /فك الحجز|صلاحية/,
  )
  state = must(
    state,
    clock,
    { action: 'createQualitySample', input: { type: 'RAW_MATERIAL', materialId: material.id, batchNo: 'B-HOLD', moisturePct: 20 } },
    'user-qc',
  )
  const failed = state.qualitySamples.find((sample) => sample.batchNo === 'B-HOLD')!
  assert.equal(failed.result, 'FAILED')
  assert.match(fail(state, clock, { action: 'updateQualityResult', input: { sampleId: failed.id, result: 'PASSED', reason: 'فك' } }, 'user-qc'), /صلاحية/)
  state = must(state, clock, { action: 'updateQualityResult', input: { sampleId: failed.id, result: 'PASSED', reason: 'فك بعد إعادة الفحص' } })
  assert.equal(state.qualitySamples.find((sample) => sample.id === failed.id)?.result, 'PASSED')
})

test('QUALITY cannot see payroll or journals', () => {
  const state = emptyState('role')
  state.journals.push({
    id: 'je',
    number: 'JE-1',
    at: '2026-09-29T04:00:00.000Z',
    memo: 'سر',
    refType: 'x',
    refId: 'x',
    lines: [{ accountCode: '1500', debit: 1, credit: 0 }],
  })
  state.payrolls.push({
    id: 'pay',
    number: 'PAY-1',
    month: '2026-09',
    status: 'PENDING_APPROVAL',
    lines: [],
    totalNet: 0,
    createdBy: 'user-acc',
    createdAt: '2026-09-29T04:00:00.000Z',
  })
  state.employees.push({ id: 'e', code: 'E', nameAr: 'موظف', department: 'عام', jobTitle: 'عامل', basicSalary: 400, active: true })
  const view = publicState(state, state.rolePermissions.QUALITY)
  assert.equal(view.journals.length, 0)
  assert.equal(view.payrolls.length, 0)
  assert.equal('basicSalary' in view.employees[0]!, false)
  assert.equal(view.auditLogs.length, 0)
})

test('a failed sample notifies quality once', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = emptyState('role')
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-N', nameAr: 'ذرة', category: 'حبوب', minQty: 1, vatTreatment: 'ZERO' } })
  const material = state.materials[0]!
  state = must(state, clock, { action: 'setQcLimits', input: { itemType: 'MATERIAL', itemId: material.id, limits: { maxMoisture: 12 } } })
  const input = { type: 'RAW_MATERIAL' as const, materialId: material.id, batchNo: 'B-N', moisturePct: 18 }
  state = must(state, clock, { action: 'createQualitySample', input }, 'user-qc')
  state = must(state, clock, { action: 'createQualitySample', input }, 'user-qc')
  const notes = state.notifications.filter((item) => item.kind === 'QC' && item.dedupeKey?.includes('B-N'))
  assert.equal(notes.length, 1)
  assert.ok(notes[0]?.roles.includes('QUALITY'))
  assert.ok(notes[0]?.roles.includes('GM'))
  assert.ok(notes[0]?.roles.includes('OPERATIONS'))
})

test('a document saved before the quality role gains that role once', () => {
  const state = emptyState('role')
  const permissions = state.rolePermissions as Partial<Record<RoleKey, typeof state.rolePermissions.GM>>
  delete permissions.QUALITY
  state.permissionsVersion = 1
  const migrated = migrateErpState(state)
  assert.ok(migrated.rolePermissions.QUALITY.includes('qc.manage'))
  assert.equal(migrated.rolePermissions.QUALITY.includes('qc.release'), false)
  assert.equal(migrated.rolePermissions.QUALITY.includes('qc.limits'), false)
  assert.deepEqual([...migrated.rolePermissions.QUALITY].sort(), [...DEFAULT_ROLE_PERMISSIONS.QUALITY].sort())
  const snapshot = JSON.stringify(migrated)
  assert.equal(JSON.stringify(migrateErpState(migrated)), snapshot)
})
