import { hasPermission } from './permissions'
import { muscatDay } from './reports'
import type { ErpState } from './types'

const DAY_MS = 24 * 60 * 60 * 1000

function daysUntil(date: string, today: string): number | undefined {
  const dateDay = date.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateDay)) return undefined
  const target = Date.parse(`${dateDay}T00:00:00.000Z`)
  const current = Date.parse(`${today}T00:00:00.000Z`)
  if (!Number.isFinite(target) || !Number.isFinite(current)) return undefined
  return Math.floor((target - current) / DAY_MS)
}

export function dashboardAccess(permissions: readonly string[]) {
  return {
    production: hasPermission(permissions, 'production.read'),
    sales: hasPermission(permissions, 'sales.read'),
    profitability:
      hasPermission(permissions, 'accounting.read') ||
      hasPermission(permissions, 'production.cost.approve'),
    inventory:
      hasPermission(permissions, 'inventory.read') ||
      hasPermission(permissions, 'warehouses.read'),
    quality:
      hasPermission(permissions, 'qc.read') ||
      hasPermission(permissions, 'qc.manage') ||
      hasPermission(permissions, 'qc.release'),
    fleet:
      hasPermission(permissions, 'fleet.read') ||
      hasPermission(permissions, 'fleet.service.manage') ||
      hasPermission(permissions, 'fleet.manage'),
    obligations:
      hasPermission(permissions, 'obligations.read') ||
      hasPermission(permissions, 'obligations.manage') ||
      hasPermission(permissions, 'obligations.pay'),
    documents:
      hasPermission(permissions, 'documents.read') ||
      hasPermission(permissions, 'documents.manage'),
    maintenance:
      hasPermission(permissions, 'maintenance.read') ||
      hasPermission(permissions, 'maintenance.manage'),
  }
}

export function dashboardAlerts(
  state: Pick<
    ErpState,
    | 'obligationScheduleLines'
    | 'obligations'
    | 'companyDocuments'
    | 'vehicleServices'
    | 'vehicles'
    | 'maintenanceSchedules'
    | 'machines'
  >,
  nowIso: string,
) {
  const today = muscatDay(nowIso)
  const obligations = state.obligationScheduleLines
    .filter((line) => line.status !== 'PAID')
    .map((line) => ({
      id: line.id,
      dueDate: line.dueDate,
      outstanding: Math.max(0, line.amount - line.paidAmount),
      daysLeft: daysUntil(line.dueDate, today),
      beneficiary: state.obligations.find((item) => item.id === line.obligationId)?.beneficiary ?? '',
    }))
    .filter((line) => line.daysLeft != null && line.daysLeft <= 90)
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0) || a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5)

  const documents = state.companyDocuments
    .filter((document) => Boolean(document.expiryDate))
    .map((document) => ({
      id: document.id,
      title: document.title,
      dueDate: document.expiryDate!,
      daysLeft: daysUntil(document.expiryDate!, today),
    }))
    .filter((document) => document.daysLeft != null && document.daysLeft <= 90)
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0) || a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5)

  const latestVehicleServices = new Map<string, (typeof state.vehicleServices)[number]>()
  for (const service of state.vehicleServices) {
    const key = `${service.vehicleId}:${service.kind}`
    const current = latestVehicleServices.get(key)
    if (!current || service.date > current.date) latestVehicleServices.set(key, service)
  }
  const vehicleServices = [...latestVehicleServices.values()]
    .flatMap((service) => {
      const vehicle = state.vehicles.find((item) => item.id === service.vehicleId && item.active)
      if (!vehicle) return []
      const daysLeft = service.nextDueDate ? daysUntil(service.nextDueDate, today) : undefined
      const kmLeft = service.nextDueKm == null ? undefined : service.nextDueKm - vehicle.currentOdometer
      if ((daysLeft == null || daysLeft > 30) && (kmLeft == null || kmLeft > 500)) return []
      return [{
        id: service.id,
        vehicle: vehicle.nameAr,
        plateNo: vehicle.plateNo,
        kind: service.kind,
        dueDate: service.nextDueDate,
        kmLeft,
        daysLeft,
        overdue: (daysLeft != null && daysLeft < 0) || (kmLeft != null && kmLeft < 0),
      }]
    })
    .sort((a, b) => Number(b.overdue) - Number(a.overdue) || (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity) || (a.kmLeft ?? Infinity) - (b.kmLeft ?? Infinity))
    .slice(0, 5)

  const machineMaintenance = state.maintenanceSchedules
    .flatMap((schedule) => {
      const machine = state.machines.find((item) => item.id === schedule.machineId && item.active)
      if (!machine) return []
      const daysLeft = daysUntil(schedule.nextDue, today)
      const hoursDue = schedule.type === 'HOURS_BASED' &&
        machine.operatingHours >= (schedule.hoursAtLastCompletion ?? 0) + schedule.interval
      if (!hoursDue && (daysLeft == null || daysLeft > 30)) return []
      return [{
        id: schedule.id,
        machine: machine.nameAr,
        description: schedule.description,
        dueDate: schedule.nextDue,
        daysLeft,
        hoursDue,
        overdue: hoursDue || (daysLeft != null && daysLeft < 0),
      }]
    })
    .sort((a, b) => Number(b.overdue) - Number(a.overdue) || (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity))
    .slice(0, 5)

  return { today, obligations, documents, vehicleServices, machineMaintenance }
}
