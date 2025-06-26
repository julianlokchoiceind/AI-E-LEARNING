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

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(
  locale: Locale,
  date: Date | string,
  baseDate: Date = new Date()
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((baseDate.getTime() - dateObj.getTime()) / 1000);
  
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  
  const units: Array<[string, number]> = [
    ['year', 365 * 24 * 60 * 60],
    ['month', 30 * 24 * 60 * 60],
    ['week', 7 * 24 * 60 * 60],
    ['day', 24 * 60 * 60],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ];
  
  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(diffInSeconds) >= secondsInUnit) {
      const value = Math.floor(diffInSeconds / secondsInUnit);
      return rtf.format(-value, unit as Intl.RelativeTimeFormatUnit);
    }
  }
  
  return rtf.format(0, 'second');
}

/**
 * Format duration in minutes to human readable format
 */
export function formatDuration(
  locale: Locale,
  minutes: number
): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return t(locale, 'common.hours', { hours: hours.toString(), minutes: mins.toString() });
  }
  
  return t(locale, 'common.minutes', { minutes: mins.toString() });
}

/**
 * Pluralization helper
 */
export function plural(
  locale: Locale,
  count: number,
  singular: TranslationKey,
  plural: TranslationKey,
  zero?: TranslationKey
): string {
  if (count === 0 && zero) {
    return getTranslation(locale, zero);
  }
  
  const key = count === 1 ? singular : plural;
  return getTranslation(locale, key);
}

/**
 * Get course level translation
 */
export function getCourseLevel(locale: Locale, level: string): string {
  const levelKey = `courses.${level}` as TranslationKey;
  return getTranslation(locale, levelKey, level);
}

/**
 * Get course category translation
 */
export function getCourseCategory(locale: Locale, category: string): string {
  const categoryKey = `categories.${category.replace('-', '_')}` as TranslationKey;
  return getTranslation(locale, categoryKey, category);
}

/**
 * Get error message translation
 */
export function getErrorMessage(locale: Locale, errorCode: string): string {
  const errorKey = `errors.${errorCode}` as TranslationKey;
  return getTranslation(locale, errorKey, getTranslation(locale, 'errors.generic'));
}

/**
 * Get success message translation
 */
export function getSuccessMessage(locale: Locale, successCode: string): string {
  const successKey = `success.${successCode}` as TranslationKey;
  return getTranslation(locale, successKey, getTranslation(locale, 'common.success'));
}

/**
 * Check if locale supports RTL
 */
export function isRTL(locale: Locale): boolean {
  // Currently no RTL languages supported, but ready for future expansion
  return false;
}

/**
 * Get text direction for locale
 */
export function getTextDirection(locale: Locale): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

/**
 * Sort array of items by localized string
 */
export function sortByLocale<T>(
  locale: Locale,
  items: T[],
  getStringFn: (item: T) => string
): T[] {
  const collator = new Intl.Collator(locale);
  
  return items.sort((a, b) => {
    return collator.compare(getStringFn(a), getStringFn(b));
  });
}

/**
 * Search items by localized text
 */
export function searchByLocale<T>(
  locale: Locale,
  items: T[],
  searchTerm: string,
  getStringFn: (item: T) => string
): T[] {
  const normalizedSearch = searchTerm.toLowerCase();
  
  return items.filter(item => {
    const itemText = getStringFn(item).toLowerCase();
    return itemText.includes(normalizedSearch);
  });
}