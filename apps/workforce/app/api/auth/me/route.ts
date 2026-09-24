import { NextResponse, type NextRequest } from 'next/server'

import { getSessionUser } from '@/server/auth/session'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  return NextResponse.json({ success: true, data: user })
}

