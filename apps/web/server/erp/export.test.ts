import assert from 'node:assert/strict'
import { test } from 'node:test'

import { DEFAULT_ROLE_PERMISSIONS } from '../../lib/erp/domain/permissions'

import { spreadsheetXml } from './excel'
import { canExport, csvSpreadsheet, exportPermissionStatus, exportRowsForPermissions } from './export'

test('exports enforce domain-specific read permissions instead of generic reports access', () => {
  const operations = DEFAULT_ROLE_PERMISSIONS.OPERATIONS
  const quality = DEFAULT_ROLE_PERMISSIONS.QUALITY
  const accountant = DEFAULT_ROLE_PERMISSIONS.ACCOUNTANT

  assert.equal(canExport('stock', operations), true)
  assert.equal(canExport('lots', operations), true)
  assert.equal(canExport('invoices', operations), true)
  assert.equal(canExport('journals', operations), false)
  assert.equal(canExport('invoices', quality), false)
  assert.equal(canExport('payroll', quality), false)
  assert.equal(canExport('documents', quality), false)
  assert.equal(canExport('invoices', accountant), true)
  assert.equal(canExport('payroll', accountant), true)
  assert.equal(canExport('documents', accountant), true)
})

test('driver journal export is forbidden with HTTP 403', () => {
  assert.equal(exportPermissionStatus('journals', DEFAULT_ROLE_PERMISSIONS.DRIVER), 403)
})

test('stock and lot exports redact cost columns for users without cost permissions', () => {
  const stockRows = [
    ['المستودع', 'الصنف', 'الدفعة', 'الكمية', 'التكلفة', 'القيمة', 'الصلاحية'],
    ['WH_RAW', 'ذرة', 'B-1', 100, 12, 1200, '2026-12-01'],
  ]
  const lotRows = [
    ['الدفعة', 'المنتج', 'المشغّل', 'التاريخ', 'الجودة', 'التكلفة', 'سعر البيع', 'الهامش', 'الهامش %', 'قديم'],
    ['L-1', 'منتج', 'عامل', '2026-09-01', 'PASSED', 10, 12, 2, 20, ''],
  ]
  assert.deepEqual(exportRowsForPermissions('stock', stockRows, DEFAULT_ROLE_PERMISSIONS.OPERATIONS), [
    ['المستودع', 'الصنف', 'الدفعة', 'الكمية', 'الصلاحية'],
    ['WH_RAW', 'ذرة', 'B-1', 100, '2026-12-01'],
  ])
  assert.deepEqual(exportRowsForPermissions('lots', lotRows, DEFAULT_ROLE_PERMISSIONS.OPERATIONS), [
    ['الدفعة', 'المنتج', 'المشغّل', 'التاريخ', 'الجودة', 'قديم'],
    ['L-1', 'منتج', 'عامل', '2026-09-01', 'PASSED', ''],
  ])
  assert.deepEqual(exportRowsForPermissions('stock', stockRows, DEFAULT_ROLE_PERMISSIONS.ACCOUNTANT), stockRows)
})

test('CSV export is UTF-8 Excel-friendly, RFC-style escaped, and protects formula cells', () => {
  const csv = csvSpreadsheet([
    ['الاسم', 'الوصف', 'الكمية'],
    ['=HYPERLINK("https://example.test")', 'سطر، أول\nثانٍ', 12],
  ])
  assert.equal(
    csv,
    '\uFEFF"الاسم","الوصف","الكمية"\r\n"\'=HYPERLINK(""https://example.test"")","سطر، أول\nثانٍ","12"',
  )
})

test('Excel XML export escapes user text and strips invalid XML control characters', () => {
  const xml = spreadsheetXml('Test', [['A&B <name>', 'bad\u0001value']])
  assert.match(xml, /A&amp;B &lt;name&gt;/)
  assert.match(xml, /badvalue/)
  assert.doesNotMatch(xml, /\u0001/)
})
