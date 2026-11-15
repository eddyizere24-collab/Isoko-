import { en } from './en';
import { fr } from './fr';
import { ln } from './ln';
import { lg } from './lg';
import { rn } from './rn';
import { rw, type TranslationKey } from './rw';
import { sw } from './sw';

export type LangCode = 'rw' | 'en' | 'fr' | 'sw' | 'rn' | 'ln' | 'lg';

export interface LanguageMeta {
  code: LangCode;
  shortCode: string;
  label: string;
  reviewed: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'rw', shortCode: 'RW', label: 'Ikinyarwanda', reviewed: true },
  { code: 'en', shortCode: 'EN', label: 'English', reviewed: true },
  { code: 'fr', shortCode: 'FR', label: 'Français', reviewed: false },
  { code: 'sw', shortCode: 'SW', label: 'Kiswahili', reviewed: false },
  { code: 'rn', shortCode: 'RN', label: 'Ikirundi', reviewed: false },
  { code: 'ln', shortCode: 'LN', label: 'Lingála', reviewed: false },
  { code: 'lg', shortCode: 'LG', label: 'Oluganda', reviewed: false },
];

export const DICTIONARIES: Record<LangCode, Record<TranslationKey, string>> = {
  rw,
  en,
  fr,
  sw,
  rn,
  ln,
  lg,
};

export const LANG_STORAGE_KEY = 'isoko.lang';

export function isSupportedLang(value: string | null | undefined): value is LangCode {
  return value === 'rw' || value === 'en' || value === 'fr' || value === 'sw' || value === 'rn' || value === 'ln' || value === 'lg';
}

export function detectInitialLang(stored?: string | null, _browserLang?: string | null): LangCode {
  // Kinyarwanda is the default for every new visitor, regardless of browser locale.
  // A language already selected by the user always takes precedence.
  return isSupportedLang(stored) ? stored : 'rw';
}

export function translate(
  lang: LangCode,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const dict = DICTIONARIES[lang] ?? rw;
  let text = dict[key] ?? rw[key] ?? String(key);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}
