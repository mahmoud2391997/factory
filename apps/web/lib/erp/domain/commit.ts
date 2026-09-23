export const REVISION_CONFLICT = 'تعارض في حفظ البيانات. أعد المحاولة.'

export function isRevisionConflict(error: unknown) {
  return error instanceof Error && error.message === REVISION_CONFLICT
}

/** Re-run a load/apply/persist cycle when another writer won the revision check. */
export async function commitWithRetry<T>(run: () => Promise<T>, attempts = 3): Promise<T> {
  let last: unknown
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await run()
    } catch (error) {
      last = error
      if (!isRevisionConflict(error) || attempt === attempts - 1) throw error
    }
  }
  throw last
}
