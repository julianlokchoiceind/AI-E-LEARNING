'use client';

import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/lib/i18n/context';
import { SUPPORTED_LOCALES, LOCALE_NAMES, LOCALE_FLAGS, Locale } from '@/lib/i18n/config';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'inline';
  showFlag?: boolean;
  showText?: boolean;
  className?: string;
}

export function LanguageSwitcher({ 
  variant = 'dropdown',
  showFlag = true,
  showText = true,
  className = ''
}: LanguageSwitcherProps) {
  const { locale, setLocale, isLoading } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsOpen(false);
  };

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {SUPPORTED_LOCALES.map((loc) => (
          <button
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            disabled={isLoading}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              locale === loc
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {showFlag && (
              <span className="mr-1">{LOCALE_FLAGS[loc]}</span>
            )}
            {showText && LOCALE_NAMES[loc]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2"
        size="sm"
      >
        {showFlag ? (
          <span className="text-lg">{LOCALE_FLAGS[locale]}</span>
        ) : (
          <Globe className="h-4 w-4" />
        )}
        {showText && (
          <span className="hidden sm:inline">{LOCALE_NAMES[locale]}</span>
        )}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-20 min-w-[160px] bg-white border border-gray-200 rounded-lg shadow-lg py-1">
            {SUPPORTED_LOCALES.map((loc) => (
              <button
                key={loc}
                onClick={() => handleLocaleChange(loc)}
                disabled={isLoading}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                  locale === loc
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
              >
                <span className="text-lg">{LOCALE_FLAGS[loc]}</span>
                <span>{LOCALE_NAMES[loc]}</span>
                {locale === loc && (
                  <div className="ml-auto h-2 w-2 bg-blue-600 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Compact version for mobile
export function LanguageSwitcherCompact({ className = '' }: { className?: string }) {
  return (
    <LanguageSwitcher
      variant="dropdown"
      showFlag={true}
      showText={false}
      className={className}
    />
  );
}

// Inline version for footer
export function LanguageSwitcherInline({ className = '' }: { className?: string }) {
  return (
    <LanguageSwitcher
      variant="inline"
      showFlag={true}
      showText={true}
      className={className}
    />
  );
}