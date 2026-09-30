import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { AnyBulkWriteOperation, Document } from 'mongodb'

import type { ArchivePlan } from '@/lib/erp/domain/archive'
import { COLLECTIONS, getDb } from '@/server/db'

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
  for (const row of current) {
    if (row && typeof row === 'object' && 'id' in row) byId.set(String((row as { id: unknown }).id), row)
  }
  for (const row of rows) {
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

type ArchiveRow = { id: string; at: string }
type ArchiveDocument = Document & { _id: string }

function insertIfMissing<T extends ArchiveRow>(rows: T[]): AnyBulkWriteOperation<ArchiveDocument>[] {
  return rows.map((row) => {
    const { id, at, ...rest } = row
    return {
      updateOne: {
        filter: { _id: id },
        update: { $setOnInsert: { ...rest, at: new Date(at), archivedAt: new Date() } },
        upsert: true,
      },
    }
  })
}

/** Idempotent: re-archiving the same rows never overwrites what is already stored. */
export async function writeDatabaseArchive(plan: ArchivePlan) {
  const db = await getDb()
  const writes: Array<[string, AnyBulkWriteOperation<ArchiveDocument>[]]> = [
    [COLLECTIONS.archiveLedger, insertIfMissing(plan.ledger)],
    [COLLECTIONS.archiveJournals, insertIfMissing(plan.journals)],
    [COLLECTIONS.archiveAuditLogs, insertIfMissing(plan.auditLogs)],
  ]
  for (const [name, operations] of writes) {
    if (operations.length > 0) await db.collection<ArchiveDocument>(name).bulkWrite(operations, { ordered: false })
  }
}
