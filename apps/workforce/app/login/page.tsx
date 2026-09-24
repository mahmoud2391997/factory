'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  return (
    <main className="mx-auto max-w-md rounded-lg border border-[#d0d7de] bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">تسجيل الدخول</h1>
      <p className="mt-2 text-sm text-[#656d76]">أدخل مفتاح النظام للوصول إلى إدارة الفرق والمهام.</p>

      <form
        className="mt-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault()
          setPending(true)
          setError('')
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ key }),
          })
          const json = (await res.json().catch(() => null)) as { success?: boolean; message?: string } | null
          setPending(false)
          if (!res.ok || !json?.success) {
            setError(json?.message || 'تعذر تسجيل الدخول')
            return
          }
          router.replace('/')
        }}
      >
        <label className="block text-sm font-medium">
          مفتاح النظام
          <input
            className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
          />
        </label>
        {error ? <div className="rounded-md border border-[#ff818266] bg-[#ffebe9] px-3 py-2 text-sm text-[#cf222e]">{error}</div> : null}
        <button
          className="inline-flex h-10 w-full items-center justify-center rounded-md border border-[#1f2328] bg-[#1f2328] px-4 text-sm font-semibold text-white disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? '...' : 'دخول'}
        </button>
      </form>
    </main>
  )
}

