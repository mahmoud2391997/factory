import { chromium, type Locator, type Page } from 'playwright'
import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { access, copyFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { NAV_CONFIG } from './apps/web/lib/nav/config'

type NavPage = (typeof NAV_CONFIG.workspaces)[number]['sections'][number]['pages'][number]
type Scene = {
  id: string
  title: string
  workflow: string
  routeIds: string[]
  cues?: number[]
}
type Cursor = { x: number; y: number }
type RouteEvent = { id: string; label: string; href: string; navigation: string; actualUrl: string; loaded: boolean }
type ClipEvent = { id: string; title: string; startMs: number; endMs?: number; durationSec: number; routes: RouteEvent[]; actions: string[]; warnings: string[] }

const ROOT = process.cwd()
const BASE_URL = process.env.RECORDER_BASE_URL || 'http://127.0.0.1:3000'
const OUTPUT_DIR = path.join(ROOT, 'recordings')
const AUDIO_DIR = path.join(OUTPUT_DIR, 'narration')
const NORMALIZED_AUDIO_DIR = path.join(OUTPUT_DIR, '.action-narration-normalized')
const RAW_VIDEO_DIR = path.join(OUTPUT_DIR, '.action-tour-raw')
const MAX_CHAPTERS = Number(process.env.RECORDER_MAX_CHAPTERS || 0)
const IS_PREFLIGHT = MAX_CHAPTERS > 0 && MAX_CHAPTERS < 21
const OUTPUT_PREFIX = IS_PREFLIGHT ? `action-preflight-${MAX_CHAPTERS}` : 'factory-erp-all-dataflows'
const FINAL_VIDEO = path.join(OUTPUT_DIR, IS_PREFLIGHT ? `${OUTPUT_PREFIX}.mp4` : `${OUTPUT_PREFIX}-ar.mp4`)
const RAW_VIDEO = path.join(OUTPUT_DIR, `${OUTPUT_PREFIX}-action-raw.webm`)
const MASTER_AUDIO = path.join(OUTPUT_DIR, `${OUTPUT_PREFIX}-arabic-narration-aligned.wav`)
const MANIFEST_PATH = path.join(OUTPUT_DIR, `${OUTPUT_PREFIX}-manifest.json`)
const CHAPTERS_PATH = path.join(OUTPUT_DIR, `${OUTPUT_PREFIX}-chapters.md`)
const EMAIL = process.env.RECORDER_EMAIL || ''
const PASSWORD = process.env.RECORDER_PASSWORD || ''

const scenes: Scene[] = [
  { id: '01-dashboard', title: 'لوحة المالك', workflow: 'الإنتاج · المبيعات · التحصيل · المخزون · التنبيهات', routeIds: ['dashboard'] },
  { id: '02-fleet', title: 'السيارات والنقل', workflow: 'مركبة ← وقود ← رحلة ← استهلاك وانحراف', routeIds: ['fleet', 'fleetFuel', 'fleetTrips'], cues: [0, 0.30, 0.63] },
  { id: '03-obligations', title: 'الأقساط والالتزامات المالية', workflow: 'قسط ← استحقاق ← سداد ← تنبيه', routeIds: ['obligation'] },
  { id: '04-bank', title: 'البنك والحسابات', workflow: 'معاملة ← مطابقة يدوية ← مصروف/قيد ← سجل تدقيق', routeIds: ['bankTransaction', 'expense', 'auditLog'], cues: [0, 0.38, 0.72] },
  { id: '05-purchasing', title: 'المشتريات والموافقات', workflow: 'طلب ← عروض ← اعتماد ← أمر شراء ← استلام', routeIds: ['purchaseRequest', 'purchaseOrder', 'goodsReceipt'], cues: [0, 0.34, 0.68] },
  { id: '06-stores', title: 'قطع الغيار ومواد التعبئة', workflow: 'استلام ← صرف/جرد ← رصيد ← تكلفة استخدام', routeIds: ['inventoryExtensions', 'inventoryExtensions-packaging'], cues: [0, 0.53] },
  { id: '07-supplier-comms', title: 'التواصل مع الموردين', workflow: 'قالب ← تجهيز الرسالة ← اعتماد ← سجل التواصل', routeIds: ['supplierTemplate', 'supplierCommunication'], cues: [0, 0.53] },
  { id: '08-production-scale', title: 'التصنيع والميزان والهدر', workflow: 'أمر إنتاج ← وزن فعلي ← ناتج ← هدر وانحراف', routeIds: ['productionOrder', 'scaleReading', 'factoryWaste', 'varianceReport'], cues: [0, 0.27, 0.52, 0.76] },
  { id: '09-recipes', title: 'الخلطات وأوزان الأكياس', workflow: 'وصفة ← مكونات ← وزن كيس ← كمية وتكلفة', routeIds: ['recipe', 'recipeItem', 'product'], cues: [0, 0.36, 0.68] },
  { id: '10-customer-recipes', title: 'خلطات العملاء', workflow: 'وصفة خاصة ← تكلفة مستقلة ← سعر عميل', routeIds: ['customerRecipe'] },
  { id: '11-distribution', title: 'نقاط التوزيع والمبيعات', workflow: 'نقطة ← باركود ← مبيعات/مرتجعات ← إقفال يومي', routeIds: ['distributionPoint', 'barcode', 'distributionClosing'], cues: [0, 0.34, 0.70] },
  { id: '12-delivery', title: 'الفاتورة والتسليم والتحصيل', workflow: 'محاسب ← تحميل ← سائق ← مستلم ← تحصيل', routeIds: ['invoiceDelivery', 'salesPayment'], cues: [0, 0.63] },
  { id: '13-utilities', title: 'الكهرباء والماء والغاز', workflow: 'قراءة ← إنتاج الفترة ← استهلاك وتكلفة لكل طن', routeIds: ['utilitiesReading'] },
  { id: '14-documents', title: 'التصاريح والعقود والوثائق', workflow: 'وثيقة ← مسؤول تجديد ← تاريخ انتهاء ← تنبيه', routeIds: ['documents'] },
  { id: '15-people', title: 'الموظفون والحضور والرواتب', workflow: 'ملف موظف ← حضور/إضافي ← اعتماد ← مسير', routeIds: ['employee', 'attendance', 'overtime', 'payroll'], cues: [0, 0.27, 0.52, 0.77] },
  { id: '16-raw-prices', title: 'تحليل أسعار المواد الخام', workflow: 'سعر ومورد ← نقل ← تكلفة واصلة ← اتجاه شهري', routeIds: ['materialPriceAnalysis'] },
  { id: '17-maintenance', title: 'الصيانة والماكينات', workflow: 'ماكينة ← جدول وقائي ← عطل/توقف ← قطع وتكلفة', routeIds: ['machine', 'maintenanceSchedule', 'maintenanceRecord'], cues: [0, 0.36, 0.69] },
  { id: '18-roles-languages', title: 'اللغة والصلاحيات', workflow: 'دور وظيفي ← صلاحية ← شاشة مسموحة', routeIds: ['users'] },
  { id: '19-trace-profit', title: 'تتبع الدفعات والربحية', workflow: 'خام ومورد ← دفعة إنتاج ← عميل وجودة ← هامش', routeIds: ['productionLot', 'lotTrace', 'profitability'], cues: [0, 0.38, 0.72] },
  { id: '20-nutrition-qc', title: 'التحليل الغذائي ومقارنة الجودة', workflow: 'تحليل خام ← قيمة وصفة محسوبة ← مختبر ومواصفة ← قرار جودة', routeIds: ['qualitySample', 'supplierQuality'], cues: [0, 0.68] },
  { id: '21-outro', title: 'الختام وحدود الاتصال', workflow: 'نتائج التحقق · PostgreSQL محلي · بيانات اصطناعية', routeIds: ['dashboard'] },
]

const allPages: NavPage[] = [
  ...NAV_CONFIG.workspaces.flatMap((workspace) => workspace.sections.flatMap((section) => section.pages)),
  ...NAV_CONFIG.utilityPages,
]
const pageById = new Map(allPages.map((page) => [page.id, page]))
const routeScenes = IS_PREFLIGHT ? scenes.slice(0, MAX_CHAPTERS) : scenes

function probeDuration(file: string): number {
  const raw = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file], { encoding: 'utf8' })
  return Number(raw.trim())
}

function safeUrl(url: string) {
  const parsed = new URL(url, BASE_URL)
  return `${parsed.pathname}${parsed.search}`
}

function installRecordingOverlay() {
  if (!document.head || !document.body) {
    document.addEventListener('DOMContentLoaded', () => installRecordingOverlay(), { once: true })
    return
  }
  const styleId = 'factory-action-tour-style'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      #factory-action-pointer{position:fixed;z-index:2147483647;left:0;top:0;width:24px;height:24px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 2px #167d70,0 2px 10px #0006;background:#14b8a6aa;pointer-events:none;transform:translate(-50%,-50%);opacity:0;transition:opacity .16s ease}
      #factory-action-pointer:after{content:'';position:absolute;inset:7px;border-radius:50%;background:#fff}
      #factory-action-pointer.factory-click{animation:factory-action-click .36s ease-out}
      @keyframes factory-action-click{0%{box-shadow:0 0 0 2px #167d70,0 0 0 0 #14b8a6aa}100%{box-shadow:0 0 0 2px #167d70,0 0 0 20px #14b8a600}}
      #factory-action-caption{position:fixed;z-index:2147483646;left:28px;bottom:24px;width:min(540px,44vw);padding:13px 17px;border:1px solid #ffffff42;border-radius:13px;background:rgba(13,35,34,.92);color:#fff;box-shadow:0 8px 30px #0004;direction:rtl;text-align:right;font-family:Arial,sans-serif;pointer-events:none;backdrop-filter:blur(8px)}
      #factory-action-caption small{display:block;margin-bottom:4px;color:#9de0d4;font-size:12px;font-weight:700}
      #factory-action-caption strong{display:block;font-size:17px;line-height:1.4}
      #factory-action-caption span{display:block;margin-top:4px;color:#d3e9e4;font-size:12px;line-height:1.45}
    `
    document.head.appendChild(style)
  }
  if (!document.getElementById('factory-action-pointer')) {
    const pointer = document.createElement('div')
    pointer.id = 'factory-action-pointer'
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
  if (!document.getElementById('factory-action-caption')) {
    const caption = document.createElement('div')
    caption.id = 'factory-action-caption'
    caption.innerHTML = '<small>جولة تشغيلية على بيانات تحقق اصطناعية</small><strong>إدارة مصنع الأعلاف</strong><span>PostgreSQL محلي معزول · لا توجد بيانات إنتاج حقيقية</span>'
    document.body.appendChild(caption)
  }
}

async function moveTo(page: Page, locator: Locator, cursor: Cursor) {
  await locator.waitFor({ state: 'visible', timeout: 7000 })
  const box = await locator.boundingBox()
  if (!box) throw new Error('تعذّر تحديد عنصر ظاهر في واجهة التسجيل')
  const targetX = box.x + Math.max(2, box.width * (0.42 + Math.random() * 0.16))
  const targetY = box.y + Math.max(2, box.height * (0.40 + Math.random() * 0.20))
  const startX = cursor.x
  const startY = cursor.y
  const steps = 14 + Math.floor(Math.random() * 5)
  const bend = (Math.random() - 0.5) * 34
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const eased = t * t * (3 - 2 * t)
    const curve = Math.sin(Math.PI * t) * bend
    await page.mouse.move(startX + (targetX - startX) * eased + curve, startY + (targetY - startY) * eased - curve * 0.35)
    await page.waitForTimeout(10 + Math.floor(Math.random() * 9))
  }
  cursor.x = targetX
  cursor.y = targetY
  await page.waitForTimeout(110 + Math.floor(Math.random() * 140))
}

async function click(page: Page, locator: Locator, cursor: Cursor) {
  await moveTo(page, locator, cursor)
  await page.mouse.down()
  await page.waitForTimeout(60 + Math.floor(Math.random() * 70))
  await page.mouse.up()
}

async function updateCaption(page: Page, chapter: Scene, pageLabel: string) {
  await page.evaluate(({ chapterTitle, workflow, routeLabel }) => {
    const card = document.getElementById('factory-action-caption')
    if (!card) return
    const small = document.createElement('small')
    small.textContent = `بيانات اصطناعية · ${chapterTitle}`
    const strong = document.createElement('strong')
    strong.textContent = routeLabel
    const span = document.createElement('span')
    span.textContent = workflow
    card.replaceChildren(small, strong, span)
  }, { chapterTitle: chapter.title, workflow: chapter.workflow, routeLabel: pageLabel })
}

async function audioServerListen() {
  const files = new Set(scenes.map((scene) => `${scene.id}.wav`))
  const server = createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    if (url.pathname === '/' || url.pathname === '/player') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      res.end('<!doctype html><html><head><meta charset="utf-8"><title>Audio timeline</title></head><body>Audio timeline</body></html>')
      return
    }
    const name = path.basename(url.pathname)
    if (!files.has(name)) {
      res.writeHead(404)
      res.end('not found')
      return
    }
    res.writeHead(200, {
      'content-type': 'audio/wav',
      'access-control-allow-origin': '*',
      'cache-control': 'no-store',
    })
    createReadStream(path.join(AUDIO_DIR, name)).pipe(res)
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('تعذّر تشغيل خادم الصوت المحلي')
  return { server, url: `http://127.0.0.1:${address.port}` }
}

async function findVisibleExactHref(page: Page, href: string) {
  const wanted = new URL(href, BASE_URL)
  return page.evaluate(function (target: { pathname: string; search: string }) {
    const anchors = document.querySelectorAll<HTMLAnchorElement>('a[href]')
    let match: HTMLAnchorElement | null = null
    for (let i = 0; i < anchors.length; i++) {
      const anchor = anchors.item(i)
      const style = getComputedStyle(anchor)
      const rect = anchor.getBoundingClientRect()
      if (style.display === 'none' || style.visibility === 'hidden' || rect.width <= 0 || rect.height <= 0) continue
      const url = new URL(anchor.href, window.location.origin)
      if (url.pathname === target.pathname && url.search === target.search) {
        match = anchor
        break
      }
    }
    const tagged = document.querySelectorAll('[data-tour-route-target]')
    for (let i = 0; i < tagged.length; i++) tagged.item(i)?.removeAttribute('data-tour-route-target')
    if (!match) return false
    match.setAttribute('data-tour-route-target', 'true')
    return true
  }, { pathname: wanted.pathname, search: wanted.search })
}

async function waitUntilRouteReady(page: Page, href: string) {
  const wanted = new URL(href, BASE_URL)
  await page.waitForFunction(({ pathname, search }) => window.location.pathname === pathname && window.location.search === search, { pathname: wanted.pathname, search: wanted.search }, { timeout: 8000 })
  await page.waitForFunction(() => {
    const text = document.querySelector('main')?.innerText || ''
    return text.length > 120 && !text.includes('جاري تحميل عمليات المصنع')
  }, null, { timeout: 7000 }).catch(() => undefined)
  await page.waitForTimeout(450)
}

async function navigateTo(page: Page, target: NavPage, chapter: Scene, cursor: Cursor): Promise<RouteEvent> {
  const wanted = safeUrl(target.href)
  const current = safeUrl(page.url())
  let navigation = current === wanted ? 'already-on-route' : 'search-result-click'
  if (current !== wanted) {
    await updateCaption(page, chapter, target.label)
    let navigated = false
    const search = page.getByPlaceholder('ابحث في القوائم').first()
    try {
      if (!(await search.isVisible().catch(() => false))) {
        const searchButton = page.getByRole('button', { name: /ابحث في القوائم/ }).first()
        if (await searchButton.isVisible().catch(() => false)) await click(page, searchButton, cursor)
      }
      await search.waitFor({ state: 'visible', timeout: 5000 })
      await click(page, search, cursor)
      await search.fill('')
      await search.pressSequentially(target.label, { delay: 24 })
      await page.waitForTimeout(450)
      const hasExactSearchResult = await page.evaluate(function (expected: { pathname: string; search: string }) {
        const anchors = document.querySelectorAll<HTMLAnchorElement>('a[data-search-result="true"]')
        let match: HTMLAnchorElement | null = null
        for (let i = 0; i < anchors.length; i++) {
          const anchor = anchors.item(i)
          const url = new URL(anchor.href, window.location.origin)
          const style = getComputedStyle(anchor)
          if (url.pathname === expected.pathname && url.search === expected.search && style.display !== 'none') {
            match = anchor
            break
          }
        }
        const tagged = document.querySelectorAll('[data-tour-route-target]')
        for (let i = 0; i < tagged.length; i++) tagged.item(i)?.removeAttribute('data-tour-route-target')
        if (!match) return false
        match.setAttribute('data-tour-route-target', 'true')
        return true
      }, { pathname: new URL(target.href, BASE_URL).pathname, search: new URL(target.href, BASE_URL).search })
      if (hasExactSearchResult) {
        await click(page, page.locator('a[data-tour-route-target="true"]').first(), cursor)
        await waitUntilRouteReady(page, target.href)
        navigated = true
      }
    } catch {
      await page.keyboard.press('Escape').catch(() => undefined)
    }

    if (!navigated) {
      await page.keyboard.press('Escape').catch(() => undefined)
      const clickedVisibleLink = await findVisibleExactHref(page, target.href).catch(() => false)
      if (clickedVisibleLink) {
        try {
          await click(page, page.locator('a[data-tour-route-target="true"]').first(), cursor)
          await waitUntilRouteReady(page, target.href)
          navigation = 'visible-link-click'
          navigated = true
        } catch {
          await page.keyboard.press('Escape').catch(() => undefined)
        }
      }
    }

    if (!navigated) {
      navigation = 'direct-recovery'
      await page.goto(new URL(target.href, BASE_URL).toString(), { waitUntil: 'domcontentloaded', timeout: 20000 })
      await waitUntilRouteReady(page, target.href)
    }
  }
  await updateCaption(page, chapter, target.label)
  const loaded = await page.evaluate(() => {
    const text = document.querySelector('main')?.innerText || ''
    return text.length > 120 && !text.includes('جاري تحميل عمليات المصنع')
  })
  const actualUrl = safeUrl(page.url())
  return {
    id: target.id,
    label: target.label,
    href: target.href,
    navigation: actualUrl === wanted ? navigation : 'route-mismatch',
    actualUrl,
    loaded,
  }
}

async function hoverFirstDataRow(page: Page, cursor: Cursor) {
  const row = page.locator('main tbody tr').first()
  if (await row.isVisible().catch(() => false)) {
    await moveTo(page, row, cursor)
    await page.waitForTimeout(250)
    return true
  }
  const input = page.locator('main input:visible').first()
  if (await input.isVisible().catch(() => false)) {
    await moveTo(page, input, cursor)
    return true
  }
  return false
}

async function showAddFormWithoutSaving(page: Page, cursor: Cursor): Promise<string | null> {
  const addButton = page.getByRole('button', { name: /^إضافة(?!\s*(حذف|إزالة))/ }).first()
  if (!(await addButton.isVisible().catch(() => false))) return null
  await click(page, addButton, cursor)
  await page.waitForTimeout(550)
  const candidate = page.locator('main input:visible, main select:visible, main textarea:visible').first()
  if (await candidate.isVisible().catch(() => false)) await moveTo(page, candidate, cursor)
  await page.waitForTimeout(900)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(250)
  return 'opened add form and canceled without saving'
}

async function performSafeRouteAction(page: Page, routeId: string, cursor: Cursor): Promise<string[]> {
  const actions: string[] = []
  if (routeId === 'dashboard') {
    const card = page.locator('main a, main button').first()
    if (await card.isVisible().catch(() => false)) await moveTo(page, card, cursor)
    await page.mouse.move(1080, 690)
    await page.mouse.wheel(0, 320)
    await page.waitForTimeout(450)
    actions.push('scrolled owner KPI cards and alerts while dashboard narration played')
    return actions
  }
  if (routeId === 'purchaseOrder') {
    const targetRow = page.locator('main tr').filter({ hasText: 'PO-2026-009' }).first()
    const approval = targetRow.getByRole('button', { name: /^اعتماد$/ }).first()
    if (await approval.isVisible().catch(() => false) && await approval.isEnabled().catch(() => false)) {
      await click(page, approval, cursor)
      await targetRow.getByText('معتمد', { exact: true }).waitFor({ state: 'visible', timeout: 5000 }).catch(() => undefined)
      const statusAfter = await targetRow.innerText().catch(() => '')
      if (statusAfter.includes('معتمد') && !statusAfter.includes('بانتظار الاعتماد')) {
        actions.push('approved synthetic purchase order PO-2026-009; confirmed status changed to معتمد in the local UI')
      } else {
        actions.push('clicked approval for synthetic purchase order PO-2026-009, but the resulting status was not confirmed')
      }
      const approvalToast = page.getByRole('status').filter({ hasText: 'PO-2026-009' })
      const closeToast = approvalToast.getByRole('button', { name: /إغلاق/ }).first()
      if (await closeToast.isVisible().catch(() => false)) {
        await click(page, closeToast, cursor)
        actions.push('dismissed the local approval confirmation toast after verifying the status change')
      }
      return actions
    }
    const currentRow = await targetRow.innerText().catch(() => '')
    if (currentRow.includes('معتمد')) {
      actions.push('highlighted synthetic purchase order PO-2026-009 already marked معتمد; no new approval action was available')
    }
    return actions
  }

  if (routeId === 'qualitySample') {
    const main = page.locator('main')
    const heldRow = main.locator('tbody tr').filter({ hasText: 'معلّق' }).first()
    const rejectedRow = main.locator('tbody tr').filter({ hasText: 'مرفوض' }).first()
    if (await heldRow.isVisible().catch(() => false)) {
      await moveTo(page, heldRow, cursor)
      actions.push('highlighted an existing held synthetic QC sample; no sample status changed')
    }
    if (await rejectedRow.isVisible().catch(() => false)) {
      await moveTo(page, rejectedRow, cursor)
      actions.push('highlighted an existing rejected synthetic QC sample; no sample status changed')
    }
    const nutrientTable = main.getByText(/التحليل الغذائي\s*—/).last()
    if (await nutrientTable.count()) {
      await nutrientTable.scrollIntoViewIfNeeded()
      await moveTo(page, nutrientTable, cursor)
      await page.mouse.wheel(0, 300)
      await page.waitForTimeout(450)
      actions.push('showed the calculated-versus-lab nutrient comparison')
    }
    return actions
  }

  if (routeId === 'users') {
    const profile = page.getByRole('button', { name: /سعيد الوهيبي/ }).last()
    if (await profile.isVisible().catch(() => false)) {
      await click(page, profile, cursor)
      await page.waitForTimeout(300)
      for (const language of ['العربية', 'English', 'हिंदी']) {
        const option = page.getByText(language, { exact: true }).last()
        if (await option.isVisible().catch(() => false)) await moveTo(page, option, cursor)
      }
      await page.keyboard.press('Escape')
      actions.push('opened the language menu and hovered Arabic, English and Hindi options without changing user settings')
    }
    await hoverFirstDataRow(page, cursor)
    return actions
  }

  const formRoutes = new Set([
    'fleet', 'obligation', 'purchaseRequest', 'goodsReceipt', 'inventoryExtensions',
    'supplierTemplate', 'utilitiesReading', 'documents', 'attendance', 'maintenanceRecord',
    'customerRecipe', 'distributionClosing',
  ])
  if (formRoutes.has(routeId)) {
    const result = await showAddFormWithoutSaving(page, cursor)
    if (result) actions.push(result)
  }

  if (routeId === 'scaleReading') {
    const input = page.locator('main input:visible').first()
    if (await input.isVisible().catch(() => false)) {
      await moveTo(page, input, cursor)
      actions.push('highlighted a scale-reading field without submitting a weight')
    }
  }
  if (routeId === 'invoiceDelivery') {
    const nextAction = page.getByRole('button', { name: /تحميل|إسناد|تأكيد المرحلة|تسليم/ }).first()
    if (await nextAction.isVisible().catch(() => false)) {
      await moveTo(page, nextAction, cursor)
      actions.push('highlighted the next delivery-stage action without advancing a real-world delivery')
    }
  }
  if (routeId === 'fleetTrips') {
    const input = page.locator('main input:visible').first()
    if (await input.isVisible().catch(() => false)) {
      await moveTo(page, input, cursor)
      actions.push('highlighted the trip record fields for driver, route, distance, load and fuel')
    }
  }
  if (routeId === 'bankTransaction') {
    const row = page.locator('main tbody tr').first()
    if (await row.isVisible().catch(() => false)) {
      await moveTo(page, row, cursor)
      actions.push('highlighted the first bank transaction for manual review')
    }
  }
  if (routeId === 'purchaseRequest') {
    await hoverFirstDataRow(page, cursor)
    actions.push('reviewed a purchase request and its supplier quotation comparison')
  }
  if (routeId === 'lotTrace' || routeId === 'productionLot' || routeId === 'profitability') {
    await hoverFirstDataRow(page, cursor)
    await page.mouse.wheel(0, 270)
    actions.push(`reviewed ${routeId} trace/cost data`)
  }
  if (routeId === 'qualitySample') return actions
  if (!actions.length) await hoverFirstDataRow(page, cursor)
  return actions
}

async function startNarration(audioPage: Page, url: string, id: string) {
  return audioPage.evaluate(async ({ src, clipId }) => {
    const w = window as unknown as Record<string, any>
    const previous = w.__factoryTourAudio as HTMLAudioElement | undefined
    if (previous) {
      previous.pause()
      previous.src = ''
    }
    const audio = new Audio(src)
    audio.crossOrigin = 'anonymous'
    audio.preload = 'auto'
    w.__factoryTourAudio = audio
    w.__factoryTourClipId = clipId
    await audio.play()
    return { startedAtMs: Date.now(), clipId }
  }, { src: url, clipId: id })
}

async function waitForNarrationPosition(audioPage: Page, seconds: number) {
  if (seconds <= 0) return
  await audioPage.waitForFunction((target) => {
    const w = window as unknown as Record<string, any>
    const audio = w.__factoryTourAudio as HTMLAudioElement | undefined
    return Boolean(audio && (audio.currentTime >= target || audio.ended))
  }, seconds, { timeout: Math.max(4000, seconds * 1000 + 5000) })
}

async function waitForNarrationEnd(audioPage: Page, durationSec: number) {
  await audioPage.waitForFunction(() => {
    const w = window as unknown as Record<string, any>
    return Boolean((w.__factoryTourAudio as HTMLAudioElement | undefined)?.ended)
  }, null, { timeout: Math.ceil(durationSec * 1000 + 12000) })
  return audioPage.evaluate(() => Date.now())
}

async function makeSilence(seconds: number, output: string) {
  if (seconds < 0.025) return false
  execFileSync('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
    '-t', seconds.toFixed(3), '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', output,
  ])
  return true
}

async function buildAlignedNarration(clips: ClipEvent[]) {
  await mkdir(NORMALIZED_AUDIO_DIR, { recursive: true })
  const concatEntries: string[] = []
  let cursorSec = 0
  let silenceIndex = 0
  for (const clip of clips) {
    const source = path.join(AUDIO_DIR, `${clip.id}.wav`)
    const normalized = path.join(NORMALIZED_AUDIO_DIR, `${clip.id}.wav`)
    execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', source, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', normalized])
    const targetStart = Math.max(cursorSec, clip.startMs / 1000)
    const gap = targetStart - cursorSec
    if (gap >= 0.025) {
      const silence = path.join(NORMALIZED_AUDIO_DIR, `gap-${String(silenceIndex++).padStart(2, '0')}.wav`)
      if (await makeSilence(gap, silence)) concatEntries.push(silence)
    }
    concatEntries.push(normalized)
    cursorSec = targetStart + probeDuration(normalized)
  }
  const concatList = path.join(NORMALIZED_AUDIO_DIR, 'concat.txt')
  const concatText = concatEntries.map((file) => `file '${file.replaceAll("'", "'\\''")}'`).join('\n') + '\n'
  await writeFile(concatList, concatText)
  execFileSync('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', concatList,
    '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', MASTER_AUDIO,
  ])
  return probeDuration(MASTER_AUDIO)
}

function timecode(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(whole / 3600)
  const minutes = Math.floor((whole % 3600) / 60)
  const secs = whole % 60
  return hours ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}` : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

async function muxVideo(rawVideo: string, audioPath: string, audioDuration: number) {
  const videoDuration = probeDuration(rawVideo)
  const totalDuration = Math.max(videoDuration, audioDuration) + 1.25
  const padVideo = Math.max(0, totalDuration - videoDuration)
  const padAudio = Math.max(0, totalDuration - audioDuration)
  execFileSync('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'warning', '-i', rawVideo, '-i', audioPath,
    '-vf', `tpad=stop_mode=clone:stop_duration=${padVideo.toFixed(2)}`,
    '-af', `loudnorm=I=-16:TP=-1.5:LRA=7,apad=pad_dur=${padAudio.toFixed(2)}`,
    '-map', '0:v:0', '-map', '1:a:0', '-r', '25', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2', '-t', totalDuration.toFixed(2), '-movflags', '+faststart', FINAL_VIDEO,
  ], { stdio: 'inherit' })
  return { videoDuration, audioDuration, totalDuration }
}

async function main() {
  if (!EMAIL || !PASSWORD) throw new Error('Set RECORDER_EMAIL and RECORDER_PASSWORD in a private environment file before recording.')
  const missingRoutes = routeScenes.flatMap((scene) => scene.routeIds.filter((id) => !pageById.has(id)).map((id) => `${scene.id}:${id}`))
  if (missingRoutes.length) throw new Error(`Navigation catalog is missing route IDs: ${missingRoutes.join(', ')}`)
  for (const scene of routeScenes) await access(path.join(AUDIO_DIR, `${scene.id}.wav`))
  await mkdir(OUTPUT_DIR, { recursive: true })
  await mkdir(RAW_VIDEO_DIR, { recursive: true })

  const healthResponse = await fetch(`${BASE_URL}/api/health`)
  const healthPayload = await healthResponse.json().catch(() => ({}))
  if (!healthResponse.ok) throw new Error(`App health returned HTTP ${healthResponse.status}`)
  const healthData = healthPayload.data ?? healthPayload
  if (healthData.databaseConfigured !== true || healthData.databaseReachable !== true || healthData.demoMode === true) {
    throw new Error(`The app is not healthy on a configured non-demo database: ${JSON.stringify(healthPayload)}`)
  }

  const audioHost = await audioServerListen()
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'] })
  const videoContext = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
    locale: 'ar-OM',
    colorScheme: 'light',
    recordVideo: { dir: RAW_VIDEO_DIR, size: { width: 1600, height: 900 } },
  })
  const videoCaptureStartMs = Date.now()
  const page = await videoContext.newPage()
  page.setDefaultTimeout(7000)
  await page.addInitScript(installRecordingOverlay)

  const audioContext = await browser.newContext({ viewport: { width: 600, height: 400 }, locale: 'ar-OM' })
  const audioPage = await audioContext.newPage()
  await audioPage.goto(`${audioHost.url}/player`, { waitUntil: 'domcontentloaded' })
  const browserErrors: string[] = []
  page.on('pageerror', (error) => browserErrors.push(error.message))
  page.on('response', (response) => {
    const status = response.status()
    const pathname = new URL(response.url()).pathname
    if (status >= 500 || (status === 401 && pathname !== '/api/auth/me')) {
      browserErrors.push(`HTTP ${status} ${pathname}`)
    }
  })

  const events: ClipEvent[] = []
  const cursor: Cursor = { x: 1110, y: 740 }
  let pageVideo: ReturnType<Page['video']> | null = null
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
    const emailField = page.locator('input[type="email"]').first()
    const passwordField = page.locator('input[type="password"]').first()
    await emailField.waitFor({ state: 'visible', timeout: 12000 })
    await click(page, emailField, cursor)
    await emailField.fill(EMAIL)
    await click(page, passwordField, cursor)
    await passwordField.fill(PASSWORD)
    const loginButton = page.getByRole('button', { name: 'دخول النظام' }).first()
    await click(page, loginButton, cursor)
    await page.waitForFunction(() => !window.location.pathname.endsWith('/login'), null, { timeout: 20000 })
    await page.waitForTimeout(900)

    for (const scene of routeScenes) {
      const audioFile = path.join(AUDIO_DIR, `${scene.id}.wav`)
      const durationSec = probeDuration(audioFile)
      const audioUrl = `${audioHost.url}/${path.basename(audioFile)}`
      await updateCaption(page, scene, scene.title)
      const playback = await startNarration(audioPage, audioUrl, scene.id)
      const event: ClipEvent = {
        id: scene.id,
        title: scene.title,
        startMs: Math.max(0, playback.startedAtMs - videoCaptureStartMs),
        durationSec,
        routes: [],
        actions: [],
        warnings: [],
      }
      events.push(event)
      const routeCues = scene.cues || scene.routeIds.map((_, index) => index / Math.max(1, scene.routeIds.length))
      for (let index = 0; index < scene.routeIds.length; index++) {
        const routeId = scene.routeIds[index]
        const target = pageById.get(routeId)
        if (!target) continue
        const cue = durationSec * (routeCues[index] || 0)
        try {
          await waitForNarrationPosition(audioPage, cue)
          const routeEvent = await navigateTo(page, target, scene, cursor)
          event.routes.push(routeEvent)
          const actionLog = await performSafeRouteAction(page, routeId, cursor)
          event.actions.push(...actionLog)
          if (!actionLog.length) await hoverFirstDataRow(page, cursor)
        } catch (error) {
          event.warnings.push(`${routeId}: ${error instanceof Error ? error.message : String(error)}`)
          await page.keyboard.press('Escape').catch(() => undefined)
        }
      }
      const endMs = await waitForNarrationEnd(audioPage, durationSec)
      event.endMs = Math.max(event.startMs, endMs - videoCaptureStartMs)
    }

    await updateCaption(page, { id: 'end', title: 'اكتملت الجولة', workflow: '21 مشهداً · بيانات تجريبية · PostgreSQL محلي', routeIds: [] }, 'شكراً لمتابعتكم')
    await page.waitForTimeout(1400)
    pageVideo = page.video()
    await page.close()
    await videoContext.close()
    if (!pageVideo) throw new Error('Playwright did not create a screen recording')
    const tempVideoPath = await pageVideo.path()
    await copyFile(tempVideoPath, RAW_VIDEO)

    const alignedAudioDuration = await buildAlignedNarration(events)
    const muxStats = await muxVideo(RAW_VIDEO, MASTER_AUDIO, alignedAudioDuration)
    const totalExpectedRoutes = routeScenes.reduce((sum, scene) => sum + scene.routeIds.length, 0)
    const successfulRoutes = events.flatMap((event) => event.routes).filter((route) => route.loaded && route.actualUrl === route.href).length
    const manifest = {
      createdAt: new Date().toISOString(),
      appBaseUrl: BASE_URL,
      appHealthHttpStatus: healthResponse.status,
      appHealth: healthPayload,
      databaseBoundary: 'Disposable, local-only PostgreSQL validation database; synthetic seeded records; not a production database.',
      dataMutations: events.flatMap((event) => event.actions).filter((action) => action.includes('approved synthetic')),
      loginAccount: EMAIL,
      recording: {
        finalVideo: path.basename(FINAL_VIDEO),
        rawVideo: path.basename(RAW_VIDEO),
        alignedVoiceTrack: path.basename(MASTER_AUDIO),
        output: 'MP4 H.264 + AAC, 1600x900, Arabic female narration, human-like visible pointer and chapter captions',
        ...muxStats,
      },
      routeCoverage: { expected: totalExpectedRoutes, successfullyLoadedExactRoutes: successfulRoutes, chapters: events.length },
      chapters: events,
      browserErrors: [...new Set(browserErrors)],
    }
    await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`)

    let chapters = '# جولة تدفقات العمل — فصول الفيديو\n\n'
    chapters += `المدة: ${timecode(muxStats.totalDuration)}. قاعدة التحقق PostgreSQL محلية ومعزولة؛ البيانات اصطناعية.\n\n`
    for (const event of events) {
      chapters += `- **${timecode(event.startMs / 1000)}** — ${event.title}\n`
      for (const route of event.routes) chapters += `  - ${route.label} — ${route.href}${route.loaded ? '' : ' (لم يكتمل تحميل المحتوى)'}\n`
    }
    chapters += '\n## حدود التكامل المعروضة\n\nالبنك وWhatsApp والأجهزة المادية غير موصولة في هذه البيئة؛ يوضح الصوت ذلك صراحة. استخدمت الجولة حساب تحقق محلياً، ولم تُرسل رسائل إلى موردين أو تُنفذ عمليات خارجية. تمت الموافقة عبر الواجهة على أمر شراء اصطناعي واحد في قاعدة التحقق المحلية.\n'
    await writeFile(CHAPTERS_PATH, chapters)
    console.log(JSON.stringify({ finalVideo: FINAL_VIDEO, alignedAudio: MASTER_AUDIO, chapters: CHAPTERS_PATH, manifest: MANIFEST_PATH, routes: `${successfulRoutes}/${totalExpectedRoutes}`, durationSec: muxStats.totalDuration, browserErrors: [...new Set(browserErrors)] }, null, 2))
  } finally {
    await page.close().catch(() => undefined)
    await audioContext.close().catch(() => undefined)
    await videoContext.close().catch(() => undefined)
    await browser.close().catch(() => undefined)
    audioHost.server.close()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error))
  process.exit(1)
})
