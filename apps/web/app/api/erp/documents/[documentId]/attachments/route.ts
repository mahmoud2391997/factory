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
import { removePrivateAttachment, writePrivateAttachment, loadState, runCommand } from '@/server/erp/store'
import { toApiError } from '@/server/env'

export const runtime = 'nodejs'

export async function POST(request: NextRequest, context: { params: Promise<{ documentId: string }> }) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  if (!user.permissions.includes('documents.manage')) {
    return NextResponse.json({ success: false, message: 'ليست لديك صلاحية إدارة الوثائق' }, { status: 403 })
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
    const { documentId } = await context.params
    const { state } = await loadState()
    if (!state.companyDocuments.some((document) => document.id === documentId)) {
      return NextResponse.json({ success: false, message: 'المستند غير موجود' }, { status: 404 })
    }

    const form = await request.formData()
    const value = form.get('file')
    if (!(value instanceof File)) {
      return NextResponse.json({ success: false, message: 'اختر ملف PDF أو صورة PNG/JPEG' }, { status: 400 })
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

    let fileName = inspected.fileName
    const customNameRaw = form.get('fileName')
    if (typeof customNameRaw === 'string' && customNameRaw.trim()) {
      const customName = customNameRaw
        .replaceAll('\\', '/')
        .split('/')
        .pop()!
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .trim()
        .slice(0, 160)
      if (customName) {
        const extension = customName.split('.').pop()?.toLocaleLowerCase()
        const matchesExtension =
          (inspected.mediaType === 'application/pdf' && extension === 'pdf') ||
          (inspected.mediaType === 'image/png' && extension === 'png') ||
          (inspected.mediaType === 'image/jpeg' && (extension === 'jpg' || extension === 'jpeg'))
        fileName = matchesExtension ? customName : inspected.fileName
      }
    }

    const id = randomUUID()
    await writePrivateAttachment(id, bytes)
    try {
      const result = await runCommand(user.id, 'addCompanyDocumentAttachment', {
        documentId,
        id,
        fileName,
        mediaType: inspected.mediaType,
        sizeBytes: bytes.byteLength,
      })
      if (!result.ok) {
        await removePrivateAttachment(id)
        return NextResponse.json({ success: false, message: result.error }, { status: 400 })
      }
      const attachment = result.state.companyDocuments
        .find((document) => document.id === documentId)
        ?.attachments?.find((item) => item.id === id)
      return NextResponse.json({ success: true, data: attachment }, { status: 201 })
    } catch (error) {
      await removePrivateAttachment(id)
      throw error
    }
  } catch (error) {
    console.error('[erp/document-attachment-upload]', error)
    const mapped = toApiError(error)
    return NextResponse.json(mapped.body, { status: mapped.status })
  }
}
