function normalizeStorageBase(storageBase: string): URL | null {
  try {
    const normalized = storageBase.endsWith('/') ? storageBase : storageBase + '/';
    const base = new URL(normalized);
    return base.protocol === 'https:' ? base : null;
  } catch {
    return null;
  }
}

function isSafeObjectKey(key: string): boolean {
  if (!key || key.startsWith('/') || key.includes('\\') || key.includes('?') || key.includes('#')) return false;
  const segments = key.split('/');
  return segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
}

export function publicAssetUrl(key: string | null | undefined, storageBase: string): string | null {
  if (!key) return null;
  const base = normalizeStorageBase(storageBase);
  if (!base) return null;

  if (/^https?:\/\//i.test(key)) {
    try {
      const candidate = new URL(key);
      if (
        candidate.protocol !== 'https:' ||
        candidate.origin !== base.origin ||
        !candidate.pathname.startsWith(base.pathname) ||
        candidate.search ||
        candidate.hash
      ) return null;
      const objectKey = decodeURIComponent(candidate.pathname.slice(base.pathname.length));
      return isSafeObjectKey(objectKey) ? candidate.toString() : null;
    } catch {
      return null;
    }
  }

  const cleanKey = key.replace(/^\/+/, '');
  if (!isSafeObjectKey(cleanKey)) return null;
  const encoded = cleanKey.split('/').map(encodeURIComponent).join('/');
  return new URL(encoded, base).toString();
}

export function objectKeyFromPublicUrl(value: string, storageBase: string): string {
  const base = normalizeStorageBase(storageBase);
  if (!base) throw new Error('Ububiko bw’amafoto ntibwateguwe neza.');

  if (!/^https?:\/\//i.test(value)) {
    const cleanKey = value.replace(/^\/+/, '');
    if (!isSafeObjectKey(cleanKey)) throw new Error('Ifoto si iya ISOKO Object Storage.');
    return cleanKey;
  }

  try {
    const candidate = new URL(value);
    if (
      candidate.protocol !== 'https:' ||
      candidate.origin !== base.origin ||
      !candidate.pathname.startsWith(base.pathname) ||
      candidate.search ||
      candidate.hash
    ) throw new Error('Ifoto si iya ISOKO Object Storage.');
    const objectKey = decodeURIComponent(candidate.pathname.slice(base.pathname.length));
    if (!isSafeObjectKey(objectKey)) throw new Error('Ifoto si iya ISOKO Object Storage.');
    return objectKey;
  } catch {
    throw new Error('Ifoto si iya ISOKO Object Storage.');
  }
}
