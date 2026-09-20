import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { prisma } from '@/server/db'
import { issueAccessToken, issueRefreshToken, setAuthCookies } from '@/server/auth/jwt'
import { getSessionUserById } from '@/server/auth/session'
import { assertAuthEnv, toApiError } from '@/server/env'

export const runtime = 'nodejs'

const bodySchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
})

export async function POST(req: NextRequest) {
  try {
    const env = assertAuthEnv()
    if (!env.ok) {
      return NextResponse.json({ success: false, message: env.message, code: env.code }, { status: env.status })
    }

    const json = await req.json().catch(() => null)
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'بيانات الدخول غير صحيحة',
          errors: parsed.error.issues.map((i) => ({ path: String(i.path[0] ?? ''), message: i.message })),
        },
        { status: 400 },
      )
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } })
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, message: 'بيانات الدخول غير صحيحة' }, { status: 401 })
    }

    const ok = await bcrypt.compare(parsed.data.password, user.passwordHash)
    if (!ok) {
      return NextResponse.json({ success: false, message: 'بيانات الدخول غير صحيحة' }, { status: 401 })
    }

    const accessToken = await issueAccessToken({ sub: user.id })
    const refreshToken = await issueRefreshToken({ sub: user.id })
    const sessionUser = await getSessionUserById(user.id)

    const res = NextResponse.json({
      success: true,
      data: {
        user: sessionUser ?? {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          isActive: user.isActive,
          roles: [],
          permissions: [],
        },
      },
      message: 'تم تسجيل الدخول بنجاح',
    })
    setAuthCookies(res, { accessToken, refreshToken })
    return res
  } catch (error) {
    console.error('[auth/login]', error)
    const mapped = toApiError(error)
    return NextResponse.json(mapped.body, { status: mapped.status })
  }
}
