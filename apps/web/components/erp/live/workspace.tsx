'use client'

import { InventoryScreens, ProductionScreens, PurchasingScreens, SalesScreens } from './screens-ops'
import { DashboardScreen, OfficeScreens } from './screens-office'
import type { LiveCtx } from './ctx'

export function LiveWorkspace({
  entityKey,
  mainLabel,
  title,
  description,
  ctx,
}: {
  entityKey: string
  mainLabel: string
  title: string
  description: string
  ctx: LiveCtx
}) {
  const body =
    entityKey === 'dashboard' ? (
      <DashboardScreen ctx={ctx} />
    ) : (
      InventoryScreens({ entityKey, ctx }) ||
      PurchasingScreens({ entityKey, ctx }) ||
      ProductionScreens({ entityKey, ctx }) ||
      SalesScreens({ entityKey, ctx }) ||
      OfficeScreens({ entityKey, ctx })
    )

  return (
    <div className="space-y-4">
      {entityKey !== 'dashboard' ? (
        <div>
          <div className="mb-2 text-sm text-[#7c8c86]">
            {mainLabel} / <span className="text-[#1d7f72]">{title}</span>
          </div>
          <h2 className="text-3xl font-bold">{title}</h2>
          {description ? <p className="mt-2 text-[#788983]">{description}</p> : null}
        </div>
      ) : null}
      {body ?? <div className="rounded-2xl bg-white p-6 text-sm text-[#53655e]">هذه الشاشة غير مربوطة بعد.</div>}
    </div>
  )
}
