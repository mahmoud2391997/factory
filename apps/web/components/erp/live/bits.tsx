'use client'

import { createContext, isValidElement, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { Pencil, Trash2 } from 'lucide-react'

import Link from 'next/link'

import { LocalizedContent } from '@/lib/i18n/localized-content'
import { useLanguage } from '@/lib/i18n/language-provider'
import { translateUiText } from '@/lib/i18n/translations'
import { hrefForPageId } from '@/lib/erp-routes'

const PAGE_SIZE = 8
const DialogCloseContext = createContext<(() => void) | undefined>(undefined)

function cellText(cell: ReactNode): string {
  if (cell == null || typeof cell === 'boolean') return ''
  if (typeof cell === 'string' || typeof cell === 'number') return String(cell)
  if (Array.isArray(cell)) return cell.map((item) => cellText(item)).join(' ')
  if (isValidElement(cell)) return cellText((cell.props as { children?: ReactNode }).children)
  return ''
}

export function Card({
  title,
  hint,
  extra,
  children,
}: {
  title: string
  hint?: string
  extra?: ReactNode
  children: ReactNode
}) {
  const { language } = useLanguage()
  return (
    <section className="flex min-w-0 flex-col rounded-[12px] border border-[#e5e7eb] bg-white p-3 sm:p-5 shadow-sm">
      <div className="mb-4 flex min-w-0 flex-col flex-wrap gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-medium">{translateUiText(language, title)}</h3>
          {hint ? <p className="mt-1 text-sm text-[#6b7280]">{translateUiText(language, hint)}</p> : null}
        </div>
        {extra ? <LocalizedContent>{extra}</LocalizedContent> : null}
      </div>
      <LocalizedContent>{children}</LocalizedContent>
    </section>
  )
}

export function ExportLinks({ href }: { href: string }) {
  const [path, query = ''] = href.split('?', 2)
  const params = new URLSearchParams(query)
  const makeHref = (format: 'excel' | 'csv') => {
    const next = new URLSearchParams(params)
    next.set('format', format)
    return `${path}?${next.toString()}`
  }
  return (
    <div className="flex items-center gap-3 text-sm font-bold text-[#1e127c]">
      <a href={makeHref('excel')}>Excel</a>
      <a href={makeHref('csv')}>CSV</a>
    </div>
  )
}

export function DataTable({
  columns,
  rows,
  rowIds,
  rowActions,
  bulkActions,
  selectedIds: externalSelectedIds,
  onSelectionChange,
}: {
  columns: string[]
  rows: ReactNode[][]
  rowIds?: string[]
  rowActions?: (row: ReactNode[], rowIndex: number) => ReactNode
  bulkActions?: (selectedIds: string[], clearSelection: () => void) => ReactNode
  selectedIds?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
}) {
  const { language } = useLanguage()
  const filterId = useId()
  const selectId = useId()
  const [sort, setSort] = useState<{ index: number; dir: 'asc' | 'desc' } | null>(null)
  const [page, setPage] = useState(0)
  const [query, setQuery] = useState('')
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([])

  const selectedIds = externalSelectedIds ?? internalSelectedIds
  const updateSelected = (next: string[]) => {
    if (onSelectionChange) onSelectionChange(next)
    else setInternalSelectedIds(next)
  }

  const selectionActions = bulkActions?.(selectedIds, () => updateSelected([]))
  const selectable = Boolean(selectionActions)

  const effectiveIds = useMemo(
    () => rowIds ?? rows.map((_, i) => String(i)),
    [rowIds, rows],
  )

  const filtered = query.trim()
    ? rows.filter((row) => row.some((cell) => translateUiText(language, cellText(cell)).toLocaleLowerCase(language).includes(query.trim().toLocaleLowerCase(language))))
    : rows
  const sorted = [...filtered]
  if (sort) {
    const direction = sort.dir === 'asc' ? 1 : -1
    sorted.sort((a, b) => translateUiText(language, cellText(a[sort.index])).localeCompare(translateUiText(language, cellText(b[sort.index])), language, { numeric: true }) * direction)
  }
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const visible = sorted.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)
  const visibleIndexes = visible.map((row) => rows.indexOf(row))
  const visibleIds = visibleIndexes.map((idx) => effectiveIds[idx]!).filter(Boolean)
  const allFilteredIds = sorted.map((row) => effectiveIds[rows.indexOf(row)]!).filter(Boolean)

  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))

  const toggleSelectAllVisible = () => {
    const nextSet = new Set(selectedIds)
    if (allVisibleSelected) {
      visibleIds.forEach((id) => nextSet.delete(id))
    } else {
      visibleIds.forEach((id) => nextSet.add(id))
    }
    updateSelected(Array.from(nextSet))
  }

  const toggleSelectRow = (id: string) => {
    const nextSet = new Set(selectedIds)
    if (nextSet.has(id)) nextSet.delete(id)
    else nextSet.add(id)
    updateSelected(Array.from(nextSet))
  }

  return (
    <div className="min-w-0 max-w-full space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="sr-only" htmlFor={filterId}>{translateUiText(language, 'تصفية الجدول')}</label>
        <input
          id={filterId}
          value={query}
          onChange={(event) => { setQuery(event.target.value); setPage(0) }}
          placeholder={translateUiText(language, 'ابحث في جميع الصفوف')}
          className="h-9 w-full rounded-md border border-[#e5e7eb] bg-white px-3 text-sm outline-none focus:border-[#1e127c] sm:max-w-xs"
        />
        <span className="text-xs text-[#6b7280]">{sorted.length} {translateUiText(language, 'سجل')}</span>
      </div>

      {selectable && selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e0dbfa] bg-[#f3f0ff] px-4 py-2 text-sm text-[#271a83] shadow-xs dark:border-[#271a83] dark:bg-[#271a83]/20 dark:text-[#e0dbfa]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">
              {translateUiText(language, 'تم تحديد')} {selectedIds.length} {translateUiText(language, 'من أصل')} {allFilteredIds.length} {translateUiText(language, 'سجل')}
            </span>
            {allVisibleSelected && selectedIds.length < allFilteredIds.length ? (
              <button
                type="button"
                onClick={() => updateSelected(allFilteredIds)}
                className="text-xs font-semibold text-[#1e127c] underline hover:text-[#1e127c]"
              >
                {translateUiText(language, 'تحديد جميع النتائج')} ({allFilteredIds.length})
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => updateSelected([])}
              className="text-xs text-[#6b7280] underline hover:text-[#1f1f1f] dark:text-[#a1a1aa] dark:hover:text-[#f4f4f5]"
            >
              {translateUiText(language, 'إلغاء التحديد')}
            </button>
          </div>
          {selectionActions ? (
            <div className="flex items-center gap-2">
              <LocalizedContent>{selectionActions}</LocalizedContent>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="max-w-full overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[640px] text-center text-sm">
          <thead>
            <tr className="border-b border-[#e5e7eb] text-[#1f1f1f]">
              {selectable ? <th className="w-12 px-2 py-2 text-center">
                <label className="sr-only" htmlFor={selectId}>{translateUiText(language, 'تحديد كل الصفوف')}</label>
                <input
                  id={selectId}
                  type="checkbox"
                  checked={allVisibleSelected}
                  disabled={visibleIds.length === 0}
                  aria-label={translateUiText(language, 'تحديد كل الصفوف')}
                  onChange={toggleSelectAllVisible}
                />
              </th> : null}
              {columns.map((column, index) => {
                const active = sort?.index === index
                const label = translateUiText(language, column)
                return (
                  <th key={column} className="px-2 py-2 font-semibold" aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <button
                      type="button"
                      className="mx-auto inline-flex items-center justify-center gap-1 rounded-md px-1 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c]"
                      aria-label={`${translateUiText(language, 'فرز')} ${label}`}
                      onClick={() => {
                        setPage(0)
                        setSort((current) =>
                          current?.index === index ? { index, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { index, dir: 'asc' },
                        )
                      }}
                    >
                      {label}
                      <span aria-hidden className="text-xs text-[#6b7280]">{active ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}</span>
                    </button>
                  </th>
                )
              })}
              {rowActions ? <th className="px-2 py-2 font-semibold">{translateUiText(language, 'إجراءات')}</th> : null}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} className="py-10 text-center">
                  <p className="text-base font-medium text-[#1f1f1f]">{translateUiText(language, 'لا توجد سجلات')}</p>
                </td>
              </tr>
            ) : (
              visible.map((row, index) => {
                const originalIndex = visibleIndexes[index] ?? -1
                const rowId = effectiveIds[originalIndex] ?? `${safePage}-${index}`
                const isSelected = selectable && selectedIds.includes(rowId)
                return (
                  <tr key={rowId} className={`border-b border-[#f3f4f6] last:border-0 ${isSelected ? 'bg-[#f3f0ff]/50 dark:bg-[#271a83]/10' : ''}`}>
                    {selectable ? <td className="w-12 px-2 py-3 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        aria-label={`${translateUiText(language, 'تحديد الصف')} ${index + 1}`}
                        onChange={() => toggleSelectRow(rowId)}
                      />
                    </td> : null}
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-2 py-3 text-center align-middle">
                        <LocalizedContent>{cell}</LocalizedContent>
                      </td>
                    ))}
                    {rowActions ? (
                      <td className="px-2 py-3 text-center align-middle">
                        <LocalizedContent>{rowActions(row, originalIndex)}</LocalizedContent>
                      </td>
                    ) : null}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {sorted.length > PAGE_SIZE ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#6b7280]">
          <button
            type="button"
            className="rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] disabled:opacity-40"
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
          >
            {translateUiText(language, 'السابق')}
          </button>
          <span>
            {safePage + 1} / {pageCount}
          </span>
          <button
            type="button"
            className="rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] disabled:opacity-40"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage(safePage + 1)}
          >
            {translateUiText(language, 'التالي')}
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  const { language } = useLanguage()
  return (
    <label className="block min-w-0 space-y-1.5 text-sm">
      <span className="font-medium text-[#1f1f1f]">{translateUiText(language, label)}</span>
      <LocalizedContent>{children}</LocalizedContent>
    </label>
  )
}

const controlClass =
  'h-10 w-full min-w-0 rounded-md border border-[#e5e7eb] bg-white px-3 text-sm outline-none focus:border-[#1f1f1f]'

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { language } = useLanguage()
  return <input {...props} placeholder={props.placeholder ? translateUiText(language, props.placeholder) : undefined} className={controlClass} />
}

const CONTROL_LINK_TARGETS: Record<string, { pageId: string; label: string }> = {
  suppliers: { pageId: 'supplier', label: 'الموردين' },
  materials: { pageId: 'material', label: 'المواد الخام' },
  products: { pageId: 'product', label: 'المنتجات' },
  employees: { pageId: 'employee', label: 'الموظفين' },
  customers: { pageId: 'customer', label: 'العملاء' },
  machines: { pageId: 'machine', label: 'الماكينات' },
  vehicles: { pageId: 'fleet', label: 'المركبات' },
  productionOrders: { pageId: 'productionOrder', label: 'أوامر التصنيع' },
  users: { pageId: 'users', label: 'المستخدمين' },
  invoices: { pageId: 'salesInvoice', label: 'الفواتير' },
  recipes: { pageId: 'recipe', label: 'الوصفات' },
  packagingMaterials: { pageId: 'inventoryExtensions-packaging', label: 'مواد التعبئة' },
  spareParts: { pageId: 'inventoryExtensions', label: 'قطع الغيار' },
  lots: { pageId: 'productionLot', label: 'دفعات الإنتاج' },
  distributionPoints: { pageId: 'distributionPoint', label: 'نقاط التوزيع' },
  supplierTemplates: { pageId: 'supplierTemplate', label: 'قوالب الرسائل' },
  expenses: { pageId: 'expense', label: 'المصروفات' },
  purchaseOrders: { pageId: 'purchaseOrder', label: 'أوامر الشراء' },
  maintenanceSchedules: { pageId: 'maintenanceSchedule', label: 'جدول الصيانة' },
  purchaseRequests: { pageId: 'purchaseRequest', label: 'طلبات الشراء' },
  obligations: { pageId: 'obligation', label: 'الالتزامات' },
  maintenanceRecords: { pageId: 'maintenanceRecord', label: 'سجلات الصيانة' },
  warehouses: { pageId: 'warehouse', label: 'المستودعات' },
  customerRecipes: { pageId: 'customerRecipe', label: 'خلطات العملاء' },
  payrolls: { pageId: 'payroll', label: 'الرواتب' },
  attendance: { pageId: 'attendance', label: 'الحضور' },
  adjustments: { pageId: 'stockAdjustment', label: 'تسويات المخزون' },
  vehicleServices: { pageId: 'fleet', label: 'خدمات المركبات' },
  supplierCommunications: { pageId: 'supplierCommunication', label: 'مراسلات الموردين' },
  qualitySamples: { pageId: 'qualitySample', label: 'عينات الجودة' },
  notifications: { pageId: 'notification', label: 'الإشعارات' },
  leaveRequests: { pageId: 'attendance', label: 'الإجازات' },
  fuelLogs: { pageId: 'fleetFuel', label: 'تعبئات الوقود' },
  distributionClosings: { pageId: 'distributionClosing', label: 'الإقفال اليومي' },
  scaleReadings: { pageId: 'scaleReading', label: 'قراءات الميزان' },
  utilitiesReadings: { pageId: 'utilitiesReading', label: 'قراءات المرافق' },
}

export function DependencyLink({ field }: { field: string }) {
  const { language } = useLanguage()
  const closeDialog = useContext(DialogCloseContext)
  const target = CONTROL_LINK_TARGETS[field]
  const href = target ? hrefForPageId(target.pageId) : null
  if (!target || !href) return null
  return (
    <Link href={href} onClick={closeDialog} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#1e127c] underline-offset-2 hover:underline">
      {`${translateUiText(language, 'أضف')} ${translateUiText(language, target.label)} ${translateUiText(language, 'أولاً')}`} ↗
    </Link>
  )
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement> & { dependencyField?: string }) {
  const { dependencyField, ...selectProps } = props
  const { language } = useLanguage()
  const hasOptions = (() => {
    let found = false
    const walk = (node: React.ReactNode) => {
      if (found || node == null) return
      if (Array.isArray(node)) { node.forEach(walk); return }
      if (typeof node === 'object' && 'type' in node) {
        const el = node as React.ReactElement
        if (el.type === 'option') { found = true; return }
        const children = (el.props as { children?: React.ReactNode }).children
        if (children) walk(children)
      }
    }
    walk(selectProps.children)
    return found
  })()
  return (
    <>
      <select {...selectProps} className={controlClass}><LocalizedContent>{selectProps.children}</LocalizedContent></select>
      {!hasOptions ? (
        <div className="mt-1">
          <p className="text-xs font-semibold text-[#ad5e46]">{translateUiText(language, '— لا توجد بيانات مرتبطة —')} {translateUiText(language, 'أضف عناصرها')} {translateUiText(language, 'أولاً')} {translateUiText(language, 'حتى يمكن اختيارها')}</p>
          {dependencyField && <DependencyLink field={dependencyField} />}
        </div>
      ) : null}
    </>
  )
}

export function PrimaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="inline-flex h-9 items-center justify-center rounded-md bg-[#1f1f1f] px-4 text-sm font-medium text-white hover:bg-[#1f1f1f]/90 disabled:opacity-60"
    >
      <LocalizedContent>{children}</LocalizedContent>
    </button>
  )
}

export function GhostButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="inline-flex h-9 items-center justify-center rounded-md border border-[#e5e7eb] bg-white px-3 text-sm font-medium text-[#1f1f1f] shadow-sm hover:bg-[#f9fafb] disabled:opacity-60"
    >
      <LocalizedContent>{children}</LocalizedContent>
    </button>
  )
}

export function Dialog({
  title,
  hint,
  onClose,
  wide,
  children,
}: {
  title: string
  hint?: string
  onClose: () => void
  wide?: boolean
  children: ReactNode
}) {
  const { language } = useLanguage()
  const titleId = useId()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-6" onMouseDown={() => onCloseRef.current()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`my-auto w-full rounded-[12px] border border-[#e5e7eb] bg-white p-5 shadow-xl outline-none dark:border-[#3b4b5e] dark:bg-[#1c232d] ${wide ? 'max-w-3xl' : 'max-w-xl'}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 id={titleId} className="text-lg font-medium text-[#1f1f1f] dark:text-[#e6edf3]">
              {translateUiText(language, title)}
            </h3>
            {hint ? <p className="mt-1 text-sm text-[#6b7280] dark:text-[#a6b2bf]">{translateUiText(language, hint)}</p> : null}
          </div>
          <button type="button" className="rounded-md px-2 py-1 text-sm text-[#6b7280] hover:bg-[#f3f4f6] dark:text-[#a6b2bf] dark:hover:bg-[#273341]" onClick={() => onCloseRef.current()}>
            {translateUiText(language, 'إغلاق')}
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto pe-1"><DialogCloseContext.Provider value={onClose}><LocalizedContent>{children}</LocalizedContent></DialogCloseContext.Provider></div>
      </div>
    </div>
  )
}

export function FormDialog({
  title,
  hint,
  openLabel,
  wide,
  children,
}: {
  title: string
  hint?: string
  openLabel: string
  wide?: boolean
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <>
      <PrimaryButton type="button" onClick={() => setOpen(true)}>
        {openLabel}
      </PrimaryButton>
      {open ? (
        <Dialog title={title} hint={hint} wide={wide} onClose={close}>
          {children(close)}
        </Dialog>
      ) : null}
    </>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'bad' }) {
  const toneClass =
    tone === 'good'
      ? 'bg-[#eeebfb] text-[#1e127c]'
      : tone === 'warn'
        ? 'bg-[#fef3c7] text-[#d97706]'
        : tone === 'bad'
          ? 'bg-[#fee2e2] text-[#dc2626]'
          : 'bg-[#f3f4f6] text-[#6b7280]'
  return <span className={`inline-flex rounded-md px-2 py-1 text-[13px] font-normal ${toneClass}`}><LocalizedContent>{children}</LocalizedContent></span>
}

export function toneForStatus(status: string): 'neutral' | 'good' | 'warn' | 'bad' {
  if (['APPROVED', 'RECEIVED', 'COMPLETED', 'PAID', 'POSTED', 'DONE', 'CONFIRMED', 'PASSED'].includes(status)) return 'good'
  if (['PENDING_APPROVAL', 'PARTIAL', 'PARTIALLY_RECEIVED', 'RELEASED', 'OPEN', 'DRAFT', 'HOLD', 'PENDING'].includes(status)) return 'warn'
  if (['REJECTED', 'FAILED'].includes(status)) return 'bad'
  return 'neutral'
}

export function RowActions({
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  deleteTitle = 'تأكيد الحذف',
  deletePrompt = 'هل أنت متأكد من رغبتك في حذف هذا السجل نهائياً؟',
  disabled = false,
}: {
  onEdit?: () => void
  onDelete?: () => void | Promise<void>
  canEdit?: boolean
  canDelete?: boolean
  deleteTitle?: string
  deletePrompt?: string
  disabled?: boolean
}) {
  const { language } = useLanguage()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!canEdit && !canDelete) return null

  return (
    <div className="flex items-center justify-center gap-1.5">
      {canEdit && onEdit ? (
        <button
          type="button"
          disabled={disabled || submitting}
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-md border border-[#e5e7eb] bg-white px-2 py-1 text-xs font-semibold text-[#1e127c] shadow-xs hover:bg-[#f3f0ff] hover:border-[#1e127c]/40 disabled:opacity-40 transition-colors cursor-pointer"
          title={translateUiText(language, 'تعديل')}
        >
          <Pencil size={13} className="shrink-0" />
          <span>{translateUiText(language, 'تعديل')}</span>
        </button>
      ) : null}
      {canDelete && onDelete ? (
        <>
          <button
            type="button"
            disabled={disabled || submitting}
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-1 rounded-md border border-[#fecaca] bg-white px-2 py-1 text-xs font-semibold text-[#dc2626] shadow-xs hover:bg-[#fef2f2] hover:border-[#dc2626]/40 disabled:opacity-40 transition-colors cursor-pointer"
            title={translateUiText(language, 'حذف')}
          >
            <Trash2 size={13} className="shrink-0" />
            <span>{translateUiText(language, 'حذف')}</span>
          </button>
          {confirmOpen ? (
            <Dialog
              title={translateUiText(language, deleteTitle)}
              onClose={() => !submitting && setConfirmOpen(false)}
            >
              <div className="space-y-4 text-right" dir="rtl">
                <p className="text-sm text-[#374151] leading-relaxed">
                  {translateUiText(language, deletePrompt)}
                </p>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f3f4f6]">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setConfirmOpen(false)}
                    className="rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs font-medium text-[#6b7280] hover:bg-[#f9fafb] cursor-pointer"
                  >
                    {translateUiText(language, 'إلغاء')}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={async () => {
                      setSubmitting(true)
                      try {
                        await onDelete()
                        setConfirmOpen(false)
                      } finally {
                        setSubmitting(false)
                      }
                    }}
                    className="rounded-md bg-[#dc2626] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#b91c1c] disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? translateUiText(language, 'جارٍ الحذف...') : translateUiText(language, 'تأكيد الحذف')}
                  </button>
                </div>
              </div>
            </Dialog>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
