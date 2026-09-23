'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Lock } from 'lucide-react'

import { useAuth } from '@/components/providers/auth-provider'

export default function ChangePasswordPage() {
  const router = useRouter()
  const { user, loading, refresh, logout } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) router.replace('/login')
    else if (!user.mustChangePassword) router.replace('/')
  }, [loading, user, router])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return
    if (password.length < 8) {
      setMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      return
    }
    if (password !== confirm) {
      setMessage('كلمتا المرور غير متطابقتين')
      return
    }
    setPending(true)
    setMessage('')
    try {
      const response = await fetch('/api/erp', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'setUserPassword', input: { userId: user.id, password } }),
      })
      const json = (await response.json()) as { success?: boolean; message?: string }
      if (!response.ok || !json.success) {
        setMessage(json.message || 'تعذر تحديث كلمة المرور')
        return
      }
      await refresh()
      router.replace('/')
    } finally {
      setPending(false)
    }
  }

  if (loading || !user) {
    return (
      <main dir="rtl" className="grid min-h-screen place-items-center bg-[#f9fafb] text-[#1f1f1f]">
        <div className="flex items-center gap-3 text-sm text-[#6b7280]">
          <Loader2 className="animate-spin" size={18} />
          جاري التحميل...
        </div>
      </main>
    )
  }

  return (
    <main dir="rtl" className="grid min-h-screen place-items-center bg-[#f9fafb] px-5 text-[#1f1f1f]">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-[12px] border border-[#e5e7eb] bg-white p-7 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid size-10 place-items-center rounded-lg bg-[#1f1f1f] text-white">
            <Lock size={18} />
          </div>
          <h1 className="text-xl font-bold">تعيين كلمة مرور جديدة</h1>
          <p className="mt-2 text-sm text-[#6b7280]">يجب تغيير كلمة المرور قبل فتح بقية النظام.</p>
        </div>
        <label className="mb-3 block text-sm">
          <span className="mb-1 block text-[#6b7280]">كلمة المرور الجديدة</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-lg border border-[#e5e7eb] px-3 outline-none focus:border-[#1f1f1f]"
            required
          />
        </label>
        <label className="mb-4 block text-sm">
          <span className="mb-1 block text-[#6b7280]">تأكيد كلمة المرور</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className="h-11 w-full rounded-lg border border-[#e5e7eb] px-3 outline-none focus:border-[#1f1f1f]"
            required
          />
        </label>
        {message ? <p className="mb-4 text-sm text-[#ad5e46]">{message}</p> : null}
        <button type="submit" disabled={pending} className="h-11 w-full rounded-lg bg-[#1f1f1f] text-sm font-semibold text-white disabled:opacity-60">
          {pending ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}
        </button>
        <button type="button" className="mt-3 h-11 w-full text-sm text-[#6b7280]" onClick={() => logout()}>
          تسجيل الخروج
        </button>
      </form>
    </main>
  )
}
