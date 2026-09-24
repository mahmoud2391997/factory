import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/server/db'
import { requirePermission } from '@/server/auth/require-permission'

export const runtime = 'nodejs'

const createSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1).optional(),
  role: z.string().trim().min(1).optional(),
  departmentId: z.string().trim().min(1).optional(),
  position: z.string().trim().min(1).optional(),
  joinDate: z.string().trim().min(1).optional(),
  salary: z.union([z.number(), z.string().trim().min(1)]).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']).optional(),
  managerId: z.string().trim().min(1).optional(),
})

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, 'employees.view')
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
  const teamId = auth.user.profile!.teamId!

  const employees = await prisma.workforceEmployee.findMany({
    where: { teamId },
    include: { profile: true, department: true, manager: true },
    orderBy: [{ createdAt: 'desc' }],
  })
  return NextResponse.json({ success: true, data: employees })
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, 'employees.create')
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
  const teamId = auth.user.profile!.teamId!

  const json = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'بيانات غير صحيحة', errors: parsed.error.issues }, { status: 400 })
  }

  const joinDate = parsed.data.joinDate ? new Date(parsed.data.joinDate) : undefined
  if (joinDate && Number.isNaN(joinDate.valueOf())) {
    return NextResponse.json({ success: false, message: 'joinDate غير صحيح' }, { status: 400 })
  }

  const salary = parsed.data.salary === undefined ? undefined : String(parsed.data.salary)

  const email = parsed.data.email.toLowerCase().trim()
  const profile =
    (await prisma.workforceProfile.findUnique({ where: { email } })) ??
    (await prisma.workforceProfile.create({
      data: {
        email,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName ?? null,
        role: parsed.data.role ?? 'EMPLOYEE',
        teamId,
      },
    }))

  // Ensure profile is linked to this team for filtering.
  if (profile.teamId !== teamId) {
    await prisma.workforceProfile.update({ where: { id: profile.id }, data: { teamId } })
  }

  const created = await prisma.workforceEmployee.create({
    data: {
      teamId,
      profileId: profile.id,
      departmentId: parsed.data.departmentId,
      position: parsed.data.position,
      joinDate,
      salary,
      status: parsed.data.status ?? 'ACTIVE',
      managerId: parsed.data.managerId,
    },
    include: { profile: true, department: true, manager: true },
  })

  return NextResponse.json({ success: true, data: created })
}

