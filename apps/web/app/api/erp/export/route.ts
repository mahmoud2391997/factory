import { NextResponse, type NextRequest } from 'next/server'

import { profitAndLoss, stockRows, trialBalance, vatReturn } from '@/lib/erp/domain/reports'
import { getSessionUser } from '@/server/auth/session'
import { spreadsheetXml } from '@/server/erp/excel'
import { loadState } from '@/server/erp/store'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  const kind = req.nextUrl.searchParams.get('kind') || 'journals'
  const financial = ['journals', 'invoices', 'vat', 'trial', 'payroll', 'pnl'].includes(kind)
  if (financial && !user.permissions.includes('accounting.read') && !user.permissions.includes('reports.read')) {
    return NextResponse.json({ success: false, message: 'ليست لديك صلاحية التصدير' }, { status: 403 })
  }
  if (!user.permissions.includes('reports.read') && !user.permissions.includes('accounting.read')) {
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
  } else if (kind === 'pnl') {
    name = 'Profit'
    const pnl = profitAndLoss(state)
    rows = [
      ['البند', 'المبلغ'],
      ['الإيرادات', pnl.revenue],
      ['المصروفات', pnl.expense],
      ['الربح', pnl.profit],
    ]
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
