'use client'

import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { LocaleLink } from '@/components/ui/LocaleLink'
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
                <LocaleLink href="/" className="flex-shrink-0">
                  <Image
                    src="/images/logo/heartht-logo-192x192.png"
                    alt="HEART HT"
                    width={50}
                    height={50}
                    className="w-9 h-9 md:w-[50px] md:h-[50px]"
                  />
                </LocaleLink>
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
                <LocaleLink href="/courses" className="link-hover text-sm">
                  {t('courses.allCourses')}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/pricing" className="link-hover text-sm">
                  {t('nav.pricing')}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/faq" className="link-hover text-sm">
                  {t('nav.faq')}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/about" className="link-hover text-sm">
                  {t('nav.about')}
                </LocaleLink>
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
                <LocaleLink href="/contact" className="link-hover text-sm">
                  {t('nav.contact')}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/support" className="link-hover text-sm">
                  {t('support.helpCenter')}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/terms" className="link-hover text-sm">
                  {t('footer.terms')}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/privacy" className="link-hover text-sm">
                  {t('footer.privacy')}
                </LocaleLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            © 2025{' '}
            <LocaleLink href="/" className="link-hover font-medium">
              CHOICE
            </LocaleLink>{' '}
            AI E-Learning Platform. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  )
}
