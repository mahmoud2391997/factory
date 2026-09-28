import assert from 'node:assert/strict'
import { test } from 'node:test'

import { factoryStatus } from './reports'
import { buildSeedState, emptyState } from './seed'
import type { ErpState, SalesInvoice } from './types'

function invoice(partial: Pick<SalesInvoice, 'id' | 'issuedAt' | 'total' | 'paidAmount' | 'status'>): SalesInvoice {
  return {
    number: partial.id,
    customerId: 'c',
    notes: '',
    lines: [],
    subtotal: partial.total,
    vatAmount: 0,
    createdBy: 'user-gm',
    ...partial,
  }
}

test('the owner dashboard ages receivables and sums collections against the factory day', () => {
  const state = emptyState('dash')
  state.productionOrders.push({
    id: 'ord',
    number: 'PR-1',
    productId: 'p',
    recipeId: 'r',
    plannedQty: 1000,
    status: 'COMPLETED',
    expected: [],
    actualOutputQty: 1000,
    totalCost: 100,
    unitCost: 0.1,
    outputBatch: 'L',
    varianceReason: '',
    createdBy: 'user-gm',
    createdAt: '2026-09-29T04:00:00.000Z',
    completedAt: '2026-09-29T04:00:00.000Z',
  })
  state.invoices = [
    invoice({ id: 'new', issuedAt: '2026-09-20T04:00:00.000Z', total: 30, paidAmount: 10, status: 'PARTIAL' }),
    invoice({ id: 'mid', issuedAt: '2026-08-15T04:00:00.000Z', total: 40, paidAmount: 0, status: 'CONFIRMED' }),
    invoice({ id: 'old', issuedAt: '2026-06-01T04:00:00.000Z', total: 15, paidAmount: 5, status: 'PARTIAL' }),
    invoice({ id: 'paid', issuedAt: '2026-01-01T04:00:00.000Z', total: 9, paidAmount: 9, status: 'PAID' }),
  ]
  state.payments = [
    { id: 'p1', number: 'PAY-1', invoiceId: 'new', amount: 12, method: 'نقد', at: '2026-09-29T05:00:00.000Z', createdBy: 'user-gm' },
    { id: 'p2', number: 'PAY-2', invoiceId: 'mid', amount: 3, method: 'نقد', at: '2026-09-02T05:00:00.000Z', createdBy: 'user-gm' },
  ]
  state.qualitySamples = [
    { id: 'a', type: 'RAW_MATERIAL', materialId: 'm', batchNo: 'B1', sampledBy: 'user-gm', sampledAt: '2026-09-29T04:00:00.000Z', result: 'FAILED' },
    { id: 'b', type: 'RAW_MATERIAL', materialId: 'm', batchNo: 'B1', sampledBy: 'user-gm', sampledAt: '2026-09-29T05:00:00.000Z', result: 'HOLD' },
    { id: 'c', type: 'FINISHED_PRODUCT', lotNo: 'L1', sampledBy: 'user-gm', sampledAt: '2026-09-29T04:00:00.000Z', result: 'PASSED' },
    { id: 'd', type: 'FINISHED_PRODUCT', lotNo: 'L2', sampledBy: 'user-gm', sampledAt: '2026-09-01T04:00:00.000Z', result: 'FAILED' },
  ]
  state.lots = [
    {
      id: 'lot',
      lotNo: 'LOT-1',
      productionOrderId: 'ord',
      productId: 'p',
      operatorId: 'e',
      manufacturedAt: '2026-09-29T04:00:00.000Z',
      inputKg: 1000,
      expectedOutputKg: 1000,
      actualOutputKg: 1000,
      wasteKg: 0,
      varianceKg: 0,
      variancePct: 0,
      materials: [],
      costLines: [
        { type: 'RAW_MATERIAL', amount: 70 },
        { type: 'BAGS', amount: 10 },
        { type: 'ELECTRICITY', amount: 20 },
      ],
      totalCost: 100,
      costPerTon: 100,
      salePricePerTon: 80,
      marginPerTon: -20,
      marginPct: -25,
      deliveries: [],
    },
  ]
  state.products.push({ id: 'p', code: 'FG', nameAr: 'علف', unit: 'كجم', salePrice: 0.2, vatTreatment: 'ZERO', barcode: 'FG', bagKg: 50, active: true })

  const status = factoryStatus(state, '2026-09-29T08:00:00.000Z')
  assert.equal(status.day, '2026-09-29')
  assert.equal(status.aging.d0_30, 20)
  assert.equal(status.aging.d31_60, 40)
  assert.equal(status.aging.d61, 10)
  assert.equal(status.collections.today, 12)
  assert.equal(status.collections.month, 15)
  assert.equal(status.qc.awaiting.length, 2)
  assert.equal(status.qc.awaiting.find((item) => item.label.includes('B1'))?.result, 'HOLD')
  assert.equal(status.qc.monthPassRate, 25)
  assert.equal(status.cost.avgCostPerTon, 100)
  assert.equal(status.cost.breakdown.find((line) => line.type === 'RAW_MATERIAL')?.pct, 70)
  assert.equal(status.cost.breakdown.find((line) => line.type === 'BAGS')?.amount, 10)
  assert.equal(status.lowestMarginLots[0]?.marginPerTon, -20)
  assert.equal(status.lowestMarginLots[0]?.productName, 'علف')
})

test('seeded factory exposes a held batch, a pass rate, and today collections', () => {
  const state = buildSeedState()
  const operatingAt = state.productionOrders.find((order) => order.status === 'COMPLETED')!.completedAt!
  const status = factoryStatus(state, operatingAt)
  assert.equal(status.qc.awaiting.length, 1)
  assert.equal(status.qc.awaiting[0]?.result, 'HOLD')
  assert.equal(status.qc.monthPassRate, 50)
  assert.ok(status.cost.avgCostPerTon > 0)
  assert.ok(status.cost.breakdown.some((line) => line.type === 'BAGS' && line.amount > 0))
  assert.equal(status.collections.today, 50)
  assert.equal(status.collections.month, 50)
  assert.equal(status.aging.d0_30, 44.5)
  assert.equal(status.aging.d31_60, 0)
  assert.equal(status.aging.d61, 0)
  assert.equal(status.lowestMarginLots.length, 1)
})
