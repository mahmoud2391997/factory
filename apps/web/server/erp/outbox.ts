/** Durable claim before transport. Ambiguous sends are held for reconciliation, never blindly retried. */
export type OutboxMessage = { id: string; status: 'pending' | 'sending' | 'sent' | 'uncertain'; attempts: number }

export async function dispatchOutbox<T extends OutboxMessage>(
  store: { claim: () => Promise<T | null>; finish: (id: string, status: 'sent' | 'uncertain', attempts: number) => Promise<void> },
  send: (message: T) => Promise<void>,
  limit = 20,
) {
  let sent = 0
  for (let i = 0; i < limit; i++) {
    const message = await store.claim()
    if (!message) break
    try { await send(message) } catch {
      await store.finish(message.id, 'uncertain', message.attempts)
      continue
    }
    await store.finish(message.id, 'sent', message.attempts)
    sent++
  }
  return sent
}

/** Ignore a completion from an older attempt after an operator has reconciled/requeued it. */
export function settleOutboxAttempt(message: { emailStatus: string; emailAttempts?: number } | undefined, attempts: number, status: 'sent' | 'uncertain') {
  if (!message || message.emailStatus !== 'sending' || message.emailAttempts !== attempts) return false
  message.emailStatus = status
  return true
}
