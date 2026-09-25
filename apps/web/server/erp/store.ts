import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import bcrypt from 'bcryptjs'

import { planArchive } from '@/lib/erp/domain/archive'
import { commitWithRetry, REVISION_CONFLICT } from '@/lib/erp/domain/commit'
import { actorFromUser, applyCommand, publicState } from '@/lib/erp/domain/engine'
import { buildSeedState } from '@/lib/erp/domain/seed'
import type { Command, ErpState } from '@/lib/erp/domain/types'
import { SCHEMA_VERSION } from '@/lib/erp/domain/types'
import { resetLoginThrottle } from '@/server/auth/login-throttle'
import { BCRYPT_ROUNDS } from '@/server/auth/password'
import { prisma } from '@/server/db'
import { ensureDatabaseUrlEnv } from '@/server/db-url'

import { writeFileArchive, writeRelationalArchive } from './archive-store'
import { deliverPendingEmails } from './mailer'

const DOC_ID = 'main'
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000

export type StorageKind = 'postgres' | 'file'

/** In-memory fallback for serverless hosts where the app directory is read-only. */
let memoryState: ErpState | null = null

function dataDir() {
  const configured = process.env.ERP_DATA_DIR?.trim()
  if (configured) return configured
  // Vercel / Lambda: only /tmp is writable. Writing under process.cwd() throws EROFS
  // and previously broke demo login with AUTH_INTERNAL_ERROR.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), 'erp-data')
  }
  return path.join(process.cwd(), 'data')
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
  const hash = passwordHash && passwordHash.startsWith('$2') ? passwordHash : bcrypt.hashSync('Admin123!', BCRYPT_ROUNDS)
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

const DEMO_USERS = [
  { id: 'user-gm', email: 'gm@factory.local', fullName: 'سعيد الوهيبي', role: 'GM' as const },
  { id: 'user-admin', email: 'admin@factory.local', fullName: 'سعيد الوهيبي', role: 'GM' as const },
  { id: 'user-acc', email: 'accounts@factory.local', fullName: 'نورة العامرية', role: 'ACCOUNTANT' as const },
  { id: 'user-ops', email: 'ops@factory.local', fullName: 'سالم الحارثي', role: 'OPERATIONS' as const },
] as const

function isBcryptHash(value: string) {
  return value.startsWith('$2')
}

function normalizeDemoUsers(state: ErpState) {
  let changed = false
  let demoHash: string | null = null

  const byEmail = new Map(state.users.map((user) => [user.email.toLowerCase(), user]))

  for (const seed of DEMO_USERS) {
    const key = seed.email.toLowerCase()
    let user = byEmail.get(key)
    if (!user) {
      if (!demoHash) demoHash = bcrypt.hashSync('Admin123!', BCRYPT_ROUNDS)
      user = { ...seed, passwordHash: demoHash, active: true, mustChangePassword: false }
      state.users.unshift(user)
      byEmail.set(key, user)
      changed = true
      continue
    }

    if (!user.active) {
      user.active = true
      changed = true
    }
    if (user.mustChangePassword) {
      user.mustChangePassword = false
      changed = true
    }
    if (!isBcryptHash(user.passwordHash)) {
      if (!demoHash) demoHash = bcrypt.hashSync('Admin123!', BCRYPT_ROUNDS)
      user.passwordHash = demoHash
      changed = true
    }
  }

  return changed
}

async function readFileState() {
  if (memoryState) return memoryState
  try {
    const raw = await readFile(statePath(), 'utf8')
    const state = asState(JSON.parse(raw))
    memoryState = state
    return state
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
  memoryState = state
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

async function writeFileState(state: ErpState) {
  try {
    await writeLocalCopy(state)
  } catch (error) {
    // Keep serving from memory when disk is unavailable (common on misconfigured hosts).
    memoryState = state
    console.error('[erp/file]', error)
  }
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
  throw new Error(REVISION_CONFLICT)
}

async function persist(state: ErpState, storage: StorageKind) {
  const expected = state.revision
  state.revision = expected + 1
  if (storage === 'postgres') {
    await writePostgres(state, expected)
    await writeLocalCopy(state).catch((error) => console.error('[erp/backup]', error))
    return
  }
  await writeFileState(state)
}

let seedInFlight: Promise<ErpState> | null = null

async function createPostgresDocument() {
  const created = await createInitialState()
  created.revision = 1
  try {
    await prisma.erpDocument.create({
      data: { id: DOC_ID, version: created.revision, payload: created },
    })
  } catch (error) {
    // Concurrent cold starts / parallel login requests both try to seed once.
    const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : ''
    if (code === 'P2002') {
      const raced = await readPostgres()
      if (raced) return raced
    }
    throw error
  }
  await writeLocalCopy(created).catch((err) => console.error('[erp/backup]', err))
  return created
}

async function ensurePostgresState() {
  const existing = await readPostgres()
  if (existing) return existing
  if (!seedInFlight) {
    seedInFlight = createPostgresDocument().finally(() => {
      seedInFlight = null
    })
  }
  return seedInFlight
}

export async function loadState(): Promise<{ state: ErpState; storage: StorageKind }> {
  if (await databaseEnabled()) {
    const state = await ensurePostgresState()
    return { state, storage: 'postgres' }
  }

  const existing = await readFileState()
  if (existing) {
    if (normalizeDemoUsers(existing)) await writeFileState(existing)
    return { state: existing, storage: 'file' }
  }
  const created = await createInitialState()
  created.revision = 1
  normalizeDemoUsers(created)
  await writeFileState(created)
  return { state: created, storage: 'file' }
}

async function persistEmailFlags(state: ErpState, storage: StorageKind) {
  let current = state
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const mailed = await deliverPendingEmails(current)
    if (!mailed) return current
    try {
      await persist(current, storage)
      return current
    } catch (error) {
      if (error instanceof Error && error.message !== REVISION_CONFLICT) throw error
      if (attempt === 2) throw error
      current = (await loadState()).state
    }
  }
  return current
}

export async function runCommand(userId: string, action: string, input: Record<string, unknown>) {
  return enqueue(async () => {
    let prepared = { action, input } as Command
    if (action === 'setUserPassword') {
      const password = String(input.password ?? '')
      if (password.length < 8) return { ok: false as const, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }
      prepared = {
        action: 'setUserPassword',
        input: { userId: String(input.userId ?? ''), passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS) },
      }
    }

    return commitWithRetry(async () => {
      const loaded = await loadState()
      const actor = actorFromUser(loaded.state, userId)
      if (!actor) return { ok: false as const, error: 'المستخدم غير موجود' }

      if (action === 'resetDemo') {
        if (!actor.permissions.includes('settings.update')) return { ok: false as const, error: 'ليست لديك صلاحية لهذا الإجراء' }
        resetLoginThrottle()
        const fresh = await createInitialState()
        fresh.revision = loaded.state.revision
        await persist(fresh, loaded.storage)
        return {
          ok: true as const,
          state: publicState(fresh, actor.permissions),
          message: 'تمت إعادة بيانات المصنع التجريبية',
          storage: loaded.storage,
        }
      }

      let command = prepared
      if (action === 'archiveHistory') {
        const olderThanDays = Number(input.olderThanDays ?? 90)
        const nowIso = typeof input.nowIso === 'string' ? input.nowIso : new Date().toISOString()
        if (!actor.mustChangePassword && actor.permissions.includes('settings.update') && Number.isFinite(olderThanDays) && olderThanDays >= 1) {
          const plan = planArchive(loaded.state, olderThanDays, nowIso)
          const rows = plan.ledger.length + plan.journals.length + plan.auditLogs.length
          if (rows > 0) {
            if (loaded.storage === 'postgres') await writeRelationalArchive(loaded.state, plan)
            else await writeFileArchive(path.join(dataDir(), 'archive'), plan)
          }
        }
        command = { action: 'archiveHistory', input: { olderThanDays, nowIso } }
      }

      const result = applyCommand(loaded.state, actor, command)
      if (!result.ok) return { ok: false as const, error: result.error }
      await persist(result.state, loaded.storage)
      const saved = await persistEmailFlags(result.state, loaded.storage)
      return {
        ok: true as const,
        state: publicState(saved, actor.permissions),
        message: result.message,
        extra: result.extra,
        storage: loaded.storage,
      }
    })
  })
}
