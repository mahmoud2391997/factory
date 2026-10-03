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
  for (const lang of ['ar', 'en', 'hi'] as const) {
    assert.equal(translateUiText(lang, 'عميل خاص ١'), 'عميل خاص ١')
  }
  assert.equal(translateUiText('en', 'المنتجات'), 'Products')
  assert.equal(translateUiText('hi', 'حفظ الحدود'), 'सीमाएँ सहेजें')
})

test('live navigation, table accessibility, trace labels, and dynamic currency are localized', () => {
  assert.equal(translateUiText('en', 'صفحات'), 'pages')
  assert.equal(translateUiText('en', 'مورد ← طلب شراء ← أمر شراء ← استلام'), 'Supplier → purchase request → purchase order → receipt')
  assert.equal(translateUiText('hi', 'موظف ← حضور ← إضافي ← راتب'), 'कर्मचारी → उपस्थिति → ओवरटाइम → पेरोल')
  assert.equal(translateUiText('en', 'مكونات الوصفات'), 'Recipe components')
  assert.equal(translateUiText('hi', 'مكونات الوصفات'), 'रेसिपी घटक')
  assert.equal(translateUiText('en', 'تصفية الجدول'), 'Filter table')
  assert.equal(translateUiText('hi', 'تحديد كل الصفوف'), 'सभी पंक्तियाँ चुनें')
  assert.equal(translateUiText('en', 'دفعات العميل: '), 'Customer batches: ')
  assert.equal(translateUiText('hi', 'دفعات العميل: '), 'ग्राहक बैच: ')
  assert.equal(translateUiText('en', '0.000 ر.ع.'), '0.000 OMR')
  assert.equal(translateUiText('hi', '0.000 ر.ع.'), '0.000 ओमानी रियाल')
  assert.equal(translateUiText('ar', '0.000 ر.ع.'), '0.000 ر.ع.')
})

test('formatted dates, currency, and units follow the selected language', () => {
  const englishDate = translateUiText('en', 'الأربعاء، 12 سبتمبر 2026')
  assert.ok(englishDate.includes('Wednesday'))
  assert.ok(englishDate.includes('12 September 2026'))
  const hindiDate = translateUiText('hi', 'الخميس، 3 مارس 2026')
  assert.ok(hindiDate.includes('गुरुवार'))
  assert.ok(hindiDate.includes('3 मार्च 2026'))
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
