export function resolveWorkforceDatabaseUrl(): string | null {
  const candidates = [
    process.env.WORKFORCE_DATABASE_URL,
    process.env.WORKFORCE_POSTGRES_PRISMA_URL,
    process.env.WORKFORCE_POSTGRES_URL,
    process.env.WORKFORCE_POSTGRES_URL_NON_POOLING,
  ]

  for (const candidate of candidates) {
    const value = candidate?.trim()
    if (value) return value
  }

  return null
}

/** Mutates process.env so Prisma's env("WORKFORCE_DATABASE_URL") succeeds. */
export function ensureWorkforceDatabaseUrlEnv(): string | null {
  const resolved = resolveWorkforceDatabaseUrl()
  if (resolved && !process.env.WORKFORCE_DATABASE_URL?.trim()) {
    process.env.WORKFORCE_DATABASE_URL = resolved
  }
  return resolved
}

