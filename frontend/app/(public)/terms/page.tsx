"use client";

import { Container } from '@/components/ui/Container';
import { useI18n } from '@/lib/i18n/context';

export default function TermsPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-muted">
      <Container variant="public" className="py-8 md:py-12 lg:py-24">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {t('terms.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('terms.lastUpdated')}
            </p>
          </div>

          {/* Terms Content */}
          <div className="prose prose-gray max-w-none">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.section1Title')}
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              {t('terms.section1Content')}
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.section2Title')}
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              {t('terms.section2Content')}
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.section3Title')}
            </h2>
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <p className="mb-4">
                {t('terms.section3Intro')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t('terms.section3List1')}</li>
                <li>{t('terms.section3List2')}</li>
                <li>{t('terms.section3List3')}</li>
                <li>{t('terms.section3List4')}</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.section4Title')}
            </h2>
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <p className="mb-4">
                {t('terms.section4Intro')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t('terms.section4List1')}</li>
                <li>{t('terms.section4List2')}</li>
                <li>{t('terms.section4List3')}</li>
                <li>{t('terms.section4List4')}</li>
                <li>{t('terms.section4List5')}</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.section5Title')}
            </h2>
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <p className="mb-4">
                {t('terms.section5Intro')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t('terms.section5List1')}</li>
                <li>{t('terms.section5List2')}</li>
                <li>{t('terms.section5List3')}</li>
                <li>{t('terms.section5List4')}</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.section6Title')}
            </h2>
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <p className="mb-4">
                {t('terms.section6Intro')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t('terms.section6List1')}</li>
                <li>{t('terms.section6List2')}</li>
                <li>{t('terms.section6List3')}</li>
                <li>{t('terms.section6List4')}</li>
                <li>{t('terms.section6List5')}</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.section7Title')}
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              {t('terms.section7Content')}
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.section8Title')}
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              {t('terms.section8Content')}
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.section9Title')}
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              {t('terms.section9Content')}
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.section10Title')}
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              {t('terms.section10Content')}
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.section11Title')}
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              {t('terms.section11Content')}
            </p>

            <div className="bg-primary/10 rounded-lg p-6 mt-8">
              <p className="text-sm text-muted-foreground">
                {t('terms.disclaimer')}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
