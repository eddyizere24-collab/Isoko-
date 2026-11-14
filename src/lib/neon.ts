import { createClient } from '@neondatabase/neon-js';
import { resolveAuthenticatedCredentials } from './neonSession';
import { objectKeyFromPublicUrl as readPublicAssetKey, publicAssetUrl as buildPublicAssetUrl } from './storageUrls';

// Setup-branch URLs are development-only. Public builds must receive their
// own reviewed branch URLs from the hosting provider; never silently fall back
// to a test database from a production bundle.
const setupAuthUrl =
  'https://ep-divine-salad-ba2n73kh.neonauth.c-8.eu-central-1.aws.neon.tech/isoko/auth';
const setupDataApiUrl =
  'https://ep-divine-salad-ba2n73kh.apirest.c-8.eu-central-1.aws.neon.tech/isoko/rest/v1';
const setupFunctionUrl =
  'https://br-raspy-resonance-baqfwhuh-isokoapi.compute.c-8.eu-central-1.aws.neon.tech/';
const setupPublicStorageUrl =
  'https://br-raspy-resonance-baqfwhuh.storage.c-8.eu-central-1.aws.neon.tech/isoko-public-assets/';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL || (import.meta.env.DEV ? setupAuthUrl : '');
const dataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL || (import.meta.env.DEV ? setupDataApiUrl : '');
export const neonFunctionUrl =
  import.meta.env.VITE_NEON_FUNCTION_URL || (import.meta.env.DEV ? setupFunctionUrl : '');
const publicStorageUrl =
  import.meta.env.VITE_NEON_PUBLIC_STORAGE_URL || (import.meta.env.DEV ? setupPublicStorageUrl : '');

if (import.meta.env.PROD) {
  const missing = [
    ['VITE_NEON_AUTH_URL', authUrl],
    ['VITE_NEON_DATA_API_URL', dataApiUrl],
    ['VITE_NEON_FUNCTION_URL', neonFunctionUrl],
    ['VITE_NEON_PUBLIC_STORAGE_URL', publicStorageUrl],
  ].filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) {
    throw new Error('ISOKO production configuration is incomplete: ' + missing.join(', '));
  }
}

export const neon = createClient({
  auth: {
    url: authUrl,
    // Anonymous access is needed for public catalogue reads. It must never be
    // confused with a signed-in seller session (see getNeonJwt below).
    allowAnonymous: true,
  },
  dataApi: {
    url: dataApiUrl,
  },
});

export function phoneLoginEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `${digits}@login.isoko.invalid`;
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('07') && digits.length === 10) return `250${digits.slice(1)}`;
  if (digits.startsWith('7') && digits.length === 9) return `250${digits}`;
  return digits;
}

export async function getNeonJwt(): Promise<string> {
  try {
    // Managed Neon Auth keeps the Data API JWT on session.access_token.
    // auth.token() is not part of the documented SDK session flow.
    const sessionResult = await neon.auth.getSession() as any;
    const credentials = resolveAuthenticatedCredentials(sessionResult);
    if (credentials) return credentials.token;
  } catch {
    // Treat an unavailable or expired session as signed out for protected writes.
  }
  throw new Error('Igihe winjiraga cyarangiye cyangwa ntiwemejwe. Ongera winjire muri konti yawe.');
}

export async function getNeonSessionSnapshot(): Promise<{ status: 'active' | 'signed_out' | 'unavailable'; user: any | null }> {
  try {
    const result = await neon.auth.getSession() as any;
    if (result?.error) return { status: 'unavailable', user: null };
    const user = result?.data?.user ?? result?.data?.session?.user ?? result?.user ?? null;
    return user?.id ? { status: 'active', user } : { status: 'signed_out', user: null };
  } catch {
    return { status: 'unavailable', user: null };
  }
}

export async function getNeonUser(): Promise<any | null> {
  const snapshot = await getNeonSessionSnapshot();
  return snapshot.status === 'active' ? snapshot.user : null;
}

export async function signInWithGoogle(callbackURL: string): Promise<void> {
  const result = await neon.auth.signIn.social({ provider: 'google', callbackURL }) as any;
  if (result?.error) throw new Error(result.error.message ?? 'Kwinjira ukoresheje Google byanze. Ongera ugerageze.');
}

export function unwrapNeon<T>(result: any, fallbackMessage = 'Habaye ikibazo mu kubika amakuru.'): T {
  if (result?.error) {
    const message =
      result.error.message ??
      result.error.details ??
      result.error.hint ??
      fallbackMessage;
    throw new Error(String(message));
  }
  return result?.data as T;
}

export function publicAssetUrl(key: string | null | undefined): string | null {
  return buildPublicAssetUrl(key, publicStorageUrl);
}

export function objectKeyFromPublicUrl(value: string): string {
  return readPublicAssetKey(value, publicStorageUrl);
}
