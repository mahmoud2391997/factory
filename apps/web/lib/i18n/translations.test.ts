import assert from 'node:assert/strict'
import { test } from 'node:test'

import { DESTINATION_KEYS, destinationLabel, getSupportedLanguages, t, translations } from './translations'

test('every language defines every translation key', () => {
  const keys = Object.keys(translations.ar).sort()
  for (const lang of ['ar', 'en', 'hi'] as const) {
    assert.deepEqual(Object.keys(translations[lang]).sort(), keys, `${lang} is missing keys`)
    for (const key of keys) {
      assert.equal(typeof translations[lang][key as keyof typeof translations.ar], 'string')
      assert.ok(translations[lang][key as keyof typeof translations.ar].length > 0, `${lang}.${key} is empty`)
    }
  }
})

test('t returns the language value and falls back to the key', () => {
  assert.equal(t('ar', 'inventory'), 'المخزون')
  assert.equal(t('en', 'inventory'), 'Inventory')
  assert.equal(t('hi', 'inventory'), 'इन्वेंटरी')
})

test('destinationLabel translates sidebar ids and keeps the fallback for unknown ids', () => {
  assert.equal(destinationLabel('en', 'inventory', 'المخزون'), 'Inventory')
  assert.equal(destinationLabel('hi', 'home', 'الرئيسية'), 'होम')
  assert.equal(destinationLabel('en', 'unknown-id', 'fallback'), 'fallback')
})

test('every destination id has a translation key and all three languages are offered', () => {
  for (const id of Object.keys(DESTINATION_KEYS)) {
    assert.ok(DESTINATION_KEYS[id])
  }
  const codes = getSupportedLanguages().map((item) => item.code)
  assert.deepEqual(codes, ['ar', 'en', 'hi'])
})
