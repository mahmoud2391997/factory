import type { ErpState, NutritionalProfile, QcLimits, QcResult, QualitySample } from './types'

export type QcReading = Partial<NutritionalProfile>

/** Compare a reading with the material or product limits. HOLD is never suggested. */
export function suggestQcResult(limits: QcLimits | undefined, reading: QcReading): 'PASSED' | 'FAILED' | 'PENDING' {
  const checks: Array<[keyof NutritionalProfile, keyof QcLimits, keyof QcLimits]> = [
    ['moisturePct', 'minMoisture', 'maxMoisture'],
    ['proteinPct', 'minProtein', 'maxProtein'],
    ['ashPct', 'minAsh', 'maxAsh'],
    ['energy', 'minEnergy', 'maxEnergy'],
    ['fatPct', 'minFat', 'maxFat'],
    ['fiberPct', 'minFiber', 'maxFiber'],
    ['calciumPct', 'minCalcium', 'maxCalcium'],
    ['phosphorusPct', 'minPhosphorus', 'maxPhosphorus'],
  ]
  let checked = false
  for (const [key, minKey, maxKey] of checks) {
    const value = reading[key]
    const min = limits?.[minKey]
    const max = limits?.[maxKey]
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
  const holds = (state.qualityHolds ?? []).filter(
    (item) => item.targetType === 'RAW_BATCH' && item.materialId === materialId && item.batchNo === batchNo,
  )
  const hold = holds.at(-1)
  if (hold?.status === 'HELD' || hold?.status === 'RECALLED') {
    return `دفعة ${batchNo} محجورة: ${hold.reason}`
  }
  const sample = latestSample(
    state.qualitySamples ?? [],
    (item) => item.type === 'RAW_MATERIAL' && item.materialId === materialId && item.batchNo === batchNo,
  )
  if (!sample) {
    return state.company.requireQcBeforeUse
      ? `لا توجد عينة جودة للدفعة ${batchNo} والإعداد يتطلب الفحص قبل الاستخدام`
      : null
  }
  if (sample.result === 'PENDING') return `دفعة ${batchNo} تنتظر اعتماد نتيجة فحص الجودة`
  if (sample.result === 'FAILED') return `دفعة ${batchNo} مرفوضة في الجودة ولا يمكن تحويلها للتصنيع أو استهلاكها`
  if (sample.result === 'HOLD') return `دفعة ${batchNo} معلّقة في الجودة ولا يمكن تحويلها للتصنيع أو استهلاكها`
  return null
}

export function lotQcBlock(state: ErpState, lotNo: string): string | null {
  const holds = (state.qualityHolds ?? []).filter((item) => item.targetType === 'LOT' && item.lotNo === lotNo)
  const hold = holds.at(-1)
  if (hold?.status === 'HELD' || hold?.status === 'RECALLED') {
    return hold.status === 'RECALLED'
      ? `دفعة الإنتاج ${lotNo} مستدعاة: ${hold.reason}`
      : `دفعة الإنتاج ${lotNo} محجورة: ${hold.reason}`
  }

  const sample = latestSample(state.qualitySamples ?? [], (item) => item.type === 'FINISHED_PRODUCT' && item.lotNo === lotNo)
  const lot = (state.lots ?? []).find((item) => item.lotNo === lotNo)
  if (!sample && !lot) return null
  const result = String(sample?.result ?? lot?.qcStatus ?? 'UNTESTED')
  const untested = result === 'UNTESTED' || (!sample && result !== 'PASSED' && result !== 'FAILED' && result !== 'HOLD')
  if (untested && state.company.requireQcBeforeUse) {
    return `لا توجد عينة جودة للدفعة ${lotNo} والإعداد يتطلب الفحص قبل الاستخدام`
  }
  if (result === 'PENDING') return `دفعة الإنتاج ${lotNo} تنتظر اعتماد نتيجة فحص الجودة`
  if (result === 'FAILED') return `دفعة الإنتاج ${lotNo} مرفوضة في الجودة ولا يمكن بيعها أو سحبها`
  if (result === 'HOLD') return `دفعة الإنتاج ${lotNo} معلّقة في الجودة ولا يمكن بيعها أو سحبها`
  return null
}

export function inProcessQcBlock(state: ErpState, productionOrderId: string): string | null {
  const sample = latestSample(
    state.qualitySamples ?? [],
    (item) => item.type === 'IN_PROCESS' && item.productionOrderId === productionOrderId,
  )
  if (sample?.result === 'PENDING') return 'نتيجة فحص أثناء الإنتاج معلّقة؛ يجب اعتمادها قبل إكمال الأمر'
  if (sample?.result === 'FAILED') return 'نتيجة فحص أثناء الإنتاج مرفوضة؛ يجب إعادة الفحص قبل إكمال الأمر'
  if (sample?.result === 'HOLD') return 'نتيجة فحص أثناء الإنتاج معلّقة؛ يجب فك الحجز قبل إكمال الأمر'
  return null
}
