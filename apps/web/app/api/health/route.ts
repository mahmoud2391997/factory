import { NextResponse } from 'next/server'

import { prisma } from '@/server/db'
import { getDatabaseUrl, getJwtSecretRaw } from '@/server/env'

export const runtime = 'nodejs'

export async function GET() {
  const databaseConfigured = Boolean(getDatabaseUrl())
  const jwtConfigured = Boolean(getJwtSecretRaw())
  let database = databaseConfigured ? 'error' : 'error'
  let bootstrapped = false

  if (databaseConfigured) {
    try {
      await prisma.$queryRaw`SELECT 1`
      database = 'ok'
      bootstrapped = (await prisma.user.count()) > 0
    } catch {
      database = 'error'
    }
  }

  const result = {
    database: database as 'ok' | 'error',
    jwt: jwtConfigured ? ('ok' as const) : ('error' as const),
    bootstrapped,
  }
  const healthy = result.database === 'ok' && result.jwt === 'ok'
  return NextResponse.json(result, { status: healthy ? 200 : 503 })
}
  return null
}

export async function GET() {
  const demoMode = isDemoMode()
  const databaseConfigured = Boolean(getDatabaseUrl())
  const jwtConfigured = Boolean(getJwtSecretRaw())
  const databaseEnvKey = detectDatabaseEnvKey()

  let databaseReachable = false
  let userCount: number | null = null
  let databaseError: string | null = null

  if (databaseConfigured) {
    try {
      await prisma.$queryRaw`SELECT 1`
      databaseReachable = true
      userCount = await prisma.user.count()
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
        bootstrapped: demoMode ? true : typeof userCount === 'number' ? userCount > 0 : false,
        userCount: demoMode ? 1 : userCount,
        databaseError,
        demoCredentials: demoMode
          ? { email: 'admin@factory.local', password: 'Admin123!' }
          : null,
      },
      message: demoMode
        ? 'وضع تجريبي نشط (بدون DATABASE_URL) — يمكن الدخول بالحساب الافتراضي'
        : ready
          ? 'OK'
          : !databaseConfigured
            ? 'DATABASE_URL / POSTGRES_URL غير مضبوط'
            : !jwtConfigured
              ? 'JWT_SECRET غير مضبوط'
              : !databaseReachable
                ? 'قاعدة البيانات غير متاحة أو الجداول غير مُرحَّلة'
                : 'غير جاهز',
    },
    { status: ready ? 200 : 503 },
  )
}
