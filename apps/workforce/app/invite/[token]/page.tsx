'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const token = useMemo(() => String(params?.token ?? ''), [params])

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  return (
    <main className="mx-auto max-w-md rounded-lg border border-[#d0d7de] bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Accept invitation</h1>
      <p className="mt-2 text-sm text-[#656d76]">Create your account to join the team.</p>

      <form
        className="mt-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault()
          setPending(true)
          setError('')
          const res = await fetch('/api/invitations/accept', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ token, firstName, lastName: lastName || undefined, password }),
          })
          const json = (await res.json().catch(() => null)) as { success?: boolean; message?: string } | null
          setPending(false)
          if (!res.ok || !json?.success) {
            setError(json?.message || 'تعذر قبول الدعوة')
            return
          }
          router.replace('/dashboard')
        }}
      >
        <label className="block text-sm font-medium">
          First name
          <input className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </label>
        <label className="block text-sm font-medium">
          Last name (optional)
          <input className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        </label>

        {error ? <div className="rounded-md border border-[#ff818266] bg-[#ffebe9] px-3 py-2 text-sm text-[#cf222e]">{error}</div> : null}
        <button className="inline-flex h-10 w-full items-center justify-center rounded-md border border-[#1f2328] bg-[#1f2328] px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">
          {pending ? '...' : 'Join team'}
        </button>
      </form>
    </main>
  )
}

