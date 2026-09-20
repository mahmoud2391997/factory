import type { NextRequest } from 'next/server'

import { prisma } from '@/server/db'
import { getAccessTokenFromRequest, verifyAccessToken } from '@/server/auth/jwt'
import { getDemoSessionUser, isDemoMode, isDemoUserId } from '@/server/demo'

export type SessionUser = {
  id: string
  email: string
  fullName: string
  isActive: boolean
  roles: Array<{ key: string; nameAr: string }>
  permissions: string[]
}

export async function getSessionUserById(userId: string): Promise<SessionUser | null> {
  if (isDemoUserId(userId)) {
    return getDemoSessionUser()
  }

  if (isDemoMode()) {
    return null
  }

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
  }
}

export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  const token = getAccessTokenFromRequest(req)
  if (!token) return null

  const payload = await verifyAccessToken(token)
  if (!payload?.sub) return null

  return getSessionUserById(payload.sub)
}
