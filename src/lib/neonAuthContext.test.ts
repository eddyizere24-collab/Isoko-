import test from 'node:test';
import assert from 'node:assert/strict';
import { isRetryableNeonAuthContextError } from './neonAuthContext';

test('only the exact Neon AUTH_REQUIRED SQLSTATE can trigger a bounded draft retry', () => {
  assert.equal(isRetryableNeonAuthContextError({ code: '28000', message: 'AUTH_REQUIRED' }), true);
  assert.equal(isRetryableNeonAuthContextError({ code: 28000, message: 'AUTH_REQUIRED' }), true);
  assert.equal(isRetryableNeonAuthContextError({ code: '42501', message: 'AUTH_REQUIRED' }), false);
  assert.equal(isRetryableNeonAuthContextError({ code: '28000', message: 'INVALID_CREDENTIALS' }), false);
  assert.equal(isRetryableNeonAuthContextError({ message: 'AUTH_REQUIRED' }), false);
  assert.equal(isRetryableNeonAuthContextError(null), false);
});
