import * as fs from 'fs'

let content = fs.readFileSync('apps/web/lib/erp/domain/seed.ts', 'utf8')
content = content.replace(
  "operatorId: opsUser.id,\n      actualOutputQty: 17000,",
  "operatorId: 'user-ops',\n      actualOutputQty: 17000,"
)
fs.writeFileSync('apps/web/lib/erp/domain/seed.ts', content)
