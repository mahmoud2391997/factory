import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/server/db'
import { requirePermission } from '@/server/auth/require-permission'

export const runtime = 'nodejs'

const createSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  dueDate: z.string().trim().min(1).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
  departmentId: z.string().trim().min(1).optional(),
  assigneeId: z.string().trim().min(1).optional(),
})

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, 'tasks.view')
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
  const teamId = auth.user.profile!.teamId!

  const tasks = await prisma.workforceTask.findMany({
    where: { teamId },
    include: { department: true, assignee: true, creator: true },
    orderBy: [{ createdAt: 'desc' }],
  })
  return NextResponse.json({ success: true, data: tasks })
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, 'tasks.create')
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
  const teamId = auth.user.profile!.teamId!
  const creatorId = auth.user.profile!.id

  const json = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'بيانات غير صحيحة', errors: parsed.error.issues }, { status: 400 })
  }

  const dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null
  if (dueDate && Number.isNaN(dueDate.valueOf())) {
    return NextResponse.json({ success: false, message: 'dueDate غير صحيح' }, { status: 400 })
  }

  const created = await prisma.workforceTask.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      dueDate: dueDate ?? undefined,
      priority: parsed.data.priority ?? 'MEDIUM',
      status: parsed.data.status ?? 'TODO',
      teamId,
      departmentId: parsed.data.departmentId,
      assigneeId: parsed.data.assigneeId,
      createdById: creatorId,
    },
    include: { department: true, assignee: true, creator: true },
  })

  if (created.assigneeId && created.assigneeId !== creatorId) {
    await prisma.workforceNotification.create({
      data: {
        userId: created.assigneeId,
        teamId,
        type: 'task_assigned',
        title: 'Task Assigned',
        message: `A new task was assigned to you: ${created.title}`,
        data: { taskId: created.id, assignedBy: creatorId },
      },
    })
  }

  return NextResponse.json({ success: true, data: created })
}

