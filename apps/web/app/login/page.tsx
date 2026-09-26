'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Factory, Info, Loader2, Lock, Mail, XCircle } from 'lucide-react'

import { useAuth } from '@/components/providers/auth-provider'

type HealthData = {
  status: string
  demoMode?: boolean
  databaseConfigured: boolean
  databaseEnvKey: string | null
  jwtConfigured: boolean
  databaseReachable: boolean
  bootstrapped: boolean
  databaseError: string | null
  demoCredentials?: { email: string; password: string } | null
}

type HealthResponse = {
  success: boolean
  data?: HealthData
  message?: string
}

const DEMO_PASSWORD = 'Admin123!'

const DEMO_LOGINS = [
  { email: 'gm@factory.local', label: 'المدير العام' },
  { email: 'accounts@factory.local', label: 'المحاسب والموارد البشرية' },
  { email: 'ops@factory.local', label: 'المستودع والإنتاج والمبيعات' },
  { email: 'admin@factory.local', label: 'مدير النظام' },
] as const

function StatusRow({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <div className="flex items-start gap-2 text-[11px] leading-5">
      {ok ? (
        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#19725f]" />
      ) : (
        <XCircle size={14} className="mt-0.5 shrink-0 text-[#ad5e46]" />
      )}
      <div>
        <div className={`font-semibold ${ok ? 'text-[#19725f]' : 'text-[#ad5e46]'}`}>{label}</div>
        {detail ? <div className="text-[#71817c]">{detail}</div> : null}
      </div>
    </div>
  )
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
        if (!cancelled) {
          setHealth(json.data ?? null)
          if (json.data?.demoMode && json.data.demoCredentials) {
            setEmail(json.data.demoCredentials.email)
            setPassword(json.data.demoCredentials.password)
          }
        }
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

  const signIn = async (account: string, secret: string) => {
    setEmail(account)
    setPassword(secret)
    setSubmitting(true)
    setMessage('')
    const result = await login(account.trim(), secret)
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

  const demoMode = Boolean(health?.demoMode)
  const setupBlocked =
    !demoMode && health
      ? !health.databaseConfigured || !health.jwtConfigured || !health.databaseReachable || !health.bootstrapped
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

          <div className="mb-5 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#1f1f1f]">
              <Info size={15} />
              {demoMode ? 'وضع تجريبي نشط (بدون قاعدة بيانات)' : 'دخول جاهز للعرض'}
            </div>
            <p className="text-[13px] leading-5 text-[#6b7280]">اضغط الحساب لكتابة البريد وكلمة المرور والدخول مباشرة. كلمة المرور: {DEMO_PASSWORD}</p>
            <div className="mt-3 grid gap-2">
              {DEMO_LOGINS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  disabled={submitting || setupBlocked}
                  onClick={() => signIn(account.email, DEMO_PASSWORD)}
                  className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-right text-[13px] font-medium text-[#1f1f1f] hover:bg-neutral-200/50 disabled:opacity-60"
                >
                  {account.label}
                  <span className="mt-0.5 block font-normal text-[#6b7280]">{account.email}</span>
                </button>
              ))}
            </div>
          </div>

          {!healthLoading && health && setupBlocked ? (
            <div className="mb-5 rounded-2xl border border-[#f0d0c8] bg-[#fff8f5] p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-[#ad5e46]">
                <AlertTriangle size={15} />
                إعداد السيرفر غير مكتمل
              </div>
              <div className="space-y-2">
                <StatusRow
                  ok={health.bootstrapped}
                  label="تهيئة النظام"
                  detail={health.bootstrapped ? 'مكتمل' : 'نفّذ /api/setup/bootstrap مرة واحدة (مع x-setup-token) لإنشاء أول مستخدم'}
                />
                <StatusRow
                  ok={health.databaseConfigured}
                  label="متغير قاعدة البيانات"
                  detail={
                    health.databaseConfigured
                      ? `موجود: ${health.databaseEnvKey}`
                      : 'أضف DATABASE_URL أو اربط Vercel Postgres'
                  }
                />
                <StatusRow ok={health.jwtConfigured} label="JWT_SECRET" detail={health.jwtConfigured ? 'موجود' : 'ناقص'} />
                <StatusRow
                  ok={health.databaseReachable}
                  label="الاتصال بقاعدة البيانات"
                  detail={health.databaseReachable ? 'متصل' : health.databaseError ?? 'غير متصل'}
                />
              </div>
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
          </form>

          <p className="mt-5 text-center text-[13px] leading-5 text-[#6b7280]">
            {demoMode
              ? 'وضع تجريبي لمصنع الأعلاف — البيانات محلية حتى تربط قاعدة البيانات على السيرفر.'
              : 'نظام مصنع محمي بالصلاحيات. بعد الدخول تظهر فقط الشاشات المسموح بها لحسابك.'}
          </p>
        </div>
      </div>
    </main>
  )
}
