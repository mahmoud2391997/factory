import { NextResponse, type NextRequest } from 'next/server'

import { getSessionUser } from '@/server/auth/session'
import { loadState, runCommand } from '@/server/erp/store'
import { publicState } from '@/lib/erp/domain/engine'
import type { Command } from '@/lib/erp/domain/types'
import { toApiError } from '@/server/env'

export const runtime = 'nodejs'

/** Typed as a total record so adding a Command action without listing it here fails the build. */
const COMMAND_ACTIONS: Record<Command['action'], true> = {
  createMaterial: true,
  createProduct: true,
  createSupplier: true,
  createCustomer: true,
  createEmployee: true,
  updateEmployee: true,
  createRecipe: true,
  setVarianceThresholds: true,
  updateCompany: true,
  fundBank: true,
  createPurchaseOrder: true,
  decidePurchaseOrder: true,
  receiveGoods: true,
  transferStock: true,
  requestAdjustment: true,
  decideAdjustment: true,
  createProductionOrder: true,
  completeProduction: true,
  decideProductionCost: true,
  recalculateLotCosts: true,
  createInvoice: true,
  confirmInvoice: true,
  recordPayment: true,
  createWithdrawal: true,
  createExpense: true,
  decideExpense: true,
  recordAttendance: true,
  importAttendance: true,
  createPayroll: true,
  decidePayroll: true,
  payPayroll: true,
  markNotificationRead: true,
  scanBarcode: true,
  setRolePermissions: true,
  setUserPassword: true,
  archiveHistory: true,
  createQualitySample: true,
  updateQualityResult: true,
  setQcLimits: true,
  addQualitySampleAttachment: true,
  holdLot: true,
  releaseLot: true,
  recallLot: true,
  holdRawBatch: true,
  releaseRawBatch: true,
  createSparePart: true,
  recordSparePartUsage: true,
  createPackagingMaterial: true,
  recordPackagingConsumption: true,
  createSupplierTemplate: true,
  sendSupplierCommunication: true,
  approveSupplierCommunication: true,
  recordScaleReading: true,
  createDistributionPoint: true,
  closeDistributionDay: true,
  advanceInvoiceDelivery: true,
  recordUtilitiesReading: true,
  createMachine: true,
  createMaintenanceSchedule: true,
  recordMaintenance: true,
  recordBankTransaction: true,
  matchBankTransaction: true,
  createCustomerRecipe: true,
  setCustomerPricing: true,
  setAlternativeBagWeights: true,
  createVehicle: true,
  updateVehicle: true,
  addFuelLog: true,
  addVehicleService: true,
  createTrip: true,
  requestTripCostAllocation: true,
  decideTripCostAllocation: true,
  createObligation: true,
  decideObligation: true,
  payObligationInstallment: true,
  createCompanyDocument: true,
  renewCompanyDocument: true,
  addCompanyDocumentAttachment: true,
}

/** Handled by the store rather than applyCommand, so not part of the Command union. */
const STORE_ACTIONS: string[] = []
const INTERNAL_ACTIONS = new Set(['addCompanyDocumentAttachment', 'addQualitySampleAttachment'])

const ALLOWED_ACTIONS = new Set<string>([
  ...Object.keys(COMMAND_ACTIONS).filter((action) => !INTERNAL_ACTIONS.has(action)),
  ...STORE_ACTIONS,
])

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  try {
    const loaded = await loadState()
    return NextResponse.json({
      success: true,
      data: { state: publicState(loaded.state, user.permissions, user.id), storage: loaded.storage },
    })
  } catch (error) {
    console.error('[erp/get]', error)
    const mapped = toApiError(error)
    return NextResponse.json(mapped.body, { status: mapped.status })
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  const body = (await req.json().catch(() => null)) as {
    action?: string
    input?: Record<string, unknown>
    idempotencyKey?: string
  } | null
  if (!body?.action) return NextResponse.json({ success: false, message: 'الإجراء مطلوب' }, { status: 400 })
  if (!ALLOWED_ACTIONS.has(body.action)) {
    return NextResponse.json({ success: false, message: 'إجراء غير معروف' }, { status: 400 })
  }
  try {
    const result = await runCommand(user.id, body.action, body.input ?? {}, { idempotencyKey: body.idempotencyKey })
    if (!result.ok) return NextResponse.json({ success: false, message: result.error }, { status: 400 })
    return NextResponse.json({
      success: true,
      message: result.message,
      data: { state: result.state, storage: result.storage, extra: result.extra ?? null },
    })
  } catch (error) {
    console.error('[erp/post]', error)
    const mapped = toApiError(error)
    return NextResponse.json(mapped.body, { status: mapped.status })
  }
}
