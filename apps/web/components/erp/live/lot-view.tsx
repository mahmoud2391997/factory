'use client'

import { useState } from 'react'

import { traceLot } from '@/lib/erp/domain/reports'

import { Card, DataTable, GhostButton } from './bits'
import type { LiveCtx } from './ctx'
import { moneyFmt, pctFmt, productName, qtyFmt } from './format'

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="relative overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-white p-4 ps-5 shadow-sm">
      <span aria-hidden className="absolute inset-y-3 right-0 w-1.5 rounded-full bg-[#0d9488]" />
      <div className="text-sm font-medium text-[#6b7280]">{label}</div>
      <div className="mt-2 text-2xl font-semibold leading-none text-[#1f1f1f]">{value}</div>
      {hint ? <div className="mt-2 text-sm text-[#53655e]">{hint}</div> : null}
    </div>
  )
}

export function LotsScreen({ ctx, detail }: { ctx: LiveCtx; detail?: boolean }) {
  const lots = ctx.state.lots ?? []
  const [lotNo, setLotNo] = useState(lots[0]?.lotNo ?? '')
  const selected = lotNo || lots[0]?.lotNo || ''
  const trace = selected ? traceLot(ctx.state, selected) : null
  const waste = lots.reduce((sum, lot) => sum + lot.wasteKg, 0)
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="دفعات الإنتاج" value={String(lots.length)} />
        <Metric label="الهدر المسجل" value={`${qtyFmt(waste)} كجم`} />
        <Metric label="الربط" value={trace?.rawBatches.length ? 'مكتمل' : 'بانتظار دفعة'} hint="الخام والمورد والعامل والعميل يُقرأون من سجل الدفعة" />
      </div>
      <Card title="دفعات الإنتاج" hint="كل سطر دفعة حقيقية أُنشئت عند إكمال أمر الإنتاج، ورقمها LOT-YYYYMMDD-###.">
        <DataTable
          columns={['رقم الدفعة', 'المنتج', 'المشغّل', 'الداخل / المتوقع / الفعلي', 'الفارق', 'تكلفة/طن', 'بيع/طن', 'الهامش/طن', '']}
          rows={lots.map((lot) => {
            const margin = lot.marginPerTon
            const operator = ctx.state.employees.find((item) => item.id === lot.operatorId)?.nameAr ?? '—'
            return [
              lot.legacy ? `${lot.lotNo} · قديم` : lot.lotNo,
              productName(ctx.state, lot.productId),
              operator,
              `${qtyFmt(lot.inputKg)} / ${qtyFmt(lot.expectedOutputKg)} / ${qtyFmt(lot.actualOutputKg)}`,
              `${qtyFmt(lot.varianceKg)} (${pctFmt(lot.variancePct)})`,
              moneyFmt(lot.costPerTon),
              lot.salePricePerTon != null ? moneyFmt(lot.salePricePerTon) : '—',
              margin != null ? <span className={margin < 0 ? 'font-bold text-[#dc2626]' : undefined}>{moneyFmt(margin)}</span> : '—',
              <GhostButton key={lot.id} type="button" onClick={() => setLotNo(lot.lotNo)}>تتبع</GhostButton>,
            ]
          })}
        />
      </Card>
      {trace ? (
        <Card title={`تتبع ${trace.lot.lotNo}`} hint={detail ? 'من الدفعة إلى خامات الموردين ثم إلى العملاء.' : 'تفاصيل الدفعة المختارة.'}>
          <div className="mb-4 grid gap-2 text-sm leading-7 text-[#30453d] sm:grid-cols-2">
            <div>المنتج: {trace.product?.nameAr ?? '—'}</div>
            <div>المشغّل: {trace.operator?.nameAr ?? '—'}</div>
            <div>أمر الإنتاج: {ctx.state.productionOrders.find((item) => item.id === trace.lot.productionOrderId)?.number ?? trace.lot.productionOrderId}</div>
            <div>تاريخ التصنيع: {trace.lot.manufacturedAt.slice(0, 16).replace('T', ' ')}</div>
            {trace.lot.legacyNote ? <div className="sm:col-span-2">تصنيف: {trace.lot.legacyNote}</div> : null}
          </div>
          <DataTable
            columns={['الخامة', 'دفعة الخام', 'المورد', 'الكمية', 'تكلفة الوحدة']}
            rows={trace.rawBatches.map((line) => [line.materialName, line.sourceBatchNo, line.supplierName ?? '—', qtyFmt(line.qty), moneyFmt(line.unitCost)])}
          />
          <div className="mt-4">
            <DataTable
              columns={['الحركة', 'العميل', 'الكمية', 'الوقت']}
              rows={trace.deliveries.map((delivery) => [
                delivery.invoiceId
                  ? ctx.state.invoices.find((item) => item.id === delivery.invoiceId)?.number ?? 'فاتورة'
                  : ctx.state.withdrawals.find((item) => item.id === delivery.withdrawalId)?.number ?? 'سحب',
                delivery.customerId ? ctx.state.customers.find((item) => item.id === delivery.customerId)?.nameAr ?? '—' : 'سحب داخلي',
                qtyFmt(delivery.qty),
                delivery.at.slice(0, 16).replace('T', ' '),
              ])}
            />
          </div>
        </Card>
      ) : null}
    </div>
  )
}
