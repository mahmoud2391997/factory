import { NextResponse, type NextRequest } from 'next/server'

import { publicState } from '@/lib/erp/domain/engine'
import { getSessionUser } from '@/server/auth/session'
import { backupUnavailableMessage, getAttachmentRequestLanguage } from '@/server/erp/attachment-policy'
import { loadState, writeLocalCopy } from '@/server/erp/store'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  if (!user.permissions.includes('settings.read') && !user.permissions.includes('settings.update')) {
    return NextResponse.json({ success: false, message: 'النسخ الاحتياطي متاح للإدارة' }, { status: 403 })
  }
  const language = getAttachmentRequestLanguage(req.headers)
  let loaded
  try {
    loaded = await loadState()
  } catch (error) {
    console.error('[erp/backup]', error)
    if (process.env.VERCEL) {
      return NextResponse.json({
        success: false,
        code: 'BACKUP_UNAVAILABLE',
        message: backupUnavailableMessage(language),
      }, { status: 503 })
    }
    throw error
  }
  if (!process.env.VERCEL) {
    await writeLocalCopy(loaded.state).catch((error) => console.error('[erp/backup]', error))
  }
  const body = user.permissions.includes('settings.update') ? loaded.state : publicState(loaded.state, user.permissions, user.id)
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="gulf-feed-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      'cache-control': 'private, no-store',
      'x-erp-backup-mode': process.env.VERCEL ? 'download-only' : 'download-and-local-copy',
    },
  })
}
