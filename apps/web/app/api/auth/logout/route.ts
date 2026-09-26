import { NextResponse, type NextRequest } from 'next/server'

import { clearAuthCookies, getAccessTokenFromRequest, getRefreshTokenFromRequest, verifyAccessToken, verifyRefreshToken } from '@/server/auth/jwt'
import { revokeUserTokens } from '@/server/erp/store'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let userId: string | null = null
  const access = getAccessTokenFromRequest(req)
  if (access) {
    const payload = await verifyAccessToken(access)
    if (payload?.sub) userId = payload.sub
  }
  if (!userId) {
    const refresh = getRefreshTokenFromRequest(req)
    if (refresh) {
      const payload = await verifyRefreshToken(refresh)
      if (payload?.sub) userId = payload.sub
    }
  }
  if (userId) {
    await revokeUserTokens(userId).catch((error) => console.error('[auth/logout]', error))
  }
  const res = NextResponse.json({ success: true, data: {}, message: 'تم تسجيل الخروج' })
  clearAuthCookies(res)
  return res
}

