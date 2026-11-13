/**
 * Section 8.6: Client-side image processing
 * - Reads image file
 * - Redraws onto HTML5 Canvas (automatically strips EXIF/GPS metadata)
 * - Produces full (<= 1000px wide, <= 150 KB) and thumb (400px wide, ~30 KB)
 * - Rejects anything > 500 KB after compression
 */

export interface CompressedImagePair {
  fullDataUrl: string;
  thumbDataUrl: string;
  width: number;
  height: number;
  bytes: number;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Ntibishobotse gusoma ifoto. Hitamo JPG cyangwa PNG.'));
    };
    img.src = url;
  });
}

function renderResized(
  img: HTMLImageElement,
  maxWidth: number,
  targetMaxBytes: number
): { dataUrl: string; width: number; height: number; bytes: number } {
  const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
  const width = Math.max(1, Math.round(img.width * ratio));
  const height = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas ntishoboye gukora muri uyu mushakisha.');
  }

  // White background avoids transparent PNG turning black in JPEG fallback
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const mime = canvas.toDataURL('image/webp').startsWith('data:image/webp')
    ? 'image/webp'
    : 'image/jpeg';

  let quality = 0.78;
  let dataUrl = canvas.toDataURL(mime, quality);
  let bytes = Math.round((dataUrl.length * 3) / 4);

  while (bytes > targetMaxBytes && quality > 0.35) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL(mime, quality);
    bytes = Math.round((dataUrl.length * 3) / 4);
  }

  return { dataUrl, width, height, bytes };
}

export async function processProductImage(file: File): Promise<CompressedImagePair> {
  const img = await loadImageElement(file);
  const full = renderResized(img, 1000, 150 * 1024);
  const thumb = renderResized(img, 400, 35 * 1024);

  if (full.bytes > 500 * 1024) {
    throw new Error('Ifoto iracyari nini cyane (> 500 KB). Gerageza indi.');
  }

  return {
    fullDataUrl: full.dataUrl,
    thumbDataUrl: thumb.dataUrl,
    width: full.width,
    height: full.height,
    bytes: full.bytes,
  };
}
