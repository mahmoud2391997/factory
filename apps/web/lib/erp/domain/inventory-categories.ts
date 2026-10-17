import type {Actor,Clock,CommandResult,ErpState,InventoryCategory,InventoryCategoryCommand,InventoryItemKind} from './types'
/** Approved starter master definitions only. Existing inventory records are never assigned automatically. */
export function defaultInventoryCategories():InventoryCategory[]{return [
 {id:'inventory-category-raw',code:'RAW_MATERIALS',nameAr:'مواد خام',active:true},
 {id:'inventory-category-finished',code:'FINISHED_PRODUCTS',nameAr:'منتجات تامة',active:true},
 {id:'inventory-category-packaging',code:'PACKAGING',nameAr:'مواد التعبئة',active:true},
 {id:'inventory-category-spares',code:'SPARE_PARTS',nameAr:'قطع غيار',active:true},
 {id:'inventory-category-consumables',code:'CONSUMABLES',nameAr:'مستهلكات',active:true},
]}
export function inventoryCategoryList(state:Pick<ErpState,'inventoryCategories'>){return state.inventoryCategories??defaultInventoryCategories()}
export const INVENTORY_KIND_LABELS:Record<InventoryItemKind,string>={MATERIAL:'المواد الخام',PRODUCT:'المنتجات',PACKAGING:'مواد التعبئة',SPARE_PART:'قطع الغيار'}
export function inventoryClassificationRows(state:Pick<ErpState,'materials'|'products'|'packagingMaterials'|'spareParts'|'inventoryCategories'>){
 const categories=inventoryCategoryList(state)
 return (Object.entries({MATERIAL:state.materials,PRODUCT:state.products,PACKAGING:state.packagingMaterials,SPARE_PART:state.spareParts}) as Array<[InventoryItemKind,Array<{id:string;code:string;nameAr:string;inventoryCategoryId?:string}>]>).flatMap(([kind,rows])=>rows.map(row=>{
  const category=categories.find(c=>c.id===row.inventoryCategoryId)
  return {...row,kind,categoryLabel:category?category.nameAr+(category.active?'':' — مؤرشف'):row.inventoryCategoryId?'مرجع تصنيف غير متاح: '+row.inventoryCategoryId:'غير مصنف — يحتاج مراجعة'}
 }))
}
function text(value:unknown,max:number){return typeof value==='string'&&value.trim().length>0&&value.trim().length<=max&&!/[\u0000-\u001f\u007f]/.test(value)?value.trim():null}
export function applyInventoryCategoryCommand(state:ErpState,actor:Actor,command:InventoryCategoryCommand,clock:Clock):CommandResult{
 if(!actor.permissions.includes('settings.update'))return {ok:false,error:'إدارة التصنيفات تحتاج صلاحية تعديل الإعدادات'}
 const categories=inventoryCategoryList(state).map(row=>({...row}))
 let entityId='',detail='',action=''
 if(command.action==='assignInventoryCategory'){
  const {itemKind,itemId,categoryId}=command.input
  if(!['MATERIAL','PRODUCT','PACKAGING','SPARE_PART'].includes(itemKind))return {ok:false,error:'نوع الصنف غير صحيح'}
  const rows=itemKind==='MATERIAL'?state.materials:itemKind==='PRODUCT'?state.products:itemKind==='PACKAGING'?state.packagingMaterials:state.spareParts
  const item=rows.find(row=>row.id===itemId)
  if(!item)return {ok:false,error:'الصنف غير موجود'}
  if(categoryId!==null){const target=categories.find(c=>c.id===categoryId);if(!target||!target.active)return {ok:false,error:'اختر تصنيفًا نشطًا من السجل'}}
  entityId=item.id;detail=JSON.stringify({itemKind,previousCategoryId:item.inventoryCategoryId??null,categoryId});action='تغيير تصنيف المخزون'
  if(categoryId===null)delete item.inventoryCategoryId;else item.inventoryCategoryId=categoryId
 }else{
  const input=command.input
  const before=command.action==='updateInventoryCategory'?categories.find(c=>c.id===command.input.id):null
  if(command.action==='updateInventoryCategory'&&!before)return {ok:false,error:'التصنيف غير موجود'}
  const code=text(input.code??before?.code,40)?.toUpperCase(),nameAr=text(input.nameAr??before?.nameAr,80)
  if(!code||!nameAr||!/^[A-Z][A-Z0-9_-]{1,39}$/.test(code))return {ok:false,error:'أدخل اسمًا وكودًا صحيحين للتصنيف'}
  if(categories.some(c=>c.id!==before?.id&&(c.code===code||c.nameAr.normalize('NFKC').toLocaleLowerCase()===nameAr.normalize('NFKC').toLocaleLowerCase())))return {ok:false,error:'اسم التصنيف أو كوده مستخدم بما فيه التصنيفات المؤرشفة'}
  const active=command.action==='updateInventoryCategory'&&command.input.active!==undefined?command.input.active:before?.active??true
  if(typeof active!=='boolean')return {ok:false,error:'حالة التصنيف غير صحيحة'}
  const after:InventoryCategory={id:before?.id??clock.id('icat'),code,nameAr,active}
  const snapshot=before?{...before}:null
  if(before)Object.assign(before,after);else categories.push(after)
  entityId=after.id;detail=JSON.stringify({before:snapshot,after});action=before?'تعديل تصنيف المخزون':'إنشاء تصنيف المخزون'
 }
 state.inventoryCategories=categories
 state.auditLogs.unshift({id:clock.id('aud'),at:clock.now(),userId:actor.id,userName:actor.name,action,entity:'inventoryCategory',entityId,detail})
 if(state.auditLogs.length>1000)state.auditLogs.length=1000
 return {ok:true,state,message:'تم حفظ تصنيفات المخزون'}
}
