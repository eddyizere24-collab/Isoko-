import { describe, expect, it } from 'bun:test';
import { getScaledImageDimensions } from './image';

describe('getScaledImageDimensions', () => {
  it('keeps the full aspect ratio while fitting a large image inside its bounds', () => {
    expect(getScaledImageDimensions(4000, 3000, 1600, 1600)).toEqual({
      width: 1600,
      height: 1200,
    });
  });

  it('does not enlarge smaller source images', () => {
    expect(getScaledImageDimensions(320, 180, 1600, 1600)).toEqual({
      width: 320,
      height: 180,
    });
  });

  it('never returns zero dimensions for tiny or invalid input sizes', () => {
    expect(getScaledImageDimensions(0, 0, 480, 480)).toEqual({
      width: 1,
      height: 1,
    });
  });

  it('fits portrait images without cropping their original ratio', () => {
    expect(getScaledImageDimensions(1200, 2400, 1000, 1000)).toEqual({
      width: 500,
      height: 1000,
    });
  });
});
