import test from 'node:test';import assert from 'node:assert/strict';import {dispatchOutbox,settleOutboxAttempt,type OutboxMessage} from './outbox'
function fixture(){const row:OutboxMessage={id:'notification-1',status:'pending',attempts:0};return {row,store:{claim:async()=>{if(row.status!=='pending')return null;row.status='sending';row.attempts++;return {...row}},finish:async(id:string,status:'sent'|'uncertain')=>{assert.equal(id,row.id);row.status=status}}}}
test('persisted pending message is delivered once; replay/conflict does not resend',async()=>{const {row,store}=fixture();let sent=0;await dispatchOutbox(store,async()=>{sent++});await dispatchOutbox(store,async()=>{sent++});assert.equal(sent,1);assert.equal(row.status,'sent')})
test('crash after claim or accepted delivery cannot cause automatic duplicate',async()=>{const {row,store}=fixture();let sent=0;await assert.rejects(()=>dispatchOutbox({...store,finish:async()=>{throw Error('crash after send')}},async()=>{sent++}));await dispatchOutbox(store,async()=>{sent++});assert.equal(row.status,'sending');assert.equal(sent,1)})
test('transport ambiguity is retained for reconciliation without discarding or retrying it',async()=>{const {row,store}=fixture();await dispatchOutbox(store,async()=>{throw Error('unknown acceptance')});assert.equal(row.status,'uncertain');assert.equal(row.attempts,1);await dispatchOutbox(store,async()=>assert.fail('must not resend'))})
test('late completion cannot overwrite a newer claim or an operator decision',()=>{
 const row={emailStatus:'sending',emailAttempts:2}
 assert.equal(settleOutboxAttempt(row,1,'sent'),false);assert.equal(row.emailStatus,'sending')
 assert.equal(settleOutboxAttempt(row,2,'uncertain'),true);assert.equal(row.emailStatus,'uncertain')
 row.emailStatus='pending';assert.equal(settleOutboxAttempt(row,2,'sent'),false)
 row.emailStatus='sent';assert.equal(settleOutboxAttempt(row,2,'uncertain'),false)
})
