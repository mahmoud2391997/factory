'use client'

import { useState, useMemo, useRef, useEffect, useCallback, useId, type PointerEvent as ReactPointerEvent } from 'react'
import { Lock, Unlock, ZoomIn, ZoomOut, RefreshCw, X, Maximize2, Minimize2, Move, Search, ArrowUpRight, Focus, Network, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { NAV_CONFIG, canAccessPage, type NavPage } from '@/lib/nav/config'
import { canSeeEntity } from '@/lib/erp-routes'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/language-provider'
import { translateUiText, type Language } from '@/lib/i18n/translations'
import { fitMap, zoomAt, mapEdge, MAP_NODE_WIDTH as NODE_W, MAP_NODE_HEIGHT as NODE_H, type MapViewport } from '@/lib/nav/map-geometry'

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
  language?: Language
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
    nodes: ['material', 'inventoryBalance', 'inventoryTransaction', 'inventoryReports'],
    color: '#10b981',
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


export function SystemMap({ permissions, language: requestedLanguage }: SystemMapProps) {
  const router = useRouter()
  const { language: currentLanguage } = useLanguage()
  const language = requestedLanguage ?? currentLanguage
  const ui = (text: string) => translateUiText(language, text)
  const markerId = useId().replace(/:/g, '')
  const canvasRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<MapViewport>({ zoom: 0.6, pan: { x: 40, y: 40 } })
  const viewRef = useRef(view)
  const overviewPositions = useRef<Record<string, Vec2> | null>(null)
  const [positions, setPositions] = useState<Record<string, Vec2>>({})
  const posRef = useRef(positions)
  const [showAll, setShowAll] = useState(false)
  const [showLabels, setShowLabels] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [workflowId, setWorkflowId] = useState<string | null>('purchasing')
  const [query, setQuery] = useState('')
  const [dragging, setDragging] = useState<string | null>(null)
  const drag = useRef<{ pointerId: number; id: string | null; start: Vec2; origin: Vec2; moved: boolean } | null>(null)
  const wasDragged = useRef(false)
  const frame = useRef<number | null>(null)

  const entities = useMemo(() => {
    const pages = new Map<string, NavPage>()
    for (const w of NAV_CONFIG.workspaces) for (const s of w.sections) for (const p of s.pages) {
      if (!pages.has(p.entityKey) || p.canonical !== false) pages.set(p.entityKey, p)
      pages.set(p.id, p)
    }
    const result: EntityNode[] = []
    // Categories use equal-height rows sized for the largest group to prevent overlap.
    Object.entries(ENTITY_CATEGORIES).forEach(([category, config], index) => {
      config.entities.forEach((id, i) => {
        const page = pages.get(id)
        if (!page) return
        result.push({ id, label: page.label, description: page.description, href: page.href,
          hasAccess: canAccessPage(page, permissions) || canSeeEntity(permissions, page.entityKey),
          permissions: page.permission, type: 'entity', category,
          x: (index % 3) * 520 + (i % 2) * 232 + 40,
          y: Math.floor(index / 3) * 560 + Math.floor(i / 2) * 96 + 70,
        })
      })
    })
    return result
  }, [permissions])
  const activeWorkflow = WORKFLOW_PATHS.find(w => w.id === workflowId)
  const visible = useMemo(() => entities.filter(n => (showAll || n.hasAccess) && (!activeWorkflow || activeWorkflow.nodes.includes(n.id))), [entities, showAll, activeWorkflow])
  const ids = useMemo(() => new Set(visible.map(n => n.id)), [visible])
  const selectedNode = visible.find(n => n.id === selected)
  const matching = new Set(visible.filter(n => `${ui(n.label)} ${ui(n.category)} ${ui(n.description)}`.toLocaleLowerCase(language).includes(query.toLocaleLowerCase(language).trim())).map(n => n.id))
  const connected = new Set(selected ? [selected, ...ENTITY_RELATIONS.flatMap(r => r.from === selected ? [r.to] : r.to === selected ? [r.from] : [])] : [])
  const position = (node: EntityNode) => positions[node.id] ?? node

  const updateView = useCallback((next: MapViewport) => { viewRef.current = next; setView(next) }, [])
  const schedule = useCallback(() => {
    if (frame.current !== null) return
    frame.current = requestAnimationFrame(() => {
      frame.current = null
      setPositions({ ...posRef.current })
      setView({ ...viewRef.current })
    })
  }, [])
  const fit = useCallback((nodes: EntityNode[] = visible) => {
    const el = canvasRef.current
    if (!el) return
    updateView(fitMap(nodes.map(n => posRef.current[n.id] ?? n), el.clientWidth, el.clientHeight))
  }, [visible, updateView])

  useEffect(() => {
    const next = Object.fromEntries(entities.map(n => [n.id, posRef.current[n.id] ?? { x: n.x, y: n.y }]))
    if (!Object.keys(posRef.current).length && activeWorkflow) {
      overviewPositions.current = { ...next }
      const columns = (canvasRef.current?.clientWidth ?? 800) < 560 ? 1 : 2
      activeWorkflow.nodes.filter(id => next[id]).forEach((id,i) => {const row=Math.floor(i/columns);next[id]={x:40+(columns===1?0:row%2?1-i%2:i%2)*280,y:70+row*120}})
    }
    posRef.current = next
    setPositions(next)
  }, [entities])
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const observer = new ResizeObserver(() => fit())
    observer.observe(el)
    return () => observer.disconnect()
  }, [fit, isFullscreen])
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const wheel = (event: WheelEvent) => {
      event.preventDefault()
      if (drag.current) return
      const rect = el.getBoundingClientRect()
      viewRef.current = zoomAt(viewRef.current, { x: event.clientX - rect.left, y: event.clientY - rect.top }, viewRef.current.zoom * Math.exp(-event.deltaY * 0.002))
      schedule()
    }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => el.removeEventListener('wheel', wheel)
  }, [schedule])
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setIsFullscreen(false); setSelected(null); drag.current = null; setDragging(null) }
    }
    window.addEventListener('keydown', escape)
    return () => { window.removeEventListener('keydown', escape); if (frame.current !== null) cancelAnimationFrame(frame.current) }
  }, [])
  useEffect(() => {
    if (!isFullscreen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [isFullscreen])

  const startDrag = (event: ReactPointerEvent<HTMLElement>, node?: EntityNode) => {
    if (event.button !== 0 || drag.current) return
    if (!node && (event.target as HTMLElement).closest('button,input,a,[data-node]')) return
    event.stopPropagation()
    wasDragged.current = false
    drag.current = { pointerId: event.pointerId, id: node?.id ?? null, start: { x: event.clientX, y: event.clientY }, origin: node ? { ...(posRef.current[node.id] ?? node) } : { ...viewRef.current.pan }, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(node?.id ?? 'canvas')
  }
  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    const dx = event.clientX - current.start.x, dy = event.clientY - current.start.y
    if (Math.hypot(dx, dy) < 4 && !current.moved) return
    current.moved = true
    wasDragged.current = true
    if (current.id) posRef.current = { ...posRef.current, [current.id]: { x: current.origin.x + dx / viewRef.current.zoom, y: current.origin.y + dy / viewRef.current.zoom } }
    else viewRef.current = { ...viewRef.current, pan: { x: current.origin.x + dx, y: current.origin.y + dy } }
    schedule()
  }
  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return
    drag.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    setDragging(null)
    schedule()
  }
  const zoom = (factor: number) => {
    const el = canvasRef.current
    if (el) updateView(zoomAt(viewRef.current, { x: el.clientWidth / 2, y: el.clientHeight / 2 }, viewRef.current.zoom * factor))
  }
  const reset = () => {
    posRef.current = Object.fromEntries(entities.map(n => [n.id, { x: n.x, y: n.y }]))
    setPositions(posRef.current)
    overviewPositions.current = null
    setSelected(null); setWorkflowId(null); setQuery(''); fit(entities.filter(n => showAll || n.hasAccess))
  }
  const chooseWorkflow = (id: string) => {
    const next = workflowId === id ? null : id
    if (!workflowId) overviewPositions.current = { ...posRef.current }
    setWorkflowId(next); setSelected(null); setQuery('')
    const path = WORKFLOW_PATHS.find(w => w.id === next)
    if (path) {
      const nodes = entities.filter(n => (showAll || n.hasAccess) && path.nodes.includes(n.id)).sort((a,b) => path.nodes.indexOf(a.id)-path.nodes.indexOf(b.id))
      const nextPositions = { ...posRef.current }
      const columns = (canvasRef.current?.clientWidth ?? 800) < 560 ? 1 : 2
      nodes.forEach((n,i) => { const row = Math.floor(i/columns); nextPositions[n.id] = { x: 40 + (columns===1?0:row % 2 ? 1 - i%2 : i%2)*280, y: 70+row*120 } })
      posRef.current = nextPositions; setPositions(nextPositions); fit(nodes)
    } else {
      if (overviewPositions.current) {posRef.current = overviewPositions.current; setPositions(posRef.current); overviewPositions.current = null}
      fit(entities.filter(n => showAll || n.hasAccess))
    }
  }
  const control = 'inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'

  return <section data-testid="system-map" className={`min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 ${isFullscreen ? 'fixed inset-3 z-50 flex flex-col shadow-2xl' : ''}`}>
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-4 md:p-5 dark:border-slate-800">
      <div className="flex items-center gap-3"><div className="rounded-xl bg-teal-50 p-3 text-teal-600 dark:bg-teal-950"><Network size={22} /></div><div><h2 className="text-lg font-semibold text-slate-900 dark:text-white">{ui('خريطة الكيانات والعلاقات')}</h2><p className="mt-1 text-xs text-slate-500">{ui('استكشف الروابط بين أقسام المصنع')}</p></div></div>
      <div className="flex flex-wrap items-center gap-2">
        <button className={control} aria-pressed={showAll} onClick={() => setShowAll(!showAll)}>{showAll ? <Unlock size={14} /> : <Lock size={14} />}{ui(showAll ? 'عرض المتاح فقط' : 'عرض الكل')}</button>
        <button className={control} aria-label={ui('إعادة تعيين')} onClick={reset}><RefreshCw size={15} /></button>
        <button className={control} aria-label={ui(isFullscreen ? 'إغلاق ملء الشاشة' : 'ملء الشاشة')} aria-pressed={isFullscreen} onClick={() => setIsFullscreen(!isFullscreen)}>{isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button>
      </div>
    </header>
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/30">
      <span className="px-2 text-xs font-medium text-slate-500">{ui('الدورات')}</span>
      <button className={control} aria-pressed={!workflowId} onClick={() => {if(workflowId) chooseWorkflow(workflowId); else fit()}}>{ui('الكل')}</button>
      {WORKFLOW_PATHS.map(w => <button key={w.id} className={`${control} ${workflowId === w.id ? '!border-teal-500 !bg-teal-50 !text-teal-800 dark:!bg-teal-950 dark:!text-teal-100' : ''}`} aria-pressed={workflowId === w.id} onClick={() => chooseWorkflow(w.id)}><span className="h-2 w-2 rounded-full" style={{background: w.color}} />{ui(w.label)}</button>)}
    </div>
    <div className={`flex min-h-0 flex-col xl:flex-row ${isFullscreen ? 'flex-1' : ''}`}>
      <div className="relative min-w-0 flex-1">
        <div className="absolute start-3 top-3 z-10 flex max-w-[calc(100%-24px)] items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/95"><Search size={16} className="shrink-0 text-slate-400"/><input aria-label={ui('البحث في الخريطة')} placeholder={ui('البحث في الخريطة')} value={query} onChange={e => setQuery(e.target.value)} className="h-10 w-44 min-w-0 bg-transparent text-sm outline-none sm:w-56" />{query && <button aria-label={ui('مسح البحث')} onClick={() => setQuery('')}><X size={14}/></button>}</div>
        <div ref={canvasRef} data-testid="map-canvas" dir="ltr" tabIndex={0} aria-label={ui('خريطة تفاعلية')} className={`relative touch-none select-none overflow-hidden bg-slate-50 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500 dark:bg-[#111c2b] ${isFullscreen ? 'h-full min-h-[300px]' : 'h-[620px]'}`} style={{cursor: dragging === 'canvas' ? 'grabbing' : 'grab', backgroundImage: 'radial-gradient(circle, #94a3b844 1px, transparent 1px)', backgroundSize: `${24*view.zoom}px ${24*view.zoom}px`, backgroundPosition: `${view.pan.x}px ${view.pan.y}px`}} onPointerDown={e => startDrag(e)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag} onKeyDown={e => {
          if (e.target !== e.currentTarget) return
          const offsets: Record<string, Vec2> = { ArrowLeft: {x:40,y:0}, ArrowRight: {x:-40,y:0}, ArrowUp: {x:0,y:40}, ArrowDown: {x:0,y:-40} }
          const offset=offsets[e.key]; if(offset){e.preventDefault(); updateView({...viewRef.current,pan:{x:viewRef.current.pan.x+offset.x,y:viewRef.current.pan.y+offset.y}})}
          if(e.key==='+'||e.key==='='){e.preventDefault();zoom(1.2)} if(e.key==='-'){e.preventDefault();zoom(1/1.2)} if(e.key==='0'){e.preventDefault();fit()}
        }}>
          {/* Everything shares one transform; movement never uses CSS position transitions. */}
          <div className="absolute left-0 top-0" style={{transform:`translate3d(${view.pan.x}px,${view.pan.y}px,0) scale(${view.zoom})`,transformOrigin:'0 0',willChange:dragging?'transform':undefined}}>
            {Object.entries(ENTITY_CATEGORIES).map(([category,cfg]) => {
              const nodes=visible.filter(n=>n.category===category); if(!nodes.length)return null
              const points=nodes.map(position), x=Math.min(...points.map(p=>p.x))-18,y=Math.min(...points.map(p=>p.y))-38
              const width=Math.max(...points.map(p=>p.x))+NODE_W+18-x,height=Math.max(...points.map(p=>p.y))+NODE_H+18-y
              return <div key={category} className="pointer-events-none absolute rounded-2xl border" style={{left:x,top:y,width,height,borderColor:`${cfg.color}35`,background:`${cfg.color}06`}}><span className="absolute start-4 top-2 text-xs font-semibold" style={{color:cfg.color}}>{ui(category)} <span className="opacity-60">· {nodes.length}</span></span></div>
            })}
            <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width="1" height="1" aria-hidden="true"><defs><marker id={markerId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 Z" fill="context-stroke"/></marker></defs>
              {ENTITY_RELATIONS.map((relation,i) => {
                if(!ids.has(relation.from)||!ids.has(relation.to))return null
                const from=visible.find(n=>n.id===relation.from)!,to=visible.find(n=>n.id===relation.to)!
                const geometry=mapEdge(position(from),position(to))
                const workflowEdge=!!activeWorkflow && activeWorkflow.nodes.includes(from.id)&&activeWorkflow.nodes.includes(to.id)
                const related=!!selected&&(relation.from===selected||relation.to===selected)
                const dim=(!!activeWorkflow&&!workflowEdge)||(!!selected&&!related)||(!!query&& !matching.has(from.id)&&!matching.has(to.id))
                const color=workflowEdge?activeWorkflow!.color:related?'#0d9488':'#94a3b8'
                return <g key={i} opacity={dim?0.1:workflowEdge||related?1:0.5}><path d={geometry.path} fill="none" stroke={color} strokeWidth={workflowEdge||related?2.5:1.4} strokeDasharray={relation.type==='reference'?'5 5':undefined} markerEnd={`url(#${markerId})`}/>{(showLabels||related||workflowEdge)&&<g><rect x={geometry.label.x-62} y={geometry.label.y-10} width={124} height={20} rx={6} className="fill-white dark:fill-slate-800"/><text x={geometry.label.x} y={geometry.label.y+4} textAnchor="middle" fontSize="11" fill={color}>{ui(relation.label)}</text></g>}</g>
              })}
            </svg>
            {visible.map(node => {
              const p=position(node),cfg=ENTITY_CATEGORIES[node.category as keyof typeof ENTITY_CATEGORIES],active=selected===node.id
              const inWorkflow=activeWorkflow?.nodes.includes(node.id),dim=(!!activeWorkflow&&!inWorkflow)||(!!query&&!matching.has(node.id))||(!!selected&&!connected.has(node.id))
              const step=activeWorkflow?activeWorkflow.nodes.indexOf(node.id)+1:0
              return <button type="button" key={node.id} data-node={node.id} aria-label={ui(node.label)} aria-pressed={active} dir={language==='ar'?'rtl':'ltr'} className="absolute flex items-center gap-3 rounded-xl border bg-white px-3 text-start shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:bg-slate-800" style={{width:NODE_W,height:NODE_H,transform:`translate3d(${p.x}px,${p.y}px,0)`,borderColor:active||inWorkflow?cfg.color:'#94a3b844',boxShadow:dragging===node.id?'0 16px 32px #0f172a24':active?`0 0 0 3px ${cfg.color}22`:'0 2px 6px #0f172a08',opacity:dim?0.2:1,zIndex:dragging===node.id?20:active?10:2,cursor:dragging===node.id?'grabbing':'grab',transition:'border-color 120ms, box-shadow 120ms',willChange:dragging===node.id?'transform':undefined}} onPointerDown={e=>startDrag(e,node)} onClick={()=>{if(!wasDragged.current)setSelected(active?null:node.id)}} onDoubleClick={()=>{if(!wasDragged.current&&node.hasAccess)router.push(node.href)}} onKeyDown={e=>{
                if(!e.key.startsWith('Arrow'))return
                e.preventDefault();e.stopPropagation();const amount=e.shiftKey?40:10
                const next={...p};if(e.key==='ArrowLeft')next.x-=amount;if(e.key==='ArrowRight')next.x+=amount;if(e.key==='ArrowUp')next.y-=amount;if(e.key==='ArrowDown')next.y+=amount
                posRef.current={...posRef.current,[node.id]:next};schedule()
              }}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold" style={{color:cfg.color,background:`${cfg.color}12`}}>{step>0?step:<Network size={16}/>}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{ui(node.label)}</span><span className="mt-1 block truncate text-[10px] text-slate-500 dark:text-slate-400">{ui(node.description)}</span></span>
                {node.hasAccess?<Unlock size={12} className="shrink-0 text-teal-500"/>:<Lock size={12} className="shrink-0 text-slate-400"/>}
              </button>
            })}
          </div>
          {!visible.length&&<p className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-slate-500">{ui('لا توجد تدفقات عمل متاحة مع الصلاحيات الحالية')}</p>}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-md dark:border-slate-700 dark:bg-slate-800" onPointerDown={e=>e.stopPropagation()}>
            <button className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label={ui('تصغير')} onClick={()=>zoom(1/1.2)}><ZoomOut size={16}/></button><span className="w-12 text-center text-xs tabular-nums text-slate-500">{Math.round(view.zoom*100)}%</span><button className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label={ui('تكبير')} onClick={()=>zoom(1.2)}><ZoomIn size={16}/></button><span className="mx-1 h-5 w-px bg-slate-200"/><button className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label={ui('احتواء الخريطة')} onClick={()=>fit()}><Focus size={16}/></button><button className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label={ui('تبديل تسميات الروابط')} aria-pressed={showLabels} onClick={()=>setShowLabels(!showLabels)}>{showLabels?<Eye size={16}/>:<EyeOff size={16}/>}</button>
          </div>
        </div>
      </div>
      <aside className={`shrink-0 border-t border-slate-100 bg-white p-4 xl:w-64 xl:border-s xl:border-t-0 dark:border-slate-800 dark:bg-slate-900 ${isFullscreen?'max-h-48 overflow-y-auto xl:max-h-none':''}`}>
        {selectedNode?<><div className="flex items-center justify-between"><span className="text-xs font-medium text-teal-600">{ui(selectedNode.category)}</span><button aria-label={ui('إغلاق')} onClick={()=>setSelected(null)}><X size={16}/></button></div><h3 className="mt-3 font-semibold">{ui(selectedNode.label)}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{ui(selectedNode.description)}</p><button disabled={!selectedNode.hasAccess} className={`${control} mt-4 w-full disabled:opacity-40`} onClick={()=>router.push(selectedNode.href)}>{ui(selectedNode.hasAccess?'فتح الصفحة':'مقيد')}<ArrowUpRight size={15}/></button><h4 className="mt-6 text-xs font-semibold text-slate-500">{ui('روابط ذات صلة')}</h4><div className="mt-2 space-y-1">{visible.filter(n=>n.id!==selectedNode.id&&connected.has(n.id)).map(n=><button key={n.id} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-start text-xs hover:bg-slate-50 dark:hover:bg-slate-800" onClick={()=>{setSelected(n.id);fit([n,selectedNode])}}>{ui(n.label)}<ChevronRight size={12}/></button>)}</div></>:<><span className="text-xs font-medium uppercase tracking-wide text-teal-600">{ui(activeWorkflow?'تدفق عمل':'نظرة عامة')}</span><h3 className="mt-3 font-semibold">{ui(activeWorkflow?.label??'كيف ترتبط بيانات المصنع؟')}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{ui('اختر دورة لتتبع خطواتها أو اختر عقدة لاستكشاف روابطها.')}</p>{activeWorkflow?<ol className="mt-4 space-y-2">{activeWorkflow.nodes.map((id,i)=>{const node=visible.find(n=>n.id===id);return <li key={id}><button disabled={!node} onClick={()=>{setSelected(id);if(node)fit([node])}} className="flex w-full items-center gap-3 rounded-lg bg-slate-50 p-2 text-start text-xs disabled:opacity-40 dark:bg-slate-800"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white font-medium text-teal-700 dark:bg-slate-700 dark:text-teal-200">{i+1}</span>{ui(node?.label??entities.find(n=>n.id===id)?.label??id)}</button></li>})}</ol>:<div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><strong className="text-lg tabular-nums">{visible.length}</strong><p className="mt-1 text-xs text-slate-500">{ui('كيان')}</p></div><div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><strong className="text-lg tabular-nums">{ENTITY_RELATIONS.filter(r=>ids.has(r.from)&&ids.has(r.to)).length}</strong><p className="mt-1 text-xs text-slate-500">{ui('روابط')}</p></div></div>}</>}
        {query&&<p role="status" className="mt-4 text-xs text-slate-500">{matching.size} {ui('نتائج البحث')}</p>}
        <div className="mt-6 border-t border-slate-100 pt-4 text-xs leading-6 text-slate-500 dark:border-slate-800"><p className="flex items-center gap-2"><Move size={14}/>{ui('اسحب للتنقل')}</p><p>{ui('اسحب العقد لإعادة ترتيبها')}</p><p>{ui('انقر مرتين للفتح')}</p><p>{ui('استخدم الأسهم لتحريك العقدة المحددة')}</p><div className="mt-3 flex items-center gap-2"><span className="w-6 border-t-2 border-teal-600"/>{ui('تدفق عمل')}</div><div className="flex items-center gap-2"><span className="w-6 border-t-2 border-dashed border-slate-400"/>{ui('مرجع')}</div></div>
      </aside>
    </div>
  </section>
}
