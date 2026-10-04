import { NextResponse } from 'next/server'
import { isDemoMode } from '@/server/demo'
import { getDatabaseUrl, getJwtSecretRaw } from '@/server/env'

export const runtime = 'nodejs'

export async function GET() {
  const demoMode = isDemoMode()
  if (demoMode) {
    return NextResponse.json({
      success: true,
      data: {
        status: 'demo' as const,
        bootstrapped: true,
        demoMode: true,
        demoCredentials: { email: 'admin@factory.local', password: 'Admin123!' },
      },
    })
  }

  const databaseConfigured = Boolean(getDatabaseUrl())
  const jwtConfigured = Boolean(getJwtSecretRaw())
  let databaseReachable = false
  let bootstrapped = false

  if (databaseConfigured && jwtConfigured) {
    try {
      const { getDb } = await import('@/server/db')
      const db = await getDb()
      await db.$queryRaw`SELECT 1`
      databaseReachable = true
      bootstrapped = Boolean(await db.erpDocument.findUnique({ where: { id: 'main' }, select: { id: true } }))
    } catch {
      databaseReachable = false
      bootstrapped = false
    }
  }

  const ok = databaseReachable && bootstrapped
  const status = ok ? ('ok' as const) : ('degraded' as const)

  return NextResponse.json(
    {
      success: ok,
      data: {
        status,
        bootstrapped,
        demoMode: false,
      },
    },
    { status: ok ? 200 : 503 },
  )
}
