function cell(value: string | number) {
  const text = String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
  const type = typeof value === 'number' && Number.isFinite(value) ? 'Number' : 'String'
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<Cell><Data ss:Type="${type}">${escaped}</Data></Cell>`
}

export function spreadsheetXml(sheetName: string, rows: Array<Array<string | number>>) {
  const table = rows.map((row) => `<Row>${row.map(cell).join('')}</Row>`).join('')
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="${sheetName}"><Table>${table}</Table></Worksheet>
</Workbook>`
}
