'use client'
import {useState} from 'react'
import {inventoryCategoryList,inventoryClassificationRows,INVENTORY_KIND_LABELS} from '@/lib/erp/domain/inventory-categories'
import type {InventoryCategory} from '@/lib/erp/domain/types'
import {useLanguage} from '@/lib/i18n/language-provider'
import {translateUiText} from '@/lib/i18n/translations'
import type {LiveCtx} from './ctx'
import {DataTable,Field,GhostButton,PrimaryButton,SelectInput,TextInput} from './bits'
export function InventoryCategorySettings({ctx}:{ctx:LiveCtx}){
 const {language}=useLanguage(),ui=(text:string)=>translateUiText(language,text)
 const [code,setCode]=useState(''),[name,setName]=useState(''),[message,setMessage]=useState(''),[failed,setFailed]=useState(false),[onlyUnclassified,setOnlyUnclassified]=useState(true)
 const categories=inventoryCategoryList(ctx.state),rows=inventoryClassificationRows(ctx.state),canManage=ctx.permissions.includes('settings.update')
 const unresolved=rows.filter(row=>!row.inventoryCategoryId||!categories.some(c=>c.id===row.inventoryCategoryId))
 async function act(action:string,input:Record<string,unknown>){const result=await ctx.act(action,input);setMessage(result.message);setFailed(!result.ok);return result}
 return <section aria-label={ui('تصنيفات المخزون')} className="mt-6 space-y-4 border-t pt-5">
  <h3 className="font-bold">{ui('تصنيفات المخزون')}</h3>
  <p className="text-sm leading-7">{ui('هذه التصنيفات مستقلة عن نوع المادة الخام وتصنيف التعبئة الفني. لا نغير تصنيف أي سجل قديم تلقائيًا أو أرصدته.')}</p>
  {canManage?<form aria-label={ui('إضافة تصنيف مخزون')} className="flex flex-wrap items-end gap-3" onSubmit={async event=>{event.preventDefault();const result=await act('createInventoryCategory',{code,nameAr:name});if(result.ok){setCode('');setName('')}}}>
   <Field label={ui('كود التصنيف')}><TextInput required maxLength={40} value={code} onChange={event=>setCode(event.target.value)} /></Field>
   <Field label={ui('اسم التصنيف')}><TextInput required maxLength={80} value={name} onChange={event=>setName(event.target.value)} /></Field>
   <PrimaryButton disabled={ctx.pending}>{ui('إضافة تصنيف')}</PrimaryButton>
  </form>:null}
  <div className="space-y-2">{categories.map(category=><CategoryEditor key={category.id} category={category} canManage={canManage} pending={ctx.pending} act={act} ui={ui}/>)}</div>
  <h4 className="font-semibold">{ui('مراجعة تصنيف الأصناف')} · {unresolved.length} {ui('غير مصنف — يحتاج مراجعة')}</h4>
  <label className="flex gap-2 text-sm"><input type="checkbox" checked={onlyUnclassified} onChange={event=>setOnlyUnclassified(event.target.checked)}/>{ui('عرض الأصناف التي تحتاج مراجعة فقط')}</label>
  <DataTable columns={[ui('الكود'),ui('الصنف'),ui('نوع السجل'),ui('التصنيف الإداري')]} rows={(onlyUnclassified?unresolved:rows).map(row=>[
   row.code,row.nameAr,ui(INVENTORY_KIND_LABELS[row.kind]),<SelectInput key={row.kind+row.id} aria-label={ui('تصنيف')+' '+row.code} disabled={!canManage||ctx.pending} value={row.inventoryCategoryId??''} onChange={async event=>{await act('assignInventoryCategory',{itemKind:row.kind,itemId:row.id,categoryId:event.target.value||null})}}>
    <option value="">{ui('غير مصنف — يحتاج مراجعة')}</option>
    {row.inventoryCategoryId&&!categories.some(c=>c.id===row.inventoryCategoryId)?<option disabled value={row.inventoryCategoryId}>{row.categoryLabel}</option>:null}
    {categories.map(c=><option key={c.id} disabled={!c.active} value={c.id}>{c.nameAr}{c.active?'':' — '+ui('مؤرشف')}</option>)}
   </SelectInput>,
  ])}/>
  {message?<p role={failed?'alert':'status'} className="text-sm">{ui(message)}</p>:null}
 </section>
}
function CategoryEditor({category,canManage,pending,act,ui}:{category:InventoryCategory;canManage:boolean;pending:boolean;act:(action:string,input:Record<string,unknown>)=>Promise<{ok:boolean}>;ui:(text:string)=>string}){
 const [name,setName]=useState(category.nameAr),[code,setCode]=useState(category.code)
 return <form aria-label={ui('تعديل تصنيف')+' '+category.code} className="flex flex-wrap items-end gap-2 rounded border p-3" onSubmit={async event=>{event.preventDefault();await act('updateInventoryCategory',{id:category.id,code,nameAr:name})}}>
  <Field label={ui('كود التصنيف')}><TextInput required disabled={!canManage||pending} maxLength={40} value={code} onChange={event=>setCode(event.target.value)}/></Field>
  <Field label={ui('اسم التصنيف')}><TextInput required disabled={!canManage||pending} maxLength={80} value={name} onChange={event=>setName(event.target.value)}/></Field>
  <span className="text-sm">{ui(category.active?'نشط':'مؤرشف')}</span>
  {canManage?<><PrimaryButton disabled={pending}>{ui('حفظ التصنيف')}</PrimaryButton><GhostButton type="button" disabled={pending} aria-label={ui(category.active?'أرشفة تصنيف':'استعادة تصنيف')+' '+category.code} onClick={async()=>{await act('updateInventoryCategory',{id:category.id,active:!category.active})}}>{ui(category.active?'أرشفة':'استعادة')}</GhostButton></>:null}
 </form>
}
