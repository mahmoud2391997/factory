import { NextResponse, type NextRequest } from 'next/server'
import { createHash } from 'node:crypto'

import { publicState } from '@/lib/erp/domain/engine'
import { loadState, runCommand } from '@/server/erp/store'
import { isScaleBearerAuthorized, scaleReadingSchema } from '@/server/scale/ingest'
import { toApiError } from '@/server/env'

export const runtime = 'nodejs'

function response(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  const token = process.env.ERP_SCALE_INGEST_TOKEN?.trim()
  const userId = process.env.ERP_SCALE_USER_ID?.trim()
  if (!token || token.length < 32 || !userId) {
    return response(503, { success: false, message: 'تكامل الميزان غير مهيأ' })
  }
  if (!isScaleBearerAuthorized(req.headers.get('authorization'), token)) {
    return response(401, { success: false, message: 'غير مصرح' })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return response(400, { success: false, message: 'بيانات JSON غير صحيحة' })
  }
  const parsed = scaleReadingSchema.safeParse(body)
  if (!parsed.success) {
    return response(400, {
      success: false,
      message: 'بيانات قراءة الميزان غير صحيحة',
      errors: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    })
  }

  try {
    const loaded = await loadState()
    const user = loaded.state.users.find((item) => item.id === userId && item.active)
    if (!user || !loaded.state.rolePermissions[user.role]?.includes('scale.manage')) {
      return response(503, { success: false, message: 'مستخدم تكامل الميزان غير موجود أو لا يملك صلاحية الميزان' })
    }

    const result = await runCommand(
      user.id,
      'recordScaleReading',
      {
        eventId: parsed.data.eventId,
        materialId: parsed.data.materialId,
        productionOrderId: parsed.data.productionOrderId,
        actualQty: parsed.data.actualQty,
        scaleId: parsed.data.scaleId,
      },
      {
        idempotencyKey: `scale:${parsed.data.scaleId}:${parsed.data.eventId}:${createHash('sha256').update(JSON.stringify(parsed.data)).digest('hex')}`,
      },
    )
    if (!result.ok) return response(422, { success: false, message: result.error })
    return response(200, { success: true, message: result.message })
  } catch (error) {
    console.error('[scale/readings]', error)
    const mapped = toApiError(error)
    return response(mapped.status, mapped.body)
  }
}
