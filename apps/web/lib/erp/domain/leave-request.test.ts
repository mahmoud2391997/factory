import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, annualLeaveBalance, applyCommand, defaultClock } from './engine'
import { muscatDay } from './reports'
import { buildSeedState, createClock } from './seed'
import type { Actor, ErpState } from './types'

function actor(state: ErpState, id: string): Actor {
  const found = actorFromUser(state, id)
  assert.ok(found)
  return found
}

test('annual leave balance deducts approved ANNUAL days in the same year', () => {
  let state = buildSeedState()
  const clock = createClock('2026-01-02T04:00:00.000Z')
  const gm = actor(state, 'user-gm')
  const employee = state.employees.find((item) => item.active)!
  const entitlement = state.company.annualLeaveEntitlementDays ?? 30
  assert.equal(annualLeaveBalance(state, employee.id, '2026'), entitlement)

  const created = applyCommand(
    state,
    gm,
    {
      action: 'createLeaveRequest',
      input: { employeeId: employee.id, type: 'ANNUAL', from: '2026-02-01', to: '2026-02-07', days: 7, reason: 'عائلة' },
    },
    clock,
  )
  assert.equal(created.ok, true)
  state = created.state
  const request = state.leaveRequests[0]!

  const approved = applyCommand(state, gm, { action: 'decideLeaveRequest', input: { id: request.id, decision: 'APPROVED' } }, clock)
  assert.equal(approved.ok, true)
  state = approved.state

  assert.equal(annualLeaveBalance(state, employee.id, '2026'), entitlement - 7)

  const over = applyCommand(
    state,
    gm,
    {
      action: 'createLeaveRequest',
      input: { employeeId: employee.id, type: 'ANNUAL', from: '2026-12-01', to: '2026-12-31', days: 30, reason: 'نهاية السنة' },
    },
    clock,
  )
  assert.equal(over.ok, false)
  assert.match(over.error, /المتبقية/)
})

test('overlapping leave with an approved request is rejected', () => {
  let state = buildSeedState()
  const clock = createClock('2026-03-01T04:00:00.000Z')
  const gm = actor(state, 'user-gm')
  const employee = state.employees.find((item) => item.active)!

  const first = applyCommand(
    state,
    gm,
    {
      action: 'createLeaveRequest',
      input: { employeeId: employee.id, type: 'ANNUAL', from: '2026-04-10', to: '2026-04-20', days: 11, reason: 'سفر' },
    },
    clock,
  )
  assert.equal(first.ok, true)
  state = first.state
  const firstRequest = state.leaveRequests[0]!
  const approved = applyCommand(state, gm, { action: 'decideLeaveRequest', input: { id: firstRequest.id, decision: 'APPROVED' } }, clock)
  assert.equal(approved.ok, true)
  state = approved.state

  const overlapping = applyCommand(
    state,
    gm,
    {
      action: 'createLeaveRequest',
      input: { employeeId: employee.id, type: 'SICK', from: '2026-04-15', to: '2026-04-25', days: 11, reason: 'مرض' },
    },
    clock,
  )
  assert.equal(overlapping.ok, false)
  assert.equal(overlapping.error, 'توجد إجازة معتمدة تتداخل مع هذه الفترة')
})

test('approved UNPAID leave is deducted from the monthly payroll line', () => {
  let state = buildSeedState()
  const clock = createClock('2026-05-01T04:00:00.000Z')
  const gm = actor(state, 'user-gm')
  const employee = state.employees[0]!
  const month = '2026-05'

  const created = applyCommand(
    state,
    gm,
    {
      action: 'createLeaveRequest',
      input: { employeeId: employee.id, type: 'UNPAID', from: '2026-05-05', to: '2026-05-07', days: 3, reason: 'ظروف شخصية' },
    },
    clock,
  )
  assert.equal(created.ok, true)
  state = created.state
  const request = state.leaveRequests[0]!
  const approved = applyCommand(state, gm, { action: 'decideLeaveRequest', input: { id: request.id, decision: 'APPROVED' } }, clock)
  assert.equal(approved.ok, true)
  state = approved.state

  const unpaidDeductionExpected = (employee.basicSalary / 30) * 3
  const payrollCreated = applyCommand(
    state,
    gm,
    {
      action: 'createPayroll',
      input: {
        month,
        lines: [{ employeeId: employee.id, overtimeHours: 0, allowances: 0, deductions: 0 }],
      },
    },
    clock,
  )
  assert.equal(payrollCreated.ok, true)
  state = payrollCreated.state
  const payroll = state.payrolls[0]!
  const line = payroll.lines.find((l) => l.employeeId === employee.id)!
  assert.ok(Math.abs(line.deductions - unpaidDeductionExpected) < 0.001)
  const netExpected = employee.basicSalary - unpaidDeductionExpected
  assert.ok(Math.abs(line.net - netExpected) < 0.001)
})

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
