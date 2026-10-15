/** Durable claim before transport. Ambiguous sends are held for reconciliation, never blindly retried. */
export type OutboxMessage={id:string;status:'pending'|'sending'|'sent'|'uncertain';attempts:number}
export async function dispatchOutbox<T extends OutboxMessage>(store:{claim:()=>Promise<T|null>;finish:(id:string,status:'sent'|'uncertain')=>Promise<void>},send:(message:T)=>Promise<void>,limit=20){
 let sent=0
 for(let i=0;i<limit;i++){const message=await store.claim();if(!message)break
  try{await send(message)}catch{await store.finish(message.id,'uncertain');continue}
  await store.finish(message.id,'sent');sent++
 }return sent
}
