import { getServerSession } from '@/server/auth/server-session'
import { prisma } from '@/server/db'
import { NotificationsContainer } from '@/components/dashboard/notifications-container'

export default async function NotificationsPage() {
  const session = await getServerSession()
  const profileId = session?.profile?.id ?? null

  if (!profileId) {
    return (
      <main className="rounded-lg border border-[#d0d7de] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Notifications</h1>
        <p className="mt-2 text-sm text-[#656d76]">غير مصرح.</p>
      </main>
    )
  }

  const rows = await prisma.workforceNotification.findMany({
    where: { userId: profileId },
    orderBy: [{ createdAt: 'desc' }],
  })

  return (
    <main className="space-y-4">
      <div className="rounded-lg border border-[#d0d7de] bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Notifications</h1>
        <p className="mt-2 text-sm text-[#656d76]">آخر التنبيهات.</p>
      </div>
      <NotificationsContainer initial={rows as any} />
    </main>
  )
}

