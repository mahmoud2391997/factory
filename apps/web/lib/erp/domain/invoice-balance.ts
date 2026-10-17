import { money } from './money'
import type { ErpState, SalesInvoice } from './types'

/** Positive = receivable; negative = customer credit awaiting a separately recorded refund. */
export function invoiceOutstanding(invoice: SalesInvoice) {
  return money(invoice.total - (invoice.creditedAmount ?? 0) - invoice.paidAmount + (invoice.refundedAmount ?? 0))
}

/** Follow returned/resold stock to the original production batch without creating fictitious production. */
export function returnOriginBatch(state: Pick<ErpState, 'salesReturns'>, batchNo: string) {
  const seen = new Set<string>()
  while (!seen.has(batchNo)) {
    seen.add(batchNo)
    const source = state.salesReturns?.find(item => item.returnBatchNo === batchNo && item.status === 'APPROVED')
    if (!source) break
    batchNo = source.sourceBatchNo
  }
  return batchNo
}
