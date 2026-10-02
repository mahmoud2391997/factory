import { PrismaClient } from '@prisma/client'

import { ensureDatabaseUrlEnv } from './env'

const databaseUrl = ensureDatabaseUrlEnv()

// Route handlers can be imported during `next build` even when a deployment
// intentionally runs in demo mode without database variables. Keep the client
// constructible at build time; database-backed requests still require the real
// DATABASE_URL or POSTGRES_PRISMA_URL at runtime.
const prismaUrl = databaseUrl ?? 'postgresql://postgres:postgres@localhost:5432/erp'

declare global {
  // eslint-disable-next-line no-var
  var __erpPrisma: PrismaClient | undefined
}

export const prisma =
  global.__erpPrisma ??
  new PrismaClient({
    datasources: { db: { url: prismaUrl } },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  global.__erpPrisma = prisma
}
