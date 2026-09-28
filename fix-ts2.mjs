import * as fs from 'fs'

let content = fs.readFileSync('apps/web/lib/erp/domain/engine.ts', 'utf8')
if (!content.includes('createQualitySample')) {
  content = content.replace("archiveHistory: 'أرشفة السجلات',", "archiveHistory: 'أرشفة السجلات',\n    createQualitySample: 'تسجيل فحص جودة',\n    updateQualityResult: 'تحديث نتيجة فحص الجودة',")
  fs.writeFileSync('apps/web/lib/erp/domain/engine.ts', content)
}

content = fs.readFileSync('apps/web/lib/erp/domain/seed.ts', 'utf8')
content = content.replace(
  "input: {\n      productionOrderId: order.id,",
  "input: {\n      operatorId: opsUser.id,\n      productionOrderId: order.id,"
)
fs.writeFileSync('apps/web/lib/erp/domain/seed.ts', content)
