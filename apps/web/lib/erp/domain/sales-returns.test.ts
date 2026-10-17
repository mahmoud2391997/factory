import assert from 'node:assert/strict'
import { test } from 'node:test'
import { actorFromUser, applyCommand, publicState } from './engine'
import { invoiceOutstanding } from './invoice-balance'
import { buildSeedState, createClock } from './seed'
import { inventoryIntegrity, itemOnHand, trialBalance } from './reports'
import type { Command } from './types'

function fixture() {
  let state = buildSeedState('synthetic-only', '2026-10-16T08:00:00.000Z')
  const invoice = state.invoices[0]!, clock = createClock(invoice.issuedAt)
  const sale = state.ledger.find(entry => entry.type === 'SALE' && entry.refId === invoice.id)!
  const input = { requestId: 'return-ticket-1', invoiceId: invoice.id, invoiceLineIndex: 0, sourceBatchNo: sale.batchNo, qty: invoice.lines[0]!.qty, reason: 'اختبار مرتجع اصطناعي' }
  const command = (command: Command, user = 'user-gm') => {
    const result = applyCommand(state, actorFromUser(state, user)!, command, clock)
    if (result.ok) state = result.state
    return result
  }
  return { state: () => state, command, input, clock, invoice }
}

test('return policy is unset until explicitly configured, validates days and calendar window', () => {
  const f = fixture()
  assert.equal(f.command({ action: 'createSalesReturn', input: f.input }, 'user-sales').ok, false)
  for (const returnWindowDays of [-1, 0.5, NaN]) assert.equal(f.command({ action: 'updateCompany', input: { returnWindowDays } }).ok, false)
  assert(f.command({ action: 'updateCompany', input: { returnWindowDays: 0 } }).ok)
  f.clock.advance(24)
  assert.equal(f.command({ action: 'createSalesReturn', input: f.input }, 'user-sales').ok, false)
  assert.equal(f.state().salesReturns?.length ?? 0, 0)
})

test('return request reserves invoice and batch quantities, replays safely, rejects overreturn and releases rejected reservation', () => {
  const f = fixture()
  assert(f.command({ action: 'updateCompany', input: { returnWindowDays: 7 } }).ok)
  assert(f.command({ action: 'createSalesReturn', input: f.input }, 'user-sales').ok)
  assert(f.command({ action: 'createSalesReturn', input: f.input }, 'user-sales').ok)
  assert.equal(f.state().salesReturns!.length, 1)
  assert.equal(f.command({ action: 'createSalesReturn', input: { ...f.input, requestId: 'ticket-2', qty: 1 } }, 'user-sales').ok, false)
  assert.equal(f.command({ action: 'createSalesReturn', input: { ...f.input, reason: 'different' } }, 'user-sales').ok, false)
  const id = f.state().salesReturns![0]!.id
  assert(f.command({ action: 'decideSalesReturn', input: { id, decision: 'REJECTED', note: 'رفض اصطناعي' } }).ok)
  assert(f.command({ action: 'createSalesReturn', input: { ...f.input, requestId: 'ticket-2' } }, 'user-sales').ok)
})

test('GM approval is independent of requester and atomically reverses invoice amounts/cost into quarantined inventory', () => {
  const f = fixture(), beforeJournals = f.state().journals.length
  assert(f.command({ action: 'updateCompany', input: { returnWindowDays: 7 } }).ok)
  assert(f.command({ action: 'createSalesReturn', input: f.input }).ok)
  const note = f.state().salesReturns![0]!, beforeAvailable = itemOnHand(f.state(), 'PRODUCT', note.productId)
  assert.equal(f.command({ action: 'decideSalesReturn', input: { id: note.id, decision: 'APPROVED', received: true, receiptReference: 'SYNTHETIC-RECEIPT', note: 'اعتماد' } }).ok, false)
  assert.equal(f.command({ action: 'decideSalesReturn', input: { id: note.id, decision: 'APPROVED', received: true, receiptReference: 'SYNTHETIC-RECEIPT', note: 'اعتماد' } }, 'user-acc').ok, false)
  assert.equal(f.state().journals.length, beforeJournals)
  assert(f.command({ action: 'decideSalesReturn', input: { id: note.id, decision: 'APPROVED', received: true, receiptReference: 'SYNTHETIC-RECEIPT', note: 'اعتماد مستقل' } }, 'user-admin').ok)
  const approved = f.state().salesReturns![0]!, invoice = f.state().invoices[0]!
  assert.equal(invoice.total, f.invoice.total)
  assert.equal(invoice.creditedAmount, f.invoice.total)
  assert.equal(invoiceOutstanding(invoice), -invoice.paidAmount)
  assert.equal(f.state().journals.length, beforeJournals + 1)
  assert.equal(f.state().balances.find(row => row.batchNo === approved.returnBatchNo)!.quarantined, true)
  assert.equal(itemOnHand(f.state(), 'PRODUCT', approved.productId), beforeAvailable)
  assert.equal(trialBalance(f.state()).balanced, true)
  assert.equal(inventoryIntegrity(f.state()).ok, true)
  assert(f.command({ action: 'decideSalesReturn', input: { id: note.id, decision: 'APPROVED', received: true, receiptReference: 'SYNTHETIC-RECEIPT', note: 'اعتماد مستقل' } }, 'user-admin').ok)
  assert.equal(f.state().journals.length, beforeJournals + 1)
  const transfer = f.command({ action: 'transferStock', input: { from: 'WH_FG', to: 'WH_MFG', lines: [{ itemType: 'PRODUCT', itemId: approved.productId, batchNo: approved.returnBatchNo, qty: 1 }] } })
  assert.equal(transfer.ok, false)
})

test('QC release is permission checked; failed goods remain quarantined; passed stock becomes available', () => {
  for (const result of ['PASSED', 'FAILED'] as const) {
    const f = fixture()
    assert(f.command({ action: 'updateCompany', input: { returnWindowDays: 7 } }).ok)
    assert(f.command({ action: 'createSalesReturn', input: f.input }, 'user-sales').ok)
    const note = f.state().salesReturns![0]!
    assert(f.command({ action: 'decideSalesReturn', input: { id: note.id, decision: 'APPROVED', received: true, receiptReference: 'SYNTHETIC-RECEIPT', note: 'اعتماد' } }).ok)
    const available = itemOnHand(f.state(), 'PRODUCT', note.productId)
    assert.equal(f.command({ action: 'decideSalesReturnQuality', input: { id: note.id, result, note: 'فحص' } }, 'user-sales').ok, false)
    assert(f.command({ action: 'decideSalesReturnQuality', input: { id: note.id, result, note: 'فحص اصطناعي موثق' } }, 'user-qc').ok)
    assert.equal(itemOnHand(f.state(), 'PRODUCT', note.productId), available + (result === 'PASSED' ? note.qty : 0))
  }
})

test('refund is a separately audited bookkeeping action bounded by paid customer credit and replay identity', () => {
  const f = fixture()
  assert(f.command({ action: 'updateCompany', input: { returnWindowDays: 7 } }).ok)
  assert(f.command({ action: 'createSalesReturn', input: f.input }, 'user-sales').ok)
  const note = f.state().salesReturns![0]!
  assert(f.command({ action: 'decideSalesReturn', input: { id: note.id, decision: 'APPROVED', received: true, receiptReference: 'SYNTHETIC-RECEIPT', note: 'اعتماد' } }).ok)
  const input = { id: note.id, requestId: 'refund-1', amount: f.invoice.paidAmount, reference: 'synthetic-bank-reference' }
  assert.equal(f.command({ action: 'recordSalesReturnRefund', input: { ...input, amount: input.amount + 1 } }, 'user-acc').ok, false)
  assert.equal(f.command({ action: 'recordSalesReturnRefund', input }, 'user-driver').ok, false)
  assert(f.command({ action: 'recordSalesReturnRefund', input }, 'user-acc').ok)
  assert(f.command({ action: 'recordSalesReturnRefund', input }, 'user-acc').ok)
  assert.equal(f.state().salesReturns![0]!.refunds.length, 1)
  assert.equal(invoiceOutstanding(f.state().invoices[0]!), 0)
  assert.equal(trialBalance(f.state()).balanced, true)
  assert.equal(f.command({ action: 'recordSalesReturnRefund', input: { ...input, requestId: 'refund-2', amount: 1 } }, 'user-acc').ok, false)
  const denied = publicState(f.state(), ['notifications.read'], 'user-driver')
  assert.deepEqual(denied.salesReturns, [])
})

test('three partial credits conserve original VAT rounding and immutable invoice amounts', () => {
  const f = fixture()
  assert(f.command({ action: 'updateCompany', input: { returnWindowDays: 7 } }).ok)
  assert(f.command({ action: 'createInvoice', input: { customerId: f.invoice.customerId, lines: [{ productId: f.invoice.lines[0]!.productId, qty: 3, unitPrice: 0.333 }] } }).ok)
  const invoiceId = f.state().invoices[0]!.id
  assert(f.command({ action: 'confirmInvoice', input: { id: invoiceId } }).ok)
  const invoice = structuredClone(f.state().invoices[0]!)
  for (let index = 0; index < 3; index++) {
    assert(f.command({ action: 'createSalesReturn', input: { ...f.input, invoiceId, sourceBatchNo: invoice.lines[0]!.allocations![0]!.batchNo, requestId: `partial-${index}`, qty: 1 } }, 'user-sales').ok)
    const id = f.state().salesReturns![0]!.id
    assert(f.command({ action: 'decideSalesReturn', input: { id, decision: 'APPROVED', received: true, receiptReference: 'SYNTHETIC-RECEIPT', note: 'partial credit' } }).ok)
  }
  const notes = f.state().salesReturns!.filter(item => item.invoiceId === invoiceId)
  assert.equal(Math.round(notes.reduce((sum, item) => sum + item.vat, 0) * 1000), Math.round(invoice.vatAmount * 1000))
  assert.equal(f.state().invoices[0]!.creditedAmount, invoice.total)
  assert.equal(f.state().invoices[0]!.total, invoice.total)
  assert.equal(invoiceOutstanding(f.state().invoices[0]!), 0)
  assert.equal(f.command({ action: 'recordPayment', input: { invoiceId, amount: 0.001 } }, 'user-acc').ok, false)
})

test('new invoice issue allocations survive archival and quarantine cannot be sold', () => {
  const f = fixture()
  assert(f.command({ action: 'updateCompany', input: { returnWindowDays: 7 } }).ok)
  const originalLedger = f.state().ledger
  f.state().ledger = [] // New invoices retain independent issue evidence, even when ledger movements have been archived.
  assert(f.command({ action: 'createSalesReturn', input: f.input }, 'user-sales').ok)
  f.state().ledger = originalLedger
  const id = f.state().salesReturns![0]!.id
  assert(f.command({ action: 'decideSalesReturn', input: { id, decision: 'APPROVED', received: true, receiptReference: 'SYNTHETIC-RECEIPT', note: 'approval' } }).ok)
  const available = itemOnHand(f.state(), 'PRODUCT', f.invoice.lines[0]!.productId, 'WH_FG')
  assert(f.command({ action: 'createInvoice', input: { customerId: f.invoice.customerId, lines: [{ productId: f.invoice.lines[0]!.productId, qty: available + 1 }] } }).ok)
  const invoiceId = f.state().invoices[0]!.id, beforeLedger = f.state().ledger.length, beforeJournals = f.state().journals.length
  assert.equal(f.command({ action: 'confirmInvoice', input: { id: invoiceId } }).ok, false)
  assert.equal(f.state().ledger.length, beforeLedger)
  assert.equal(f.state().journals.length, beforeJournals)
  assert.equal(f.state().invoices[0]!.status, 'DRAFT')
})

test('same product and physical batch on two invoice lines retains independent quantity, price, VAT and cost caps', () => {
  const f = fixture(), productId = f.invoice.lines[0]!.productId
  assert(f.command({ action: 'updateCompany', input: { returnWindowDays: 7 } }).ok)
  assert(f.command({ action: 'createInvoice', input: { customerId: f.invoice.customerId, lines: [{ productId, qty: 1, unitPrice: 0.333 }, { productId, qty: 2, unitPrice: 0.777 }] } }).ok)
  const invoiceId = f.state().invoices[0]!.id
  assert(f.command({ action: 'confirmInvoice', input: { id: invoiceId } }).ok)
  const invoice = structuredClone(f.state().invoices[0]!), batch = invoice.lines[0]!.allocations![0]!.batchNo
  assert.equal(invoice.lines[1]!.allocations![0]!.batchNo, batch)
  const soldCost = Math.round(f.state().ledger.filter(item => item.type === 'SALE' && item.refId === invoiceId).reduce((sum, item) => sum - item.qty * item.unitCost, 0) * 1000)
  assert.equal(f.command({ action: 'createSalesReturn', input: { ...f.input, invoiceId, sourceBatchNo: batch, invoiceLineIndex: 0, qty: 2, requestId: 'too-many-line-0' } }, 'user-sales').ok, false)
  for (const [invoiceLineIndex, amount] of [[0, 1], [1, 2]]) {
    assert(f.command({ action: 'createSalesReturn', input: { ...f.input, invoiceId, sourceBatchNo: batch, invoiceLineIndex: invoiceLineIndex!, qty: amount!, requestId: `line-${invoiceLineIndex}` } }, 'user-sales').ok)
    assert(f.command({ action: 'decideSalesReturn', input: { id: f.state().salesReturns![0]!.id, decision: 'APPROVED', received: true, receiptReference: `SYNTHETIC-${invoiceLineIndex}`, note: 'independent approval' } }).ok)
  }
  assert.equal(f.state().invoices[0]!.creditedAmount, invoice.total)
  assert.equal(Math.round(f.state().salesReturns!.filter(item => item.invoiceId === invoiceId).reduce((sum, item) => sum + item.cost, 0) * 1000), soldCost)
  assert.equal(f.command({ action: 'createSalesReturn', input: { ...f.input, invoiceId, sourceBatchNo: batch, qty: 0.001, requestId: 'after-both-credited' } }, 'user-sales').ok, false)
  assert.equal(trialBalance(f.state()).balanced, true)
  assert.equal(inventoryIntegrity(f.state()).ok, true)
})

test('credit approval requires explicit physical custody confirmation and receipt evidence', () => {
  const f = fixture()
  assert(f.command({ action: 'updateCompany', input: { returnWindowDays: 7 } }).ok)
  assert(f.command({ action: 'createSalesReturn', input: f.input }, 'user-sales').ok)
  const id = f.state().salesReturns![0]!.id, journalCount = f.state().journals.length, balanceCount = f.state().balances.length
  for (const extra of [{}, { received: true }, { receiptReference: 'not-confirmed' }, { received: false, receiptReference: 'not-received' }]) {
    assert.equal(f.command({ action: 'decideSalesReturn', input: { id, decision: 'APPROVED', note: 'approval attempt', ...extra } }).ok, false)
    assert.equal(f.state().journals.length, journalCount)
    assert.equal(f.state().balances.length, balanceCount)
  }
  assert(f.command({ action: 'decideSalesReturn', input: { id, decision: 'APPROVED', note: 'goods received', received: true, receiptReference: 'SYNTHETIC-WAREHOUSE-RECEIPT' } }).ok)
  assert.equal(f.state().salesReturns![0]!.receiptReference, 'SYNTHETIC-WAREHOUSE-RECEIPT')
  assert.match(f.state().auditLogs[0]!.detail, /SYNTHETIC-WAREHOUSE-RECEIPT/)
})

test('credit reporting reverses VAT/revenue and resale of inspected returned stock keeps original lot trace', async () => {
  const { profitAndLoss, profitabilityReport, traceLot, vatReturn } = await import('./reports')
  const { returnOriginBatch } = await import('./invoice-balance')
  const f = fixture(), beforeVat = vatReturn(f.state()).outputVat, beforeRevenue = profitAndLoss(f.state()).revenue
  assert(f.command({ action: 'updateCompany', input: { returnWindowDays: 7 } }).ok)
  assert(f.command({ action: 'createSalesReturn', input: f.input }, 'user-sales').ok)
  const note = f.state().salesReturns![0]!
  assert(f.command({ action: 'decideSalesReturn', input: { id: note.id, decision: 'APPROVED', received: true, receiptReference: 'SYNTHETIC-RECEIPT', note: 'received into quarantine' } }).ok)
  assert.equal(vatReturn(f.state()).outputVat, Math.round((beforeVat - note.vat) * 1000) / 1000)
  assert.equal(profitAndLoss(f.state()).revenue, Math.round((beforeRevenue - note.net) * 1000) / 1000)
  // Sell available original stock first; quarantined stock must not be selected.
  const available = itemOnHand(f.state(), 'PRODUCT', note.productId, 'WH_FG')
  assert(f.command({ action: 'createInvoice', input: { customerId: f.invoice.customerId, lines: [{ productId: note.productId, qty: available }] } }).ok)
  assert(f.command({ action: 'confirmInvoice', input: { id: f.state().invoices[0]!.id } }).ok)
  const beforeResale = profitabilityReport(f.state(), 'PRODUCT').find(item => item.key === note.productId)!.revenue
  assert(f.command({ action: 'decideSalesReturnQuality', input: { id: note.id, result: 'PASSED', note: 'inspected' } }, 'user-qc').ok)
  assert(f.command({ action: 'createInvoice', input: { customerId: f.invoice.customerId, lines: [{ productId: note.productId, qty: note.qty, unitPrice: 0.2 }] } }).ok)
  const resaleId = f.state().invoices[0]!.id
  assert(f.command({ action: 'confirmInvoice', input: { id: resaleId } }).ok)
  assert.equal(f.state().invoices[0]!.lines[0]!.allocations![0]!.batchNo, note.returnBatchNo)
  const origin = returnOriginBatch(f.state(), note.returnBatchNo), trace = traceLot(f.state(), origin)!
  assert(trace.returns.some(item => item.id === note.id))
  assert(trace.deliveries.some(item => item.invoiceId === resaleId))
  assert.equal(profitabilityReport(f.state(), 'PRODUCT').find(item => item.key === note.productId)!.revenue, Math.round((beforeResale + note.qty * 0.2) * 1000) / 1000)
  assert.equal(inventoryIntegrity(f.state()).ok, true)
  assert.equal(trialBalance(f.state()).balanced, true)
})
