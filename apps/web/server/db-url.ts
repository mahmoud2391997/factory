const DATABASE_ENV_KEYS = ['MONGODB_URI', 'MONGODB_URL', 'MONGO_URL', 'DATABASE_URL'] as const

function isMongoUrl(value: string) {
  return value.startsWith('mongodb://') || value.startsWith('mongodb+srv://')
}

export function resolveDatabaseEnvKey(): (typeof DATABASE_ENV_KEYS)[number] | null {
  for (const key of DATABASE_ENV_KEYS) {
    const value = process.env[key]?.trim()
    if (value && isMongoUrl(value)) return key
  }
  return null
}

export function resolveDatabaseUrl(): string | null {
  const key = resolveDatabaseEnvKey()
  return key ? process.env[key]!.trim() : null
}

/** Kept for existing callers; MongoDB needs no env mutation. */
export function ensureDatabaseUrlEnv(): string | null {
  return resolveDatabaseUrl()
}
