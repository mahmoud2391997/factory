import type { NextRequest } from 'next/server'

import { ROLE_LABELS } from '@/lib/erp/domain/permissions'
import { getAccessTokenFromRequest, verifyAccessToken } from '@/server/auth/jwt'
import { loadState } from '@/server/erp/store'

export type SessionUser = {
  id: string
  email: string
  fullName: string
  isActive: boolean
  roles: Array<{ key: string; nameAr: string }>
  permissions: string[]
  mustChangePassword: boolean
}

export async function getSessionUserById(userId: string): Promise<SessionUser | null> {
  try {
    const loaded = await loadState()
    const erpUser = loaded.state.users.find((item) => item.id === userId && item.active)
    if (erpUser) {
      return {
        id: erpUser.id,
        email: erpUser.email,
        fullName: erpUser.fullName,
        isActive: true,
        roles: [{ key: erpUser.role, nameAr: ROLE_LABELS[erpUser.role] }],
        permissions: [...loaded.state.rolePermissions[erpUser.role]],
        mustChangePassword: Boolean(erpUser.mustChangePassword),
      }
    }
  } catch (error) {
    console.error('[session/erp]', error)
  }
  return null
}

export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  const token = getAccessTokenFromRequest(req)
  if (!token) return null

  const payload = await verifyAccessToken(token)
  if (!payload?.sub) return null
  const ver = typeof payload.ver === 'number' ? payload.ver : 1

  try {
    const loaded = await loadState()
    const erpUser = loaded.state.users.find((item) => item.id === payload.sub && item.active)
    if (!erpUser) return null
    const expected = erpUser.tokenVersion ?? 1
    if (expected !== ver) return null
    return {
      id: erpUser.id,
      email: erpUser.email,
      fullName: erpUser.fullName,
      isActive: true,
      roles: [{ key: erpUser.role, nameAr: ROLE_LABELS[erpUser.role] }],
      permissions: [...loaded.state.rolePermissions[erpUser.role]],
      mustChangePassword: Boolean(erpUser.mustChangePassword),
    }
  } catch (error) {
    console.error('[session/erp]', error)
    return null
  }
}
