'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { useI18n } from '@/lib/i18n/context'

export function Footer() {
  const { t } = useI18n()

  return (
    <footer className="bg-muted/30 border-t">
      <Container variant="header" className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <div className="flex mb-2">
                <Link href="/" className="flex-shrink-0">
                  <Image
                    src="/images/logo/choice-logo-192x192.png"
                    alt="CHOICE"
                    width={48}
                    height={48}
                    className="w-10 h-10 md:w-12 md:h-12"
                  />
                </Link>
              </div>
              <h3 className="text-lg font-bold gradient-text">AI E-Learning Platform</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              {t('footer.companyDescription')}
            </p>
            <div className="flex space-x-4">
              <a href="https://www.youtube.com/@choiceind" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-red-600">
                <span className="sr-only">YouTube</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              {t('nav.courses')}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/courses" className="link-hover text-sm">
                  {t('courses.allCourses')}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="link-hover text-sm">
                  {t('nav.pricing')}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="link-hover text-sm">
                  {t('nav.faq')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="link-hover text-sm">
                  {t('nav.about')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              {t('nav.support')}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="link-hover text-sm">
                  {t('nav.contact')}
                </Link>
              </li>
              <li>
                <Link href="/support" className="link-hover text-sm">
                  {t('support.helpCenter')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="link-hover text-sm">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="link-hover text-sm">
                  {t('footer.privacy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            © 2025{' '}
            <Link href="/" className="link-hover font-medium">
              CHOICE
            </Link>{' '}
            AI E-Learning Platform. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  )
}
