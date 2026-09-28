import * as fs from 'fs'

let content = fs.readFileSync('apps/web/lib/erp/domain/engine.ts', 'utf8')
if (!content.includes('createQualitySample')) {
  content = content.replace("archiveHistory: 'settings.update',", "archiveHistory: 'settings.update',\n    createQualitySample: 'qc.manage',\n    updateQualityResult: 'qc.manage',")
  fs.writeFileSync('apps/web/lib/erp/domain/engine.ts', content)
}

content = fs.readFileSync('apps/web/lib/erp/domain/seed.ts', 'utf8')
content = content.replace(
  "productionOrderId: order.id,\n      actualOutputQty: 990",
  "productionOrderId: order.id,\n      operatorId: opsUser.id,\n      actualOutputQty: 990"
)
fs.writeFileSync('apps/web/lib/erp/domain/seed.ts', content)
