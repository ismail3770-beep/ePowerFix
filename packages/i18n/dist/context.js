'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import bn from './locales/bn.json';
import en from './locales/en.json';
const translations = { bn, en };
const TranslationContext = createContext({
    t: (k) => k,
    locale: 'bn',
    setLocale: () => { },
});
export function TranslationProvider({ children, defaultLocale = 'bn', }) {
    const [locale, setLocaleState] = useState(() => (typeof window !== 'undefined'
        ? localStorage.getItem('epf_locale')
        : null) || defaultLocale);
    const t = useCallback((key) => {
        return translations[locale]?.[key] ?? key;
    }, [locale]);
    const setLocale = useCallback((l) => {
        setLocaleState(l);
        if (typeof window !== 'undefined')
            localStorage.setItem('epf_locale', l);
    }, []);
    return (<TranslationContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </TranslationContext.Provider>);
}
export function useTranslation() {
    return useContext(TranslationContext);
}
