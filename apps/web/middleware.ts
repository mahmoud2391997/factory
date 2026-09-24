import { NextResponse, type NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const allowWithoutSession =
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/refresh') ||
    pathname.startsWith('/api/auth/me') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/setup/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/apple-icon')

  if (allowWithoutSession) return NextResponse.next()

  const access = req.cookies.get('access_token')?.value
  const refresh = req.cookies.get('refresh_token')?.value
  const hasSession = Boolean(access || refresh)

  if (pathname.startsWith('/api/')) {
    if (!hasSession) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
    }
    return NextResponse.next()
  }

  if (!hasSession) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.search = ''
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Skip static files like /script.js so they don't get HTML login redirects.
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
}
