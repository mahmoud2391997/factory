import assert from 'node:assert/strict'
import { test } from 'node:test'

import { canResetDemoData, isDemoMode } from './demo'

const DATABASE_KEYS = ['DATABASE_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL', 'DATABASE_URL_UNPOOLED']
const ENV_KEYS = [...DATABASE_KEYS, 'APP_MODE', 'NODE_ENV']

test('production requires explicit database-free demo configuration', () => {
  const previous = new Map(ENV_KEYS.map((key) => [key, process.env[key]]))
  try {
    for (const key of DATABASE_KEYS) delete process.env[key]
    Reflect.set(process.env, 'NODE_ENV', 'production')
    delete process.env.APP_MODE
    assert.throws(() => isDemoMode(), /APP_MODE/)
    assert.throws(() => canResetDemoData(), /APP_MODE/)
    process.env.APP_MODE = 'unknown'
    assert.throws(() => isDemoMode(), /APP_MODE/)

    process.env.APP_MODE = 'production'
    assert.equal(isDemoMode(), false)
    assert.equal(canResetDemoData(), false)

    process.env.APP_MODE = 'demo'
    assert.equal(isDemoMode(), true)
    assert.equal(canResetDemoData(), true)

    process.env.DATABASE_URL = 'postgresql://db.example.test/erp'
    assert.throws(() => isDemoMode(), /database connection/)
    assert.throws(() => canResetDemoData(), /database connection/)

    delete process.env.DATABASE_URL
    Reflect.set(process.env, 'NODE_ENV', 'test')
    delete process.env.APP_MODE
    assert.equal(isDemoMode(), true)
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})

test('production initial state never contains public sample accounts',async()=>{const saved=new Map(['NODE_ENV','APP_MODE','DEMO_MODE','DATABASE_URL'].map(k=>[k,process.env[k]]));try{Reflect.set(process.env,'NODE_ENV','production');process.env.APP_MODE='production';process.env.DEMO_MODE='off';process.env.DATABASE_URL='postgresql://synthetic:synthetic@127.0.0.1:1/unused';const {createInitialState}=await import('./erp/store');const state=await createInitialState();assert.equal(state.users.length,0)}finally{for(const [k,v]of saved){if(v===undefined)delete process.env[k];else process.env[k]=v}}})
