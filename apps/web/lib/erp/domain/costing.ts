import { money, qty } from './money'
import type { CostLine, ErpState, Product } from './types'

export const ALLOCATED_COST_TYPES = ['ELECTRICITY', 'GAS', 'LABOR', 'TRANSPORT', 'MAINTENANCE', 'OVERHEAD'] as const
export type AllocatedCostType = (typeof ALLOCATED_COST_TYPES)[number]

export const COST_LABEL: Record<CostLine['type'], string> = {
  RAW_MATERIAL: 'مواد خام',
  BAGS: 'أكياس',
  ELECTRICITY: 'كهرباء',
  GAS: 'غاز',
  LABOR: 'أجور',
  TRANSPORT: 'نقل',
  MAINTENANCE: 'صيانة',
  OVERHEAD: 'مصاريف عامة',
}

export function packagingUnitCost(state: ErpState) {
  const materialId = state.company.packagingMaterialId
  if (materialId) {
    for (const receipt of state.goodsReceipts) {
      const line = receipt.lines.find((item) => item.materialId === materialId)
      if (line && line.unitCost > 0) return line.unitCost
    }
    const balance = state.balances.find((row) => row.itemType === 'MATERIAL' && row.itemId === materialId && row.unitCost > 0)
    if (balance) return balance.unitCost
  }
  return state.company.bagUnitCost ?? 0
}

export function buildLotCostLines(
  state: ErpState,
  product: Product | undefined,
  outputKg: number,
  rawAmount: number,
  manual: Array<{ type: AllocatedCostType; amount: number }> = [],
): CostLine[] {
  const lines: CostLine[] = [{ type: 'RAW_MATERIAL', amount: money(rawAmount) }]
  const bagKg = product?.bagKg ?? 0
  const bags = bagKg > 0 ? qty(outputKg / bagKg) : 0
  const bagAmount = money(bags * packagingUnitCost(state))
  if (bagAmount > 0) lines.push({ type: 'BAGS', amount: bagAmount })
  const tons = outputKg / 1000
  for (const type of ALLOCATED_COST_TYPES) {
    const entered = manual.find((line) => line.type === type)
    const amount = entered ? money(entered.amount) : money((state.company.costRates?.[type] ?? 0) * tons)
    if (amount > 0) lines.push({ type, amount })
  }
  return lines
}
