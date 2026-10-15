import test from 'node:test'
import assert from 'node:assert/strict'
import {NextRequest} from 'next/server'
import {proxy} from '../proxy'
test('sample entry and availability are public but ERP data remains session protected',()=>{
 for(const path of ['/api/demo/config','/api/demo/start'])assert.equal(proxy(new NextRequest('http://localhost'+path)).headers.get('x-middleware-next'),'1')
 assert.equal(proxy(new NextRequest('http://localhost/api/erp')).status,401)
})
