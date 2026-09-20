import { NextResponse, type NextRequest } from 'next/server'

import { getSessionUser, type SessionUser } from '@/server/auth/session'

type AuthOk = { ok: true; user: SessionUser }
type AuthFail = { ok: false; response: NextResponse }

export async function requireAuth(req: NextRequest): Promise<AuthOk | AuthFail> {
  const user = await getSessionUser(req)
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 }),
    }
  }
  return { ok: true, user }
}

export async function requirePermission(
  req: NextRequest,
  permission: string | string[],
): Promise<AuthOk | AuthFail> {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth

  const needed = Array.isArray(permission) ? permission : [permission]
  const allowed = needed.some((key) => auth.user.permissions.includes(key))
  if (!allowed) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, message: 'ليس لديك صلاحية لهذه العملية' }, { status: 403 }),
    }
  }

  return auth
}

export function hasPermission(user: SessionUser, permission: string | string[]) {
  const needed = Array.isArray(permission) ? permission : [permission]
  return needed.some((key) => user.permissions.includes(key))
}
