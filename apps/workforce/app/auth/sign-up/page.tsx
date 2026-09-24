'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  return (
    <main className="mx-auto max-w-md rounded-lg border border-[#d0d7de] bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">إنشاء حساب</h1>
      <p className="mt-2 text-sm text-[#656d76]">أنشئ حساباً ثم قم بإنشاء فريق أو قبول دعوة.</p>

      <form
        className="mt-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault()
          setPending(true)
          setError('')
          const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ firstName, lastName, email, password }),
          })
          const json = (await res.json().catch(() => null)) as { success?: boolean; message?: string } | null
          setPending(false)
          if (!res.ok || !json?.success) {
            setError(json?.message || 'تعذر إنشاء الحساب')
            return
          }
          router.replace('/auth/create-team')
        }}
      >
        <label className="block text-sm font-medium">
          الاسم الأول
          <input className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">
          الاسم الأخير
          <input className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">
          البريد
          <input className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block text-sm font-medium">
          كلمة المرور (8 أحرف على الأقل)
          <input className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </label>
        {error ? <div className="rounded-md border border-[#ff818266] bg-[#ffebe9] px-3 py-2 text-sm text-[#cf222e]">{error}</div> : null}
        <button className="inline-flex h-10 w-full items-center justify-center rounded-md border border-[#1f2328] bg-[#1f2328] px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">
          {pending ? '...' : 'إنشاء'}
        </button>
      </form>

      <p className="mt-4 text-sm text-[#656d76]">
        لديك حساب؟ <a className="text-[#0969da]" href="/auth/login">دخول</a>
      </p>
    </main>
  )
}

