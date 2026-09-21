import { money, qty } from './money'
import type { ErpState, ItemType, WarehouseKey } from './types'

export function accountName(state: ErpState, code: string) {
  return state.accounts.find((account) => account.code === code)?.nameAr ?? code
}

export function trialBalance(state: ErpState) {
  const totals = new Map<string, { debit: number; credit: number }>()
  for (const account of state.accounts) totals.set(account.code, { debit: 0, credit: 0 })
  for (const entry of state.journals) {
    for (const line of entry.lines) {
      const current = totals.get(line.accountCode) ?? { debit: 0, credit: 0 }
      current.debit = money(current.debit + line.debit)
      current.credit = money(current.credit + line.credit)
      totals.set(line.accountCode, current)
    }
  }
  const rows = [...totals.entries()].map(([code, amounts]) => {
    const account = state.accounts.find((item) => item.code === code)
    const net = money(amounts.debit - amounts.credit)
    return {
      code,
      nameAr: account?.nameAr ?? code,
      type: account?.type ?? 'EXPENSE',
      debit: amounts.debit,
      credit: amounts.credit,
      balance: net,
    }
  })
  const debit = money(rows.reduce((sum, row) => sum + row.debit, 0))
  const credit = money(rows.reduce((sum, row) => sum + row.credit, 0))
  return { rows, debit, credit, balanced: Math.abs(debit - credit) < 0.001 }
}

export function profitAndLoss(state: ErpState) {
  const tb = trialBalance(state)
  const revenue = money(
    tb.rows.filter((row) => row.type === 'REVENUE').reduce((sum, row) => sum + (row.credit - row.debit), 0),
  )
  const expense = money(
    tb.rows.filter((row) => row.type === 'EXPENSE').reduce((sum, row) => sum + (row.debit - row.credit), 0),
  )
  return { revenue, expense, profit: money(revenue - expense), rows: tb.rows.filter((row) => row.type === 'REVENUE' || row.type === 'EXPENSE') }
}

export function vatReturn(state: ErpState, month?: string) {
  const inMonth = (iso: string) => !month || iso.slice(0, 7) === month
  const output = money(
    state.invoices
      .filter((invoice) => invoice.status !== 'DRAFT' && inMonth(invoice.issuedAt))
      .reduce((sum, invoice) => sum + invoice.vatAmount, 0),
  )
  const inputPurchases = money(
    state.journals
      .filter((entry) => entry.refType === 'goodsReceipt' && inMonth(entry.at))
      .flatMap((entry) => entry.lines)
      .filter((line) => line.accountCode === '2300')
      .reduce((sum, line) => sum + line.debit, 0),
  )
  const inputExpenses = money(
    state.journals
      .filter((entry) => entry.refType === 'expense' && inMonth(entry.at))
      .flatMap((entry) => entry.lines)
      .filter((line) => line.accountCode === '2300')
      .reduce((sum, line) => sum + line.debit, 0),
  )
  const input = money(inputPurchases + inputExpenses)
  return {
    month: month ?? 'الكل',
    outputVat: output,
    inputVat: input,
    netPayable: money(output - input),
  }
}

export function stockRows(state: ErpState) {
  return state.balances
    .filter((row) => row.qty > 0)
    .map((row) => {
      const material = row.itemType === 'MATERIAL' ? state.materials.find((item) => item.id === row.itemId) : undefined
      const product = row.itemType === 'PRODUCT' ? state.products.find((item) => item.id === row.itemId) : undefined
      return {
        ...row,
        code: material?.code ?? product?.code ?? '',
        nameAr: material?.nameAr ?? product?.nameAr ?? row.itemId,
        unit: material?.unit ?? product?.unit ?? '',
        value: money(row.qty * row.unitCost),
      }
    })
    .sort((a, b) => a.warehouse.localeCompare(b.warehouse) || a.nameAr.localeCompare(b.nameAr, 'ar'))
}

export function itemOnHand(state: ErpState, itemType: ItemType, itemId: string, warehouse?: WarehouseKey) {
  return qty(
    state.balances
      .filter((row) => row.itemType === itemType && row.itemId === itemId && (!warehouse || row.warehouse === warehouse))
      .reduce((sum, row) => sum + row.qty, 0),
  )
}

export function traceProduct(state: ErpState, productId: string) {
  const product = state.products.find((item) => item.id === productId)
  const orders = state.productionOrders.filter((order) => order.productId === productId)
  const sales = state.invoices.filter((invoice) => invoice.lines.some((line) => line.productId === productId))
  const materialIds = new Set(orders.flatMap((order) => order.expected.map((line) => line.materialId)))
  const receipts = state.goodsReceipts.filter((receipt) => receipt.lines.some((line) => materialIds.has(line.materialId)))
  const purchaseOrders = state.purchaseOrders.filter((order) => receipts.some((receipt) => receipt.purchaseOrderId === order.id))
  return { product, orders, sales, receipts, purchaseOrders }
}
