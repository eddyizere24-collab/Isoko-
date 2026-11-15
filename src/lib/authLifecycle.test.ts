import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cancelPrivateRequests,
  clearPrivateBrowserState,
  getPrivateRequestSignal,
} from './authLifecycle';

function fakeStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    get length() { return values.size; },
    clear() { values.clear(); },
    getItem(key: string) { return values.get(key) ?? null; },
    key(index: number) { return [...values.keys()][index] ?? null; },
    removeItem(key: string) { values.delete(key); },
    setItem(key: string, value: string) { values.set(key, String(value)); },
    values,
  };
}

test('logout cancellation aborts old private requests and gives new requests a fresh signal', () => {
  const previous = getPrivateRequestSignal();
  assert.equal(previous.aborted, false);

  cancelPrivateRequests();

  assert.equal(previous.aborted, true);
  assert.equal(getPrivateRequestSignal().aborted, false);
});

test('private cleanup removes account data but preserves anonymous shopping preferences', async () => {
  const local = fakeStorage({
    isoko_auth_session: 'managed-neon-auth',
    'better-auth.session_token': 'private-token',
    isoko_product_draft: '{"private":true}',
    isoko_cart: '[{"productId":"guest-product"}]',
    isoko_followed_shops: '["shop-public"]',
    isoko_recents: '["public-product"]',
    'isoko.lang': 'rw',
  });
  const session = fakeStorage({
    'neon.auth.session': 'private-session',
    'isoko_guest_filter': 'public-filter',
  });
  const fakeWindow = {
    localStorage: local,
    sessionStorage: session,
    indexedDB: { databases: async () => [] },
    caches: {
      keys: async () => ['isoko-public-assets', 'isoko-private-auth'],
      delete: async (name: string) => name === 'isoko-private-auth',
    },
  } as unknown as Window;

  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: fakeWindow,
  });

  try {
    await clearPrivateBrowserState();

    assert.equal(local.getItem('isoko_auth_session'), null);
    assert.equal(local.getItem('better-auth.session_token'), null);
    assert.equal(local.getItem('isoko_product_draft'), null);
    assert.equal(session.getItem('neon.auth.session'), null);

    assert.notEqual(local.getItem('isoko_cart'), null);
    assert.notEqual(local.getItem('isoko_followed_shops'), null);
    assert.notEqual(local.getItem('isoko_recents'), null);
    assert.equal(local.getItem('isoko.lang'), 'rw');
    assert.notEqual(session.getItem('isoko_guest_filter'), null);
  } finally {
    if (original) Object.defineProperty(globalThis, 'window', original);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});
