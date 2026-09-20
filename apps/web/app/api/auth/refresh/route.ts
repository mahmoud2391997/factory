import { NextResponse, type NextRequest } from 'next/server'

import {
  getRefreshTokenFromRequest,
  issueAccessToken,
  setAccessCookie,
  verifyRefreshToken,
} from '@/server/auth/jwt'
import { assertAuthEnv, toApiError } from '@/server/env'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const env = assertAuthEnv()
    if (!env.ok) {
      return NextResponse.json({ success: false, message: env.message, code: env.code }, { status: env.status })
    }

    const refreshToken = getRefreshTokenFromRequest(req)
    if (!refreshToken) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })

    const payload = await verifyRefreshToken(refreshToken)
    if (!payload?.sub) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })

    const accessToken = await issueAccessToken({ sub: payload.sub })
    const res = NextResponse.json({ success: true, data: {}, message: '' })
    setAccessCookie(res, accessToken)
    return res
  } catch (error) {
    console.error('[auth/refresh]', error)
    const mapped = toApiError(error)
    return NextResponse.json(mapped.body, { status: mapped.status })
  }
}
