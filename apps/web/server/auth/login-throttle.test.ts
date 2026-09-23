import assert from 'node:assert/strict'
import { test } from 'node:test'

import { LOGIN_LOCK_MESSAGE, loginThrottleMessage, recordLoginFailure, recordLoginSuccess, resetLoginThrottle } from './login-throttle'

test('login locks for 60 seconds after 5 failures in the window', () => {
  resetLoginThrottle()
  const now = 1_700_000_000_000
  for (let index = 0; index < 4; index += 1) recordLoginFailure('gm@factory.local', '10.0.0.8', now + index)
  assert.equal(loginThrottleMessage('gm@factory.local', '10.0.0.8', now + 10), null)
  recordLoginFailure('gm@factory.local', '10.0.0.8', now + 20)
  assert.equal(loginThrottleMessage('gm@factory.local', '10.0.0.9', now + 30), LOGIN_LOCK_MESSAGE)
  assert.equal(loginThrottleMessage('other@factory.local', '10.0.0.8', now + 30), LOGIN_LOCK_MESSAGE)
  assert.equal(loginThrottleMessage('gm@factory.local', '10.0.0.8', now + 60_000 + 21), null)
  recordLoginSuccess('gm@factory.local', '10.0.0.8')
  recordLoginFailure('gm@factory.local', '10.1.0.1', now + 90_000)
  assert.equal(loginThrottleMessage('gm@factory.local', '10.1.0.1', now + 90_000), null)
  for (let index = 0; index < 5; index += 1) recordLoginFailure('ops@factory.local', '10.2.0.1', now + 100_000 + index)
  assert.equal(loginThrottleMessage('ops@factory.local', '10.2.0.1', now + 100_010), LOGIN_LOCK_MESSAGE)
  resetLoginThrottle()
  assert.equal(loginThrottleMessage('ops@factory.local', '10.2.0.1', now + 100_010), null)
})
