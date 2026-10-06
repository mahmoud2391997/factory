'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Square } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-provider'
import { mobileText } from '@/lib/i18n/mobile'

export function BarcodeCamera({ onScan, disabled }: { onScan: (code: string) => Promise<void>; disabled?: boolean }) {
  const { language } = useLanguage()
  const t = (key: Parameters<typeof mobileText>[1]) => mobileText(language, key)
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const controls = useRef<{ stop(): void } | null>(null)
  const generation = useRef(0)
  const [phase, setPhase] = useState<'idle' | 'starting' | 'scanning'>('idle')
  const [error, setError] = useState('')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [deviceId, setDeviceId] = useState('')

  function dispose() {
    generation.current += 1
    controls.current?.stop()
    controls.current = null
    stream.current?.getTracks().forEach(track => track.stop())
    stream.current = null
    if (video.current) video.current.srcObject = null
  }

  function stop() { dispose(); setPhase('idle') }

  useEffect(() => {
    const pause = () => { if (document.hidden) stop() }
    document.addEventListener('visibilitychange', pause)
    window.addEventListener('pagehide', stop)
    return () => {
      document.removeEventListener('visibilitychange', pause)
      window.removeEventListener('pagehide', stop)
      dispose()
    }
  }, [])

  async function start(cameraId = '') {
    dispose()
    setError('')
    if (!window.isSecureContext) { setPhase('idle'); setError(t('secure')); return }
    if (!navigator.mediaDevices?.getUserMedia) { setPhase('idle'); setError(t('unsupported')); return }
    const token = generation.current
    setPhase('starting')
    try {
      const readerModule = await import('@zxing/browser')
      if (token !== generation.current) return
      const acquired = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: cameraId ? { deviceId: { exact: cameraId } } : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      if (token !== generation.current) { acquired.getTracks().forEach(track => track.stop()); return }
      stream.current = acquired
      const preview = video.current
      if (!preview) { stop(); return }
      setDeviceId(acquired.getVideoTracks()[0]?.getSettings().deviceId ?? '')
      navigator.mediaDevices.enumerateDevices().then(items => {
        if (token === generation.current) setDevices(items.filter(item => item.kind === 'videoinput'))
      }).catch(() => {})
      const reader = new readerModule.BrowserMultiFormatReader(undefined, { delayBetweenScanAttempts: 200 })
      const scanner = await reader.decodeFromStream(acquired, preview, (result, _error, scannerControls) => {
        if (!result || token !== generation.current) return
        const code = result.getText().trim()
        if (!code) return
        scannerControls.stop()
        stop()
        void onScan(code).catch(() => setError(t('failed')))
      })
      if (token !== generation.current) { scanner.stop(); return }
      controls.current = scanner
      setPhase('scanning')
    } catch (cause) {
      if (token !== generation.current) return
      stop()
      const name = cause instanceof Error ? cause.name : ''
      setError(t(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : name === 'NotFoundError' ? 'missing' : name === 'NotReadableError' ? 'busy' : 'failed'))
    }
  }

  return <div className="mt-4 space-y-3">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={disabled || phase !== 'idle'} onClick={() => void start(deviceId)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50"><Camera size={18}/>{phase === 'starting' ? t('starting') : t('camera')}</button>
      {phase !== 'idle' && <button type="button" onClick={stop} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm dark:border-slate-600"><Square size={16}/>{t('stop')}</button>}
    </div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{error}</p>}
    <div hidden={phase === 'idle'} className="space-y-3">
      <div className="relative mx-auto max-w-xl overflow-hidden rounded-xl bg-black">
        <video ref={video} aria-label={t('camera')} muted autoPlay playsInline className="aspect-[4/3] w-full object-contain"/>
        <div aria-hidden className="pointer-events-none absolute inset-x-[10%] top-[30%] h-[40%] rounded-lg border-2 border-indigo-300"/>
      </div>
      <p role="status" className="text-sm text-slate-600 dark:text-slate-300">{t('aim')}</p>
      {devices.length > 1 && <label className="block text-sm">{t('selectCamera')}<select value={deviceId} disabled={phase === 'starting'} onChange={event => void start(event.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border p-2">{devices.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `${t('cameraNumber')} ${index + 1}`}</option>)}</select></label>}
    </div>
  </div>
}
