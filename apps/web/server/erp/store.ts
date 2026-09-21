import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

import bcrypt from 'bcryptjs'

import { actorFromUser, applyCommand, publicState } from '@/lib/erp/domain/engine'
import { buildSeedState } from '@/lib/erp/domain/seed'
import type { Command, ErpState } from '@/lib/erp/domain/types'
import { SCHEMA_VERSION } from '@/lib/erp/domain/types'
import { prisma } from '@/server/db'
import { ensureDatabaseUrlEnv } from '@/server/db-url'

import { deliverPendingEmails } from './mailer'

const DOC_ID = 'main'
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000

export type StorageKind = 'postgres' | 'file'

function dataDir() {
  return process.env.ERP_DATA_DIR?.trim() || path.join(process.cwd(), 'data')
}

function statePath() {
  return path.join(dataDir(), 'erp-state.json')
}

let queue: Promise<unknown> = Promise.resolve()

function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job)
  queue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

export async function createInitialState(passwordHash?: string) {
  const hash = passwordHash && passwordHash.startsWith('$2') ? passwordHash : bcrypt.hashSync('Admin123!', 8)
  const state = buildSeedState(hash)
  for (const item of state.notifications) item.emailStatus = 'skipped'
  return state
}

function asState(value: unknown): ErpState {
  if (!value || typeof value !== 'object') throw new Error('ملف البيانات تالف')
  const state = value as ErpState
  if (state.schemaVersion !== SCHEMA_VERSION) throw new Error('إصدار بيانات المصنع غير مدعوم')
  return state
}

async function readFileState() {
  try {
    const raw = await readFile(statePath(), 'utf8')
    return asState(JSON.parse(raw))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

async function pruneBackups(dir: string) {
  const entries = await readdir(dir).catch(() => [])
  const cutoff = Date.now() - RETENTION_MS
  await Promise.all(
    entries.map(async (name) => {
      const full = path.join(dir, name)
      const info = await stat(full).catch(() => null)
      if (info && info.mtimeMs < cutoff) await rm(full, { force: true })
    }),
  )
}

export async function writeLocalCopy(state: ErpState) {
  const dir = dataDir()
  const backups = path.join(dir, 'backups')
  await mkdir(backups, { recursive: true })
  const target = statePath()
  const tmp = `${target}.tmp`
  const body = JSON.stringify(state)
  await writeFile(tmp, body)
  await rename(tmp, target)
  const day = new Date().toISOString().slice(0, 10)
  await writeFile(path.join(backups, `erp-${day}.json`), body)
  await pruneBackups(backups)
}

async function databaseEnabled() {
  return Boolean(ensureDatabaseUrlEnv())
}

async function readPostgres(): Promise<ErpState | null> {
  const row = await prisma.erpDocument.findUnique({ where: { id: DOC_ID } })
  if (!row) return null
  return asState(row.payload)
}

async function writePostgres(state: ErpState, expectedRevision: number) {
  const updated = await prisma.erpDocument.updateMany({
    where: { id: DOC_ID, version: expectedRevision },
    data: { version: state.revision, payload: state },
  })
  if (updated.count > 0) return
  const existing = await prisma.erpDocument.findUnique({ where: { id: DOC_ID } })
  if (!existing) {
    await prisma.erpDocument.create({
      data: { id: DOC_ID, version: state.revision, payload: state },
    })
    return
  }
  throw new Error('تعارض في حفظ البيانات. أعد المحاولة.')
}

async function persist(state: ErpState, storage: StorageKind) {
  const expected = state.revision
  state.revision = expected + 1
  if (storage === 'postgres') await writePostgres(state, expected)
  try {
    await writeLocalCopy(state)
  } catch (error) {
    if (storage === 'file') throw error
    console.error('[erp/backup]', error)
  }
}

export async function loadState(): Promise<{ state: ErpState; storage: StorageKind }> {
  if (await databaseEnabled()) {
    const existing = await readPostgres()
    if (existing) return { state: existing, storage: 'postgres' }
    const created = await createInitialState()
    created.revision = 1
    await prisma.erpDocument.create({
      data: { id: DOC_ID, version: created.revision, payload: created },
    })
    await writeLocalCopy(created).catch((error) => console.error('[erp/backup]', error))
    return { state: created, storage: 'postgres' }
  }

  const existing = await readFileState()
  if (existing) return { state: existing, storage: 'file' }
  const created = await createInitialState()
  created.revision = 1
  await writeLocalCopy(created)
  return { state: created, storage: 'file' }
}

export async function runCommand(userId: string, action: string, input: Record<string, unknown>) {
  return enqueue(async () => {
    const loaded = await loadState()
    const actor = actorFromUser(loaded.state, userId)
    if (!actor) return { ok: false as const, error: 'المستخدم غير موجود' }

    if (action === 'resetDemo') {
      if (!actor.permissions.includes('settings.update')) return { ok: false as const, error: 'ليست لديك صلاحية لهذا الإجراء' }
      const fresh = await createInitialState(loaded.state.users[0]?.passwordHash)
      fresh.revision = loaded.state.revision
      await persist(fresh, loaded.storage)
      return {
        ok: true as const,
        state: publicState(fresh),
        message: 'تمت إعادة بيانات المصنع التجريبية',
        storage: loaded.storage,
      }
    }

    let command = { action, input } as Command
    if (action === 'setUserPassword') {
      const password = String(input.password ?? '')
      if (password.length < 8) return { ok: false as const, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }
      command = {
        action: 'setUserPassword',
        input: { userId: String(input.userId ?? ''), passwordHash: await bcrypt.hash(password, 8) },
      }
    }

    const result = applyCommand(loaded.state, actor, command)
    if (!result.ok) return { ok: false as const, error: result.error }
    await persist(result.state, loaded.storage)
    const mailed = await deliverPendingEmails(result.state)
    if (mailed) await persist(result.state, loaded.storage)
    return {
      ok: true as const,
      state: publicState(result.state),
      message: result.message,
      extra: result.extra,
      storage: loaded.storage,
    }
  })
}
