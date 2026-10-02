const DATABASE_ENV_KEYS = ['DATABASE_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL', 'DATABASE_URL_UNPOOLED'] as const

export function resolveDatabaseEnvKey(): (typeof DATABASE_ENV_KEYS)[number] | null {
  for (const key of DATABASE_ENV_KEYS) {
    if (process.env[key]?.trim()) return key
  }
  return null
}

export function resolveDatabaseUrl(): string | null {
  for (const key of DATABASE_ENV_KEYS) {
    const value = process.env[key]?.trim()
    if (value) return value
  }
  return null
}

export function ensureDatabaseUrlEnv(): string | null {
  return resolveDatabaseUrl()
}
