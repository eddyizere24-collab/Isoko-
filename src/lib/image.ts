/**
 * ISOKO's universal photo intake.
 *
 * Photos are decoded, resized and compressed on the device before upload.
 * The source file's MIME label and original size are never used as a rejection
 * rule. Compresso supports browser-native formats and lazy-loads the HEIC/HEIF
 * decoder only when an iPhone photo needs it.
 *
 * The upload API still receives only normalized WebP/JPEG files below 500 KB.
 */

import { compress } from 'compresso.js';

export interface CompressedImagePair {
  fullDataUrl: string;
  thumbDataUrl: string;
  width: number;
  height: number;
  bytes: number;
}

const ACCEPTED_UPLOAD_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

async function compressForUpload(
  source: File | Blob,
  maxWidth: number,
  maxSizeMB: number
) {
  const options = {
    quality: 0.84,
    maxWidth,
    maxHeight: maxWidth,
    maxSizeMB,
    maxInputPixels: 100_000_000,
    backgroundColor: '#FFFFFF',
  } as const;

  // WebP is the normal output. JPEG is the compatibility fallback for older
  // browsers; both are accepted by the secure upload Function.
  try {
    const webp = await compress(source, { ...options, format: 'webp' });
    if (ACCEPTED_UPLOAD_MIME.has(webp.mimeType)) return webp;
  } catch {
    // Retry with JPEG below. This covers browsers whose canvas cannot encode
    // WebP even when it can decode the selected source image.
  }

  const jpeg = await compress(source, { ...options, format: 'jpeg' });
  if (!ACCEPTED_UPLOAD_MIME.has(jpeg.mimeType)) {
    throw new Error('Ifoto ntiyabashije guhindurwa ngo ibikwe neza kuri ISOKO.');
  }
  return jpeg;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Ifoto ntiyabashije gutegurwa ngo yoherezwe.'));
    };
    reader.onerror = () => reject(new Error('Ifoto ntiyabashije gutegurwa ngo yoherezwe.'));
    reader.readAsDataURL(blob);
  });
}

export async function processProductImage(file: File): Promise<CompressedImagePair> {
  if (!file || file.size <= 0) {
    throw new Error('Nta foto yatoranyijwe cyangwa ifite ubusa.');
  }

  try {
    // The input may be JPG, PNG, WebP, AVIF, GIF, BMP, HEIC/HEIF, or another
    // format supported by the browser/HEIC decoder. No MIME whitelist here.
    const full = await compressForUpload(file, 1600, 0.45);
    const thumb = await compressForUpload(full.file, 480, 0.1);

    return {
      fullDataUrl: await blobToDataUrl(full.blob),
      thumbDataUrl: await blobToDataUrl(thumb.blob),
      width: full.width,
      height: full.height,
      bytes: full.compressedSize,
    };
  } catch (error) {
    const details = error instanceof Error ? error.message : '';
    if (/HEIC|HEIF|decoder|WASM/i.test(details)) {
      throw new Error('ISOKO ntishoboye gufungura iyi foto ya HEIC/HEIF kuri iki gikoresho. Ongera uyohereze uhereye kuri Gallery, cyangwa uhitemo JPEG/PNG.');
    }
    if (/pixel|resolution|memory|too large/i.test(details)) {
      throw new Error('Ifoto ifite resolution nini cyane kuri iki gikoresho. ISOKO yagerageje kuyigabanya ariko browser ntiyayifunguye.');
    }
    throw new Error(details || 'Ifoto ntiyashoboye gutunganywa. Ongera uyihitemo muri Gallery.');
  }
}
