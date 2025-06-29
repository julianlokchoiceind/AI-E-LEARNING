/**
 * Main i18n export
 */

export { en } from './translations/en';
export { vi } from './translations/vi';
export * from './config';
export { 
  t, 
  getTranslation, 
  formatNumber, 
  formatCurrency, 
  formatDate, 
  formatRelativeTime,
  sortByLocale,
  searchByLocale
} from './utils';
export * from './hooks';
export * from './context';