/**
 * Internationalization configuration
 * Supports Vietnamese (vi) and English (en)
 */

export const SUPPORTED_LOCALES = ['en', 'vi'] as const;
export type Locale = typeof SUPPORTED_LOCALES[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇺🇸',
  vi: '🇻🇳',
};

// Currency settings per locale
export const LOCALE_CURRENCIES: Record<Locale, string> = {
  en: 'USD',
  vi: 'VND',
};

// Number formatting per locale
export const LOCALE_NUMBER_FORMAT: Record<Locale, Intl.NumberFormatOptions> = {
  en: {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  },
  vi: {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  },
};

// Date formatting per locale
export const LOCALE_DATE_FORMAT: Record<Locale, Intl.DateTimeFormatOptions> = {
  en: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  vi: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
};

// Currency formatting per locale
export const LOCALE_CURRENCY_FORMAT: Record<Locale, Intl.NumberFormatOptions> = {
  en: {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  },
  vi: {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  },
};

// RTL support (for future expansion)
export const LOCALE_RTL: Record<Locale, boolean> = {
  en: false,
  vi: false,
};

export function isValidLocale(locale: string | null): locale is Locale {
  return locale !== null && SUPPORTED_LOCALES.includes(locale as Locale);
}

export function getLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];
  
  if (potentialLocale && isValidLocale(potentialLocale)) {
    return potentialLocale;
  }
  
  return DEFAULT_LOCALE;
}

export function getPathnameWithoutLocale(pathname: string): string {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];
  
  if (potentialLocale && isValidLocale(potentialLocale)) {
    return '/' + segments.slice(2).join('/');
  }
  
  return pathname;
}

export function getLocalizedPath(pathname: string, locale: Locale): string {
  const pathWithoutLocale = getPathnameWithoutLocale(pathname);
  
  if (locale === DEFAULT_LOCALE) {
    return pathWithoutLocale;
  }
  
  // Ensure clean path for Vietnamese
  const cleanPath = pathWithoutLocale === '/' ? '' : pathWithoutLocale;
  return `/${locale}${cleanPath}`;
}

export function getTextDirection(locale: Locale): 'ltr' | 'rtl' {
  return LOCALE_RTL[locale] ? 'rtl' : 'ltr';
}