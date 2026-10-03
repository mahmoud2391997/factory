import { chromium, type Locator, type Page } from 'playwright'
import { mkdir, access, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { NAV_CONFIG, type NavPage } from './apps/web/lib/nav/config'

const BASE_URL = (process.env.RECORDER_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const OUTPUT_DIR = path.resolve(process.env.RECORDER_OUTPUT_DIR || './recordings')
const OUTPUT_VIDEO = path.resolve(process.env.RECORDER_OUTPUT || path.join(OUTPUT_DIR, 'factory-erp-dataflows.mp4'))
const EMAIL = process.env.RECORDER_EMAIL || ''
const PASSWORD = process.env.RECORDER_PASSWORD || ''
const WIDTH = 1600
const HEIGHT = 900
const PAGE_HOLD_MS = Number(process.env.RECORDER_PAGE_HOLD_MS || 2300)
const WORKSPACE_ORDER = ['home', 'purchasing', 'inventory', 'production', 'sales', 'finance', 'fleet', 'people', 'admin']

const FLOW_COPY: Record<string, string> = {
  home: 'ملخص الأداء ومؤشرات المصنع',
  purchasing: 'مورد ← طلب شراء ← اعتماد ← أمر شراء ← استلام',
  inventory: 'صنف ← رصيد ← تحويل أو تسوية ← سجل حركة',
  production: 'وصفة ← أمر إنتاج ← وزن واستهلاك ← دفعة وجودة وتتبع',
  sales: 'عميل ← فاتورة ← تسليم ← تحصيل وتوزيع',
  finance: 'معاملة ← قيد ← بنك وضريبة ← تقارير مالية',
  fleet: 'مركبة ← وقود ورحلة ← صيانة ومتابعة',
  people: 'موظف ← حضور وإضافي ← راتب ووثائق',
  admin: 'مستخدمون وصلاحيات ← اعتمادات ← إشعارات وتدقيق',
}

const WORKSPACE_LABEL: Record<string, string> = {
  home: 'الرئيسية', purchasing: 'المشتريات والموردون', inventory: 'المخازن',
  production: 'الإنتاج والجودة', sales: 'المبيعات والتوزيع', finance: 'المالية',
  fleet: 'الأسطول والصيانة', people: 'الموظفون والوثائق', admin: 'الإدارة',
}

type TourPage = NavPage & { workspaceId: string; sectionLabel: string }
type TourGroup = { id: string; label: string; workflow: string; pages: TourPage[] }

function uniqueByHref(pages: TourPage[]) {
  const seen = new Set<string>()
  return pages.filter((page) => {
    if (seen.has(page.href)) return false
    seen.add(page.href)
    return true
  })
}

function buildTourGroups(): TourGroup[] {
  const catalog = new Map<string, NavPage>()
  for (const workspace of NAV_CONFIG.workspaces) {
    for (const section of workspace.sections) {
      for (const page of section.pages) if (page.canonical !== false) catalog.set(page.id, page)
    }
  }
  for (const page of NAV_CONFIG.utilityPages) if (page.canonical !== false) catalog.set(page.id, page)

  const groups: TourGroup[] = []
  for (const id of WORKSPACE_ORDER) {
    const workspace = NAV_CONFIG.workspaces.find((item) => item.id === id)
    if (!workspace) continue
    const pages = workspace.sections.flatMap((section) => section.pages
      .filter((page) => page.canonical !== false)
      .map((page) => ({ ...page, workspaceId: workspace.id, sectionLabel: section.label })))
    if (id === 'admin') {
      pages.push(...NAV_CONFIG.utilityPages.filter((page) => page.canonical !== false)
        .map((page) => ({ ...page, workspaceId: id, sectionLabel: 'الأدلة' })))
    }
    groups.push({
      id,
      label: WORKSPACE_LABEL[id] || workspace.label,
      workflow: FLOW_COPY[id] || workspace.label,
      pages: uniqueByHref(pages),
    })
  }

  const coveredIds = new Set(groups.flatMap((group) => group.pages.map((page) => page.id)))
  const missing = [...catalog.keys()].filter((id) => !coveredIds.has(id))
  if (missing.length) throw new Error(`Recorder route catalog incomplete; missing page IDs: ${missing.join(', ')}`)
  return groups
}

function installRecordingOverlay() {
  if (!document.head || !document.body) {
    document.addEventListener('DOMContentLoaded', () => installRecordingOverlay(), { once: true })
    return
  }
  const styleId = 'factory-recording-style'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      #factory-recording-pointer{position:fixed;z-index:2147483647;left:0;top:0;width:24px;height:24px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 2px #147d70,0 2px 10px #0005;background:#14b8a6aa;pointer-events:none;transform:translate(-50%,-50%);opacity:0;transition:opacity .15s ease}
      #factory-recording-pointer:after{content:'';position:absolute;inset:7px;border-radius:50%;background:#fff}
      #factory-recording-pointer.factory-click{animation:factory-click .38s ease-out}
      @keyframes factory-click{0%{box-shadow:0 0 0 2px #147d70,0 0 0 0 #14b8a6aa}100%{box-shadow:0 0 0 2px #147d70,0 0 0 20px #14b8a600}}
      #factory-recording-caption{position:fixed;z-index:2147483646;left:28px;bottom:26px;max-width:620px;min-width:340px;padding:14px 18px;border:1px solid #ffffff3b;border-radius:14px;background:#102522e8;color:#fff;box-shadow:0 8px 32px #0003;direction:rtl;text-align:right;font-family:Arial,sans-serif;pointer-events:none;backdrop-filter:blur(10px)}
      #factory-recording-caption small{display:block;margin-bottom:4px;color:#9de0d4;font-size:12px;font-weight:700;letter-spacing:.02em}
      #factory-recording-caption strong{display:block;font-size:18px;line-height:1.4}
      #factory-recording-caption span{display:block;margin-top:4px;color:#d2e8e4;font-size:13px;line-height:1.4}
    `
    document.head.appendChild(style)
  }
  if (!document.getElementById('factory-recording-pointer')) {
    const pointer = document.createElement('div')
    pointer.id = 'factory-recording-pointer'
    document.body.appendChild(pointer)
    document.addEventListener('mousemove', (event) => {
      pointer.style.left = `${event.clientX}px`
      pointer.style.top = `${event.clientY}px`
      pointer.style.opacity = '1'
    }, { passive: true })
    document.addEventListener('mousedown', () => {
      pointer.classList.remove('factory-click')
      void pointer.offsetWidth
      pointer.classList.add('factory-click')
    }, { passive: true })
  }
  if (!document.getElementById('factory-recording-caption')) {
    const caption = document.createElement('div')
    caption.id = 'factory-recording-caption'
    caption.innerHTML = '<small>جولة تشغيلية على بيانات تحقق تجريبية</small><strong>نظام إدارة مصنع الأعلاف</strong><span>اتصال PostgreSQL فعلي — دون إنشاء معاملات أثناء الجولة</span>'
    document.body.appendChild(caption)
  }
}

async function moveAndClick(page: Page, locator: Locator, current: { x: number; y: number }) {
  await locator.waitFor({ state: 'visible', timeout: 7000 })
  const box = await locator.boundingBox()
  if (!box) throw new Error('Could not locate the visible UI target for a recorded click')
  const targetX = box.x + box.width / 2
  const targetY = box.y + box.height / 2
  const startX = current.x
  const startY = current.y
  const steps = 14
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const eased = t * t * (3 - 2 * t)
    const offset = i < steps ? Math.sin(t * Math.PI) * 3 : 0
    await page.mouse.move(startX + (targetX - startX) * eased + offset, startY + (targetY - startY) * eased - offset)
    await page.waitForTimeout(14)
  }
  await page.waitForTimeout(100)
  await page.mouse.click(targetX, targetY)
  current.x = targetX
  current.y = targetY
}

async function setOverlay(page: Page, group: TourGroup, currentPage: string) {
  await page.evaluate(({ groupLabel, workflow, pageLabel }) => {
    const card = document.getElementById('factory-recording-caption')
    if (!card) return
    card.innerHTML = `<small>جولة تشغيلية على بيانات تحقق تجريبية · ${groupLabel}</small><strong>${pageLabel}</strong><span>${workflow}</span>`
  }, { groupLabel: group.label, workflow: group.workflow, pageLabel: currentPage })
}

async function clickSearchResult(page: Page, target: TourPage, group: TourGroup, current: { x: number; y: number }) {
  const searchButton = page.getByRole('button', { name: 'ابحث في القوائم' }).first()
  if (await searchButton.isVisible().catch(() => false)) await moveAndClick(page, searchButton, current)

  const search = page.getByPlaceholder('ابحث في القوائم').first()
  await search.waitFor({ state: 'visible', timeout: 5000 })
  await moveAndClick(page, search, current)
  await search.fill('')
  await search.pressSequentially(target.label, { delay: 22 })
  await page.waitForTimeout(300)

  const result = page.locator(`a[data-search-result="true"][href="${target.href}"]`).first()
  if (await result.isVisible().catch(() => false)) {
    await moveAndClick(page, result, current)
    const expected = new URL(target.href, BASE_URL)
    let navigation = 'search-click'
    try {
      await page.waitForFunction(({ pathname, search }) => window.location.pathname === pathname && window.location.search === search, { pathname: expected.pathname, search: expected.search }, { timeout: 7000 })
    } catch {
      navigation = 'direct-recovery'
      console.warn(`Search click did not settle at ${target.href}; opening the same catalog URL directly.`)
      await page.goto(expected.toString(), { waitUntil: 'domcontentloaded', timeout: 20000 })
    }
    await page.waitForTimeout(PAGE_HOLD_MS)
    await setOverlay(page, group, target.label)
    return navigation
  }

  // Search indexing is asserted against the route catalogue. Keep a visible mouse
  // click where possible, then use the canonical URL so the recording still covers
  // the documented route and the manifest reports the exceptional route.
  await page.goto(new URL(target.href, BASE_URL).toString(), { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(PAGE_HOLD_MS)
  await setOverlay(page, group, target.label)
  return 'direct-fallback'
}

function probeDuration(file: string) {
  const raw = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file], { encoding: 'utf8' })
  return Number(raw.trim())
}

async function muxVoiceover(rawVideo: string, voicePath: string) {
  await access(voicePath)
  await mkdir(path.dirname(OUTPUT_VIDEO), { recursive: true })
  const videoSeconds = probeDuration(rawVideo)
  const audioSeconds = probeDuration(voicePath)
  const duration = Math.max(videoSeconds, audioSeconds) + 1.5
  const padVideo = Math.max(0, duration - videoSeconds)
  const padAudio = Math.max(0, duration - audioSeconds)
  execFileSync('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'warning', '-i', rawVideo, '-i', voicePath,
    '-vf', `tpad=stop_mode=clone:stop_duration=${padVideo.toFixed(2)}`,
    '-af', `loudnorm=I=-16:TP=-1.5:LRA=7,apad=pad_dur=${padAudio.toFixed(2)}`,
    '-map', '0:v:0', '-map', '1:a:0', '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-t', duration.toFixed(2), '-movflags', '+faststart', OUTPUT_VIDEO,
  ], { stdio: 'inherit' })
}

async function main() {
  if (!EMAIL || !PASSWORD) throw new Error('Set RECORDER_EMAIL and RECORDER_PASSWORD for the UI account before recording.')
  const groups = buildTourGroups()
  const maxPages = Number(process.env.RECORDER_MAX_PAGES || 0)
  if (maxPages > 0) {
    let remaining = maxPages
    for (const group of groups) {
      group.pages = group.pages.slice(0, Math.max(0, remaining))
      remaining -= group.pages.length
    }
  }
  const allPages = groups.flatMap((group) => group.pages)
  const uniqueCount = new Set(allPages.map((page) => page.href)).size
  console.log(`Preparing ${groups.length} workspace flows covering ${uniqueCount} canonical routes.`)
  await mkdir(OUTPUT_DIR, { recursive: true })

  const preflight = await fetch(`${BASE_URL}/api/health`).then((response) => response.json()) as any
  const health = preflight?.data
  if (!preflight?.success || health?.demoMode || !health?.databaseConfigured || !health?.databaseReachable || !health?.bootstrapped) {
    throw new Error(`Database-backed app health check failed: ${JSON.stringify(health)}`)
  }

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    locale: 'ar-OM',
    recordVideo: { dir: OUTPUT_DIR, size: { width: WIDTH, height: HEIGHT } },
  })
  await context.addInitScript(installRecordingOverlay)
  const page = await context.newPage()
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  const current = { x: WIDTH - 55, y: 110 }
  const manifest: Array<{ workspace: string; label: string; href: string; actualUrl: string; navigation: string; heading: string | null }> = []
  let routeSweepError: unknown = null

  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(650)
    await setOverlay(page, { id: 'login', label: 'الدخول', workflow: 'تسجيل الدخول إلى قاعدة PostgreSQL', pages: [] }, 'تسجيل الدخول')
    await moveAndClick(page, page.locator('input[type="email"]'), current)
    await page.locator('input[type="email"]').pressSequentially(EMAIL, { delay: 45 })
    await moveAndClick(page, page.locator('input[type="password"]'), current)
    await page.locator('input[type="password"]').pressSequentially(PASSWORD, { delay: 65 })
    await moveAndClick(page, page.getByRole('button', { name: 'دخول النظام' }), current)
    await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 20000 })
    await page.waitForTimeout(1500)
    await setOverlay(page, groups[0]!, 'لوحة المالك')

    for (const group of groups) {
      console.log(`\n[${group.label}] ${group.pages.length} routes`)
      for (const target of group.pages) {
        if (new URL(target.href, BASE_URL).pathname === new URL(page.url()).pathname && !new URL(target.href, BASE_URL).search) {
          await page.waitForTimeout(PAGE_HOLD_MS)
          await setOverlay(page, group, target.label)
          manifest.push({ workspace: group.id, label: target.label, href: target.href, actualUrl: page.url(), navigation: 'already-open', heading: (await page.locator('main h1, main h2').last().textContent().catch(() => null))?.trim() ?? null })
          console.log(`  ✓ ${target.label} (current)`)
          continue
        }
        const navigation = await clickSearchResult(page, target, group, current)
        const heading = (await page.locator('main h1, main h2').last().textContent().catch(() => null))?.trim() ?? null
        manifest.push({ workspace: group.id, label: target.label, href: target.href, actualUrl: page.url(), navigation, heading })
        console.log(`  ${navigation === 'search-click' ? '✓' : '↪'} ${target.label}${heading ? ` — ${heading}` : ''}`)
      }
    }

    await setOverlay(page, { id: 'finish', label: 'اكتملت الجولة', workflow: 'بيانات تحقق تجريبية · لا توجد معاملات منشأة أثناء التسجيل', pages: [] }, 'اكتملت الجولة')
    await page.waitForTimeout(2200)
  } catch (error) {
    routeSweepError = error
  } finally {
    const video = page.video()
    await context.close()
    await browser.close()
    if (!video) throw new Error('Playwright did not return a recording')
    const rawVideo = path.resolve(OUTPUT_DIR, 'factory-erp-dataflows-raw.webm')
    const recordedPath = await video.path()
    const { copyFile } = await import('node:fs/promises')
    await copyFile(recordedPath, rawVideo)
    await writeFile(path.join(OUTPUT_DIR, 'workflow-manifest.json'), JSON.stringify({ baseUrl: BASE_URL, health, groups: groups.map((group) => ({ id: group.id, label: group.label, flow: group.workflow, pages: group.pages.map((page) => ({ label: page.label, href: page.href })) })), recorded: manifest, pageErrors, routeSweepError: routeSweepError ? String(routeSweepError) : null }, null, 2))
    if (routeSweepError) {
      console.error('Route sweep failed; kept the raw recording and manifest without exporting a final MP4.', routeSweepError)
      process.exitCode = 1
      return
    }
    const voicePath = process.argv.find((arg) => arg.startsWith('--voiceover='))?.slice('--voiceover='.length)
    if (voicePath) {
      await muxVoiceover(rawVideo, path.resolve(voicePath))
      console.log(`\nExported MP4: ${OUTPUT_VIDEO}`)
    } else {
      console.log(`\nRecorded raw WebM: ${rawVideo}`)
    }
    console.log(`Visited ${manifest.length}/${uniqueCount} routes; navigation recoveries: ${manifest.filter((item) => item.navigation !== 'search-click' && item.navigation !== 'already-open').length}; page errors: ${pageErrors.length}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
