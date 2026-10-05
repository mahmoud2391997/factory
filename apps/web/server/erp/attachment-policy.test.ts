import assert from 'node:assert/strict'
import { test } from 'node:test'

const policyModule = './attachment-policy'

test('Vercel attachment upload is capped at 4 MB within the 4.5 MB request limit', async () => {
  const { getAttachmentUploadLimits } = await import(policyModule) as {
    getAttachmentUploadLimits: (isVercel: boolean) => { maxFileBytes: number; maxRequestBytes: number }
  }
  assert.deepEqual(getAttachmentUploadLimits(true), {
    maxFileBytes: 4 * 1024 * 1024,
    maxRequestBytes: 4.5 * 1024 * 1024,
  })
  assert.deepEqual(getAttachmentUploadLimits(false), {
    maxFileBytes: 10 * 1024 * 1024,
    maxRequestBytes: 11 * 1024 * 1024,
  })
})

test('Vercel attachment storage warnings are available in Arabic, English, and Hindi', async () => {
  const { attachmentStorageUnavailableMessage } = await import(policyModule) as {
    attachmentStorageUnavailableMessage: (language: 'ar' | 'en' | 'hi') => string
  }
  const messages = (['ar', 'en', 'hi'] as const).map(attachmentStorageUnavailableMessage)
  assert.ok(messages.every((message) => message.trim().length > 20))
  assert.equal(new Set(messages).size, 3)
})

test('missing Vercel attachment bytes have localized recovery messages', async () => {
  const { attachmentDownloadUnavailableMessage } = await import(policyModule) as {
    attachmentDownloadUnavailableMessage: (language: 'ar' | 'en' | 'hi') => string
  }
  const messages = (['ar', 'en', 'hi'] as const).map(attachmentDownloadUnavailableMessage)
  assert.ok(messages.every((message) => message.trim().length > 30))
  assert.ok(messages[0]?.includes('Vercel'))
  assert.ok(messages[1]?.includes('Vercel'))
  assert.ok(messages[2]?.includes('Vercel'))
})
