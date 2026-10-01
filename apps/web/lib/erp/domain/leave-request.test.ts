import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, applyCommand, defaultClock } from './engine'
import { muscatDay } from './reports'
import { buildSeedState, createClock } from './seed'
import type { Actor, ErpState } from './types'

function actor(state: ErpState, id: string): Actor {
  const found = actorFromUser(state, id)
  assert.ok(found)
  return found
}

test('operations cannot approve leave requests by default', () => {
  let state = buildSeedState()
  const clock = createClock()
  const gm = actor(state, 'user-gm')
  const ops = actor(state, 'user-ops')
  const employee = state.employees.find((item) => item.active)!
  const today = muscatDay(clock.now())
  const nextWeek = muscatDay(new Date(Date.parse(clock.now()) + 7 * 86_400_000).toISOString())
  const created = applyCommand(
    state,
    gm,
    {
      action: 'createLeaveRequest',
      input: {
        employeeId: employee.id,
        type: 'ANNUAL',
        from: today,
        to: nextWeek,
        days: 7,
        reason: 'عائلة',
      },
    },
    clock,
  )
  assert.equal(created.ok, true)
  state = created.state
  const request = state.leaveRequests.find((item) => item.employeeId === employee.id)!
  assert.equal(request.status, 'PENDING_APPROVAL')

  const denied = applyCommand(
    state,
    ops,
    { action: 'decideLeaveRequest', input: { id: request.id, decision: 'APPROVED' } },
    clock,
  )
  assert.equal(denied.ok, false)
  assert.equal(denied.error, 'ليست لديك صلاحية لهذا الإجراء')
})

test('createLeaveRequest validates Arabic inputs end-to-end', () => {
  const state = buildSeedState()
  const clock = createClock()
  const acc = actor(state, 'user-acc')
  const employee = state.employees.find((item) => item.active)!

  const noReason = applyCommand(
    state,
    acc,
    {
      action: 'createLeaveRequest',
      input: { employeeId: employee.id, type: 'SICK', from: '2026-01-10', to: '2026-01-12', days: 3, reason: '   ' },
    },
    clock,
  )
  assert.equal(noReason.ok, false)
  assert.equal(noReason.error, 'سبب الإجازة مطلوب')

  const badDates = applyCommand(
    state,
    acc,
    {
      action: 'createLeaveRequest',
      input: { employeeId: employee.id, type: 'UNPAID', from: 'not-a-day', to: 'nope', days: 1, reason: 'طارئ' },
    },
    clock,
  )
  assert.equal(badDates.ok, false)
  assert.equal(badDates.error, 'تواريخ الإجازة غير صحيحة')

  const toBeforeFrom = applyCommand(
    state,
    acc,
    {
      action: 'createLeaveRequest',
      input: { employeeId: employee.id, type: 'OTHER', from: '2026-02-10', to: '2026-02-05', days: 2, reason: 'شخصي' },
    },
    clock,
  )
  assert.equal(toBeforeFrom.ok, false)
  assert.equal(toBeforeFrom.error, 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية')
})
