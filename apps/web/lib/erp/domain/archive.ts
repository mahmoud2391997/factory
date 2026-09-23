import { money, qty } from './money'
import type { AuditLog, ErpState, JournalEntry, LedgerEntry } from './types'

const DAY_MS = 86_400_000

export type ArchivePlan = {
  olderThanDays: number
  cutoffIso: string
  ledger: LedgerEntry[]
  journals: JournalEntry[]
  auditLogs: AuditLog[]
}

function balanceKey(warehouse: string, itemType: string, itemId: string, batchNo: string) {
  return `${warehouse}|${itemType}|${itemId}|${batchNo}`
}

export function planArchive(state: ErpState, olderThanDays: number, nowIso: string): ArchivePlan {
  const cutoff = Date.parse(nowIso) - olderThanDays * DAY_MS
  const old = (iso: string) => Date.parse(iso) < cutoff
  return {
    olderThanDays,
    cutoffIso: new Date(cutoff).toISOString(),
    ledger: state.ledger.filter((entry) => old(entry.at)),
    journals: state.journals.filter((entry) => old(entry.at)),
    auditLogs: state.auditLogs.filter((entry) => old(entry.at)),
  }
}

/** Drop archived rows from the live document and keep balances and the trial balance intact. */
export function applyArchive(state: ErpState, plan: ArchivePlan) {
  const ledgerIds = new Set(plan.ledger.map((entry) => entry.id))
  const journalIds = new Set(plan.journals.map((entry) => entry.id))
  const auditIds = new Set(plan.auditLogs.map((entry) => entry.id))

  const baselines = new Map<string, { warehouse: LedgerEntry['warehouse']; itemType: LedgerEntry['itemType']; itemId: string; batchNo: string; qty: number }>()
  for (const row of state.ledgerBaselines ?? []) {
    baselines.set(balanceKey(row.warehouse, row.itemType, row.itemId, row.batchNo), row)
  }
  for (const entry of [...plan.ledger].reverse()) {
    baselines.set(balanceKey(entry.warehouse, entry.itemType, entry.itemId, entry.batchNo), {
      warehouse: entry.warehouse,
      itemType: entry.itemType,
      itemId: entry.itemId,
      batchNo: entry.batchNo,
      qty: qty(entry.newQty),
    })
  }
  state.ledgerBaselines = [...baselines.values()]

  const openings = new Map<string, { debit: number; credit: number }>()
  for (const row of state.journalOpenings ?? []) openings.set(row.accountCode, { debit: row.debit, credit: row.credit })
  for (const entry of plan.journals) {
    for (const line of entry.lines) {
      const current = openings.get(line.accountCode) ?? { debit: 0, credit: 0 }
      current.debit = money(current.debit + line.debit)
      current.credit = money(current.credit + line.credit)
      openings.set(line.accountCode, current)
    }
  }
  state.journalOpenings = [...openings.entries()].map(([accountCode, amounts]) => ({ accountCode, ...amounts }))

  state.ledger = state.ledger.filter((entry) => !ledgerIds.has(entry.id))
  state.journals = state.journals.filter((entry) => !journalIds.has(entry.id))
  state.auditLogs = state.auditLogs.filter((entry) => !auditIds.has(entry.id))
}
