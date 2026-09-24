import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/server/db'

export const runtime = 'nodejs'

const updateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
  dueDate: z.string().trim().min(1).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  departmentId: z.string().trim().min(1).nullable().optional(),
  assigneeId: z.string().trim().min(1).nullable().optional(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const json = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'بيانات غير صحيحة', errors: parsed.error.issues }, { status: 400 })
  }

  const { requirePermission } = await import('@/server/auth/require-permission')
  const auth = await requirePermission(req, 'tasks.edit')
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
  const teamId = auth.user.profile!.teamId!
  const actorId = auth.user.profile!.id

  const dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined
  if (dueDate && Number.isNaN(dueDate.valueOf())) {
    return NextResponse.json({ success: false, message: 'dueDate غير صحيح' }, { status: 400 })
  }

  const existing = await prisma.workforceTask.findFirst({
    where: { id, teamId },
    select: { id: true, title: true, status: true, createdById: true, assigneeId: true },
  })
  if (!existing) return NextResponse.json({ success: false, message: 'غير موجود' }, { status: 404 })

  const updated = await prisma.workforceTask.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      dueDate: dueDate ?? undefined,
      priority: parsed.data.priority,
      departmentId: parsed.data.departmentId === undefined ? undefined : parsed.data.departmentId,
      assigneeId: parsed.data.assigneeId === undefined ? undefined : parsed.data.assigneeId,
    },
    include: { department: true, assignee: true, creator: true },
  })

  const recipients = new Set<string>()
  if (existing.createdById && existing.createdById !== actorId) recipients.add(existing.createdById)
  if (existing.assigneeId && existing.assigneeId !== actorId) recipients.add(existing.assigneeId)
  for (const userId of recipients) {
    const statusChanged = parsed.data.status && existing.status !== parsed.data.status
    await prisma.workforceNotification.create({
      data: {
        userId,
        teamId,
        type: statusChanged ? 'task_status_changed' : 'task_updated',
        title: statusChanged ? 'Task Status Updated' : 'Task Updated',
        message: statusChanged
          ? `Task "${existing.title}" moved to ${parsed.data.status}`
          : `Task "${existing.title}" was updated`,
        data: { taskId: id, changedBy: actorId, newStatus: parsed.data.status ?? null },
      },
    })
  }

  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { requirePermission } = await import('@/server/auth/require-permission')
  const auth = await requirePermission(req, 'tasks.delete')
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
  const teamId = auth.user.profile!.teamId!
  const actorId = auth.user.profile!.id

  const existing = await prisma.workforceTask.findFirst({
    where: { id, teamId },
    select: { id: true, title: true, createdById: true, assigneeId: true },
  })
  if (!existing) return NextResponse.json({ success: false, message: 'غير موجود' }, { status: 404 })

  await prisma.workforceTask.delete({ where: { id } })

  const recipients = new Set<string>()
  if (existing.createdById && existing.createdById !== actorId) recipients.add(existing.createdById)
  if (existing.assigneeId && existing.assigneeId !== actorId) recipients.add(existing.assigneeId)
  for (const userId of recipients) {
    await prisma.workforceNotification.create({
      data: {
        userId,
        teamId,
        type: 'task_deleted',
        title: 'Task Deleted',
        message: `Task "${existing.title}" was deleted`,
        data: { taskId: id, deletedBy: actorId },
      },
    })
  }

  return NextResponse.json({ success: true })
}

