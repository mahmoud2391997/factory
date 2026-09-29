import assert from 'node:assert/strict'
import { test } from 'node:test'

import { canViewRecallReport, recallReport } from './reports'
import { emptyState } from './seed'

test('recall report traces a raw batch through production lots, customers, and invoices', () => {
  const state = emptyState('recall')
  state.materials.push({
    id: 'material-corn',
    code: 'CORN',
    nameAr: 'ذرة',
    category: 'حبوب',
    unit: 'كجم',
    minQty: 0,
    vatTreatment: 'ZERO',
    barcode: '',
    active: true,
  })
  state.products.push({
    id: 'product-feed',
    code: 'FEED',
    nameAr: 'علف',
    unit: 'كجم',
    salePrice: 0.2,
    vatTreatment: 'ZERO',
    barcode: '',
    bagKg: 0,
    active: true,
  })
  state.suppliers.push({
    id: 'supplier-1',
    code: 'SUP-1',
    nameAr: 'مورد الذرة',
    vatNumber: '',
    phone: '',
    email: '',
    address: '',
  })
  state.customers.push({
    id: 'customer-1',
    code: 'CUS-1',
    nameAr: 'عميل العلف',
    vatNumber: '',
    phone: '',
    email: '',
    address: '',
  })
  state.lots.push({
    id: 'lot-1',
    lotNo: 'LOT-20261001-001',
    productionOrderId: 'production-1',
    productId: 'product-feed',
    operatorId: null,
    manufacturedAt: '2026-10-01T08:00:00.000Z',
    inputKg: 1000,
    expectedOutputKg: 990,
    actualOutputKg: 985,
    wasteKg: 15,
    varianceKg: -5,
    variancePct: -0.51,
    materials: [{ materialId: 'material-corn', sourceBatchNo: 'CORN-42', supplierId: 'supplier-1', qty: 1000, unitCost: 0.08 }],
    costLines: [{ type: 'RAW_MATERIAL', amount: 80 }],
    totalCost: 80,
    costPerTon: 81.218,
    deliveries: [{ invoiceId: 'invoice-1', customerId: 'customer-1', qty: 500, at: '2026-10-03T10:00:00.000Z' }],
  })
  state.invoices.push({
    id: 'invoice-1',
    number: 'INV-2026-001',
    customerId: 'customer-1',
    status: 'CONFIRMED',
    issuedAt: '2026-10-03T09:00:00.000Z',
    notes: '',
    lines: [],
    subtotal: 100,
    vatAmount: 0,
    total: 100,
    paidAmount: 0,
    createdBy: 'user-gm',
  })

  const report = recallReport(state, { materialId: 'material-corn', batchNo: ' CORN-42 ' })
  assert.deepEqual(report.target, { type: 'RAW_BATCH', materialId: 'material-corn', batchNo: 'CORN-42' })
  assert.equal(report.suppliers[0], 'مورد الذرة')
  assert.equal(report.lots[0]?.lotNo, 'LOT-20261001-001')
  assert.equal(report.deliveries[0]?.customer, 'عميل العلف')
  assert.equal(report.deliveries[0]?.invoiceNo, 'INV-2026-001')
  assert.equal(report.deliveries[0]?.date, '2026-10-03')
  assert.equal(report.affectedCustomers[0]?.quantityKg, 500)
})

test('recall report accepts exactly one target and requires report or QC permission', () => {
  const state = emptyState('recall-target')
  assert.throws(() => recallReport(state, {}), /حدد دفعة إنتاج أو دفعة خام واحدة/)
  assert.throws(() => recallReport(state, { lotNo: 'LOT-1', materialId: 'RM-1', batchNo: 'B-1' }), /حدد دفعة إنتاج أو دفعة خام واحدة/)
  assert.equal(canViewRecallReport(['qc.read']), true)
  assert.equal(canViewRecallReport(['reports.read']), true)
  assert.equal(canViewRecallReport(['inventory.read']), false)
})
