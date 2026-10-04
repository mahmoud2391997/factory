export type PageTabOption = {
  id: string
  href: string
  label: string
  group?: string
  groupLabel?: string
}

export type PageTabGroup<T extends PageTabOption = PageTabOption> = {
  id: string
  label: string
  tabs: T[]
}

export type PageTabsModel<T extends PageTabOption = PageTabOption> = {
  groups: PageTabGroup<T>[]
  visible: T[]
  overflow: T[]
}

/** Build deterministic nav groups and a lossless visible/overflow partition. */
export function buildPageTabsModel<T extends PageTabOption>(
  tabs: T[],
  activeId: string,
  maxVisible: number,
): PageTabsModel<T> {
  const visibleLimit = Math.max(1, Math.floor(maxVisible))
  const grouped = new Map<string, PageTabGroup<T>>()

  for (const tab of tabs) {
    const id = tab.group || 'pages'
    const group = grouped.get(id)
    if (group) {
      group.tabs.push(tab)
    } else {
      grouped.set(id, { id, label: tab.groupLabel || tab.group || '', tabs: [tab] })
    }
  }

  let visible = tabs.length > visibleLimit ? tabs.slice(0, visibleLimit) : [...tabs]
  const activeTab = tabs.find((tab) => tab.id === activeId)
  if (tabs.length > visibleLimit && activeTab && !visible.some((tab) => tab.id === activeId)) {
    visible = [...visible.slice(0, visibleLimit - 1), activeTab].sort((left, right) =>
      tabs.indexOf(left) - tabs.indexOf(right),
    )
  }
  const visibleIds = new Set(visible.map((tab) => tab.id))
  const overflow = tabs.filter((tab) => !visibleIds.has(tab.id))

  return { groups: [...grouped.values()], visible, overflow }
}
