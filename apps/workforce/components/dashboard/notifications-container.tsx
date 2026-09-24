'use client'

import { useState } from 'react'

type Notification = {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  data: any
}

export function NotificationsContainer({ initial }: { initial: Notification[] }) {
  const [rows, setRows] = useState<Notification[]>(initial)

  async function markRead(id: string) {
    setRows((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    await fetch('/api/notifications', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) })
    const res = await fetch('/api/notifications', { cache: 'no-store' })
    const json = (await res.json().catch(() => null)) as { success?: boolean; data?: Notification[] } | null
    if (res.ok && json?.success) setRows(json.data ?? [])
  }

  const unread = rows.filter((r) => !r.read).length

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#d0d7de] bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold">Unread: {unread}</div>
      </div>

      <div className="space-y-2">
        {rows.map((n) => (
          <div key={n.id} className={`rounded-lg border border-[#d0d7de] bg-white p-4 shadow-sm ${n.read ? 'opacity-75' : ''}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{n.title}</div>
                <div className="mt-1 text-sm text-[#656d76]">{n.message}</div>
                <div className="mt-2 text-xs text-[#656d76]">
                  <span className="font-mono">{n.type}</span> · {n.createdAt.slice(0, 19).replace('T', ' ')}
                </div>
              </div>
              {!n.read ? (
                <button className="rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-2 py-1 text-xs font-semibold" type="button" onClick={() => markRead(n.id)}>
                  Mark read
                </button>
              ) : (
                <span className="inline-flex rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-2 py-1 text-xs font-semibold text-[#656d76]">Read</span>
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 ? <div className="rounded-lg border border-[#d0d7de] bg-white p-6 text-sm text-[#656d76] shadow-sm">No notifications</div> : null}
      </div>
    </div>
  )
}

