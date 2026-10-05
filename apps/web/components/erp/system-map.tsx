'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Lock, Unlock, ZoomIn, ZoomOut, RefreshCw, ArrowRight, X, Maximize2, Minimize2, MousePointer2 } from 'lucide-react'
import { NAV_CONFIG, canAccessPage, type NavWorkspace, type NavSection, type NavPage } from '@/lib/nav/config'
import { canSeeEntity } from '@/lib/erp-routes'
import { useRouter } from 'next/navigation'

import { LocalizedContent } from '@/lib/i18n/localized-content'
import { translateUiText } from '@/lib/i18n/translations'
import type { Language } from '@/lib/i18n/translations'

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

interface SystemMapProps {
  permissions: string[]
  language?: string
}

// Entity definitions with categories
const ENTITY_CATEGORIES = {
  'المشتريات': {
    color: '#3b82f6',
    entities: ['supplier', 'purchaseRequest', 'purchaseOrder', 'goodsReceipt', 'supplierCommunication']
  },
  'المخزون': {
    color: '#10b981',
    entities: ['material', 'product', 'inventoryOverview', 'stockTransfer', 'stockAdjustment', 'barcode']
  },
  'الإنتاج': {
    color: '#f59e0b',
    entities: ['recipe', 'productionOrder', 'productionLot', 'scaleReading', 'machine']
  },
  'المبيعات': {
    color: '#8b5cf6',
    entities: ['customer', 'salesInvoice', 'salesPayment', 'distribution', 'invoiceDelivery']
  },
  'المالية': {
    color: '#ef4444',
    entities: ['account', 'journalEntry', 'expense', 'bankTransaction', 'obligation']
  },
  'الموارد البشرية': {
    color: '#ec4899',
    entities: ['employee', 'attendance', 'payroll', 'leaveRequest']
  },
  'الجودة': {
    color: '#06b6d4',
    entities: ['qualitySample', 'qualityHold']
  },
  'الأسطول': {
    color: '#6366f1',
    entities: ['fleet', 'fleetFuel', 'fleetTrips']
  },
}

// Entity relationships and workflows
const ENTITY_RELATIONS: EntityRelation[] = [
  // Purchasing workflow
  { from: 'supplier', to: 'purchaseRequest', label: 'طلب شراء', type: 'workflow' },
  { from: 'purchaseRequest', to: 'purchaseOrder', label: 'اعتماد', type: 'workflow' },
  { from: 'purchaseOrder', to: 'goodsReceipt', label: 'استلام', type: 'workflow' },
  { from: 'goodsReceipt', to: 'material', label: 'إضافة للمخزون', type: 'workflow' },
  { from: 'supplier', to: 'supplierCommunication', label: 'مراسلة', type: 'reference' },

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

  // Inventory references
  { from: 'material', to: 'stockTransfer', label: 'تحويل', type: 'reference' },
  { from: 'material', to: 'stockAdjustment', label: 'تسوية', type: 'reference' },
  { from: 'product', to: 'stockTransfer', label: 'تحويل', type: 'reference' },
]

// Workflow paths
const WORKFLOW_PATHS: WorkflowPath[] = [
  {
    id: 'purchasing',
    label: 'دورة المشتريات',
    nodes: ['supplier', 'purchaseRequest', 'purchaseOrder', 'goodsReceipt', 'material'],
    color: '#3b82f6'
  },
  {
    id: 'production',
    label: 'دورة الإنتاج',
    nodes: ['material', 'recipe', 'productionOrder', 'scaleReading', 'productionLot', 'product', 'qualitySample'],
    color: '#f59e0b'
  },
  {
    id: 'sales',
    label: 'دورة المبيعات',
    nodes: ['customer', 'salesInvoice', 'invoiceDelivery', 'salesPayment', 'distribution'],
    color: '#8b5cf6'
  },
  {
    id: 'financial',
    label: 'الدورة المالية',
    nodes: ['expense', 'journalEntry', 'account', 'bankTransaction', 'obligation'],
    color: '#ef4444'
  },
]

export function SystemMap({ permissions, language = 'ar' }: SystemMapProps) {
  const router = useRouter()
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null)
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [draggingEntity, setDraggingEntity] = useState<string | null>(null)
  const [entityPositions, setEntityPositions] = useState<Record<string, { x: number; y: number }>>({})
  const canvasRef = useRef<HTMLDivElement>(null)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const entities = useMemo(() => {
    const nodes: EntityNode[] = []
    const pageMap = new Map<string, NavPage>()

    // Build page map from NAV_CONFIG
    for (const workspace of NAV_CONFIG.workspaces) {
      for (const section of workspace.sections) {
        for (const page of section.pages) {
          pageMap.set(page.entityKey, page)
        }
      }
    }

    // Create entity nodes
    for (const [category, config] of Object.entries(ENTITY_CATEGORIES)) {
      config.entities.forEach((entityKey, index) => {
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

    // Position nodes with very generous spacing to prevent overlaps
    const categoryPositions: Record<string, { x: number; y: number }> = {}
    const categoryOrder = Object.keys(ENTITY_CATEGORIES)
    const cols = isMobile ? 2 : 3  // Reduced columns for more space
    const spacingX = isMobile ? 280 : 450  // Much larger horizontal spacing
    const spacingY = isMobile ? 300 : 400  // Much larger vertical spacing

    categoryOrder.forEach((category, catIndex) => {
      const col = catIndex % cols
      const row = Math.floor(catIndex / cols)
      categoryPositions[category] = {
        x: col * spacingX + (isMobile ? 160 : 250),
        y: row * spacingY + (isMobile ? 160 : 250),
      }
    })

    nodes.forEach((node) => {
      const catPos = categoryPositions[node.category]
      const categoryEntities = nodes.filter((n) => n.category === node.category)
      const index = categoryEntities.findIndex((n) => n.id === node.id)
      const catCols = isMobile ? 1 : 2
      const catCol = index % catCols
      const catRow = Math.floor(index / catCols)

      node.x = catPos.x + catCol * (isMobile ? 240 : 350)
      node.y = catPos.y + catRow * (isMobile ? 180 : 220)
    })

    return nodes
  }, [permissions, isMobile])

  const visibleEntities = useMemo(() => {
    return showAll ? entities : entities.filter((e) => e.hasAccess)
  }, [entities, showAll])

  // Update entity positions when they change
  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {}
    entities.forEach((entity) => {
      positions[entity.id] = { x: entity.x, y: entity.y }
    })
    setEntityPositions(positions)
  }, [entities])

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Only start drag if clicking on canvas background
    if (e.target === canvasRef.current) {
      e.preventDefault()
      setIsDragging(true)
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      setDragStart({ x: clientX - pan.x, y: clientY - pan.y })
    }
  }, [pan])

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isDragging) {
      e.preventDefault()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      setPan({ x: clientX - dragStart.x, y: clientY - dragStart.y })
    }
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDraggingEntity(null)
  }, [])

  const handleEntityDragStart = useCallback((e: React.MouseEvent, entityId: string) => {
    e.stopPropagation()
    e.preventDefault()
    setDraggingEntity(entityId)
  }, [])

  const handleEntityDrag = useCallback((e: React.MouseEvent) => {
    if (draggingEntity) {
      e.preventDefault()
      const clientX = e.clientX
      const clientY = e.clientY
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = (clientX - rect.left - pan.x) / zoom
      const y = (clientY - rect.top - pan.y) / zoom

      setEntityPositions((prev) => ({
        ...prev,
        [draggingEntity]: { x, y },
      }))
    }
  }, [draggingEntity, pan, zoom])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom((prev) => Math.max(0.5, Math.min(2, prev + delta)))
  }, [])

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5))
  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setSelectedEntity(null)
    setSelectedWorkflow(null)
    setIsFullscreen(false)
  }

  const handleEntityClick = (entity: EntityNode) => {
    if (entity.hasAccess) {
      router.push(entity.href)
    }
    setSelectedEntity(entity.id)
  }

  const handleWorkflowToggle = (workflowId: string) => {
    setSelectedWorkflow(selectedWorkflow === workflowId ? null : workflowId)
  }

  const isRTL = language === 'ar'

  return (
    <LocalizedContent>
      <div className={`w-full p-4 md:p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-6 gap-4">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {translateUiText(language as Language, 'خريطة الكيانات والعلاقات')}
            </h2>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
              {translateUiText(language as Language, 'خريطة تفاعلية توضح الكيانات وعلاقاتها وتدفقات العمل مع التحكم في الصلاحيات')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {showAll ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span className="hidden sm:inline">{showAll ? translateUiText(language as Language, 'عرض الكل') : translateUiText(language as Language, 'المسموح فقط')}</span>
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              disabled={zoom <= 0.5}
              title={translateUiText(language as Language, 'تصغير')}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              disabled={zoom >= 2}
              title={translateUiText(language as Language, 'تكبير')}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={translateUiText(language as Language, 'إعادة تعيين')}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={isFullscreen ? translateUiText(language as Language, 'إغلاق ملء الشاشة') : translateUiText(language as Language, 'ملء الشاشة')}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Workflow selector */}
        <div className="mb-4 flex flex-wrap gap-2">
          {WORKFLOW_PATHS.map((workflow) => (
            <button
              key={workflow.id}
              onClick={() => handleWorkflowToggle(workflow.id)}
              className={`px-3 py-1.5 text-xs md:text-sm rounded-full transition-colors ${
                selectedWorkflow === workflow.id
                  ? 'text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              style={
                selectedWorkflow === workflow.id
                  ? { backgroundColor: workflow.color }
                  : {}
              }
            >
              {translateUiText(language as Language, workflow.label)}
            </button>
          ))}
          {selectedWorkflow && (
            <button
              onClick={() => setSelectedWorkflow(null)}
              className="px-2 py-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              title={translateUiText(language as Language, 'إلغاء التحديد')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className={`relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-grab active:cursor-grabbing touch-none select-none ${isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-[600px] md:h-[1000px]'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          onWheel={handleWheel}
          style={{ userSelect: 'none' }}
        >
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}
          >
            {/* Draw relations */}
            {ENTITY_RELATIONS.map((rel, index) => {
              const fromNode = visibleEntities.find((e) => e.id === rel.from)
              const toNode = visibleEntities.find((e) => e.id === rel.to)
              if (!fromNode || !toNode) return null

              const fromPos = entityPositions[rel.from] || { x: fromNode.x, y: fromNode.y }
              const toPos = entityPositions[rel.to] || { x: toNode.x, y: toNode.y }

              const isHighlighted = selectedWorkflow
                ? WORKFLOW_PATHS.find((w) => w.id === selectedWorkflow)?.nodes.includes(rel.from) &&
                  WORKFLOW_PATHS.find((w) => w.id === selectedWorkflow)?.nodes.includes(rel.to)
                : false

              return (
                <g key={index}>
                  <line
                    x1={fromPos.x + (isMobile ? 60 : 80)}
                    y1={fromPos.y + 30}
                    x2={toPos.x}
                    y2={toPos.y + 30}
                    stroke={isHighlighted ? WORKFLOW_PATHS.find((w) => w.id === selectedWorkflow)?.color : '#cbd5e1'}
                    strokeWidth={isHighlighted ? 3 : 1.5}
                    strokeDasharray={rel.type === 'reference' ? '5,5' : 'none'}
                    opacity={isHighlighted ? 1 : 0.6}
                  />
                  <ArrowRight
                    x={toPos.x - 10}
                    y={toPos.y + 25}
                    size={isMobile ? 12 : 16}
                    fill={isHighlighted ? WORKFLOW_PATHS.find((w) => w.id === selectedWorkflow)?.color : '#94a3b8'}
                  />
                </g>
              )
            })}
          </svg>

          {/* Draw entities */}
          <div
            className="absolute inset-0"
            style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}
          >
            {visibleEntities.map((entity) => {
              const categoryColor = ENTITY_CATEGORIES[entity.category as keyof typeof ENTITY_CATEGORIES]?.color || '#64748b'
              const isSelected = selectedEntity === entity.id
              const isInWorkflow = selectedWorkflow
                ? WORKFLOW_PATHS.find((w) => w.id === selectedWorkflow)?.nodes.includes(entity.id)
                : false
              const pos = entityPositions[entity.id] || { x: entity.x, y: entity.y }
              const isDraggingThis = draggingEntity === entity.id

              return (
                <div
                  key={entity.id}
                  className={`absolute px-2 md:px-3 py-1.5 md:py-2 rounded-lg shadow-md transition-shadow cursor-pointer touch-manipulation ${
                    isSelected
                      ? 'ring-2 ring-teal-500 shadow-lg'
                      : 'hover:shadow-lg'
                  } ${isDraggingThis ? 'cursor-grabbing shadow-xl scale-105' : 'cursor-grab'} ${!entity.hasAccess && !showAll ? 'opacity-40' : ''}`}
                  style={{
                    left: pos.x,
                    top: pos.y,
                    backgroundColor: isInWorkflow ? categoryColor : '#f8fafc',
                    color: isInWorkflow ? '#ffffff' : '#1e293b',
                    minWidth: isMobile ? '130px' : '150px',
                    maxWidth: isMobile ? '160px' : '180px',
                    transition: isDraggingThis ? 'none' : 'all 0.2s',
                  }}
                  onClick={(e) => {
                    if (!isDraggingThis) handleEntityClick(entity)
                  }}
                  onMouseDown={(e) => handleEntityDragStart(e, entity.id)}
                  onMouseMove={handleEntityDrag}
                  onMouseUp={handleMouseUp}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: categoryColor }}
                    />
                    <span className="font-medium text-xs md:text-sm truncate flex-1">{entity.label}</span>
                    {!entity.hasAccess && !showAll && <Lock className="w-2.5 h-2.5 md:w-3 md:h-3 ml-auto flex-shrink-0" />}
                    {entity.hasAccess && <Unlock className="w-2.5 h-2.5 md:w-3 md:h-3 ml-auto text-teal-600 flex-shrink-0" />}
                  </div>
                  {entity.description && !isMobile && (
                    <div className="text-xs mt-0.5 opacity-80 line-clamp-1">{entity.description}</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Category labels */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}
          >
            {Object.entries(ENTITY_CATEGORIES).map(([category, config]) => {
              const categoryEntities = visibleEntities.filter((e) => e.category === category)
              if (categoryEntities.length === 0) return null

              const firstNode = categoryEntities[0]
              const pos = entityPositions[firstNode.id] || { x: firstNode.x, y: firstNode.y }

              return (
                <div
                  key={category}
                  className="absolute font-semibold text-xs md:text-sm"
                  style={{
                    left: pos.x,
                    top: pos.y - (isMobile ? 25 : 30),
                    color: config.color,
                  }}
                >
                  {category}
                </div>
              )
            })}
          </div>

          {/* Drag hint */}
          {isDragging && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white px-4 py-2 rounded-lg text-sm pointer-events-none">
              <MousePointer2 className="w-4 h-4 inline mr-2" />
              {translateUiText(language as Language, 'اسحب للتنقل')}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-3 md:gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Unlock className="w-3 md:w-4 h-3 md:h-4 text-teal-600 dark:text-teal-400" />
            <span>{translateUiText(language as Language, 'متاح للوصول')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-3 md:w-4 h-3 md:h-4 text-slate-400" />
            <span>{translateUiText(language as Language, 'مقيد بالصلاحيات')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 md:w-8 h-0.5 bg-slate-400" />
            <span>{translateUiText(language as Language, 'علاقة مرجعية')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 md:w-8 h-0.5 bg-slate-800" />
            <span>{translateUiText(language as Language, 'تدفق عمل')}</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="w-3 md:w-4 h-3 md:h-4 text-slate-400" />
            <span>{translateUiText(language as Language, 'اتجاه التدفق')}</span>
          </div>
        </div>
      </div>
    </LocalizedContent>
  )
}
