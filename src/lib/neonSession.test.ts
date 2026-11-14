import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAuthenticatedCredentials } from './neonSession';

test('rejects an anonymous Data API session when there is no Better Auth user', () => {
  const credentials = resolveAuthenticatedCredentials({
    data: {
      user: null,
      session: { access_token: 'anonymous-data-api-token' },
    },
  });
  assert.equal(credentials, null);
});

test('rejects a saved session marker when the JWT is missing', () => {
  const credentials = resolveAuthenticatedCredentials({
    data: { user: { id: 'user-123' }, session: { access_token: null } },
  });
  assert.equal(credentials, null);
});

test('rejects auth errors even when a cached session-like value exists', () => {
  const credentials = resolveAuthenticatedCredentials({
    error: { message: 'signed_out' },
    data: {
      user: { id: 'user-123' },
      session: { access_token: 'stale-token' },
    },
  });
  assert.equal(credentials, null);
});

test('accepts the documented Managed Neon Auth session.access_token JWT', () => {
  const credentials = resolveAuthenticatedCredentials({
    data: {
      user: { id: 'user-123' },
      session: { access_token: '  signed-user-jwt  ' },
    },
  });
  assert.deepEqual(credentials, { userId: 'user-123', token: 'signed-user-jwt' });
});

test('accepts the user from the session when the response omits data.user', () => {
  const credentials = resolveAuthenticatedCredentials({
    data: {
      session: {
        user: { id: 'user-456' },
        access_token: 'session-jwt',
      },
    },
  });
  assert.deepEqual(credentials, { userId: 'user-456', token: 'session-jwt' });
});
