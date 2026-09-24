'use client'

import { useMemo, useState } from 'react'

type RoleOption = { name: string; label: string }

type Member = {
  id: string
  userId: string
  teamId: string
  role: string
  isActive: boolean
  createdAt: string
  user: {
    id: string
    email: string
    profile: { id: string; email: string; firstName: string | null; lastName: string | null; role: string; teamId: string | null } | null
  }
}

type Invitation = {
  id: string
  email: string
  role: string
  token: string
  expiresAt: string | null
  acceptedAt: string | null
  createdAt: string
  invitedBy: { id: string; email: string; firstName: string | null; lastName: string | null }
}

export function MembersContainer({
  initialMembers,
  initialInvitations,
  roles,
  permissions,
}: {
  initialMembers: Member[]
  initialInvitations: Invitation[]
  roles: RoleOption[]
  permissions: string[]
}) {
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [invitations, setInvitations] = useState<Invitation[]>(initialInvitations)
  const [inviteUrl, setInviteUrl] = useState<string>('')

  const canInvite = permissions.includes('members.invite')
  const canRemove = permissions.includes('members.remove')
  const canAssign = permissions.includes('members.assign_role')

  const roleOptions = useMemo(() => {
    const base = roles.map((r) => ({ value: r.name, label: `${r.label} (${r.name})` }))
    const uniq = new Map<string, { value: string; label: string }>()
    for (const o of base) uniq.set(o.value, o)
    return Array.from(uniq.values())
  }, [roles])

  async function refresh() {
    const res = await fetch('/api/members', { cache: 'no-store' })
    const json = (await res.json().catch(() => null)) as
      | { success?: boolean; data?: { members?: Member[]; invitations?: Invitation[]; roles?: RoleOption[] } }
      | null
    if (res.ok && json?.success) {
      setMembers(json.data?.members ?? [])
      setInvitations(json.data?.invitations ?? [])
    }
  }

  return (
    <div className="space-y-4">
      {canInvite ? (
        <InviteCard
          roleOptions={roleOptions}
          onInvited={async (url) => {
            setInviteUrl(url)
            await refresh()
          }}
        />
      ) : null}

      {inviteUrl ? (
        <div className="rounded-lg border border-[#0969da33] bg-[#ddf4ff] p-4 text-sm text-[#0969da] shadow-sm">
          <div className="font-semibold">Invite link</div>
          <div className="mt-1 break-all font-mono text-xs">{inviteUrl}</div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-[#d0d7de] bg-white shadow-sm">
        <table className="w-full text-right text-sm">
          <thead className="bg-[#f6f8fa] text-[#656d76]">
            <tr>
              <th className="px-3 py-2 font-medium">Member</th>
              <th className="px-3 py-2 font-medium">Role</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const profile = m.user.profile
              const display = profile
                ? (profile.firstName || profile.email) + (profile.lastName ? ` ${profile.lastName}` : '')
                : m.user.email
              return (
                <tr key={m.id} className="border-t border-[#d0d7de]">
                  <td className="px-3 py-2">
                    <div className="font-semibold">{display}</div>
                    <div className="text-xs text-[#656d76]">{m.user.email}</div>
                  </td>
                  <td className="px-3 py-2">
                    {canAssign ? (
                      <select
                        className="h-9 rounded-md border border-[#d0d7de] bg-white px-2 text-sm"
                        value={m.role}
                        onChange={async (e) => {
                          await fetch(`/api/members/${m.id}`, {
                            method: 'PATCH',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ role: e.target.value }),
                          })
                          await refresh()
                        }}
                      >
                        {roleOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.value}
                          </option>
                        ))}
                        {!roleOptions.some((o) => o.value === m.role) ? <option value={m.role}>{m.role}</option> : null}
                      </select>
                    ) : (
                      <span className="font-mono text-xs">{m.role}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{m.isActive ? <Badge label="ACTIVE" kind="good" /> : <Badge label="INACTIVE" kind="neutral" />}</td>
                  <td className="px-3 py-2">
                    {canRemove ? (
                      <button
                        className="rounded-md border border-[#d0d7de] bg-[#ffebe9] px-2 py-1 text-xs font-semibold text-[#cf222e]"
                        type="button"
                        onClick={async () => {
                          await fetch(`/api/members/${m.id}`, { method: 'DELETE' })
                          await refresh()
                        }}
                      >
                        Remove
                      </button>
                    ) : null}
                  </td>
                </tr>
              )
            })}
            {members.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-sm text-[#656d76]" colSpan={4}>
                  No members
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#d0d7de] bg-white shadow-sm">
        <div className="border-b border-[#d0d7de] bg-[#f6f8fa] px-3 py-2 text-sm font-semibold text-[#656d76]">Pending invitations</div>
        <div className="p-3">
          {invitations.length === 0 ? <div className="text-sm text-[#656d76]">No pending invitations</div> : null}
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div key={inv.id} className="rounded-lg border border-[#d0d7de] bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{inv.email}</div>
                    <div className="text-xs text-[#656d76]">
                      role: <span className="font-mono">{inv.role}</span>
                      {inv.expiresAt ? ` · expires: ${inv.expiresAt.slice(0, 10)}` : ''}
                    </div>
                  </div>
                  <button
                    className="rounded-md border border-[#0969da33] bg-[#ddf4ff] px-2 py-1 text-xs font-semibold text-[#0969da]"
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/invite/${inv.token}`
                      setInviteUrl(url)
                      navigator.clipboard?.writeText(url).catch(() => {})
                    }}
                  >
                    Copy invite link
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function InviteCard({ roleOptions, onInvited }: { roleOptions: Array<{ value: string; label: string }>; onInvited: (url: string) => void }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState(roleOptions[0]?.value ?? 'EMPLOYEE')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  return (
    <div className="rounded-lg border border-[#d0d7de] bg-white p-5 shadow-sm">
      <div className="text-lg font-semibold">Invite member</div>
      <form
        className="mt-4 grid gap-3 md:grid-cols-3"
        onSubmit={async (e) => {
          e.preventDefault()
          setPending(true)
          setError('')
          const res = await fetch('/api/members/invite', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, role }) })
          const json = (await res.json().catch(() => null)) as { success?: boolean; message?: string; data?: { inviteUrl?: string } } | null
          setPending(false)
          if (!res.ok || !json?.success) {
            setError(json?.message || 'تعذر إرسال الدعوة')
            return
          }
          setEmail('')
          onInvited(json?.data?.inviteUrl ?? '')
        }}
      >
        <label className="block text-sm font-medium md:col-span-2">
          Email
          <input className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block text-sm font-medium">
          Role
          <select className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] bg-white px-3 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
            {roleOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.value}
              </option>
            ))}
          </select>
        </label>
        {error ? <div className="md:col-span-3 rounded-md border border-[#ff818266] bg-[#ffebe9] px-3 py-2 text-sm text-[#cf222e]">{error}</div> : null}
        <button className="md:col-span-3 h-10 w-full rounded-md border border-[#1f2328] bg-[#1f2328] px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">
          {pending ? '...' : 'Send invite'}
        </button>
      </form>
    </div>
  )
}

function Badge({ label, kind }: { label: string; kind: 'good' | 'neutral' }) {
  const cls =
    kind === 'good'
      ? 'border-[#1f883d33] bg-[#dafbe1] text-[#1f883d]'
      : 'border-[#d0d7de] bg-[#f6f8fa] text-[#656d76]'
  return <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${cls}`}>{label}</span>
}

