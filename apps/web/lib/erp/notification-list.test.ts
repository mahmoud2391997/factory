import assert from 'node:assert/strict'
import { test } from 'node:test'

import { setNotificationRead, unreadNotificationCount } from './notification-list'

const notifications = [
  { id: 'ntf-1', title: 'First', read: false },
  { id: 'ntf-2', title: 'Second', read: false },
  { id: 'ntf-3', title: 'Third', read: true },
]

test('unread notification count is based on the caller-specific read flags', () => {
  assert.equal(unreadNotificationCount(notifications), 2)
  assert.equal(unreadNotificationCount(setNotificationRead(notifications, 'ntf-1', true)), 1)
})

test('optimistic read updates only the selected notification and preserves its visible item', () => {
  const updated = setNotificationRead(notifications, 'ntf-2', true)
  assert.deepEqual(updated.map(({ id, read }) => ({ id, read })), [
    { id: 'ntf-1', read: false },
    { id: 'ntf-2', read: true },
    { id: 'ntf-3', read: true },
  ])
  assert.equal(updated.length, notifications.length)
})

test('failed optimistic read can restore the prior notification state without changing other items', () => {
  const optimistic = setNotificationRead(notifications, 'ntf-1', true)
  const rolledBack = setNotificationRead(optimistic, 'ntf-1', notifications[0]!.read)
  assert.deepEqual(rolledBack, notifications)
  assert.equal(unreadNotificationCount(rolledBack), 2)
})
