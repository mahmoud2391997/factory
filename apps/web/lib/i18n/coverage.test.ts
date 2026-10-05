import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import ts from 'typescript'

import { translateUiText } from './translations'

const webRoot = fileURLToPath(new URL('../..', import.meta.url))
const arabic = /[\u0600-\u06ff]/

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) return entry.name === 'i18n' ? [] : sourceFiles(file)
    return /\.tsx?$/.test(file) && !/\.(test|spec)\./.test(file) ? [file] : []
  })
}

test('English and Hindi cover static interface, navigation, print, validation and feedback text', () => {
  const missing = new Set<string>()
  for (const file of ['components', 'app', 'lib', 'server'].flatMap(dir => sourceFiles(path.join(webRoot, dir)))) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
    const visit = (node: ts.Node) => {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isJsxText(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
        const text = node.text.trim()
        if (text.length > 1 && arabic.test(text)) {
          for (const language of ['en', 'hi'] as const) {
            if (arabic.test(translateUiText(language, text))) missing.add(`${language}: ${text} (${path.relative(webRoot, file)})`)
          }
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
  assert.deepEqual([...missing], [], 'New Arabic source strings need English and Hindi translations')
})

test('composite messages translate interface fragments while preserving unknown record names and IDs', () => {
  assert.equal(translateUiText('en', 'تم اعتماد PO-2026-001'), 'Approved PO-2026-001')
  assert.equal(translateUiText('hi', 'تم اعتماد PO-2026-001'), 'स्वीकृत किया गया PO-2026-001')
  assert.equal(translateUiText('en', '  تحليلات المخزون  '), '  Stock analytics  ')
  assert.equal(translateUiText('en', 'عميل خاص ١'), 'عميل خاص ١')
  assert.ok(!arabic.test(translateUiText('en', 'الاثنين، 5 أكتوبر 2026')))
  assert.ok(!arabic.test(translateUiText('hi', 'هل أنت متأكد من حذف 2 عميل محدد؟')))
})

test('over-receipt feedback translates the validation prefix and preserves the material name', () => {
  const name = 'مادة خام اختبارية 4'
  for (const language of ['en', 'hi'] as const) {
    const prefix = translateUiText(language, 'الكمية تتجاوز أمر الشراء للمادة')
    assert.equal(translateUiText(language, `الكمية تتجاوز أمر الشراء للمادة ${name}`), `${prefix} ${name}`)
    assert.ok(!arabic.test(prefix))
  }
})
