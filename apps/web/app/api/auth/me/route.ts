import { NextResponse, type NextRequest } from 'next/server'

import {
  getAccessTokenFromRequest,
  getRefreshTokenFromRequest,
  issueAccessToken,
  setAccessCookie,
  verifyAccessToken,
  verifyRefreshToken,
} from '@/server/auth/jwt'
import { getSessionUserById } from '@/server/auth/session'
import { assertAuthEnv, toApiError } from '@/server/env'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const env = assertAuthEnv()
    if (!env.ok) {
      return NextResponse.json({ success: false, message: env.message, code: env.code }, { status: env.status })
    }

    let userId: string | null = null
    let refreshedAccess: string | null = null

    const accessToken = getAccessTokenFromRequest(req)
    if (accessToken) {
      const payload = await verifyAccessToken(accessToken)
      if (payload?.sub) userId = payload.sub
    }

    if (!userId) {
      const refreshToken = getRefreshTokenFromRequest(req)
      if (refreshToken) {
        const payload = await verifyRefreshToken(refreshToken)
        if (payload?.sub) {
          userId = payload.sub
          refreshedAccess = await issueAccessToken({ sub: payload.sub })
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
    }

    const user = await getSessionUserById(userId)
    if (!user) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
    }

    const res = NextResponse.json({
      success: true,
      data: { user },
      message: '',
    })
    if (refreshedAccess) setAccessCookie(res, refreshedAccess)
    return res
  } catch (error) {
    console.error('[auth/me]', error)
    const mapped = toApiError(error)
    return NextResponse.json(mapped.body, { status: mapped.status })
  }
}
