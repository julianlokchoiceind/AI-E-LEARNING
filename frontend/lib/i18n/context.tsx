'use client';

/**
 * I18n Context - Client-side Implementation
 *
 * Current approach: Client-side only (localStorage-based)
 * - Locale stored in localStorage
 * - No URL changes when switching language
 * - Works well for authenticated apps
 *
 * To upgrade to URL-based (/vi/, /en/):
 * 1. Create middleware.ts for locale detection
 * 2. Move pages to /app/[locale]/ structure
 * 3. Pass initialLocale from [locale]/layout.tsx
 * 4. Change setLocale to use router.push(`/${newLocale}${pathname}`)
 * 5. Remove localStorage dependency
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Locale,
  DEFAULT_LOCALE,
  isValidLocale,
  getPathnameWithoutLocale,
  getLocalizedPath
} from './config';
import { TranslationKey, t } from './utils';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
  formatNumber: (number: number) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: Date | string) => string;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  // Keep router and pathname for useLocalizedRouter hook
  const router = useRouter();
  const pathname = usePathname();

  // Initialize locale from initialLocale or localStorage or default
  // Note: Using client-side only i18n (no URL-based routing)
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (initialLocale && isValidLocale(initialLocale)) {
      return initialLocale;
    }

    // Try to get from localStorage (browser only)
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('locale');
      if (savedLocale && isValidLocale(savedLocale)) {
        return savedLocale;
      }

      // Try to get from browser language
      const browserLocale = navigator.language.split('-')[0];
      if (isValidLocale(browserLocale)) {
        return browserLocale;
      }
    }

    return DEFAULT_LOCALE;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Client-side only locale change (no URL navigation)
  const setLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;

    setIsLoading(true);
    setLocaleState(newLocale);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }

    // No URL change - just update state and localStorage
    // The page will re-render with new translations

    setTimeout(() => setIsLoading(false), 100);
  };

  // Load locale from localStorage on mount (hydration fix)
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale');
    if (savedLocale && isValidLocale(savedLocale) && savedLocale !== locale) {
      setLocaleState(savedLocale);
    }
  }, []);

  // Translation function bound to current locale
  const translate = (key: TranslationKey, values?: Record<string, string | number>) => {
    return t(locale, key, values);
  };

  // Format functions bound to current locale
  const formatNumber = (number: number) => {
    return new Intl.NumberFormat(locale).format(number);
  };

  const formatCurrency = (amount: number, currency?: string) => {
    const formatOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currency || (locale === 'vi' ? 'VND' : 'USD'),
    };
    
    if (locale === 'vi') {
      formatOptions.minimumFractionDigits = 0;
    }
    
    return new Intl.NumberFormat(locale, formatOptions).format(amount);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  };

  const contextValue: I18nContextType = {
    locale,
    setLocale,
    t: translate,
    formatNumber,
    formatCurrency,
    formatDate,
    isLoading,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Helper hooks for specific use cases
export function useLocale(): [Locale, (locale: Locale) => void] {
  const { locale, setLocale } = useI18n();
  return [locale, setLocale];
}

export function useTranslation() {
  const { t } = useI18n();
  return { t };
}

export function useLocalizedRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useI18n();

  const push = (href: string) => {
    const localizedHref = getLocalizedPath(href, locale);
    router.push(localizedHref);
  };

  const replace = (href: string) => {
    const localizedHref = getLocalizedPath(href, locale);
    router.replace(localizedHref);
  };

  return {
    ...router,
    push,
    replace,
    locale,
    pathname: getPathnameWithoutLocale(pathname),
  };
}