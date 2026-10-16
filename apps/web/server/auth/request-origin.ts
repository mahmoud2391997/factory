import type { NextRequest } from 'next/server'

/** Cookie APIs are browser same-origin only. Machine endpoints retain their own strong bearer/token authentication. */
export function mutationOriginAllowed(req: NextRequest) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || !req.nextUrl.pathname.startsWith('/api/')) return true
  if (['/api/internal/outbox', '/api/scale/readings'].includes(req.nextUrl.pathname)) return true
  if (req.headers.get('sec-fetch-site') === 'cross-site') return false
  const origin = req.headers.get('origin')
  if (!origin) return !req.cookies.has('access_token') && !req.cookies.has('refresh_token')
  try {
    const source = new URL(origin)
    const host = req.headers.get('host') || req.nextUrl.host
    const forwardedProtocol = req.headers.get('x-forwarded-proto')
    const protocol = forwardedProtocol === 'https' || forwardedProtocol === 'http' ? forwardedProtocol + ':' : req.nextUrl.protocol
    return source.origin === `${protocol}//${host}` && !source.username && !source.password
  } catch { return false }
}
