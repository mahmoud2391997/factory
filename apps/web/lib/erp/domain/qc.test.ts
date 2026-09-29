import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, applyCommand } from './engine'
import { lotQcBlock, rawBatchQcBlock, suggestQcResult } from './qc'
import { supplierQuality, trialBalance } from './reports'
import { createClock, emptyState } from './seed'
import type { Actor, Command, ErpState } from './types'

function who(state: ErpState, id: string): Actor {
  const found = actorFromUser(state, id)
  assert.ok(found)
  return found
}

function must(state: ErpState, clock: ReturnType<typeof createClock>, command: Command, id = 'user-gm') {
  const result = applyCommand(state, who(state, id), command, clock)
  if (!result.ok) throw new Error(`${command.action}: ${result.error}`)
  return result.state
}

test('limits suggest passed or failed, and never hold', () => {
  assert.equal(suggestQcResult({ maxMoisture: 14, minProtein: 18 }, { moisturePct: 12, proteinPct: 20 }), 'PASSED')
  assert.equal(suggestQcResult({ maxMoisture: 14, minProtein: 18 }, { moisturePct: 15, proteinPct: 20 }), 'FAILED')
  assert.equal(suggestQcResult({ minAsh: 2, maxAsh: 8 }, { ashPct: 1 }), 'FAILED')
  assert.equal(suggestQcResult({ minEnergy: 12, maxFat: 8, maxFiber: 10 }, { energy: 11, fatPct: 5, fiberPct: 4 }), 'FAILED')
  assert.equal(suggestQcResult({ minCalcium: 1, maxPhosphorus: 0.8 }, { calciumPct: 1.1, phosphorusPct: 0.7 }), 'PASSED')
  assert.equal(suggestQcResult(undefined, { moisturePct: 12 }), 'PENDING')
})

test('all lab readings, metadata and full nutritional limits are saved', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = emptyState('qc-analysis')
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-A', nameAr: 'مادة تحليلية', category: 'حبوب', minQty: 1, vatTreatment: 'ZERO' } })
  const material = state.materials[0]!
  state = must(state, clock, {
    action: 'setQcLimits',
    input: { itemType: 'MATERIAL', itemId: material.id, limits: { minEnergy: 12, maxFat: 8, maxFiber: 10, minCalcium: 1, maxPhosphorus: 0.8 } },
  })
  state = must(state, clock, {
    action: 'createQualitySample',
    input: {
      type: 'RAW_MATERIAL',
      materialId: material.id,
      batchNo: 'ANALYSIS-1',
      moisturePct: 9,
      proteinPct: 21,
      ashPct: 4,
      energy: 13,
      fatPct: 3,
      fiberPct: 7,
      calciumPct: 1.2,
      phosphorusPct: 0.7,
      labName: 'مختبر المصنع',
      testMethod: 'NIR',
    },
  })
  const sample = state.qualitySamples[0]!
  assert.equal(sample.result, 'PASSED')
  assert.equal(sample.labName, 'مختبر المصنع')
  assert.equal(sample.testMethod, 'NIR')
  assert.equal(sample.energy, 13)
  assert.equal(sample.fatPct, 3)
  assert.equal(sample.fiberPct, 7)
  assert.equal(sample.calciumPct, 1.2)
  assert.equal(sample.phosphorusPct, 0.7)
  assert.equal(state.materials.find((item) => item.id === material.id)?.labAnalysis?.proteinPct, 21)
  assert.equal(state.materials.find((item) => item.id === material.id)?.labAnalysis?.lastLabDate, '2026-09-29')
})

test('pending sample results block use and lab report attachments are audited', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = emptyState('qc-attachment')
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-P', nameAr: 'مادة معلقة', category: 'حبوب', minQty: 1, vatTreatment: 'ZERO' } })
  const material = state.materials[0]!
  state = must(state, clock, {
    action: 'createQualitySample',
    input: { type: 'RAW_MATERIAL', materialId: material.id, batchNo: 'B-PENDING' },
  })
  const sample = state.qualitySamples[0]!
  assert.equal(sample.result, 'PENDING')
  assert.match(rawBatchQcBlock(state, material.id, 'B-PENDING') ?? '', /تنتظر اعتماد/)
  assert.match(
    (() => {
      const result = applyCommand(state, who(state, 'user-driver'), {
        action: 'addQualitySampleAttachment',
        input: { sampleId: sample.id, id: 'f89f087c-2c71-47e0-9ba3-51f8f5128abb', fileName: 'report.pdf', mediaType: 'application/pdf', sizeBytes: 200 },
      }, clock)
      return result.ok ? '' : result.error
    })(),
    /صلاحية/,
  )
  state = must(state, clock, {
    action: 'addQualitySampleAttachment',
    input: { sampleId: sample.id, id: 'f89f087c-2c71-47e0-9ba3-51f8f5128abb', fileName: 'report.pdf', mediaType: 'application/pdf', sizeBytes: 200 },
  })
  assert.equal(state.qualitySamples[0]!.attachments?.[0]?.uploadedBy, 'user-gm')
  assert.ok(state.auditLogs.some((item) => item.action === 'إضافة تقرير مختبر'))
})

test('failed in-process quality result blocks production completion until released', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = emptyState('qc-in-process')
  state = must(state, clock, { action: 'createProduct', input: { code: 'FG-IP', nameAr: 'منتج', salePrice: 1, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-IP', nameAr: 'مادة', category: 'حبوب', minQty: 1, vatTreatment: 'ZERO' } })
  const product = state.products[0]!
  const material = state.materials[0]!
  state = must(state, clock, { action: 'createRecipe', input: { productId: product.id, nameAr: 'خلطة', baseOutputQty: 100, items: [{ materialId: material.id, qty: 100 }] } })
  const recipe = state.recipes[0]!
  state = must(state, clock, { action: 'createProductionOrder', input: { productId: product.id, recipeId: recipe.id, plannedQty: 100 } })
  const order = state.productionOrders[0]!
  state = must(state, clock, { action: 'setQcLimits', input: { itemType: 'PRODUCT', itemId: product.id, limits: { minProtein: 18 } } })
  state = must(state, clock, {
    action: 'createQualitySample',
    input: { type: 'IN_PROCESS', productionOrderId: order.id, proteinPct: 12 },
  })
  assert.equal(state.qualitySamples[0]?.result, 'FAILED')
  const blocked = applyCommand(state, who(state, 'user-gm'), {
    action: 'completeProduction',
    input: { productionOrderId: order.id, operatorId: 'missing', actuals: [], actualOutputQty: 100 },
  }, clock)
  assert.equal(blocked.ok, false)
  if (!blocked.ok) assert.match(blocked.error, /أثناء الإنتاج/)

  state = must(state, clock, {
    action: 'updateQualityResult',
    input: { sampleId: state.qualitySamples[0]!.id, result: 'PASSED', reason: 'إعادة التحليل مطابقة' },
  })
  const released = applyCommand(state, who(state, 'user-gm'), {
    action: 'completeProduction',
    input: { productionOrderId: order.id, operatorId: 'missing', actuals: [], actualOutputQty: 100 },
  }, clock)
  assert.equal(released.ok, false)
  if (!released.ok) assert.match(released.error, /مشغّل الإنتاج غير موجود/)
})

test('quality blocks raw use, finished lots, release, and duplicate alerts', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = emptyState('qc')
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-QC', nameAr: 'ذرة الجودة', category: 'حبوب', minQty: 1, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createProduct', input: { code: 'FG-QC', nameAr: 'علف الجودة', salePrice: 0.2, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createSupplier', input: { nameAr: 'مورد الجودة' } })
  state = must(state, clock, { action: 'createCustomer', input: { nameAr: 'عميل الجودة' } })
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'مشغّل الجودة', department: 'الإنتاج', jobTitle: 'مشغّل', basicSalary: 300 } })
  const material = state.materials[0]!
  const product = state.products[0]!
  const supplier = state.suppliers[0]!
  const customer = state.customers[0]!
  const operator = state.employees[0]!
  state = must(state, clock, { action: 'setQcLimits', input: { itemType: 'MATERIAL', itemId: material.id, limits: { maxMoisture: 14, minProtein: 8 } } })
  state = must(state, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId: supplier.id, lines: [{ materialId: material.id, qty: 500, unitCost: 0.05 }] },
  })
  const poId = state.purchaseOrders[0]!.id
  state = must(state, clock, { action: 'decidePurchaseOrder', input: { id: poId, decision: 'APPROVED' } })
  state = must(state, clock, {
    action: 'receiveGoods',
    input: { purchaseOrderId: poId, lines: [{ materialId: material.id, qty: 500, batchNo: 'B-QC' }] },
  })

  const open = applyCommand(state, who(state, 'user-gm'), {
    action: 'transferStock',
    input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: material.id, batchNo: 'B-QC', qty: 1 }] },
  }, clock)
  assert.equal(open.ok, true)

  state = must(state, clock, { action: 'updateCompany', input: { requireQcBeforeUse: true } })
  const needsSample = applyCommand(state, who(state, 'user-gm'), {
    action: 'transferStock',
    input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: material.id, batchNo: 'B-QC', qty: 1 }] },
  }, clock)
  assert.equal(needsSample.ok, false)
  if (!needsSample.ok) assert.match(needsSample.error, /يتطلب الفحص/)
  state = must(state, clock, { action: 'updateCompany', input: { requireQcBeforeUse: false } })

  const failed = must(state, clock, {
    action: 'createQualitySample',
    input: { type: 'RAW_MATERIAL', materialId: material.id, batchNo: 'B-QC', moisturePct: 16, proteinPct: 10 },
  })
  assert.equal(failed.qualitySamples[0]!.result, 'FAILED')
  assert.equal(failed.qualitySamples[0]!.supplierId, supplier.id)
  const again = must(failed, clock, {
    action: 'createQualitySample',
    input: { type: 'RAW_MATERIAL', materialId: material.id, batchNo: 'B-QC', supplierId: supplier.id, moisturePct: 17, proteinPct: 10 },
  })
  const qcNotes = again.notifications.filter((item) => item.dedupeKey.includes('B-QC') && item.kind === 'QC' && !item.read)
  assert.equal(qcNotes.length, 1)
  state = again

  const blockedTransfer = applyCommand(state, who(state, 'user-gm'), {
    action: 'transferStock',
    input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: material.id, batchNo: 'B-QC', qty: 10 }] },
  }, clock)
  assert.equal(blockedTransfer.ok, false)
  if (!blockedTransfer.ok) assert.match(blockedTransfer.error, /مرفوضة/)

  const sampleId = state.qualitySamples.find((item) => item.result === 'FAILED')!.id
  const opsOverride = applyCommand(state, who(state, 'user-ops'), {
    action: 'createQualitySample',
    input: { type: 'RAW_MATERIAL', materialId: material.id, batchNo: 'B-QC', supplierId: supplier.id, moisturePct: 16, proteinPct: 10, result: 'PASSED', reason: 'تجاوز بدون صلاحية' },
  }, clock)
  assert.equal(opsOverride.ok, false)
  if (!opsOverride.ok) assert.match(opsOverride.error, /صلاحية/)
  const opsRelease = applyCommand(state, who(state, 'user-ops'), {
    action: 'updateQualityResult',
    input: { sampleId, result: 'PASSED', reason: 'إعادة فحص' },
  }, clock)
  assert.equal(opsRelease.ok, false)
  if (!opsRelease.ok) assert.match(opsRelease.error, /صلاحية/)
  const noReason = applyCommand(state, who(state, 'user-gm'), {
    action: 'updateQualityResult',
    input: { sampleId, result: 'PASSED', reason: '  ' },
  }, clock)
  assert.equal(noReason.ok, false)
  state = must(state, clock, { action: 'updateQualityResult', input: { sampleId, result: 'PASSED', reason: 'إعادة الفحص نجحت' } })
  assert.ok(state.auditLogs.some((row) => row.action === 'تغيير نتيجة الجودة' && row.detail.includes('إعادة الفحص')))
  state = must(state, clock, {
    action: 'transferStock',
    input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: material.id, batchNo: 'B-QC', qty: 10 }] },
  })
  const summary = supplierQuality(state, supplier.id)
  assert.equal(summary.samples, 2)
  assert.equal(summary.passRate, 50)
  assert.equal(summary.monthlyTrend.length, 1)
  assert.equal(summary.monthlyTrend[0]?.samples, 2)
  assert.equal(summary.monthlyTrend[0]?.passRate, 50)
  state.qualitySamples.push({
    ...state.qualitySamples[0]!,
    id: 'qc-next-month',
    sampledAt: '2026-10-02T04:00:00.000Z',
    result: 'PASSED',
    moisturePct: 11,
  })
  const trend = supplierQuality(state, supplier.id).monthlyTrend
  assert.deepEqual(trend.map((row) => row.month), ['2026-09', '2026-10'])
  assert.equal(trend[1]?.avgMoisture, 11)
})

test('held raw material cannot be consumed and a held lot cannot be sold or withdrawn', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = emptyState('qc2')
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-QC2', nameAr: 'ذرة', category: 'حبوب', minQty: 1, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createProduct', input: { code: 'FG-QC2', nameAr: 'علف', salePrice: 0.2, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createSupplier', input: { nameAr: 'مورد' } })
  state = must(state, clock, { action: 'createCustomer', input: { nameAr: 'عميل' } })
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'مشغّل', department: 'الإنتاج', jobTitle: 'مشغّل', basicSalary: 300 } })
  const material = state.materials[0]!
  const product = state.products[0]!
  const supplier = state.suppliers[0]!
  const customer = state.customers[0]!
  const operator = state.employees[0]!
  state = must(state, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId: supplier.id, lines: [{ materialId: material.id, qty: 400, unitCost: 0.04 }] },
  })

  const poId = state.purchaseOrders[0]!.id
  state = must(state, clock, { action: 'decidePurchaseOrder', input: { id: poId, decision: 'APPROVED' } })
  state = must(state, clock, {
    action: 'receiveGoods',
    input: { purchaseOrderId: poId, lines: [{ materialId: material.id, qty: 400, batchNo: 'B-QC2' }] },
  })
  state = must(state, clock, {
    action: 'createQualitySample',
    input: { type: 'RAW_MATERIAL', materialId: material.id, batchNo: 'B-QC2', supplierId: supplier.id, moisturePct: 10, result: 'HOLD', reason: 'تعليق يدوي' },
  })
  const heldTransfer = applyCommand(state, who(state, 'user-gm'), {
    action: 'transferStock',
    input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: material.id, batchNo: 'B-QC2', qty: 200 }] },
  }, clock)
  assert.equal(heldTransfer.ok, false)
  if (!heldTransfer.ok) assert.match(heldTransfer.error, /معلّقة/)

  state = must(state, clock, { action: 'updateQualityResult', input: { sampleId: state.qualitySamples[0]!.id, result: 'PASSED', reason: 'المختبر وافق' } })
  state = must(state, clock, {
    action: 'transferStock',
    input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: material.id, batchNo: 'B-QC2', qty: 200 }] },
  })
  state = must(state, clock, {
    action: 'createRecipe',
    input: { productId: product.id, nameAr: 'وصفة', baseOutputQty: 1000, items: [{ materialId: material.id, qty: 1000 }] },
  })
  state = must(state, clock, { action: 'createProductionOrder', input: { productId: product.id, recipeId: state.recipes[0]!.id, plannedQty: 200 } })
  state = must(state, clock, {
    action: 'createQualitySample',
    input: { type: 'RAW_MATERIAL', materialId: material.id, batchNo: 'B-QC2', supplierId: supplier.id, result: 'HOLD', reason: 'تعليق قبل التشغيل' },
  })
  const consumed = applyCommand(state, who(state, 'user-gm'), {
    action: 'completeProduction',
    input: {
      productionOrderId: state.productionOrders[0]!.id,
      operatorId: operator.id,
      actualOutputQty: 200,
      actuals: [{ materialId: material.id, actualQty: 200 }],
    },
  }, clock)
  assert.equal(consumed.ok, false)
  if (!consumed.ok) assert.match(consumed.error, /معلّقة/)

  state = must(state, clock, { action: 'updateQualityResult', input: { sampleId: state.qualitySamples[0]!.id, result: 'PASSED', reason: 'فك التعليق' } })
  state = must(state, clock, {
    action: 'completeProduction',
    input: {
      productionOrderId: state.productionOrders[0]!.id,
      operatorId: operator.id,
      actualOutputQty: 200,
      actuals: [{ materialId: material.id, actualQty: 200 }],
    },
  })
  const lot = state.lots[0]!
  state = must(state, clock, {
    action: 'createQualitySample',
    input: { type: 'FINISHED_PRODUCT', lotNo: lot.lotNo, result: 'FAILED', reason: 'المنتج خارج المواصفة' },
  })
  assert.equal(state.lots[0]!.qcStatus, 'FAILED')
  state = must(state, clock, { action: 'createInvoice', input: { customerId: customer.id, lines: [{ productId: product.id, qty: 10 }] } })
  const blockedSale = applyCommand(state, who(state, 'user-gm'), { action: 'confirmInvoice', input: { id: state.invoices[0]!.id } }, clock)
  assert.equal(blockedSale.ok, false)
  if (!blockedSale.ok) assert.match(blockedSale.error, /مرفوضة/)

  state = must(state, clock, { action: 'updateQualityResult', input: { sampleId: state.qualitySamples[0]!.id, result: 'HOLD', reason: 'تعليق المنتج' } })
  const blockedWithdrawal = applyCommand(state, who(state, 'user-gm'), {
    action: 'createWithdrawal',
    input: { reason: 'عينة', lines: [{ productId: product.id, qty: 5 }] },
  }, clock)
  assert.equal(blockedWithdrawal.ok, false)
  if (!blockedWithdrawal.ok) assert.match(blockedWithdrawal.error, /معلّقة/)

  state = must(state, clock, { action: 'updateQualityResult', input: { sampleId: state.qualitySamples[0]!.id, result: 'PASSED', reason: 'اعتماد نهائي' } })
  state = must(state, clock, { action: 'confirmInvoice', input: { id: state.invoices[0]!.id } })
  assert.equal(trialBalance(state).balanced, true)
  const summary = supplierQuality(state, supplier.id)
  assert.ok(summary.samples >= 1)
  assert.equal(summary.supplier?.id, supplier.id)
})

test('manual holds, release reasons, and recalls are permission-checked and audited', () => {
  const clock = createClock('2026-10-01T04:00:00.000Z')
  let state = emptyState('manual-holds')
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-HOLD', nameAr: 'ذرة', category: 'حبوب', minQty: 0, vatTreatment: 'ZERO' } })
  const material = state.materials[0]!
  state.lots.push({
    id: 'lot-hold',
    lotNo: 'LOT-HOLD-001',
    productionOrderId: 'po-hold',
    productId: 'product-hold',
    operatorId: null,
    manufacturedAt: clock.now(),
    inputKg: 100,
    expectedOutputKg: 99,
    actualOutputKg: 99,
    wasteKg: 1,
    varianceKg: 0,
    variancePct: 0,
    materials: [{ materialId: material.id, sourceBatchNo: 'RAW-HOLD-001', supplierId: null, qty: 100, unitCost: 0.05 }],
    costLines: [{ type: 'RAW_MATERIAL', amount: 5 }],
    totalCost: 5,
    costPerTon: 50.505,
    deliveries: [],
  })

  state = must(state, clock, { action: 'holdRawBatch', input: { materialId: material.id, batchNo: 'RAW-HOLD-001', reason: 'فحص إضافي' } })
  assert.match(rawBatchQcBlock(state, material.id, 'RAW-HOLD-001') ?? '', /محجورة/)
  const unauthorizedRelease = applyCommand(state, who(state, 'user-ops'), {
    action: 'releaseRawBatch',
    input: { materialId: material.id, batchNo: 'RAW-HOLD-001', reason: 'مراجعة' },
  }, clock)
  assert.equal(unauthorizedRelease.ok, false)
  if (!unauthorizedRelease.ok) assert.match(unauthorizedRelease.error, /صلاحية/)

  const missingReason = applyCommand(state, who(state, 'user-gm'), {
    action: 'releaseRawBatch',
    input: { materialId: material.id, batchNo: 'RAW-HOLD-001', reason: '  ' },
  }, clock)
  assert.equal(missingReason.ok, false)
  state = must(state, clock, { action: 'releaseRawBatch', input: { materialId: material.id, batchNo: 'RAW-HOLD-001', reason: 'نتيجة المختبر سليمة' } })
  assert.equal(rawBatchQcBlock(state, material.id, 'RAW-HOLD-001'), null)

  state = must(state, clock, { action: 'holdLot', input: { lotNo: 'LOT-HOLD-001', reason: 'تحقيق شكوى عميل' } })
  assert.match(lotQcBlock(state, 'LOT-HOLD-001') ?? '', /محجورة/)
  state = must(state, clock, { action: 'releaseLot', input: { lotNo: 'LOT-HOLD-001', reason: 'التحقيق لم يثبت المشكلة' } })
  assert.equal(lotQcBlock(state, 'LOT-HOLD-001'), null)
  state = must(state, clock, { action: 'recallLot', input: { lotNo: 'LOT-HOLD-001', reason: 'تأكد عدم مطابقة المنتج' } })
  assert.match(lotQcBlock(state, 'LOT-HOLD-001') ?? '', /مستدعاة/)
  assert.ok(state.auditLogs.some((entry) => entry.action === 'استدعاء دفعة إنتاج'))
  assert.equal(state.qualityHolds.length, 3)
})
