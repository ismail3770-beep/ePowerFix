import { ReactNode } from 'react';
import type { Locale } from './types';
interface TranslationContextType {
    t: (key: string) => string;
    locale: Locale;
    setLocale: (l: Locale) => void;
}
export declare function TranslationProvider({ children, defaultLocale, }: {
    children: ReactNode;
    defaultLocale?: Locale;
}): import("react").JSX.Element;
export declare function useTranslation(): TranslationContextType;
export type { Locale, TranslationContextType };
