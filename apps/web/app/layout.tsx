import type { Metadata, Viewport } from 'next'

import { ThemeInit } from '@/components/theme-init'
import { AuthProvider } from '@/components/providers/auth-provider'
import { LanguageProvider } from '@/lib/i18n/language-provider'
import { PwaInstall } from '@/components/pwa-install'
import './globals.css'

export const metadata: Metadata = {
  title: 'مصنع الخليج للأعلاف | نظام إدارة المصنع',
  description: 'منصة إدارة متكاملة لمصنع الأعلاف والعمليات الصناعية في سلطنة عمان',
  manifest: '/manifest.webmanifest',
  applicationName: 'مصنع الخليج للأعلاف',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'أعلاف الخليج' },
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
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
