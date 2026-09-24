import { NextResponse, type NextRequest } from 'next/server'

import { prisma } from '@/server/db'
import { getSessionUser } from '@/server/auth/session'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user?.profile) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  const rows = await prisma.workforceNotification.findMany({
    where: { userId: user.profile.id },
    orderBy: [{ createdAt: 'desc' }],
  })
  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user?.profile) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  const json = (await req.json().catch(() => null)) as { id?: string } | null
  const id = String(json?.id ?? '')
  if (!id) return NextResponse.json({ success: false, message: 'id مطلوب' }, { status: 400 })
  const existing = await prisma.workforceNotification.findFirst({ where: { id, userId: user.profile.id } })
  if (!existing) return NextResponse.json({ success: false, message: 'غير موجود' }, { status: 404 })
  const updated = await prisma.workforceNotification.update({ where: { id }, data: { read: true } })
  return NextResponse.json({ success: true, data: updated })
}

