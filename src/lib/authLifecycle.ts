/**
 * Browser cleanup and cancellation for private/account-scoped work.
 *
 * Public catalogue state (guest cart, viewed products, follows and language)
 * is deliberately preserved on sign-out because it is not tied to an auth user.
 */
let privateRequestController = new AbortController();

const AUTH_STORAGE_KEY_PATTERN = /(neon|better-auth|auth|session|token|private|seller|admin|profile|wishlist|saved|product_draft)/i;

export function getPrivateRequestSignal(): AbortSignal {
  return privateRequestController.signal;
}

export function cancelPrivateRequests(): void {
  privateRequestController.abort();
  privateRequestController = new AbortController();
}

function clearMatchingStorage(storage: Storage): void {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && AUTH_STORAGE_KEY_PATTERN.test(key)) keys.push(key);
  }
  for (const key of keys) {
    try {
      storage.removeItem(key);
    } catch {
      // Continue clearing the remaining keys when one storage entry is blocked.
    }
  }
}

function deleteIndexedDatabase(name: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Clears auth-related browser storage without deleting anonymous shopping data.
 * Neon Auth's signOut() remains responsible for revoking its server session and
 * clearing its HttpOnly cookie/session cache.
 */
export async function clearPrivateBrowserState(): Promise<void> {
  try {
    clearMatchingStorage(window.localStorage);
  } catch {
    // The browser may disable storage in private/restricted contexts.
  }
  try {
    clearMatchingStorage(window.sessionStorage);
  } catch {
    // Keep going if sessionStorage is blocked.
  }

  try {
    const indexedDb = window.indexedDB as IDBFactory & {
      databases?: () => Promise<Array<{ name?: string }>>;
    };
    const databases = await indexedDb.databases?.();
    const names = (databases ?? [])
      .map((database) => database.name)
      .filter((name): name is string => Boolean(name && AUTH_STORAGE_KEY_PATTERN.test(name)));
    await Promise.all(names.map(deleteIndexedDatabase));
  } catch {
    // Some older Android browsers do not expose indexedDB.databases().
  }

  try {
    const cacheNames = await window.caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => AUTH_STORAGE_KEY_PATTERN.test(name))
        .map((name) => window.caches.delete(name))
    );
  } catch {
    // Cache Storage may not be available or may be controlled by a service worker.
  }
}
