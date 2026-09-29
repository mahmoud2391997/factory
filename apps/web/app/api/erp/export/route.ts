import { NextResponse, type NextRequest } from 'next/server'

import { lotExportRows, profitAndLoss, stockRows, trialBalance, vatReturn } from '@/lib/erp/domain/reports'
import { getSessionUser } from '@/server/auth/session'
import { spreadsheetXml } from '@/server/erp/excel'
import { loadState } from '@/server/erp/store'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  const kind = req.nextUrl.searchParams.get('kind') || 'journals'
  const accountingExport = ['journals', 'vat', 'trial', 'pnl'].includes(kind)
  if (kind === 'documents' && !user.permissions.includes('documents.read') && !user.permissions.includes('documents.manage')) {
    return NextResponse.json({ success: false, message: 'ليست لديك صلاحية تصدير الوثائق' }, { status: 403 })
  }
  if (accountingExport && !user.permissions.includes('accounting.read') && !user.permissions.includes('accounting.manage')) {
    return NextResponse.json({ success: false, message: 'ليست لديك صلاحية التصدير' }, { status: 403 })
  }
  if (kind === 'payroll' && !user.permissions.includes('payroll.manage') && !user.permissions.includes('payroll.approve') && !user.permissions.includes('payroll.pay')) {
    return NextResponse.json({ success: false, message: 'ليست لديك صلاحية التصدير' }, { status: 403 })
  }
  const financial = ['journals', 'invoices', 'vat', 'trial', 'payroll', 'pnl'].includes(kind)
  if (financial && !user.permissions.includes('accounting.read') && !user.permissions.includes('reports.read') && !user.permissions.includes('payroll.manage')) {
    return NextResponse.json({ success: false, message: 'ليست لديك صلاحية التصدير' }, { status: 403 })
  }
  if (kind !== 'documents' && !user.permissions.includes('reports.read') && !user.permissions.includes('accounting.read')) {
    return NextResponse.json({ success: false, message: 'ليست لديك صلاحية التصدير' }, { status: 403 })
  }

  const { state } = await loadState()
  let rows: Array<Array<string | number>> = []
  let name = 'Report'

  if (kind === 'journals') {
    name = 'Journals'
    rows = [['القيد', 'التاريخ', 'البيان', 'الحساب', 'مدين', 'دائن', 'المرجع']]
    for (const entry of state.journals) {
      for (const line of entry.lines) {
        rows.push([entry.number, entry.at.slice(0, 10), entry.memo, line.accountCode, line.debit, line.credit, entry.refType])
      }
    }
  } else if (kind === 'invoices') {
    name = 'Invoices'
    rows = [['الفاتورة', 'التاريخ', 'العميل', 'الحالة', 'الخاضع', 'الضريبة', 'الإجمالي', 'المحصّل']]
    for (const invoice of state.invoices) {
      const customer = state.customers.find((item) => item.id === invoice.customerId)
      rows.push([
        invoice.number,
        invoice.issuedAt.slice(0, 10),
        customer?.nameAr ?? '',
        invoice.status,
        invoice.subtotal,
        invoice.vatAmount,
        invoice.total,
        invoice.paidAmount,
      ])
    }
  } else if (kind === 'vat') {
    name = 'VAT'
    const month = req.nextUrl.searchParams.get('month') || undefined
    const vat = vatReturn(state, month)
    rows = [
      ['البند', 'المبلغ'],
      ['الفترة', vat.month],
      ['ضريبة المخرجات', vat.outputVat],
      ['ضريبة المدخلات', vat.inputVat],
      ['صافي المستحق', vat.netPayable],
    ]
  } else if (kind === 'trial') {
    name = 'TrialBalance'
    const tb = trialBalance(state)
    rows = [['الحساب', 'الاسم', 'مدين', 'دائن', 'الرصيد']]
    for (const row of tb.rows) rows.push([row.code, row.nameAr, row.debit, row.credit, row.balance])
    rows.push(['', 'الإجمالي', tb.debit, tb.credit, ''])
  } else if (kind === 'payroll') {
    name = 'Payroll'
    rows = [['المسير', 'الشهر', 'الموظف', 'الأساسي', 'الإضافي', 'الاستقطاع', 'الصافي', 'الحالة']]
    for (const payroll of state.payrolls) {
      for (const line of payroll.lines) {
        const employee = state.employees.find((item) => item.id === line.employeeId)
        rows.push([payroll.number, payroll.month, employee?.nameAr ?? '', line.basic, line.overtimeAmount, line.deductions, line.net, payroll.status])
      }
    }
  } else if (kind === 'stock') {
    name = 'Stock'
    rows = [['المستودع', 'الصنف', 'الدفعة', 'الكمية', 'التكلفة', 'القيمة', 'الصلاحية']]
    for (const row of stockRows(state)) {
      rows.push([row.warehouse, row.nameAr, row.batchNo, row.qty, row.unitCost, row.value, row.expiryDate ?? ''])
    }
  } else if (kind === 'lots') {
    name = 'Lots'
    rows = lotExportRows(state, {
      productId: req.nextUrl.searchParams.get('productId') || undefined,
      fromDay: req.nextUrl.searchParams.get('from') || undefined,
      toDay: req.nextUrl.searchParams.get('to') || undefined,
      qcStatus: req.nextUrl.searchParams.get('qc') || undefined,
      marginSign: (req.nextUrl.searchParams.get('margin') as 'all' | 'negative' | 'positive' | null) || 'all',
    })
  } else if (kind === 'pnl') {
    name = 'Profit'
    const pnl = profitAndLoss(state)
    rows = [
      ['البند', 'المبلغ'],
      ['الإيرادات', pnl.revenue],
      ['المصروفات', pnl.expense],
      ['الربح', pnl.profit],
    ]
  } else if (kind === 'documents') {
    name = 'Documents'
    rows = [['الوثيقة', 'الجهة', 'النوع', 'تاريخ الإصدار', 'تاريخ الانتهاء', 'التكلفة', 'مسؤول التجديد', 'عدد المرفقات']]
    for (const document of state.companyDocuments) {
      const owner = state.users.find((item) => item.id === document.renewalOwnerId)?.fullName
        ?? state.employees.find((item) => item.id === document.renewalOwnerId)?.nameAr
        ?? ''
      rows.push([
        document.title,
        document.entityType === 'VEHICLE'
          ? state.vehicles.find((item) => item.id === document.entityId)?.plateNo ?? ''
          : document.entityType === 'EMPLOYEE'
            ? state.employees.find((item) => item.id === document.entityId)?.nameAr ?? ''
            : document.entityType === 'SUPPLIER'
              ? state.suppliers.find((item) => item.id === document.entityId)?.nameAr ?? ''
              : document.entityType === 'CUSTOMER'
                ? state.customers.find((item) => item.id === document.entityId)?.nameAr ?? ''
                : document.entityType === 'MACHINE'
                  ? state.machines.find((item) => item.id === document.entityId)?.nameAr ?? ''
                  : state.company.nameAr,
        document.kind,
        document.issueDate,
        document.expiryDate ?? '',
        document.cost ?? '',
        owner,
        document.attachments?.length ?? 0,
      ])
    }
  } else {
    return NextResponse.json({ success: false, message: 'نوع التصدير غير معروف' }, { status: 400 })
  }

  const xml = spreadsheetXml(name, rows)
  return new NextResponse(xml, {
    headers: {
      'content-type': 'application/vnd.ms-excel; charset=utf-8',
      'content-disposition': `attachment; filename="gulf-feed-${kind}.xls"`,
    },
  })
}
