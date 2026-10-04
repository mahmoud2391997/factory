'use client'

import { useState } from 'react'
import Link from 'next/link'

import { COST_LABEL, lotEconomics } from '@/lib/erp/domain/costing'
import { filterLots, operatorLabel, recallReport, traceLot } from '@/lib/erp/domain/reports'
import { useLanguage } from '@/lib/i18n/language-provider'
import type { TranslationKey } from '@/lib/i18n/translations'
import { translateUiText } from '@/lib/i18n/translations'

import { Badge, Card, DataTable, ExportLinks, Field, FormDialog, GhostButton, PrimaryButton, SelectInput, TextInput, toneForStatus } from './bits'
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
  const { language } = useLanguage()
  return (
    <div className="relative overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-white p-4 ps-5 shadow-sm">
      <span aria-hidden className="absolute inset-y-3 right-0 w-1.5 rounded-full bg-[#0d9488]" />
      <div className="text-sm font-medium text-[#6b7280]">{translateUiText(language, label)}</div>
      <div className="mt-2 text-2xl font-semibold leading-none text-[#1f1f1f]">{translateUiText(language, value)}</div>
      {hint ? <div className="mt-2 text-sm text-[#53655e]">{translateUiText(language, hint)}</div> : null}
    </div>
  )
}

export function LotsScreen({ ctx, detail }: { ctx: LiveCtx; detail?: boolean }) {
  const { t, language } = useLanguage()
  const lots = ctx.state.lots ?? []
  const [lotNo, setLotNo] = useState(lots[0]?.lotNo ?? '')
  const [closeMonth, setCloseMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [productId, setProductId] = useState('')
  const [fromDay, setFromDay] = useState('')
  const [toDay, setToDay] = useState('')
  const [qcStatus, setQcStatus] = useState('')
  const [marginSign, setMarginSign] = useState<'all' | 'negative' | 'positive'>('all')
  const [searchMaterialId, setSearchMaterialId] = useState(ctx.state.materials[0]?.id ?? '')
  const [searchBatchNo, setSearchBatchNo] = useState('')
  const filtered = filterLots(ctx.state, { productId, fromDay, toDay, qcStatus, marginSign })
  const batchRecall = searchMaterialId && searchBatchNo.trim()
    ? recallReport(ctx.state, { materialId: searchMaterialId, batchNo: searchBatchNo })
    : null
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
  const latestLotHold = trace
    ? (ctx.state.qualityHolds ?? []).filter((hold) => hold.targetType === 'LOT' && hold.lotNo === trace.lot.lotNo).at(-1)
    : undefined
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
        extra={can(ctx.permissions, 'production.read') || can(ctx.permissions, 'accounting.read') ? <ExportLinks href={exportHref} /> : null}
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
      {detail ? (
        <Card title="تتبع أمامي لدفعة الخام" hint="ابحث برقم دفعة المورد لمعرفة دفعات الإنتاج والعملاء والفواتير المتأثرة.">
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="المادة الخام"><SelectInput value={searchMaterialId} onChange={(event) => setSearchMaterialId(event.target.value)}>{ctx.state.materials.map((material) => <option key={material.id} value={material.id}>{material.nameAr}</option>)}</SelectInput></Field>
            <Field label="رقم دفعة المورد"><TextInput value={searchBatchNo} onChange={(event) => setSearchBatchNo(event.target.value)} /></Field>
          </div>
          {batchRecall ? <>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{batchRecall.lots.length} دفعة إنتاج، {batchRecall.affectedCustomers.length} عميل متأثر</p>
              <Link className="text-sm font-semibold text-[#0d9488]" href={`/print/recall?${new URLSearchParams({ materialId: searchMaterialId, batchNo: searchBatchNo.trim() }).toString()}`} target="_blank" rel="noreferrer">طباعة تقرير التتبع</Link>
            </div>
            <DataTable columns={['دفعة الإنتاج', 'المنتج', 'العميل', 'الكمية كجم', 'الفاتورة', 'التاريخ']} rows={batchRecall.deliveries.map((delivery) => [
              delivery.lotNo, delivery.product, delivery.customer, qtyFmt(delivery.quantityKg), delivery.invoiceNo ?? '—', delivery.date,
            ])} />
          </> : <p className="mt-3 text-sm text-[#6b7280]">أدخل رقم دفعة مورد لعرض التتبع الأمامي.</p>}
        </Card>
      ) : null}
      {trace ? (
        <Card
          title={`${translateUiText(language, 'تتبع')} ${trace.lot.lotNo}`}
          hint={detail ? 'من الدفعة إلى خامات الموردين ثم إلى العملاء.' : 'تفاصيل الدفعة المختارة.'}
          extra={<Link className="text-sm font-semibold text-[#0d9488]" href={`/print/lot/${encodeURIComponent(trace.lot.lotNo)}`} target="_blank" rel="noreferrer">طباعة الشهادة</Link>}
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
          <div className="mb-4 flex flex-wrap gap-2">
            {latestLotHold?.status === 'HELD' && can(ctx.permissions, 'qc.release') ? <QualityHoldAction ctx={ctx} lotNo={trace.lot.lotNo} release /> : null}
            {latestLotHold?.status !== 'HELD' && latestLotHold?.status !== 'RECALLED' && can(ctx.permissions, 'qc.manage') ? <QualityHoldAction ctx={ctx} lotNo={trace.lot.lotNo} /> : null}
            {latestLotHold?.status !== 'RECALLED' && can(ctx.permissions, 'qc.release') ? <QualityHoldAction ctx={ctx} lotNo={trace.lot.lotNo} recall /> : null}
            <Link className="rounded-md border border-[#e5e7eb] px-3 py-2 text-sm font-medium" href={`/print/recall?${new URLSearchParams({ lotNo: trace.lot.lotNo }).toString()}`} target="_blank" rel="noreferrer">تقرير الاستدعاء</Link>
          </div>
          {(ctx.state.qualityHolds ?? []).filter((hold) => hold.targetType === 'LOT' && hold.lotNo === trace.lot.lotNo).map((hold) => (
            <p key={hold.id} className="mb-2 text-sm text-[#6b7280]">
              {qualityHoldStatusLabel(hold.status)} — {hold.reason} — {ctx.state.users.find((user) => user.id === hold.createdBy)?.fullName ?? hold.createdBy}
              {hold.resolutionReason ? ` — سبب الإنهاء: ${hold.resolutionReason}` : ''}
            </p>
          ))}
          <DataTable
            columns={['الخامة', 'دفعة الخام', 'المورد', 'الكمية', 'تكلفة الوحدة', 'الحجر']}
            rows={trace.rawBatches.map((line) => [
              line.materialName, line.sourceBatchNo, line.supplierName ?? '—', qtyFmt(line.qty), moneyFmt(line.unitCost),
              <RawBatchHoldAction key={`${line.materialId}-${line.sourceBatchNo}`} ctx={ctx} materialId={line.materialId} batchNo={line.sourceBatchNo} />,
            ])}
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

type HoldAction = 'holdLot' | 'releaseLot' | 'recallLot' | 'holdRawBatch' | 'releaseRawBatch'

function HoldActionDialog({
  ctx,
  action,
  target,
}: {
  ctx: LiveCtx
  action: HoldAction
  target: { lotNo?: string; materialId?: string; batchNo?: string }
}) {
  const { language } = useLanguage()
  const [reason, setReason] = useState('')
  const label = translateUiText(language, action.startsWith('hold') ? 'حجر' : action.startsWith('release') ? 'رفع الحجر' : 'استدعاء')
  const batchLabel = translateUiText(language, target.lotNo ? 'دفعة الإنتاج' : 'دفعة الخام')
  return <FormDialog title={`${label} ${batchLabel}`} openLabel={label}>
    {(close) => <form className="grid gap-3" onSubmit={async (event) => {
      event.preventDefault()
      const result = await ctx.act(action, { ...target, reason })
      if (result.ok) { setReason(''); close() }
    }}>
      <Field label={`${translateUiText(language, 'سبب')} ${label}`}><TextInput value={reason} onChange={(event) => setReason(event.target.value)} required minLength={2} /></Field>
      <PrimaryButton disabled={ctx.pending || reason.trim().length < 2}>{label}</PrimaryButton>
    </form>}
  </FormDialog>
}

function QualityHoldAction({ ctx, lotNo, release = false, recall = false }: { ctx: LiveCtx; lotNo: string; release?: boolean; recall?: boolean }) {
  const action: HoldAction = release ? 'releaseLot' : recall ? 'recallLot' : 'holdLot'
  return <HoldActionDialog ctx={ctx} action={action} target={{ lotNo }} />
}

function qualityHoldStatusLabel(status: 'HELD' | 'RELEASED' | 'RECALLED') {
  if (status === 'HELD') return 'محجورة'
  if (status === 'RECALLED') return 'مستدعاة'
  return 'تم رفع الحجر'
}

function RawBatchHoldAction({ ctx, materialId, batchNo }: { ctx: LiveCtx; materialId: string; batchNo: string }) {
  const latest = (ctx.state.qualityHolds ?? []).filter(
    (hold) => hold.targetType === 'RAW_BATCH' && hold.materialId === materialId && hold.batchNo === batchNo,
  ).at(-1)
  if (latest?.status === 'RECALLED') return <Badge tone="bad">مستدعاة</Badge>
  const release = latest?.status === 'HELD'
  const allowed = can(ctx.permissions, release ? 'qc.release' : 'qc.manage')
  if (!allowed) return latest?.status === 'HELD' ? <Badge tone="bad">محجورة</Badge> : '—'
  return <HoldActionDialog ctx={ctx} action={release ? 'releaseRawBatch' : 'holdRawBatch'} target={{ materialId, batchNo }} />
}
