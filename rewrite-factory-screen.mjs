import * as fs from 'fs'

let path = 'apps/web/components/erp/live/screens-factory.tsx'
let content = fs.readFileSync(path, 'utf8')

const match = content.match(/if \(entityKey === 'productionLot'\) \{[\s\S]*?return \(\n\s*<div className="space-y-4">[\s\S]*?<\/div>\n\s*\)\n\s*\}/)

if (match) {
  let newBlock = `if (entityKey === 'productionLot') {
    const lots = (ctx.state.lots || []).map((lot) => {
      const productName = ctx.state.products.find(p => p.id === lot.productId)?.nameAr || lot.productId
      const marginTon = (lot.marginPerTon ?? ((lot.salePricePerTon ?? 0) - lot.costPerTon))
      return [
        lot.lotNo,
        ctx.state.productionOrders.find(o => o.id === lot.productionOrderId)?.number || lot.productionOrderId,
        productName,
        \`\${tonsFmt(lot.inputKg)} / \${tonsFmt(lot.actualOutputKg)}\`,
        \`\${tonsFmt(lot.wasteKg)}\`,
        \`\${tonsFmt(lot.varianceKg)} (\${pctFmt(lot.variancePct)})\`,
        moneyFmt(lot.costPerTon),
        moneyFmt(lot.salePricePerTon ?? 0),
        moneyFmt(marginTon),
      ]
    })
    return (
      <div className="space-y-4">
        {note}
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="دفعات الإنتاج المكتملة" value={String(lots.length)} />
          <Metric label="الهدر المسجل" value={\`\${tonsFmt((ctx.state.lots || []).reduce((sum, lot) => sum + lot.wasteKg, 0))} كجم\`} />
          <Metric label="تنبيه الجودة" value="تتبع كامل" hint="الخام، المورد، العامل، والعميل مرتبطون بالدفعة" />
        </div>
        <Card title="تتبع دفعات الإنتاج" hint="من المواد الخام الداخلة حتى الناتج والهدر والتكلفة والهامش.">
          <DataTable columns={['رقم الدفعة', 'أمر الإنتاج', 'المنتج', 'الداخل / الناتج', 'الهدر', 'الفارق', 'تكلفة/طن', 'بيع/طن', 'الهامش/طن']} rows={lots} />
        </Card>
      </div>
    )
  }`
  content = content.replace(match[0], newBlock)
  fs.writeFileSync(path, content)
}

