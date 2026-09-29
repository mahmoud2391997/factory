import { round3 } from './money'
import type {
  ErpState,
  NutritionalCalculation,
  NutritionalComparison,
  NutritionalProfile,
  ProductionLot,
  QcLimits,
  QualitySample,
  Recipe,
} from './types'

const PARAMETERS: Array<{
  key: keyof NutritionalProfile
  label: string
  unit: string
  minKey: keyof QcLimits
  maxKey: keyof QcLimits
}> = [
  { key: 'moisturePct', label: 'الرطوبة', unit: '%', minKey: 'minMoisture', maxKey: 'maxMoisture' },
  { key: 'proteinPct', label: 'البروتين', unit: '%', minKey: 'minProtein', maxKey: 'maxProtein' },
  { key: 'ashPct', label: 'الرماد', unit: '%', minKey: 'minAsh', maxKey: 'maxAsh' },
  { key: 'energy', label: 'الطاقة', unit: 'MJ/kg', minKey: 'minEnergy', maxKey: 'maxEnergy' },
  { key: 'fatPct', label: 'الدهون', unit: '%', minKey: 'minFat', maxKey: 'maxFat' },
  { key: 'fiberPct', label: 'الألياف', unit: '%', minKey: 'minFiber', maxKey: 'maxFiber' },
  { key: 'calciumPct', label: 'الكالسيوم', unit: '%', minKey: 'minCalcium', maxKey: 'maxCalcium' },
  { key: 'phosphorusPct', label: 'الفوسفور', unit: '%', minKey: 'minPhosphorus', maxKey: 'maxPhosphorus' },
]

type Ingredient = { materialId: string; qty: number; batchNo?: string }
type NutritionState = Pick<ErpState, 'materials' | 'qualitySamples'>

function calculateNutrition(state: NutritionState, ingredients: Ingredient[]): NutritionalCalculation {
  const totalQty = ingredients.reduce((sum, line) => sum + Math.max(0, line.qty), 0)
  const weighted = new Map<keyof NutritionalProfile, number>(PARAMETERS.map(({ key }) => [key, 0]))
  const coveredQty = new Map<keyof NutritionalProfile, number>(PARAMETERS.map(({ key }) => [key, 0]))
  const missingMaterials = new Set<string>()

  for (const ingredient of ingredients) {
    if (ingredient.qty <= 0) continue
    const material = state.materials.find((item) => item.id === ingredient.materialId)
    if (!material) {
      missingMaterials.add(ingredient.materialId)
      continue
    }

    let analysis: Partial<NutritionalProfile> | undefined = material.labAnalysis
    if (ingredient.batchNo) {
      const batchSample = (state.qualitySamples ?? [])
        .filter((sample) =>
          sample.type === 'RAW_MATERIAL' &&
          sample.materialId === ingredient.materialId &&
          sample.batchNo === ingredient.batchNo,
        )
        .sort((a, b) => b.sampledAt.localeCompare(a.sampledAt))[0]
      if (batchSample) analysis = batchSample.result === 'PASSED' ? batchSample : undefined
    }

    let analyzed = false
    for (const { key } of PARAMETERS) {
      const value = analysis?.[key]
      if (value === undefined || !Number.isFinite(value)) continue
      analyzed = true
      weighted.set(key, (weighted.get(key) ?? 0) + value * ingredient.qty)
      coveredQty.set(key, (coveredQty.get(key) ?? 0) + ingredient.qty)
    }
    if (!analyzed) missingMaterials.add(material.nameAr)
  }

  const profile = {} as NutritionalProfile
  const coveragePct: NutritionalCalculation['coveragePct'] = {}
  for (const { key } of PARAMETERS) {
    const analyzedQty = coveredQty.get(key) ?? 0
    profile[key] = analyzedQty > 0 ? round3((weighted.get(key) ?? 0) / analyzedQty) : 0
    if (totalQty > 0) coveragePct[key] = round3((analyzedQty / totalQty) * 100)
  }
  return { profile, coveragePct, missingMaterials: [...missingMaterials] }
}

export function calculateRecipeNutrition(state: NutritionState, recipe: Recipe): NutritionalCalculation {
  return calculateNutrition(state, recipe.items)
}

export function calculateLotNutrition(state: NutritionState, lot: ProductionLot): NutritionalCalculation {
  return calculateNutrition(state, lot.materials.map((line) => ({
    materialId: line.materialId,
    batchNo: line.sourceBatchNo,
    qty: line.qty,
  })))
}

export function compareNutrition(
  calculated: NutritionalProfile,
  lab?: QualitySample,
  spec?: QcLimits,
): NutritionalComparison[] {
  return PARAMETERS.map(({ key, label, unit, minKey, maxKey }) => {
    const labValue = lab?.[key]
    const specMin = spec?.[minKey]
    const specMax = spec?.[maxKey]
    return {
      key,
      parameter: label,
      unit,
      calculated: calculated[key],
      lab: labValue,
      specMin,
      specMax,
      variance: labValue === undefined || calculated[key] === 0
        ? undefined
        : round3(((labValue - calculated[key]) / Math.abs(calculated[key])) * 100),
      inSpec: labValue === undefined || ((specMin === undefined || labValue >= specMin) && (specMax === undefined || labValue <= specMax)),
    }
  })
}
