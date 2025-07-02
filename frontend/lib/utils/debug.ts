/**
 * Debug logging utility
 * Only shows debug logs when explicitly enabled via localStorage or env variable
 */

// Check if debug mode is enabled
const isDebugEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check localStorage for debug flag
  const debugFlag = localStorage.getItem('DEBUG_LOGS');
  return debugFlag === 'true' || debugFlag === '1';
};

// Debug logger that only logs when debug is enabled
export const debug = (namespace: string, ...args: any[]): void => {
  if (isDebugEnabled()) {
    console.debug(`[${namespace}]`, ...args);
  }
};

// Keep important logs always visible
export const log = (namespace: string, ...args: any[]): void => {
  console.log(`[${namespace}]`, ...args);
};

// Always show warnings
export const warn = (namespace: string, ...args: any[]): void => {
  console.warn(`[${namespace}]`, ...args);
};

// Always show errors
export const error = (namespace: string, ...args: any[]): void => {
  console.error(`[${namespace}]`, ...args);
};