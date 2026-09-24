import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'

import { getServerSession } from '@/server/auth/server-session'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect('/auth/login')

  const perms = session.permissions
  const hasTeam = Boolean(session.profile?.teamId)

  const can = (p: string) => perms.includes(p as any)

  const nav = hasTeam
    ? [
        { href: '/dashboard', label: 'Dashboard', show: can('dashboard.view') },
        { href: '/employees', label: 'Employees', show: can('employees.view') },
        { href: '/departments', label: 'Departments', show: can('departments.view') },
        { href: '/tasks', label: 'Tasks', show: can('tasks.view') },
        { href: '/members', label: 'Members', show: can('members.view') },
        { href: '/roles', label: 'Roles', show: can('roles.manage') },
        { href: '/settings', label: 'Settings', show: true },
        { href: '/notifications', label: 'Notifications', show: true },
        { href: '/profile', label: 'Profile', show: true },
      ].filter((i) => i.show)
    : [
        { href: '/create-team', label: 'Create Team', show: true },
        { href: '/notifications', label: 'Notifications', show: true },
        { href: '/profile', label: 'Profile', show: true },
      ]

  return (
    <div className="grid gap-6 md:grid-cols-[240px_1fr]">
      <aside className="rounded-lg border border-[#d0d7de] bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold">Team Management</div>
        <div className="mb-4 text-xs text-[#656d76]">
          {session.profile?.firstName || ''} {session.profile?.lastName || ''}
          {session.profile?.role ? ` · ${session.profile.role}` : ''}
        </div>
        <nav className="space-y-1">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="block rounded-md px-3 py-2 text-sm hover:bg-[#f6f8fa]">
              {item.label}
            </a>
          ))}
        </nav>
        <form className="mt-4" method="post" action="/api/auth/logout">
          <button className="w-full rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 py-2 text-sm font-semibold text-[#656d76] hover:bg-white" type="submit">
            Logout
          </button>
        </form>
      </aside>
      <section>{children}</section>
    </div>
  )
}

