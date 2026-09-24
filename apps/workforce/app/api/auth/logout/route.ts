import { NextResponse, type NextRequest } from 'next/server'

import { clearAuthCookie } from '@/server/auth/jwt'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const accepts = req.headers.get('accept') ?? ''
  const res = accepts.includes('text/html')
    ? NextResponse.redirect(new URL('/auth/login', req.url), { status: 303 })
    : NextResponse.json({ success: true })
  clearAuthCookie(res)
  return res
}

