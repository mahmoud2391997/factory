import type { ErpState } from '@/lib/erp/domain/types'

export type PublicUser = Omit<ErpState['users'][number], 'passwordHash'>
export type PublicState = Omit<ErpState, 'users'> & { users: PublicUser[] }

export type ActResult = {
  ok: boolean
  message: string
  extra?: Record<string, unknown> | null
}

export type Act = (action: string, input?: Record<string, unknown>) => Promise<ActResult>

export type LiveCtx = {
  state: PublicState
  permissions: string[]
  pending: boolean
  act: Act
  navigate: (entityKey: string) => void
  refreshUser: () => Promise<void>
}
