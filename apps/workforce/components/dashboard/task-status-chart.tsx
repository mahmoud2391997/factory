'use client'

export function TaskStatusChart({
  data,
}: {
  data: Array<{ status: string; count: number }>
}) {
  const colors: Record<string, string> = {
    TODO: '#d0d7de',
    IN_PROGRESS: '#0969da',
    REVIEW: '#9a6700',
    COMPLETED: '#1f883d',
  }

  const rows = data.filter((d) => d.count > 0)
  if (rows.length === 0) {
    return <div className="text-sm text-[#656d76]">لا توجد مهام</div>
  }

  const total = rows.reduce((sum, r) => sum + r.count, 0)
  const r = 38
  const c = 2 * Math.PI * r
  let acc = 0

  return (
    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
      <div className="flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-44 w-44">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#f6f8fa" strokeWidth="12" />
          {rows.map((row) => {
            const len = (row.count / total) * c
            const dasharray = `${len} ${c - len}`
            const dashoffset = -acc
            acc += len
            return (
              <circle
                key={row.status}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={colors[row.status] ?? '#6b7280'}
                strokeWidth="12"
                strokeLinecap="butt"
                strokeDasharray={dasharray}
                strokeDashoffset={dashoffset}
                transform="rotate(-90 50 50)"
              />
            )
          })}
          <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="fill-[#1f2328] text-[10px] font-semibold">
            {total}
          </text>
          <text x="50" y="62" textAnchor="middle" dominantBaseline="middle" className="fill-[#656d76] text-[6px]">
            tasks
          </text>
        </svg>
      </div>

      <div className="rounded-lg border border-[#d0d7de] bg-white p-4">
        <div className="mb-2 text-sm font-semibold">Breakdown</div>
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.status} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm" style={{ background: colors[row.status] ?? '#6b7280' }} />
                <span className="font-mono text-xs">{row.status}</span>
              </div>
              <div className="font-semibold">{row.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

