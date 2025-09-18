'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  const [dropdownPosition, setDropdownPosition] = useState({ right: 0, top: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsOpen(false);
  };

  // Calculate dropdown position - consistent with CategoryDropdown pattern
  useEffect(() => {
    if (buttonRef.current && isOpen) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        right: window.innerWidth - rect.right,
        top: 64 // Header height - consistent with CategoryDropdown
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

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
                ? 'bg-primary/20 text-primary font-medium'
                : 'nav-hover'
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
        ref={buttonRef}
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
        <div
          ref={dropdownRef}
          className="fixed z-20 min-w-[160px] bg-background border border-border rounded-lg shadow-lg py-1"
          style={{
            right: dropdownPosition.right,
            top: dropdownPosition.top
          }}
        >
          {SUPPORTED_LOCALES.map((loc) => (
            <button
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              disabled={isLoading}
              className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                locale === loc
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'nav-hover'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-lg">{LOCALE_FLAGS[loc]}</span>
              <span>{LOCALE_NAMES[loc]}</span>
              {locale === loc && (
                <div className="ml-auto h-2 w-2 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
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