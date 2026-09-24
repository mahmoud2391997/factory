import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/server/db'
import { requirePermission } from '@/server/auth/require-permission'

export const runtime = 'nodejs'

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  icon: z.string().trim().min(1).nullable().optional(),
  managerId: z.string().trim().min(1).nullable().optional(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, 'departments.edit')
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
  const teamId = auth.user.profile!.teamId!

  const { id } = await ctx.params
  const json = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ success: false, message: 'بيانات غير صحيحة', errors: parsed.error.issues }, { status: 400 })

  const existing = await prisma.workforceDepartment.findFirst({ where: { id, teamId }, select: { id: true } })
  if (!existing) return NextResponse.json({ success: false, message: 'غير موجود' }, { status: 404 })

  const updated = await prisma.workforceDepartment.update({
    where: { id },
    data: {
      name: parsed.data.name,
      icon: parsed.data.icon === undefined ? undefined : parsed.data.icon,
      managerId: parsed.data.managerId === undefined ? undefined : parsed.data.managerId,
    },
    include: { manager: true },
  })
  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, 'departments.delete')
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
  const teamId = auth.user.profile!.teamId!

  const { id } = await ctx.params
  const existing = await prisma.workforceDepartment.findFirst({ where: { id, teamId }, select: { id: true } })
  if (!existing) return NextResponse.json({ success: false, message: 'غير موجود' }, { status: 404 })

  await prisma.workforceDepartment.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

