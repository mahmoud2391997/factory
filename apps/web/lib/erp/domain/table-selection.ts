export function toggleItem(selected: string[], id: string): string[] {
  if (selected.includes(id)) {
    return selected.filter((item) => item !== id)
  }
  return [...selected, id]
}

export function selectPage(selected: string[], pageIds: string[]): string[] {
  const next = new Set(selected)
  for (const id of pageIds) {
    next.add(id)
  }
  return Array.from(next)
}

export function deselectPage(selected: string[], pageIds: string[]): string[] {
  const pageSet = new Set(pageIds)
  return selected.filter((id) => !pageSet.has(id))
}

export function selectAll(allFilteredIds: string[]): string[] {
  return Array.from(new Set(allFilteredIds))
}

export function clearSelection(): string[] {
  return []
}

export function isAllPageSelected(selected: string[], pageIds: string[]): boolean {
  if (pageIds.length === 0) return false
  const selectedSet = new Set(selected)
  return pageIds.every((id) => selectedSet.has(id))
}

export function isAllFilteredSelected(selected: string[], allFilteredIds: string[]): boolean {
  if (allFilteredIds.length === 0) return false
  const selectedSet = new Set(selected)
  return allFilteredIds.every((id) => selectedSet.has(id))
}

export function removeSuccessful(selected: string[], successfulIds: string[]): string[] {
  const successSet = new Set(successfulIds)
  return selected.filter((id) => !successSet.has(id))
}

export async function executeBulkAction(
  ids: string[],
  actionFn: (id: string) => Promise<{ ok: boolean; error?: string }>,
): Promise<{
  successful: string[]
  failed: Array<{ id: string; error: string }>
  successCount: number
  failureCount: number
}> {
  const successful: string[] = []
  const failed: Array<{ id: string; error: string }> = []

  for (const id of ids) {
    try {
      const res = await actionFn(id)
      if (res.ok) {
        successful.push(id)
      } else {
        failed.push({ id, error: res.error || 'فشلت العملية' })
      }
    } catch (err) {
      failed.push({ id, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return {
    successful,
    failed,
    successCount: successful.length,
    failureCount: failed.length,
  }
}
