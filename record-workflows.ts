import { chromium, type Browser, type Page, type BrowserContext } from 'playwright'

const BASE_URL = 'http://localhost:3000'
const VIDEO_DIR = './recordings'

// Define the data flow sequences to record with Arabic descriptions
const dataFlows = [
  {
    name: 'Procurement Flow',
    description: 'Supplier → Purchase Request → Purchase Order → Goods Receipt',
    pages: [
      { url: '/sales/parties/suppliers', label: 'الموردون', arabicDesc: 'إدارة ملفات الموردين ومعلوماتهم' },
      { url: '/sales/parties/requests', label: 'طلبات الشراء', arabicDesc: 'إنشاء واعتماد طلبات الشراء' },
      { url: '/sales/parties/orders', label: 'أوامر الشراء', arabicDesc: 'متابعة أوامر الشراء وحالتها' },
      { url: '/sales/parties/receipts', label: 'استلام البضاعة', arabicDesc: 'استلام المواد الخام للمستودع' },
    ]
  },
  {
    name: 'Production Flow',
    description: 'Raw Materials → Recipe → Production Order → Scale → Finished Goods',
    pages: [
      { url: '/inventory/raw-materials', label: 'المواد الخام', arabicDesc: 'إدارة أصناف المواد الخام' },
      { url: '/inventory/manufacturing', label: 'الوصفات', arabicDesc: 'تعريف وصفات الإنتاج' },
      { url: '/inventory/manufacturing/orders', label: 'أوامر التصنيع', arabicDesc: 'إصدار أوامر الإنتاج' },
      { url: '/inventory/manufacturing/scale', label: 'الميزان', arabicDesc: 'تسجيل قراءات الميزان' },
      { url: '/inventory/products', label: 'المنتجات', arabicDesc: 'المنتجات النهائية' },
    ]
  },
  {
    name: 'Sales Flow',
    description: 'Customer → Invoice → Delivery → Collection',
    pages: [
      { url: '/sales/parties', label: 'العملاء', arabicDesc: 'إدارة ملفات العملاء' },
      { url: '/sales', label: 'الفواتير', arabicDesc: 'إنشاء فواتير المبيعات' },
      { url: '/sales/delivery', label: 'التسليم', arabicDesc: 'متابعة مراحل التسليم' },
      { url: '/sales/collections', label: 'التحصيل', arabicDesc: 'تسجيل التحصيلات' },
    ]
  },
  {
    name: 'Inventory Flow',
    description: 'Warehouses → Transfers → Adjustments → Barcode',
    pages: [
      { url: '/inventory/warehouses', label: 'المستودعات', arabicDesc: 'إدارة المستودعات' },
      { url: '/inventory/warehouses/transfers', label: 'تحويل المخزون', arabicDesc: 'تحويل المواد بين المستودعات' },
      { url: '/inventory/warehouses/adjustments', label: 'تسوية المخزون', arabicDesc: 'تعديل أرصدة المخزون' },
      { url: '/inventory/warehouses/barcode', label: 'الباركود', arabicDesc: 'مسح وطباعة الباركود' },
    ]
  },
  {
    name: 'Finance Flow',
    description: 'Accounts → Journal Entries → Bank Transactions → Reports',
    pages: [
      { url: '/accounting', label: 'دليل الحسابات', arabicDesc: 'شجرة الحسابات المحاسبية' },
      { url: '/accounting/journals', label: 'القيود اليومية', arabicDesc: 'تسجيل القيود المحاسبية' },
      { url: '/accounting/financial-ops/bank-transactions', label: 'معاملات البنك', arabicDesc: 'مطابقة معاملات البنك' },
      { url: '/accounting/reports', label: 'تقارير المحاسبة', arabicDesc: 'التقارير المالية' },
    ]
  },
  {
    name: 'Fleet & Maintenance',
    description: 'Vehicles → Fuel → Trips → Maintenance',
    pages: [
      { url: '/fleet/vehicles', label: 'المركبات', arabicDesc: 'إدارة أسطول المركبات' },
      { url: '/fleet/fuel', label: 'الوقود', arabicDesc: 'تتبع استهلاك الوقود' },
      { url: '/fleet/trips', label: 'الرحلات', arabicDesc: 'تسجيل رحلات التوصيل' },
      { url: '/inventory/manufacturing/maintenance', label: 'مركز الصيانة', arabicDesc: 'إدارة صيانة المعدات' },
    ]
  },
  {
    name: 'HR & Documents',
    description: 'Employees → Attendance → Payroll → Documents',
    pages: [
      { url: '/hr', label: 'ملفات الموظفين', arabicDesc: 'إدارة بيانات الموظفين' },
      { url: '/hr/attendance', label: 'الحضور', arabicDesc: 'تسجيل الحضور والانصراف' },
      { url: '/hr/payroll', label: 'الرواتب', arabicDesc: 'مسير الرواتب' },
      { url: '/accounting/documents', label: 'الوثائق', arabicDesc: 'إدارة الوثائق والتراخيص' },
    ]
  },
  {
    name: 'Quality & Traceability',
    description: 'Quality Samples → Supplier Quality → Lot Trace → Material Trace',
    pages: [
      { url: '/inventory/manufacturing/quality', label: 'عينات الجودة', arabicDesc: 'تسجيل عينات الجودة' },
      { url: '/inventory/manufacturing/supplier-quality', label: 'جودة الموردين', arabicDesc: 'تقييم جودة الموردين' },
      { url: '/inventory/manufacturing/lot-trace', label: 'تتبع الدفعات', arabicDesc: 'تتبع دفعات الإنتاج' },
      { url: '/tasks/material', label: 'تتبع الخامة', arabicDesc: 'تتبع المواد الخام' },
    ]
  },
  {
    name: 'Dashboard Overview',
    description: 'Main Dashboard with KPIs',
    pages: [
      { url: '/', label: 'لوحة المالك', arabicDesc: 'ملخص المصنع والمؤشرات' },
    ]
  }
]

type PageData = { url: string; label: string; arabicDesc: string }

type DataFlow = {
  name: string
  description: string
  pages: PageData[]
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Human-like mouse movement with curves
async function humanMouseMove(page: Page, targetX: number, targetY: number) {
  const currentPosition = await page.mouse.position()
  const startX = currentPosition.x
  const startY = currentPosition.y

  const steps = 10
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    // Add some randomness for natural movement
    const noiseX = (Math.random() - 0.5) * 10
    const noiseY = (Math.random() - 0.5) * 10
    const x = startX + (targetX - startX) * t + noiseX
    const y = startY + (targetY - startY) * t + noiseY
    await page.mouse.move(x, y)
    await sleep(30 + Math.random() * 20)
  }
}

// Arabic text-to-speech using macOS say command
async function speakArabic(text: string) {
  try {
    const { exec } = require('child_process')
    // Use Maged voice for Arabic (common Arabic voice on macOS)
    exec(`say -v Maged "${text.replace(/"/g, '\\"')}"`, (error: any) => {
      if (error) console.log('TTS error:', error.message)
    })
  } catch (error) {
    console.log('TTS not available:', error)
  }
}

async function navigateAndRecord(page: Page, pageData: PageData) {
  const { url, label, arabicDesc } = pageData
  console.log(`Navigating to: ${label} (${url})`)

  // Speak Arabic description
  const arabicText = `الآن ننتقل إلى ${label}. ${arabicDesc}`
  await speakArabic(arabicText)

  // Find and click the navigation link with human-like movement
  try {
    const link = page.getByRole('link', { name: label }).first()
    if (await link.isVisible()) {
      const box = await link.boundingBox()
      if (box) {
        await humanMouseMove(page, box.x + box.width / 2, box.y + box.height / 2)
        await sleep(200)
        await link.click()
      }
    } else {
      // Fallback to direct navigation
      await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle' })
    }
  } catch {
    // Fallback to direct navigation
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle' })
  }

  await sleep(4000) // Wait for page to fully render and TTS to complete
}

async function recordDataFlow(browser: Browser, flow: DataFlow, index: number, loginContext: BrowserContext | null) {
  const context = await browser.newContext({
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 1920, height: 1080 }
    },
    viewport: { width: 1920, height: 1080 }
  })

  const page = await context.newPage()

  try {
    console.log(`\n=== Recording Flow ${index + 1}: ${flow.name} ===`)
    console.log(`Description: ${flow.description}`)

    // Login first
    console.log('Logging in...')
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
    await sleep(1000)

    // Check if demo mode button exists and click it
    const demoButton = await page.getByText('دخول تجريبي ببيانات وهمية').first()
    if (await demoButton.isVisible()) {
      await demoButton.click()
      console.log('Clicked demo login button')
    } else {
      // Fallback to manual login
      await page.fill('input[type="email"]', 'admin@factory.local')
      await page.fill('input[type="password"]', 'Admin123!')
      await page.click('button[type="submit"]')
      console.log('Submitted manual login')
    }

    // Wait for navigation to complete
    await sleep(3000)
    console.log('Login completed')

    // Start with dashboard
    await navigateAndRecord(page, { url: '/', label: 'لوحة المالك', arabicDesc: 'ملخص المصنع والمؤشرات' })
    await sleep(1000)

    // Navigate through each page in the flow
    for (const pageData of flow.pages) {
      await navigateAndRecord(page, pageData)
      await sleep(1500) // Extra time to view the page
    }

    // Return to dashboard
    await navigateAndRecord(page, { url: '/', label: 'لوحة المالك', arabicDesc: 'ملخص المصنع والمؤشرات' })
    await sleep(1000)

  } catch (error) {
    console.error(`Error recording flow ${flow.name}:`, error)
  } finally {
    await context.close()
    console.log(`✓ Completed recording: ${flow.name}`)
  }
}

async function main() {
  console.log('Starting ERP Data Flow Recording')
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Video output directory: ${VIDEO_DIR}\n`)

  const browser = await chromium.launch({
    headless: false, // Run in visible mode for verification
    slowMo: 500 // Slow down actions for better visibility
  })

  try {
    for (let i = 0; i < dataFlows.length; i++) {
      await recordDataFlow(browser, dataFlows[i], i, null)
      await sleep(2000) // Brief pause between flows
    }

    console.log('\n=== All recordings completed ===')
    console.log(`Videos saved to: ${VIDEO_DIR}`)

  } finally {
    await browser.close()
  }
}

main().catch(console.error)
