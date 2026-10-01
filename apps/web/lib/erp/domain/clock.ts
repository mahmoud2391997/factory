/** Wall-clock used by seeds and the default engine clock. Tests inject `ERP_NOW` or a Date. */
export function erpNow(now?: Date | string): Date {
  if (now instanceof Date) return now
  if (typeof now === 'string' && now.trim()) {
    const parsed = new Date(now)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  const env = process.env.ERP_NOW?.trim()
  if (env) {
    const parsed = new Date(env)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return new Date()
}

export function erpNowIso(now?: Date | string) {
  return erpNow(now).toISOString()
}
