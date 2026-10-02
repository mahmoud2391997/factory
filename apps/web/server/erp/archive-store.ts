import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { prisma } from '@erp/database/client'
import type { ArchivePlan } from '@/lib/erp/domain/archive'

async function mergeArchiveFile(file: string, rows: unknown[]) {
  if (rows.length === 0) return
  let current: unknown[] = []
  try {
    current = JSON.parse(await readFile(file, 'utf8')) as unknown[]
    if (!Array.isArray(current)) current = []
  } catch {
    current = []
  }
  const byId = new Map<string, unknown>()
  for (const row of [...current, ...rows]) {
    if (row && typeof row === 'object' && 'id' in row) byId.set(String((row as { id: unknown }).id), row)
  }
  await writeFile(file, JSON.stringify([...byId.values()]))
}

export async function writeFileArchive(dir: string, plan: ArchivePlan) {
  await mkdir(dir, { recursive: true })
  await mergeArchiveFile(path.join(dir, 'ledger.json'), plan.ledger)
  await mergeArchiveFile(path.join(dir, 'journals.json'), plan.journals)
  await mergeArchiveFile(path.join(dir, 'audit-logs.json'), plan.auditLogs)
}

/** Idempotent cold storage for records removed from the live ERP document. */
export async function writeDatabaseArchive(plan: ArchivePlan) {
  const groups = [
    ['ledger', plan.ledger],
    ['journal', plan.journals],
    ['audit', plan.auditLogs],
  ] as const
  for (const [kind, rows] of groups) {
    for (const row of rows) {
      await prisma.archiveRecord.upsert({
        where: { id: row.id },
        update: {},
        create: { id: row.id, kind, at: new Date(row.at), payload: row as object },
      })
    }
  }
}
