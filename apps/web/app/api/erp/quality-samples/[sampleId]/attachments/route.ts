import { randomUUID } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'

import { inspectDocumentAttachment } from '@/lib/erp/domain/document-attachments'
import {
  attachmentRequestTooLargeMessage,
  attachmentStorageUnavailableMessage,
  attachmentTooLargeMessage,
  getAttachmentRequestLanguage,
  getAttachmentUploadLimits,
} from '@/server/erp/attachment-policy'
import { getSessionUser } from '@/server/auth/session'
import { loadState, removePrivateAttachment, runCommand, writePrivateAttachment } from '@/server/erp/store'
import { toApiError } from '@/server/env'

export const runtime = 'nodejs'

export async function POST(request: NextRequest, context: { params: Promise<{ sampleId: string }> }) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  if (!user.permissions.includes('qc.manage')) {
    return NextResponse.json({ success: false, message: 'ليست لديك صلاحية إدارة عينات الجودة' }, { status: 403 })
  }
  const isVercel = Boolean(process.env.VERCEL)
  const limits = getAttachmentUploadLimits(isVercel)
  const language = getAttachmentRequestLanguage(request.headers)
  const contentLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > limits.maxRequestBytes) {
    const message = isVercel
      ? attachmentRequestTooLargeMessage(language)
      : attachmentTooLargeMessage(language, false)
    return NextResponse.json({ success: false, message, code: 'ATTACHMENT_TOO_LARGE' }, { status: 413 })
  }

  try {
    const { sampleId } = await context.params
    const { state } = await loadState()
    if (!state.qualitySamples.some((sample) => sample.id === sampleId)) {
      return NextResponse.json({ success: false, message: 'عينة الجودة غير موجودة' }, { status: 404 })
    }
    const form = await request.formData()
    const value = form.get('file')
    if (!(value instanceof File)) {
      return NextResponse.json({ success: false, message: 'اختر ملف تقرير PDF أو صورة PNG/JPEG' }, { status: 400 })
    }
    if (value.size > limits.maxFileBytes) {
      return NextResponse.json({
        success: false,
        message: attachmentTooLargeMessage(language, isVercel),
        code: 'ATTACHMENT_TOO_LARGE',
      }, { status: 413 })
    }
    if (isVercel) {
      return NextResponse.json({
        success: false,
        message: attachmentStorageUnavailableMessage(language),
        code: 'ATTACHMENT_STORAGE_UNAVAILABLE',
      }, { status: 503 })
    }

    const bytes = new Uint8Array(await value.arrayBuffer())
    const inspected = inspectDocumentAttachment(value.name, bytes)
    if (!inspected.ok) {
      const status = value.size > 10 * 1024 * 1024 ? 413 : 415
      return NextResponse.json({ success: false, message: inspected.error }, { status })
    }

    const id = randomUUID()
    await writePrivateAttachment(id, bytes)
    try {
      const result = await runCommand(user.id, 'addQualitySampleAttachment', {
        sampleId,
        id,
        fileName: inspected.fileName,
        mediaType: inspected.mediaType,
        sizeBytes: bytes.byteLength,
      })
      if (!result.ok) {
        await removePrivateAttachment(id)
        return NextResponse.json({ success: false, message: result.error }, { status: 400 })
      }
      const attachment = result.state.qualitySamples
        .find((sample) => sample.id === sampleId)
        ?.attachments?.find((item) => item.id === id)
      return NextResponse.json({ success: true, data: attachment }, { status: 201 })
    } catch (error) {
      await removePrivateAttachment(id)
      throw error
    }
  } catch (error) {
    console.error('[erp/quality-attachment-upload]', error)
    const mapped = toApiError(error)
    return NextResponse.json(mapped.body, { status: mapped.status })
  }
}
