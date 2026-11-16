import test from 'node:test';
import assert from 'node:assert/strict';
import { clearAccountScopedStorage } from './storage';

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial));
  return {
    get length() { return values.size; },
    clear() { values.clear(); },
    getItem(key: string) { return values.get(key) ?? null; },
    key(index: number) { return Array.from(values.keys())[index] ?? null; },
    removeItem(key: string) { values.delete(key); },
    setItem(key: string, value: string) { values.set(key, String(value)); },
  } as Storage;
}

test('clears account-scoped storage but preserves guest shopping preferences', async () => {
  const root = globalThis as any;
  const originalLocal = root.localStorage;
  const originalSession = root.sessionStorage;
  root.localStorage = memoryStorage({
    isoko_auth_session: 'managed-neon-auth',
    isoko_product_draft: '{"seller":"private"}',
    isoko_lang: 'rw',
    isoko_cart: '[]',
    isoko_location: '{"districtId":1}',
    isoko_followed_shops: '[]',
  });
  root.sessionStorage = memoryStorage({
    'neon-auth.session_token': 'private-token',
    'isoko.logout.notice': 'safe',
  });
  try {
    await clearAccountScopedStorage();
    assert.equal(root.localStorage.getItem('isoko_auth_session'), null);
    assert.equal(root.localStorage.getItem('isoko_product_draft'), null);
    assert.equal(root.localStorage.getItem('isoko_lang'), 'rw');
    assert.equal(root.localStorage.getItem('isoko_cart'), '[]');
    assert.equal(root.localStorage.getItem('isoko_location'), '{"districtId":1}');
    assert.equal(root.localStorage.getItem('isoko_followed_shops'), '[]');
    assert.equal(root.sessionStorage.getItem('neon-auth.session_token'), null);
    assert.equal(root.sessionStorage.getItem('isoko.logout.notice'), 'safe');
  } finally {
    if (originalLocal === undefined) delete root.localStorage; else root.localStorage = originalLocal;
    if (originalSession === undefined) delete root.sessionStorage; else root.sessionStorage = originalSession;
  }
});
