'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import { barcodeSvg } from '@/lib/erp/domain/barcode'
import type { PublicState } from '@/components/erp/live/ctx'
import { materialName, moneyFmt, productName, qtyFmt, statusLabel } from '@/components/erp/live/format'

export function PrintDoc({ kind }: { kind: 'invoice' | 'po' | 'labels' }) {
  const params = useParams<{ id?: string }>()
  const [state, setState] = useState<PublicState | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const response = await fetch('/api/erp', { credentials: 'include' })
      const json = await response.json()
      if (cancelled) return
      if (!json.success) setError(json.message || 'تعذر التحميل')
      else setState(json.data.state)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (error) return <main className="p-8">{error}</main>
  if (!state) return <main className="p-8">جاري التحميل...</main>

  return (
    <main className="print-sheet">
      <style>{`
        .print-sheet { max-width: 900px; margin: 0 auto; padding: 24px; color: #14211c; background: white; }
        .print-sheet table { width: 100%; border-collapse: collapse; }
        .print-sheet th, .print-sheet td { border-bottom: 1px solid #ddd; padding: 8px; text-align: right; font-size: 13px; }
        .noprint { margin-bottom: 16px; }
        @media print { .noprint { display: none; } .print-sheet { padding: 0; } }
      `}</style>
      <div className="noprint">
        <button type="button" onClick={() => window.print()} style={{ background: '#123c35', color: 'white', border: 0, borderRadius: 8, padding: '8px 14px' }}>
          طباعة
        </button>
      </div>
      {kind === 'invoice' ? <Invoice state={state} id={params.id ?? ''} /> : null}
      {kind === 'po' ? <PurchaseOrder state={state} id={params.id ?? ''} /> : null}
      {kind === 'labels' ? <Labels state={state} /> : null}
    </main>
  )
}

function Letterhead({ state }: { state: PublicState }) {
  const company = state.company
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{company.nameAr}</div>
        <div>{company.nameEn}</div>
        <div>{company.address} — {company.city} — {company.country}</div>
        <div>هاتف: {company.phone}</div>
        <div>س.ت: {company.crNumber}</div>
        <div>الرقم الضريبي: {company.vatNumber}</div>
      </div>
      <div style={{ fontWeight: 800, color: '#123c35' }}>{company.currency}</div>
    </header>
  )
}

function Invoice({ state, id }: { state: PublicState; id: string }) {
  const invoice = state.invoices.find((item) => item.id === id)
  if (!invoice) return <p>الفاتورة غير موجودة</p>
  const customer = state.customers.find((item) => item.id === invoice.customerId)
  return (
    <article>
      <Letterhead state={state} />
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
  )
}

function PurchaseOrder({ state, id }: { state: PublicState; id: string }) {
  const order = state.purchaseOrders.find((item) => item.id === id)
  if (!order) return <p>أمر الشراء غير موجود</p>
  const supplier = state.suppliers.find((item) => item.id === order.supplierId)
  return (
    <article>
      <Letterhead state={state} />
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
  )
}

function Labels({ state }: { state: PublicState }) {
  const items = [
    ...state.materials.map((item) => ({ code: item.barcode, name: item.nameAr })),
    ...state.products.map((item) => ({ code: item.barcode, name: item.nameAr })),
  ]
  return (
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
  )
}
