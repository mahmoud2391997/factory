import type { ReactNode } from 'react'

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
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-right text-sm">
        <thead>
          <tr className="border-b border-[#edf2ef] text-[#7d8e88]">
            {columns.map((column) => (
              <th key={column} className="px-2 py-2 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-[#899892]">
                لا توجد سجلات
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index} className="border-b border-[#f3f6f5] last:border-0">
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
