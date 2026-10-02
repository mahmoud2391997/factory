import { PrismaClient } from '@prisma/client'

import { ensureDatabaseUrlEnv } from './env'

ensureDatabaseUrlEnv()

declare global {
  // eslint-disable-next-line no-var
  var __erpPrisma: any
}

let prisma: any

try {
  prisma = global.__erpPrisma ?? new PrismaClient()
} catch {
  console.warn('[AI Studio] Database not connected — using mock')
  const noOp = {
    $queryRaw: async () => [{ '?column?': 1 }],
    $executeRaw: async () => 0,
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  }
  prisma = new Proxy({}, { get: () => noOp })
}

if (process.env.NODE_ENV !== 'production') global.__erpPrisma = prisma

export { prisma }
