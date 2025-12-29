"use client";

import { Container } from '@/components/ui/Container';
import { useI18n } from '@/lib/i18n/context';

export default function PrivacyPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-muted">
      <Container variant="public" className="py-8 md:py-12 lg:py-24">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {t('privacy.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('privacy.lastUpdated')}
            </p>
          </div>

          {/* Privacy Content */}
          <div className="prose prose-gray max-w-none">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('privacy.section1Title')}
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              {t('privacy.section1Content')}
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('privacy.section2Title')}
            </h2>
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <h3 className="text-lg font-medium mb-3">
                {t('privacy.personalInfoTitle')}
              </h3>
              <p className="mb-4">
                {t('privacy.personalInfoIntro')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-6">
                <li>{t('privacy.personalInfoList1')}</li>
                <li>{t('privacy.personalInfoList2')}</li>
                <li>{t('privacy.personalInfoList3')}</li>
                <li>{t('privacy.personalInfoList4')}</li>
                <li>{t('privacy.personalInfoList5')}</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">
                {t('privacy.usageInfoTitle')}
              </h3>
              <p className="mb-4">
                {t('privacy.usageInfoIntro')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-6">
                <li>{t('privacy.usageInfoList1')}</li>
                <li>{t('privacy.usageInfoList2')}</li>
                <li>{t('privacy.usageInfoList3')}</li>
                <li>{t('privacy.usageInfoList4')}</li>
                <li>{t('privacy.usageInfoList5')}</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">
                {t('privacy.aiInfoTitle')}
              </h3>
              <p className="mb-4">
                {t('privacy.aiInfoContent')}
              </p>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('privacy.section3Title')}
            </h2>
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <p className="mb-4">
                {t('privacy.section3Intro')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t('privacy.section3List1')}</li>
                <li>{t('privacy.section3List2')}</li>
                <li>{t('privacy.section3List3')}</li>
                <li>{t('privacy.section3List4')}</li>
                <li>{t('privacy.section3List5')}</li>
                <li>{t('privacy.section3List6')}</li>
                <li>{t('privacy.section3List7')}</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('privacy.section4Title')}
            </h2>
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <p className="mb-4">
                {t('privacy.section4Intro')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t('privacy.section4List1')}</li>
                <li>{t('privacy.section4List2')}</li>
                <li>{t('privacy.section4List3')}</li>
                <li>{t('privacy.section4List4')}</li>
                <li>{t('privacy.section4List5')}</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('privacy.section5Title')}
            </h2>
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <p className="mb-4">
                {t('privacy.section5Intro')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Stripe:</strong> {t('privacy.section5Stripe').replace('Stripe: ', '')}</li>
                <li><strong>Google OAuth:</strong> {t('privacy.section5Google').replace('Google OAuth: ', '')}</li>
                <li><strong>GitHub OAuth:</strong> {t('privacy.section5GitHub').replace('GitHub OAuth: ', '')}</li>
                <li><strong>Microsoft OAuth:</strong> {t('privacy.section5Microsoft').replace('Microsoft OAuth: ', '')}</li>
                <li><strong>Anthropic Claude:</strong> {t('privacy.section5Anthropic').replace('Anthropic Claude: ', '')}</li>
                <li><strong>YouTube:</strong> {t('privacy.section5YouTube').replace('YouTube: ', '')}</li>
                <li><strong>Cloudflare:</strong> {t('privacy.section5Cloudflare').replace('Cloudflare: ', '')}</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('privacy.section6Title')}
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              {t('privacy.section6Content')}
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('privacy.section7Title')}
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              {t('privacy.section7Content')}
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('privacy.section8Title')}
            </h2>
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <p className="mb-4">
                {t('privacy.section8Intro')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>{t('privacy.section8Access').split(':')[0]}:</strong> {t('privacy.section8Access').split(': ')[1]}</li>
                <li><strong>{t('privacy.section8Rectification').split(':')[0]}:</strong> {t('privacy.section8Rectification').split(': ')[1]}</li>
                <li><strong>{t('privacy.section8Erasure').split(':')[0]}:</strong> {t('privacy.section8Erasure').split(': ')[1]}</li>
                <li><strong>{t('privacy.section8Portability').split(':')[0]}:</strong> {t('privacy.section8Portability').split(': ')[1]}</li>
                <li><strong>{t('privacy.section8Objection').split(':')[0]}:</strong> {t('privacy.section8Objection').split(': ')[1]}</li>
              </ul>
              <p className="mt-4">
                {t('privacy.section8Contact')}
              </p>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('privacy.section9Title')}
            </h2>
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <p className="mb-4">
                {t('privacy.section9Intro')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t('privacy.section9List1')}</li>
                <li>{t('privacy.section9List2')}</li>
                <li>{t('privacy.section9List3')}</li>
                <li>{t('privacy.section9List4')}</li>
              </ul>
              <p className="mt-4">
                {t('privacy.section9Note')}
              </p>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('privacy.section10Title')}
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              {t('privacy.section10Content')}
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('privacy.section11Title')}
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              {t('privacy.section11Content')}
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('privacy.section12Title')}
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              {t('privacy.section12Content')}
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('privacy.section13Title')}
            </h2>
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <p className="mb-4">
                {t('privacy.section13Intro')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>{t('privacy.section13Email').split(':')[0]}:</strong> {t('privacy.section13Email').split(': ')[1]}</li>
                <li><strong>{t('privacy.section13Address').split(':')[0]}:</strong> {t('privacy.section13Address').split(': ')[1]}</li>
              </ul>
            </div>

            <div className="bg-primary/10 rounded-lg p-6 mt-8">
              <p className="text-sm text-muted-foreground">
                {t('privacy.disclaimer')}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
