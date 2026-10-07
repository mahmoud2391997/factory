import test from 'node:test'
import assert from 'node:assert/strict'
import { dashboardChartSeries } from './dashboard-charts'
import { emptyState } from './seed'
import type { SalesInvoice } from './types'

function invoice(id: string, issuedAt: string, subtotal: number, status: SalesInvoice['status']): SalesInvoice {
  return { id, number: id, customerId: 'customer', issuedAt, subtotal, vatAmount: subtotal * 0.05, total: subtotal * 1.05, paidAmount: 0, status, lines: [], notes: '', createdBy: 'user' }
}

test('sales chart uses factory dates and net posted amounts, with zero on inactive days', () => {
  const state = emptyState('test')
  state.invoices = [invoice('posted', '2026-10-05T21:00:00Z', 100, 'CONFIRMED'), invoice('draft', '2026-10-06T08:00:00Z', 500, 'DRAFT'), invoice('paid', '2026-10-06T12:00:00Z', 25, 'PAID'), invoice('future', '2026-10-08T12:00:00Z', 900, 'CONFIRMED')]
  const series = dashboardChartSeries(state, ['sales.read'], '2026-10-07', 7)
  assert.equal(series.production, null)
  assert.equal(series.sales?.length, 7)
  assert.deepEqual(series.sales?.find(row => row.day === '2026-10-06'), { day: '2026-10-06', sales: 125 })
  assert.deepEqual(series.sales?.at(-1), { day: '2026-10-07', sales: 0 })
})

test('production chart converts kilograms to tonnes and only counts completed output', () => {
  const state = emptyState('test')
  const base = { number: 'PR-1', productId: 'p', recipeId: 'r', expected: [], totalCost: 0, unitCost: 0, outputBatch: '', varianceReason: '', createdBy: 'user', createdAt: '2026-10-06T08:00:00Z' }
  state.productionOrders = [
    { ...base, id: 'done', plannedQty: 2000, actualOutputQty: 1800, status: 'COMPLETED', completedAt: '2026-10-06T12:00:00Z' },
    { ...base, id: 'open', plannedQty: 1000, actualOutputQty: 900, status: 'RELEASED' },
  ]
  const series = dashboardChartSeries(state, ['production.read'], '2026-10-07', 7)
  assert.equal(series.sales, null)
  assert.deepEqual(series.production?.find(row => row.day === '2026-10-06'), { day: '2026-10-06', planned: 3, actual: 1.8 })
  assert.deepEqual(series.production?.at(-1), { day: '2026-10-07', planned: 0, actual: 0 })
})

test('chart periods span month boundaries and restricted data is absent', () => {
  const state = emptyState('test')
  assert.deepEqual(dashboardChartSeries(state, [], '2026-10-07', 30), { production: null, sales: null })
  const series = dashboardChartSeries(state, ['sales.read'], '2026-10-07', 30)
  assert.equal(series.sales?.length, 30)
  assert.equal(series.sales?.[0]?.day, '2026-09-08')
  assert.equal(series.sales?.at(-1)?.day, '2026-10-07')
})
