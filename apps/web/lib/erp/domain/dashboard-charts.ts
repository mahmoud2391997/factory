import { dashboardAccess } from './dashboard'
import { money, qty } from './money'
import { muscatDay } from './reports'
import type { ErpState } from './types'

/** Use exact factory days: inactive days stay zero instead of repeating the last operating day. */
export function dashboardChartSeries(state: Pick<ErpState, 'productionOrders' | 'invoices'>, permissions: readonly string[], endDay: string, days: 7 | 30) {
  const access = dashboardAccess(permissions)
  const dates = Array.from({ length: days }, (_, index) => new Date(Date.parse(`${endDay}T00:00:00Z`) - (days - index - 1) * 86_400_000).toISOString().slice(0, 10))
  const production = access.production ? dates.map(day => {
    const orders = state.productionOrders.filter(order => muscatDay(order.createdAt) === day || (order.completedAt && muscatDay(order.completedAt) === day))
    return { day,
      planned: qty(orders.reduce((sum, order) => sum + order.plannedQty, 0)) / 1000,
      actual: qty(orders.filter(order => order.status === 'COMPLETED' && order.completedAt && muscatDay(order.completedAt) === day).reduce((sum, order) => sum + order.actualOutputQty, 0)) / 1000,
    }
  }) : null
  const sales = access.sales ? dates.map(day => ({ day,
    sales: money(state.invoices.filter(invoice => invoice.status !== 'DRAFT' && muscatDay(invoice.issuedAt) === day).reduce((sum, invoice) => sum + invoice.subtotal, 0)),
  })) : null
  return { production, sales }
}
