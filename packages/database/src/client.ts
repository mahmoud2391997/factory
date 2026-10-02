import { PrismaClient } from '@prisma/client'

import { ensureDatabaseUrlEnv } from './env'

const databaseUrl = ensureDatabaseUrlEnv()

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is required. Configure DATABASE_URL or POSTGRES_PRISMA_URL for the Supabase Postgres connection.',
  )
}

declare global {
  // eslint-disable-next-line no-var
  var __erpPrisma: PrismaClient | undefined
}

export const prisma =
  global.__erpPrisma ??
  new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  global.__erpPrisma = prisma
}
