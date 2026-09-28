import type { ErpState, QcResult, QualitySample } from './types'

export type QcLimits = {
  minMoisture?: number
  maxMoisture?: number
  minProtein?: number
  maxProtein?: number
  minAsh?: number
  maxAsh?: number
}

export type QcReading = { moisturePct?: number; proteinPct?: number; ashPct?: number }

/** Compare a reading with the material or product limits. HOLD is never suggested. */
export function suggestQcResult(limits: QcLimits | undefined, reading: QcReading): 'PASSED' | 'FAILED' | 'PENDING' {
  const checks: Array<[number | undefined, number | undefined, number | undefined]> = [
    [reading.moisturePct, limits?.minMoisture, limits?.maxMoisture],
    [reading.proteinPct, limits?.minProtein, limits?.maxProtein],
    [reading.ashPct, limits?.minAsh, limits?.maxAsh],
  ]
  let checked = false
  for (const [value, min, max] of checks) {
    if (value == null || !Number.isFinite(value)) continue
    if (min == null && max == null) continue
    checked = true
    if (min != null && value < min) return 'FAILED'
    if (max != null && value > max) return 'FAILED'
  }
  return checked ? 'PASSED' : 'PENDING'
}

export function releasesBlock(from: QcResult, to: QcResult) {
  return (from === 'FAILED' && to !== 'FAILED') || (from === 'HOLD' && to !== 'HOLD')
}

export function latestSample(samples: QualitySample[], match: (sample: QualitySample) => boolean) {
  return samples.filter(match).sort((a, b) => (a.sampledAt < b.sampledAt ? 1 : a.sampledAt > b.sampledAt ? -1 : 0))[0]
}

export function rawBatchQcBlock(state: ErpState, materialId: string, batchNo: string): string | null {
  const sample = latestSample(
    state.qualitySamples ?? [],
    (item) => item.type === 'RAW_MATERIAL' && item.materialId === materialId && item.batchNo === batchNo,
  )
  if (!sample) {
    return state.company.requireQcBeforeUse
      ? `لا توجد عينة جودة للدفعة ${batchNo} والإعداد يتطلب الفحص قبل الاستخدام`
      : null
  }
  if (sample.result === 'FAILED') return `دفعة ${batchNo} مرفوضة في الجودة ولا يمكن تحويلها للتصنيع أو استهلاكها`
  if (sample.result === 'HOLD') return `دفعة ${batchNo} معلّقة في الجودة ولا يمكن تحويلها للتصنيع أو استهلاكها`
  return null
}

export function lotQcBlock(state: ErpState, lotNo: string): string | null {
  const sample = latestSample(state.qualitySamples ?? [], (item) => item.type === 'FINISHED_PRODUCT' && item.lotNo === lotNo)
  const lot = (state.lots ?? []).find((item) => item.lotNo === lotNo)
  if (!sample && !lot) return null
  if (!sample && state.company.requireQcBeforeUse) {
    return `لا توجد عينة جودة للدفعة ${lotNo} والإعداد يتطلب الفحص قبل الاستخدام`
  }
  const result = sample?.result ?? lot?.qcStatus
  if (result === 'FAILED') return `دفعة الإنتاج ${lotNo} مرفوضة في الجودة ولا يمكن بيعها أو سحبها`
  if (result === 'HOLD') return `دفعة الإنتاج ${lotNo} معلّقة في الجودة ولا يمكن بيعها أو سحبها`
  return null
}
