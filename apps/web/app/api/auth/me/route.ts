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
import { isDemoMode } from '@/server/demo'
import { assertAuthEnv, toApiError } from '@/server/env'
import { loadState } from '@/server/erp/store'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const env = assertAuthEnv()
    if (!env.ok) {
      return NextResponse.json({ success: false, message: env.message, code: env.code }, { status: env.status })
    }

    let userId: string | null = null
    let refreshedAccess: string | null = null
    let tokenVersion = 1

    const accessToken = getAccessTokenFromRequest(req)
    if (accessToken) {
      const payload = await verifyAccessToken(accessToken)
      if (payload?.sub) {
        userId = payload.sub
        tokenVersion = typeof payload.ver === 'number' ? payload.ver : 1
      }
    }

    if (!userId) {
      const refreshToken = getRefreshTokenFromRequest(req)
      if (refreshToken) {
        const payload = await verifyRefreshToken(refreshToken)
        if (payload?.sub) {
          userId = payload.sub
          tokenVersion = typeof payload.ver === 'number' ? payload.ver : 1
          refreshedAccess = await issueAccessToken({ sub: payload.sub, ver: tokenVersion })
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
    }

    const { state } = await loadState()
    const erpUser = state.users.find((item) => item.id === userId && item.active)
    if (!erpUser) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
    }
    if ((erpUser.tokenVersion ?? 1) !== tokenVersion) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
    }

    const user = await getSessionUserById(userId)

    if (!user) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
    }

    const res = NextResponse.json({
      success: true,
      data: { user, demoMode: isDemoMode() },
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
