import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:tls'
import { once } from 'node:events'
import { configuredMailSender } from '../apps/web/server/erp/mailer'
import { dispatchOutbox, settleOutboxAttempt } from '../apps/web/server/erp/outbox'
import { actorFromUser, applyCommand } from '../apps/web/lib/erp/domain/engine'
import { emptyState, createClock } from '../apps/web/lib/erp/domain/seed'

const messages: string[] = []
const fixtureFile = process.argv[2] + '.outbox.json'
const server = createServer({ cert: await readFile(process.argv[2]), key: await readFile(process.argv[3]) }, socket => {
  let buffer='',data=false,body=''
  socket.write('220 localhost disposable catcher\r\n')
  socket.on('data', chunk => {
    buffer+=chunk.toString(); let end
    while ((end=buffer.indexOf('\r\n'))>=0) {
      const line=buffer.slice(0,end); buffer=buffer.slice(end+2)
      if (data) { if(line==='.') { messages.push(body);body='';data=false;socket.write('250 accepted locally\r\n') } else body+=line+'\r\n';continue }
      if(/^EHLO|^HELO/i.test(line))socket.write('250-localhost\r\n250 SIZE 1000000\r\n')
      else if(/^DATA$/i.test(line)){data=true;socket.write('354 send data\r\n')}
      else if(/^QUIT$/i.test(line)){socket.end('221 bye\r\n')}
      else socket.write('250 OK\r\n')
    }
  })
})
server.listen(0,'127.0.0.1');await once(server,'listening')
try {
  const address=server.address();assert(address&&typeof address==='object')
  // Overwrite every SMTP setting, so this script can never contact a supplied real provider.
  Object.assign(process.env,{NODE_ENV:'production',SMTP_HOST:'127.0.0.1',SMTP_PORT:String(address.port),SMTP_SECURE:'true',SMTP_FROM:'catcher@example.invalid',SMTP_USER:'',SMTP_PASS:''})
  const now='2026-10-16T10:00:00.000Z';let state=emptyState('synthetic-only')
  state.users=state.users.filter(user=>user.id==='user-gm');state.users[0].email='recipient@example.invalid';state.company.notifyEmail=''
  state.notifications=[{id:'mail-journey-synthetic',kind:'INFO',title:'اختبار اصطناعي',body:'بيانات اصطناعية فقط',dedupeKey:'mail-journey',roles:['GM'],read:false,emailStatus:'pending',emailAttempts:0,at:now}]
  const persist=()=>writeFile(fixtureFile,JSON.stringify(state),{mode:0o600})
  await persist()
  const send=await configuredMailSender();assert.ok(send)
  const store={
    claim:async()=>{const note=state.notifications[0];if(note.emailStatus!=='pending')return null;note.emailStatus='sending';note.emailAttempts=(note.emailAttempts??0)+1;note.emailClaimedAt='2026-10-16T09:00:00.000Z';await persist();return {id:note.id,status:'sending' as const,attempts:note.emailAttempts,state:structuredClone(state)}},
    finish:async(_id:string,status:'sent'|'uncertain',attempts:number)=>{settleOutboxAttempt(state.notifications[0],attempts,status);await persist()},
  }
  // Simulate the crash window by reopening the disk fixture after claim, without invoking transport.
  await store.claim();state=JSON.parse(await readFile(fixtureFile,'utf8'));await dispatchOutbox(store,send);assert.equal(messages.length,0);assert.equal(state.notifications[0].emailStatus,'sending')
  const actor=actorFromUser(state,'user-gm');assert.ok(actor)
  const input={id:state.notifications[0].id,expectedStatus:'sending' as const,expectedAttempts:1,resolution:'requeue' as const,reason:'Local catcher confirmed no send was attempted',nonDeliveryConfirmed:false}
  assert.equal(applyCommand(state,actor,{action:'resolveNotificationEmail',input},createClock(now)).ok,false)
  const reviewed=applyCommand(state,actor,{action:'resolveNotificationEmail',input:{...input,nonDeliveryConfirmed:true}},createClock(now));assert.ok(reviewed.ok);state=reviewed.state;await persist()
  await dispatchOutbox(store,send);await dispatchOutbox(store,send)
  assert.equal(messages.length,1);assert.equal(state.notifications[0].emailStatus,'sent');assert.equal(state.notifications[0].emailAttempts,2)
  assert.match(messages[0],/Message-ID: <factory-mail-journey-synthetic@notifications.invalid>/i)
  assert.equal(state.auditLogs.filter(row=>row.entityId==='mail-journey-synthetic').length,1)
  // Accepted-but-ambiguous delivery is never automatically repeated.
  state.notifications[0]={...state.notifications[0],id:'mail-journey-ambiguous',emailStatus:'pending',emailAttempts:0};await persist()
  await dispatchOutbox(store,async message=>{await send(message);throw Error('synthetic process failure after acceptance')})
  await dispatchOutbox(store,send);assert.equal(messages.length,2);assert.equal(state.notifications[0].emailStatus,'uncertain')
  assert.match(messages[1],/Message-ID: <factory-mail-journey-ambiguous@notifications.invalid>/i)
  process.env.SMTP_HOST='';assert.equal(await configuredMailSender(),null)
  console.log('PASS: trusted disposable TLS catcher, disk-reopened simulated pre-send crash hold, explicit GM reconciliation, stable delivery ID, single retry, audit, accepted-but-uncertain hold, missing-provider preservation. No external SMTP.')
} finally { server.close();await once(server,'close') }
