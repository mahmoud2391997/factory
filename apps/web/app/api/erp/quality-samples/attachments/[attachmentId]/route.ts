import { NextResponse, type NextRequest } from 'next/server'

import { getSessionUser } from '@/server/auth/session'
import { loadState, readPrivateAttachment } from '@/server/erp/store'
import { toApiError } from '@/server/env'

export const runtime = 'nodejs'

export async function GET(request: NextRequest, context: { params: Promise<{ attachmentId: string }> }) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  if (!user.permissions.includes('qc.read') && !user.permissions.includes('qc.manage')) {
    return NextResponse.json({ success: false, message: 'ليست لديك صلاحية قراءة عينات الجودة' }, { status: 403 })
  }

  try {
    const { attachmentId } = await context.params
    const { state } = await loadState()
    const attachment = state.qualitySamples
      .flatMap((sample) => sample.attachments ?? [])
      .find((item) => item.id === attachmentId)
    if (!attachment) return NextResponse.json({ success: false, message: 'مرفق تقرير المختبر غير موجود' }, { status: 404 })
    const bytes = await readPrivateAttachment(attachmentId)
    if (!bytes) return NextResponse.json({ success: false, message: 'ملف التقرير غير موجود في التخزين' }, { status: 404 })
    const encodedName = encodeURIComponent(attachment.fileName).replace(/[!'()*]/g, (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    )
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'content-type': attachment.mediaType,
        'content-length': String(attachment.sizeBytes),
        'content-disposition': `attachment; filename="quality-report"; filename*=UTF-8''${encodedName}`,
        'cache-control': 'private, no-store',
        'x-content-type-options': 'nosniff',
        'content-security-policy': "default-src 'none'; sandbox",
      },
    })
  } catch (error) {
    console.error('[erp/quality-attachment-download]', error)
    const mapped = toApiError(error)
    return NextResponse.json(mapped.body, { status: mapped.status })
  }
}
