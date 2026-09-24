import { NextResponse, type NextRequest } from 'next/server'

import { publicState } from '@/lib/erp/domain/engine'
import { getSessionUser } from '@/server/auth/session'
import { loadState, writeLocalCopy } from '@/server/erp/store'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  if (!user.permissions.includes('settings.read') && !user.permissions.includes('settings.update')) {
    return NextResponse.json({ success: false, message: 'النسخ الاحتياطي متاح للإدارة' }, { status: 403 })
  }
  const loaded = await loadState()
  await writeLocalCopy(loaded.state).catch((error) => console.error('[erp/backup]', error))
  const body = user.permissions.includes('settings.update') ? loaded.state : publicState(loaded.state, user.permissions)
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="gulf-feed-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
