export default function Page() {
  return (
    <main className="space-y-4">
      <div className="rounded-lg border border-[#d0d7de] bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">مرحباً</h1>
        <p className="mt-2 text-sm text-[#656d76]">هذا النظام مستقل عن الـ ERP لإدارة الفرق وتوزيع المهام.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card title="الموظفون" href="/employees" desc="سجل الموظفين داخل نظام الفرق والمهام." />
        <Card title="الأعضاء" href="/members" desc="إدارة أعضاء الفريق والدعوات والأدوار." />
        <Card title="المهام" href="/tasks" desc="إنشاء المهام وتوزيعها وتتبعها (Kanban)." />
      </div>
    </main>
  )
}

function Card({ title, href, desc }: { title: string; href: string; desc: string }) {
  return (
    <a href={href} className="block rounded-lg border border-[#d0d7de] bg-white p-5 shadow-sm hover:bg-[#f6f8fa]">
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-2 text-sm text-[#656d76]">{desc}</div>
    </a>
  )
}

