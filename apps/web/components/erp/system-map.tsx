'use client'

import {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from 'react'
import {
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  X,
  Maximize2,
  Minimize2,
  Move,
  MousePointer2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { NAV_CONFIG, canAccessPage, type NavPage } from '@/lib/nav/config'
import { canSeeEntity } from '@/lib/erp-routes'
import { useRouter } from 'next/navigation'
import { LocalizedContent } from '@/lib/i18n/localized-content'
import { translateUiText } from '@/lib/i18n/translations'
import type { Language } from '@/lib/i18n/translations'

// ─── Types ────────────────────────────────────────────────────────────────────

type EntityNode = {
  id: string
  label: string
  description: string
  href: string
  hasAccess: boolean
  permissions: string[]
  type: 'entity' | 'page'
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

type Vec2 = { x: number; y: number }

interface SystemMapProps {
  permissions: string[]
  language?: string
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const ENTITY_CATEGORIES = {
  'المشتريات': {
    color: '#3b82f6',
    bg: '#eff6ff',
    entities: ['supplier', 'purchaseRequest', 'purchaseOrder', 'goodsReceipt', 'supplierCommunication'],
  },
  // Inventory split into 3 focused sub-groups
  'المواد': {
    color: '#10b981',
    bg: '#f0fdf4',
    entities: ['inventoryOverview', 'material', 'product', 'inventoryExtensions', 'inventoryExtensions-packaging'],
  },
  'تحليلات المخزون': {
    color: '#059669',
    bg: '#ecfdf5',
    entities: ['factoryStockValue', 'factoryRunningOut', 'factoryStagnant', 'factoryReserved', 'materialBatch', 'inventoryBalance', 'inventoryTransaction', 'inventoryReports', 'materialPriceAnalysis'],
  },
  'المستودعات': {
    color: '#0d9488',
    bg: '#f0fdfa',
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
    nodes: ['material', 'inventoryBalance', 'inventoryTransaction', 'inventoryReports', 'warehouse', 'stockTransfer'],
    color: '#10b981',
  },
  {
    id: 'production',
    label: 'دورة الإنتاج',
    nodes: ['material', 'recipe', 'productionOrder', 'scaleReading', 'productionLot', 'product', 'qualitySample'],
    color: '#f59e0b',
  },
  {
    id: 'sales',
    label: 'دورة المبيعات',
    nodes: ['customer', 'salesInvoice', 'invoiceDelivery', 'salesPayment', 'distribution'],
    color: '#8b5cf6',
  },
  {
    id: 'financial',
    label: 'الدورة المالية',
    nodes: ['expense', 'journalEntry', 'account', 'bankTransaction', 'obligation'],
    color: '#ef4444',
  },
]

// ─── Node size constants ───────────────────────────────────────────────────────
const NODE_W = 170
const NODE_H = 56

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute a smooth cubic bezier path between two node centres,
 * with edge intersection so the arrow starts/ends at the node border.
 */
function edgePath(from: Vec2, to: Vec2): string {
  // Centre of each node
  const x1 = from.x + NODE_W / 2
  const y1 = from.y + NODE_H / 2
  const x2 = to.x + NODE_W / 2
  const y2 = to.y + NODE_H / 2

  const dx = x2 - x1
  const dy = y2 - y1
  const dist = Math.sqrt(dx * dx + dy * dy) || 1

  // Clamp start/end to node bounding box edges
  const startX = x1 + (dx / dist) * (NODE_W / 2)
  const startY = y1 + (dy / dist) * (NODE_H / 2)
  const endX = x2 - (dx / dist) * (NODE_W / 2 + 10) // leave room for arrowhead
  const endY = y2 - (dy / dist) * (NODE_H / 2 + 10)

  // Cubic bezier control points — horizontal bias for cleaner routes
  const cpDist = Math.min(Math.abs(dx) * 0.6, 200) + 40
  const cp1x = startX + (dx > 0 ? cpDist : -cpDist)
  const cp1y = startY
  const cp2x = endX - (dx > 0 ? cpDist : -cpDist)
  const cp2y = endY

  return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`
}

/** Mid-point of bezier path for label placement (approximate at t=0.5) */
function bezierMid(from: Vec2, to: Vec2): Vec2 {
  const x1 = from.x + NODE_W / 2
  const y1 = from.y + NODE_H / 2
  const x2 = to.x + NODE_W / 2
  const y2 = to.y + NODE_H / 2
  return {
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SystemMap({ permissions, language = 'ar' }: SystemMapProps) {
  const router = useRouter()
  const canvasRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const [zoom, setZoom] = useState(0.85)
  const [pan, setPan] = useState<Vec2>({ x: 60, y: 40 })
  const [showAll, setShowAll] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null)
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ entity: EntityNode; x: number; y: number } | null>(null)

  // Positions live in a ref + a state that triggers re-render
  const posRef = useRef<Record<string, Vec2>>({})
  const [positions, setPositions] = useState<Record<string, Vec2>>({})

  // ── Drag state (stored in refs to avoid stale-closure issues) ──────────────
  const canvasDragRef = useRef<{ active: boolean; startClient: Vec2; startPan: Vec2 }>({
    active: false,
    startClient: { x: 0, y: 0 },
    startPan: { x: 0, y: 0 },
  })
  const nodeDragRef = useRef<{
    active: boolean
    id: string | null
    startClient: Vec2
    startNodePos: Vec2
    moved: boolean
  }>({
    active: false,
    id: null,
    startClient: { x: 0, y: 0 },
    startNodePos: { x: 0, y: 0 },
    moved: false,
  })

  const isMobile = useRef(typeof window !== 'undefined' && window.innerWidth < 768)

  // ── Build entity list ──────────────────────────────────────────────────────
  const entities = useMemo<EntityNode[]>(() => {
    const nodes: EntityNode[] = []
    const pageMap = new Map<string, NavPage>()

    for (const workspace of NAV_CONFIG.workspaces) {
      for (const section of workspace.sections) {
        for (const page of section.pages) {
          pageMap.set(page.entityKey, page)
        }
      }
    }

    for (const [category, config] of Object.entries(ENTITY_CATEGORIES)) {
      config.entities.forEach((entityKey) => {
        const page = pageMap.get(entityKey)
        if (!page) return
        const hasAccess = canAccessPage(page, permissions) || canSeeEntity(permissions, page.entityKey)
        nodes.push({
          id: entityKey,
          label: page.label,
          description: page.description,
          href: page.href,
          hasAccess,
          permissions: page.permission,
          type: 'entity',
          category,
          x: 0,
          y: 0,
        })
      })
    }

    // Layout: place each category in a column-grid, entities in a tight sub-grid
    const mob = isMobile.current
    const cols = mob ? 2 : 4
    const spacingX = mob ? 300 : 420
    const spacingY = mob ? 320 : 380
    const subColW = mob ? 200 : 210
    const subRowH = mob ? 72 : 80
    const categoryOrder = Object.keys(ENTITY_CATEGORIES)

    categoryOrder.forEach((category, catIndex) => {
      const col = catIndex % cols
      const row = Math.floor(catIndex / cols)
      const baseX = col * spacingX + (mob ? 40 : 60)
      const baseY = row * spacingY + (mob ? 60 : 80)

      const catNodes = nodes.filter((n) => n.category === category)
      catNodes.forEach((node, idx) => {
        const subCols = mob ? 1 : 2
        const subCol = idx % subCols
        const subRow = Math.floor(idx / subCols)
        node.x = baseX + subCol * subColW + 20
        node.y = baseY + subRow * subRowH + 30
      })
    })

    return nodes
  }, [permissions])

  // ── Seed positions once when entities change ───────────────────────────────
  useEffect(() => {
    const next: Record<string, Vec2> = {}
    entities.forEach((e) => {
      // Keep user-moved positions; only seed missing ones
      next[e.id] = posRef.current[e.id] ?? { x: e.x, y: e.y }
    })
    posRef.current = next
    setPositions({ ...next })
  }, [entities])

  const visibleEntities = useMemo(
    () => (showAll ? entities : entities.filter((e) => e.hasAccess)),
    [entities, showAll]
  )

  const visibleIds = useMemo(() => new Set(visibleEntities.map((e) => e.id)), [visibleEntities])

  // ── Zoom helpers ──────────────────────────────────────────────────────────
  const zoomBy = useCallback((delta: number) => {
    setZoom((prev) => Math.max(0.3, Math.min(2.5, +(prev + delta).toFixed(2))))
  }, [])

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      const factor = e.ctrlKey ? 0.05 : 0.1
      zoomBy(e.deltaY > 0 ? -factor : factor)
    },
    [zoomBy]
  )

  // Attach non-passive wheel listener
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // ── Global pointer move / up ───────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const client: Vec2 = { x: e.clientX, y: e.clientY }

      // Node drag takes priority
      if (nodeDragRef.current.active && nodeDragRef.current.id) {
        const dx = client.x - nodeDragRef.current.startClient.x
        const dy = client.y - nodeDragRef.current.startClient.y
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          nodeDragRef.current.moved = true
        }
        if (nodeDragRef.current.moved) {
          const id = nodeDragRef.current.id
          const newPos: Vec2 = {
            x: nodeDragRef.current.startNodePos.x + dx / zoom,
            y: nodeDragRef.current.startNodePos.y + dy / zoom,
          }
          posRef.current = { ...posRef.current, [id]: newPos }
          setPositions((prev) => ({ ...prev, [id]: newPos }))
        }
        return
      }

      // Canvas pan
      if (canvasDragRef.current.active) {
        const dx = client.x - canvasDragRef.current.startClient.x
        const dy = client.y - canvasDragRef.current.startClient.y
        setPan({
          x: canvasDragRef.current.startPan.x + dx,
          y: canvasDragRef.current.startPan.y + dy,
        })
      }
    }

    const onUp = () => {
      canvasDragRef.current.active = false
      nodeDragRef.current.active = false
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [zoom])

  // ── Canvas pointer down (pan) ──────────────────────────────────────────────
  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only start canvas pan when clicking the canvas itself, not a node
      if ((e.target as HTMLElement).closest('[data-node]')) return
      e.preventDefault()
      canvasDragRef.current = {
        active: true,
        startClient: { x: e.clientX, y: e.clientY },
        startPan: { x: pan.x, y: pan.y },
      }
    },
    [pan]
  )

  // ── Node pointer down (drag) ───────────────────────────────────────────────
  const handleNodePointerDown = useCallback(
    (e: React.PointerEvent, entityId: string) => {
      e.stopPropagation()
      const pos = posRef.current[entityId] ?? { x: 0, y: 0 }
      nodeDragRef.current = {
        active: true,
        id: entityId,
        startClient: { x: e.clientX, y: e.clientY },
        startNodePos: { ...pos },
        moved: false,
      }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    []
  )

  const handleNodeClick = useCallback(
    (e: React.MouseEvent, entity: EntityNode) => {
      if (nodeDragRef.current.moved) return // was a drag, not a click
      setSelectedEntity((prev) => (prev === entity.id ? null : entity.id))
      setTooltip(null)
    },
    []
  )

  const handleNodeDoubleClick = useCallback(
    (entity: EntityNode) => {
      if (entity.hasAccess) {
        router.push(entity.href)
      }
    },
    [router]
  )

  const handleReset = useCallback(() => {
    setZoom(0.85)
    setPan({ x: 60, y: 40 })
    setSelectedEntity(null)
    setSelectedWorkflow(null)
    setTooltip(null)
    // Re-seed positions from initial layout
    const next: Record<string, Vec2> = {}
    entities.forEach((e) => {
      next[e.id] = { x: e.x, y: e.y }
    })
    posRef.current = next
    setPositions(next)
  }, [entities])

  // ── Workflow helpers ──────────────────────────────────────────────────────
  const activeWorkflow = selectedWorkflow
    ? WORKFLOW_PATHS.find((w) => w.id === selectedWorkflow)
    : null

  const isNodeInWorkflow = useCallback(
    (id: string) => activeWorkflow?.nodes.includes(id) ?? false,
    [activeWorkflow]
  )

  const isEdgeInWorkflow = useCallback(
    (from: string, to: string) => {
      if (!activeWorkflow) return false
      const ni = activeWorkflow.nodes.indexOf(from)
      return ni !== -1 && activeWorkflow.nodes[ni + 1] === to
    },
    [activeWorkflow]
  )

  // ── Category colour ───────────────────────────────────────────────────────
  const catColor = (category: string) =>
    ENTITY_CATEGORIES[category as keyof typeof ENTITY_CATEGORIES]?.color ?? '#64748b'
  const catBg = (category: string) =>
    ENTITY_CATEGORIES[category as keyof typeof ENTITY_CATEGORIES]?.bg ?? '#f8fafc'

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <LocalizedContent>
      <div
        className={`w-full p-4 md:p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none flex flex-col' : ''
        }`}
      >
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {translateUiText(language as Language, 'خريطة الكيانات والعلاقات')}
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {translateUiText(
                language as Language,
                'اسحب العقد لإعادة ترتيبها • انقر مرتين للانتقال • استخدم عجلة الماوس للتكبير'
              )}
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAll((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title={translateUiText(language as Language, showAll ? 'عرض المتاح فقط' : 'عرض الكل')}
            >
              {showAll ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {showAll
                  ? translateUiText(language as Language, 'الكل')
                  : translateUiText(language as Language, 'المتاح')}
              </span>
            </button>

            <button
              onClick={() => setShowLabels((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title={translateUiText(language as Language, 'تبديل تسميات الروابط')}
            >
              {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {translateUiText(language as Language, 'التسميات')}
              </span>
            </button>

            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => zoomBy(-0.1)}
                disabled={zoom <= 0.3}
                className="p-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                title={translateUiText(language as Language, 'تصغير')}
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono bg-white dark:bg-slate-800 text-slate-500 border-x border-slate-200 dark:border-slate-700 select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => zoomBy(0.1)}
                disabled={zoom >= 2.5}
                className="p-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                title={translateUiText(language as Language, 'تكبير')}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleReset}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title={translateUiText(language as Language, 'إعادة تعيين')}
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsFullscreen((v) => !v)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title={
                isFullscreen
                  ? translateUiText(language as Language, 'إغلاق ملء الشاشة')
                  : translateUiText(language as Language, 'ملء الشاشة')
              }
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ── Workflow selector ── */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {translateUiText(language as Language, 'الدورات')}:
          </span>
          {WORKFLOW_PATHS.map((wf) => (
            <button
              key={wf.id}
              onClick={() => setSelectedWorkflow((prev) => (prev === wf.id ? null : wf.id))}
              className={`px-3 py-1 text-xs rounded-full border transition-all ${
                selectedWorkflow === wf.id
                  ? 'text-white border-transparent shadow-md scale-105'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:scale-105'
              }`}
              style={selectedWorkflow === wf.id ? { backgroundColor: wf.color, borderColor: wf.color } : {}}
            >
              {translateUiText(language as Language, wf.label)}
            </button>
          ))}
          {selectedWorkflow && (
            <button
              onClick={() => setSelectedWorkflow(null)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title={translateUiText(language as Language, 'إلغاء')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ── Canvas ── */}
        <div
          ref={canvasRef}
          className={`relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 select-none touch-none ${
            isFullscreen ? 'flex-1' : 'h-[640px] md:h-[820px]'
          }`}
          style={{ cursor: canvasDragRef.current.active ? 'grabbing' : 'grab' }}
          onPointerDown={handleCanvasPointerDown}
        >
          {/* Dot-grid background */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="dot-grid"
                x={pan.x % (20 * zoom)}
                y={pan.y % (20 * zoom)}
                width={20 * zoom}
                height={20 * zoom}
                patternUnits="userSpaceOnUse"
              >
                <circle cx={1} cy={1} r={0.8} fill="#cbd5e1" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dot-grid)" />
          </svg>

          {/* ── Main SVG for edges ── */}
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Default arrowhead marker */}
              <marker
                id="arrow-default"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
              </marker>
              {/* Workflow arrowhead markers per workflow colour */}
              {WORKFLOW_PATHS.map((wf) => (
                <marker
                  key={wf.id}
                  id={`arrow-${wf.id}`}
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L8,3 z" fill={wf.color} />
                </marker>
              ))}
            </defs>

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {ENTITY_RELATIONS.map((rel, idx) => {
                if (!visibleIds.has(rel.from) || !visibleIds.has(rel.to)) return null
                const fromPos = positions[rel.from]
                const toPos = positions[rel.to]
                if (!fromPos || !toPos) return null

                const inWorkflow = isEdgeInWorkflow(rel.from, rel.to)
                const dimmed = activeWorkflow && !inWorkflow
                const wfColor = activeWorkflow?.color ?? '#94a3b8'
                const stroke = inWorkflow ? wfColor : rel.type === 'reference' ? '#cbd5e1' : '#94a3b8'
                const markerId = inWorkflow ? `arrow-${activeWorkflow?.id}` : 'arrow-default'
                const mid = bezierMid(fromPos, toPos)

                return (
                  <g key={idx} opacity={dimmed ? 0.15 : 1} style={{ transition: 'opacity 0.25s' }}>
                    <path
                      d={edgePath(fromPos, toPos)}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={inWorkflow ? 2.5 : 1.5}
                      strokeDasharray={rel.type === 'reference' ? '6 4' : undefined}
                      markerEnd={`url(#${markerId})`}
                      style={{ transition: 'stroke 0.25s, stroke-width 0.25s' }}
                    />
                    {/* Edge label */}
                    {showLabels && (inWorkflow || !activeWorkflow) && (
                      <g>
                        <rect
                          x={mid.x - rel.label.length * 3.5}
                          y={mid.y - 9}
                          width={rel.label.length * 7 + 6}
                          height={18}
                          rx={4}
                          fill="white"
                          stroke={stroke}
                          strokeWidth={0.8}
                          opacity={0.92}
                        />
                        <text
                          x={mid.x}
                          y={mid.y + 4}
                          textAnchor="middle"
                          fontSize={10}
                          fill={inWorkflow ? wfColor : '#64748b'}
                          fontFamily="sans-serif"
                          fontWeight={inWorkflow ? 600 : 400}
                        >
                          {rel.label}
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}
            </g>
          </svg>

          {/* ── Nodes (HTML for rich styling) ── */}
          <div
            className="absolute inset-0 overflow-visible"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}
          >
            {/* Category group backgrounds */}
            {Object.entries(ENTITY_CATEGORIES).map(([category, config]) => {
              const catNodes = visibleEntities.filter((e) => e.category === category)
              if (catNodes.length === 0) return null
              const xs = catNodes.map((n) => (positions[n.id]?.x ?? n.x))
              const ys = catNodes.map((n) => (positions[n.id]?.y ?? n.y))
              const minX = Math.min(...xs) - 16
              const minY = Math.min(...ys) - 32
              const maxX = Math.max(...xs) + NODE_W + 16
              const maxY = Math.max(...ys) + NODE_H + 16

              return (
                <div
                  key={category}
                  className="absolute rounded-xl border-2 pointer-events-none"
                  style={{
                    left: minX,
                    top: minY,
                    width: maxX - minX,
                    height: maxY - minY,
                    backgroundColor: 'transparent',
                    borderColor: config.color + '44',
                  }}
                >
                  <span
                    className="absolute top-1.5 right-3 text-[11px] font-bold tracking-wide"
                    style={{ color: config.color }}
                  >
                    {category}
                  </span>
                </div>
              )
            })}

            {/* Nodes */}
            {visibleEntities.map((entity) => {
              const pos = positions[entity.id] ?? { x: entity.x, y: entity.y }
              const color = catColor(entity.category)
              const inWf = isNodeInWorkflow(entity.id)
              const isSelected = selectedEntity === entity.id
              const isHovered = hoveredEntity === entity.id
              const dimmed = activeWorkflow && !inWf
              const isDraggingThis = nodeDragRef.current.active && nodeDragRef.current.id === entity.id

              return (
                <div
                  key={entity.id}
                  data-node="true"
                  className={`absolute flex items-center gap-2 px-3 py-2 rounded-xl shadow-sm border transition-all duration-150 ${
                    !entity.hasAccess && !showAll ? 'opacity-40' : ''
                  }`}
                  style={{
                    left: pos.x,
                    top: pos.y,
                    width: NODE_W,
                    height: NODE_H,
                    backgroundColor: inWf ? color : 'white',
                    color: inWf ? 'white' : '#1e293b',
                    borderColor: isSelected
                      ? '#14b8a6'
                      : inWf
                      ? color + 'cc'
                      : isHovered
                      ? color
                      : '#e2e8f0',
                    boxShadow: isSelected
                      ? `0 0 0 3px #14b8a640, 0 4px 12px ${color}30`
                      : isDraggingThis
                      ? `0 12px 32px ${color}40`
                      : isHovered
                      ? `0 4px 16px ${color}30`
                      : '0 1px 4px rgba(0,0,0,0.08)',
                    opacity: dimmed ? 0.25 : 1,
                    cursor: isDraggingThis ? 'grabbing' : 'grab',
                    transform: isDraggingThis ? 'scale(1.06)' : isHovered && !isDraggingThis ? 'scale(1.03)' : 'scale(1)',
                    zIndex: isDraggingThis ? 100 : isSelected ? 50 : 1,
                    userSelect: 'none',
                    willChange: 'transform',
                    transition: isDraggingThis ? 'box-shadow 0.1s, border-color 0.1s' : 'all 0.15s',
                  }}
                  onPointerDown={(e) => handleNodePointerDown(e, entity.id)}
                  onClick={(e) => handleNodeClick(e, entity)}
                  onDoubleClick={() => handleNodeDoubleClick(entity)}
                  onMouseEnter={() => setHoveredEntity(entity.id)}
                  onMouseLeave={() => setHoveredEntity(null)}
                >
                  {/* Category colour pill */}
                  <div
                    className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: inWf ? 'rgba(255,255,255,0.7)' : color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate leading-tight ${inWf ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                      {entity.label}
                    </p>
                    {entity.description && (
                      <p className={`text-[10px] truncate leading-tight mt-0.5 ${inWf ? 'text-white/70' : 'text-slate-400'}`}>
                        {entity.description}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {entity.hasAccess ? (
                      <Unlock className={`w-3 h-3 ${inWf ? 'text-white/80' : 'text-teal-500'}`} />
                    ) : (
                      <Lock className={`w-3 h-3 ${inWf ? 'text-white/60' : 'text-slate-300'}`} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Mini status bar ── */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <Move className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] text-slate-500">
                {translateUiText(language as Language, 'اسحب للتنقل')} • {translateUiText(language as Language, 'انقر مرتين للفتح')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <MousePointer2 className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] text-slate-500">
                {visibleEntities.length} {translateUiText(language as Language, 'كيان')}
              </span>
            </div>
          </div>
        </div>

        {/* ── Legend ── */}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Unlock className="w-3.5 h-3.5 text-teal-500" />
            <span>{translateUiText(language as Language, 'متاح')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-300" />
            <span>{translateUiText(language as Language, 'مقيد')}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="28" height="8">
              <line x1="0" y1="4" x2="28" y2="4" stroke="#94a3b8" strokeWidth="1.5" />
              <polygon points="22,1 28,4 22,7" fill="#94a3b8" />
            </svg>
            <span>{translateUiText(language as Language, 'تدفق عمل')}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="28" height="8">
              <line x1="0" y1="4" x2="28" y2="4" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 3" />
              <polygon points="22,1 28,4 22,7" fill="#cbd5e1" />
            </svg>
            <span>{translateUiText(language as Language, 'مرجع')}</span>
          </div>
          {Object.entries(ENTITY_CATEGORIES).map(([cat, cfg]) => (
            <div key={cat} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
              <span>{cat}</span>
            </div>
          ))}
        </div>
      </div>
    </LocalizedContent>
  )
}
