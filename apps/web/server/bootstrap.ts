export function isBootstrapAlreadyCreatedError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  if ('code' in error && (error as { code?: unknown }).code === 'P2002') return true
  return error instanceof Error && /unique constraint/i.test(error.message)
}

/** Create the one `main` ERP document; database uniqueness serializes concurrent bootstrap requests. */
export async function createBootstrapDocument(create: () => Promise<unknown>) {
  try {
    await create()
    return true
  } catch (error) {
    if (isBootstrapAlreadyCreatedError(error)) return false
    throw error
  }
}
