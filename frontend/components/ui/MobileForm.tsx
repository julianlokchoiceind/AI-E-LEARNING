'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, X, Check } from 'lucide-react';
import { useMobile, useMobileKeyboard } from '@/hooks/useMobile';

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
}

/**
 * Mobile-optimized input component with proper touch targets and accessibility
 */
export function MobileInput({ 
  label, 
  error, 
  hint, 
  icon, 
  clearable = false,
  onClear,
  className = '',
  type = 'text',
  ...props 
}: MobileInputProps) {
  const { isMobile } = useMobile();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isPasswordType = type === 'password';
  const inputType = isPasswordType && showPassword ? 'text' : type;

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
    onClear?.();
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="form-label-mobile">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        
        <input
          ref={inputRef}
          type={inputType}
          className={`input-mobile ${
            icon ? 'pl-10' : ''
          } ${
            (clearable && props.value) || isPasswordType ? 'pr-10' : ''
          } ${
            error ? 'border-destructive focus:ring-destructive' : ''
          } ${
            isFocused ? 'ring-2 ring-primary border-primary' : ''
          }`}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        
        {/* Clear button */}
        {clearable && props.value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground touch-target"
            aria-label="Clear input"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        {/* Password visibility toggle */}
        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground touch-target"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
      
      {hint && !error && (
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      )}
    </div>
  );
}

interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  autoResize?: boolean;
}

/**
 * Mobile-optimized textarea with auto-resize functionality
 */
export function MobileTextarea({ 
  label, 
  error, 
  hint, 
  autoResize = false,
  className = '',
  ...props 
}: MobileTextareaProps) {
  const { keyboardVisible } = useMobileKeyboard();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [props.value, autoResize]);

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="form-label-mobile">
          {label}
        </label>
      )}
      
      <textarea
        ref={textareaRef}
        className={`input-mobile resize-none ${
          error ? 'border-destructive focus:ring-destructive' : ''
        } ${
          keyboardVisible ? 'min-h-[120px]' : 'min-h-[100px]'
        }`}
        rows={autoResize ? 1 : 4}
        {...props}
      />
      
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
      
      {hint && !error && (
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      )}
    </div>
  );
}

interface MobileSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

/**
 * Mobile-optimized select component
 */
export function MobileSelect({ 
  label, 
  error, 
  hint, 
  options,
  placeholder,
  className = '',
  ...props 
}: MobileSelectProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="form-label-mobile">
          {label}
        </label>
      )}
      
      <select
        className={`input-mobile appearance-none bg-white cursor-pointer ${
          error ? 'border-destructive focus:ring-destructive' : ''
        }`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value} 
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
      
      {hint && !error && (
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      )}
    </div>
  );
}

interface MobileCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Mobile-optimized checkbox with larger touch targets
 */
export function MobileCheckbox({ 
  label, 
  checked, 
  onChange, 
  error,
  disabled = false,
  className = ''
}: MobileCheckboxProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="flex items-start space-x-3 cursor-pointer">
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="sr-only"
          />
          <div className={`
            w-5 h-5 border-2 rounded transition-colors touch-target
            ${checked 
              ? 'bg-primary border-primary' 
              : 'bg-white border-border'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${error ? 'border-destructive' : ''}
          `}>
            {checked && (
              <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5" />
            )}
          </div>
        </div>
        <span className={`text-sm leading-5 ${
          disabled ? 'text-muted-foreground' : 'text-foreground'
        }`}>
          {label}
        </span>
      </label>
      
      {error && (
        <p className="text-sm text-destructive ml-8">{error}</p>
      )}
    </div>
  );
}

interface MobileFormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

/**
 * Mobile-optimized form container with proper spacing and keyboard handling
 */
export function MobileForm({ children, onSubmit, className = '' }: MobileFormProps) {
  const { keyboardVisible } = useMobileKeyboard();

  return (
    <form 
      onSubmit={onSubmit}
      className={`form-mobile ${keyboardVisible ? 'pb-safe-area-bottom' : ''} ${className}`}
    >
      {children}
    </form>
  );
}

interface MobileFormActionsProps {
  children: React.ReactNode;
  sticky?: boolean;
  className?: string;
}

/**
 * Form actions container optimized for mobile keyboards
 */
export function MobileFormActions({ 
  children, 
  sticky = false, 
  className = '' 
}: MobileFormActionsProps) {
  const { keyboardVisible } = useMobileKeyboard();
  const { isMobile } = useMobile();

  if (sticky && isMobile) {
    return (
      <div className={`
        fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 safe-area-bottom z-40
        ${keyboardVisible ? 'translate-y-0' : 'translate-y-0'}
        transition-transform duration-200
        ${className}
      `}>
        {children}
      </div>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 ${className}`}>
      {children}
    </div>
  );
}