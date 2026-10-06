'use client'

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Layers3,
  Loader2,
  LogOut,
  Menu,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Sun,
  X,
} from 'lucide-react'

import { LiveWorkspace } from '@/components/erp/live/workspace'
import type { LiveCtx } from '@/components/erp/live/ctx'
import { useAuth } from '@/components/providers/auth-provider'
import {
  breadcrumbs,
  canSeeEntity,
  canSeePage,
  pageTabs,
  resolvePath,
  searchNavigation,
  visibleSections,
  visibleWorkspaces,
  workspaceEntryHref,
} from '@/lib/erp-routes'
import { dashboardAlerts } from '@/lib/erp/domain/dashboard'
import { factoryStatus } from '@/lib/erp/domain/reports'
import { DEFAULT_ROLE_PERMISSIONS } from '@/lib/erp/domain/permissions'
import type { RoleKey } from '@/lib/erp/domain/permissions'
import { getSupportedLanguages, translateUiText } from '@/lib/i18n/translations'
import type { Language } from '@/lib/i18n/translations'
import { directionFor, useLanguage } from '@/lib/i18n/language-provider'
import { unreadNotificationCount } from '@/lib/erp/notification-list'
import { useErp } from '@/lib/use-erp'

const COMPACT_KEY = 'erp-sidebar-compact'
const THEME_KEY = 'erp-theme'
const OPEN_WORKSPACE_KEY = 'erp-sidebar-open-workspace'

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '؟'
  if (parts.length === 1) return parts[0]!.slice(0, 1)
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`
}

function SearchHighlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim()
  if (!needle) return <>{text}</>
  const start = text.toLocaleLowerCase('ar').indexOf(needle.toLocaleLowerCase('ar'))
  if (start < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded bg-[#e0dbfa] px-0.5 text-[#271a83] dark:bg-[#271a83] dark:text-[#e0dbfa]">{text.slice(start, start + needle.length)}</mark>
      {text.slice(start + needle.length)}
    </>
  )
}

function CountBadge({ value, label }: { value: number; label: string }) {
  if (value <= 0) return null
  return (
    <span aria-label={`${value} ${label}`} className="erp-count-badge ms-auto inline-flex min-w-5 items-center justify-center rounded-full bg-[#e5e7eb] px-1.5 text-[11px] font-semibold leading-5 text-[#374151] dark:bg-[#3f3f46] dark:text-[#f4f4f5]">
      {value > 99 ? '99+' : value}
    </span>
  )
}

export function ErpShell() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchString = searchParams.toString()
  const { user, loading: authLoading, logout, refresh } = useAuth()
  const erp = useErp(Boolean(user), user?.id === 'demo-admin-user')
  const { language, setLanguage } = useLanguage()
  const uiLabel = (value: string) => translateUiText(language, value)
  const roleKey = (user?.roles[0]?.key ?? 'GM') as RoleKey
  const isSuperOrGm =
    roleKey === 'GM' ||
    (roleKey as string) === 'SUPER_ADMIN' ||
    (roleKey as string) === 'ADMIN' ||
    !roleKey ||
    user?.email === 'admin@factory.local' ||
    user?.email === 'gm@factory.local'
  const permissions = isSuperOrGm
    ? DEFAULT_ROLE_PERMISSIONS.GM
    : (erp.state?.rolePermissions[roleKey] ?? user?.permissions ?? DEFAULT_ROLE_PERMISSIONS.GM)
  const permissionKey = permissions.join('|')
  const resolved = resolvePath(pathname, searchString)
  const workspaces = useMemo(() => visibleWorkspaces(permissions), [permissionKey])

  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileWorkspaceId, setMobileWorkspaceId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const [navReady, setNavReady] = useState(false)
  const [compact, setCompact] = useState(false)
  const [dark, setDark] = useState(false)
  const [themeReady, setThemeReady] = useState(false)
  const [noticesOpen, setNoticesOpen] = useState(false)
  const [notificationFeedback, setNotificationFeedback] = useState<{ id: string; ok: boolean; message: string } | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [openWorkspaceIds, setOpenWorkspaceIds] = useState<string[]>(() => [
    'home',
    'sales',
    'purchasing',
    'inventory',
    'production',
    'fleet',
    'finance',
    'people',
    'admin',
  ])
  const [collapsedSectionIds, setCollapsedSectionIds] = useState<string[]>([])
  const [flyoutWorkspaceId, setFlyoutWorkspaceId] = useState<string | null>(null)
  const [flyoutPosition, setFlyoutPosition] = useState<{ top: number; left: number } | null>(null)
  const [navSearch, setNavSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1)

  useEffect(() => {
    if (workspaces.length > 0) {
      setOpenWorkspaceIds((current) => {
        const workspaceIds = workspaces.map((w) => w.id)
        if (current.length === 0) return workspaceIds
        const combined = new Set([...current, ...workspaceIds])
        return Array.from(combined)
      })
    }
  }, [workspaces])

  const noticesRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchResultRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const flyoutCloseTimer = useRef<number | null>(null)
  const lastRouteRef = useRef<string | null>(null)
  const iconOnly = compact && !mobileOpen
  const activeWorkspaceId = resolved?.workspace?.id ?? 'home'
  const openWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null
  const searchResults = useMemo(() => searchNavigation(navSearch, permissions), [navSearch, permissionKey])
  const searchGroups = useMemo(() => {
    const groups: Array<{ id: string; label: string; results: typeof searchResults }> = []
    for (const result of searchResults) {
      const id = `${result.workspace?.id ?? 'references'}:${result.section?.id ?? (result.type === 'workspace' ? 'workspace' : 'other')}`
      const label = [result.workspace?.label, result.section?.label].filter(Boolean).join(' › ') || 'مراجع النظام'
      let group = groups.find((item) => item.id === id)
      if (!group) {
        group = { id, label, results: [] }
        groups.push(group)
      }
      group.results.push(result)
    }
    return groups
  }, [searchResults])

  const currentSection = resolved?.section ?? null
  const direction = directionFor(language)
  const openKey = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
  const closeKey = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
  const status = erp.state ? factoryStatus(erp.state, new Date().toISOString()) : null
  const alerts = erp.state ? dashboardAlerts(erp.state, new Date().toISOString()) : null
  const pendingApprovals = erp.state
    ? erp.state.purchaseOrders.filter((item) => item.status === 'PENDING_APPROVAL').length +
      erp.state.expenses.filter((item) => item.status === 'PENDING_APPROVAL').length +
      erp.state.payrolls.filter((item) => item.status === 'PENDING_APPROVAL').length +
      erp.state.adjustments.filter((item) => item.status === 'PENDING_APPROVAL').length
    : 0

  const notices = erp.state?.notifications.filter((item) => item.roles.includes(roleKey)) ?? []
  const unread = unreadNotificationCount(notices)
  const showNotices = canSeeEntity(permissions, 'notification')
  const allowed = resolved ? canSeeEntity(permissions, resolved.page.entityKey) : false
  const meta = resolved ? { label: uiLabel(resolved.page.label), description: uiLabel(resolved.page.description) } : null
  const tabs = resolved && allowed ? pageTabs(resolved, permissions) : null
  const crumbs = resolved && allowed
    ? breadcrumbs(resolved, permissions).map((crumb) => ({ ...crumb, label: uiLabel(crumb.label) }))
    : []
  const relatedLinks = (resolved?.page.relatedLinks ?? []).filter((item) => canSeeEntity(permissions, item.entityKey))
  const firstName = user?.fullName.trim().split(/\s+/)[0] ?? ''

  const liveCtx: LiveCtx | null = erp.state
    ? {
        state: erp.state,
        permissions,
        pending: erp.pending,
        act: erp.act,
        navigate: (key) => {
          const href = workspaces.flatMap((workspace) => workspace.sections.flatMap((section) => section.pages)).find((page) => page.entityKey === key && canSeeEntity(permissions, key))?.href
          if (href) router.push(href)
        },
        refreshUser: refresh,
      }
    : null

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  useEffect(() => {
    if (erp.message) setToast(erp.message)
  }, [erp.message])

  useEffect(() => {
    try {
      const storedCompact = localStorage.getItem(COMPACT_KEY)
      setCompact(storedCompact === null ? window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches : storedCompact === '1')
      const storedWorkspaces = localStorage.getItem(OPEN_WORKSPACE_KEY)
      if (storedWorkspaces) {
        try {
          const parsed = JSON.parse(storedWorkspaces)
          if (Array.isArray(parsed) && parsed.every((id) => typeof id === 'string')) {
            setOpenWorkspaceIds(parsed)
          }
        } catch {
          setOpenWorkspaceIds((current) => Array.from(new Set([...current, storedWorkspaces])))
        }
      }
    } catch {
      // Use the default sidebar state when storage is unavailable or malformed.
    }
    setNavReady(true)

    try {
      const storedTheme = localStorage.getItem(THEME_KEY)
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const useDark = storedTheme === 'dark' || (storedTheme !== 'light' && prefersDark)
      setDark(useDark)
      document.documentElement.classList.toggle('dark', useDark)
      document.documentElement.classList.toggle('light', !useDark)
    } catch {
      // Keep the system theme if storage is unavailable.
    }
    setThemeReady(true)
  }, [])

  useEffect(() => {
    if (!navReady) return
    try {
      localStorage.setItem(COMPACT_KEY, compact ? '1' : '0')
      localStorage.setItem(OPEN_WORKSPACE_KEY, JSON.stringify(openWorkspaceIds))
    } catch {
      // The current session remains usable when local storage is blocked.
    }
  }, [navReady, compact, openWorkspaceIds])

  useEffect(() => {
    if (!themeReady) return
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.classList.toggle('light', !dark)
    try {
      localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
    } catch {
      // Theme still applies for this session when storage is unavailable.
    }
  }, [themeReady, dark])

  useEffect(() => {
    if (!navReady) return
    const routeKey = `${pathname}?${searchString}`
    if (lastRouteRef.current === null) {
      lastRouteRef.current = routeKey
      return
    }
    if (lastRouteRef.current === routeKey) return
    lastRouteRef.current = routeKey
    if (resolved?.workspace && workspaces.some((workspace) => workspace.id === resolved.workspace?.id)) {
      const wid = resolved.workspace.id
      setOpenWorkspaceIds((current) => (current.includes(wid) ? current : [...current, wid]))
    }
  }, [navReady, resolved?.workspace?.id, pathname, searchString, permissionKey])

  useEffect(() => {
    if (!resolved?.workspace || !resolved.section) return
    const activeSectionId = `${resolved.workspace.id}:${resolved.section.id}`
    setCollapsedSectionIds((collapsed) => collapsed.filter((sectionId) => sectionId !== activeSectionId))
  }, [resolved?.workspace?.id, resolved?.section?.id])

  useEffect(() => {
    if (resolved?.redirectTo) router.replace(resolved.redirectTo)
  }, [resolved?.redirectTo, router])

  useEffect(() => {
    setMobileOpen(false)
    setMobileWorkspaceId(null)
    setNoticesOpen(false)
    setFlyoutWorkspaceId(null)
  }, [pathname, searchString])

  useEffect(() => {
    setActiveSearchIndex(-1)
    searchResultRefs.current = []
  }, [navSearch])

  useEffect(() => {
    if (!noticesOpen) return
    const onPointer = (event: MouseEvent) => {
      if (!noticesRef.current?.contains(event.target as Node)) setNoticesOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [noticesOpen])

  useEffect(() => {
    if (!userMenuOpen) return
    const onPointer = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [userMenuOpen])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCompact(false)
        setSearchOpen(true)
        window.setTimeout(() => searchInputRef.current?.focus(), 0)
      } else if (event.key === 'Escape') {
        if (searchOpen) {
          setSearchOpen(false)
          setNavSearch('')
        }
        setFlyoutWorkspaceId(null)
        setUserMenuOpen(false)
        if (mobileOpen) setMobileOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [searchOpen, mobileOpen])

  const selectWorkspace = (workspaceId: string, href: string | null, drillIn: boolean) => {
    setOpenWorkspaceIds((current) => (current.includes(workspaceId) ? current : [...current, workspaceId]))
    if (mobileOpen && drillIn) {
      setMobileWorkspaceId(workspaceId)
      return
    }
    if (href) router.push(href)
    if (mobileOpen) setMobileOpen(false)
  }

  const toggleWorkspace = (workspaceId: string, href: string | null) => {
    if (compact && !mobileOpen) {
      setFlyoutWorkspaceId(workspaceId)
      setOpenWorkspaceIds((current) => (current.includes(workspaceId) ? current : [...current, workspaceId]))
      return
    }
    if (mobileOpen) {
      setOpenWorkspaceIds((current) => (current.includes(workspaceId) ? current : [...current, workspaceId]))
      setMobileWorkspaceId(workspaceId)
      return
    }
    setOpenWorkspaceIds((current) =>
      current.includes(workspaceId) ? current.filter((id) => id !== workspaceId) : [...current, workspaceId],
    )
  }

  const closeMobile = () => {
    setMobileOpen(false)
    setMobileWorkspaceId(null)
  }

  const chooseSearchResult = (index: number) => {
    const result = searchResults[index]
    if (!result) return
    if (result.workspace) {
      const wid = result.workspace.id
      setOpenWorkspaceIds((current) => (current.includes(wid) ? current : [...current, wid]))
    }
    router.push(result.href)
    setSearchOpen(false)
    setNavSearch('')
    closeMobile()
  }

  const focusSearchResult = (index: number) => {
    const next = Math.max(0, Math.min(searchResults.length - 1, index))
    setActiveSearchIndex(next)
    searchResultRefs.current[next]?.focus()
  }

  const openFlyoutAt = (workspaceId: string, element: HTMLElement) => {
    if (flyoutCloseTimer.current != null) window.clearTimeout(flyoutCloseTimer.current)
    const rect = element.getBoundingClientRect()
    const flyoutWidth = 260
    const flyoutHeight = Math.min(window.innerHeight * 0.85, 680)
    const top = Math.max(12, Math.min(rect.top, window.innerHeight - flyoutHeight - 12))
    const left = language === 'ar'
      ? Math.max(8, rect.left - flyoutWidth - 8)
      : Math.min(window.innerWidth - flyoutWidth - 8, rect.right + 8)
    setFlyoutPosition({ top, left })
    setFlyoutWorkspaceId(workspaceId)
  }

  const scheduleFlyoutClose = () => {
    if (flyoutCloseTimer.current != null) window.clearTimeout(flyoutCloseTimer.current)
    flyoutCloseTimer.current = window.setTimeout(() => setFlyoutWorkspaceId(null), 160)
  }

  const handleNavKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('input, select, textarea, [data-search-result="true"]')) return
    const items = Array.from(navRef.current?.querySelectorAll<HTMLElement>('[data-nav-item="true"]') ?? [])
    const currentIndex = items.indexOf(document.activeElement as HTMLElement)
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const next = event.key === 'ArrowDown'
        ? (currentIndex + 1 + items.length) % items.length
        : (currentIndex <= 0 ? items.length - 1 : currentIndex - 1)
      items[next]?.focus()
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      items[event.key === 'Home' ? 0 : items.length - 1]?.focus()
    } else if (event.key === openKey) {
      const workspaceRow = (event.target as HTMLElement).closest<HTMLElement>('[data-workspace-id]')
      const id = workspaceRow?.dataset.workspaceId
      if (id) {
        event.preventDefault()
        const workspace = workspaces.find((item) => item.id === id)
        if (workspace) toggleWorkspace(id, workspaceEntryHref(workspace, permissions))
      }
    } else if (event.key === closeKey) {
      event.preventDefault()
      setFlyoutWorkspaceId(null)
      const workspaceRow = (event.target as HTMLElement).closest<HTMLElement>('[data-workspace-id]')
      const id = workspaceRow?.dataset.workspaceId
      if (id) {
        setOpenWorkspaceIds((current) => current.filter((wid) => wid !== id))
      }
    }
  }

  const sectionBadge = (sectionId: string) => {
    if (sectionId === 'approvals' && canSeeEntity(permissions, 'approvals')) return pendingApprovals
    if (sectionId === 'obligations' && canSeeEntity(permissions, 'obligation')) return alerts?.obligations.length ?? 0
    if (sectionId === 'documents' && canSeeEntity(permissions, 'documents')) return alerts?.documents.length ?? 0
    if (sectionId === 'notifications' && canSeeEntity(permissions, 'notification')) return unread
    return 0
  }

  const renderSectionGroup = (section: (typeof visibleSections extends never ? never : ReturnType<typeof visibleSections>[number]), workspaceId: string, variant: 'sidebar' | 'mobile' | 'flyout') => {
    const pages = section.pages.filter((page) => canSeePage(permissions, page) || canSeeEntity(permissions, page.entityKey))
    if (pages.length === 0) return null
    const isFlyout = variant === 'flyout'
    const sectionKey = `${workspaceId}:${section.id}`
    const sectionActive = resolved?.workspace?.id === workspaceId && resolved?.section?.id === section.id
    const collapsed = collapsedSectionIds.includes(sectionKey)

    if (pages.length === 1) {
      const page = pages[0]!
      const active = resolved?.page.id === page.id
      return (
        <Link key={`${variant}:${workspaceId}:${section.id}`} data-nav-item="true" href={page.href} aria-current={active ? 'page' : undefined} title={`${uiLabel(section.label)} · ${uiLabel(page.description)}`} onClick={() => { setOpenWorkspaceIds((current) => (current.includes(workspaceId) ? current : [...current, workspaceId])); setFlyoutWorkspaceId(null); closeMobile() }} className={`flex min-h-10 items-center rounded-lg px-3 text-right text-[13px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] ${active ? 'bg-[#eeebfb] text-[#271a83] dark:bg-[#29234b] dark:text-[#e0dbfa]' : 'text-[#4b5563] hover:bg-[#f3f4f6] dark:text-[#d4d4d8] dark:hover:bg-[#27272a]'}`}>
          <span className="min-w-0 flex-1 truncate">{uiLabel(page.label)}</span>
          <CountBadge value={sectionBadge(section.id)} label={uiLabel(section.label)} />
        </Link>
      )
    }

    const pagesId = `erp-navigation-${workspaceId}-${section.id}-${variant}`
    return (
      <section key={`${variant}:${workspaceId}:${section.id}`} className={isFlyout ? 'border-b border-[#e5e7eb] pb-2 last:border-b-0 dark:border-[#3f3f46]' : 'py-1'}>
        <button type="button" data-nav-item="true" data-active={sectionActive} aria-current={sectionActive ? 'location' : undefined} aria-expanded={!collapsed} aria-controls={pagesId} onClick={() => setCollapsedSectionIds((current) => collapsed ? current.filter((id) => id !== sectionKey) : [...current, sectionKey])} className={`erp-section-item flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-right text-xs font-semibold text-[#374151] hover:bg-[#f3f4f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] dark:text-[#e4e4e7] dark:hover:bg-[#27272a] ${isFlyout ? 'px-2.5' : ''}`}>
          <span className="min-w-0 flex-1">
            <span className="block truncate">{uiLabel(section.label)}</span>
            {section.workflow ? <span className="mt-0.5 block truncate text-[10px] font-normal normal-case tracking-normal text-[#6b7280] dark:text-[#a1a1aa]">{uiLabel(section.workflow)}</span> : null}
          </span>
          <CountBadge value={pages.length} label={uiLabel('صفحات')} />
          <CountBadge value={sectionBadge(section.id)} label={uiLabel(section.label)} />
          <ChevronDown size={14} aria-hidden className={`shrink-0 transition-transform motion-reduce:transition-none ${collapsed ? '' : 'rotate-180'}`} />
        </button>
        <div id={pagesId} hidden={collapsed} className={`${collapsed ? 'hidden' : 'flex'} me-2 mt-0.5 flex-col gap-0.5 border-e border-[#d1d5db] pe-1 dark:border-[#52525b]`}>
          {pages.map((page) => {
            const active = resolved?.page.id === page.id
            return (
              <Link key={page.id} data-nav-item="true" href={page.href} aria-current={active ? 'page' : undefined} title={uiLabel(page.description)} onClick={() => { setOpenWorkspaceIds((current) => (current.includes(workspaceId) ? current : [...current, workspaceId])); setFlyoutWorkspaceId(null); closeMobile() }} className={`flex min-h-9 items-center rounded-lg px-3 text-right text-[13px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] ${isFlyout ? 'px-2.5' : ''} ${active ? 'bg-[#eeebfb] text-[#271a83] dark:bg-[#29234b] dark:text-[#e0dbfa]' : 'text-[#4b5563] hover:bg-[#f3f4f6] dark:text-[#d4d4d8] dark:hover:bg-[#27272a]'}`}>
                <span className="min-w-0 flex-1 truncate">{uiLabel(page.label)}</span>
              </Link>
            )
          })}
        </div>
      </section>
    )
  }

  if (authLoading || !user) {
    return (
      <main dir={direction} className="grid min-h-screen place-items-center bg-[#f9fafb] text-[#1f1f1f]">
        <div className="flex items-center gap-3 text-sm text-[#6b7280]">
          <Loader2 className="animate-spin" size={18} aria-hidden />
          {uiLabel('جاري التحقق من الجلسة...')}
        </div>
      </main>
    )
  }

  const displayUserName = uiLabel(user.fullName)
  const primaryRole = uiLabel(user.roles[0]?.nameAr ?? 'مستخدم')

  return (
    <main dir={direction} className={`erp-app min-h-screen bg-[#f9fafb] text-[#1f1f1f] md:p-[15px] ${iconOnly ? 'erp-app-compact' : ''}`}>
      {mobileOpen ? (
        <button type="button" aria-label={uiLabel('إغلاق')} className="fixed inset-0 z-30 bg-[#111827]/45 md:hidden" onClick={closeMobile} />
      ) : null}
      <aside
        className={`erp-sidebar fixed z-40 flex w-[min(280px,calc(100vw-24px))] flex-col bg-[#f9fafb] text-[#1f1f1f] transition-[width,transform] duration-200 motion-reduce:transition-none md:inset-y-[15px] md:translate-x-0 ${iconOnly ? 'md:w-[72px]' : 'md:w-[280px]'} ${mobileOpen ? 'inset-y-0 right-0 translate-x-0 bg-white shadow-2xl' : `inset-y-0 right-0 ${language === 'ar' ? 'translate-x-full' : '-translate-x-full'}`} ${language !== 'ar' ? 'ltr-sidebar' : ''}`}
      >
        <div className={`flex shrink-0 items-center border-b border-[#e5e7eb] ${iconOnly ? 'h-24 flex-col justify-center gap-1 px-2' : 'h-16 gap-2 px-4'}`}>
          <Link href="/" aria-label={uiLabel('الرئيسية')} onClick={closeMobile} className={`erp-mark grid shrink-0 place-items-center overflow-hidden rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] ${iconOnly ? 'size-9' : 'size-12'}`}>
            <Image src="/al-kawther-logo-transparent.png" alt={uiLabel('أعلاف الكوثر بحار الجوبه')} width={48} height={48} className="h-full w-full object-contain" />
          </Link>
          <div className={iconOnly ? 'sr-only' : 'min-w-0 flex-1'}>
            <div className="text-sm font-semibold leading-6">{uiLabel('أعلاف الكوثر بحار الجوبه')}</div>
          </div>
          <button
            type="button"
            aria-label={uiLabel(compact ? 'توسيع الشريط' : 'طي الشريط')}
            title={uiLabel(compact ? 'توسيع الشريط' : 'طي الشريط')}
            className={`grid size-8 shrink-0 place-items-center rounded-lg text-[#525252] hover:bg-neutral-200/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] ${mobileOpen ? 'hidden' : ''}`}
            onClick={() => { setCompact((value) => !value); setFlyoutWorkspaceId(null); setSearchOpen(false) }}
          >
            {compact ? <PanelRightOpen size={17} aria-hidden /> : <PanelRightClose size={17} aria-hidden />}
          </button>
          <button
            type="button"
            aria-label={uiLabel('إغلاق')}
            className="ms-auto grid size-9 place-items-center rounded-lg text-[#525252] hover:bg-neutral-200/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] md:hidden"
            onClick={closeMobile}
          >
            <X size={21} aria-hidden />
          </button>
        </div>

        <nav ref={navRef} onKeyDown={handleNavKeyDown} className="erp-sidebar-nav flex-1 space-y-2 overflow-y-auto overflow-x-visible px-2.5 py-3" aria-label={uiLabel('التنقل الرئيسي')}>
          {!iconOnly ? (
            <div className="relative mb-2">
              <label className="flex h-11 items-center gap-2 rounded-xl border border-[#d1d5db] bg-white px-3 text-[#6b7280] shadow-sm transition-colors focus-within:border-[#1e127c] focus-within:ring-2 focus-within:ring-[#1e127c]/20 dark:border-[#3f3f46] dark:bg-[#18181b] dark:text-[#d4d4d8]">
                <Search size={17} aria-hidden className="shrink-0" />
                <input
                  ref={searchInputRef}
                  value={navSearch}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(event) => { setNavSearch(event.target.value); setSearchOpen(true) }}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      event.preventDefault()
                      setSearchOpen(false)
                      setNavSearch('')
                    } else if (event.key === 'Enter') {
                      event.preventDefault()
                      chooseSearchResult(activeSearchIndex >= 0 ? activeSearchIndex : 0)
                    } else if (event.key === 'ArrowDown' && searchResults.length) {
                      event.preventDefault()
                      focusSearchResult(activeSearchIndex < 0 ? 0 : activeSearchIndex + 1)
                    } else if (event.key === 'ArrowUp' && searchResults.length) {
                      event.preventDefault()
                      focusSearchResult(activeSearchIndex <= 0 ? searchResults.length - 1 : activeSearchIndex - 1)
                    } else if (event.key === 'Home' && searchResults.length) {
                      event.preventDefault()
                      focusSearchResult(0)
                    } else if (event.key === 'End' && searchResults.length) {
                      event.preventDefault()
                      focusSearchResult(searchResults.length - 1)
                    }
                  }}
                  placeholder={uiLabel('ابحث في القوائم')}
                  aria-label={uiLabel('ابحث في القوائم')}
                  aria-expanded={searchOpen}
                  aria-controls="erp-navigation-search-results"
                  className="min-w-0 flex-1 bg-transparent text-right text-sm text-[#1f1f1f] outline-none placeholder:text-[#6b7280] dark:text-[#f4f4f5] dark:placeholder:text-[#a1a1aa]"
                />
                <kbd className="hidden rounded border border-[#e5e7eb] px-1.5 py-0.5 text-[10px] text-[#6b7280] lg:inline">{typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl+K'}</kbd>
                {navSearch ? <button type="button" aria-label={uiLabel('مسح البحث')} onClick={() => { setNavSearch(''); setSearchInputFocus(searchInputRef.current) }} className="grid size-6 place-items-center rounded text-[#525252] hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c]">×</button> : null}
              </label>
              {searchOpen ? (
                <div id="erp-navigation-search-results" role="region" aria-label={uiLabel('نتائج البحث')} className="erp-search-results absolute inset-x-0 top-[calc(100%+6px)] z-50 max-h-[min(60vh,34rem)] overflow-y-auto rounded-xl border border-[#d1d5db] bg-white p-2 shadow-xl dark:border-[#3f3f46] dark:bg-[#18181b]" aria-live="polite">
                  {!navSearch.trim() ? <p className="px-3 py-4 text-center text-sm text-[#6b7280]">{uiLabel('اكتب اسم مساحة أو قسم أو شاشة')}</p> : null}
                  {navSearch.trim() && searchResults.length === 0 ? <p className="px-3 py-5 text-center text-sm text-[#525252] dark:text-[#d4d4d8]">{uiLabel('لا توجد نتائج')}</p> : null}
                  {searchGroups.map((group) => (
                    <section key={group.id} className="mb-2 last:mb-0">
                      <h2 className="px-2 py-1.5 text-xs font-semibold text-[#6b7280] dark:text-[#a1a1aa]">{uiLabel(group.label)}</h2>
                      <ul className="space-y-0.5">
                        {group.results.map((result) => {
                          const index = searchResults.indexOf(result)
                          const ResultIcon = result.type === 'workspace' ? result.workspace?.icon : result.type === 'section' ? Layers3 : FileText
                          return (
                            <li key={`${result.type}:${result.id}`}>
                              <Link
                                ref={(element) => { searchResultRefs.current[index] = element }}
                                href={result.href}
                                data-search-result="true"
                                aria-current={resolved?.page.id === result.page?.id ? 'page' : undefined}
                                onMouseEnter={() => setActiveSearchIndex(index)}
                                onClick={() => { if (result.workspace) { const wid = result.workspace.id; setOpenWorkspaceIds((current) => (current.includes(wid) ? current : [...current, wid])) } setSearchOpen(false); setNavSearch(''); closeMobile() }}
                                className={`flex min-h-11 items-center gap-2 rounded-lg px-2.5 py-2 text-right text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] ${activeSearchIndex === index ? 'bg-[#eeebfb] text-[#271a83] dark:bg-[#29234b] dark:text-[#e0dbfa]' : 'text-[#374151] hover:bg-[#f3f4f6] dark:text-[#e4e4e7] dark:hover:bg-[#27272a]'}`}
                              >
                                {ResultIcon ? <ResultIcon size={16} aria-hidden className="shrink-0" /> : null}
                                <span className="min-w-0 flex-1 truncate font-medium"><SearchHighlight text={uiLabel(result.label)} query={navSearch} /></span>
                                {result.type === 'page' && !result.label.toLocaleLowerCase('ar').includes(navSearch.trim().toLocaleLowerCase('ar')) ? <span className="shrink-0 text-[11px] text-[#6b7280]">{uiLabel('مطابقة')}: <mark className="bg-[#e0dbfa] text-[#271a83] dark:bg-[#271a83] dark:text-[#e0dbfa]">{navSearch.trim()}</mark></span> : null}
                              </Link>
                              {result.description ? <p className="truncate px-9 pb-1 text-xs text-[#6b7280]">{uiLabel(result.description)}</p> : null}
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <button type="button" title={uiLabel('ابحث في القوائم')} aria-label={uiLabel('ابحث في القوائم')} className="mx-auto grid size-11 place-items-center rounded-xl text-[#525252] hover:bg-[#eeebfb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] dark:text-[#d4d4d8]" onClick={() => { setCompact(false); setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 0) }}>
              <Search size={18} aria-hidden />
            </button>
          )}

          {!searchOpen ? (
            <>
              {mobileOpen && mobileWorkspaceId ? (
                <div className="mb-2 flex items-center gap-2 border-b border-[#e5e7eb] pb-2 dark:border-[#3f3f46]">
                  <button type="button" className="grid size-10 place-items-center rounded-lg text-[#374151] hover:bg-[#f3f4f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] dark:text-[#e4e4e7]" onClick={() => setMobileWorkspaceId(null)} aria-label={uiLabel('رجوع')}>
                    {direction === 'rtl' ? <ChevronRight size={18} aria-hidden /> : <ChevronLeft size={18} aria-hidden />}
                  </button>
                  <span className="truncate font-semibold text-[#1f2937] dark:text-[#f4f4f5]">{uiLabel(workspaces.find((workspace) => workspace.id === mobileWorkspaceId)?.label ?? '')}</span>
                </div>
              ) : null}

              {mobileOpen && mobileWorkspaceId ? (
                <div className="space-y-1">
                  {visibleSections(workspaces.find((workspace) => workspace.id === mobileWorkspaceId)!, permissions).map((section) => renderSectionGroup(section, mobileWorkspaceId, 'mobile'))}
                </div>
              ) : (
                <div className="space-y-1">
                  {!iconOnly && workspaces.length > 1 ? (
                    <div className="mb-1 flex items-center justify-between px-2 pt-0.5 text-xs text-[#6b7280] dark:text-[#a1a1aa]">
                      <span className="font-semibold">{uiLabel('أقسام النظام')}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (workspaces.every((w) => openWorkspaceIds.includes(w.id))) {
                            setOpenWorkspaceIds([])
                          } else {
                            setOpenWorkspaceIds(workspaces.map((w) => w.id))
                          }
                        }}
                        className="rounded px-1.5 py-0.5 text-[11px] font-medium text-[#1e127c] hover:bg-[#eeebfb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] dark:text-[#a394f5] dark:hover:bg-[#29234b]"
                      >
                        {workspaces.every((w) => openWorkspaceIds.includes(w.id))
                          ? uiLabel('طي الكل')
                          : uiLabel('توسيع الكل')}
                      </button>
                    </div>
                  ) : null}
                  {workspaces.map((workspace) => {
                    const sections = visibleSections(workspace, permissions)
                    const pages = sections.flatMap((section) => section.pages.filter((page) => canSeePage(permissions, page) || canSeeEntity(permissions, page.entityKey)))
                    const entryHref = workspaceEntryHref(workspace, permissions)
                    const active = workspace.id === activeWorkspaceId
                    const isExpanded = openWorkspaceIds.includes(workspace.id)
                    const isSinglePage = pages.length === 1
                    const Icon = workspace.icon
                    const badgeValue = workspace.id === 'inventory' && canSeeEntity(permissions, 'material') ? status?.inventory.runningOut.length ?? 0 : 0
                    const rowClass = `${iconOnly ? 'justify-center' : ''} erp-workspace-item ${active ? 'erp-workspace-active bg-[#eeebfb] text-[#271a83] dark:bg-[#29234b] dark:text-[#e0dbfa]' : 'text-[#374151] hover:bg-[#f3f4f6] dark:text-[#e4e4e7] dark:hover:bg-[#27272a]'} flex h-11 w-full items-center gap-3 rounded-xl px-3 text-right text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c]`
                    const row = isSinglePage ? (
                      <Link key={workspace.id} data-nav-item="true" data-workspace-id={workspace.id} href={entryHref ?? '/'} aria-current={active ? 'page' : undefined} title={iconOnly ? uiLabel(workspace.label) : undefined} onClick={() => { setOpenWorkspaceIds((current) => (current.includes(workspace.id) ? current : [...current, workspace.id])); closeMobile() }} className={rowClass}>
                        <Icon size={18} aria-hidden className="shrink-0" />
                        <span className={iconOnly ? 'sr-only' : 'min-w-0 flex-1 truncate'}>{uiLabel(workspace.label)}</span>
                        {!iconOnly ? <CountBadge value={badgeValue} label={uiLabel('مواد قاربت النفاد')} /> : badgeValue > 0 ? <span aria-label={`${badgeValue} ${uiLabel('مواد قاربت النفاد')}`} className="absolute end-1 top-1 size-2 rounded-full bg-[#1e127c]" /> : null}
                      </Link>
                    ) : (
                    <button
                        key={workspace.id}
                        type="button"
                        data-nav-item="true"
                        data-workspace-id={workspace.id}
                        title={iconOnly ? uiLabel(workspace.label) : undefined}
                        aria-label={uiLabel(workspace.label)}
                        aria-expanded={iconOnly ? flyoutWorkspaceId === workspace.id : isExpanded}
                        onMouseEnter={(event) => { if (iconOnly) openFlyoutAt(workspace.id, event.currentTarget) }}
                        onFocus={(event) => { if (iconOnly) openFlyoutAt(workspace.id, event.currentTarget) }}
                        onClick={() => toggleWorkspace(workspace.id, entryHref)}
                        className={rowClass}
                      >
                        <Icon size={18} aria-hidden className="shrink-0" />
                        <span className={iconOnly ? 'sr-only' : 'min-w-0 flex-1 truncate'}>{uiLabel(workspace.label)}</span>
                        {!iconOnly ? <CountBadge value={badgeValue} label={uiLabel('مواد قاربت النفاد')} /> : badgeValue > 0 ? <span aria-label={`${badgeValue} ${uiLabel('مواد قاربت النفاد')}`} className="absolute end-1 top-1 size-2 rounded-full bg-[#1e127c]" /> : null}
                        {!iconOnly ? <ChevronDown size={15} aria-hidden className={`shrink-0 transition-transform motion-reduce:transition-none ${isExpanded ? 'rotate-180' : ''}`} /> : null}
                      </button>
                    )

                    const flyout = iconOnly && flyoutWorkspaceId === workspace.id && flyoutPosition ? (
                      <div style={{ top: flyoutPosition.top, left: flyoutPosition.left }} className="erp-workspace-flyout fixed z-[80] max-h-[85vh] w-[260px] overflow-y-auto rounded-xl border border-[#d1d5db] bg-white p-2 shadow-xl dark:border-[#3f3f46] dark:bg-[#18181b]" onMouseEnter={() => { if (flyoutCloseTimer.current != null) window.clearTimeout(flyoutCloseTimer.current) }} onMouseLeave={scheduleFlyoutClose}>
                        <div className="px-2 py-2 text-sm font-semibold text-[#1f2937] dark:text-[#f4f4f5]">{uiLabel(workspace.label)}</div>
                        {sections.map((section) => renderSectionGroup(section, workspace.id, 'flyout'))}
                      </div>
                    ) : null

                    return (
                      <div key={`row:${workspace.id}`} className="relative" onMouseEnter={(event) => { if (iconOnly) openFlyoutAt(workspace.id, event.currentTarget) }} onFocusCapture={(event) => { if (iconOnly) openFlyoutAt(workspace.id, event.currentTarget) }} onMouseLeave={() => { if (iconOnly) scheduleFlyoutClose() }} onBlur={(event) => { if (iconOnly && !event.currentTarget.contains(event.relatedTarget as Node | null)) scheduleFlyoutClose() }}>
                        {row}
                        {iconOnly && navReady && flyout ? createPortal(flyout, document.body) : null}
                        {!iconOnly && isExpanded && !(mobileOpen && mobileWorkspaceId) ? (
                          <div className="erp-workspace-sections me-3 mt-1 space-y-0.5 border-e border-[#d1d5db] pe-2 dark:border-[#52525b]">
                            {sections.map((section) => renderSectionGroup(section, workspace.id, 'sidebar'))}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : null}
        </nav>

        <div className="erp-sidebar-footer relative mt-auto shrink-0 border-t border-[#e5e7eb] bg-white/90 p-2.5 dark:border-[#3f3f46] dark:bg-[#18181b]" ref={userMenuRef}>
          {userMenuOpen ? (
            <div role="menu" aria-label={uiLabel('قائمة المستخدم')} className={`erp-user-menu absolute bottom-[calc(100%+8px)] z-50 w-[min(280px,calc(100vw-32px))] rounded-xl border border-[#d1d5db] bg-white p-3 shadow-xl dark:border-[#3f3f46] dark:bg-[#18181b] ${language === 'ar' ? 'right-2' : 'left-2'}`}>
              <div className="mb-3 border-b border-[#e5e7eb] pb-3 dark:border-[#3f3f46]">
                <div className="truncate text-sm font-semibold text-[#1f2937] dark:text-[#f4f4f5]">{displayUserName}</div>
                <div className="truncate text-xs text-[#6b7280] dark:text-[#a1a1aa]">{primaryRole}</div>
              </div>
              <label className="mb-2 flex items-center justify-between gap-3 text-sm text-[#374151] dark:text-[#e4e4e7]">
                <span>{uiLabel('اللغة')}</span>
                <select value={language} onChange={(event) => setLanguage(event.target.value as Language)} aria-label={uiLabel('اللغة')} className="h-10 min-w-28 rounded-lg border border-[#d1d5db] bg-white px-2 text-sm text-[#1f2937] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] dark:border-[#52525b] dark:bg-[#27272a] dark:text-[#f4f4f5]">
                  {getSupportedLanguages().map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
                </select>
              </label>
              <button type="button" role="menuitem" onClick={() => setDark((value) => !value)} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-right text-sm text-[#374151] hover:bg-[#f3f4f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] dark:text-[#e4e4e7] dark:hover:bg-[#27272a]">
                {dark ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}{uiLabel(dark ? 'الوضع الفاتح' : 'الوضع الداكن')}
              </button>
              <div className="my-2 border-t border-[#e5e7eb] dark:border-[#3f3f46]" />
              <div className="mb-2 text-[11px] text-[#6b7280] dark:text-[#a1a1aa]" dir="ltr">Build {process.env.NEXT_PUBLIC_GIT_COMMIT_SHA ?? 'local'} · {process.env.NEXT_PUBLIC_BUILD_DATE ?? 'development'}</div>
              <button type="button" role="menuitem" disabled={loggingOut} onClick={async () => { setLoggingOut(true); await logout(); router.replace('/login') }} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-right text-sm font-medium text-[#991b1b] hover:bg-[#fef2f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] disabled:opacity-60 dark:text-[#fca5a5] dark:hover:bg-[#3f1d1d]">
                {loggingOut ? <Loader2 size={17} className="animate-spin" aria-hidden /> : <LogOut size={17} aria-hidden />}{uiLabel('تسجيل الخروج')}
              </button>
            </div>
          ) : null}
          <button type="button" aria-haspopup="menu" aria-expanded={userMenuOpen} aria-label={`${uiLabel('قائمة المستخدم')}: ${displayUserName}, ${primaryRole}`} title={iconOnly ? `${displayUserName} · ${primaryRole}` : undefined} onClick={() => setUserMenuOpen((open) => !open)} className={`flex min-h-11 w-full items-center gap-2 rounded-xl px-2 text-right hover:bg-[#f3f4f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] dark:hover:bg-[#27272a] ${iconOnly ? 'justify-center' : ''}`}>
            <span className="erp-mark grid size-8 shrink-0 place-items-center rounded-full bg-[#1f1f1f] text-xs font-semibold text-white">{getInitials(displayUserName)}</span>
            <span className={iconOnly ? 'sr-only' : 'min-w-0 flex-1'}>
              <span className="block truncate text-sm font-medium text-[#1f2937] dark:text-[#f4f4f5]">{displayUserName}</span>
              <span className="block truncate text-xs text-[#6b7280] dark:text-[#a1a1aa]">{primaryRole}</span>
            </span>
            {!iconOnly ? <ChevronDown size={15} aria-hidden className="shrink-0 text-[#6b7280]" /> : null}
          </button>
        </div>
      </aside>

      <div className={`erp-content min-h-screen overflow-auto bg-white md:min-h-[calc(100vh-30px)] md:rounded-[15px] md:border md:border-[#e5e7eb] ${iconOnly ? 'md:mr-[6.5rem]' : 'md:mr-[19.5rem]'}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[#e5e7eb] bg-white px-5 md:px-8">
          <button type="button" aria-label={uiLabel('فتح القائمة')} className="grid size-11 place-items-center rounded-lg border border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f3f4f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] md:hidden" onClick={() => { setMobileWorkspaceId(null); setMobileOpen(true) }}>
            <Menu size={21} aria-hidden />
          </button>
          <div className="hidden text-right sm:block">
            <div className="text-[13px] text-[#6b7280]">{primaryRole}</div>
            <h1 className="text-2xl font-semibold leading-tight">{uiLabel('مرحباً،')} {uiLabel(firstName)}</h1>
          </div>
          <div className="ms-auto flex items-center gap-2">
            {showNotices ? (
              <div className="relative" ref={noticesRef}>
                <button type="button" aria-label={uiLabel('إشعارات')} aria-expanded={noticesOpen} className="relative grid size-11 place-items-center rounded-lg border border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f3f4f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] dark:border-[#3f3f46] dark:bg-[#18181b] dark:text-[#e4e4e7]" onClick={() => setNoticesOpen((open) => !open)}>
                  <Bell size={20} aria-hidden />
                  {unread > 0 ? <span className="absolute -end-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[#b91c1c] px-1 text-[10px] font-semibold leading-5 text-white">{unread > 99 ? '99+' : unread}</span> : null}
                </button>
                {noticesOpen ? (
                  <div className="absolute end-0 top-[calc(100%+8px)] z-50 w-[min(22rem,80vw)] rounded-xl border border-[#d1d5db] bg-white p-3 text-[#1f1f1f] shadow-xl dark:border-[#3f3f46] dark:bg-[#18181b] dark:text-[#f4f4f5]">
                    <div className="mb-2 text-sm font-bold">{uiLabel('الإشعارات')}</div>
                    <div className="max-h-80 space-y-2 overflow-y-auto">
                      {notices.length === 0 ? <p className="text-sm text-[#6b7280]">{uiLabel('لا توجد إشعارات')}</p> : null}
                      {notices.slice(0, 8).map((item) => (
                        <div key={item.id} className="rounded-lg border border-[#e5e7eb] p-3 dark:border-[#3f3f46]">
                          <Link href="/notifications" onClick={() => setNoticesOpen(false)} className="block rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c]">
                            <div className="font-medium">{uiLabel(item.title)}</div>
                            <div className="text-sm text-[#6b7280]">{uiLabel(item.body)}</div>
                          </Link>
                          {!item.read && liveCtx ? <button type="button" disabled={erp.pending} aria-label={`${uiLabel('تمت القراءة')}: ${uiLabel(item.title)}`} className="mt-2 min-h-10 text-sm font-medium text-[#1e127c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] disabled:cursor-not-allowed disabled:opacity-50" onClick={async () => { setNotificationFeedback(null); const result = await liveCtx.act('markNotificationRead', { id: item.id }); setNotificationFeedback({ id: item.id, ok: result.ok, message: uiLabel(result.message) }) }}>{uiLabel('تمت القراءة')}</button> : null}
                          {notificationFeedback?.id === item.id ? <p role={notificationFeedback.ok ? 'status' : 'alert'} aria-live={notificationFeedback.ok ? 'polite' : 'assertive'} className={`mt-1 text-sm ${notificationFeedback.ok ? 'text-[#1e127c]' : 'text-[#b91c1c]'}`}>{notificationFeedback.message}</p> : null}
                        </div>
                      ))}
                    </div>
                    <Link href="/notifications" onClick={() => setNoticesOpen(false)} className="mt-3 inline-flex min-h-10 items-center text-sm font-medium text-[#1e127c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c]">{uiLabel('الإشعارات')}</Link>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </header>

        <div className="mx-auto max-w-[1480px] px-5 py-7 md:px-8 lg:px-10">
          {erp.error ? <div className="mb-4 rounded-lg border border-[#fecaca] bg-[#fee2e2] px-4 py-3 text-sm font-medium text-[#991b1b]">{uiLabel(erp.error)}</div> : null}
          {erp.loading || !liveCtx ? (
            <div aria-busy="true" aria-live="polite" className="space-y-4">
              <span className="sr-only">{uiLabel('جاري تحميل عمليات المصنع...')}</span>
              <div className="h-8 w-56 animate-pulse rounded-lg bg-[#f3f4f6]" />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{['a', 'b', 'c'].map((key) => <div key={key} className="h-28 animate-pulse rounded-[12px] bg-[#f3f4f6]" />)}</div>
              <div className="h-72 rounded-[12px] bg-[#f3f4f6]" />
            </div>
          ) : resolved && allowed && meta ? (
            <LiveWorkspace
              key={`${resolved.page.id}:${searchString}`}
              entityKey={resolved.page.entityKey}
              pageId={resolved.page.id}
              title={meta.label}
              description={meta.description}
              crumbs={crumbs}
              tabs={tabs?.primary ?? []}
              activeTabId={tabs?.activePrimary ?? ''}
              secondaryTabs={tabs?.secondary ?? []}
              activeSecondaryId={tabs?.activeSecondary ?? ''}
              tabLayout={tabs?.layout ?? 'tabs'}
              relatedLinks={relatedLinks.map((item) => ({ ...item, href: workspaces.flatMap((workspace) => workspace.sections.flatMap((section) => section.pages)).find((page) => page.entityKey === item.entityKey)?.href ?? '/' }))}
              ctx={liveCtx}
            />
          ) : (
              <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-6 text-sm text-[#525252] dark:border-[#3f3f46] dark:bg-[#18181b] dark:text-[#d4d4d8]">{uiLabel(resolved ? 'ليست لديك صلاحية لهذه الشاشة' : 'هذه الشاشة غير مربوطة بعد.')}</div>
          )}
        </div>
      </div>

      {toast ? <div role="status" className="fixed bottom-5 start-5 z-50 rounded-lg bg-[#1f1f1f] px-4 py-3 text-xs font-medium text-white shadow-xl">{uiLabel(toast)}<button type="button" aria-label={uiLabel('إغلاق')} className="ms-3 min-h-8 text-white/90 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white" onClick={() => setToast('')}>×</button></div> : null}
    </main>
  )
}

function setSearchInputFocus(input: HTMLInputElement | null) {
  input?.focus()
}
