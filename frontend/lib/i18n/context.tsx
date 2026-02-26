'use client';

/**
 * I18n Context - URL-based Implementation
 *
 * Supports both URL-based and client-side i18n:
 * - English: Clean URLs (/courses, /dashboard)
 * - Vietnamese: Prefixed URLs (/vi/courses, /vi/dashboard)
 * - Locale persisted in cookie for middleware
 * - Locale change triggers URL navigation
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
  const router = useRouter();
  const pathname = usePathname();

  // Initialize locale from initialLocale, URL, localStorage, or default
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

  // URL-based locale change with navigation
  const setLocale = (newLocale: Locale) => {
    const cleanPath = getPathnameWithoutLocale(pathname);
    const newPath = getLocalizedPath(cleanPath, newLocale);
    // Allow navigation if URL has a different locale prefix than newLocale
    if (newLocale === locale && pathname === newPath) return;

    setIsLoading(true);

    // Save to localStorage and cookie (cookie needed for middleware/SSR)
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
      document.cookie = `locale=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    }

    // Navigate to the new localized URL
    router.push(newPath);

    setLocaleState(newLocale);
    setTimeout(() => setIsLoading(false), 100);
  };

  // Load locale from localStorage on mount (hydration fix) and sync to cookie
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale');
    if (savedLocale && isValidLocale(savedLocale)) {
      if (savedLocale !== locale) {
        setLocaleState(savedLocale);
      }
      // Always sync cookie with localStorage to ensure middleware consistency
      document.cookie = `locale=${savedLocale};path=/;max-age=31536000;SameSite=Lax`;
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