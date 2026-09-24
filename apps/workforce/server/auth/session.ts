import type { NextRequest } from 'next/server'

import { prisma } from '@/server/db'
import { DEFAULT_ROLES, type Permission } from '@/lib/permissions'
import { getAccessTokenFromRequest, verifyAccessToken } from '@/server/auth/jwt'

export type SessionUser = {
  id: string
  email: string
  profile: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    role: string
    teamId: string | null
  } | null
  permissions: Permission[]
}

async function permissionsFor(role: string, teamId: string | null): Promise<Permission[]> {
  if (DEFAULT_ROLES[role]) return DEFAULT_ROLES[role].permissions
  if (!teamId) return []
  const custom = await prisma.workforceCustomRole.findUnique({
    where: { teamId_name: { teamId, name: role } },
    select: { permissions: true },
  })
  const raw = (custom?.permissions ?? []) as unknown
  if (!Array.isArray(raw)) return []
  return raw.filter((p): p is Permission => typeof p === 'string') as Permission[]
}

export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  const token = getAccessTokenFromRequest(req)
  if (!token) return null
  const payload = await verifyAccessToken(token)
  if (!payload?.sub) return null

  const user = await prisma.workforceUser.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      profile: { select: { id: true, email: true, firstName: true, lastName: true, role: true, teamId: true } },
    },
  })
  if (!user) return null
  const perms = await permissionsFor(user.profile?.role ?? 'EMPLOYEE', user.profile?.teamId ?? null)
  return {
    id: user.id,
    email: user.email,
    profile: user.profile
      ? {
          id: user.profile.id,
          email: user.profile.email,
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          role: user.profile.role,
          teamId: user.profile.teamId,
        }
      : null,
    permissions: perms,
  }
}

