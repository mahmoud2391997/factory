import { NextResponse, type NextRequest } from 'next/server'

import { canViewRecallReport, recallReport } from '@/lib/erp/domain/reports'
import { getSessionUser } from '@/server/auth/session'
import { loadState } from '@/server/erp/store'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  if (!canViewRecallReport(user.permissions)) {
    return NextResponse.json({ success: false, message: 'ليست لديك صلاحية عرض تقرير الاستدعاء' }, { status: 403 })
  }

  const { state } = await loadState()
  try {
    const report = recallReport(state, {
      lotNo: request.nextUrl.searchParams.get('lotNo') || undefined,
      materialId: request.nextUrl.searchParams.get('materialId') || undefined,
      batchNo: request.nextUrl.searchParams.get('batchNo') || undefined,
    })
    return NextResponse.json({ success: true, data: { company: state.company, report } })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'تعذر إعداد تقرير الاستدعاء',
    }, { status: 400 })
  }
}
