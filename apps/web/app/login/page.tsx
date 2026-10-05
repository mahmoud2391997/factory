'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Factory, Loader2, Lock, Mail, XCircle } from 'lucide-react'

import { useAuth } from '@/components/providers/auth-provider'

type HealthData = {
  status: 'ok' | 'degraded' | 'demo'
  bootstrapped: boolean
  demoMode: boolean
  demoCredentials?: { email: string; password: string } | null
}

type HealthResponse = {
  success: boolean
  data?: HealthData
  message?: string
}

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [health, setHealth] = useState<HealthData | null>(null)
  const [healthLoading, setHealthLoading] = useState(true)

  useEffect(() => {
    if (!loading && user) router.replace(user.mustChangePassword ? '/account/password' : '/')
  }, [loading, user, router])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setHealthLoading(true)
      try {
        const res = await fetch('/api/health', { credentials: 'include' })
        const json = (await res.json()) as HealthResponse
        if (!cancelled) setHealth(json.data ?? null)
      } catch {
        if (!cancelled) setHealth(null)
      } finally {
        if (!cancelled) setHealthLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = async (account: string, secret: string, demo = false) => {
    setEmail(account)
    setPassword(secret)
    setSubmitting(true)
    setMessage('')
    const result = await login(account.trim(), secret, demo)
    setSubmitting(false)
    if (result.ok) {
      router.replace(result.mustChangePassword ? '/account/password' : '/')
      return
    }
    setMessage(result.message)
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    await signIn(email, password)
  }

  if (loading || user) {
    return (
      <main dir="rtl" className="grid min-h-screen place-items-center bg-[#f9fafb] text-[#1f1f1f]">
        <div className="flex items-center gap-3 text-sm text-[#6b7280]">
          <Loader2 className="animate-spin" size={18} />
          جاري التحميل...
        </div>
      </main>
    )
  }

  const setupBlocked = health
    ? !health.demoMode && (health.status !== 'ok' || !health.bootstrapped)
    : false

  return (
    <main dir="rtl" className="min-h-screen bg-[#f9fafb] text-[#1f1f1f]">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-10">
        <div className="w-full rounded-[12px] border border-[#e5e7eb] bg-white p-7 shadow-sm">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 grid size-10 place-items-center rounded-lg bg-[#1f1f1f] text-white">
              <Factory size={18} strokeWidth={2.4} />
            </div>
            <div className="text-2xl font-semibold tracking-tight text-[#1f1f1f]">مصنع الخليج للأعلاف</div>
            <div className="mt-1.5 text-sm font-medium text-[#6b7280]">نظام إدارة المصنع — تسجيل الدخول</div>
          </div>

          {!healthLoading && health && setupBlocked ? (
            <div className="mb-5 rounded-2xl border border-[#f0d0c8] bg-[#fff8f5] p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#ad5e46]">
                <AlertTriangle size={15} />
                الخدمة غير جاهزة للتشغيل
              </div>
              <p className="text-xs text-[#71817c]">
                النظام في وضع الإنتاج ولم تكتمل تهيئة قاعدة البيانات بعد. يرجى تهيئة النظام والتحقق من إعدادات الاتصال.
              </p>
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block space-y-2 text-sm">
              <span className="font-medium text-[#1f1f1f]">البريد الإلكتروني</span>
              <div className="relative">
                <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa9a3]" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@factory.local"
                  className="h-10 w-full rounded-md border border-[#e5e7eb] bg-white pr-10 pl-3 text-sm outline-none transition focus:border-[#1f1f1f] focus:ring-2 focus:ring-[#1f1f1f]/10"
                />
              </div>
            </label>

            <label className="block space-y-2 text-sm">
              <span className="font-medium text-[#1f1f1f]">كلمة المرور</span>
              <div className="relative">
                <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa9a3]" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 w-full rounded-md border border-[#e5e7eb] bg-white pr-10 pl-3 text-sm outline-none transition focus:border-[#1f1f1f] focus:ring-2 focus:ring-[#1f1f1f]/10"
                />
              </div>
            </label>

            {message ? (
              <div role="alert" className="rounded-xl border border-[#f0d0c8] bg-[#fff5f2] px-3 py-2 text-xs font-semibold text-[#ad5e46]">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting || setupBlocked}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#1f1f1f] text-sm font-medium text-white transition hover:bg-[#1f1f1f]/90 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
              دخول النظام
            </button>

            {!healthLoading && health?.demoMode ? (
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  signIn(
                    health.demoCredentials?.email ?? 'admin@factory.local',
                    health.demoCredentials?.password ?? 'Admin123!',
                    true,
                  )
                }
                className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#19725f] bg-[#f0faf7] text-sm font-semibold text-[#19725f] transition hover:bg-[#e3f5ef] disabled:opacity-60"
              >
                {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
                دخول تجريبي ببيانات وهمية
              </button>
            ) : null}
          </form>

          <p className="mt-5 text-center text-[13px] leading-5 text-[#6b7280]">
            نظام مصنع محمي بالصلاحيات. بعد الدخول تظهر فقط الشاشات المسموح بها لحسابك.
          </p>
        </div>
      </div>
    </main>
  )
}
