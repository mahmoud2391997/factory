import type { AuthUser } from './types'
import { canonicalPages, canAccessPage, pageForId } from '@/lib/nav/config'

const ROLE_START_PAGES: Record<string, string> = {
  ACCOUNTANT: 'journalEntry',
  OPERATIONS: 'inventoryOverview',
  STOREKEEPER: 'inventoryOverview',
  PRODUCTION: 'recipe',
  QUALITY: 'qualitySample',
  MAINTENANCE: 'machine',
  SALES: 'salesInvoice',
  DRIVER: 'fleetTrips',
}

/** Choose a permitted entry screen, including after the first password change. */
export function landingPath(user: Pick<AuthUser, 'roles' | 'permissions' | 'mustChangePassword'>): string {
  if (user.mustChangePassword) return '/account/password'
  const home = pageForId('dashboard')
  if (home && canAccessPage(home, user.permissions)) return home.href

  for (const role of user.roles) {
    const page = pageForId(ROLE_START_PAGES[role.key] ?? '')
    if (page && canAccessPage(page, user.permissions)) return page.href
  }
  // Custom role permissions may remove the preferred screen; never send the user
  // to a screen merely because its role label normally includes access.
  return canonicalPages().find((page) => page.href !== '/' && canAccessPage(page, user.permissions))?.href ?? '/guide'
}
