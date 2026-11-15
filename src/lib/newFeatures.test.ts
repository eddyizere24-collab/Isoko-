import test from 'node:test';
import assert from 'node:assert/strict';
import { DICTIONARIES, detectInitialLang, translate } from '../i18n';
import { rw } from '../i18n/rw';
import { calculateProfileCompletion } from './profileCompletion';
import { ScrollPositionStore } from './scrollRestoration';

test('all 6 language dictionaries match rw keyset completely', () => {
  const baseKeys = Object.keys(rw).sort();
  for (const [lang, dict] of Object.entries(DICTIONARIES)) {
    const keys = Object.keys(dict).sort();
    assert.deepEqual(keys, baseKeys, `Mismatch in dictionary keys for ${lang}`);
  }
});

test('detectInitialLang resolves stored or browser prefix or defaults to rw', () => {
  assert.equal(detectInitialLang('fr', 'en-US'), 'fr');
  assert.equal(detectInitialLang(null, 'sw-TZ'), 'sw');
  assert.equal(detectInitialLang(null, 'ln-CD'), 'ln');
  assert.equal(detectInitialLang(null, 'de-DE'), 'rw');
});

test('translate substitutes parameters cleanly', () => {
  assert.equal(translate('rw', 'profile_completion', { n: 75 }), 'Profile yuzuye 75%');
  assert.equal(translate('en', 'only_left', { n: 2 }), 'Only 2 left');
});

test('calculateProfileCompletion returns accurate percentage and missing items', () => {
  const empty = calculateProfileCompletion(
    { full_name: '', avatar_path: null, bio: '' },
    null
  );
  assert.equal(empty.percent, 0);

  const partial = calculateProfileCompletion(
    { full_name: 'Mugisha Paul', avatar_path: '/a.jpg', bio: 'Best shoes in Kigali' },
    {
      name: 'Iduka',
      logo_path: '/logo.jpg',
      cover_path: null,
      about: 'Quality shoes',
      district_id: 1,
      landmark: 'Nyabugogo',
      hours_text: '08:00-20:00',
      delivery_text: '2h Kigali',
      social_links: {},
    }
  );
  assert.equal(partial.completedCount, 6);
  assert.equal(partial.totalCount, 8);
  assert.equal(partial.percent, 75);
});

test('ScrollPositionStore saves, restores, and caps scroll positions cleanly', () => {
  const store = new ScrollPositionStore();
  store.save('/', 420);
  store.save('/shakisha?q=inkweto', 880);
  assert.equal(store.get('/'), 420);
  assert.equal(store.get('/shakisha?q=inkweto'), 880);
  assert.equal(store.get('/unknown'), 0);

  for (let i = 0; i < 45; i++) {
    store.save(`/route-${i}`, i * 10);
  }
  assert.equal(store.get('/route-44'), 440);
  assert.equal(store.get('/'), 0);
});
