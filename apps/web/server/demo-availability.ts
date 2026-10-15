export function demoPreviewEnabled() {
  const value = process.env.DEMO_MODE?.trim().toLowerCase()
  return value ? ['on', 'true', '1'].includes(value) : process.env.APP_MODE?.trim().toLowerCase() === 'demo' || process.env.NODE_ENV !== 'production'
}
export function demoPreviewUrl(): string | null {
  const raw = process.env.FACTORY_DEMO_URL?.trim()
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (url.username || url.password) return null
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname))) return null
    return url.toString()
  } catch { return null }
}
