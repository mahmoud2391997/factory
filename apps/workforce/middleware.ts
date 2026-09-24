import { NextResponse, type NextRequest } from 'next/server'

function hasValidSession(req: NextRequest) {
  const cookie = req.cookies.get('workforce_key')?.value
  const expected = process.env.WORKFORCE_API_KEY?.trim()
  if (!expected) return false
  return Boolean(cookie && cookie === expected)
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const allowWithoutSession =
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/apple-icon')

  if (allowWithoutSession) return NextResponse.next()

  if (!hasValidSession(req)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
    }
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.search = ''
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
}

