import * as fs from 'fs'

let content = fs.readFileSync('apps/web/lib/erp/domain/engine.ts', 'utf8')

// Inject lot logic in confirmInvoice
let match = content.match(/if \(!\('error' in issued\)\) \{\n\s*cogs = money\(cogs \+ issued\.cost\)\n\s*line\.batchNo = issued\.lines\.map\(\(item\) => item\.batchNo\)\.join\(', '\)\n\s*line\.unitCost = line\.qty > 0 \? money\(issued\.cost \/ line\.qty\) : 0\n\s*\}/)

if (match) {
  let replacement = `if (!('error' in issued)) {
      cogs = money(cogs + issued.cost)
      line.batchNo = issued.lines.map((item) => item.batchNo).join(', ')
      line.unitCost = line.qty > 0 ? money(issued.cost / line.qty) : 0
      
      for (const issuedLine of issued.lines) {
        const lot = state.lots?.find(l => l.lotNo === issuedLine.batchNo && l.productId === line.productId)
        if (lot) {
           lot.deliveries.push({
             invoiceId: invoice.id,
             customerId: invoice.customerId,
             qty: issuedLine.qty,
             at: clock.now()
           })
           const prevVal = (lot.salePricePerTon || 0) * lot.actualOutputKg / 1000
           const newVal = (line.unitPrice ?? 0) * issuedLine.qty // line.unitPrice is per kg
           // approximate weighted average if sold in parts
           lot.salePricePerTon = money(((prevVal + newVal) / (lot.actualOutputKg / 1000)))
           lot.marginPerTon = money(lot.salePricePerTon - lot.costPerTon)
           lot.marginPct = lot.salePricePerTon > 0 ? money((lot.marginPerTon / lot.salePricePerTon) * 100) : 0
        }
      }
    }`
  content = content.replace(match[0], replacement)
}

// Inject lot logic in createWithdrawal
let matchWd = content.match(/if \(!\('error' in issued\)\) \{\n\s*totalCost = money\(totalCost \+ issued\.cost\)\n\s*withdrawal\.lines\.push\(\{\n\s*productId: line\.productId,\n\s*qty: line\.qty,\n\s*batchNo: issued\.lines\.map\(\(item\) => item\.batchNo\)\.join\(', '\),\n\s*unitCost: line\.qty > 0 \? money\(issued\.cost \/ line\.qty\) : 0,\n\s*\}\)\n\s*\}/)

if (matchWd) {
  let replacementWd = `if (!('error' in issued)) {
      totalCost = money(totalCost + issued.cost)
      withdrawal.lines.push({
        productId: line.productId,
        qty: line.qty,
        batchNo: issued.lines.map((item) => item.batchNo).join(', '),
        unitCost: line.qty > 0 ? money(issued.cost / line.qty) : 0,
      })
      for (const issuedLine of issued.lines) {
        const lot = state.lots?.find(l => l.lotNo === issuedLine.batchNo && l.productId === line.productId)
        if (lot) {
           lot.deliveries.push({
             withdrawalId: withdrawal.id,
             qty: issuedLine.qty,
             at: clock.now()
           })
        }
      }
    }`
  content = content.replace(matchWd[0], replacementWd)
}

fs.writeFileSync('apps/web/lib/erp/domain/engine.ts', content)
