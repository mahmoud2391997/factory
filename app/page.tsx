'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Boxes,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Factory,
  FileText,
  LayoutDashboard,
  Menu,
  PackageCheck,
  Search,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
  X,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const navItems = [
  { label: 'لوحة التحكم', icon: LayoutDashboard, active: true },
  { label: 'المواد الخام', icon: Boxes },
  { label: 'المستودعات', icon: Warehouse },
  { label: 'التصنيع', icon: Factory },
  { label: 'المنتجات', icon: PackageCheck },
  { label: 'المبيعات', icon: ShoppingCart },
  { label: 'العملاء والموردين', icon: Truck },
  { label: 'الحسابات', icon: FileText },
  { label: 'الموظفين', icon: Users },
  { label: 'الحضور والانصراف', icon: CalendarDays },
  { label: 'الإضافي', icon: Clock3 },
  { label: 'المهام', icon: ClipboardCheck },
  { label: 'التقارير', icon: BarChart3 },
]

const productionData = [
  { name: 'السبت', production: 18, sales: 14 },
  { name: 'الأحد', production: 25, sales: 18 },
  { name: 'الإثنين', production: 21, sales: 20 },
  { name: 'الثلاثاء', production: 32, sales: 25 },
  { name: 'الأربعاء', production: 28, sales: 22 },
  { name: 'الخميس', production: 38, sales: 30 },
  { name: 'الجمعة', production: 35, sales: 27 },
]

const stockData = [
  { name: 'ذرة صفراء', value: 42, color: '#1d7f72' },
  { name: 'كسب صويا', value: 28, color: '#c79546' },
  { name: 'نخالة قمح', value: 18, color: '#7d9b61' },
  { name: 'إضافات', value: 12, color: '#d8b878' },
]

const movements = [
  { id: 'MOV-2481', type: 'إنتاج مكتمل', detail: 'علف تسمين مواشي - دفعة #PR-1048', amount: '+ 12,500 كجم', time: 'منذ 18 دقيقة', tone: 'success' },
  { id: 'MOV-2480', type: 'صرف مواد خام', detail: 'ذرة صفراء - أمر إنتاج #PR-1048', amount: '- 8,200 كجم', time: 'منذ 42 دقيقة', tone: 'warning' },
  { id: 'MOV-2479', type: 'فاتورة مبيعات', detail: 'شركة الخليج للأعلاف', amount: '- 4,500 كجم', time: 'منذ ساعة', tone: 'info' },
  { id: 'MOV-2478', type: 'استلام مواد', detail: 'كسب صويا - شركة المطاحن العمانية', amount: '+ 25,000 كجم', time: 'اليوم، 08:40', tone: 'success' },
]

function formatOMR(value: number) {
  return new Intl.NumberFormat('ar-OM', { style: 'currency', currency: 'OMR', maximumFractionDigits: 0 }).format(value)
}

export default function Page() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [period, setPeriod] = useState('هذا الأسبوع')
  const [activeNav, setActiveNav] = useState('لوحة التحكم')
  const [search, setSearch] = useState('')

  const visibleMovements = useMemo(() => {
    if (!search.trim()) return movements
    return movements.filter((movement) => `${movement.type} ${movement.detail}`.includes(search.trim()))
  }, [search])

  return (
    <main dir="rtl" className="min-h-screen bg-[#f6f8f7] text-[#152925]">
      <aside className={`fixed inset-y-0 right-0 z-40 flex w-[264px] flex-col border-l border-[#dfe7e3] bg-[#123c35] text-white transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex h-[82px] items-center gap-3 border-b border-white/10 px-6">
          <div className="grid size-10 place-items-center rounded-xl bg-[#d6ad61] text-[#123c35] shadow-lg shadow-black/10"><Factory size={22} strokeWidth={2.4} /></div>
          <div>
            <div className="text-lg font-bold tracking-tight">مزارع الخليج</div>
            <div className="text-[11px] text-white/55">نظام إدارة المصنع</div>
          </div>
          <button aria-label="إغلاق القائمة" className="mr-auto rounded-lg p-1 text-white/70 hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(false)}><X size={19} /></button>
        </div>
        <div className="px-4 pt-6">
          <div className="mb-3 px-3 text-[10px] font-semibold tracking-[0.18em] text-white/35">القائمة الرئيسية</div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = activeNav === item.label
              return <button key={item.label} onClick={() => { setActiveNav(item.label); setMobileOpen(false) }} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-right text-[13px] transition ${active ? 'bg-[#d6ad61] font-bold text-[#123c35] shadow-md shadow-black/10' : 'text-white/70 hover:bg-white/8 hover:text-white'}`}><Icon size={18} strokeWidth={active ? 2.4 : 1.8} /><span>{item.label}</span>{item.label === 'الإشعارات' && <span className="mr-auto grid size-5 place-items-center rounded-full bg-[#d96c52] text-[10px] text-white">4</span>}</button>
            })}
          </nav>
        </div>
        <div className="mt-auto border-t border-white/10 p-4">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-right text-[13px] text-white/70 hover:bg-white/8 hover:text-white"><Settings size={18} /><span>الإعدادات</span></button>
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/8 p-3">
            <div className="grid size-9 place-items-center rounded-full bg-[#d6ad61] text-sm font-bold text-[#123c35]">م</div>
            <div className="min-w-0"><div className="truncate text-xs font-semibold">محمد البلوشي</div><div className="text-[10px] text-white/45">مدير النظام</div></div>
            <ChevronDown size={16} className="mr-auto text-white/45" />
          </div>
        </div>
      </aside>

      <div className="lg:mr-[264px]">
        <header className="sticky top-0 z-30 flex h-[82px] items-center gap-4 border-b border-[#e1e9e5] bg-[#f6f8f7]/95 px-5 backdrop-blur md:px-8">
          <button aria-label="فتح القائمة" className="rounded-xl border border-[#dfe7e3] bg-white p-2.5 lg:hidden" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <div className="hidden text-right sm:block"><div className="text-[11px] text-[#71817c]">الخميس، ١٩ سبتمبر ٢٠٢٦</div><h1 className="mt-1 text-xl font-bold">صباح الخير، محمد</h1></div>
          <div className="relative mr-auto w-full max-w-[310px]"><Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa9a3]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث سريع في النظام..." className="h-10 w-full rounded-xl border border-[#dfe7e3] bg-white pr-10 pl-4 text-xs outline-none transition placeholder:text-[#a2aea9] focus:border-[#1d7f72] focus:ring-2 focus:ring-[#1d7f72]/10" /></div>
          <button aria-label="الإشعارات" className="relative rounded-xl border border-[#dfe7e3] bg-white p-2.5 text-[#71817c] hover:text-[#123c35]"><Bell size={18} /><span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#d96c52] text-[9px] text-white">4</span></button>
        </header>

        <div className="mx-auto max-w-[1480px] px-5 py-7 md:px-8 lg:px-10">
          <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div><div className="mb-2 flex items-center gap-2 text-xs text-[#7c8c86]"><span>الرئيسية</span><span>/</span><span className="text-[#1d7f72]">لوحة التحكم</span></div><h2 className="text-2xl font-bold tracking-tight">نظرة عامة على المصنع</h2><p className="mt-1 text-sm text-[#788983]">تابع أداء العمليات والمخزون والمبيعات من مكان واحد.</p></div>
            <div className="flex items-center gap-2"><button className="flex items-center gap-2 rounded-xl border border-[#dfe7e3] bg-white px-3.5 py-2.5 text-xs font-medium text-[#53655e] shadow-sm"><CalendarDays size={15} /> ١٢ - ١٩ سبتمبر ٢٠٢٦</button><button className="rounded-xl bg-[#123c35] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#1d594d]">تقرير سريع</button></div>
          </div>

          <div className="mb-7 grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
            <MetricCard label="قيمة المخزون الحالي" value={formatOMR(184620)} change="+8.4%" detail="مقارنة بالشهر الماضي" icon={Warehouse} tone="teal" />
            <MetricCard label="إنتاج اليوم" value="١٢,٥٠٠ كجم" change="+12.5%" detail="من أصل ١٥,٠٠٠ كجم مخطط" icon={Factory} tone="gold" />
            <MetricCard label="مبيعات الشهر" value={formatOMR(42680)} change="+16.2%" detail="من ٣٨ فاتورة مبيعات" icon={ShoppingCart} tone="blue" />
            <MetricCard label="المبالغ المستحقة" value={formatOMR(12840)} change="٣ فواتير" detail="تحتاج إلى متابعة" icon={AlertTriangle} tone="red" negative />
          </div>

          <div className="mb-7 grid gap-5 xl:grid-cols-[1.65fr_1fr]">
            <section className="rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_4px_22px_rgba(31,65,53,0.04)]"><div className="mb-6 flex items-start justify-between"><div><h3 className="font-bold">الإنتاج والمبيعات</h3><p className="mt-1 text-xs text-[#899892]">متابعة الأداء خلال الأسبوع الحالي</p></div><select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-lg border border-[#e1e9e5] bg-[#fafcfb] px-3 py-2 text-xs text-[#53655e] outline-none"><option>هذا الأسبوع</option><option>هذا الشهر</option><option>هذا العام</option></select></div><div className="mb-4 flex items-center gap-5 text-xs text-[#71817c]"><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-[#1d7f72]" /> الإنتاج (طن)</span><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-[#d6ad61]" /> المبيعات (طن)</span></div><div className="h-[235px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={productionData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}><defs><linearGradient id="productionFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1d7f72" stopOpacity={0.24} /><stop offset="100%" stopColor="#1d7f72" stopOpacity={0} /></linearGradient><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d6ad61" stopOpacity={0.2} /><stop offset="100%" stopColor="#d6ad61" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf2ef" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9aa9a3', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#9aa9a3', fontSize: 11 }} /><Tooltip contentStyle={{ border: '1px solid #e1e9e5', borderRadius: 10, fontSize: 11, direction: 'rtl' }} /><Area type="monotone" dataKey="production" stroke="#1d7f72" strokeWidth={2.5} fill="url(#productionFill)" /><Area type="monotone" dataKey="sales" stroke="#d6ad61" strokeWidth={2.5} fill="url(#salesFill)" /></AreaChart></ResponsiveContainer></div></section>
            <section className="rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_4px_22px_rgba(31,65,53,0.04)]"><div className="mb-2"><h3 className="font-bold">توزيع المخزون</h3><p className="mt-1 text-xs text-[#899892]">حسب المواد الخام والقيمة الإجمالية</p></div><div className="relative h-[190px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stockData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={56} outerRadius={82} paddingAngle={4} strokeWidth={0}>{stockData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip contentStyle={{ border: '1px solid #e1e9e5', borderRadius: 10, fontSize: 11, direction: 'rtl' }} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="text-center"><div className="text-2xl font-bold">١٨٤.٦k</div><div className="text-[10px] text-[#899892]">ريال عماني</div></div></div></div><div className="grid grid-cols-2 gap-x-4 gap-y-2">{stockData.map((item) => <div key={item.name} className="flex items-center gap-2 text-[11px] text-[#71817c]"><i className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}<span className="mr-auto font-semibold text-[#30453d]">{item.value}%</span></div>)}</div></section>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <section className="rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_4px_22px_rgba(31,65,53,0.04)]"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-bold">آخر حركات المخزون</h3><p className="mt-1 text-xs text-[#899892]">كل العمليات المسجلة في المستودعات</p></div><button className="text-xs font-semibold text-[#1d7f72] hover:underline">عرض الكل</button></div><div className="overflow-x-auto"><table className="w-full min-w-[570px] text-right"><thead><tr className="border-b border-[#edf2ef] text-[11px] text-[#97a49f]"><th className="pb-3 font-medium">رقم الحركة</th><th className="pb-3 font-medium">نوع العملية</th><th className="pb-3 font-medium">التفاصيل</th><th className="pb-3 font-medium">الكمية</th><th className="pb-3 font-medium">الوقت</th></tr></thead><tbody>{visibleMovements.map((movement) => <tr key={movement.id} className="border-b border-[#f0f4f2] last:border-0"><td className="py-3 text-[11px] font-semibold text-[#50635b]">{movement.id}</td><td className="py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${movement.tone === 'success' ? 'bg-[#e6f4ef] text-[#19725f]' : movement.tone === 'warning' ? 'bg-[#fff4dd] text-[#9b6b1f]' : 'bg-[#e8f1f8] text-[#32729a]'}`}>{movement.type}</span></td><td className="py-3 text-xs text-[#53655e]">{movement.detail}</td><td className={`py-3 text-xs font-bold ${movement.amount.startsWith('+') ? 'text-[#19725f]' : 'text-[#ad5e46]'}`}>{movement.amount}</td><td className="py-3 text-[10px] text-[#a0ada7]">{movement.time}</td></tr>)}</tbody></table></div></section>
            <section className="rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_4px_22px_rgba(31,65,53,0.04)]"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-bold">تنبيهات تحتاج انتباهك</h3><p className="mt-1 text-xs text-[#899892]">معلومات مهمة من عمليات اليوم</p></div><button className="grid size-8 place-items-center rounded-lg bg-[#f5f8f6] text-[#75857f]"><Bell size={15} /></button></div><div className="flex flex-col gap-3"><AlertItem icon={AlertTriangle} title="مخزون منخفض" text="مادة كسب الصويا وصلت إلى الحد الأدنى" tone="red" /><AlertItem icon={ClipboardCheck} title="أمر إنتاج مكتمل" text="PR-1048 جاهز للمراجعة والإغلاق" tone="teal" /><AlertItem icon={Clock3} title="موافقة مطلوبة" text="ساعات إضافية لـ ٣ موظفين" tone="gold" /></div><button className="mt-5 w-full rounded-xl border border-[#dfe7e3] py-2.5 text-xs font-semibold text-[#53655e] hover:bg-[#f8faf9]">عرض كل التنبيهات</button></section>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4"><MiniStat label="المواد الخام" value="٢٤" suffix="صنف" icon={Boxes} /><MiniStat label="المنتجات الجاهزة" value="١٢" suffix="منتج" icon={PackageCheck} /><MiniStat label="حضور اليوم" value="٩٢٪" suffix="من ٤٨ موظف" icon={Users} /><MiniStat label="المهام المتأخرة" value="٠٧" suffix="مهمة" icon={ClipboardCheck} /></div>
        </div>
      </div>
    </main>
  )
}

function MetricCard({ label, value, change, detail, icon: Icon, tone, negative = false }: { label: string; value: string; change: string; detail: string; icon: typeof Warehouse; tone: 'teal' | 'gold' | 'blue' | 'red'; negative?: boolean }) {
  const tones = { teal: 'bg-[#e4f3ef] text-[#19725f]', gold: 'bg-[#fff4dd] text-[#9b6b1f]', blue: 'bg-[#e8f1f8] text-[#32729a]', red: 'bg-[#fbeae6] text-[#b55e49]' }
  return <div className="rounded-2xl border border-[#e1e9e5] bg-white p-4 shadow-[0_4px_22px_rgba(31,65,53,0.04)] md:p-5"><div className="mb-4 flex items-start justify-between"><div className={`grid size-10 place-items-center rounded-xl ${tones[tone]}`}><Icon size={19} /></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${negative ? 'bg-[#fbeae6] text-[#b55e49]' : 'bg-[#e7f4ef] text-[#19725f]'}`}>{negative ? '' : '↑ '}{change}</span></div><div className="text-[11px] text-[#899892]">{label}</div><div className="mt-1 text-lg font-bold tracking-tight text-[#1d332c] md:text-xl">{value}</div><div className="mt-2 truncate text-[10px] text-[#a0ada7]">{detail}</div></div>
}

function AlertItem({ icon: Icon, title, text, tone }: { icon: typeof AlertTriangle; title: string; text: string; tone: 'red' | 'teal' | 'gold' }) {
  const styles = { red: 'bg-[#fbeae6] text-[#b55e49]', teal: 'bg-[#e4f3ef] text-[#19725f]', gold: 'bg-[#fff4dd] text-[#9b6b1f]' }
  return <div className="flex items-center gap-3 rounded-xl bg-[#fafcfb] p-3"><div className={`grid size-9 shrink-0 place-items-center rounded-lg ${styles[tone]}`}><Icon size={17} /></div><div className="min-w-0"><div className="text-xs font-bold text-[#30453d]">{title}</div><div className="mt-1 truncate text-[10px] text-[#899892]">{text}</div></div><ChevronDown size={14} className="mr-auto shrink-0 -rotate-90 text-[#aeb9b4]" /></div>
}

function MiniStat({ label, value, suffix, icon: Icon }: { label: string; value: string; suffix: string; icon: typeof Boxes }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-[#e1e9e5] bg-white p-4 shadow-[0_4px_22px_rgba(31,65,53,0.03)]"><div className="hidden size-9 place-items-center rounded-xl bg-[#edf5f2] text-[#1d7f72] sm:grid"><Icon size={17} /></div><div><div className="text-[10px] text-[#899892]">{label}</div><div className="mt-1 text-lg font-bold">{value} <span className="text-[10px] font-normal text-[#9aa9a3]">{suffix}</span></div></div></div>
}
