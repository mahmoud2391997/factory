import { randomUUID } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'

import { inspectDocumentAttachment } from '@/lib/erp/domain/document-attachments'
import { getSessionUser } from '@/server/auth/session'
import { removeCompanyDocumentAttachment, writeCompanyDocumentAttachment, loadState, runCommand } from '@/server/erp/store'
import { toApiError } from '@/server/env'

export const runtime = 'nodejs'

export async function POST(request: NextRequest, context: { params: Promise<{ documentId: string }> }) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  if (!user.permissions.includes('documents.manage')) {
    return NextResponse.json({ success: false, message: 'ليست لديك صلاحية إدارة الوثائق' }, { status: 403 })
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
    const bytes = new Uint8Array(await value.arrayBuffer())
    const inspected = inspectDocumentAttachment(value.name, bytes)
    if (!inspected.ok) {
      const status = value.size > 10 * 1024 * 1024 ? 413 : 415
      return NextResponse.json({ success: false, message: inspected.error }, { status })
    }

    const id = randomUUID()
    await writeCompanyDocumentAttachment(id, bytes)
    try {
      const result = await runCommand(user.id, 'addCompanyDocumentAttachment', {
        documentId,
        id,
        fileName: inspected.fileName,
        mediaType: inspected.mediaType,
        sizeBytes: bytes.byteLength,
      })
      if (!result.ok) {
        await removeCompanyDocumentAttachment(id)
        return NextResponse.json({ success: false, message: result.error }, { status: 400 })
      }
      const attachment = result.state.companyDocuments
        .find((document) => document.id === documentId)
        ?.attachments?.find((item) => item.id === id)
      return NextResponse.json({ success: true, data: attachment }, { status: 201 })
    } catch (error) {
      await removeCompanyDocumentAttachment(id)
      throw error
    }
  } catch (error) {
    console.error('[erp/document-attachment-upload]', error)
    const mapped = toApiError(error)
    return NextResponse.json(mapped.body, { status: mapped.status })
  }
}
