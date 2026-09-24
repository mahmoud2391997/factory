import { PrismaClient } from '@prisma/client'

import { ensureDatabaseUrlEnv } from './env'

ensureDatabaseUrlEnv()

declare global {
  // eslint-disable-next-line no-var
  var __erpPrisma: PrismaClient | undefined
}

export const prisma = global.__erpPrisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.__erpPrisma = prisma
