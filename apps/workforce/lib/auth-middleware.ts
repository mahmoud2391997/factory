import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose/jwt/verify'

const COOKIE_NAME = 'wf_auth'

const protectedRoutes = [
  '/dashboard',
  '/employees',
  '/departments',
  '/tasks',
  '/roles',
  '/settings',
  '/members',
  '/notifications',
  '/profile',
  '/create-team',
]

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

async function verifyTokenEdge(token: string) {
  const secret = process.env.WORKFORCE_JWT_SECRET?.trim()
  if (!secret) return null
  try {
    const key = new TextEncoder().encode(secret)
    const verified = await jwtVerify(token, key, { algorithms: ['HS256'] })
    const sub = String(verified.payload.sub ?? '')
    if (!sub) return null
    return { sub, email: String(verified.payload.email ?? '') }
  } catch {
    return null
  }
}

export async function updateSession(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  const pathname = request.nextUrl.pathname

  const allowWithoutSession =
    pathname.startsWith('/auth/login') ||
    pathname.startsWith('/auth/sign-up') ||
    pathname.startsWith('/auth/create-team') ||
    pathname.startsWith('/invite/') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/signup') ||
    pathname.startsWith('/api/auth/create-team') ||
    pathname.startsWith('/api/invitations/accept') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/apple-icon')

  if (allowWithoutSession) return NextResponse.next()

  const payload = token ? await verifyTokenEdge(token) : null
  if (isProtectedRoute(pathname) && !payload) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

