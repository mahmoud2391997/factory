/**
 * A no-op Prisma proxy is a development/demo convenience only. In production,
 * it is allowed only for an explicit demo deployment with no configured database.
 */
export function shouldUseNoopPrismaFallback(
  databaseUrl: string | null,
  nodeEnv: string | undefined,
  appMode?: string,
) {
  if (nodeEnv !== 'production') return true
  if (databaseUrl) return false
  return appMode?.trim().toLowerCase() === 'demo'
}
