const production = process.env.NODE_ENV === 'production'
const value = (name) => (process.env[name] || '').trim()
const databaseKeys = [
  'DATABASE_URL',
  'NEON_POSTGRES_PRISMA_URL',
  'NEON_DATABASE_URL',
  'NEON_POSTGRES_URL',
  'NEON_DATABASE_URL_UNPOOLED',
  'NEON_POSTGRES_URL_NON_POOLING',
  'POSTGRES_PRISMA_URL',
  'PRISMA_DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_URL_NON_POOLING',
  'DATABASE_URL_UNPOOLED',
]
const hasDatabase = databaseKeys.some((name) => value(name))
const configuredMode = value('APP_MODE').toLowerCase()
const demo = configuredMode === 'demo' && !hasDatabase
const placeholder = /^(change[-_ ]?me|replace[-_ ]?me|your[-_ ]?secret|secret|test|example|password)$/i

if (!production || demo) process.exit(0)

const errors = []
if (!hasDatabase) errors.push('DATABASE_URL (or a supported Postgres URL alias) is required outside demo mode.')
if (value('JWT_SECRET').length < 32 || placeholder.test(value('JWT_SECRET'))) {
  errors.push('JWT_SECRET must be at least 32 characters and not a placeholder.')
}
if (value('SETUP_TOKEN').length < 16 || placeholder.test(value('SETUP_TOKEN'))) {
  errors.push('SETUP_TOKEN must be at least 16 characters and not a placeholder.')
}

const supabaseVariables = Object.keys(process.env).filter(
  (name) => /^(?:NEXT_PUBLIC_)?SUPABASE_/.test(name) && value(name),
)
if (supabaseVariables.length) {
  console.warn('Warning: SUPABASE_* is set; login will also require Supabase Auth for this test.')
}

if (errors.length) {
  console.error(`Production environment check failed:\n- ${errors.join('\n- ')}`)
  process.exit(1)
}
