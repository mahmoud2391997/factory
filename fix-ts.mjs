import * as fs from 'fs'

function patch(path, pattern, replacement) {
  let content = fs.readFileSync(path, 'utf8')
  content = content.replace(pattern, replacement)
  fs.writeFileSync(path, content)
}

function patchRegex(path, pattern, replacement) {
  let content = fs.readFileSync(path, 'utf8')
  content = content.replace(pattern, replacement)
  fs.writeFileSync(path, content)
}

// 1. engine.ts
patch('apps/web/lib/erp/domain/engine.ts',
  "archiveHistory: 'أرشفة السجلات',",
  "archiveHistory: 'أرشفة السجلات',\n    createQualitySample: 'تسجيل فحص جودة',\n    updateQualityResult: 'تحديث نتيجة فحص الجودة',"
)

// 2. seed.ts
patchRegex('apps/web/lib/erp/domain/seed.ts',
  /productionOrders: \[\]/g,
  "productionOrders: [],\n    lots: [],\n    qualitySamples: []"
)

patchRegex('apps/web/lib/erp/domain/seed.ts',
  /actualOutputQty: 990,/g,
  "actualOutputQty: 990,\n      operatorId: 'user-ops',"
)

// 3. engine.test.ts
patchRegex('apps/web/lib/erp/domain/engine.test.ts',
  /action: 'completeProduction',\n\s*input: {/g,
  "action: 'completeProduction',\n      input: {\n        operatorId: 'operator-1',"
)
patchRegex('apps/web/lib/erp/domain/engine.test.ts',
  /action: 'completeProduction', input: {/g,
  "action: 'completeProduction', input: { operatorId: 'operator-1', "
)


// 4. plan-acceptance.test.ts
patchRegex('apps/web/lib/erp/domain/plan-acceptance.test.ts',
  /action: 'completeProduction',\n\s*input: {/g,
  "action: 'completeProduction',\n        input: {\n          operatorId: 'operator-1',"
)
patchRegex('apps/web/lib/erp/domain/plan-acceptance.test.ts',
  /action: 'completeProduction', input: {/g,
  "action: 'completeProduction', input: { operatorId: 'operator-1', "
)

