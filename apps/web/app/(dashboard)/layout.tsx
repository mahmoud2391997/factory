import { Suspense } from 'react'
import { ErpShell } from '@/components/erp/erp-shell'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <ErpShell />
      </Suspense>
      <div className="hidden">{children}</div>
    </>
  )
}
