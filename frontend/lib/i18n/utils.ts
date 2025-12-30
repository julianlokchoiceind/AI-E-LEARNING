/**
 * i18n utility functions
 */

import { Locale, LOCALE_CURRENCIES, LOCALE_DATE_FORMAT, LOCALE_NUMBER_FORMAT, LOCALE_CURRENCY_FORMAT } from './config';
import { en } from './translations/en';
import { vi } from './translations/vi';

// Translation map
const translations = {
  en,
  vi,
} as const;

// Type for translation keys (deeply nested)
type TranslationKeys = typeof en;
type DotNotation<T, K extends keyof T = keyof T> = K extends string
  ? T[K] extends Record<string, any>
    ? `${K}.${DotNotation<T[K]>}`
    : K
  : never;

export type TranslationKey = DotNotation<TranslationKeys>;

/**
 * Get translation value by key
 */
export function getTranslation(
  locale: Locale,
  key: TranslationKey,
  fallback?: string
): string {
  const translation = translations[locale];

  if (!translation) {
    return fallback || key;
  }

  // Navigate through nested object using dot notation
  const keys = key.split('.');
  let value: any = translation;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to English if key not found in current locale
      if (locale !== 'en') {
        return getTranslation('en', key, fallback);
      }
      return fallback || key;
    }
  }

  return typeof value === 'string' ? value : fallback || key;
}

/**
 * Translation function with interpolation
 */
export function t(
  locale: Locale,
  key: TranslationKey,
  values?: Record<string, string | number>
): string {
  let translation = getTranslation(locale, key);

  if (values) {
    // Simple interpolation: replace {{key}} with values
    Object.entries(values).forEach(([key, value]) => {
      translation = translation.replace(
        new RegExp(`{{${key}}}`, 'g'),
        String(value)
      );
    });
  }

  return translation;
}

/**
 * Format number according to locale
 */
export function formatNumber(
  locale: Locale,
  number: number,
  options?: Intl.NumberFormatOptions
): string {
  const defaultOptions = LOCALE_NUMBER_FORMAT[locale];
  const formatOptions = { ...defaultOptions, ...options };

  return new Intl.NumberFormat(locale, formatOptions).format(number);
}

/**
 * Format currency according to locale
 */
export function formatCurrency(
  locale: Locale,
  amount: number,
  currency?: string
): string {
  const defaultCurrency = LOCALE_CURRENCIES[locale];
  const formatOptions = {
    ...LOCALE_CURRENCY_FORMAT[locale],
    currency: currency || defaultCurrency,
  };

  return new Intl.NumberFormat(locale, formatOptions).format(amount);
}

/**
 * Format date according to locale
 */
export function formatDate(
  locale: Locale,
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions = LOCALE_DATE_FORMAT[locale];
  const formatOptions = { ...defaultOptions, ...options };

  return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
}
