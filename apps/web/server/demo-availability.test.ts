import test from 'node:test'
import assert from 'node:assert/strict'
import { demoPreviewEnabled } from './demo-availability'
import { isDemoMode } from './demo'
test('live preview flags accept on and true, disable off and false, and never turn the live database into demo storage',()=>{
 const names=['NODE_ENV','DEMO_MODE','APP_MODE','DATABASE_URL'];const saved=names.map(key=>[key,process.env[key]] as const)
 try {
  Reflect.set(process.env,'NODE_ENV','production');process.env.APP_MODE='production';process.env.DATABASE_URL='postgresql://test.invalid/only-shape'
  for(const value of ['on','true','1','ON']){process.env.DEMO_MODE=value;assert.equal(demoPreviewEnabled(),true);assert.equal(isDemoMode(),false)}
  for(const value of ['off','false','0','invalid']){process.env.DEMO_MODE=value;assert.equal(demoPreviewEnabled(),false);assert.equal(isDemoMode(),false)}
  process.env.APP_MODE='demo';delete process.env.DATABASE_URL;process.env.DEMO_MODE='on';assert.equal(isDemoMode(),true)
  process.env.DEMO_MODE='off';assert.equal(isDemoMode(),false)
 }finally{for(const [key,value]of saved){if(value===undefined)delete process.env[key];else process.env[key]=value}}
})
