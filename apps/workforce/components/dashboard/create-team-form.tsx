'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CreateTeamForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  return (
    <div className="mx-auto max-w-xl rounded-lg border border-[#d0d7de] bg-white p-6 shadow-sm">
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault()
          setPending(true)
          setError('')
          const res = await fetch('/api/team', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name }),
          })
          const json = (await res.json().catch(() => null)) as { success?: boolean; message?: string } | null
          setPending(false)
          if (!res.ok || !json?.success) {
            setError(json?.message || 'تعذر إنشاء الفريق')
            return
          }
          router.replace('/dashboard')
        }}
      >
        <label className="block text-sm font-medium">
          Team name
          <input className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        {error ? <div className="rounded-md border border-[#ff818266] bg-[#ffebe9] px-3 py-2 text-sm text-[#cf222e]">{error}</div> : null}
        <button className="h-10 w-full rounded-md border border-[#1f2328] bg-[#1f2328] px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">
          {pending ? '...' : 'Create'}
        </button>
      </form>
    </div>
  )
}

