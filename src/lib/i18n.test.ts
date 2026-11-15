import test from 'node:test';
import assert from 'node:assert/strict';
import { detectInitialLang, DICTIONARIES, SUPPORTED_LANGUAGES } from '../i18n';
import { STATIC_PAGE_COPY, STATIC_PAGE_TRANSLATIONS_REVIEWED } from '../i18n/staticPages';

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

test('legal pages are available for all seven languages and identify Kinyarwanda as the source', () => {
  const codes = Object.keys(DICTIONARIES) as Array<keyof typeof DICTIONARIES>;
  for (const code of codes) {
    const copy = STATIC_PAGE_COPY[code];
    assert.ok(copy.terms.title);
    assert.ok(copy.terms.sourceNote);
    assert.ok(copy.privacy.title);
    assert.ok(copy.privacy.sourceNote);
    assert.ok(copy.sellerRules.title);
    assert.ok(copy.notFound.title);
    assert.equal(copy.terms.points.length, 3);
    assert.equal(copy.privacy.sections.length, 3);
    assert.equal(copy.sellerRules.prohibitedItems.length, 5);
    if (code !== 'rw') {
      assert.match(copy.terms.sourceNote, /Kinyarwanda/i);
      assert.match(copy.privacy.sourceNote, /Kinyarwanda/i);
      assert.equal(STATIC_PAGE_TRANSLATIONS_REVIEWED[code], false);
    } else {
      assert.equal(STATIC_PAGE_TRANSLATIONS_REVIEWED[code], true);
    }
  }
});
