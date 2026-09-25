import { NextResponse, type NextRequest } from 'next/server'

import { getSessionUser } from '@/server/auth/session'
import { loadState, runCommand } from '@/server/erp/store'
import { publicState } from '@/lib/erp/domain/engine'

export const runtime = 'nodejs'

const ALLOWED_ACTIONS = new Set([
  'createMaterial', 'createProduct', 'createSupplier', 'createCustomer', 'createEmployee', 'createRecipe',
  'updateCompany', 'fundBank', 'createPurchaseOrder', 'decidePurchaseOrder', 'receiveGoods', 'transferStock',
  'requestAdjustment', 'decideAdjustment', 'createProductionOrder', 'completeProduction', 'createInvoice',
  'confirmInvoice', 'recordPayment', 'createWithdrawal', 'createExpense', 'decideExpense', 'recordAttendance',
  'importAttendance', 'createPayroll', 'decidePayroll', 'payPayroll', 'markNotificationRead', 'scanBarcode',
  'setRolePermissions', 'setUserPassword', 'archiveHistory',
])

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  try {
    const loaded = await loadState()
    return NextResponse.json({
      success: true,
      data: { state: publicState(loaded.state, user.permissions), storage: loaded.storage },
    })
  } catch (error) {
    console.error('[erp/get]', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'تعذر قراءة البيانات' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  const body = (await req.json().catch(() => null)) as { action?: string; input?: Record<string, unknown> } | null
  if (!body?.action) return NextResponse.json({ success: false, message: 'الإجراء مطلوب' }, { status: 400 })
  if (!ALLOWED_ACTIONS.has(body.action)) {
    return NextResponse.json({ success: false, message: 'إجراء غير معروف' }, { status: 400 })
  }
  try {
    const result = await runCommand(user.id, body.action, body.input ?? {})
    if (!result.ok) return NextResponse.json({ success: false, message: result.error }, { status: 400 })
    return NextResponse.json({
      success: true,
      message: result.message,
      data: { state: result.state, storage: result.storage, extra: result.extra ?? null },
    })
  } catch (error) {
    console.error('[erp/post]', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'تعذر تنفيذ العملية' },
      { status: 500 },
    )
  }
}
