function escapeCsvCell(value: string) {
  const needsQuotes = /[",\n\r]/.test(value)
  const escaped = value.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : escaped
}

export function toCsv(rows: string[][]) {
  return rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(',')).join('\n')
}

export function downloadTextFile(params: { filename: string; content: string; mimeType: string }) {
  if (typeof window === 'undefined') return

  const blob = new Blob([params.content], { type: `${params.mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = params.filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function downloadCsv(params: { filename: string; rows: string[][] }) {
  downloadTextFile({
    filename: params.filename,
    content: toCsv(params.rows),
    mimeType: 'text/csv',
  })
}

