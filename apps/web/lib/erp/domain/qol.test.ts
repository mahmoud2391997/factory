import assert from 'node:assert/strict'
import { test } from 'node:test'

import { applyCommand } from './engine'
import { lotExportRows } from './reports'
import { createClock, emptyState } from './seed'
import type { ErpState, ProductionLot } from './types'

function lot(partial: Partial<ProductionLot> & Pick<ProductionLot, 'id' | 'lotNo' | 'productId'>): ProductionLot {
  return {
    productionOrderId: 'po',
    operatorId: null,
    manufacturedAt: '2026-09-15T08:00:00.000Z',
    inputKg: 1000,
    expectedOutputKg: 1000,
    actualOutputKg: 1000,
    wasteKg: 0,
    varianceKg: 0,
    variancePct: 0,
    materials: [],
    costLines: [{ type: 'RAW_MATERIAL', amount: 10 }],
    totalCost: 10,
    costPerTon: 10,
    deliveries: [],
    qcStatus: 'UNTESTED',
    ...partial,
  }
}

test('company settings reject negative rates and absurd thresholds', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  const state = emptyState('qol')
  const actor = { id: 'user-gm', name: 'مدير', role: 'GM' as const, permissions: state.rolePermissions.GM }
  const reject = (input: Partial<ErpState['company']>, pattern: RegExp) => {
    const result = applyCommand(state, actor, { action: 'updateCompany', input }, clock)
    assert.equal(result.ok, false)
    if (!result.ok) assert.match(result.error, pattern)
  }
  reject({ bagUnitCost: -1 }, /تكلفة الكيس/)
  reject({ varianceThresholdPct: 250 }, /حد الانحراف/)
  reject({ vatRatePct: -1 }, /الضريبة/)
  reject({ costApprovalThreshold: 2_000_000 }, /حد اعتماد التكلفة/)
  reject({ costRates: { GAS: -2 } }, /سعر التحميل/)
  const ok = applyCommand(state, actor, { action: 'updateCompany', input: { bagUnitCost: 0.02, costRates: { GAS: 1.5 }, varianceThresholdPct: 2 } }, clock)
  assert.equal(ok.ok, true)
})

test('lot export rows follow product, date, quality, and margin filters', () => {
  const state = emptyState('qol')
  state.products.push({
    id: 'prd',
    code: 'FG',
    nameAr: 'علف',
    unit: 'كجم',
    salePrice: 1,
    vatTreatment: 'ZERO',
    barcode: 'FG',
    bagKg: 50,
    active: true,
  })
  state.lots = [
    lot({ id: '1', lotNo: 'LOT-A', productId: 'prd', manufacturedAt: '2026-09-01T08:00:00.000Z', qcStatus: 'UNTESTED', salePricePerTon: 100, marginPerTon: -20, marginPct: -20 }),
    lot({ id: '2', lotNo: 'LOT-B', productId: 'prd', manufacturedAt: '2026-09-20T08:00:00.000Z', qcStatus: 'PASSED', salePricePerTon: 200, marginPerTon: 40, marginPct: 20, operatorId: 'missing' }),
    lot({ id: '3', lotNo: 'LOT-C', productId: 'other', manufacturedAt: '2026-09-20T08:00:00.000Z', qcStatus: 'PASSED', marginPerTon: -5 }),
  ]
  const rows = lotExportRows(state, { productId: 'prd', fromDay: '2026-09-10', toDay: '2026-09-30', qcStatus: 'PASSED', marginSign: 'positive' })
  assert.deepEqual(rows[0], ['رقم الدفعة', 'المنتج', 'المشغّل', 'تاريخ التصنيع', 'الجودة', 'تكلفة الطن', 'سعر البيع للطن', 'الهامش للطن', 'الهامش %', 'قديم'])
  assert.equal(rows.length, 2)
  assert.equal(rows[1]?.[0], 'LOT-B')
  assert.equal(rows[1]?.[1], 'علف')
  assert.equal(rows[1]?.[2], 'غير معروف (بيانات قديمة)')
  assert.equal(rows[1]?.[4], 'PASSED')
  const negative = lotExportRows(state, { marginSign: 'negative' })
  assert.deepEqual(negative.slice(1).map((row) => row[0]), ['LOT-A', 'LOT-C'])
})
