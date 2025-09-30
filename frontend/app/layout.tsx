import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import { Toaster } from 'react-hot-toast'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { I18nProvider } from '@/lib/i18n/context'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { getLocaleFromPath, isValidLocale, DEFAULT_LOCALE, getTextDirection } from '@/lib/i18n/config'
import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata'
import { OrganizationStructuredData, WebsiteStructuredData } from '@/components/seo/StructuredData'
import { AICursor } from '@/components/ui/AICursor'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = generateSEOMetadata({
  title: 'AI E-Learning Platform - Master AI/ML Programming',
  description: 'Learn AI and Machine Learning through high-quality video courses with intelligent AI assistants. Vietnamese AI programming education platform.',
  keywords: [
    'AI programming',
    'Machine Learning',
    'E-Learning',
    'Online Courses',
    'Vietnamese education',
    'Programming tutorials',
    'AI assistant'
  ],
  canonical: '/',
  locale: 'vi',
  alternateLocales: ['en', 'vi']
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get locale from headers set by middleware
  const headersList = headers()
  const localeFromHeaders = headersList.get('x-locale')
  const locale = localeFromHeaders && isValidLocale(localeFromHeaders) ? localeFromHeaders : DEFAULT_LOCALE
  const direction = getTextDirection(locale)

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <head>
        {/* Favicon - Single high-quality logo */}
        <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/images/logo/android-chrome-512x512.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Google Search Console Verification */}
        <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE_HERE" />
        
        {/* Core Organization Schema */}
        <OrganizationStructuredData
          name="AI E-Learning Platform"
          url={process.env.NEXT_PUBLIC_APP_URL || 'https://ai-elearning.com'}
          logo={`${process.env.NEXT_PUBLIC_APP_URL || 'https://ai-elearning.com'}/logo.png`}
          description="Vietnam's leading AI programming education platform"
          contactPoint={{
            email: 'info@ai-elearning.com',
            contactType: 'customer service'
          }}
          socialMedia={[
            'https://facebook.com/aielearning',
            'https://twitter.com/aielearning',
            'https://linkedin.com/company/aielearning'
          ]}
        />
        
        {/* Website Schema with Search */}
        <WebsiteStructuredData
          name="AI E-Learning Platform"
          url={process.env.NEXT_PUBLIC_APP_URL || 'https://ai-elearning.com'}
          description="Master AI/ML through high-quality video courses with intelligent AI assistants"
          searchAction={{
            target: `${process.env.NEXT_PUBLIC_APP_URL || 'https://ai-elearning.com'}/courses?q={search_term_string}`,
            queryInput: 'required name=search_term_string'
          }}
        />
      </head>
      
      <body className={inter.className}>
        <ErrorBoundary>
          <SessionProvider>
            <QueryProvider>
              <I18nProvider initialLocale={locale}>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                  }}
                />
                {children}
                <AICursor />
              </I18nProvider>
            </QueryProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}