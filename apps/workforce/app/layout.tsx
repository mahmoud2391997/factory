import type { ReactNode } from 'react'

import './globals.css'

export const metadata = {
  title: 'Workforce',
  description: 'Teams and tasks management (separate from ERP).',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="mx-auto max-w-6xl p-6">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#d0d7de] bg-white p-4 shadow-sm">
            <div className="text-lg font-semibold">نظام الفرق والمهام</div>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/">الرئيسية</a>
              <a href="/dashboard">لوحة التحكم</a>
              <a href="/auth/login">دخول</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}

