import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/server/db'
import { requirePermission } from '@/server/auth/require-permission'

export const runtime = 'nodejs'

const createSchema = z.object({
  name: z.string().trim().min(1),
  icon: z.string().trim().min(1).optional(),
  managerId: z.string().trim().min(1).optional(),
})

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, 'departments.view')
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
  const teamId = auth.user.profile!.teamId!

  const departments = await prisma.workforceDepartment.findMany({
    where: { teamId },
    include: { manager: true },
    orderBy: [{ createdAt: 'desc' }],
  })
  return NextResponse.json({ success: true, data: departments })
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, 'departments.create')
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
  const teamId = auth.user.profile!.teamId!

  const json = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'بيانات غير صحيحة', errors: parsed.error.issues }, { status: 400 })
  }

  const created = await prisma.workforceDepartment.create({
    data: { teamId, name: parsed.data.name, icon: parsed.data.icon, managerId: parsed.data.managerId },
    include: { manager: true },
  })
  return NextResponse.json({ success: true, data: created })
}

