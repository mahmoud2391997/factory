const DATABASE_ENV_KEYS = ['DATABASE_URL', 'DATABASE_URL_UNPOOLED'] as const

export function resolveDatabaseEnvKey(): (typeof DATABASE_ENV_KEYS)[number] | null {
  for (const key of DATABASE_ENV_KEYS) {
    if (process.env[key]?.trim()) return key
  }
  return null
}

export function resolveDatabaseUrl(): string | null {
  const value = process.env.DATABASE_URL?.trim()
  return value || null
}

export function ensureDatabaseUrlEnv(): string | null {
  return resolveDatabaseUrl()
}
