import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/server/db'

export const runtime = 'nodejs'

const updateSchema = z.object({
  departmentId: z.string().trim().min(1).nullable().optional(),
  position: z.string().trim().min(1).nullable().optional(),
  joinDate: z.string().trim().min(1).nullable().optional(),
  salary: z.union([z.number(), z.string().trim().min(1)]).nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']).optional(),
  managerId: z.string().trim().min(1).nullable().optional(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const json = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'بيانات غير صحيحة', errors: parsed.error.issues }, { status: 400 })
  }

  const auth = await import('@/server/auth/require-permission').then((m) => m.requirePermission(req, 'employees.edit'))
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
  const teamId = auth.user.profile!.teamId!

  const joinDate = parsed.data.joinDate ? new Date(parsed.data.joinDate) : parsed.data.joinDate === null ? null : undefined
  if (joinDate instanceof Date && Number.isNaN(joinDate.valueOf())) {
    return NextResponse.json({ success: false, message: 'joinDate غير صحيح' }, { status: 400 })
  }

  const existing = await prisma.workforceEmployee.findFirst({ where: { id, teamId } })
  if (!existing) return NextResponse.json({ success: false, message: 'غير موجود' }, { status: 404 })

  const salary =
    parsed.data.salary === undefined
      ? undefined
      : parsed.data.salary === null
        ? null
        : String(parsed.data.salary)

  const updated = await prisma.workforceEmployee.update({
    where: { id },
    data: {
      departmentId: parsed.data.departmentId === undefined ? undefined : parsed.data.departmentId,
      position: parsed.data.position === undefined ? undefined : parsed.data.position,
      joinDate: joinDate === undefined ? undefined : joinDate,
      salary,
      status: parsed.data.status,
      managerId: parsed.data.managerId === undefined ? undefined : parsed.data.managerId,
    },
    include: { profile: true, department: true, manager: true },
  })

  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { requirePermission } = await import('@/server/auth/require-permission')
  const auth = await requirePermission(req, 'employees.delete')
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
  const teamId = auth.user.profile!.teamId!

  const existing = await prisma.workforceEmployee.findFirst({ where: { id, teamId }, select: { id: true, profileId: true } })
  if (!existing) return NextResponse.json({ success: false, message: 'غير موجود' }, { status: 404 })

  await prisma.workforceEmployee.delete({ where: { id } })

  // Keep the profile record (it may represent a real user account).
  return NextResponse.json({ success: true })
}

