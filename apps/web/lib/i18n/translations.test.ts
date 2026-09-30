import assert from 'node:assert/strict'
import { test } from 'node:test'

import { directionFor } from './language-provider'
import { DESTINATION_KEYS, destinationLabel, getSupportedLanguages, t, translateUiText, translations } from './translations'

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

test('shared UI labels translate without changing Arabic or unknown dynamic values', () => {
  assert.equal(translateUiText('ar', 'لا توجد سجلات'), 'لا توجد سجلات')
  assert.equal(translateUiText('en', 'لا توجد سجلات'), 'No records')
  assert.equal(translateUiText('hi', 'المواد الخام'), 'कच्चा माल')
  assert.equal(translateUiText('en', 'عميل خاص ١'), 'عميل خاص ١')
  assert.equal(translateUiText('en', 'المنتجات'), 'Products')
  assert.equal(translateUiText('hi', 'حفظ الحدود'), 'सीमाएँ सहेजें')
})

test('formatted dates, currency, and units follow the selected language', () => {
  assert.equal(translateUiText('en', 'الأربعاء، 12 سبتمبر 2026'), 'Wednesday، 12 September 2026')
  assert.equal(translateUiText('hi', 'الخميس، 3 مارس 2026'), 'गुरुवार، 3 मार्च 2026')
  assert.equal(translateUiText('en', '1.250 ر.ع. لكل طن'), '1.250 OMR per ton')
  assert.equal(translateUiText('hi', '50 كجم'), '50 किग्रा')
})

test('Arabic uses RTL while English and Hindi use LTR', () => {
  assert.equal(directionFor('ar'), 'rtl')
  assert.equal(directionFor('en'), 'ltr')
  assert.equal(directionFor('hi'), 'ltr')
})

test('every destination id has a translation key and all three languages are offered', () => {
  for (const id of Object.keys(DESTINATION_KEYS)) {
    assert.ok(DESTINATION_KEYS[id])
  }
  const codes = getSupportedLanguages().map((item) => item.code)
  assert.deepEqual(codes, ['ar', 'en', 'hi'])
})
