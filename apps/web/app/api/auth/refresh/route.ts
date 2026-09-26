import { NextResponse, type NextRequest } from 'next/server'

import {
  getRefreshTokenFromRequest,
  issueAccessToken,
  setAccessCookie,
  verifyRefreshToken,
} from '@/server/auth/jwt'
import { assertAuthEnv, toApiError } from '@/server/env'
import { loadState } from '@/server/erp/store'

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

    const ver = typeof payload.ver === 'number' ? payload.ver : 1
    const { state } = await loadState()
    const user = state.users.find((item) => item.id === payload.sub && item.active)
    if (!user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
    if ((user.tokenVersion ?? 1) !== ver) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })

    const accessToken = await issueAccessToken({ sub: payload.sub, ver })
    const res = NextResponse.json({ success: true, data: {}, message: '' })
    setAccessCookie(res, accessToken)
    return res
  } catch (error) {
    console.error('[auth/refresh]', error)
    const mapped = toApiError(error)
    return NextResponse.json(mapped.body, { status: mapped.status })
  }
}
