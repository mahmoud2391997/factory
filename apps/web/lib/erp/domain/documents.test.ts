import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, applyCommand, defaultClock, publicState } from './engine'
import { inspectDocumentAttachment } from './document-attachments'
import { emptyState } from './seed'
import type { Clock, Command, ErpState } from './types'

/** Frozen so the 90/60/30/7 day ladder is asserted against fixed dates. */
const NOW = '2026-09-29T08:00:00.000Z'

function fixedClock(): Clock {
  let n = 0
  return {
    now: () => NOW,
    id: (prefix) => {
      n += 1
      return `${prefix}-${n}`
    },
  }
}

function must(state: ErpState, clock: Clock, command: Command, id = 'user-gm') {
  const actor = actorFromUser(state, id)
  assert.ok(actor)
  const result = applyCommand(state, actor, command, clock)
  if (!result.ok) throw new Error(`${command.action}: ${result.error}`)
  return result.state
}

function fail(state: ErpState, clock: Clock, command: Command, id = 'user-gm') {
  const actor = actorFromUser(state, id)
  if (!actor) return 'المستخدم غير موجود'
  const result = applyCommand(state, actor, command, clock)
  assert.equal(result.ok, false)
  return result.ok ? '' : result.error
}

function daysFromNow(days: number) {
  const date = new Date(NOW)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function expiryAlerts(state: ErpState, documentId: string) {
  return state.notifications.filter((note) => note.dedupeKey.startsWith(`doc:${documentId}:`))
}

test('createCompanyDocument stores the document and audits it', () => {
  const clock = fixedClock()
  let state = emptyState('documents')

  state = must(state, clock, {
    action: 'createCompanyDocument',
    input: {
      title: 'ترخيص بلدية صحار',
      kind: 'GOV_PERMIT',
      issueDate: '2025-01-01',
      expiryDate: daysFromNow(200),
      cost: 450.5,
      renewalOwnerId: 'user-acc',
      notes: 'يُجدد سنوياً',
    },
  })

  assert.equal(state.companyDocuments.length, 1)
  const document = state.companyDocuments[0]!
  assert.equal(document.title, 'ترخيص بلدية صحار')
  assert.equal(document.kind, 'GOV_PERMIT')
  assert.equal(document.issueDate, '2025-01-01')
  assert.equal(document.cost, 450.5)
  assert.equal(document.renewalOwnerId, 'user-acc')
  assert.equal(document.createdBy, 'user-gm')
  assert.equal(state.auditLogs[0]!.entity, 'companyDocument')
})

test('createCompanyDocument rejects an empty title', () => {
  const clock = fixedClock()
  const state = emptyState('documents')

  assert.match(
    fail(state, clock, {
      action: 'createCompanyDocument',
      input: { title: '   ', kind: 'LICENSE', issueDate: '2025-01-01' },
    }),
    /عنوان المستند مطلوب/,
  )
})

test('createCompanyDocument rejects an expiry on or before the issue date', () => {
  const clock = fixedClock()
  const state = emptyState('documents')

  assert.match(
    fail(state, clock, {
      action: 'createCompanyDocument',
      input: { title: 'عقد', kind: 'CONTRACT', issueDate: '2026-01-01', expiryDate: '2026-01-01' },
    }),
    /بعد تاريخ الإصدار/,
  )
})

test('createCompanyDocument rejects impossible calendar dates', () => {
  const clock = fixedClock()
  const state = emptyState('documents')
  assert.match(
    fail(state, clock, {
      action: 'createCompanyDocument',
      input: { title: 'ترخيص', kind: 'LICENSE', issueDate: '2026-02-30' },
    }),
    /تاريخ الإصدار غير صحيح/,
  )
})

test('createCompanyDocument validates the linked entity', () => {
  const clock = fixedClock()
  let state = emptyState('documents')

  assert.match(
    fail(state, clock, {
      action: 'createCompanyDocument',
      input: { title: 'تأمين', kind: 'INSURANCE', issueDate: '2026-01-01', entityType: 'VEHICLE' },
    }),
    /الجهة المرتبطة بالمستند مطلوبة/,
  )

  assert.match(
    fail(state, clock, {
      action: 'createCompanyDocument',
      input: { title: 'تأمين', kind: 'INSURANCE', issueDate: '2026-01-01', entityType: 'VEHICLE', entityId: 'nope' },
    }),
    /الجهة المرتبطة بالمستند غير موجودة/,
  )

  state = must(state, clock, {
    action: 'createVehicle',
    input: { code: 'V1', plateNo: '12345', type: 'TRUCK', nameAr: 'شاحنة' },
  })
  const vehicle = state.vehicles[0]!

  state = must(state, clock, {
    action: 'createCompanyDocument',
    input: {
      title: 'تأمين الشاحنة',
      kind: 'INSURANCE',
      issueDate: '2026-01-01',
      entityType: 'VEHICLE',
      entityId: vehicle.id,
    },
  })

  assert.equal(state.companyDocuments[0]!.entityId, vehicle.id)
  assert.match(state.auditLogs[0]!.detail, /12345/)
})

test('createCompanyDocument rejects an unknown renewal owner', () => {
  const clock = fixedClock()
  const state = emptyState('documents')

  assert.match(
    fail(state, clock, {
      action: 'createCompanyDocument',
      input: { title: 'عقد', kind: 'CONTRACT', issueDate: '2026-01-01', renewalOwnerId: 'nobody' },
    }),
    /المسؤول عن التجديد غير موجود/,
  )
})

test('only the general manager may file a company document', () => {
  const clock = fixedClock()
  const state = emptyState('documents')

  for (const id of ['user-acc', 'user-ops', 'user-driver']) {
    assert.match(
      fail(state, clock, {
        action: 'createCompanyDocument',
        input: { title: 'عقد', kind: 'CONTRACT', issueDate: '2026-01-01' },
      }, id),
      /صلاحية/,
    )
  }
})

test('expiry alerts start 90 days out and tighten through the ladder', () => {
  const clock = fixedClock()
  let state = emptyState('documents')

  // 91 days: outside every window.
  state = must(state, clock, {
    action: 'createCompanyDocument',
    input: { title: 'بعيد', kind: 'LICENSE', issueDate: '2026-01-01', expiryDate: daysFromNow(91) },
  })
  assert.equal(expiryAlerts(state, state.companyDocuments[0]!.id).length, 0)

  // 90 days: the widest window opens.
  state = must(state, clock, {
    action: 'createCompanyDocument',
    input: { title: 'على الحد', kind: 'LICENSE', issueDate: '2026-01-01', expiryDate: daysFromNow(90) },
  })
  const atNinety = state.companyDocuments[0]!
  assert.deepEqual(expiryAlerts(state, atNinety.id).map((note) => note.dedupeKey), [`doc:${atNinety.id}:expiry:90`])

  // 45 days falls inside the 90 and 60 windows; the tightest one wins so the alert re-fires.
  state = must(state, clock, {
    action: 'createCompanyDocument',
    input: { title: 'قريب', kind: 'LICENSE', issueDate: '2026-01-01', expiryDate: daysFromNow(45) },
  })
  const atFortyFive = state.companyDocuments[0]!
  assert.deepEqual(expiryAlerts(state, atFortyFive.id).map((note) => note.dedupeKey), [`doc:${atFortyFive.id}:expiry:60`])

  // 5 days: the tightest window of all.
  state = must(state, clock, {
    action: 'createCompanyDocument',
    input: { title: 'عاجل', kind: 'LICENSE', issueDate: '2026-01-01', expiryDate: daysFromNow(5) },
  })
  const atFive = state.companyDocuments[0]!
  assert.deepEqual(expiryAlerts(state, atFive.id).map((note) => note.dedupeKey), [`doc:${atFive.id}:expiry:7`])
})

test('an already expired document raises its own alert', () => {
  const clock = fixedClock()
  let state = emptyState('documents')

  state = must(state, clock, {
    action: 'createCompanyDocument',
    input: { title: 'منتهي', kind: 'INSPECTION', issueDate: '2024-01-01', expiryDate: daysFromNow(-9) },
  })

  const document = state.companyDocuments[0]!
  assert.deepEqual(expiryAlerts(state, document.id).map((note) => note.dedupeKey), [`doc:${document.id}:expired`])
  assert.match(expiryAlerts(state, document.id)[0]!.title, /منتهي/)
})

test('a document without an expiry date never alerts', () => {
  const clock = fixedClock()
  let state = emptyState('documents')

  state = must(state, clock, {
    action: 'createCompanyDocument',
    input: { title: 'ملكية أرض', kind: 'OWNERSHIP', issueDate: '2020-01-01' },
  })

  assert.equal(state.companyDocuments[0]!.expiryDate, undefined)
  assert.equal(expiryAlerts(state, state.companyDocuments[0]!.id).length, 0)
})

test('renewCompanyDocument moves the dates and clears the old alerts', () => {
  const clock = fixedClock()
  let state = emptyState('documents')

  state = must(state, clock, {
    action: 'createCompanyDocument',
    input: { title: 'تأمين', kind: 'INSURANCE', issueDate: '2025-01-01', expiryDate: daysFromNow(20), cost: 300 },
  })
  const document = state.companyDocuments[0]!
  assert.equal(expiryAlerts(state, document.id).length, 1)
  assert.equal(expiryAlerts(state, document.id)[0]!.read, false)

  state = must(state, clock, {
    action: 'renewCompanyDocument',
    input: { id: document.id, issueDate: '2026-09-29', expiryDate: daysFromNow(385), cost: 320, notes: 'تجديد' },
  })

  const renewed = state.companyDocuments[0]!
  assert.equal(renewed.issueDate, '2026-09-29')
  assert.equal(renewed.cost, 320)
  assert.equal(renewed.notes, 'تجديد')
  assert.equal(renewed.renewalHistory?.length, 1)
  assert.deepEqual(renewed.renewalHistory?.[0], {
    issueDate: '2025-01-01',
    expiryDate: daysFromNow(20),
    cost: 300,
    notes: undefined,
    attachmentIds: [],
    renewedBy: 'user-gm',
    renewedAt: NOW,
  })
  // Pushed outside every window, so no new alert, and the old one is marked read.
  assert.equal(expiryAlerts(state, document.id).length, 1)
  assert.equal(expiryAlerts(state, document.id)[0]!.read, true)
})

test('renewCompanyDocument rejects an unknown document and a bad window', () => {
  const clock = fixedClock()
  let state = emptyState('documents')

  assert.match(
    fail(state, clock, { action: 'renewCompanyDocument', input: { id: 'nope', issueDate: '2026-01-01' } }),
    /المستند غير موجود/,
  )

  state = must(state, clock, {
    action: 'createCompanyDocument',
    input: { title: 'عقد', kind: 'CONTRACT', issueDate: '2025-01-01', expiryDate: '2026-01-01' },
  })
  const document = state.companyDocuments[0]!

  assert.match(
    fail(state, clock, {
      action: 'renewCompanyDocument',
      input: { id: document.id, issueDate: '2026-06-01', expiryDate: '2026-05-01' },
    }),
    /بعد تاريخ الإصدار/,
  )
})

test('renewing without an expiry date keeps the one already on file', () => {
  const clock = fixedClock()
  let state = emptyState('documents')

  state = must(state, clock, {
    action: 'createCompanyDocument',
    input: { title: 'شهادة', kind: 'CERTIFICATE', issueDate: '2025-01-01', expiryDate: daysFromNow(300) },
  })
  const document = state.companyDocuments[0]!

  state = must(state, clock, {
    action: 'renewCompanyDocument',
    input: { id: document.id, issueDate: '2026-09-29' },
  })

  assert.equal(state.companyDocuments[0]!.expiryDate, daysFromNow(300))
})

test('document attachments are permission checked, validated and kept with their issue-date version', () => {
  const clock = fixedClock()
  let state = must(emptyState('documents'), clock, {
    action: 'createCompanyDocument',
    input: { title: 'ترخيص', kind: 'LICENSE', issueDate: '2025-01-01', expiryDate: '2027-01-01' },
  })
  const document = state.companyDocuments[0]!
  const input = {
    documentId: document.id,
    id: '7f16e395-d44f-44e8-b302-06117c7c221e',
    fileName: 'license.pdf',
    mediaType: 'application/pdf' as const,
    sizeBytes: 512,
  }

  assert.match(
    fail(state, clock, { action: 'addCompanyDocumentAttachment', input }, 'user-acc'),
    /صلاحية/,
  )
  assert.match(
    fail(state, clock, {
      action: 'addCompanyDocumentAttachment',
      input: { ...input, mediaType: 'text/html' as typeof input.mediaType },
    }),
    /نوع الملف غير مدعوم/,
  )
  assert.match(
    fail(state, clock, {
      action: 'addCompanyDocumentAttachment',
      input: { ...input, sizeBytes: 10 * 1024 * 1024 + 1 },
    }),
    /حجم الملف غير صحيح/,
  )

  state = must(state, clock, { action: 'addCompanyDocumentAttachment', input })
  assert.deepEqual(state.companyDocuments[0]!.attachments, [{
    id: input.id,
    fileName: input.fileName,
    mediaType: input.mediaType,
    sizeBytes: input.sizeBytes,
    issueDate: '2025-01-01',
    uploadedBy: 'user-gm',
    uploadedAt: NOW,
  }])

  state = must(state, clock, {
    action: 'renewCompanyDocument',
    input: { id: document.id, issueDate: '2026-09-29', expiryDate: '2028-09-29' },
  })
  assert.equal(state.companyDocuments[0]!.attachments?.[0]?.issueDate, '2025-01-01')
  assert.deepEqual(state.companyDocuments[0]!.renewalHistory?.[0]?.attachmentIds, [input.id])
})

test('attachment inspection rejects spoofed content and sanitizes upload names', () => {
  const pdf = new TextEncoder().encode('%PDF-1.7 test')
  assert.deepEqual(inspectDocumentAttachment('../../contract.pdf', pdf), {
    ok: true,
    fileName: 'contract.pdf',
    mediaType: 'application/pdf',
  })
  assert.equal(inspectDocumentAttachment('fake.pdf', new TextEncoder().encode('<script>')).ok, false)
  assert.equal(inspectDocumentAttachment('contract.pdf', new Uint8Array()).ok, false)
})

test('public state does not reveal company documents without documents.read', () => {
  const state = emptyState('documents')
  state.companyDocuments.push({
    id: 'private-doc',
    title: 'عقد سري',
    kind: 'CONTRACT',
    issueDate: '2026-01-01',
    createdBy: 'user-gm',
    createdAt: NOW,
  })
  assert.deepEqual(publicState(state, [] as string[]).companyDocuments, [])
  assert.equal(publicState(state, ['documents.read']).companyDocuments.length, 1)
  assert.equal(publicState(state, ['documents.manage']).companyDocuments.length, 1)
})

test('the default clock still files documents', () => {
  const clock = defaultClock()
  let state = emptyState('documents')

  state = must(state, clock, {
    action: 'createCompanyDocument',
    input: { title: 'إيجار', kind: 'LEASE', issueDate: '2026-01-01', expiryDate: '2027-01-01', cost: 1200 },
  })

  assert.equal(state.companyDocuments.length, 1)
})
