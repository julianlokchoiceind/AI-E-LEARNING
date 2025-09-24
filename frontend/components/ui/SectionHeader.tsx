import React from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface SectionHeaderProps {
  title: string | React.ReactNode;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  align?: 'left' | 'center';
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionLabel,
  actionHref,
  align = 'left',
  className = ''
}) => {
  const alignClasses = align === 'center' ? 'text-center' : 'text-left';
  const flexClasses = align === 'center' ? 'flex-col items-center' : 'md:flex-row md:justify-between md:items-end';

  return (
    <div className={`mb-8 ${className}`}>
      <div className={`flex flex-col ${flexClasses} gap-4`}>
        <div className={alignClasses}>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        {actionLabel && actionHref && (
          <Link href={actionHref}>
            <Button variant="outline" className="flex-shrink-0">
              {actionLabel}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};