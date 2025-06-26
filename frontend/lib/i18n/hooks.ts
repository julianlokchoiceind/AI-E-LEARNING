/**
 * i18n custom hooks
 */

import { useI18n } from './context';
import { TranslationKey } from './utils';
import { formatRelativeTime, formatDuration, getCourseCategory, getCourseLevel } from './utils';

/**
 * Hook for course-specific translations
 */
export function useCourseTranslations() {
  const { locale, t } = useI18n();

  const getCategoryName = (category: string) => getCourseCategory(locale, category);
  const getLevelName = (level: string) => getCourseLevel(locale, level);
  
  const formatCourseDuration = (minutes: number) => formatDuration(locale, minutes);

  return {
    getCategoryName,
    getLevelName,
    formatCourseDuration,
    t,
  };
}

/**
 * Hook for time and date formatting
 */
export function useDateTimeFormatting() {
  const { locale, formatDate } = useI18n();

  const formatRelative = (date: Date | string, baseDate?: Date) => 
    formatRelativeTime(locale, date, baseDate);

  const formatDateTime = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    }).format(dateObj);
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  };

  return {
    formatDate,
    formatDateTime,
    formatTime,
    formatRelative,
  };
}

/**
 * Hook for form validation messages
 */
export function useValidationMessages() {
  const { t } = useI18n();

  const getRequiredMessage = (fieldName: string) => 
    t('errors.requiredField', { field: fieldName });

  const getInvalidEmailMessage = () => t('errors.invalidEmail');
  
  const getPasswordMinLengthMessage = (minLength: number) =>
    t('auth.passwordMinLength', { length: minLength.toString() });

  const getPasswordMismatchMessage = () => t('auth.passwordsMustMatch');

  return {
    getRequiredMessage,
    getInvalidEmailMessage,
    getPasswordMinLengthMessage,
    getPasswordMismatchMessage,
  };
}

/**
 * Hook for success/error message translations
 */
export function useStatusMessages() {
  const { t } = useI18n();

  const getSuccessMessage = (key: string) => {
    const successKey = `success.${key}` as TranslationKey;
    return t(successKey);
  };

  const getErrorMessage = (key: string) => {
    const errorKey = `errors.${key}` as TranslationKey;
    return t(errorKey);
  };

  return {
    getSuccessMessage,
    getErrorMessage,
  };
}

/**
 * Hook for navigation translations
 */
export function useNavigationTranslations() {
  const { t } = useI18n();

  const navItems = {
    home: t('nav.home'),
    courses: t('nav.courses'),
    about: t('nav.about'),
    contact: t('nav.contact'),
    faq: t('nav.faq'),
    pricing: t('nav.pricing'),
    dashboard: t('nav.dashboard'),
    myCourses: t('nav.myCourses'),
    certificates: t('nav.certificates'),
    profile: t('nav.profile'),
    settings: t('nav.settings'),
  };

  return { navItems, t };
}

/**
 * Hook for number and currency formatting
 */
export function useNumberFormatting() {
  const { locale, formatNumber, formatCurrency } = useI18n();

  const formatPercent = (value: number, maximumFractionDigits = 1) => {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      maximumFractionDigits,
    }).format(value / 100);
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${formatNumber(Math.round(size * 10) / 10)} ${units[unitIndex]}`;
  };

  const formatCompactNumber = (num: number) => {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
  };

  return {
    formatNumber,
    formatCurrency,
    formatPercent,
    formatFileSize,
    formatCompactNumber,
  };
}

/**
 * Hook for pluralization
 */
export function usePluralization() {
  const { t, locale } = useI18n();

  const pluralize = (count: number, singular: string, plural?: string) => {
    // For Vietnamese, typically no plural form distinction
    if (locale === 'vi') {
      return singular;
    }
    
    // For English and other languages
    if (count === 1) {
      return singular;
    }
    
    return plural || `${singular}s`;
  };

  const formatWithCount = (count: number, singular: string, plural?: string) => {
    const word = pluralize(count, singular, plural);
    return `${count} ${word}`;
  };

  return {
    pluralize,
    formatWithCount,
  };
}

/**
 * Hook for search and filtering
 */
export function useSearchTranslations() {
  const { t } = useI18n();

  return {
    searchPlaceholder: t('common.search'),
    noResults: t('faq.noResults'),
    tryDifferentKeywords: t('faq.tryDifferentKeywords'),
    filter: t('common.filter'),
    sort: t('common.sort'),
    all: t('common.all'),
  };
}

/**
 * Hook for modal and dialog translations
 */
export function useModalTranslations() {
  const { t } = useI18n();

  return {
    close: t('common.close'),
    cancel: t('common.cancel'),
    confirm: t('common.confirm'),
    save: t('common.save'),
    delete: t('common.delete'),
    yes: t('common.yes'),
    no: t('common.no'),
  };
}