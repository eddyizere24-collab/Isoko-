import test from 'node:test';
import assert from 'node:assert/strict';
import { objectKeyFromPublicUrl, publicAssetUrl } from './storageUrls';

const storageBase = 'https://assets.example.neon.tech/isoko-public-assets/';

test('builds a public URL only from a safe object key', () => {
  assert.equal(
    publicAssetUrl('products/seller-1/2026-11-14/image.webp', storageBase),
    'https://assets.example.neon.tech/isoko-public-assets/products/seller-1/2026-11-14/image.webp'
  );
});

test('does not return an untrusted external asset URL', () => {
  assert.equal(
    publicAssetUrl('https://attacker.example/isoko-public-assets/products/seller-1/image.webp', storageBase),
    null
  );
});

test('accepts a URL from the configured public bucket only', () => {
  const url = 'https://assets.example.neon.tech/isoko-public-assets/products/seller-1/image.webp';
  assert.equal(publicAssetUrl(url, storageBase), url);
});

test('rejects object-key traversal paths', () => {
  assert.equal(publicAssetUrl('products/seller-1/../seller-2/image.webp', storageBase), null);
  assert.throws(() => objectKeyFromPublicUrl('products/seller-1/../seller-2/image.webp', storageBase));
});

test('refuses to convert a public asset URL from another origin into an object key', () => {
  assert.throws(() =>
    objectKeyFromPublicUrl('https://attacker.example/isoko-public-assets/products/seller-1/image.webp', storageBase)
  );
});
