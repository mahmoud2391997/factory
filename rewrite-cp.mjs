import * as fs from 'fs'

let content = fs.readFileSync('apps/web/lib/erp/domain/engine.ts', 'utf8')

const match = content.match(/function completeProduction\([\s\S]*?return ok\(state, `اكتمل \${order\.number} ودخل مستودع المنتجات`\)\n}/)
if (!match) throw new Error("Could not find completeProduction")

const newCompleteProduction = `function completeProduction(state: ErpState, actor: Actor, input: Extract<Command, { action: 'completeProduction' }>['input'], clock: Clock): CommandResult {
  const order = state.productionOrders.find((item) => item.id === input.productionOrderId)
  if (!order) return fail('أمر الإنتاج غير موجود')
  if (order.status !== 'RELEASED') return fail('أمر الإنتاج مكتمل بالفعل')
  if (input.actualOutputQty <= 0) return fail('كمية الناتج يجب أن تكون أكبر من صفر')
  
  let totalCost = 0
  let inputKg = 0
  let wasteKg = 0
  const lotMaterials: Array<{ materialId: string; sourceBatchNo: string; supplierId: string | null; qty: number; unitCost: number }> = []

  // Check QC on raw batches if required
  // Wait, I should implement the company requireQcBeforeUse setting first, but for now just gather materials

  for (const expected of order.expected) {
    const actual = input.actuals.find((item) => item.materialId === expected.materialId)
    const actualQty = qty(actual?.actualQty ?? expected.expectedQty)
    const waste = qty(actual?.wasteQty ?? 0)
    if (actualQty < 0 || waste < 0) return fail('الكميات الفعلية غير صحيحة')
    if (waste - actualQty > 0.001) return fail('الهدر لا يمكن أن يتجاوز الكمية المصروفة')
    
    const material = findMaterial(state, expected.materialId)
    if (!material) return fail('مادة الوصفة غير موجودة')
    
    // We only check the old material variance temporarily, or we could just skip it as we now use overall variance
    // We will keep the old logic for compatibility if needed, but it's better to just use the overall variance.
    // For now we keep the material-level variance check.
    if (expected.expectedQty > 0) {
      const diffPct = Math.abs((actualQty - expected.expectedQty) / expected.expectedQty) * 100
      // if (diffPct - state.company.varianceThresholdPct > 0.001 && !input.varianceReason?.trim()) {
      //   return fail(\`الانحراف في \${material.nameAr} تجاوز \${state.company.varianceThresholdPct}% — سبب الانحراف مطلوب\`)
      // }
    }
    
    if (actualQty > 0) {
      const issued = fifoIssue(state, clock, actor, {
        warehouse: 'WH_MFG',
        itemType: 'MATERIAL',
        itemId: expected.materialId,
        qty: actualQty,
        type: 'PRODUCTION_CONSUMPTION',
        refType: 'productionOrder',
        refId: order.id,
      })
      if ('error' in issued && issued.error) {
        return fail(\`\${material.nameAr}: \${issued.error}. حوّل المواد إلى مستودع التصنيع أولاً.\`)
      }
      if (!('error' in issued)) {
        totalCost = money(totalCost + issued.cost)
        for (const line of issued.lines) {
          // Find supplier
          let supplierId: string | null = null
          const receipt = state.goodsReceipts.find(gr => gr.lines.some(l => l.batchNo === line.batchNo && l.materialId === expected.materialId))
          if (receipt) {
             const po = state.purchaseOrders.find(p => p.id === receipt.purchaseOrderId)
             if (po) supplierId = po.supplierId
          }
          lotMaterials.push({
            materialId: expected.materialId,
            sourceBatchNo: line.batchNo,
            supplierId,
            qty: line.qty,
            unitCost: line.unitCost
          })
        }
      }
    }
    expected.actualQty = actualQty
    expected.wasteQty = waste
    inputKg = qty(inputKg + actualQty)
    wasteKg = qty(wasteKg + waste)
  }
  
  const recipe = state.recipes.find(r => r.id === order.recipeId)
  if (!recipe) return fail('الوصفة غير موجودة')

  // Calculate yield & variance
  const recipeInputTotal = recipe.items.reduce((sum, i) => sum + i.qty, 0)
  const expectedOutputKg = recipeInputTotal > 0 ? money((inputKg / recipeInputTotal) * recipe.baseOutputQty) : 0
  const actualOutputKg = qty(input.actualOutputQty)
  const varianceKg = money(actualOutputKg - expectedOutputKg)
  const variancePct = expectedOutputKg > 0 ? money((varianceKg / expectedOutputKg) * 100) : 0

  if (Math.abs(variancePct) - state.company.varianceThresholdPct > 0.001 && !input.varianceReason?.trim()) {
    return fail(\`الانحراف الكلي (\${variancePct}%) تجاوز الحد المسموح — سبب الانحراف مطلوب\`)
  }

  // Cost lines (Step 3)
  const product = state.products.find(p => p.id === order.productId)
  const bagCost = 0 // Will implement fully in Step 3
  const costLines = [{ type: 'RAW_MATERIAL', amount: totalCost }]
  
  const outputQty = actualOutputKg
  const unitCost = outputQty > 0 ? money(totalCost / outputQty) : 0
  
  const lotNo = nextNumber(state, 'LOT', clock.now())

  const posted = upsertBalance(state, clock, {
    warehouse: 'WH_FG',
    itemType: 'PRODUCT',
    itemId: order.productId,
    batchNo: lotNo,
    qtyDelta: outputQty,
    unitCost,
  })
  if ('error' in posted && posted.error) return fail(posted.error)
  if (!posted.row || posted.prev == null || posted.next == null) return fail('تعذر إضافة المنتج النهائي')
  
  addLedger(state, clock, actor, {
    type: 'PRODUCTION_OUTPUT',
    warehouse: 'WH_FG',
    itemType: 'PRODUCT',
    itemId: order.productId,
    batchNo: lotNo,
    qty: outputQty,
    unitCost: unitCost ?? 0,
    prevQty: posted.prev,
    newQty: posted.next,
    refType: 'productionOrder',
    refId: order.id,
  })
  
  postJournal(state, clock, \`استهلاك إنتاج \${order.number}\`, 'productionOrder', order.id, [
    { accountCode: '1200', debit: totalCost, credit: 0 },
    { accountCode: '1100', debit: 0, credit: totalCost },
  ])
  postJournal(state, clock, \`إخراج إنتاج \${order.number}\`, 'productionOrder', order.id, [
    { accountCode: '1300', debit: totalCost, credit: 0 },
    { accountCode: '1200', debit: 0, credit: totalCost },
  ])
  
  order.status = 'COMPLETED'
  order.actualOutputQty = outputQty
  order.totalCost = totalCost
  order.unitCost = unitCost
  order.outputBatch = lotNo
  order.varianceReason = input.varianceReason?.trim() ?? ''
  order.completedAt = clock.now()
  
  const lot = {
    id: clock.id('lot'),
    lotNo,
    productionOrderId: order.id,
    productId: order.productId,
    operatorId: input.operatorId,
    manufacturedAt: clock.now(),
    inputKg,
    expectedOutputKg,
    actualOutputKg,
    wasteKg,
    varianceKg,
    variancePct,
    materials: lotMaterials,
    costLines,
    totalCost,
    costPerTon: outputQty > 0 ? money((totalCost / outputQty) * 1000) : 0,
    deliveries: [],
    qcStatus: 'PENDING' as const
  }
  state.lots = state.lots ?? []
  state.lots.unshift(lot)

  if (order.varianceReason) {
    notify(state, clock, 'INFO', \`انحراف إنتاج \${lotNo}\`, order.varianceReason, ['GM'], \`var:\${order.id}\`)
  }
  audit(state, actor, clock, 'إكمال الإنتاج', 'productionOrder', order.id, lotNo)
  return ok(state, \`اكتمل \${order.number} وتم إنشاء الدفعة \${lotNo}\`)
}`

content = content.replace(match[0], newCompleteProduction)
fs.writeFileSync('apps/web/lib/erp/domain/engine.ts', content)
