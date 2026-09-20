import { NextResponse, type NextRequest } from 'next/server'

import { issueAccessToken, getRefreshTokenFromRequest, verifyRefreshToken, setAccessCookie } from '@/server/auth/jwt'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const refreshToken = getRefreshTokenFromRequest(req)
  if (!refreshToken) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })

  const payload = await verifyRefreshToken(refreshToken)
  if (!payload?.sub) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })

  const accessToken = await issueAccessToken({ sub: payload.sub })
  const res = NextResponse.json({ success: true, data: {}, message: '' })
  setAccessCookie(res, accessToken)
  return res
}

