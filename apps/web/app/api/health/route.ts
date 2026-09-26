import { NextResponse } from 'next/server'

import { isDemoMode } from '@/server/demo'
import { getDatabaseUrl, getJwtSecretRaw } from '@/server/env'

export const runtime = 'nodejs'

export async function GET() {
  const demoMode = isDemoMode()
  const databaseConfigured = Boolean(getDatabaseUrl())
  const jwtConfigured = Boolean(getJwtSecretRaw())
  const databaseEnvKey = process.env.DATABASE_URL
    ? 'DATABASE_URL'
    : process.env.POSTGRES_URL
      ? 'POSTGRES_URL'
      : null

  let databaseReachable = false
  let bootstrapped: boolean | null = null
  let databaseError: string | null = null

  if (databaseConfigured) {
    try {
      const { prisma } = await import('@/server/db')
      await prisma.$queryRaw`SELECT 1`
      databaseReachable = true
      const doc = await prisma.erpDocument.findUnique({ where: { id: 'main' }, select: { id: true } })
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
