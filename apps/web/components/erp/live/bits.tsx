'use client'

import { isValidElement, useState, type ReactNode } from 'react'

const PAGE_SIZE = 8

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
  return (
    <section className="rounded-2xl border border-[#e1e9e5] bg-white p-4 shadow-[0_4px_22px_rgba(31,65,53,0.04)] md:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          {hint ? <p className="mt-1 text-sm text-[#788983]">{hint}</p> : null}
        </div>
        {extra}
      </div>
      {children}
    </section>
  )
}

export function DataTable({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  const [sort, setSort] = useState<{ index: number; dir: 'asc' | 'desc' } | null>(null)
  const [page, setPage] = useState(0)
  const sorted = [...rows]
  if (sort) {
    const direction = sort.dir === 'asc' ? 1 : -1
    sorted.sort((a, b) => cellText(a[sort.index]).localeCompare(cellText(b[sort.index]), 'ar', { numeric: true }) * direction)
  }
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const visible = sorted.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-right text-sm">
          <thead>
            <tr className="border-b border-[#edf2ef] text-[#3d524b]">
              {columns.map((column, index) => {
                const active = sort?.index === index
                return (
                  <th key={column} className="px-2 py-2 font-semibold" aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md px-1 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d7f72]"
                      aria-label={`فرز ${column}`}
                      onClick={() => {
                        setPage(0)
                        setSort((current) =>
                          current?.index === index ? { index, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { index, dir: 'asc' },
                        )
                      }}
                    >
                      {column}
                      <span aria-hidden className="text-xs text-[#53655e]">{active ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}</span>
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-10 text-center">
                  <p className="text-base font-semibold text-[#3d524b]">لا توجد سجلات</p>
                </td>
              </tr>
            ) : (
              visible.map((row, index) => (
                <tr key={`${safePage}-${index}`} className="border-b border-[#f3f6f5] last:border-0">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-2 py-3 align-top">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {sorted.length > PAGE_SIZE ? (
        <div className="flex items-center justify-between gap-3 text-sm text-[#53655e]">
          <button
            type="button"
            className="rounded-lg border border-[#dfe7e3] bg-white px-3 py-1.5 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d7f72] disabled:opacity-40"
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
          >
            السابق
          </button>
          <span>
            {safePage + 1} / {pageCount}
          </span>
          <button
            type="button"
            className="rounded-lg border border-[#dfe7e3] bg-white px-3 py-1.5 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d7f72] disabled:opacity-40"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage(safePage + 1)}
          >
            التالي
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-semibold text-[#30453d]">{label}</span>
      {children}
    </label>
  )
}

const controlClass =
  'h-11 w-full rounded-xl border border-[#dfe7e3] bg-white px-3 text-sm outline-none focus:border-[#1d7f72]'

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={controlClass} />
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={controlClass} />
}

export function PrimaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="inline-flex h-11 items-center justify-center rounded-xl bg-[#123c35] px-4 text-sm font-bold text-white hover:bg-[#1d594d] disabled:opacity-60"
    >
      {children}
    </button>
  )
}

export function GhostButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="inline-flex h-10 items-center justify-center rounded-xl border border-[#dfe7e3] bg-white px-3 text-sm font-semibold text-[#30453d] hover:bg-[#f7faf8] disabled:opacity-60"
    >
      {children}
    </button>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'bad' }) {
  const toneClass =
    tone === 'good'
      ? 'bg-[#e7f6f1] text-[#19725f]'
      : tone === 'warn'
        ? 'bg-[#fff6e8] text-[#9b6b1f]'
        : tone === 'bad'
          ? 'bg-[#fff1ec] text-[#ad5e46]'
          : 'bg-[#f3f6f5] text-[#53655e]'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${toneClass}`}>{children}</span>
}

export function toneForStatus(status: string): 'neutral' | 'good' | 'warn' | 'bad' {
  if (['APPROVED', 'RECEIVED', 'COMPLETED', 'PAID', 'POSTED', 'DONE', 'CONFIRMED'].includes(status)) return 'good'
  if (['PENDING_APPROVAL', 'PARTIAL', 'PARTIALLY_RECEIVED', 'RELEASED', 'OPEN', 'DRAFT'].includes(status)) return 'warn'
  if (['REJECTED'].includes(status)) return 'bad'
  return 'neutral'
}
