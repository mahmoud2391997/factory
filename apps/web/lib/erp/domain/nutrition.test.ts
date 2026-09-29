import assert from 'node:assert/strict'
import { test } from 'node:test'

import { calculateLotNutrition, calculateRecipeNutrition, compareNutrition } from './nutrition'
import { emptyState } from './seed'
import type { ProductionLot, Recipe } from './types'

test('recipe nutrient values use quantity-weighted lab results and report analysis coverage', () => {
  const state = emptyState('nutrition-recipe')
  state.materials.push(
    {
      id: 'm1',
      code: 'M1',
      nameAr: 'ذرة',
      category: 'حبوب',
      unit: 'كجم',
      minQty: 0,
      vatTreatment: 'ZERO',
      barcode: 'M1',
      active: true,
      labAnalysis: { moisturePct: 10, proteinPct: 8 },
    },
    {
      id: 'm2',
      code: 'M2',
      nameAr: 'صويا',
      category: 'بروتين',
      unit: 'كجم',
      minQty: 0,
      vatTreatment: 'ZERO',
      barcode: 'M2',
      active: true,
      labAnalysis: { moisturePct: 20, proteinPct: 40 },
    },
    {
      id: 'm3',
      code: 'M3',
      nameAr: 'ملح',
      category: 'إضافات',
      unit: 'كجم',
      minQty: 0,
      vatTreatment: 'ZERO',
      barcode: 'M3',
      active: true,
    },
  )
  const recipe: Recipe = {
    id: 'r1',
    productId: 'p1',
    nameAr: 'تركيبة',
    baseOutputQty: 100,
    items: [{ materialId: 'm1', qty: 25 }, { materialId: 'm2', qty: 50 }, { materialId: 'm3', qty: 25 }],
  }

  const calculation = calculateRecipeNutrition(state, recipe)
  assert.equal(calculation.profile.moisturePct, 16.667)
  assert.equal(calculation.profile.proteinPct, 29.333)
  assert.equal(calculation.coveragePct.moisturePct, 75)
  assert.equal(calculation.coveragePct.proteinPct, 75)
  assert.equal(calculation.coveragePct.energy, 0)
  assert.deepEqual(calculation.missingMaterials, ['ملح'])
})

test('lot nutrition prefers the passing analysis for its consumed raw batch and compares against specs', () => {
  const state = emptyState('nutrition-lot')
  state.materials.push({
    id: 'm1',
    code: 'M1',
    nameAr: 'ذرة',
    category: 'حبوب',
    unit: 'كجم',
    minQty: 0,
    vatTreatment: 'ZERO',
    barcode: 'M1',
    active: true,
    labAnalysis: { moisturePct: 10, proteinPct: 8 },
  })
  state.qualitySamples.push({
    id: 'raw-pass',
    type: 'RAW_MATERIAL',
    materialId: 'm1',
    batchNo: 'B-1',
    sampledBy: 'user-qc',
    sampledAt: '2026-09-29T08:00:00.000Z',
    moisturePct: 12,
    proteinPct: 20,
    result: 'PASSED',
  })
  const lot: ProductionLot = {
    id: 'lot-1',
    lotNo: 'LOT-1',
    productionOrderId: 'po-1',
    productId: 'p1',
    operatorId: null,
    manufacturedAt: '2026-09-29T10:00:00.000Z',
    inputKg: 100,
    expectedOutputKg: 100,
    actualOutputKg: 100,
    wasteKg: 0,
    varianceKg: 0,
    variancePct: 0,
    materials: [{ materialId: 'm1', sourceBatchNo: 'B-1', supplierId: null, qty: 100, unitCost: 1 }],
    costLines: [],
    totalCost: 0,
    costPerTon: 0,
    deliveries: [],
  }
  const calculation = calculateLotNutrition(state, lot)
  assert.equal(calculation.profile.moisturePct, 12)
  assert.equal(calculation.profile.proteinPct, 20)
  const comparison = compareNutrition(
    calculation.profile,
    {
      id: 'finished',
      type: 'FINISHED_PRODUCT',
      lotNo: 'LOT-1',
      sampledBy: 'user-qc',
      sampledAt: '2026-09-29T11:00:00.000Z',
      moisturePct: 15,
      proteinPct: 18,
      result: 'FAILED',
    },
    { minMoisture: 14, maxProtein: 17 },
  )

  assert.equal(comparison.find((item) => item.key === 'moisturePct')?.inSpec, true)
  assert.equal(comparison.find((item) => item.key === 'moisturePct')?.variance, 25)
  assert.equal(comparison.find((item) => item.key === 'proteinPct')?.inSpec, false)
})
