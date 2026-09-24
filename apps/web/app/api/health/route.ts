import { NextResponse } from 'next/server'

import { isDemoMode } from '@/server/demo'
import { prisma } from '@/server/db'
import { getDatabaseUrl, getJwtSecretRaw } from '@/server/env'

export const runtime = 'nodejs'

function detectDatabaseEnvKey() {
  const keys = [
    'DATABASE_URL',
    'POSTGRES_PRISMA_URL',
    'PRISMA_DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRES_URL_NON_POOLING',
    'DATABASE_URL_UNPOOLED',
  ] as const
  for (const key of keys) {
    if (process.env[key]?.trim()) return key
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
