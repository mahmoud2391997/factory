import { NextResponse, type NextRequest } from 'next/server'

import { requirePermission } from '@/server/auth/require-auth'
import { getDemoWarehouses, isDemoMode } from '@/server/demo'
import { COLLECTIONS, getDb, type WarehouseLocationRow, type WarehouseRow } from '@/server/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, ['warehouses.read', 'inventory.read'])
  if (!auth.ok) return auth.response

  if (isDemoMode()) {
    return NextResponse.json({
      success: true,
      data: { warehouses: getDemoWarehouses(), demoMode: true },
      message: '',
    })
  }

  const db = await getDb()
  const [warehouseRows, locationRows] = await Promise.all([
    db.collection<WarehouseRow>(COLLECTIONS.warehouses).find({ isActive: true }).sort({ key: 1 }).toArray(),
    db
      .collection<WarehouseLocationRow>(COLLECTIONS.warehouseLocations)
      .find({ isActive: true })
      .sort({ code: 1 })
      .toArray(),
  ])

  const warehouses = warehouseRows.map((warehouse) => ({
    id: warehouse._id,
    key: warehouse.key,
    nameAr: warehouse.nameAr,
    isActive: warehouse.isActive,
    locations: locationRows
      .filter((location) => location.warehouseId === warehouse._id)
      .map((location) => ({ id: location._id, code: location.code, nameAr: location.nameAr })),
  }))

  return NextResponse.json({
    success: true,
    data: { warehouses, demoMode: false },
    message: '',
  })
}
