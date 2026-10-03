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

let prismaInstance: PrismaClient

try {
  prismaInstance =
    global.__erpPrisma ??
    new PrismaClient({
      datasources: { db: { url: prismaUrl } },
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
} catch {
  console.warn('[AI Studio] Database not connected — using mock')
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  }
  prismaInstance = new Proxy({}, { get: () => noOp }) as unknown as PrismaClient
}

export const prisma = prismaInstance

if (process.env.NODE_ENV !== 'production') {
  global.__erpPrisma = prisma
}
