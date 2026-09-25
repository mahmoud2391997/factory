import type { NextRequest } from 'next/server'

import { ROLE_LABELS } from '@/lib/erp/domain/permissions'
import { getAccessTokenFromRequest, verifyAccessToken } from '@/server/auth/jwt'
import { isDemoMode } from '@/server/demo'
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

  if (isDemoMode()) {
    return null
  }

  const { prisma } = await import('@/server/db')
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      isActive: true,
      roles: {
        select: {
          role: {
            select: {
              key: true,
              nameAr: true,
              permissions: {
                select: {
                  permission: { select: { key: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!user || !user.isActive) return null

  const roles = user.roles.map((entry) => ({
    key: entry.role.key,
    nameAr: entry.role.nameAr,
  }))

  const permissions = Array.from(
    new Set(user.roles.flatMap((entry) => entry.role.permissions.map((rp) => rp.permission.key))),
  ).sort()

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    isActive: user.isActive,
    roles,
    permissions,
    mustChangePassword: false,
  }
}

export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  const token = getAccessTokenFromRequest(req)
  if (!token) return null

  const payload = await verifyAccessToken(token)
  if (!payload?.sub) return null

  return getSessionUserById(payload.sub)
}
