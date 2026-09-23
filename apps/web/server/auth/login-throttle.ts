const WINDOW_MS = 5 * 60 * 1000
const LOCK_MS = 60 * 1000
const MAX_FAILURES = 5

type Bucket = { failures: number; windowStart: number; lockedUntil: number }

const buckets = new Map<string, Bucket>()

function keys(email: string, ip: string) {
  return [`email:${email.toLowerCase()}`, `ip:${ip || 'unknown'}`]
}

export const LOGIN_LOCK_MESSAGE = 'تم إيقاف الدخول مؤقتاً بعد عدة محاولات خاطئة. انتظر 60 ثانية ثم أعد المحاولة.'

export function loginThrottleMessage(email: string, ip: string, now = Date.now()) {
  for (const key of keys(email, ip)) {
    const row = buckets.get(key)
    if (row && row.lockedUntil > now) return LOGIN_LOCK_MESSAGE
  }
  return null
}

export function recordLoginFailure(email: string, ip: string, now = Date.now()) {
  for (const key of keys(email, ip)) {
    const current = buckets.get(key)
    const expired = !current || now - current.windowStart > WINDOW_MS || (current.lockedUntil > 0 && current.lockedUntil <= now)
    const row: Bucket = expired ? { failures: 0, windowStart: now, lockedUntil: 0 } : current
    row.failures += 1
    if (row.failures >= MAX_FAILURES) row.lockedUntil = now + LOCK_MS
    buckets.set(key, row)
  }
}

export function recordLoginSuccess(email: string, ip: string) {
  for (const key of keys(email, ip)) buckets.delete(key)
}

export function resetLoginThrottle() {
  buckets.clear()
}
