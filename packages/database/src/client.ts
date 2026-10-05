import { PrismaClient } from '@prisma/client'

import { ensureDatabaseUrlEnv } from './env'
import { shouldUseNoopPrismaFallback } from './client-policy'

const databaseUrl = ensureDatabaseUrlEnv()
const appMode = process.env.APP_MODE
const isProductionBuild = process.env.NEXT_PHASE === 'phase-production-build'
const allowNoopFallback = shouldUseNoopPrismaFallback(databaseUrl, process.env.NODE_ENV, appMode)

// Route handlers can be imported during `next build` even when a deployment
// intentionally runs in demo mode without database variables. Keep the client
// constructible at build time; database-backed requests still require the real
// DATABASE_URL or POSTGRES_PRISMA_URL at runtime.
const prismaUrl = databaseUrl ?? 'postgresql://postgres:postgres@localhost:5432/erp'

declare global {
  // eslint-disable-next-line no-var
  var __erpPrisma: PrismaClient | undefined
}

function createNoopPrisma(): PrismaClient {
  console.warn('[AI Studio] Database not connected — using mock')
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    updateMany: async () => ({ count: 0 }),
    delete: async () => ({}),
    deleteMany: async () => ({ count: 0 }),
    count: async () => 0,
    upsert: async (d: any) => d?.create ?? {},
  }
  const handler: ProxyHandler<any> = {
    get: (_target, prop) => {
      if (prop === '$connect' || prop === '$disconnect') return async () => {}
      if (prop === '$queryRaw' || prop === '$queryRawUnsafe') return async () => []
      if (prop === '$executeRaw' || prop === '$executeRawUnsafe') return async () => 0
      if (prop === '$transaction') return async (fn: any) => (typeof fn === 'function' ? fn(proxy) : Promise.all(fn))
      return noOp
    },
  }
  const proxy = new Proxy({}, handler)
  return proxy as unknown as PrismaClient
}

let prismaInstance = global.__erpPrisma

if (!prismaInstance) {
  if (!databaseUrl) {
    if (!allowNoopFallback && !isProductionBuild) {
      throw new Error('DATABASE_URL is required in production unless APP_MODE=demo.')
    }
    prismaInstance = createNoopPrisma()
  } else {
    try {
      prismaInstance = new PrismaClient({
        datasources: { db: { url: databaseUrl } },
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      })
    } catch (error) {
      if (!allowNoopFallback) throw error
      prismaInstance = createNoopPrisma()
    }
  }
  global.__erpPrisma = prismaInstance
}

export const prisma = prismaInstance
