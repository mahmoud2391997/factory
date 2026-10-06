'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-provider'
import { mobileText } from '@/lib/i18n/mobile'
import { Dialog } from '@/components/erp/live/bits'

interface InstallEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstall() {
  const { language } = useLanguage()
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [help, setHelp] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone
    setVisible(!standalone)
    const capture = (event: Event) => { event.preventDefault(); setInstallEvent(event as InstallEvent) }
    const installed = () => { setVisible(false); setHelp(false); setInstallEvent(null) }
    window.addEventListener('beforeinstallprompt', capture)
    window.addEventListener('appinstalled', installed)
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator && window.isSecureContext) {
      navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(error => console.error('[pwa] Registration failed', error))
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', capture)
      window.removeEventListener('appinstalled', installed)
    }
  }, [])

  async function install() {
    if (!installEvent) { setHelp(true); return }
    setPending(true)
    try {
      await installEvent.prompt()
      const choice = await installEvent.userChoice
      if (choice.outcome === 'accepted') setVisible(false)
    } catch { setHelp(true) }
    finally { setInstallEvent(null); setPending(false) }
  }

  return <>
    {visible && <button type="button" disabled={pending} onClick={() => void install()} className="fixed bottom-4 end-4 z-40 inline-flex min-h-11 items-center gap-2 rounded-xl border border-indigo-300 bg-indigo-700 px-4 text-sm font-semibold text-white shadow-lg hover:bg-indigo-800 disabled:opacity-50"><Download size={18}/>{mobileText(language, 'install')}</button>}
    {help && <Dialog title={mobileText(language, 'install')} onClose={() => setHelp(false)}><p className="text-sm leading-7 text-slate-700 dark:text-slate-200">{mobileText(language, 'installHelp')}</p></Dialog>}
  </>
}
