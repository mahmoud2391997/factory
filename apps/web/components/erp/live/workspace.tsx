'use client'

import Link from 'next/link'

import { FactoryScreens } from './screens-factory'
import { InventoryScreens, ProductionScreens, PurchasingScreens, SalesScreens } from './screens-ops'
import { DashboardScreen, OfficeScreens } from './screens-office'
import type { LiveCtx } from './ctx'

export function LiveWorkspace({
  entityKey,
  title,
  description,
  crumbs,
  ctx,
}: {
  entityKey: string
  title: string
  description: string
  crumbs: Array<{ href: string; label: string }>
  ctx: LiveCtx
}) {
  const body =
    entityKey === 'dashboard' ? (
      <DashboardScreen ctx={ctx} />
    ) : (
      FactoryScreens({ entityKey, ctx }) ||
      InventoryScreens({ entityKey, ctx }) ||
      PurchasingScreens({ entityKey, ctx }) ||
      ProductionScreens({ entityKey, ctx }) ||
      SalesScreens({ entityKey, ctx }) ||
      OfficeScreens({ entityKey, ctx })
    )

  return (
    <div className="space-y-4">
      <nav aria-label="مسار الصفحة" className="text-sm text-[#7c8c86]">
        <ol className="flex flex-wrap items-center gap-2">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1
            return (
              <li key={`${crumb.href}-${index}`} className="flex items-center gap-2">
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                {last ? (
                  <span className="font-semibold text-[#1d7f72]" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  <Link href={crumb.href} className="hover:text-[#123c35] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d7f72]">
                    {crumb.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      {entityKey !== 'dashboard' ? (
        <div>
          <h2 className="text-3xl font-bold">{title}</h2>
          {description ? <p className="mt-2 text-[#788983]">{description}</p> : null}
        </div>
      ) : null}
      {body ?? <div className="rounded-2xl bg-white p-6 text-sm text-[#53655e]">هذه الشاشة غير مربوطة بعد.</div>}
    </div>
  )
}
