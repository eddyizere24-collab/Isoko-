import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAuthenticatedCredentials } from './neonSession';

test('rejects an anonymous Data API token when there is no Better Auth user session', () => {
  const credentials = resolveAuthenticatedCredentials(
    { data: { user: null } },
    { data: { token: 'anonymous-data-api-token' } }
  );
  assert.equal(credentials, null);
});

test('rejects a saved session marker when the real JWT is missing', () => {
  const credentials = resolveAuthenticatedCredentials(
    { data: { user: { id: 'user-123' } } },
    { data: { token: null } }
  );
  assert.equal(credentials, null);
});

test('rejects auth errors even when a cached token-like value exists', () => {
  const credentials = resolveAuthenticatedCredentials(
    { data: { user: { id: 'user-123' } } },
    { error: { message: 'signed_out' }, data: { token: 'stale-token' } }
  );
  assert.equal(credentials, null);
});

test('accepts a real user session paired with a non-empty JWT', () => {
  const credentials = resolveAuthenticatedCredentials(
    { data: { user: { id: 'user-123' } } },
    { data: { token: '  signed-user-jwt  ' } }
  );
  assert.deepEqual(credentials, { userId: 'user-123', token: 'signed-user-jwt' });
});
