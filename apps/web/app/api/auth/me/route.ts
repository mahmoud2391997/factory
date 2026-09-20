import { NextResponse, type NextRequest } from 'next/server'

import { prisma } from '@/server/db'
import { getAccessTokenFromRequest, verifyAccessToken } from '@/server/auth/jwt'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const token = getAccessTokenFromRequest(req)
  if (!token) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })

  const payload = await verifyAccessToken(token)
  if (!payload?.sub) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, email: true, fullName: true, isActive: true } })
  if (!user || !user.isActive) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })

  return NextResponse.json({ success: true, data: { user }, message: '' })
}

