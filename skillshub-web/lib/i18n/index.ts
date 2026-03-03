'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en, { TranslationKeys } from './en';
import zh from './zh';

export type Locale = 'en' | 'zh';

const translations: Record<Locale, TranslationKeys> = { en, zh };

interface I18nContextValue {
  locale: Locale;
  t: TranslationKeys;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  t: en,
  setLocale: () => {},
});

const STORAGE_KEY = 'skillsbrain-locale';

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'en' || saved === 'zh') return saved;
  const browserLang = navigator.language;
  return browserLang.startsWith('zh') ? 'zh' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getInitialLocale());
    setMounted(true);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en';
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <I18nContext.Provider value={{ locale, t: translations[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
