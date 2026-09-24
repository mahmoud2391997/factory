import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/server/db'

export const runtime = 'nodejs'

const updateSchema = z.object({
  nameAr: z.string().trim().min(1).optional(),
  department: z.string().trim().min(1).optional(),
  jobTitle: z.string().trim().min(1).optional(),
  active: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const json = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'بيانات غير صحيحة', errors: parsed.error.issues }, { status: 400 })
  }

  const updated = await prisma.workforceEmployee.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json({ success: true, data: updated })
}

