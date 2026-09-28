import * as fs from 'fs'

const path = 'apps/web/lib/erp/domain/types.ts'
let content = fs.readFileSync(path, 'utf8')

// Add operatorId to completeProduction
content = content.replace(
  "completeProduction'; input: { productionOrderId: string; actuals:",
  "completeProduction'; input: { productionOrderId: string; operatorId: string; actuals:"
)

// Add qcLimits to Material
content = content.replace(
  /export type Material = \{([^}]*)\}/m,
  "export type Material = {$1  qcLimits?: { minMoisture?: number; maxMoisture?: number; minProtein?: number; maxProtein?: number; minAsh?: number; maxAsh?: number }\n}"
)

// Add qcLimits to Product
content = content.replace(
  /export type Product = \{([^}]*)\}/m,
  "export type Product = {$1  qcLimits?: { minMoisture?: number; maxMoisture?: number; minProtein?: number; maxProtein?: number; minAsh?: number; maxAsh?: number }\n}"
)

fs.writeFileSync(path, content)
