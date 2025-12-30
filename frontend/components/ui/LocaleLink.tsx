'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { getLocalizedPath } from '@/lib/i18n/config';
import { ComponentProps } from 'react';

type LocaleLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string;
};

/**
 * LocaleLink - A locale-aware wrapper around next/link
 *
 * Automatically prefixes the href with the current locale.
 * Use this instead of next/link for all internal navigation.
 *
 * @example
 * <LocaleLink href="/courses">Courses</LocaleLink>
 * // With locale 'vi' → renders as /vi/courses
 * // With locale 'en' → renders as /en/courses
 */
export function LocaleLink({ href, children, ...props }: LocaleLinkProps) {
  const { locale } = useI18n();

  // Handle external URLs (http://, https://, mailto:, tel:, etc.)
  if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }

  // Localize internal paths
  const localizedHref = getLocalizedPath(href, locale);

  return (
    <Link href={localizedHref} {...props}>
      {children}
    </Link>
  );
}

export default LocaleLink;
