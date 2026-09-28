import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, applyCommand, defaultClock, publicState } from './engine'
import { emptyState } from './seed'
import type { Command, ErpState } from './types'

function must(state: ErpState, clock: ReturnType<typeof defaultClock>, command: Command, id = 'user-gm') {
  const actor = actorFromUser(state, id)
  assert.ok(actor)
  const result = applyCommand(state, actor, command, clock)
  if (!result.ok) throw new Error(`${command.action}: ${result.error}`)
  return result.state
}

function fail(state: ErpState, clock: ReturnType<typeof defaultClock>, command: Command, id: string) {
  const actor = actorFromUser(state, id)
  if (!actor) return 'المستخدم غير موجود'
  const result = applyCommand(state, actor, command, clock)
  assert.equal(result.ok, false)
  return result.ok ? '' : result.error
}

test('createObligation requires valid input and generates schedule', () => {
  const clock = defaultClock()
  let state = emptyState('obligations')
  
  state = must(state, clock, {
    action: 'createObligation',
    input: {
      beneficiary: 'بنك عمان',
      description: 'قرض معدات',
      kind: 'LOAN',
      total: 12000,
      installmentAmount: 1000,
      firstDueDate: '2026-10-01',
      frequency: 'MONTHLY',
      numberOfInstallments: 12,
    },
  })
  
  assert.equal(state.obligations.length, 1)
  const obligation = state.obligations[0]!
  assert.equal(obligation.beneficiary, 'بنك عمان')
  assert.equal(obligation.total, 12000)
  assert.equal(obligation.installmentAmount, 1000)
  assert.equal(obligation.status, 'ACTIVE') // Below threshold
  
  assert.equal(state.obligationScheduleLines.length, 12)
  assert.equal(state.obligationScheduleLines[0].dueDate, '2026-10-01')
  assert.equal(state.obligationScheduleLines[0].amount, 1000)
  assert.equal(state.obligationScheduleLines[11].dueDate, '2027-09-01')
})

test('createObligation requires approval when above threshold', () => {
  const clock = defaultClock()
  let state = emptyState('obligations')
  
  state.company.obligationApprovalThreshold = 1000
  
  state = must(state, clock, {
    action: 'createObligation',
    input: {
      beneficiary: 'بنك عمان',
      description: 'قرض كبير',
      kind: 'LOAN',
      total: 5000,
      installmentAmount: 500,
      firstDueDate: '2026-10-01',
      frequency: 'MONTHLY',
      numberOfInstallments: 10,
    },
  })
  
  assert.equal(state.obligations[0].status, 'PENDING_APPROVAL')
  
  const notifications = state.notifications.filter((n) => n.kind === 'APPROVAL' && n.title.includes('التزام مالي'))
  assert.equal(notifications.length, 1)
  assert.ok(notifications[0]?.dedupeKey.includes('obligation-approval'))
})

test('createObligation generates correct schedule for different frequencies', () => {
  const clock = defaultClock()
  let state = emptyState('obligations')
  
  // Quarterly
  state = must(state, clock, {
    action: 'createObligation',
    input: {
      beneficiary: 'مؤجر',
      description: 'إيجار',
      kind: 'RENT',
      total: 12000,
      installmentAmount: 3000,
      firstDueDate: '2026-10-01',
      frequency: 'QUARTERLY',
      numberOfInstallments: 4,
    },
  })
  
  assert.equal(state.obligationScheduleLines.length, 4)
  assert.equal(state.obligationScheduleLines[0].dueDate, '2026-10-01')
  assert.equal(state.obligationScheduleLines[1].dueDate, '2027-01-01')
  assert.equal(state.obligationScheduleLines[2].dueDate, '2027-04-01')
  assert.equal(state.obligationScheduleLines[3].dueDate, '2027-07-01')
})

test('decideObligation approves or cancels obligation', () => {
  const clock = defaultClock()
  let state = emptyState('obligations')
  
  state.company.obligationApprovalThreshold = 100
  
  state = must(state, clock, {
    action: 'createObligation',
    input: {
      beneficiary: 'بنك',
      description: 'قرض',
      kind: 'LOAN',
      total: 500,
      installmentAmount: 100,
      firstDueDate: '2026-10-01',
      frequency: 'MONTHLY',
      numberOfInstallments: 5,
    },
  })
  
  const obligation = state.obligations[0]!
  assert.equal(obligation.status, 'PENDING_APPROVAL')
  
  state = must(state, clock, {
    action: 'decideObligation',
    input: { id: obligation.id, decision: 'APPROVED' },
  })
  
  assert.equal(state.obligations[0].status, 'ACTIVE')
  assert.equal(state.obligations[0].decidedBy, 'user-gm')
  
  // Test cancellation
  state = must(state, clock, {
    action: 'createObligation',
    input: {
      beneficiary: 'بنك 2',
      description: 'قرض 2',
      kind: 'LOAN',
      total: 200,
      installmentAmount: 50,
      firstDueDate: '2026-10-01',
      frequency: 'MONTHLY',
      numberOfInstallments: 4,
    },
  })
  
  const obligation2 = state.obligations[1]!
  state = must(state, clock, {
    action: 'decideObligation',
    input: { id: obligation2.id, decision: 'REJECTED' },
  })
  
  assert.equal(state.obligations[1].status, 'CANCELLED')
})

test('payObligationInstallment creates payment and posts journal', () => {
  const clock = defaultClock()
  let state = emptyState('obligations')
  
  state = must(state, clock, {
    action: 'createObligation',
    input: {
      beneficiary: 'بنك',
      description: 'قرض',
      kind: 'LOAN',
      total: 1000,
      installmentAmount: 200,
      firstDueDate: '2026-10-01',
      frequency: 'MONTHLY',
      numberOfInstallments: 5,
    },
  })
  
  const obligation = state.obligations[0]!
  const scheduleLine = state.obligationScheduleLines[0]!
  
  state = must(state, clock, {
    action: 'payObligationInstallment',
    input: {
      scheduleLineId: scheduleLine.id,
      amount: 200,
      date: '2026-10-01',
      method: 'تحويل بنكي',
      reference: 'REF-123',
    },
  })
  
  assert.equal(state.obligationPayments.length, 1)
  assert.equal(state.obligationPayments[0].amount, 200)
  assert.equal(state.obligationPayments[0].method, 'تحويل بنكي')
  
  assert.equal(state.obligationScheduleLines[0].paidAmount, 200)
  assert.equal(state.obligationScheduleLines[0].status, 'PAID')
  
  assert.equal(state.journals.length, 1)
  const journal = state.journals[0]!
  assert.equal(journal.memo, 'دفع قسط التزام: قرض')
  assert.equal(journal.refType, 'obligationPayment')
  
  // Check journal is balanced
  const debit = journal.lines.reduce((sum, line) => sum + line.debit, 0)
  const credit = journal.lines.reduce((sum, line) => sum + line.credit, 0)
  assert.equal(debit, credit)
})

test('payObligationInstallment rejects overpayment', () => {
  const clock = defaultClock()
  let state = emptyState('obligations')
  
  state = must(state, clock, {
    action: 'createObligation',
    input: {
      beneficiary: 'بنك',
      description: 'قرض',
      kind: 'LOAN',
      total: 1000,
      installmentAmount: 200,
      firstDueDate: '2026-10-01',
      frequency: 'MONTHLY',
      numberOfInstallments: 5,
    },
  })
  
  const scheduleLine = state.obligationScheduleLines[0]!
  
  assert.match(
    fail(state, clock, {
      action: 'payObligationInstallment',
      input: {
        scheduleLineId: scheduleLine.id,
        amount: 300,
        date: '2026-10-01',
        method: 'تحويل بنكي',
      },
    }),
    /يتجاوز المبلغ المتبقي/,
  )
})

test('payObligationInstallment allows partial payments', () => {
  const clock = defaultClock()
  let state = emptyState('obligations')
  
  state = must(state, clock, {
    action: 'createObligation',
    input: {
      beneficiary: 'بنك',
      description: 'قرض',
      kind: 'LOAN',
      total: 1000,
      installmentAmount: 200,
      firstDueDate: '2026-10-01',
      frequency: 'MONTHLY',
      numberOfInstallments: 5,
    },
  })
  
  const scheduleLine = state.obligationScheduleLines[0]!
  
  // Partial payment
  state = must(state, clock, {
    action: 'payObligationInstallment',
    input: {
      scheduleLineId: scheduleLine.id,
      amount: 100,
      date: '2026-10-01',
      method: 'تحويل بنكي',
    },
  })
  
  assert.equal(state.obligationScheduleLines[0].paidAmount, 100)
  assert.equal(state.obligationScheduleLines[0].status, 'PENDING')
  
  // Complete payment
  state = must(state, clock, {
    action: 'payObligationInstallment',
    input: {
      scheduleLineId: scheduleLine.id,
      amount: 100,
      date: '2026-10-15',
      method: 'نقد',
    },
  })
  
  assert.equal(state.obligationScheduleLines[0].paidAmount, 200)
  assert.equal(state.obligationScheduleLines[0].status, 'PAID')
})

test('obligation marks as completed when fully paid', () => {
  const clock = defaultClock()
  let state = emptyState('obligations')
  
  state = must(state, clock, {
    action: 'createObligation',
    input: {
      beneficiary: 'بنك',
      description: 'قرض صغير',
      kind: 'LOAN',
      total: 400,
      installmentAmount: 200,
      firstDueDate: '2026-10-01',
      frequency: 'MONTHLY',
      numberOfInstallments: 2,
    },
  })
  
  const obligation = state.obligations[0]!
  assert.equal(obligation.status, 'ACTIVE')
  
  // Pay first installment
  state = must(state, clock, {
    action: 'payObligationInstallment',
    input: {
      scheduleLineId: state.obligationScheduleLines[0].id,
      amount: 200,
      date: '2026-10-01',
      method: 'تحويل بنكي',
    },
  })
  
  assert.equal(state.obligations[0].status, 'ACTIVE')
  
  // Pay second installment
  state = must(state, clock, {
    action: 'payObligationInstallment',
    input: {
      scheduleLineId: state.obligationScheduleLines[1].id,
      amount: 200,
      date: '2026-11-01',
      method: 'تحويل بنكي',
    },
  })
  
  assert.equal(state.obligations[0].status, 'COMPLETED')
})

test('obligations.pay permission required for payment', () => {
  const clock = defaultClock()
  let state = emptyState('obligations')
  
  state = must(state, clock, {
    action: 'createObligation',
    input: {
      beneficiary: 'بنك',
      description: 'قرض',
      kind: 'LOAN',
      total: 1000,
      installmentAmount: 200,
      firstDueDate: '2026-10-01',
      frequency: 'MONTHLY',
      numberOfInstallments: 5,
    },
  })
  
  const scheduleLine = state.obligationScheduleLines[0]!
  
  assert.match(
    fail(state, clock, {
      action: 'payObligationInstallment',
      input: {
        scheduleLineId: scheduleLine.id,
        amount: 200,
        date: '2026-10-01',
        method: 'تحويل بنكي',
      },
    }, 'user-ops'),
    /صلاحية/,
  )
})

test('trial balance remains balanced after obligation payment', () => {
  const clock = defaultClock()
  let state = emptyState('obligations')
  
  // Fund bank first
  state = must(state, clock, {
    action: 'fundBank',
    input: { amount: 10000, memo: 'رأس مال' },
  })
  
  const tbBefore = state.journals.reduce((sum, je) => {
    const debit = je.lines.reduce((s, l) => s + l.debit, 0)
    const credit = je.lines.reduce((s, l) => s + l.credit, 0)
    return sum + debit - credit
  }, 0)
  assert.equal(tbBefore, 0)
  
  state = must(state, clock, {
    action: 'createObligation',
    input: {
      beneficiary: 'بنك',
      description: 'قرض',
      kind: 'LOAN',
      total: 1000,
      installmentAmount: 200,
      firstDueDate: '2026-10-01',
      frequency: 'MONTHLY',
      numberOfInstallments: 5,
    },
  })
  
  const scheduleLine = state.obligationScheduleLines[0]!
  
  state = must(state, clock, {
    action: 'payObligationInstallment',
    input: {
      scheduleLineId: scheduleLine.id,
      amount: 200,
      date: '2026-10-01',
      method: 'تحويل بنكي',
    },
  })
  
  const tbAfter = state.journals.reduce((sum, je) => {
    const debit = je.lines.reduce((s, l) => s + l.debit, 0)
    const credit = je.lines.reduce((s, l) => s + l.credit, 0)
    return sum + debit - credit
  }, 0)
  assert.equal(tbAfter, 0)
})
