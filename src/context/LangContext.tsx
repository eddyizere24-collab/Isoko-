import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  detectInitialLang,
  LANG_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  translate,
  type LangCode,
  type LanguageMeta,
} from '../i18n';
import type { TranslationKey } from '../i18n/rw';

interface LangContextValue {
  lang: LangCode;
  meta: LanguageMeta;
  setLang: (next: LangCode) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<LangCode>(() => {
    try {
      return detectInitialLang(window.localStorage.getItem(LANG_STORAGE_KEY));
    } catch {
      return 'rw';
    }
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // ignore storage errors in private frames
    }
  }, [lang]);

  const setLang = useCallback((next: LangCode) => {
    setLangState(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => translate(lang, key, params),
    [lang]
  );

  const meta = SUPPORTED_LANGUAGES.find((l) => l.code === lang) ?? SUPPORTED_LANGUAGES[0];

  return (
    <LangContext.Provider value={{ lang, meta, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
};

export function useT(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) {
    return {
      lang: 'rw',
      meta: SUPPORTED_LANGUAGES[0],
      setLang: () => undefined,
      t: (key, params) => translate('rw', key, params),
    };
  }
  return ctx;
}
