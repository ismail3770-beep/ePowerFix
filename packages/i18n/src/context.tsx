'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { Locale } from './types'
import bn from './locales/bn.json'
import en from './locales/en.json'

const translations = { bn, en } as const
type TranslationMap = typeof bn

interface TranslationContextType {
  t: (key: string) => string
  locale: Locale
  setLocale: (l: Locale) => void
}

const TranslationContext = createContext<TranslationContextType>({
  t: (k) => k,
  locale: 'bn',
  setLocale: () => {},
})

export function TranslationProvider({
  children,
  defaultLocale = 'bn',
}: {
  children: ReactNode
  defaultLocale?: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(
    () =>
      (typeof window !== 'undefined'
        ? (localStorage.getItem('epf_locale') as Locale)
        : null) || defaultLocale
  )

  const t = useCallback(
    (key: string): string => {
      return translations[locale]?.[key as keyof TranslationMap] ?? key
    },
    [locale]
  )

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    if (typeof window !== 'undefined') localStorage.setItem('epf_locale', l)
  }, [])

  return (
    <TranslationContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  return useContext(TranslationContext)
}

export type { Locale, TranslationContextType }
