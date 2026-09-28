import * as fs from 'fs'

let path = 'apps/web/components/erp/live/screens-office.tsx'
let content = fs.readFileSync(path, 'utf8')
content = content.replace(/traceProduct/g, 'traceLot')

// Fix the trace section
let oldTrace = `const trace = searchId ? traceProduct(ctx.state, searchId) : null`
let newTrace = `const trace = searchId ? traceLot(ctx.state, searchId) : null`
content = content.replace(oldTrace, newTrace)

oldTrace = `{trace?.product ? (
          <div className="mt-4 space-y-2 text-sm leading-7 text-[#30453d]">
            <div>الرصيد الحالي: {qtyFmt(itemOnHand(ctx.state, 'PRODUCT', trace.product.id))} كجم</div>
            <div>الموردون: {[...new Set(trace.purchaseOrders.map((order) => partyName(ctx.state.suppliers, order.supplierId)))].join('، ') || '—'}</div>
            <div>أوامر الشراء: {trace.purchaseOrders.map((order) => \`\${order.number} — \${partyName(ctx.state.suppliers, order.supplierId)}\`).join('، ') || '—'}</div>
            <div>الاستلامات: {trace.receipts.map((receipt) => receipt.number).join('، ') || '—'}</div>
            <div>الإنتاج: {trace.orders.map((order) => \`\${order.number} (\${statusLabel(order.status)}) ناتج \${qtyFmt(order.actualOutputQty)}\`).join('، ') || '—'}</div>
            <div>الفواتير: {trace.sales.map((invoice) => \`\${invoice.number} (\${statusLabel(invoice.status)})\`).join('، ') || '—'}</div>
          </div>
        ) : null}`
newTrace = `{trace?.lot ? (
          <div className="mt-4 space-y-2 text-sm leading-7 text-[#30453d]">
            <div>رقم الدفعة: {trace.lot.lotNo}</div>
            <div>المنتج: {trace.product?.nameAr}</div>
            <div>الكمية المنتجة: {trace.lot.actualOutputKg} كجم</div>
            <div>الموردون: {trace.suppliers.map(s => s?.nameAr).join('، ') || '—'}</div>
            <div>الخام المستخدم: {trace.rawBatches.map(b => b.sourceBatchNo).join('، ') || '—'}</div>
            <div>العملاء المستلمون: {trace.customers.map(c => c?.nameAr).join('، ') || '—'}</div>
          </div>
        ) : null}`
content = content.replace(oldTrace, newTrace)
fs.writeFileSync(path, content)

path = 'apps/web/lib/erp/domain/plan-acceptance.test.ts'
content = fs.readFileSync(path, 'utf8')
content = content.replace(/traceProduct/g, 'traceLot')
oldTrace = `const trace = traceLot(state, product.id)
  assert.ok(trace.purchaseOrders.some((item) => item.id === poId && item.supplierId === supplier.id))
  assert.ok(trace.receipts.some((item) => item.id === receipt.id))
  assert.ok(trace.orders.some((item) => item.id === order.id && item.status === 'COMPLETED'))
  assert.ok(trace.sales.some((item) => item.id === invoice.id && item.status === 'PAID'))`
newTrace = `const trace = traceLot(state, state.lots[0].lotNo)
  assert.ok(trace?.suppliers.some((item) => item?.id === supplier.id))
  assert.ok(trace?.lot.productionOrderId === order.id)`
content = content.replace(oldTrace, newTrace)
fs.writeFileSync(path, content)

