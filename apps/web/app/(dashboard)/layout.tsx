import { ErpShell } from '@/components/erp/erp-shell'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ErpShell />
      <div className="hidden">{children}</div>
    </>
  )
}
