'use client'

import { useMemo } from 'react'

import { factoryStatus, muscatDay, stockRows } from '@/lib/erp/domain/reports'

import { Card, DataTable } from './bits'
import type { LiveCtx } from './ctx'
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
])

function DayNote({ day, shifted }: { day: string; shifted: boolean }) {
  return <p className="text-sm text-[#788983]">{shifted ? `آخر يوم تشغيل: ${dayFmt(day)}` : dayFmt(day)}</p>
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#e1e9e5] bg-white p-4 ps-5">
      <span aria-hidden className="absolute inset-y-3 right-0 w-1.5 rounded-full bg-[#1d7f72]" />
      <div className="text-sm font-semibold text-[#3d524b]">{label}</div>
      <div className="mt-2 text-3xl font-bold leading-none tracking-tight text-[#123c35]">{value}</div>
      {hint ? <div className="mt-2 text-sm text-[#53655e]">{hint}</div> : null}
    </div>
  )
}

export function FactoryScreens({ entityKey, ctx }: { entityKey: string; ctx: LiveCtx }) {
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
    return (
      <div className="space-y-4">
        {note}
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="المخطط اليوم" value={tonsFmt(status.production.plannedKg)} />
          <Metric label="الفعلي" value={tonsFmt(status.production.actualKg)} />
          <Metric label="نسبة التنفيذ" value={pctFmt(status.production.executionPct)} hint={`${tonsFmt(status.production.actualKg)} من ${tonsFmt(status.production.plannedKg)}`} />
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
    )
  }

  if (entityKey === 'factorySalesToday' || entityKey === 'factorySalesMonth') {
    const rows = entityKey === 'factorySalesToday' ? todayInvoices : monthInvoices
    const total = entityKey === 'factorySalesToday' ? status.sales.today : status.sales.month
    return (
      <div className="space-y-4">
        {note}
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="مبيعات اليوم" value={moneyFmt(status.sales.today)} hint={status.sales.todayCount ? `${status.sales.todayCount} فاتورة` : 'لا توجد فواتير'} />
          <Metric label="مبيعات الشهر" value={moneyFmt(status.sales.month)} hint={`${status.sales.monthCount} فاتورة`} />
        </div>
        <Card title={entityKey === 'factorySalesToday' ? 'فواتير اليوم' : 'فواتير الشهر'} hint={`الإجمالي الظاهر في البطاقة: ${moneyFmt(total)} قبل الضريبة`}>
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
    )
  }

  if (entityKey === 'factoryOpenOrders') {
    return (
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
    )
  }

  if (entityKey === 'factoryCostPerTon' || entityKey === 'factoryAvgPrice' || entityKey === 'factoryMargin') {
    return (
      <div className="space-y-4">
        {note}
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="تكلفة الطن" value={moneyFmt(status.profit.costPerTon)} />
          <Metric label="متوسط سعر البيع" value={moneyFmt(status.profit.avgPricePerTon)} />
          <Metric label="هامش الربح/طن" value={moneyFmt(status.profit.marginPerTon)} hint="متوسط سعر البيع − تكلفة الطن" />
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
    )
  }

  if (entityKey === 'factoryStockValue') {
    const rows = stockRows(ctx.state)
    return (
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
    )
  }

  if (entityKey === 'factoryRunningOut') {
    return (
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
    )
  }

  if (entityKey === 'factoryStagnant') {
    return (
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
    )
  }

  if (entityKey === 'factoryReserved') {
    return (
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
    )
  }

  if (entityKey === 'factoryWaste') {
    const lines = completed.flatMap((order) =>
      order.expected
        .filter((line) => line.wasteQty > 0)
        .map((line) => [order.number, ctx.state.materials.find((item) => item.id === line.materialId)?.nameAr ?? line.materialId, qtyFmt(line.actualQty), qtyFmt(line.wasteQty)]),
    )
    return (
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
    )
  }

  if (entityKey === 'factoryDeviation') {
    return (
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
    )
  }

  return (
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
  )
}
