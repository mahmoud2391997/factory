import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, applyCommand, annualLeaveBalance, defaultClock } from './engine'
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

test('annual leave enforces yearly balance; unpaid and sick do not consume it', () => {
  const clock = createClock('2026-01-01T08:00:00.000Z')
  let s = emptyState('x')
  const gm = actor(s, 'user-gm')
  s = must(s, gm, clock, { action: 'createEmployee', input: { nameAr: 'موظف', department: 'الإدارة', jobTitle: 'كاتب', basicSalary: 300 } })
  const employeeId = s.employees[0]!.id

  s.company.annualLeaveEntitlementDays = 30
  assert.equal(annualLeaveBalance(s, employeeId, '2026'), 30)

  s = must(s, gm, clock, { action: 'createLeaveRequest', input: { employeeId, type: 'ANNUAL', from: '2026-02-01', to: '2026-02-10', days: 20, reason: 'سفر' } })
  const req1 = s.leaveRequests[0]!
  s = must(s, gm, clock, { action: 'decideLeaveRequest', input: { id: req1.id, decision: 'APPROVED' } })
  assert.equal(annualLeaveBalance(s, employeeId, '2026'), 10)

  // Exceeding remaining annual balance fails.
  const denied = applyCommand(s, gm, { action: 'createLeaveRequest', input: { employeeId, type: 'ANNUAL', from: '2026-03-01', to: '2026-03-15', days: 11, reason: 'سفر' } }, clock)
  assert.equal(denied.ok, false)
  assert.match(denied.error, /المتبقية/)

  // UNPAID and SICK are allowed without balance consumption.
  s = must(s, gm, clock, { action: 'createLeaveRequest', input: { employeeId, type: 'UNPAID', from: '2026-03-01', to: '2026-03-02', days: 2, reason: 'ظرف' } })
  s = must(s, gm, clock, { action: 'createLeaveRequest', input: { employeeId, type: 'SICK', from: '2026-04-01', to: '2026-04-01', days: 1, reason: 'مرض' } })
  assert.equal(annualLeaveBalance(s, employeeId, '2026'), 10)
})

test('overlapping approved leave is rejected', () => {
  const clock = createClock('2026-01-01T08:00:00.000Z')
  let s = emptyState('x')
  const gm = actor(s, 'user-gm')
  s = must(s, gm, clock, { action: 'createEmployee', input: { nameAr: 'موظف', department: 'الإدارة', jobTitle: 'كاتب', basicSalary: 300 } })
  const employeeId = s.employees[0]!.id

  s = must(s, gm, clock, { action: 'createLeaveRequest', input: { employeeId, type: 'ANNUAL', from: '2026-05-01', to: '2026-05-05', days: 5, reason: 'سفر' } })
  const req1 = s.leaveRequests[0]!
  s = must(s, gm, clock, { action: 'decideLeaveRequest', input: { id: req1.id, decision: 'APPROVED' } })

  const denied = applyCommand(s, gm, { action: 'createLeaveRequest', input: { employeeId, type: 'ANNUAL', from: '2026-05-04', to: '2026-05-06', days: 3, reason: 'سفر' } }, clock)
  assert.equal(denied.ok, false)
  assert.match(denied.error, /تتداخل/)
})

test('approved unpaid leave in the month increases payroll deductions', () => {
  const clock = createClock('2026-06-01T08:00:00.000Z')
  let s = emptyState('x')
  const gm = actor(s, 'user-gm')
  s = must(s, gm, clock, { action: 'createEmployee', input: { nameAr: 'موظف', department: 'الإدارة', jobTitle: 'كاتب', basicSalary: 300 } })
  const employeeId = s.employees[0]!.id

  s = must(s, gm, clock, { action: 'createLeaveRequest', input: { employeeId, type: 'UNPAID', from: '2026-06-10', to: '2026-06-11', days: 2, reason: 'ظرف' } })
  const req = s.leaveRequests[0]!
  s = must(s, gm, clock, { action: 'decideLeaveRequest', input: { id: req.id, decision: 'APPROVED' } })

  s = must(s, gm, clock, { action: 'createPayroll', input: { month: '2026-06', lines: [{ employeeId, overtimeHours: 0, allowances: 0, deductions: 0 }] } })
  const run = s.payrolls[0]!
  const line = run.lines.find((row) => row.employeeId === employeeId)!
  // 300 / 30 * 2 days = 20 OMR
  assert.equal(line.deductions, 20)
  assert.equal(line.net, 280)
})

test('operations cannot approve leave requests by default', () => {
  const clock = createClock('2026-01-01T08:00:00.000Z')
  let s = emptyState('x')
  const gm = actor(s, 'user-gm')
  const ops = actor(s, 'user-ops')
  s = must(s, gm, clock, { action: 'createEmployee', input: { nameAr: 'موظف', department: 'الإدارة', jobTitle: 'كاتب', basicSalary: 300 } })
  const employeeId = s.employees[0]!.id

  s = must(s, gm, clock, { action: 'createLeaveRequest', input: { employeeId, type: 'ANNUAL', from: '2026-02-01', to: '2026-02-01', days: 1, reason: 'ظرف' } })
  const request = s.leaveRequests[0]!
  const denied = applyCommand(s, ops, { action: 'decideLeaveRequest', input: { id: request.id, decision: 'APPROVED' } }, clock)
  assert.equal(denied.ok, false)
  assert.match(denied.error, /غير مصرح/)
})

