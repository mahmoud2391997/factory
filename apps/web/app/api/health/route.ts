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
      const { getDb } = await import('@/server/db')
      const db = await getDb()
      await db.$queryRaw`SELECT 1`
      databaseReachable = true
      bootstrapped = Boolean(await db.erpDocument.findUnique({ where: { id: 'main' }, select: { id: true } }))
    } catch (error) {
      databaseError = error instanceof Error ? error.message.slice(0, 180) : 'database_error'
    }
  }
  const ready = demoMode || (databaseConfigured && jwtConfigured && databaseReachable)
  return NextResponse.json({ success: ready, data: { status: ready ? (demoMode ? 'demo' : 'ok') : 'degraded', demoMode, databaseConfigured, databaseEnvKey, jwtConfigured, databaseReachable, bootstrapped: demoMode ? true : bootstrapped ?? false, databaseError, demoCredentials: demoMode ? { email: 'admin@factory.local', password: 'Admin123!' } : null }, message: ready ? 'OK' : 'PostgreSQL غير جاهز' }, { status: ready ? 200 : 503 })
}
