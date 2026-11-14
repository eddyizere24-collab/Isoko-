/**
 * Universal browser-side photo intake for ISOKO.
 *
 * Accepts image/* files without trusting the browser's MIME label or the
 * original file size. The browser decoder reads supported raster formats,
 * then Canvas normalizes them to JPEG/WebP, strips EXIF/GPS metadata, keeps
 * the original aspect ratio, and compresses both display and thumbnail sizes.
 *
 * The upload API deliberately remains limited to JPEG/PNG/WebP and 500 KB;
 * the original file never reaches that API.
 */

export interface CompressedImagePair {
  fullDataUrl: string;
  thumbDataUrl: string;
  width: number;
  height: number;
  bytes: number;
}

interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  release?: () => void;
}

export function getScaledImageDimensions(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const safeWidth = Math.max(1, Math.floor(sourceWidth));
  const safeHeight = Math.max(1, Math.floor(sourceHeight));
  const scale = Math.min(1, maxWidth / safeWidth, maxHeight / safeHeight);
  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
  };
}

async function decodeImage(file: File): Promise<DecodedImage> {
  // createImageBitmap supports more browser-native formats than a hard-coded
  // MIME allow-list and respects image orientation on supported browsers.
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      if (bitmap.width > 0 && bitmap.height > 0) {
        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          release: () => bitmap.close(),
        };
      }
      bitmap.close();
    } catch {
      // Try the HTMLImageElement decoder below for browsers with partial support.
    }
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      if (!width || !height) {
        reject(new Error('Iyi foto ntishobora gusomwa kuri telefoni cyangwa browser ukoresha.'));
        return;
      }
      resolve({ source: img, width, height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Iyi foto ntishobora gusomwa kuri telefoni cyangwa browser ukoresha. Gerageza kuyifungura muri Gallery, wongere uyihitemo.'));
    };

    img.src = objectUrl;
  });
}

function canvasBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob && blob.size > 0) resolve(blob);
      else reject(new Error('Browser ntiyabashije gutunganya iyi foto.'));
    }, mime, quality);
  });
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

async function renderResized(
  image: DecodedImage,
  maxWidth: number,
  targetMaxBytes: number
): Promise<{ dataUrl: string; width: number; height: number; bytes: number }> {
  const initial = getScaledImageDimensions(image.width, image.height, maxWidth, maxWidth);
  let width = initial.width;
  let height = initial.height;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Browser ntiyashoboye gufungura igikoresho cyo gutunganya amafoto.');

  // WebP is widely supported by current Android browsers. JPEG is the
  // compatibility fallback; both are accepted by the secure upload endpoint.
  const probe = document.createElement('canvas');
  const supportsWebP = probe.toDataURL('image/webp').startsWith('data:image/webp');
  const mime = supportsWebP ? 'image/webp' : 'image/jpeg';

  let bestBlob: Blob | null = null;
  let bestWidth = width;
  let bestHeight = height;

  // First reduce encoding quality, then resolution. The final result is kept
  // below the API's 500 KB decoded-image limit even for very large originals.
  for (let sizeAttempt = 0; sizeAttempt < 9; sizeAttempt += 1) {
    canvas.width = width;
    canvas.height = height;
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, width, height);
    context.drawImage(image.source, 0, 0, width, height);

    for (const quality of [0.84, 0.76, 0.68, 0.58, 0.48, 0.38, 0.28, 0.2]) {
      const blob = await canvasBlob(canvas, mime, quality);
      if (!bestBlob || blob.size < bestBlob.size) {
        bestBlob = blob;
        bestWidth = width;
        bestHeight = height;
      }
      if (blob.size <= targetMaxBytes) {
        return {
          dataUrl: await blobToDataUrl(blob),
          width,
          height,
          bytes: blob.size,
        };
      }
    }

    width = Math.max(48, Math.floor(width * 0.78));
    height = Math.max(48, Math.floor(height * 0.78));
  }

  if (bestBlob && bestBlob.size <= 500 * 1024) {
    return {
      dataUrl: await blobToDataUrl(bestBlob),
      width: bestWidth,
      height: bestHeight,
      bytes: bestBlob.size,
    };
  }

  throw new Error('Ifoto ni nini cyane ku buryo browser itabashije kuyitunganya. Ongera ugerageze kuyifungura muri Gallery.');
}

export async function processProductImage(file: File): Promise<CompressedImagePair> {
  if (!file || file.size <= 0) {
    throw new Error('Nta foto yatoranyijwe cyangwa ifite ubusa.');
  }

  // Do not reject by file.type or original file size. Some Android galleries
  // label valid photos as application/octet-stream or leave MIME blank.
  const image = await decodeImage(file);
  try {
    const full = await renderResized(image, 1600, 450 * 1024);
    const thumb = await renderResized(image, 480, 100 * 1024);

    return {
      fullDataUrl: full.dataUrl,
      thumbDataUrl: thumb.dataUrl,
      width: full.width,
      height: full.height,
      bytes: full.bytes,
    };
  } finally {
    image.release?.();
  }
}
