/**
 * A no-op Prisma proxy is a development/demo convenience only. In production,
 * a configured real database must never be silently replaced by mock behavior.
 */
export function shouldUseNoopPrismaFallback(databaseUrl: string | null, nodeEnv: string | undefined) {
  return !(databaseUrl && nodeEnv === 'production')
}
