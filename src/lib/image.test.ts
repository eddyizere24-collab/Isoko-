import test from 'node:test';
import assert from 'node:assert/strict';
import { isUploadReadyImageMime } from './image';

test('normalized WebP, JPEG and PNG are accepted by the secure upload API', () => {
  assert.equal(isUploadReadyImageMime('image/jpeg'), true);
  assert.equal(isUploadReadyImageMime('image/png'), true);
  assert.equal(isUploadReadyImageMime('image/webp'), true);
});

test('source formats are not mistaken for the normalized upload formats', () => {
  assert.equal(isUploadReadyImageMime('image/heic'), false);
  assert.equal(isUploadReadyImageMime('image/heif'), false);
  assert.equal(isUploadReadyImageMime('image/avif'), false);
  assert.equal(isUploadReadyImageMime('application/octet-stream'), false);
});

test('MIME comparisons are case-insensitive', () => {
  assert.equal(isUploadReadyImageMime('IMAGE/WEBP'), true);
});
