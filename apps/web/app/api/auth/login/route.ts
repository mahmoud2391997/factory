import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { issueAccessToken, issueRefreshToken, setAuthCookies } from '@/server/auth/jwt'
import { getSessionUserById } from '@/server/auth/session'
import { getDemoSecrets, getDemoSessionUser, isDemoMode } from '@/server/demo'
import { assertAuthEnv, toApiError } from '@/server/env'
import { loginThrottleMessage, recordLoginFailure, recordLoginSuccess } from '@/server/auth/login-throttle'
import { createClient } from '@supabase/supabase-js'

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

    if (isDemoMode()) {
      const demo = getDemoSecrets()
      const demoEmails = new Set(['admin@factory.local'])
      if (demoEmails.has(email) && password === demo.password) {
        recordLoginSuccess(email, ip)
        const accessToken = await issueAccessToken({ sub: 'demo-admin-user', ver: 1 })
        const refreshToken = await issueRefreshToken({ sub: 'demo-admin-user', ver: 1 })
        const res = NextResponse.json({
          success: true,
          data: { user: getDemoSessionUser(), demoMode: true, storage: 'demo' },
          message: 'تم تسجيل الدخول',
        })
        setAuthCookies(res, { accessToken, refreshToken })
        return res
      }
    }
    const locked = loginThrottleMessage(email, ip)
    if (locked) {
      return NextResponse.json({ success: false, message: locked, code: 'LOGIN_LOCKED' }, { status: 429 })
    }

    const supabaseUrl = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    const supabaseKey =
      process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
      process.env.SUPABASE_ANON_KEY?.trim() ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

    // Production credentials are verified by Supabase Auth. The ERP document then
    // supplies the application's roles and permissions, keeping auth and business
    // data in the same Postgres-backed workflow.
    if (!isDemoMode() && supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error || !data.user) {
        recordLoginFailure(email, ip)
        return NextResponse.json({ success: false, message: 'بيانات الدخول غير صحيحة' }, { status: 401 })
      }
    }

    // ERP document store is preferred, but must not block Prisma-user login on remote
    // cold-start races / seed failures (those previously surfaced as AUTH_INTERNAL_ERROR).
    let storage: 'postgresql' | 'file' | undefined
    try {
      const loaded = await (await import('@/server/erp/store')).loadState()
      storage = loaded.storage
      const erpUser = loaded.state.users.find((item) => item.email.toLowerCase() === email && item.active)
      if (erpUser && (await bcrypt.compare(password, erpUser.passwordHash))) {
        recordLoginSuccess(email, ip)
        const ver = erpUser.tokenVersion ?? 1
        const accessToken = await issueAccessToken({ sub: erpUser.id, ver })
        const refreshToken = await issueRefreshToken({ sub: erpUser.id, ver })
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
      const message = error instanceof Error ? error.message : String(error)
      if (
        message.includes('ERP_NOT_BOOTSTRAPPED') ||
        message.includes('ERP_STATE_INVALID') ||
        message.includes('SCHEMA_MISSING') ||
        message.includes('DATABASE_UNAVAILABLE')
      ) {
        const mapped = toApiError(error)
        return NextResponse.json(mapped.body, { status: mapped.status })
      }
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

    recordLoginFailure(email, ip)
    return NextResponse.json({ success: false, message: 'بيانات الدخول غير صحيحة' }, { status: 401 })
  } catch (error) {
    console.error('[auth/login]', error)
    const mapped = toApiError(error)
    return NextResponse.json(mapped.body, { status: mapped.status })
  }
}
