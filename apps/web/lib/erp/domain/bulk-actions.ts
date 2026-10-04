import { applyCommand } from './engine'
import type { Actor, Command, ErpState } from './types'

export type BulkCommandResultItem = {
  id: string
  action: string
  ok: boolean
  message?: string
  error?: string
}

export type BulkEngineResult = {
  ok: boolean
  state: ErpState
  results: BulkCommandResultItem[]
  successCount: number
  failureCount: number
}

export function executeBulkEngineCommands(
  state: ErpState,
  actor: Actor,
  commands: Command[],
): BulkEngineResult {
  let currentState = state
  const results: BulkCommandResultItem[] = []
  let successCount = 0
  let failureCount = 0

  for (const cmd of commands) {
    const id = String((cmd.input as { id?: unknown })?.id ?? '')
    const res = applyCommand(currentState, actor, cmd)
    if (res.ok) {
      currentState = res.state
      successCount += 1
      results.push({
        id,
        action: cmd.action,
        ok: true,
        message: res.message,
      })
    } else {
      failureCount += 1
      results.push({
        id,
        action: cmd.action,
        ok: false,
        error: res.error,
      })
    }
  }

  return {
    ok: failureCount === 0,
    state: currentState,
    results,
    successCount,
    failureCount,
  }
}
