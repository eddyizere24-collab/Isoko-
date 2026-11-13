import { createClient } from '@neondatabase/neon-js';

// These URLs point to the isolated ISOKO setup branch. Production must use
// the separate protected Neon main branch through deploy-time VITE_* settings.
const authUrl =
  import.meta.env.VITE_NEON_AUTH_URL ||
  'https://ep-divine-salad-ba2n73kh.neonauth.c-8.eu-central-1.aws.neon.tech/isoko/auth';
const dataApiUrl =
  import.meta.env.VITE_NEON_DATA_API_URL ||
  'https://ep-divine-salad-ba2n73kh.apirest.c-8.eu-central-1.aws.neon.tech/isoko/rest/v1';
export const neonFunctionUrl =
  import.meta.env.VITE_NEON_FUNCTION_URL ||
  'https://br-raspy-resonance-baqfwhuh-isokoapi.compute.c-8.eu-central-1.aws.neon.tech/';

export const neon = createClient({
  auth: {
    url: authUrl,
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
  const result = await neon.auth.token() as any;
  const token = result?.data?.token ?? result?.token;
  if (result?.error || !token) {
    throw new Error('Ongera winjire muri konti yawe.');
  }
  return String(token);
}

export async function getNeonUser(): Promise<any | null> {
  const result = await neon.auth.getSession() as any;
  if (result?.error) return null;
  return result?.data?.user ?? result?.data?.session?.user ?? result?.user ?? null;
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
  if (!key) return null;
  if (/^https?:\/\//i.test(key)) return key;
  const cleanKey = key.replace(/^\/+/, '');
  const storageBase =
    'https://br-raspy-resonance-baqfwhuh.storage.c-8.eu-central-1.aws.neon.tech/isoko-public-assets/';
  return storageBase + cleanKey.split('/').map(encodeURIComponent).join('/');
}

export function objectKeyFromPublicUrl(value: string): string {
  if (!/^https?:\/\//i.test(value)) return value.replace(/^\/+/, '');
  const url = new URL(value);
  const marker = '/isoko-public-assets/';
  const index = url.pathname.indexOf(marker);
  if (index < 0) throw new Error('Ifoto si iya ISOKO Object Storage.');
  return decodeURIComponent(url.pathname.slice(index + marker.length));
}
