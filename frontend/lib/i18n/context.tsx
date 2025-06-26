'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Locale, 
  DEFAULT_LOCALE, 
  isValidLocale,
  getLocaleFromPath,
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
  
  // Initialize locale from URL path or initialLocale or localStorage or default
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (initialLocale && isValidLocale(initialLocale)) {
      return initialLocale;
    }
    
    // Try to get from URL path
    const pathLocale = getLocaleFromPath(pathname);
    if (pathLocale !== DEFAULT_LOCALE) {
      return pathLocale;
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

  // Update URL and localStorage when locale changes
  const setLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;
    
    setIsLoading(true);
    setLocaleState(newLocale);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
    
    // Update URL path
    const currentPathWithoutLocale = getPathnameWithoutLocale(pathname);
    const newPath = getLocalizedPath(currentPathWithoutLocale, newLocale);
    
    // Use router.push for navigation
    router.push(newPath);
    
    setTimeout(() => setIsLoading(false), 100);
  };

  // Sync locale with URL path changes
  useEffect(() => {
    const pathLocale = getLocaleFromPath(pathname);
    if (pathLocale !== locale) {
      setLocaleState(pathLocale);
    }
  }, [pathname, locale]);

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