import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, applyCommand, publicState } from './engine'
import { DEFAULT_ROLE_PERMISSIONS } from './permissions'
import { createClock, emptyState } from './seed'
import type { Actor, ErpState, Notification } from './types'

const NOW = '2026-09-29T08:00:00.000Z'

function addNotification(state: ErpState, roles: Notification['roles'], id = 'ntf-test') {
  state.notifications.unshift({
    id,
    kind: 'INFO',
    title: 'إشعار اختبار',
    body: 'تفاصيل اختبار',
    dedupeKey: `test:${id}`,
    roles,
    readBy: [],
    read: false,
    emailStatus: 'skipped',
    at: NOW,
  })
}

function actor(state: ErpState, userId: string): Actor {
  const found = actorFromUser(state, userId)
  assert.ok(found, `fixture user ${userId} exists`)
  return found
}

function markRead(state: ErpState, userId: string, notificationId: string, clock = createClock(NOW)) {
  return applyCommand(state, actor(state, userId), {
    action: 'markNotificationRead',
    input: { id: notificationId },
  }, clock)
}

function must(state: ErpState, userId: string, command: Parameters<typeof applyCommand>[2], clock: ReturnType<typeof createClock>) {
  const result = applyCommand(state, actor(state, userId), command, clock)
  if (!result.ok) throw new Error(`${command.action}: ${result.error}`)
  return result.state
}

function daysFromNow(days: number) {
  const date = new Date(NOW)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

test('publicState only returns notifications addressed to the current role and requiring notification permission', () => {
  const state = emptyState('notification-visibility')
  addNotification(state, ['GM'])

  assert.deepEqual(publicState(state, state.rolePermissions.ACCOUNTANT, 'user-acc').notifications, [])
  assert.deepEqual(publicState(state, state.rolePermissions.SALES, 'user-sales').notifications, [])
  assert.deepEqual(publicState(state, state.rolePermissions.DRIVER, 'user-driver').notifications, [])
  assert.equal(publicState(state, state.rolePermissions.GM, 'user-gm').notifications[0]?.id, 'ntf-test')
})

test('a role outside the notification recipients cannot mark it read', () => {
  const state = emptyState('notification-command-role')
  addNotification(state, ['GM'])

  const denied = markRead(state, 'user-acc', 'ntf-test')
  assert.equal(denied.ok, false)
  assert.equal(state.notifications[0]!.read, false)
  assert.deepEqual(state.notifications[0]!.readBy, [])
  assert.equal(publicState(state, state.rolePermissions.GM, 'user-gm').notifications[0]?.read, false)
})

test('an addressed user marks only their own read state and the action is audited', () => {
  const state = emptyState('notification-command-role')
  addNotification(state, ['GM'])

  const result = markRead(state, 'user-gm', 'ntf-test')
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.state.notifications[0]!.read, false, 'per-user reads do not mutate the legacy global flag')
  assert.deepEqual(result.state.notifications[0]!.readBy, ['user-gm'])
  assert.equal(result.state.auditLogs.filter((item) => item.entity === 'notification' && item.entityId === 'ntf-test').length, 1)
  assert.equal(publicState(result.state, result.state.rolePermissions.GM, 'user-gm').notifications[0]?.read, true)
})

test('marking the same notification twice for one user succeeds without a second audit entry', () => {
  const state = emptyState('notification-idempotent-read')
  addNotification(state, ['GM'])
  state.notifications[0]!.readBy = ['user-gm']

  const result = markRead(state, 'user-gm', 'ntf-test')
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.match(result.message, /مقروء بالفعل/)
  assert.equal(result.state.auditLogs.filter((item) => item.entity === 'notification').length, 0)
})

test('unknown notification IDs fail without changing state', () => {
  const state = emptyState('notification-unknown')
  const result = markRead(state, 'user-gm', 'missing')
  assert.equal(result.ok, false)
  if (result.ok) return
  assert.match(result.error, /الإشعار غير موجود/)
  assert.equal(state.auditLogs.length, 0)
})

test('one accountant reading a notification does not mark it read for another accountant', () => {
  const state = emptyState('notification-per-user')
  addNotification(state, ['ACCOUNTANT'])
  const secondAccountant = { ...state.users.find((user) => user.id === 'user-acc')!, id: 'user-acc-second', email: 'accounts2@factory.local' }
  state.users.push(secondAccountant)

  const result = markRead(state, 'user-acc', 'ntf-test')
  assert.equal(result.ok, true)
  if (!result.ok) return
  const firstView = publicState(result.state, result.state.rolePermissions.ACCOUNTANT, 'user-acc')
  const secondView = publicState(result.state, result.state.rolePermissions.ACCOUNTANT, 'user-acc-second')
  assert.equal(firstView.notifications[0]?.read, true)
  assert.equal(secondView.notifications[0]?.read, false)
  assert.deepEqual(result.state.notifications[0]!.readBy, ['user-acc'])
})

test('DRIVER receives no notifications and has no navigation permission for the bell', () => {
  const state = emptyState('notification-driver')
  addNotification(state, ['DRIVER'])

  assert.equal(DEFAULT_ROLE_PERMISSIONS.DRIVER.includes('notifications.read'), false)
  assert.deepEqual(publicState(state, state.rolePermissions.DRIVER, 'user-driver').notifications, [])
})

test('notification deduplication waits for all addressed users before creating a fresh alert', () => {
  const clock = createClock(NOW)
  let state = emptyState('notification-dedupe')
  state = must(state, 'user-gm', {
    action: 'createVehicle',
    input: { code: 'V1', plateNo: '12345', type: 'TRUCK', nameAr: 'شاحنة' },
  }, clock)
  const vehicleId = state.vehicles[0]!.id
  state = must(state, 'user-gm', {
    action: 'updateVehicle',
    input: { id: vehicleId, insuranceExpiryDate: daysFromNow(20) },
  }, clock)
  const note = state.notifications.find((item) => item.dedupeKey === `vehicle:${vehicleId}:insurance:expiry:30`)
  assert.ok(note)
  assert.deepEqual(note.roles, ['GM', 'OPERATIONS'])

  let result = markRead(state, 'user-gm', note.id, clock)
  assert.equal(result.ok, true)
  if (!result.ok) return
  state = result.state
  state = must(state, 'user-gm', {
    action: 'createEmployee',
    input: { nameAr: 'موظف تحديث', department: 'عام', jobTitle: 'عامل', basicSalary: 300 },
  }, clock)
  assert.equal(state.notifications.filter((item) => item.dedupeKey === note.dedupeKey).length, 1)

  for (const userId of ['user-admin', 'user-ops']) {
    result = markRead(state, userId, note.id, clock)
    assert.equal(result.ok, true)
    if (!result.ok) return
    state = result.state
  }
  state = must(state, 'user-gm', {
    action: 'createEmployee',
    input: { nameAr: 'موظف تحديث آخر', department: 'عام', jobTitle: 'عامل', basicSalary: 300 },
  }, clock)
  assert.equal(state.notifications.filter((item) => item.dedupeKey === note.dedupeKey).length, 2)
})
