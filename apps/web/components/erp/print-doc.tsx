'use client'

import { LocalizedContent } from '@/lib/i18n/localized-content'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import { barcodeSvg } from '@/lib/erp/domain/barcode'
import { COST_LABEL } from '@/lib/erp/domain/costing'
import { recallReport, traceLot } from '@/lib/erp/domain/reports'
import type { Company } from '@/lib/erp/domain/types'
import type { PublicState } from '@/components/erp/live/ctx'
import { materialName, moneyFmt, productName, qtyFmt, statusLabel } from '@/components/erp/live/format'

export function PrintDoc({ kind }: { kind: 'invoice' | 'po' | 'labels' | 'lot' | 'recall' | 'delivery' }) {
  const params = useParams<{ id?: string; lotNo?: string }>()
  const [state, setState] = useState<PublicState | null>(null)
  const [recallData, setRecallData] = useState<{ company: Company; report: ReturnType<typeof recallReport> } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const endpoint = kind === 'recall' ? `/api/erp/recall${window.location.search}` : '/api/erp'
      const response = await fetch(endpoint, { credentials: 'include' })
      const json = await response.json()
      if (cancelled) return
      if (!json.success) setError(json.message || 'تعذر التحميل')
      else if (kind === 'recall') setRecallData(json.data)
      else setState(json.data.state)
    })()
    return () => {
      cancelled = true
    }
  }, [kind])

  if (error) return (<LocalizedContent>{<main className="p-8">{error}</main>}</LocalizedContent>)
  if (kind === 'recall') {
    if (!recallData) return (<LocalizedContent>{<main className="p-8">جاري التحميل...</main>}</LocalizedContent>)
    return (<LocalizedContent>{(
      <main className="print-sheet">
        <style>{`.print-sheet { max-width: 900px; margin: 0 auto; padding: 24px; color: #14211c; background: white; } .print-sheet table { width: 100%; border-collapse: collapse; } .print-sheet th, .print-sheet td { border-bottom: 1px solid #ddd; padding: 8px; text-align: start; font-size: 13px; } .noprint { margin-bottom: 16px; } @media print { .noprint { display: none; } .print-sheet { padding: 0; } }`}</style>
        <div className="noprint"><button type="button" onClick={() => window.print()} style={{ background: '#1e127c', color: 'white', border: 0, borderRadius: 8, padding: '8px 14px' }}>طباعة</button></div>
        <RecallReportDocument company={recallData.company} report={recallData.report} />
      </main>
    )}</LocalizedContent>)
  }
  if (!state) return (<LocalizedContent>{<main className="p-8">جاري التحميل...</main>}</LocalizedContent>)

  return (<LocalizedContent>{(
    <main className="print-sheet">
      <style>{`
        .print-sheet { max-width: 900px; margin: 0 auto; padding: 24px; color: #14211c; background: white; }
        .print-sheet table { width: 100%; border-collapse: collapse; }
        .print-sheet th, .print-sheet td { border-bottom: 1px solid #ddd; padding: 8px; text-align: start; font-size: 13px; }
        .noprint { margin-bottom: 16px; }
        @media print { .noprint { display: none; } .print-sheet { padding: 0; } }
      `}</style>
      <div className="noprint">
        <button type="button" onClick={() => window.print()} style={{ background: '#1e127c', color: 'white', border: 0, borderRadius: 8, padding: '8px 14px' }}>
          طباعة
        </button>
      </div>
      {kind === 'invoice' ? <Invoice state={state} id={params.id ?? ''} /> : null}
      {kind === 'po' ? <PurchaseOrder state={state} id={params.id ?? ''} /> : null}
      {kind === 'labels' ? <Labels state={state} /> : null}
      {kind === 'lot' ? <LotCertificate state={state} lotNo={decodeURIComponent(params.lotNo ?? '')} /> : null}
      {kind === 'delivery' ? <DeliveryNote state={state} id={params.id ?? ''} /> : null}
    </main>
  )}</LocalizedContent>)
}

function Letterhead({ company }: { company: Company }) {
  return (<LocalizedContent>{(
    <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{company.nameAr}</div>
        <div>{company.nameEn}</div>
        <div>{company.address} — {company.city} — {company.country}</div>
        <div>هاتف: {company.phone}</div>
        <div>س.ت: {company.crNumber}</div>
        <div>الرقم الضريبي: {company.vatNumber}</div>
      </div>
      <div style={{ fontWeight: 800, color: '#1e127c' }}>{company.currency}</div>
    </header>
  )}</LocalizedContent>)
}

function Invoice({ state, id }: { state: PublicState; id: string }) {
  const invoice = state.invoices.find((item) => item.id === id)
  if (!invoice) return (<LocalizedContent>{<p>الفاتورة غير موجودة</p>}</LocalizedContent>)
  const customer = state.customers.find((item) => item.id === invoice.customerId)
  return (<LocalizedContent>{(
    <article>
      <Letterhead company={state.company} />
      <h1 style={{ fontSize: 26, margin: '8px 0' }}>فاتورة ضريبية</h1>
      <p>رقم الفاتورة: {invoice.number} — التاريخ: {invoice.issuedAt.slice(0, 10)} — الحالة: {statusLabel(invoice.status)}</p>
      <h2 style={{ fontSize: 16 }}>العميل</h2>
      <p>
        {customer?.nameAr}<br />
        {customer?.address}<br />
        الرقم الضريبي: {customer?.vatNumber || '—'}
      </p>
      <table>
        <thead>
          <tr>
            <th>الصنف</th>
            <th>الكمية</th>
            <th>سعر الوحدة</th>
            <th>الخاضع للضريبة</th>
            <th>النسبة</th>
            <th>الضريبة</th>
            <th>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line, index) => (
            <tr key={index}>
              <td>{productName(state, line.productId)}</td>
              <td>{qtyFmt(line.qty)}</td>
              <td>{moneyFmt(line.unitPrice)}</td>
              <td>{moneyFmt(line.net)}</td>
              <td>{line.vatRatePct}%</td>
              <td>{moneyFmt(line.vat)}</td>
              <td>{moneyFmt(line.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>المجموع الخاضع: {moneyFmt(invoice.subtotal)}</p>
      <p>ضريبة القيمة المضافة: {moneyFmt(invoice.vatAmount)}</p>
      <p style={{ fontWeight: 800 }}>الإجمالي المستحق: {moneyFmt(invoice.total)}</p>
      <p>المحصّل: {moneyFmt(invoice.paidAmount)}</p>
      <p style={{ marginTop: 24, fontSize: 12 }}>
        فاتورة صادرة بالريال العُماني (ثلاثة أرقام عشرية) ومهيأة لمتطلبات فاتورة ضريبة القيمة المضافة في سلطنة عُمان. المعاملة الضريبية لكل صنف قابلة للتهيئة داخل النظام.
      </p>
    </article>
  )}</LocalizedContent>)
}

function PurchaseOrder({ state, id }: { state: PublicState; id: string }) {
  const order = state.purchaseOrders.find((item) => item.id === id)
  if (!order) return (<LocalizedContent>{<p>أمر الشراء غير موجود</p>}</LocalizedContent>)
  const supplier = state.suppliers.find((item) => item.id === order.supplierId)
  return (<LocalizedContent>{(
    <article>
      <Letterhead company={state.company} />
      <h1>أمر شراء</h1>
      <p>{order.number} — {statusLabel(order.status)} — {order.createdAt.slice(0, 10)}</p>
      <p>المورد: {supplier?.nameAr} — الرقم الضريبي: {supplier?.vatNumber || '—'}</p>
      <p>{supplier?.address}</p>
      <table>
        <thead>
          <tr>
            <th>المادة</th>
            <th>الكمية</th>
            <th>سعر الوحدة</th>
            <th>المستلم</th>
            <th>القيمة</th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((line, index) => (
            <tr key={index}>
              <td>{materialName(state, line.materialId)}</td>
              <td>{qtyFmt(line.qty)}</td>
              <td>{moneyFmt(line.unitCost)}</td>
              <td>{qtyFmt(line.receivedQty)}</td>
              <td>{moneyFmt(line.qty * line.unitCost)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {order.notes ? <p>ملاحظات: {order.notes}</p> : null}
    </article>
  )}</LocalizedContent>)
}

function DeliveryNote({ state, id }: { state: PublicState; id: string }) {
  const delivery = state.invoiceDeliveries.find((item) => item.id === id)
  if (!delivery) return (<LocalizedContent>{<p>أمر التسليم غير موجود</p>}</LocalizedContent>)
  const invoice = state.invoices.find((item) => item.id === delivery.invoiceId)
  if (!invoice) return (<LocalizedContent>{<p>فاتورة أمر التسليم غير موجودة</p>}</LocalizedContent>)
  const customer = state.customers.find((item) => item.id === invoice.customerId)
  return (<LocalizedContent>{(
    <article>
      <Letterhead company={state.company} />
      <h1 style={{ fontSize: 26, margin: '8px 0' }}>أمر تسليم</h1>
      <p>الفاتورة: {invoice.number} — الحالة: {statusLabel(delivery.currentStep)}</p>
      <h2 style={{ fontSize: 16 }}>العميل</h2>
      <p>{customer?.nameAr ?? '—'} — {customer?.phone ?? '—'}</p>
      <table>
        <thead><tr><th>الصنف</th><th>الكمية</th><th>الوحدة</th></tr></thead>
        <tbody>{invoice.lines.map((line, index) => (
          <tr key={index}>
            <td>{productName(state, line.productId)}</td>
            <td>{qtyFmt(line.qty)}</td>
            <td>{state.products.find((item) => item.id === line.productId)?.unit ?? ''}</td>
          </tr>
        ))}</tbody>
      </table>
      <h2 style={{ fontSize: 16 }}>اعتمادات المراحل</h2>
      <table>
        <thead><tr><th>المرحلة</th><th>اعتمد بواسطة</th><th>الوقت</th><th>ملاحظات</th></tr></thead>
        <tbody>{delivery.steps.map((step, index) => (
          <tr key={`${step.step}-${index}`}>
            <td>{statusLabel(step.step)}</td>
            <td>{state.users.find((user) => user.id === step.completedBy)?.fullName ?? state.employees.find((employee) => employee.id === step.completedBy)?.nameAr ?? step.completedBy}</td>
            <td>{step.completedAt.replace('T', ' ').slice(0, 16)}</td>
            <td>{step.notes ?? ''}</td>
          </tr>
        ))}</tbody>
      </table>
      {delivery.deliveryProof ? (
        <section style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 16 }}>إثبات التسليم</h2>
          <p>المستلم: {delivery.deliveryProof.recipientName} — الهاتف: {delivery.deliveryProof.recipientPhone ?? '—'}</p>
          <p>وقت التسليم: {delivery.deliveryProof.deliveredAt.replace('T', ' ').slice(0, 16)}</p>
          {delivery.deliveryProof.location ? <p>الموقع: {delivery.deliveryProof.location.lat}, {delivery.deliveryProof.location.lng}</p> : null}
        </section>
      ) : <p style={{ marginTop: 20 }}>لم يُسجّل إثبات التسليم بعد.</p>}
    </article>
  )}</LocalizedContent>)
}

function LotCertificate({ state, lotNo }: { state: PublicState; lotNo: string }) {
  const trace = traceLot(state, lotNo)
  if (!trace) return (<LocalizedContent>{<p>دفعة الإنتاج غير موجودة</p>}</LocalizedContent>)
  return (<LocalizedContent>{(
    <article>
      <Letterhead company={state.company} />
      <h1 style={{ fontSize: 26, margin: '8px 0' }}>شهادة تتبع دفعة إنتاج</h1>
      <p>
        رقم الدفعة: {trace.lot.lotNo} — المنتج: {trace.product?.nameAr ?? '—'} — المشغّل: {trace.operatorName}
      </p>
      <p>
        تاريخ التصنيع: {trace.lot.manufacturedAt.slice(0, 10)} — الجودة: {statusLabel(trace.lot.qcStatus ?? 'UNTESTED')} — الناتج: {qtyFmt(trace.lot.actualOutputKg)} كجم
      </p>
      {trace.lot.legacyNote ? <p>{trace.lot.legacyNote}</p> : null}
      <h2 style={{ fontSize: 16 }}>الخامات والموردون</h2>
      <table>
        <thead>
          <tr><th>الخامة</th><th>دفعة الخام</th><th>المورد</th><th>الكمية</th></tr>
        </thead>
        <tbody>
          {trace.rawBatches.map((line) => (
            <tr key={`${line.materialId}-${line.sourceBatchNo}`}>
              <td>{line.materialName}</td>
              <td>{line.sourceBatchNo}</td>
              <td>{line.supplierName ?? '—'}</td>
              <td>{qtyFmt(line.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 style={{ fontSize: 16 }}>نتائج الجودة</h2>
      <table>
        <thead>
          <tr><th>الوقت</th><th>رطوبة</th><th>بروتين</th><th>رماد</th><th>النتيجة</th></tr>
        </thead>
        <tbody>
          {trace.samples.map((sample) => (
            <tr key={sample.id}>
              <td>{sample.sampledAt.slice(0, 16).replace('T', ' ')}</td>
              <td>{sample.moisturePct ?? '—'}</td>
              <td>{sample.proteinPct ?? '—'}</td>
              <td>{sample.ashPct ?? '—'}</td>
              <td>{statusLabel(sample.result)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 style={{ fontSize: 16 }}>العملاء</h2>
      <table>
        <thead>
          <tr><th>العميل</th><th>الكمية</th><th>ملاحظة التخصيص</th></tr>
        </thead>
        <tbody>
          {trace.deliveries.map((delivery, index) => (
            <tr key={`${delivery.invoiceId ?? delivery.withdrawalId ?? index}`}>
              <td>{delivery.customerId ? state.customers.find((item) => item.id === delivery.customerId)?.nameAr ?? '—' : 'سحب داخلي'}</td>
              <td>{qtyFmt(delivery.qty)}</td>
              <td>{delivery.unallocatedNote ?? (delivery.allocation === 'proportional' ? 'موزّعة بالتساوي' : '')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 style={{ fontSize: 16 }}>التكلفة</h2>
      <table>
        <thead>
          <tr><th>البند</th><th>المبلغ</th></tr>
        </thead>
        <tbody>
          {trace.lot.costLines.map((line) => (
            <tr key={line.type}><td>{COST_LABEL[line.type]}</td><td>{moneyFmt(line.amount)}</td></tr>
          ))}
        </tbody>
      </table>
    </article>
  )}</LocalizedContent>)
}

function Labels({ state }: { state: PublicState }) {
  const items = [
    ...state.materials.map((item) => ({ code: item.barcode, name: item.nameAr })),
    ...state.products.map((item) => ({ code: item.barcode, name: item.nameAr })),
  ]
  return (<LocalizedContent>{(
    <article>
      <h1>ملصقات الباركود — {state.company.nameAr}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {items.map((item) => (
          <div key={item.code} style={{ border: '1px solid #ccc', padding: 8, breakInside: 'avoid' }}>
            <div style={{ fontWeight: 700 }}>{item.name}</div>
            <div dangerouslySetInnerHTML={{ __html: barcodeSvg(item.code, { height: 56, module: 1.6 }) }} />
          </div>
        ))}
      </div>
    </article>
  )}</LocalizedContent>)
}

function RecallReportDocument({ company, report }: { company: Company; report: ReturnType<typeof recallReport> }) {
  const target = report.target.type === 'LOT'
    ? `دفعة إنتاج: ${report.target.lotNo}`
    : `دفعة خام: ${report.materialName ?? report.target.materialId} — ${report.target.batchNo}`
  return (<LocalizedContent>{(
    <article>
      <Letterhead company={company} />
      <h1 style={{ fontSize: 26, margin: '8px 0' }}>تقرير تتبع واستدعاء</h1>
      <p>{target}</p>
      {report.suppliers.length ? <p>الموردون المرتبطون: {report.suppliers.join('، ')}</p> : null}
      <h2 style={{ fontSize: 16 }}>دفعات الإنتاج المتأثرة</h2>
      <table>
        <thead><tr><th>رقم الدفعة</th><th>المنتج</th><th>التصنيع</th><th>الناتج (كجم)</th></tr></thead>
        <tbody>{report.lots.map((lot) => <tr key={lot.lotNo}><td>{lot.lotNo}</td><td>{lot.product}</td><td>{lot.manufacturedAt}</td><td>{qtyFmt(lot.quantityKg)}</td></tr>)}</tbody>
      </table>
      <h2 style={{ fontSize: 16 }}>العملاء المتأثرون</h2>
      <table>
        <thead><tr><th>العميل</th><th>الكمية (كجم)</th><th>الفواتير</th></tr></thead>
        <tbody>{report.affectedCustomers.map((customer) => <tr key={customer.customerId}><td>{customer.customer}</td><td>{qtyFmt(customer.quantityKg)}</td><td>{customer.invoiceNumbers.join('، ') || '—'}</td></tr>)}</tbody>
      </table>
      <h2 style={{ fontSize: 16 }}>تفاصيل التسليم</h2>
      <table>
        <thead><tr><th>الدفعة</th><th>المنتج</th><th>العميل</th><th>الكمية (كجم)</th><th>الفاتورة/السحب</th><th>التاريخ</th></tr></thead>
        <tbody>{report.deliveries.map((delivery, index) => <tr key={`${delivery.invoiceNo ?? delivery.withdrawalId ?? index}`}>
          <td>{delivery.lotNo}</td><td>{delivery.product}</td><td>{delivery.customer}</td><td>{qtyFmt(delivery.quantityKg)}</td><td>{delivery.invoiceNo ?? delivery.withdrawalId ?? '—'}</td><td>{delivery.date}</td>
        </tr>)}</tbody>
      </table>
    </article>
  )}</LocalizedContent>)
}
