'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Factory, Loader2, Lock, Mail, XCircle } from 'lucide-react'

import { useAuth } from '@/components/providers/auth-provider'

type HealthData = {
  status: string
  databaseConfigured: boolean
  databaseEnvKey: string | null
  jwtConfigured: boolean
  databaseReachable: boolean
  bootstrapped: boolean
  userCount: number | null
  databaseError: string | null
}

type HealthResponse = {
  success: boolean
  data?: HealthData
  message?: string
}

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
    if (!loading && user) router.replace('/')
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

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    const result = await login(email.trim(), password)
    setSubmitting(false)
    if (result.ok) {
      router.replace('/')
      return
    }
    setMessage(result.message)
  }

  if (loading || user) {
    return (
      <main dir="rtl" className="grid min-h-screen place-items-center bg-[#f6f8f7] text-[#152925]">
        <div className="flex items-center gap-3 text-sm text-[#53655e]">
          <Loader2 className="animate-spin" size={18} />
          جاري التحميل...
        </div>
      </main>
    )
  }

  const setupBlocked = health ? !health.databaseConfigured || !health.jwtConfigured || !health.databaseReachable : false

  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden bg-[#0f2f2a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(214,173,97,0.22),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(29,127,114,0.35),transparent_40%),linear-gradient(160deg,#123c35_0%,#0b2420_55%,#152925_100%)]" />
      <div className="pointer-events-none absolute -left-24 top-24 size-72 rounded-full bg-[#d6ad61]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 size-80 rounded-full bg-[#1d7f72]/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-10">
        <div className="w-full rounded-3xl border border-white/10 bg-white/95 p-7 text-[#152925] shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="mb-7 flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-[#123c35] text-[#d6ad61]">
              <Factory size={24} strokeWidth={2.4} />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-[#123c35]">مزارع الخليج</div>
              <div className="text-xs text-[#71817c]">تسجيل الدخول لنظام إدارة المصنع</div>
            </div>
          </div>

          {!healthLoading && health && setupBlocked ? (
            <div className="mb-5 rounded-2xl border border-[#f0d0c8] bg-[#fff8f5] p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-[#ad5e46]">
                <AlertTriangle size={15} />
                إعداد السيرفر غير مكتمل — الدخول لن يعمل قبل هذه الخطوات
              </div>
              <div className="space-y-2">
                <StatusRow
                  ok={health.databaseConfigured}
                  label="متغير قاعدة البيانات"
                  detail={
                    health.databaseConfigured
                      ? `موجود: ${health.databaseEnvKey}`
                      : 'أضف DATABASE_URL أو اربط Vercel Postgres (يعطي POSTGRES_URL)'
                  }
                />
                <StatusRow
                  ok={health.jwtConfigured}
                  label="JWT_SECRET"
                  detail={health.jwtConfigured ? 'موجود' : 'أضفه من Vercel → Settings → Environment Variables'}
                />
                <StatusRow
                  ok={health.databaseReachable}
                  label="الاتصال بقاعدة البيانات"
                  detail={
                    health.databaseReachable
                      ? 'متصل'
                      : health.databaseError ?? 'تحقق من الرابط أو نفّذ Redeploy بعد إضافة المتغيرات'
                  }
                />
                <StatusRow
                  ok={health.bootstrapped}
                  label="تهيئة أول مستخدم (bootstrap)"
                  detail={
                    health.bootstrapped
                      ? `موجود (${health.userCount} مستخدم)`
                      : 'بعد تجهيز الـ DB نفّذ bootstrap مرة واحدة (انظر README)'
                  }
                />
              </div>
              <ol className="mt-3 list-decimal space-y-1 pr-4 text-[11px] leading-5 text-[#53655e]">
                <li>Vercel → مشروعك → Storage → Postgres → Create / Connect</li>
                <li>أو Environment Variables → أضف DATABASE_URL + JWT_SECRET + SETUP_TOKEN</li>
                <li>Redeploy للمشروع</li>
                <li>حدّث هذه الصفحة وتأكد أن العلامات خضراء</li>
              </ol>
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block space-y-2 text-sm">
              <span className="font-semibold text-[#30453d]">البريد الإلكتروني</span>
              <div className="relative">
                <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa9a3]" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@factory.local"
                  className="h-11 w-full rounded-xl border border-[#dfe7e3] bg-white pr-10 pl-3 text-sm outline-none transition focus:border-[#1d7f72] focus:ring-2 focus:ring-[#1d7f72]/15"
                />
              </div>
            </label>

            <label className="block space-y-2 text-sm">
              <span className="font-semibold text-[#30453d]">كلمة المرور</span>
              <div className="relative">
                <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa9a3]" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-[#dfe7e3] bg-white pr-10 pl-3 text-sm outline-none transition focus:border-[#1d7f72] focus:ring-2 focus:ring-[#1d7f72]/15"
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
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#123c35] text-sm font-bold text-white transition hover:bg-[#1d594d] disabled:opacity-60"
            >
              {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
              دخول النظام
            </button>
          </form>

          <p className="mt-5 text-center text-[11px] leading-5 text-[#899892]">
            الجلسة محمية بصلاحيات الأدوار. بعد الدخول تظهر فقط الشاشات المسموح بها لحسابك.
          </p>
        </div>
      </div>
    </main>
  )
}
