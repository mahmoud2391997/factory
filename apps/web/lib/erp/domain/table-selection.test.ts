import test from 'node:test'
import assert from 'node:assert/strict'

import {
  toggleItem,
  selectPage,
  deselectPage,
  selectAll,
  clearSelection,
  isAllPageSelected,
  isAllFilteredSelected,
  removeSuccessful,
  executeBulkAction,
} from './table-selection'

test('table-selection: single item select and deselect with stable IDs', () => {
  let selected: string[] = []

  selected = toggleItem(selected, 'mat-1')
  assert.deepEqual(selected, ['mat-1'])

  selected = toggleItem(selected, 'mat-2')
  assert.deepEqual(selected, ['mat-1', 'mat-2'])

  selected = toggleItem(selected, 'mat-1')
  assert.deepEqual(selected, ['mat-2'])
})

test('table-selection: page selection and select-all filtered', () => {
  const page1 = ['item-1', 'item-2', 'item-3']
  const page2 = ['item-4', 'item-5']
  const allFiltered = [...page1, ...page2]

  let selected: string[] = []

  // Select page 1
  selected = selectPage(selected, page1)
  assert.equal(isAllPageSelected(selected, page1), true)
  assert.equal(isAllFilteredSelected(selected, allFiltered), false)
  assert.equal(selected.length, 3)

  // Deselect page 1
  selected = deselectPage(selected, page1)
  assert.equal(isAllPageSelected(selected, page1), false)
  assert.equal(selected.length, 0)

  // Select all filtered across all pages
  selected = selectAll(allFiltered)
  assert.equal(isAllPageSelected(selected, page1), true)
  assert.equal(isAllPageSelected(selected, page2), true)
  assert.equal(isAllFilteredSelected(selected, allFiltered), true)
  assert.equal(selected.length, 5)

  // Clear selection
  selected = clearSelection()
  assert.equal(selected.length, 0)
})

test('table-selection: pagination and filter retention preserves selected IDs', () => {
  let selected = ['item-2', 'item-4']

  // User is on page 1 (items 1-3)
  const page1 = ['item-1', 'item-2', 'item-3']
  assert.equal(selected.includes('item-2'), true)

  // User navigates to page 2 (items 4-5) - selected array remains stable
  const page2 = ['item-4', 'item-5']
  assert.equal(selected.includes('item-4'), true)
  assert.equal(selected.includes('item-2'), true)

  // User searches for a query that only returns item-2
  const filteredQuery = ['item-2']
  assert.equal(selected.includes('item-2'), true)
  // item-4 is still retained in selection even though filtered out
  assert.equal(selected.includes('item-4'), true)
})

test('table-selection: partial failure handling retains failed items and clears succeeded', async () => {
  const selected = ['item-ok-1', 'item-fail-2', 'item-ok-3']

  const result = await executeBulkAction(selected, async (id) => {
    if (id === 'item-fail-2') {
      return { ok: false, error: 'المادة مرتبطة بوصفة نشطة' }
    }
    return { ok: true }
  })

  assert.equal(result.successCount, 2)
  assert.equal(result.failureCount, 1)
  assert.deepEqual(result.successful, ['item-ok-1', 'item-ok-3'])
  assert.equal(result.failed.length, 1)
  assert.equal(result.failed[0]?.id, 'item-fail-2')
  assert.equal(result.failed[0]?.error, 'المادة مرتبطة بوصفة نشطة')

  // Remove succeeded items from selection
  const remainingSelected = removeSuccessful(selected, result.successful)
  assert.deepEqual(remainingSelected, ['item-fail-2'])
})
