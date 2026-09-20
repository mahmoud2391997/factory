import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __erpPrisma: PrismaClient | undefined
}

export const prisma = global.__erpPrisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.__erpPrisma = prisma

