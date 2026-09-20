import { NextResponse, type NextRequest } from 'next/server'

import { requirePermission } from '@/server/auth/require-auth'
import { prisma } from '@/server/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, ['warehouses.read', 'inventory.read'])
  if (!auth.ok) return auth.response

  const warehouses = await prisma.warehouse.findMany({
    where: { isActive: true },
    orderBy: { key: 'asc' },
    select: {
      id: true,
      key: true,
      nameAr: true,
      isActive: true,
      locations: {
        where: { isActive: true },
        orderBy: { code: 'asc' },
        select: { id: true, code: true, nameAr: true },
      },
    },
  })

  return NextResponse.json({
    success: true,
    data: { warehouses },
    message: '',
  })
}
