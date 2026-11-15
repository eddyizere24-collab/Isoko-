import test from 'node:test';
import assert from 'node:assert/strict';
import { detectInitialLang, LANG_STORAGE_KEY, isSupportedLang } from '../i18n';

test('a new visitor starts in Kinyarwanda without a saved preference', () => {
  assert.equal(detectInitialLang(null), 'rw');
  assert.equal(detectInitialLang(undefined), 'rw');
});

test('only a supported saved switcher preference overrides Kinyarwanda', () => {
  assert.equal(detectInitialLang('en'), 'en');
  assert.equal(detectInitialLang('fr'), 'fr');
  assert.equal(detectInitialLang('sw'), 'sw');
  assert.equal(detectInitialLang('not-a-language'), 'rw');
});

test('the preference key is versioned and browser locale is not an input', () => {
  assert.equal(LANG_STORAGE_KEY, 'isoko.lang.preference.v2');
  assert.equal(isSupportedLang('rw'), true);
  assert.equal(isSupportedLang('en-US'), false);
});
