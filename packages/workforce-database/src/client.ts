import { ensureWorkforceDatabaseUrlEnv } from './env'
import { PrismaClient } from './generated/client'

ensureWorkforceDatabaseUrlEnv()

declare global {
  // eslint-disable-next-line no-var
  var __workforcePrisma: PrismaClient | undefined
}

export const prisma = global.__workforcePrisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.__workforcePrisma = prisma

