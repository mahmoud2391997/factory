import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import path from 'node:path';
test('startup mode guard rejects missing, unknown and database-backed demo, and accepts explicit valid production',()=>{
 const base:NodeJS.ProcessEnv={PATH:process.env.PATH,NODE_ENV:'production',JWT_SECRET:'s'.repeat(40),SETUP_TOKEN:'t'.repeat(32)}
 const check=(extra:Record<string,string>)=>spawnSync(process.execPath,[path.resolve('scripts/check-env.mjs')],{env:{...base,...extra},encoding:'utf8'}).status
 assert.equal(check({}),1);assert.equal(check({APP_MODE:'typo'}),1);assert.equal(check({APP_MODE:'demo'}),0);assert.equal(check({APP_MODE:'demo',DATABASE_URL:'postgresql://test.invalid/test'}),1);assert.equal(check({APP_MODE:'production'}),1);assert.equal(check({APP_MODE:'production',DATABASE_URL:'postgresql://test.invalid/test'}),0)
})

test('build entry refuses implicit or unknown modes without requiring runtime secrets baked into image',()=>{const run=(value?:string)=>spawnSync(process.execPath,[path.resolve('scripts/check-build-mode.mjs')],{env:{PATH:process.env.PATH,NODE_ENV:'production',...(value?{APP_MODE:value}:{})}}).status;assert.equal(run(),1);assert.equal(run('typo'),1);assert.equal(run('production'),0);assert.equal(run('demo'),0)})
