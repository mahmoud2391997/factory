import { NextResponse } from 'next/server'

import { isDemoMode } from '@/server/demo'
import { resolveDatabaseEnvKey } from '@/server/db-url'
import { getDatabaseUrl, getJwtSecretRaw } from '@/server/env'

export const runtime = 'nodejs'

export async function GET() {
  const demoMode = isDemoMode()
  const databaseConfigured = Boolean(getDatabaseUrl())
  const jwtConfigured = Boolean(getJwtSecretRaw())
  const databaseEnvKey = resolveDatabaseEnvKey()

  let databaseReachable = false
  let bootstrapped: boolean | null = null
  let databaseError: string | null = null

  if (databaseConfigured) {
    try {
      const { getDb, COLLECTIONS } = await import('@/server/db')
      const db = await getDb()
      await db.command({ ping: 1 })
      databaseReachable = true
      const doc = await db
        .collection<{ _id: string }>(COLLECTIONS.erpDocuments)
        .findOne({ _id: 'main' }, { projection: { _id: 1 } })
      bootstrapped = Boolean(doc)
    } catch (error) {
      databaseError = error instanceof Error ? error.message.slice(0, 180) : 'database_error'
    }
  }

  const ready = demoMode || (databaseConfigured && jwtConfigured && databaseReachable)

  return NextResponse.json(
    {
      success: ready,
      data: {
        status: ready ? (demoMode ? 'demo' : 'ok') : 'degraded',
        demoMode,
        databaseConfigured,
        databaseEnvKey,
        jwtConfigured,
        databaseReachable,
        bootstrapped: demoMode ? true : bootstrapped ?? false,
        databaseError,
      },
      message: demoMode
        ? 'وضع تجريبي نشط (بدون MONGODB_URI)'
        : ready
          ? 'OK'
          : !databaseConfigured
            ? 'MONGODB_URI غير مضبوط'
            : !jwtConfigured
              ? 'JWT_SECRET غير مضبوط'
              : !databaseReachable
                ? 'قاعدة بيانات MongoDB غير متاحة'
                : 'غير جاهز',
    },
    { status: ready ? 200 : 503 },
  )
}
