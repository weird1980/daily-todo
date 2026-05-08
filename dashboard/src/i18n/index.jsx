import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { LOCALES, SUPPORTED_LOCALES } from './locales.js';

const STORAGE_KEY = 'todo.locale';
const FALLBACK_LOCALE = 'en';

function detectInitialLocale() {
  if (typeof window === 'undefined') return FALLBACK_LOCALE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LOCALES.includes(stored)) return stored;

  const browser = (navigator.language || FALLBACK_LOCALE).slice(0, 2).toLowerCase();
  return SUPPORTED_LOCALES.includes(browser) ? browser : FALLBACK_LOCALE;
}

function interpolate(template, params) {
  return template.replace(/\{(\w+)\}/g, (_, name) =>
    params[name] !== undefined ? String(params[name]) : `{${name}}`
  );
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(detectInitialLocale);

  const setLocale = useCallback((next) => {
    if (!SUPPORTED_LOCALES.includes(next)) return;
    window.localStorage.setItem(STORAGE_KEY, next);
    setLocaleState(next);
  }, []);

  const value = useMemo(() => {
    const dict = LOCALES[locale] || LOCALES[FALLBACK_LOCALE];
    const t = (key, params = {}) => {
      const template = dict[key] ?? LOCALES[FALLBACK_LOCALE][key] ?? key;
      return typeof template === 'string' ? interpolate(template, params) : template;
    };
    return { locale, setLocale, t, months: dict.months };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT must be used inside I18nProvider');
  return ctx;
}

export { SUPPORTED_LOCALES, LOCALES };
