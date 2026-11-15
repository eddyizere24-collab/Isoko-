import test from 'node:test';
import assert from 'node:assert/strict';
import { detectInitialLang, DICTIONARIES, SUPPORTED_LANGUAGES } from '../i18n';

test('every supported language contains exactly the same translation keys', () => {
  const languages = Object.keys(DICTIONARIES) as Array<keyof typeof DICTIONARIES>;
  const referenceKeys = Object.keys(DICTIONARIES.rw).sort();

  assert.equal(languages.length, 7);
  assert.equal(SUPPORTED_LANGUAGES.length, 7);

  for (const language of languages) {
    const dictionary = DICTIONARIES[language] as Record<string, unknown>;
    assert.deepEqual(Object.keys(dictionary).sort(), referenceKeys, `${language} translation keys differ from rw`);
    for (const [key, value] of Object.entries(dictionary)) {
      assert.equal(typeof value, 'string', `${language}.${key} must be a string`);
      assert.ok(value.trim().length > 0, `${language}.${key} must not be empty`);
    }
  }
});

test('a new visitor always starts in Kinyarwanda regardless of browser locale', () => {
  assert.equal(detectInitialLang(null, 'en-US'), 'rw');
  assert.equal(detectInitialLang(undefined, 'fr-FR'), 'rw');
  assert.equal(detectInitialLang('invalid', 'sw-TZ'), 'rw');
});

test('a language explicitly selected by the user takes precedence', () => {
  assert.equal(detectInitialLang('sw', 'en-US'), 'sw');
  assert.equal(detectInitialLang('lg', 'en-US'), 'lg');
});
