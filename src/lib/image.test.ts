import { describe, expect, it } from 'bun:test';
import { isUploadReadyImageMime } from './image';

describe('isUploadReadyImageMime', () => {
  it('accepts the three normalized formats supported by the storage API', () => {
    expect(isUploadReadyImageMime('image/jpeg')).toBe(true);
    expect(isUploadReadyImageMime('image/png')).toBe(true);
    expect(isUploadReadyImageMime('image/webp')).toBe(true);
  });

  it('does not confuse source formats with normalized upload formats', () => {
    expect(isUploadReadyImageMime('image/heic')).toBe(false);
    expect(isUploadReadyImageMime('image/heif')).toBe(false);
    expect(isUploadReadyImageMime('image/avif')).toBe(false);
    expect(isUploadReadyImageMime('application/octet-stream')).toBe(false);
  });

  it('normalizes case before checking MIME types', () => {
    expect(isUploadReadyImageMime('IMAGE/WEBP')).toBe(true);
  });
});
