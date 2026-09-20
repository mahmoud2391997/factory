/** Local copy of DB URL resolution (avoids fragile subpath import during Edge/Turbopack). */
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

export function ensureDatabaseUrlEnv(): string | null {
  const resolved = resolveDatabaseUrl()
  if (resolved && !process.env.DATABASE_URL?.trim()) {
    process.env.DATABASE_URL = resolved
  }
  return resolved
}
