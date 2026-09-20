import { NextResponse } from 'next/server'

import { clearAuthCookies } from '@/server/auth/jwt'

export const runtime = 'nodejs'

export async function POST() {
  const res = NextResponse.json({ success: true, data: {}, message: 'تم تسجيل الخروج' })
  clearAuthCookies(res)
  return res
}

