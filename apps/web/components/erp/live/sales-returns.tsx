'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { LocalizedContent } from '@/lib/i18n/localized-content'
import { invoiceOutstanding } from '@/lib/erp/domain/invoice-balance'
import type { LiveCtx } from './ctx'
import { can, moneyFmt, productName, qtyFmt, statusLabel } from './format'
import { Card, DataTable, Dialog, ExportLinks, Field, GhostButton, PrimaryButton, SelectInput, TextInput } from './bits'

type Action = { id: string; kind: 'APPROVED' | 'REJECTED' | 'PASSED' | 'FAILED' | 'REFUND' }

/** Invoice credit notes are distinct from internal stock withdrawals. QC may only see stock fields. */
export function SalesReturns({ ctx, qualityOnly = false }: { ctx: LiveCtx; qualityOnly?: boolean }) {
  const { user } = useAuth()
  const invoices = ctx.state.invoices.filter(item => item.status !== 'DRAFT')
  const [invoiceId, setInvoiceId] = useState(''), [lineIndex, setLineIndex] = useState(0), [batchNo, setBatchNo] = useState('')
  const [amount, setAmount] = useState(''), [reason, setReason] = useState(''), [requestId, setRequestId] = useState(() => crypto.randomUUID())
  const [action, setAction] = useState<Action | null>(null), [note, setNote] = useState(''), [refund, setRefund] = useState('')
  const [receiptReference, setReceiptReference] = useState(''), [received, setReceived] = useState(false)
  const [actionRequestId, setActionRequestId] = useState(() => crypto.randomUUID())
  const invoice = invoices.find(item => item.id === (invoiceId || invoices[0]?.id))
  const line = invoice?.lines[lineIndex]
  const batches = line?.allocations?.map(item => item.batchNo) ?? [...new Set(ctx.state.ledger.filter(item => item.type === 'SALE' && item.refId === invoice?.id && item.itemId === line?.productId).map(item => item.batchNo))]
  const selectedBatch = batchNo || batches[0] || ''
  const returns = ctx.state.salesReturns ?? []
  const selected = returns.find(item => item.id === action?.id)
  const policySet = Number.isSafeInteger(ctx.state.company.returnWindowDays) && ctx.state.company.returnWindowDays != null
  const begin = (value: Action) => { setAction(value); setNote(''); setRefund(''); setReceiptReference(''); setReceived(false); setActionRequestId(crypto.randomUUID()) }
  const rows = qualityOnly ? returns.filter(item => item.status === 'APPROVED') : returns
  const actions = (item: typeof returns[number]) => <div className="flex flex-wrap gap-2">
    {!qualityOnly && item.status === 'PENDING_APPROVAL' && user?.roles.some(role => role.key === 'GM') && item.createdBy !== user.id ? <>
      <GhostButton type="button" onClick={() => begin({ id: item.id, kind: 'APPROVED' })}>اعتماد الإشعار</GhostButton>
      <GhostButton type="button" onClick={() => begin({ id: item.id, kind: 'REJECTED' })}>رفض المرتجع</GhostButton>
    </> : null}
    {item.status === 'APPROVED' && item.quality === 'QUARANTINED' && can(ctx.permissions, 'qc.manage') ? <>
      <GhostButton type="button" onClick={() => begin({ id: item.id, kind: 'PASSED' })}>اجتاز فحص المرتجع</GhostButton>
      <GhostButton type="button" onClick={() => begin({ id: item.id, kind: 'FAILED' })}>رفض جودة المرتجع</GhostButton>
    </> : null}
    {!qualityOnly && item.status === 'APPROVED' ? <>
      <Link className="text-sm underline" href={`/print/credit-note/${item.id}`} target="_blank" rel="noreferrer">طباعة الإشعار الدائن</Link>
      {can(ctx.permissions, 'sales.payments.manage') ? <GhostButton type="button" onClick={() => begin({ id: item.id, kind: 'REFUND' })}>تسجيل رد مبلغ</GhostButton> : null}
    </> : null}
  </div>
  return <LocalizedContent><Card extra={!qualityOnly ? <ExportLinks href="/api/erp/export?kind=credit-notes" /> : undefined} title={qualityOnly ? 'فحص مخزون المرتجعات' : 'مرتجعات الفواتير والإشعارات الدائنة'} hint="اعتماد مدير عام غير منشئ الطلب مطلوب. المخزون يبقى محجوراً حتى فحص الجودة. رد المبلغ تسجيل دفتري منفصل ولا ينفذ تحويلاً بنكياً.">
    {!qualityOnly && !policySet ? <p role="status" className="mb-3 text-sm">حدد مدة المرتجعات في الإعدادات أولاً</p> : null}
    {!qualityOnly && can(ctx.permissions, 'sales.create') && policySet ? <form className="mb-5 grid gap-3 md:grid-cols-2" onSubmit={async event => {
      event.preventDefault()
      const result = await ctx.act('createSalesReturn', { requestId, invoiceId: invoice?.id, invoiceLineIndex: lineIndex, sourceBatchNo: selectedBatch, qty: Number(amount), reason })
      if (result.ok) { setAmount(''); setReason(''); setRequestId(crypto.randomUUID()) }
    }}>
      <Field label="فاتورة المرتجع"><SelectInput value={invoice?.id ?? ''} onChange={event => { setInvoiceId(event.target.value); setLineIndex(0); setBatchNo('') }} required><option value="">اختر</option>{invoices.map(item => <option key={item.id} value={item.id}>{item.number}</option>)}</SelectInput></Field>
      <Field label="بند المرتجع"><SelectInput value={String(lineIndex)} onChange={event => { setLineIndex(Number(event.target.value)); setBatchNo('') }}>{invoice?.lines.map((item, index) => <option key={index} value={index}>{index + 1} — {productName(ctx.state, item.productId)}</option>)}</SelectInput></Field>
      <Field label="دفعة البيع الأصلية"><SelectInput value={selectedBatch} onChange={event => setBatchNo(event.target.value)} required><option value="">اختر</option>{batches.map(item => <option key={item} value={item}>{item}</option>)}</SelectInput></Field>
      <Field label="كمية المرتجع"><TextInput type="number" min="0.001" step="0.001" value={amount} onChange={event => setAmount(event.target.value)} required /></Field>
      <Field label="سبب المرتجع"><TextInput maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} required /></Field>
      <div className="flex items-end"><PrimaryButton disabled={ctx.pending || !invoice || !selectedBatch}>طلب مرتجع فاتورة</PrimaryButton></div>
    </form> : null}
    <DataTable columns={qualityOnly ? ['الرقم', 'المنتج', 'دفعة المرتجع', 'الكمية', 'الجودة', 'إجراءات'] : ['الرقم', 'الفاتورة', 'المنتج', 'الكمية', 'الصافي', 'الضريبة', 'الإشعار الدائن', 'المردود نقداً', 'الحالة', 'الجودة', 'إجراءات']} rows={rows.map(item => qualityOnly ? [
      item.number, productName(ctx.state, item.productId), item.returnBatchNo, qtyFmt(item.qty), statusLabel(item.quality), actions(item),
    ] : [item.number, ctx.state.invoices.find(invoice => invoice.id === item.invoiceId)?.number ?? '—', productName(ctx.state, item.productId), qtyFmt(item.qty), moneyFmt(item.net), moneyFmt(item.vat), moneyFmt(item.total), moneyFmt(item.refunds.reduce((sum, refund) => sum + refund.amount, 0)), statusLabel(item.status), statusLabel(item.quality), actions(item)])} />
    {!qualityOnly ? <DataTable columns={['الفاتورة', 'الإجمالي الأصلي', 'الإشعارات الدائنة', 'المحصّل', 'المردود نقداً', 'رصيد العميل']} rows={invoices.map(item => [item.number, moneyFmt(item.total), moneyFmt(item.creditedAmount ?? 0), moneyFmt(item.paidAmount), moneyFmt(item.refundedAmount ?? 0), moneyFmt(invoiceOutstanding(item))])} /> : null}
    {action && selected ? <Dialog title="قرار المرتجع" onClose={() => setAction(null)}><form className="grid gap-3" onSubmit={async event => {
      event.preventDefault()
      const result = action.kind === 'REFUND'
        ? await ctx.act('recordSalesReturnRefund', { id: action.id, requestId: actionRequestId, amount: Number(refund), reference: note })
        : action.kind === 'PASSED' || action.kind === 'FAILED'
          ? await ctx.act('decideSalesReturnQuality', { id: action.id, result: action.kind, note })
          : await ctx.act('decideSalesReturn', { id: action.id, decision: action.kind, note, received, receiptReference })
      if (result.ok) setAction(null)
    }}>
      <p>{selected.number} — {action.kind === 'REFUND' ? 'تسجيل رد مبلغ' : statusLabel(action.kind)}</p>
      {action.kind === 'APPROVED' ? <>
        <Field label="مرجع استلام البضاعة المرتجعة"><TextInput maxLength={200} value={receiptReference} onChange={event => setReceiptReference(event.target.value)} required /></Field>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={received} onChange={event => setReceived(event.target.checked)} required /><span>أؤكد استلام البضاعة فعلياً؛ الاعتماد يضيفها إلى المخزون المحجور</span></label>
      </> : null}
      {action.kind === 'REFUND' ? <Field label="مبلغ الرد (ر.ع.)"><TextInput type="number" min="0.001" step="0.001" value={refund} onChange={event => setRefund(event.target.value)} required /></Field> : null}
      <Field label={action.kind === 'REFUND' ? 'مرجع الرد البنكي المنفذ' : 'سبب القرار أو نتيجة الفحص'}><TextInput maxLength={action.kind === 'REFUND' ? 200 : 1000} value={note} onChange={event => setNote(event.target.value)} required /></Field>
      <PrimaryButton disabled={ctx.pending}>تأكيد قرار المرتجع</PrimaryButton>
    </form></Dialog> : null}
  </Card></LocalizedContent>
}
