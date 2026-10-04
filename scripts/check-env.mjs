const production = process.env.NODE_ENV === 'production'
const demo = (process.env.APP_MODE || '').trim().toLowerCase() === 'demo'
const value = (name) => (process.env[name] || '').trim()
const placeholder = /^(change[-_ ]?me|replace[-_ ]?me|your[-_ ]?secret|secret|test)$/i

if (!production || demo) process.exit(0)
const errors = []
if (!value('DATABASE_URL')) errors.push('DATABASE_URL is required outside demo mode.')
if (value('JWT_SECRET').length < 32 || placeholder.test(value('JWT_SECRET'))) errors.push('JWT_SECRET must be at least 32 characters and not a placeholder.')
if (value('SETUP_TOKEN').length < 16 || placeholder.test(value('SETUP_TOKEN'))) errors.push('SETUP_TOKEN must be at least 16 characters and not a placeholder.')
if (value('SUPABASE_URL') || value('NEXT_PUBLIC_SUPABASE_URL') || value('SUPABASE_ANON_KEY')) console.warn('Warning: SUPABASE_* is set; login will also require Supabase Auth for this test.')
if (errors.length) {
  console.error(`Production environment check failed:\n- ${errors.join('\n- ')}`)
  process.exit(1)
}
