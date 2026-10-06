import type { Metadata, Viewport } from 'next'

import { ThemeInit } from '@/components/theme-init'
import { AuthProvider } from '@/components/providers/auth-provider'
import { LanguageProvider } from '@/lib/i18n/language-provider'
import { PwaInstall } from '@/components/pwa-install'
import './globals.css'

export const metadata: Metadata = {
  title: 'أعلاف الكوثر بحار الجوبه | نظام إدارة المصنع',
  description: 'منصة إدارة متكاملة لمصنع الأعلاف والعمليات الصناعية في سلطنة عمان',
  manifest: '/manifest.webmanifest',
  applicationName: 'أعلاف الكوثر بحار الجوبه',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'أعلاف الكوثر' },
  generator: 'v0.app',
  icons: {
    icon: '/al-kawther-logo-transparent.png',
    apple: '/al-kawther-logo-transparent.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeInit />
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
          <PwaInstall />
        </LanguageProvider>
      </body>
    </html>
  )
}
