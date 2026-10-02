import { NextResponse, type NextRequest } from 'next/server'
import { requirePermission } from '@/server/auth/require-auth'
import { getDemoWarehouses, isDemoMode } from '@/server/demo'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, ['warehouses.read', 'inventory.read'])
  if (!auth.ok) return auth.response
  return NextResponse.json({ success: true, data: { warehouses: getDemoWarehouses(), demoMode: isDemoMode() }, message: '' })
}
