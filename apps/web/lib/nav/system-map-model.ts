import { NAV_CONFIG, canAccessPage } from './config'

// ─── Types ────────────────────────────────────────────────────────────────────

export type EntityNode = {
  id: string
  label: string
  description: string
  href: string
  category: string
  x: number
  y: number
}

type EntityRelation = {
  from: string
  to: string
  label: string
  type: 'workflow' | 'reference'
}

type WorkflowPath = {
  id: string
  label: string
  nodes: string[]
  color: string
}

// ─── Static Data ──────────────────────────────────────────────────────────────

export const ENTITY_CATEGORIES = {
  'المشتريات': {
    color: '#3b82f6',
    bg: '#eff6ff',
    entities: ['supplier', 'purchaseRequest', 'purchaseOrder', 'goodsReceipt', 'supplierCommunication'],
  },
  // Inventory split into 3 focused sub-groups
  'المواد': {
    color: '#7664d8',
    bg: '#f3f0ff',
    entities: ['inventoryOverview', 'material', 'product', 'inventoryExtensions', 'inventoryExtensions-packaging'],
  },
  'تحليلات المخزون': {
    color: '#5c46c2',
    bg: '#f3f0ff',
    entities: ['factoryStockValue', 'factoryRunningOut', 'factoryStagnant', 'factoryReserved', 'materialBatch', 'inventoryBalance', 'inventoryTransaction', 'inventoryReports', 'materialPriceAnalysis'],
  },
  'المستودعات': {
    color: '#1e127c',
    bg: '#f3f0ff',
    entities: ['warehouse', 'stockTransfer', 'stockAdjustment', 'barcode'],
  },
  'الإنتاج': {
    color: '#f59e0b',
    bg: '#fffbeb',
    entities: ['recipe', 'productionOrder', 'productionLot', 'scaleReading', 'machine'],
  },
  'المبيعات': {
    color: '#8b5cf6',
    bg: '#f5f3ff',
    entities: ['customer', 'salesInvoice', 'salesPayment', 'distribution', 'invoiceDelivery'],
  },
  'المالية': {
    color: '#ef4444',
    bg: '#fef2f2',
    entities: ['account', 'journalEntry', 'expense', 'bankTransaction', 'obligation'],
  },
  'الموارد البشرية': {
    color: '#ec4899',
    bg: '#fdf2f8',
    entities: ['employee', 'attendance', 'payroll', 'leaveRequest'],
  },
  'الجودة': {
    color: '#06b6d4',
    bg: '#ecfeff',
    entities: ['qualitySample', 'qualityHold'],
  },
  'الأسطول': {
    color: '#6366f1',
    bg: '#eef2ff',
    entities: ['fleet', 'fleetFuel', 'fleetTrips'],
  },
} as const

const ENTITY_RELATIONS: EntityRelation[] = [
  // Purchasing workflow
  { from: 'supplier', to: 'purchaseRequest', label: 'طلب شراء', type: 'workflow' },
  { from: 'purchaseRequest', to: 'purchaseOrder', label: 'اعتماد', type: 'workflow' },
  { from: 'purchaseOrder', to: 'goodsReceipt', label: 'استلام', type: 'workflow' },
  { from: 'goodsReceipt', to: 'material', label: 'إضافة للمخزون', type: 'workflow' },
  { from: 'supplier', to: 'supplierCommunication', label: 'مراسلة', type: 'reference' },
  // Materials sub-section internal
  { from: 'inventoryOverview', to: 'material', label: 'مواد', type: 'reference' },
  { from: 'inventoryOverview', to: 'product', label: 'منتجات', type: 'reference' },
  // Materials → Analytics
  { from: 'material', to: 'inventoryBalance', label: 'رصيد', type: 'workflow' },
  { from: 'material', to: 'factoryRunningOut', label: 'قاربت النفاد', type: 'reference' },
  { from: 'material', to: 'factoryStagnant', label: 'راكدة', type: 'reference' },
  { from: 'material', to: 'factoryReserved', label: 'محجوزة', type: 'reference' },
  { from: 'material', to: 'materialBatch', label: 'دفعات', type: 'reference' },
  { from: 'material', to: 'factoryStockValue', label: 'قيمة', type: 'reference' },
  { from: 'inventoryBalance', to: 'inventoryTransaction', label: 'حركات', type: 'workflow' },
  { from: 'inventoryTransaction', to: 'inventoryReports', label: 'تقرير', type: 'workflow' },
  { from: 'material', to: 'materialPriceAnalysis', label: 'أسعار', type: 'reference' },
  // Materials → Warehouses
  { from: 'material', to: 'stockTransfer', label: 'تحويل', type: 'reference' },
  { from: 'material', to: 'stockAdjustment', label: 'تسوية', type: 'reference' },
  { from: 'product', to: 'stockTransfer', label: 'تحويل', type: 'reference' },
  { from: 'warehouse', to: 'stockTransfer', label: 'حركة', type: 'workflow' },
  { from: 'warehouse', to: 'stockAdjustment', label: 'تسوية', type: 'workflow' },
  { from: 'warehouse', to: 'barcode', label: 'مسح', type: 'reference' },
  // Production workflow
  { from: 'material', to: 'recipe', label: 'استهلاك', type: 'workflow' },
  { from: 'recipe', to: 'productionOrder', label: 'أمر إنتاج', type: 'workflow' },
  { from: 'productionOrder', to: 'scaleReading', label: 'وزن', type: 'workflow' },
  { from: 'scaleReading', to: 'productionLot', label: 'دفعة', type: 'workflow' },
  { from: 'productionLot', to: 'product', label: 'إنتاج', type: 'workflow' },
  { from: 'productionLot', to: 'qualitySample', label: 'فحص جودة', type: 'workflow' },
  // Sales workflow
  { from: 'customer', to: 'salesInvoice', label: 'فاتورة', type: 'workflow' },
  { from: 'product', to: 'salesInvoice', label: 'بيع', type: 'workflow' },
  { from: 'salesInvoice', to: 'invoiceDelivery', label: 'تسليم', type: 'workflow' },
  { from: 'salesInvoice', to: 'salesPayment', label: 'تحصيل', type: 'workflow' },
  { from: 'salesInvoice', to: 'distribution', label: 'توزيع', type: 'reference' },
  // Financial workflow
  { from: 'purchaseOrder', to: 'expense', label: 'تكلفة', type: 'workflow' },
  { from: 'expense', to: 'journalEntry', label: 'قيد', type: 'workflow' },
  { from: 'journalEntry', to: 'account', label: 'حساب', type: 'workflow' },
  { from: 'salesPayment', to: 'bankTransaction', label: 'إيداع', type: 'workflow' },
  { from: 'obligation', to: 'bankTransaction', label: 'سداد', type: 'workflow' },
  // HR workflow
  { from: 'employee', to: 'attendance', label: 'حضور', type: 'workflow' },
  { from: 'attendance', to: 'payroll', label: 'راتب', type: 'workflow' },
  { from: 'employee', to: 'leaveRequest', label: 'إجازة', type: 'workflow' },
  // Fleet workflow
  { from: 'fleet', to: 'fleetFuel', label: 'وقود', type: 'workflow' },
  { from: 'fleet', to: 'fleetTrips', label: 'رحلة', type: 'workflow' },
]

const WORKFLOW_PATHS: WorkflowPath[] = [
  {
    id: 'purchasing',
    label: 'دورة المشتريات',
    nodes: ['supplier', 'purchaseRequest', 'purchaseOrder', 'goodsReceipt', 'material'],
    color: '#3b82f6',
  },
  {
    id: 'inventory',
    label: 'دورة المخزون',
    nodes: ['material', 'inventoryBalance', 'inventoryTransaction', 'inventoryReports'],
    color: '#7664d8',
  },
  {
    id: 'production',
    label: 'دورة الإنتاج',
    nodes: ['material', 'recipe', 'productionOrder', 'scaleReading', 'productionLot', 'product'],
    color: '#f59e0b',
  },
  {
    id: 'sales',
    label: 'دورة المبيعات',
    nodes: ['customer', 'salesInvoice', 'invoiceDelivery'],
    color: '#8b5cf6',
  },
  {
    id: 'financial',
    label: 'الدورة المالية',
    nodes: ['expense', 'journalEntry', 'account'],
    color: '#ef4444',
  },
]


export function buildSystemMap(permissions: string[]) {
  const pages = NAV_CONFIG.workspaces.flatMap(workspace => workspace.sections.flatMap(section => section.pages))
  const entities: EntityNode[] = []
  Object.entries(ENTITY_CATEGORIES).forEach(([category, config], index) => {
    let visibleIndex = 0
    config.entities.forEach(id => {
      // Page-specific nodes (such as packaging) must retain their own access rules.
      const exactPage = pages.find(page => page.id === id)
      const candidates = exactPage ? [exactPage] : pages.filter(page => page.entityKey === id)
      const page = candidates.find(page => page.canonical !== false && canAccessPage(page, permissions))
        ?? candidates.find(page => canAccessPage(page, permissions))
      if (!page) return
      const i = visibleIndex++
      entities.push({ id, label: page.label, description: page.description, href: page.href, category,
        x: (index % 3) * 520 + (i % 2) * 232 + 40,
        y: Math.floor(index / 3) * 560 + Math.floor(i / 2) * 96 + 70,
      })
    })
  })
  const ids = new Set(entities.map(node => node.id))
  const relations = ENTITY_RELATIONS.filter(relation => ids.has(relation.from) && ids.has(relation.to))
  const workflows = WORKFLOW_PATHS.map(workflow => ({ ...workflow, nodes: workflow.nodes.filter(id => ids.has(id)) }))
    .filter(workflow => relations.some(relation => relation.type === 'workflow' && workflow.nodes.includes(relation.from) && workflow.nodes.includes(relation.to)))
  return { entities, relations, workflows }
}
