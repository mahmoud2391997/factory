import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, applyCommand } from './engine'
import { createClock, emptyState } from './seed'
import type { Actor, Command, ErpState } from './types'

function actor(state: ErpState): Actor {
  const found = actorFromUser(state, 'user-gm')
  assert.ok(found)
  return found
}

function run(state: ErpState, clock: ReturnType<typeof createClock>, command: Command) {
  return applyCommand(state, actor(state), command, clock)
}

function must(state: ErpState, clock: ReturnType<typeof createClock>, command: Command) {
  const result = run(state, clock, command)
  if (!result.ok) throw new Error(`${command.action}: ${result.error}`)
  return result.state
}

test('recordBankTransaction rejects empty or nonsensical input', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  const state = emptyState('bank')

  const empty = run(state, clock, {
    action: 'recordBankTransaction',
    input: { bankAccount: '', transactionId: '', date: '', amount: 0, type: 'CREDIT', description: '' },
  })
  assert.equal(empty.ok, false)

  const zeroAmount = run(state, clock, {
    action: 'recordBankTransaction',
    input: { bankAccount: 'BO-1', transactionId: 'T-1', date: '2026-09-29', amount: 0, type: 'CREDIT', description: 'x' },
  })
  assert.equal(zeroAmount.ok, false)

  const badDate = run(state, clock, {
    action: 'recordBankTransaction',
    input: { bankAccount: 'BO-1', transactionId: 'T-1', date: '29/09/2026', amount: 50, type: 'CREDIT', description: 'x' },
  })
  assert.equal(badDate.ok, false)

  const wrongType = run(state, clock, {
    action: 'recordBankTransaction',
    input: { bankAccount: 'BO-1', transactionId: 'T-1', date: '2026-09-29', amount: 50, type: 'TRANSFER' as 'CREDIT', description: 'x' },
  })
  assert.equal(wrongType.ok, false)

  assert.equal(state.bankTransactions.length, 0)
})

test('recordBankTransaction stores a valid transaction unmatched and blocks duplicate ids', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = emptyState('bank')

  state = must(state, clock, {
    action: 'recordBankTransaction',
    input: { bankAccount: 'BO-1', transactionId: 'T-100', date: '2026-09-29', amount: 50, type: 'CREDIT', description: 'تحويل غير معروف' },
  })
  const stored = state.bankTransactions[0]!
  assert.equal(stored.status, 'UNMATCHED')
  assert.equal(stored.matched, false)
  assert.equal(stored.date, '2026-09-29')

  const duplicate = run(state, clock, {
    action: 'recordBankTransaction',
    input: { bankAccount: 'BO-1', transactionId: 'T-100', date: '2026-09-29', amount: 50, type: 'CREDIT', description: 'm' },
  })
  assert.equal(duplicate.ok, false)
  assert.equal(state.bankTransactions.length, 1)
})

test('a credit naming a customer auto-matches their open invoice', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = emptyState('bank')
  state = must(state, clock, { action: 'createProduct', input: { code: 'FG-B', nameAr: 'علف', salePrice: 20, vatTreatment: 'ZERO', bagKg: 50 } })
  state = must(state, clock, { action: 'createCustomer', input: { nameAr: 'مزارع الاختبار' } })
  state = must(state, clock, {
    action: 'createInvoice',
    input: { customerId: state.customers[0]!.id, lines: [{ productId: state.products[0]!.id, qty: 5 }] },
  })
  const invoice = state.invoices[0]!

  state = must(state, clock, {
    action: 'recordBankTransaction',
    input: {
      bankAccount: 'BO-1',
      transactionId: 'T-200',
      date: '2026-09-29',
      amount: invoice.total,
      type: 'CREDIT',
      description: `تحويل من ${state.customers[0]!.nameAr}`,
    },
  })
  const stored = state.bankTransactions[0]!
  assert.equal(stored.status, 'MATCHED')
  assert.equal(stored.matchedBy, 'SYSTEM')
  assert.equal(stored.matchedTo?.type, 'INVOICE')
  assert.equal(stored.matchedTo?.id, invoice.id)
})

test('matchBankTransaction rejects a target that does not exist', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = emptyState('bank')
  state = must(state, clock, {
    action: 'recordBankTransaction',
    input: { bankAccount: 'BO-1', transactionId: 'T-300', date: '2026-09-29', amount: 75, type: 'DEBIT', description: 'دفع مجهول' },
  })

  const dangling = run(state, clock, {
    action: 'matchBankTransaction',
    input: { transactionId: 'T-300', matchTo: { type: 'INVOICE', id: 'inv-does-not-exist' } },
  })
  assert.equal(dangling.ok, false)
  assert.equal(state.bankTransactions[0]!.status, 'UNMATCHED')
})
