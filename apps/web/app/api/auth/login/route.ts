import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { issueAccessToken, issueRefreshToken, setAuthCookies } from '@/server/auth/jwt'
import { getSessionUserById } from '@/server/auth/session'
import { isDemoMode } from '@/server/demo'
import { assertAuthEnv, toApiError } from '@/server/env'
import { loginThrottleMessage, recordLoginFailure, recordLoginSuccess } from '@/server/auth/login-throttle'
import { loadState } from '@/server/erp/store'

function clientIp(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}

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

    const email = parsed.data.email.toLowerCase().trim()
    const password = parsed.data.password
    const ip = clientIp(req)
    const locked = loginThrottleMessage(email, ip)
    if (locked) {
      return NextResponse.json({ success: false, message: locked, code: 'LOGIN_LOCKED' }, { status: 429 })
    }

    // ERP document store is preferred, but must not block Prisma-user login on remote
    // cold-start races / seed failures (those previously surfaced as AUTH_INTERNAL_ERROR).
    let storage: 'postgres' | 'file' | undefined
    try {
      const loaded = await loadState()
      storage = loaded.storage
      const erpUser = loaded.state.users.find((item) => item.email.toLowerCase() === email && item.active)
      if (erpUser && (await bcrypt.compare(password, erpUser.passwordHash))) {
        recordLoginSuccess(email, ip)
        const accessToken = await issueAccessToken({ sub: erpUser.id })
        const refreshToken = await issueRefreshToken({ sub: erpUser.id })
        const sessionUser = await getSessionUserById(erpUser.id)
        const res = NextResponse.json({
          success: true,
          data: { user: sessionUser, demoMode: isDemoMode(), storage },
          message: isDemoMode() ? 'تم تسجيل الدخول' : 'تم تسجيل الدخول بنجاح',
        })
        setAuthCookies(res, { accessToken, refreshToken })
        return res
      }
    } catch (error) {
      console.error('[auth/login] loadState', error)
    }

    if (isDemoMode()) {
      recordLoginFailure(email, ip)
      return NextResponse.json(
        {
          success: false,
          message: 'بيانات الدخول غير صحيحة. الحسابات التجريبية: gm / accounts / ops @factory.local وكلمة المرور Admin123!',
          code: 'DEMO_INVALID_CREDENTIALS',
        },
        { status: 401 },
      )
    }

    const { prisma } = await import('@/server/db')
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) {
      recordLoginFailure(email, ip)
      return NextResponse.json({ success: false, message: 'بيانات الدخول غير صحيحة' }, { status: 401 })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      recordLoginFailure(email, ip)
      return NextResponse.json({ success: false, message: 'بيانات الدخول غير صحيحة' }, { status: 401 })
    }
    recordLoginSuccess(email, ip)

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
          mustChangePassword: false,
        },
        demoMode: false,
        storage,
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
