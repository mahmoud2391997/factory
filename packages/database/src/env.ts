/**
 * Resolve a Postgres URL from common hosting env names and ensure
 * `process.env.DATABASE_URL` is set before PrismaClient is constructed.
 *
 * Vercel Postgres / Neon / Supabase often inject:
 * - POSTGRES_PRISMA_URL
 * - POSTGRES_URL
 * - POSTGRES_URL_NON_POOLING
 * instead of (or in addition to) DATABASE_URL.
 */
export function resolveDatabaseUrl(): string | null {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.PRISMA_DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL_UNPOOLED,
  ]

  for (const candidate of candidates) {
    const value = candidate?.trim()
    if (value) return value
  }

  return null
}

/** Mutates process.env so Prisma's env("DATABASE_URL") succeeds. */
export function ensureDatabaseUrlEnv(): string | null {
  const resolved = resolveDatabaseUrl()
  if (resolved && !process.env.DATABASE_URL?.trim()) {
    process.env.DATABASE_URL = resolved
  }
  return resolved
}
