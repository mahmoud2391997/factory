'use client'

import { useState } from 'react'

import { COST_LABEL, lotEconomics } from '@/lib/erp/domain/costing'
import { filterLots, operatorLabel, traceLot } from '@/lib/erp/domain/reports'
import { useLanguage } from '@/lib/i18n/language-provider'
import type { TranslationKey } from '@/lib/i18n/translations'

import { Badge, Card, DataTable, Field, GhostButton, SelectInput, TextInput, toneForStatus } from './bits'
import type { LiveCtx } from './ctx'
import { can, moneyFmt, pctFmt, productName, qtyFmt, statusLabel } from './format'

const BASIS_KEY: Record<string, TranslationKey> = {
  ACTUAL: 'basisActual',
  ESTIMATED: 'basisEstimated',
  MANUAL: 'basisManual',
}

function basisTone(basis?: string): 'good' | 'warn' | 'neutral' {
  if (basis === 'ACTUAL') return 'good'
  if (basis === 'ESTIMATED') return 'warn'
  return 'neutral'
}

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
  const { t } = useLanguage()
  const lots = ctx.state.lots ?? []
  const [lotNo, setLotNo] = useState(lots[0]?.lotNo ?? '')
  const [closeMonth, setCloseMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [productId, setProductId] = useState('')
  const [fromDay, setFromDay] = useState('')
  const [toDay, setToDay] = useState('')
  const [qcStatus, setQcStatus] = useState('')
  const [marginSign, setMarginSign] = useState<'all' | 'negative' | 'positive'>('all')
  const filtered = filterLots(ctx.state, { productId, fromDay, toDay, qcStatus, marginSign })
  const exportHref = `/api/erp/export?${new URLSearchParams({
    kind: 'lots',
    ...(productId ? { productId } : {}),
    ...(fromDay ? { from: fromDay } : {}),
    ...(toDay ? { to: toDay } : {}),
    ...(qcStatus ? { qc: qcStatus } : {}),
    ...(marginSign !== 'all' ? { margin: marginSign } : {}),
  }).toString()}`
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
      <Card
        title="دفعات الإنتاج"
        hint="كل سطر دفعة حقيقية أُنشئت عند إكمال أمر الإنتاج، ورقمها LOT-YYYYMMDD-###."
        extra={can(ctx.permissions, 'reports.read') ? <a className="text-sm font-semibold text-[#0d9488]" href={exportHref}>تصدير Excel</a> : null}
      >
        <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="المنتج">
            <SelectInput value={productId} onChange={(event) => setProductId(event.target.value)}>
              <option value="">الكل</option>
              {ctx.state.products.map((product) => <option key={product.id} value={product.id}>{product.nameAr}</option>)}
            </SelectInput>
          </Field>
          <Field label="من"><TextInput type="date" value={fromDay} onChange={(event) => setFromDay(event.target.value)} /></Field>
          <Field label="إلى"><TextInput type="date" value={toDay} onChange={(event) => setToDay(event.target.value)} /></Field>
          <Field label="الجودة">
            <SelectInput value={qcStatus} onChange={(event) => setQcStatus(event.target.value)}>
              <option value="">الكل</option>
              {['UNTESTED', 'PENDING', 'PASSED', 'FAILED', 'HOLD'].map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
            </SelectInput>
          </Field>
          <Field label="الهامش">
            <SelectInput value={marginSign} onChange={(event) => setMarginSign(event.target.value as 'all' | 'negative' | 'positive')}>
              <option value="all">الكل</option>
              <option value="negative">سالب</option>
              <option value="positive">موجب</option>
            </SelectInput>
          </Field>
        </div>
        <DataTable
          columns={['رقم الدفعة', 'المنتج', 'المشغّل', 'الداخل / المتوقع / الفعلي', 'الفارق', 'تكلفة/طن', 'بيع/طن', 'الهامش/طن', 'الهامش %', '']}
          rows={filtered.map((lot) => {
            const margin = lot.marginPerTon
            const operator = operatorLabel(ctx.state.employees, lot.operatorId)
            return [
              lot.legacy ? `${lot.lotNo} · قديم` : lot.lotNo,
              productName(ctx.state, lot.productId),
              operator,
              `${qtyFmt(lot.inputKg)} / ${qtyFmt(lot.expectedOutputKg)} / ${qtyFmt(lot.actualOutputKg)}`,
              `${qtyFmt(lot.varianceKg)} (${pctFmt(lot.variancePct)})`,
              moneyFmt(lot.costPerTon),
              lot.salePricePerTon != null ? moneyFmt(lot.salePricePerTon) : '—',
              margin != null ? <span className={margin < 0 ? 'font-bold text-[#dc2626]' : undefined}>{moneyFmt(margin)}</span> : '—',
              lot.marginPct != null ? <span className={lot.marginPct < 0 ? 'font-bold text-[#dc2626]' : undefined}>{pctFmt(lot.marginPct)}</span> : '—',
              <GhostButton key={lot.id} type="button" onClick={() => setLotNo(lot.lotNo)}>تتبع</GhostButton>,
            ]
          })}
        />
      </Card>
      {trace ? (
        <Card
          title={`تتبع ${trace.lot.lotNo}`}
          hint={detail ? 'من الدفعة إلى خامات الموردين ثم إلى العملاء.' : 'تفاصيل الدفعة المختارة.'}
          extra={<a className="text-sm font-semibold text-[#0d9488]" href={`/print/lot/${encodeURIComponent(trace.lot.lotNo)}`} target="_blank" rel="noreferrer">طباعة الشهادة</a>}
        >
          <div className="mb-4 grid gap-2 text-sm leading-7 text-[#30453d] sm:grid-cols-2">
            <div>المنتج: {trace.product?.nameAr ?? '—'}</div>
            <div>المشغّل: {trace.operatorName}</div>
            <div>أمر الإنتاج: {ctx.state.productionOrders.find((item) => item.id === trace.lot.productionOrderId)?.number ?? trace.lot.productionOrderId}</div>
            <div>تاريخ التصنيع: {trace.lot.manufacturedAt.slice(0, 16).replace('T', ' ')}</div>
            <div>
              الجودة:{' '}
              <Badge tone={toneForStatus(trace.lot.qcStatus ?? 'UNTESTED')}>{statusLabel(trace.lot.qcStatus ?? 'UNTESTED')}</Badge>
            </div>
            {trace.lot.legacyNote ? <div className="sm:col-span-2">تصنيف: {trace.lot.legacyNote}</div> : null}
          </div>
          <DataTable
            columns={['الخامة', 'دفعة الخام', 'المورد', 'الكمية', 'تكلفة الوحدة']}
            rows={trace.rawBatches.map((line) => [line.materialName, line.sourceBatchNo, line.supplierName ?? '—', qtyFmt(line.qty), moneyFmt(line.unitCost)])}
          />
          <div className="mt-4">
            <DataTable
              columns={['بند التكلفة', 'المبلغ', 'النسبة', t('costBasis'), t('source')]}
              rows={trace.lot.costLines.map((line) => [
                COST_LABEL[line.type],
                moneyFmt(line.amount),
                trace.lot.totalCost > 0 ? pctFmt((line.amount / trace.lot.totalCost) * 100) : pctFmt(0),
                <Badge key={`${line.type}-basis`} tone={basisTone(line.basis)}>
                  {line.basis ? t(BASIS_KEY[line.basis] ?? 'basisEstimated') : t('basisEstimated')}
                </Badge>,
                line.source ?? '—',
              ])}
            />
          </div>
          {(trace.lot.pendingCostLines ?? []).length > 0 ? (
            <div className="mt-4">
              <DataTable
                columns={['بند بانتظار الاعتماد', 'المبلغ', '']}
                rows={(trace.lot.pendingCostLines ?? []).map((line) => [
                  <span key={line.id} className="inline-flex items-center gap-2">{COST_LABEL[line.type]} <Badge tone="warn">بانتظار الاعتماد</Badge></span>,
                  moneyFmt(line.amount),
                  can(ctx.permissions, 'production.cost.approve') ? (
                    <span key={`${line.id}-act`} className="flex gap-2">
                      <GhostButton type="button" onClick={() => ctx.act('decideProductionCost', { lotId: trace.lot.id, lineId: line.id, decision: 'APPROVED' })}>اعتماد</GhostButton>
                      <GhostButton type="button" onClick={() => ctx.act('decideProductionCost', { lotId: trace.lot.id, lineId: line.id, decision: 'REJECTED' })}>رفض</GhostButton>
                    </span>
                  ) : '—',
                ])}
              />
              {lotEconomics(trace.lot).provisionalMarginPerTon != null ? (
                <p className={`mt-2 text-sm ${(lotEconomics(trace.lot).provisionalMarginPerTon ?? 0) < 0 ? 'font-bold text-[#dc2626]' : 'text-[#53655e]'}`}>
                  هامش مؤقت لو اعتُمدت البنود: {moneyFmt(lotEconomics(trace.lot).provisionalMarginPerTon ?? 0)} / طن. الهامش المعتمد يستثني ما لم يُعتمد.
                </p>
              ) : (
                <p className="mt-2 text-sm text-[#53655e]">البنود المعلقة لا تدخل في تكلفة الطن ولا في الهامش حتى الاعتماد.</p>
              )}
            </div>
          ) : null}
          {trace.samples.length > 0 ? (
            <div className="mt-4">
              <DataTable
                columns={['وقت العينة', 'رطوبة', 'بروتين', 'رماد', 'النتيجة', 'ملاحظات']}
                rows={trace.samples.map((sample) => [
                  sample.sampledAt.slice(0, 16).replace('T', ' '),
                  sample.moisturePct ?? '—',
                  sample.proteinPct ?? '—',
                  sample.ashPct ?? '—',
                  sample.result,
                  sample.notes ?? '—',
                ])}
              />
            </div>
          ) : null}
          <div className="mt-4">
            <DataTable
              columns={['الحركة', 'العميل', 'الكمية', 'الوقت']}
              rows={trace.deliveries.map((delivery) => [
                delivery.invoiceId
                  ? ctx.state.invoices.find((item) => item.id === delivery.invoiceId)?.number ?? 'فاتورة'
                  : ctx.state.withdrawals.find((item) => item.id === delivery.withdrawalId)?.number ?? 'سحب',
                delivery.customerId ? ctx.state.customers.find((item) => item.id === delivery.customerId)?.nameAr ?? '—' : 'سحب داخلي',
                delivery.allocation === 'proportional' ? `${qtyFmt(delivery.qty)} (موزّعة)` : qtyFmt(delivery.qty),
                delivery.unallocatedNote ? `${delivery.at.slice(0, 16).replace('T', ' ')} — ${delivery.unallocatedNote}` : delivery.at.slice(0, 16).replace('T', ' '),
              ])}
            />
          </div>
        </Card>
      ) : null}
      {can(ctx.permissions, 'production.cost.recalculate') ? (
        <Card
          title={t('costRecalculation')}
          hint="عند إغلاق الشهر تُستبدل البنود التقديرية ببنود فعلية من قراءات المرافق والرواتب والصيانة والتعبئة. البنود اليدوية لا تُمس، وكل تغيير يُسجَّل في التدقيق."
        >
          <div className="flex flex-wrap items-end gap-3">
            <Field label={t('month')}>
              <TextInput type="month" value={closeMonth} onChange={(event) => setCloseMonth(event.target.value)} />
            </Field>
            <GhostButton
              type="button"
              disabled={ctx.pending}
              onClick={() => ctx.act('recalculateLotCosts', { month: closeMonth })}
            >
              {t('recalculate')}
            </GhostButton>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
