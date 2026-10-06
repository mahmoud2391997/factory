'use client'

import { LocalizedContent } from '@/lib/i18n/localized-content'

import { useMemo, useState, type ReactNode } from 'react'

import { COST_LABEL } from '@/lib/erp/domain/costing'
import { factoryStatus, muscatDay, productionCostSummary, stockRows, varianceReport } from '@/lib/erp/domain/reports'
import type { VarianceGroupBy } from '@/lib/erp/domain/reports'
import { useLanguage } from '@/lib/i18n/language-provider'
import { translateUiText } from '@/lib/i18n/translations'

import { Card, DataTable, Field, SelectInput, TextInput } from './bits'
import type { LiveCtx } from './ctx'
import { LotsScreen } from './lot-view'
import { dayFmt, moneyFmt, partyName, pctFmt, productName, qtyFmt, statusLabel, tonsFmt, WAREHOUSE_LABEL } from './format'

const FACTORY_KEYS = new Set([
  'factoryPlanned',
  'factoryActual',
  'factoryExecution',
  'factorySalesToday',
  'factorySalesMonth',
  'factoryOpenOrders',
  'factoryCostPerTon',
  'factoryAvgPrice',
  'factoryMargin',
  'factoryStockValue',
  'factoryRunningOut',
  'factoryStagnant',
  'factoryReserved',
  'factoryWaste',
  'factoryDeviation',
  'factoryStoppages',
  'varianceReport',
  'productionLot',
  'lotTrace',
])

function DayNote({ day, shifted }: { day: string; shifted: boolean }) {
  const { language } = useLanguage()
  return (<LocalizedContent>{<p className="text-sm text-[#788983]">{translateUiText(language, shifted ? `آخر يوم تشغيل: ${dayFmt(day)}` : dayFmt(day))}</p>}</LocalizedContent>)
}

function Metric({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'bad' | 'good' }) {
  const { language } = useLanguage()
  const toneClass = tone === 'bad' ? 'text-[#dc2626]' : tone === 'good' ? 'text-[#1e127c]' : 'text-[#1f1f1f]'
  const barClass = tone === 'bad' ? 'bg-[#ef4444]' : tone === 'good' ? 'bg-[#7664d8]' : 'bg-[#1e127c]'
  return (<LocalizedContent>{(
    <div className="relative overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-white p-4 ps-5 shadow-sm">
      <span aria-hidden className={`absolute inset-y-3 right-0 w-1.5 rounded-full ${barClass}`} />
      <div className="text-sm font-medium text-[#6b7280]">{translateUiText(language, label)}</div>
      <div className={`mt-2 text-3xl font-semibold leading-none tracking-tight ${toneClass}`}>{translateUiText(language, value)}</div>
      {hint ? <div className="mt-2 text-sm text-[#53655e]">{translateUiText(language, hint)}</div> : null}
    </div>
  )}</LocalizedContent>)
}

export function FactoryScreens({ entityKey, ctx }: { entityKey: string; ctx: LiveCtx }) {
  const { language } = useLanguage()
  const status = useMemo(() => factoryStatus(ctx.state, new Date().toISOString()), [ctx.state])
  if (!FACTORY_KEYS.has(entityKey)) return null

  const day = status.day
  const orders = ctx.state.productionOrders.filter(
    (order) => muscatDay(order.createdAt) === day || (order.completedAt ? muscatDay(order.completedAt) === day : false),
  )
  const completed = orders.filter((order) => order.status === 'COMPLETED' && order.completedAt && muscatDay(order.completedAt) === day)
  const posted = ctx.state.invoices.filter((invoice) => invoice.status !== 'DRAFT')
  const todayInvoices = posted.filter((invoice) => muscatDay(invoice.issuedAt) === day)
  const monthInvoices = posted.filter((invoice) => muscatDay(invoice.issuedAt).slice(0, 7) === status.month && muscatDay(invoice.issuedAt) <= day)
  const note = <DayNote day={day} shifted={status.shifted} />

  if (entityKey === 'factoryPlanned' || entityKey === 'factoryActual' || entityKey === 'factoryExecution') {
    return (<LocalizedContent>{(
      <div className="space-y-4">
        {note}
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="المخطط اليوم" value={tonsFmt(status.production.plannedKg)} />
          <Metric label="الفعلي" value={tonsFmt(status.production.actualKg)} />
          <Metric label="نسبة التنفيذ" value={pctFmt(status.production.executionPct)} hint={`${tonsFmt(status.production.actualKg)} ${language === 'ar' ? 'من' : language === 'hi' ? 'में से' : 'of'} ${tonsFmt(status.production.plannedKg)}`} />
        </div>
        <Card title="أوامر اليوم">
          <DataTable
            columns={['الأمر', 'المنتج', 'المخطط', 'الفعلي', 'التنفيذ', 'الحالة']}
            rows={orders.map((order) => {
              const rate = order.plannedQty > 0 ? (order.actualOutputQty / order.plannedQty) * 100 : 0
              return [
                order.number,
                productName(ctx.state, order.productId),
                tonsFmt(order.plannedQty),
                tonsFmt(order.actualOutputQty),
                pctFmt(rate),
                statusLabel(order.status),
              ]
            })}
          />
        </Card>
      </div>
    )}</LocalizedContent>)
  }

  if (entityKey === 'factorySalesToday' || entityKey === 'factorySalesMonth') {
    const rows = entityKey === 'factorySalesToday' ? todayInvoices : monthInvoices
    const total = entityKey === 'factorySalesToday' ? status.sales.today : status.sales.month
    return (<LocalizedContent>{(
      <div className="space-y-4">
        {note}
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="مبيعات اليوم" value={moneyFmt(status.sales.today)} hint={status.sales.todayCount ? `${status.sales.todayCount} ${translateUiText(language, 'فاتورة')}` : translateUiText(language, 'لا توجد فواتير')} />
          <Metric label="مبيعات الشهر" value={moneyFmt(status.sales.month)} hint={`${status.sales.monthCount} ${translateUiText(language, 'فاتورة')}`} />
        </div>
        <Card title={entityKey === 'factorySalesToday' ? 'فواتير اليوم' : 'فواتير الشهر'} hint={`${translateUiText(language, 'الإجمالي الظاهر في البطاقة:')} ${moneyFmt(total)} ${translateUiText(language, 'قبل الضريبة')}`}>
          <DataTable
            columns={['الفاتورة', 'العميل', 'التاريخ', 'الصافي', 'الإجمالي', 'الحالة']}
            rows={rows.map((invoice) => [
              invoice.number,
              partyName(ctx.state.customers, invoice.customerId),
              dayFmt(muscatDay(invoice.issuedAt)),
              moneyFmt(invoice.subtotal),
              moneyFmt(invoice.total),
              statusLabel(invoice.status),
            ])}
          />
        </Card>
      </div>
    )}</LocalizedContent>)
  }

  if (entityKey === 'factoryOpenOrders') {
    return (<LocalizedContent>{(
      <div className="space-y-4">
        {note}
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="الطلبات المفتوحة" value={String(status.sales.openCount)} />
          <Metric label="المتبقي" value={moneyFmt(status.sales.openOutstanding)} />
        </div>
        <Card title="الطلبات المفتوحة" hint="مسودة، مؤكدة، أو تحصيلها جزئي.">
          <DataTable
            columns={['الفاتورة', 'العميل', 'الحالة', 'الإجمالي', 'المتبقي']}
            rows={status.sales.openOrders.map((order) => [
              order.number,
              order.customer,
              statusLabel(order.status),
              moneyFmt((ctx.state.invoices.find((invoice) => invoice.id === order.id)?.total ?? order.outstanding)),
              moneyFmt(order.outstanding),
            ])}
          />
        </Card>
      </div>
    )}</LocalizedContent>)
  }

  if (entityKey === 'factoryCostPerTon') {
    return (<LocalizedContent>{<CostBreakdown ctx={ctx} note={note} day={day} />}</LocalizedContent>)
  }

  if (entityKey === 'factoryAvgPrice' || entityKey === 'factoryMargin') {
    return (<LocalizedContent>{(
      <div className="space-y-4">
        {note}
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="تكلفة الطن" value={moneyFmt(status.profit.costPerTon)} />
          <Metric label="متوسط سعر البيع" value={moneyFmt(status.profit.avgPricePerTon)} />
          <Metric label="هامش الربح/طن" value={moneyFmt(status.profit.marginPerTon)} hint="متوسط سعر البيع − تكلفة الطن" tone={status.profit.marginPerTon < 0 ? 'bad' : status.profit.marginPerTon > 0 ? 'good' : undefined} />
        </div>
        <Card title="تكلفة أوامر اليوم">
          <DataTable
            columns={['الأمر', 'المنتج', 'الناتج', 'التكلفة', 'تكلفة الطن']}
            rows={completed.map((order) => [
              order.number,
              productName(ctx.state, order.productId),
              tonsFmt(order.actualOutputQty),
              moneyFmt(order.totalCost),
              moneyFmt(order.actualOutputQty > 0 ? (order.totalCost / order.actualOutputQty) * 1000 : 0),
            ])}
          />
        </Card>
      </div>
    )}</LocalizedContent>)
  }

  if (entityKey === 'factoryStockValue') {
    const rows = stockRows(ctx.state)
    return (<LocalizedContent>{(
      <div className="space-y-4">
        {note}
        <Metric label="قيمة المخزون" value={moneyFmt(status.inventory.value)} />
        <Card title="تفاصيل الأرصدة">
          <DataTable
            columns={['المستودع', 'الصنف', 'الكمية', 'تكلفة الوحدة', 'القيمة']}
            rows={rows.map((row) => [WAREHOUSE_LABEL[row.warehouse] ?? row.warehouse, row.nameAr, `${qtyFmt(row.qty)} ${row.unit}`, moneyFmt(row.unitCost), moneyFmt(row.value)])}
          />
        </Card>
      </div>
    )}</LocalizedContent>)
  }

  if (entityKey === 'factoryRunningOut') {
    return (<LocalizedContent>{(
      <div className="space-y-4">
        {note}
        <Metric label="المواد التي ستنفد" value={String(status.inventory.runningOut.length)} hint="رصيدها عند الحد الأدنى أو دونه" />
        <Card title="المواد التي ستنفد">
          <DataTable
            columns={['المادة', 'الرصيد', 'الحد الأدنى', 'الوحدة']}
            rows={status.inventory.runningOut.map((item) => [item.nameAr, qtyFmt(item.onHand), qtyFmt(item.minQty), item.unit])}
          />
        </Card>
      </div>
    )}</LocalizedContent>)
  }

  if (entityKey === 'factoryStagnant') {
    return (<LocalizedContent>{(
      <div className="space-y-4">
        {note}
        <Metric label="المواد الراكدة" value={String(status.inventory.stagnant.length)} hint="بلا حركة صادرة منذ 7 أيام أو أكثر" />
        <Card title="المواد الراكدة">
          <DataTable
            columns={['المادة', 'الرصيد', 'الوحدة', 'أيام الركود']}
            rows={status.inventory.stagnant.map((item) => [item.nameAr, qtyFmt(item.onHand), item.unit, String(item.idleDays)])}
          />
        </Card>
      </div>
    )}</LocalizedContent>)
  }

  if (entityKey === 'factoryReserved') {
    return (<LocalizedContent>{(
      <div className="space-y-4">
        {note}
        <Metric label="المواد المحجوزة" value={String(status.inventory.reserved.length)} hint="لأمر إنتاج مفتوح أو في مستودع التصنيع" />
        <Card title="المواد المحجوزة">
          <DataTable
            columns={['المادة', 'الكمية', 'الوحدة']}
            rows={status.inventory.reserved.map((item) => [item.nameAr, qtyFmt(item.qty), item.unit])}
          />
        </Card>
      </div>
    )}</LocalizedContent>)
  }

  if (entityKey === 'factoryWaste') {
    const lines = completed.flatMap((order) =>
      order.expected
        .filter((line) => line.wasteQty > 0)
        .map((line) => [order.number, ctx.state.materials.find((item) => item.id === line.materialId)?.nameAr ?? line.materialId, qtyFmt(line.actualQty), qtyFmt(line.wasteQty)]),
    )
    return (<LocalizedContent>{(
      <div className="space-y-4">
        {note}
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="الهدر" value={`${qtyFmt(status.operations.wasteKg)} كجم`} />
          <Metric label="نسبة الهدر" value={pctFmt(status.operations.wastePct)} hint="من الكمية المصروفة" />
        </div>
        <Card title="الهدر">
          <DataTable columns={['الأمر', 'المادة', 'المصروف', 'الهدر']} rows={lines} />
        </Card>
      </div>
    )}</LocalizedContent>)
  }

  if (entityKey === 'varianceReport') {
    return (<LocalizedContent>{<VarianceReportScreen ctx={ctx} />}</LocalizedContent>)
  }

  if (entityKey === 'productionLot' || entityKey === 'lotTrace') {
    return (<LocalizedContent>{(
      <div className="space-y-4">
        {note}
        <LotsScreen ctx={ctx} detail={entityKey === 'lotTrace'} />
      </div>
    )}</LocalizedContent>)
  }

  if (entityKey === 'factoryDeviation') {
    return (<LocalizedContent>{(
      <div className="space-y-4">
        {note}
        <Metric
          label="الانحراف عن الوصفة"
          value={status.operations.deviations[0] ? pctFmt(status.operations.deviations[0].diffPct) : pctFmt(0)}
          hint={status.operations.deviations[0]?.reason ? `السبب: ${status.operations.deviations[0].reason}` : 'ضمن الوصفة'}
        />
        <Card title="الانحراف عن الوصفة">
          <DataTable
            columns={['المادة', 'المتوقع', 'الفعلي', 'الانحراف']}
            rows={status.operations.deviations.map((line) => [line.nameAr, qtyFmt(line.expectedQty), qtyFmt(line.actualQty), pctFmt(line.diffPct)])}
          />
        </Card>
      </div>
    )}</LocalizedContent>)
  }

  return (<LocalizedContent>{(
    <div className="space-y-4">
      {note}
      <Metric label="توقفات المصنع" value={status.operations.stoppageMinutes ? `${status.operations.stoppageMinutes} دقيقة` : 'لا توجد'} hint={status.operations.stoppages.length ? `${status.operations.stoppages.length} توقف` : 'الخط يعمل'} />
      <Card title="توقفات المصنع">
        <DataTable
          columns={['المنطقة', 'المدة', 'السبب']}
          rows={status.operations.stoppages.map((item) => [item.area, `${item.minutes} دقيقة`, item.reason])}
        />
      </Card>
    </div>
  )}</LocalizedContent>)
}

function VarianceReportScreen({ ctx }: { ctx: LiveCtx }) {
  const { t } = useLanguage()
  const [groupBy, setGroupBy] = useState<VarianceGroupBy>('PRODUCT')
  const rows = varianceReport(ctx.state, groupBy)
  const expected = rows.reduce((sum, row) => sum + row.expectedKg, 0)
  const actual = rows.reduce((sum, row) => sum + row.actualKg, 0)
  const varianceKg = actual - expected
  const variancePct = expected > 0 ? (varianceKg / expected) * 100 : 0
  const maxAbs = Math.max(1, ...rows.map((row) => Math.abs(row.variancePct)))
  return (<LocalizedContent>{(
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Metric label={t('expectedOutput')} value={`${qtyFmt(expected)} كجم`} />
        <Metric label={t('actualOutput')} value={`${qtyFmt(actual)} كجم`} />
        <Metric label={t('varianceKg')} value={`${qtyFmt(varianceKg)} كجم`} tone={varianceKg < 0 ? 'bad' : undefined} />
        <Metric label={t('variancePct')} value={pctFmt(variancePct)} tone={variancePct < 0 ? 'bad' : undefined} />
      </div>
      <Card
        title={t('varianceReport')}
        hint="الانحراف والهدر حسب المنتج أو الوردية أو المشغّل أو الخط أو الشهر مع اتجاه زمني."
      >
        <div className="mb-3 max-w-xs">
          <Field label={t('groupBy')}>
            <SelectInput value={groupBy} onChange={(event) => setGroupBy(event.target.value as VarianceGroupBy)}>
              <option value="PRODUCT">{t('product')}</option>
              <option value="SHIFT">{t('shift')}</option>
              <option value="OPERATOR">{t('operator')}</option>
              <option value="MACHINE">{t('machine')}</option>
              <option value="MONTH">{t('month')}</option>
            </SelectInput>
          </Field>
        </div>
        <div className="mb-4 space-y-2">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center gap-3">
              <div className="w-40 shrink-0 truncate text-sm text-[#53655e]">{row.label}</div>
              <div className="relative h-4 flex-1 rounded bg-[#f1f5f4]">
                <div
                  className={`absolute inset-y-0 rounded ${row.variancePct < 0 ? 'bg-[#ef4444]' : 'bg-[#7664d8]'}`}
                  style={{ width: `${(Math.abs(row.variancePct) / maxAbs) * 100}%` }}
                />
              </div>
              <div className={`w-20 text-right text-sm tabular-nums ${row.variancePct < 0 ? 'text-[#dc2626]' : 'text-[#1e127c]'}`}>{pctFmt(row.variancePct)}</div>
            </div>
          ))}
        </div>
        <DataTable
          columns={['البند', 'عدد الدفعات', t('expectedOutput'), t('actualOutput'), t('varianceKg'), t('variancePct'), 'الهدر (كجم)', 'تحذير', 'حرج']}
          rows={rows.map((row) => [
            row.label,
            String(row.lots),
            qtyFmt(row.expectedKg),
            qtyFmt(row.actualKg),
            <span key={`${row.key}-v`} className={row.varianceKg < 0 ? 'font-bold text-[#dc2626]' : undefined}>{qtyFmt(row.varianceKg)}</span>,
            <span key={`${row.key}-p`} className={row.variancePct < 0 ? 'font-bold text-[#dc2626]' : undefined}>{pctFmt(row.variancePct)}</span>,
            qtyFmt(row.wasteKg),
            String(row.warning),
            String(row.critical),
          ])}
        />
      </Card>
    </div>
  )}</LocalizedContent>)
}

function CostBreakdown({ ctx, note, day }: { ctx: LiveCtx; note: ReactNode; day: string }) {
  const [from, setFrom] = useState(`${day.slice(0, 7)}-01`)
  const [to, setTo] = useState(day)
  const summary = useMemo(() => productionCostSummary(ctx.state, from, to), [ctx.state, from, to])
  return (<LocalizedContent>{(
    <div className="space-y-4">
      {note}
      <Card title="تكلفة الطن حسب الفترة" hint="تشمل الخام والأكياس وبنود التحميل. الدفعات القديمة تبقى بتكلفة الخام فقط.">
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <Field label="من"><TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="إلى"><TextInput type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        </div>
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Metric label="تكلفة الطن" value={moneyFmt(summary.costPerTon)} />
          <Metric label="إجمالي التكلفة" value={moneyFmt(summary.grand)} />
          <Metric label="الناتج" value={tonsFmt(summary.outputKg)} />
        </div>
        <DataTable
          columns={['البند', 'المبلغ', 'النسبة']}
          rows={summary.byType.map((line) => [line.label || COST_LABEL[line.type as keyof typeof COST_LABEL] || line.type, moneyFmt(line.amount), pctFmt(line.pct)])}
        />
      </Card>
      <Card title="التكلفة حسب المنتج">
        <DataTable
          columns={['المنتج', 'الدفعات', 'الناتج', 'التكلفة', 'تكلفة الطن']}
          rows={summary.byProduct.map((row) => [row.nameAr, String(row.lots), tonsFmt(row.outputKg), moneyFmt(row.totalCost), moneyFmt(row.costPerTon)])}
        />
      </Card>
    </div>
  )}</LocalizedContent>)
}
