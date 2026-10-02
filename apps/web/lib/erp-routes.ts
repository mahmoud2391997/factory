import {
  ALL_NAV_PAGES,
  NAV_CONFIG,
  canonicalPages,
  canAccessPage,
  pageForEntity,
  pageForId,
  type NavPage,
  type NavSection,
  type NavWorkspace,
} from './nav/config'

export type RouteLeaf = Pick<NavPage, 'href' | 'entityKey' | 'tab'>

export type ResolvedRoute = {
  workspace: NavWorkspace | null
  section: NavSection | null
  page: NavPage
  leaf: RouteLeaf
  redirectTo?: string
  destination?: { id: string; label: string } | null
}

export type PageTab = { id: string; href: string; label: string }
export type NavSearchResult = {
  type: 'workspace' | 'section' | 'page'
  id: string
  label: string
  description: string
  href: string
  workspace: NavWorkspace | null
  section: NavSection | null
  page: NavPage | null
}

type PageLocation = { workspace: NavWorkspace | null; section: NavSection | null; page: NavPage }

function locationForPage(page: NavPage): PageLocation {
  for (const workspace of NAV_CONFIG.workspaces) {
    for (const section of workspace.sections) {
      const match = section.pages.find((item) => item.id === page.id)
      if (match) return { workspace, section, page: match }
    }
  }
  return { workspace: null, section: null, page }
}

function normalizedPath(pathname: string) {
  return pathname.replace(/\/+$/, '') || '/'
}

function routeAt(path: string, params: URLSearchParams): PageLocation | null {
  const candidates = ALL_NAV_PAGES
    .filter((page) => {
      const href = new URL(page.href, 'https://nav.invalid')
      const routePath = normalizedPath(href.pathname)
      const pathMatches = path === routePath || (routePath !== '/' && path.startsWith(`${routePath}/`))
      if (!pathMatches) return false
      if (!page.queryView) return true
      return params.get(page.queryView.param) === page.queryView.value
    })
    .sort((a, b) => new URL(b.href, 'https://nav.invalid').pathname.length - new URL(a.href, 'https://nav.invalid').pathname.length)
  return candidates[0] ? locationForPage(candidates[0]) : null
}

function routeFromHref(href: string) {
  const url = new URL(href, 'https://nav.invalid')
  return routeAt(normalizedPath(url.pathname), url.searchParams)
}

export function resolvePath(pathname: string, search = ''): ResolvedRoute | null {
  const url = new URL(pathname, 'https://nav.invalid')
  const path = normalizedPath(url.pathname)
  const params = search
    ? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
    : url.searchParams
  const match = routeAt(path, params)
  if (match) {
    return {
      ...match,
      destination: match.workspace ? { id: match.workspace.id, label: match.workspace.label } : null,
      leaf: { href: match.page.href, entityKey: match.page.entityKey, tab: match.page.tab },
    }
  }

  const redirect = NAV_CONFIG.redirects.find((item) => normalizedPath(new URL(item.from, 'https://nav.invalid').pathname) === path)
  if (!redirect) return null
  const target = routeFromHref(redirect.to)
  if (!target) return null
  return {
    ...target,
    destination: target.workspace ? { id: target.workspace.id, label: target.workspace.label } : null,
    leaf: { href: target.page.href, entityKey: target.page.entityKey, tab: target.page.tab },
    redirectTo: redirect.to,
  }
}

export function canSeeEntity(permissions: string[], entityKey: string) {
  const page = pageForEntity(entityKey)
  if (!page) return false
  return canAccessPage(page, permissions)
}

export function hrefForEntity(entityKey: string) {
  return pageForEntity(entityKey)?.href ?? null
}

export function hrefForPageId(pageId: string) {
  return pageForId(pageId)?.href ?? null
}

export function leafMeta(entityKey: string) {
  const page = pageForEntity(entityKey)
  return page ? { label: page.label, description: page.description } : { label: entityKey, description: '' }
}

export function visibleWorkspaces(permissions: string[]) {
  return NAV_CONFIG.workspaces.filter((workspace) =>
    workspace.sections.some((section) => section.pages.some((page) => canSeeEntity(permissions, page.entityKey))),
  )
}

export function visibleSections(workspace: NavWorkspace, permissions: string[]) {
  return workspace.sections.filter((section) => section.pages.some((page) => canSeeEntity(permissions, page.entityKey)))
}

export function sectionEntryHref(section: NavSection, permissions: string[]) {
  return section.pages.find((page) => canSeeEntity(permissions, page.entityKey))?.href ?? null
}

export function workspaceEntryHref(workspace: NavWorkspace, permissions: string[]) {
  for (const section of workspace.sections) {
    const href = sectionEntryHref(section, permissions)
    if (href) return href
  }
  return null
}

/** Kept as a compatibility-shaped export; the new information architecture has one page-tab row. */
export function pageTabs(resolved: ResolvedRoute, permissions: string[]) {
  const primary = (resolved.section?.pages ?? [])
    .filter((page) => page.tab && canSeeEntity(permissions, page.entityKey))
    .map((page) => ({ id: page.id, href: page.href, label: page.label }))
  return { primary, secondary: [] as PageTab[], activePrimary: resolved.page.id, activeSecondary: '' }
}

export function breadcrumbs(resolved: ResolvedRoute, permissions: string[]) {
  const crumbs: Array<{ href: string; label: string }> = [{ href: '/', label: 'الرئيسية' }]
  if (!resolved.workspace) {
    if (resolved.page.entityKey !== 'dashboard' && crumbs.at(-1)?.label !== resolved.page.label) {
      crumbs.push({ href: resolved.page.href, label: resolved.page.label })
    }
    return crumbs
  }

  if (resolved.workspace.id !== 'home') {
    const entry = workspaceEntryHref(resolved.workspace, permissions) ?? resolved.page.href
    if (crumbs.at(-1)?.label !== resolved.workspace.label) {
      crumbs.push({ href: entry, label: resolved.workspace.label })
    }
  }
  if (resolved.section && crumbs.at(-1)?.label !== resolved.section.label) {
    const sectionEntry = sectionEntryHref(resolved.section, permissions) ?? resolved.page.href
    crumbs.push({ href: sectionEntry, label: resolved.section.label })
  }
  if (resolved.page.entityKey !== 'dashboard' && crumbs.at(-1)?.label !== resolved.page.label) {
    crumbs.push({ href: resolved.page.href, label: resolved.page.label })
  }
  return crumbs
}

export function entryHref(workspace: NavWorkspace, permissions: string[]) {
  return workspaceEntryHref(workspace, permissions) ?? '/'
}

function normalizeText(value: string) {
  return value.normalize('NFKD').replace(/[\u064B-\u065F\u0670]/g, '').toLocaleLowerCase('ar').trim()
}

export function searchNavigation(query: string, permissions: string[]): NavSearchResult[] {
  const needle = normalizeText(query)
  if (!needle) return []
  const results: NavSearchResult[] = []
  const accessiblePages = (pages: NavPage[]) => pages.filter((page) => canSeeEntity(permissions, page.entityKey))

  for (const workspace of NAV_CONFIG.workspaces) {
    const pages = accessiblePages(workspace.sections.flatMap((section) => section.pages))
    if (pages.length === 0) continue
    const href = workspaceEntryHref(workspace, permissions)
    if (href && normalizeText([workspace.label, ...workspace.keywords].join(' ')).includes(needle)) {
      results.push({ type: 'workspace', id: workspace.id, label: workspace.label, description: '', href, workspace, section: null, page: null })
    }
    for (const section of workspace.sections) {
      const sectionPages = accessiblePages(section.pages)
      if (sectionPages.length === 0) continue
      const sectionHref = sectionEntryHref(section, permissions)
      if (sectionHref && normalizeText([section.label, ...section.keywords].join(' ')).includes(needle)) {
        results.push({ type: 'section', id: `${workspace.id}:${section.id}`, label: section.label, description: '', href: sectionHref, workspace, section, page: null })
      }
      for (const page of sectionPages) {
        const searchable = normalizeText([page.label, page.description, ...page.keywords].join(' '))
        if (searchable.includes(needle)) {
          results.push({ type: 'page', id: page.id, label: page.label, description: page.description, href: page.href, workspace, section, page })
        }
      }
    }
  }

  for (const page of NAV_CONFIG.utilityPages) {
    if (!canAccessPage(page, permissions)) continue
    if (normalizeText([page.label, page.description, ...page.keywords].join(' ')).includes(needle)) {
      results.push({ type: 'page', id: page.id, label: page.label, description: page.description, href: page.href, workspace: null, section: null, page })
    }
  }
  return results.slice(0, 40)
}

export function routePages() {
  return canonicalPages()
}
