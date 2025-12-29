'use client'

import { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { HeroSection } from '@/components/ui/HeroSection'
import { useI18n } from '@/lib/i18n/context'

export default function AboutPage() {
  const { t } = useI18n()
  return (
    <div className="min-h-screen bg-muted">
      {/* Hero Section */}
      <HeroSection
        title={t('about.heroTitle')}
        subtitle={t('about.heroSubtitle')}
        align="center"
        size="md"
        backgroundImage="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1920&h=600&fit=crop"
        tabletImage="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1024&h=400&fit=crop"
        mobileImage="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=768&h=300&fit=crop"
      />

      <Container variant="public" className="py-8 md:py-12 lg:py-24">
        <div>
          <div className="prose prose-lg mx-auto">

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">{t('about.missionTitle')}</h2>
              <p>
                {t('about.missionDescription')}
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">{t('about.differentTitle')}</h2>
              <div className="grid md:grid-cols-2 gap-6 not-prose">
                <div className="bg-white p-6 rounded-lg shadow-sm card-glow">
                  <h3 className="text-lg font-semibold mb-2">🤖 {t('about.featureAI')}</h3>
                  <p className="text-muted-foreground">
                    {t('about.featureAIDesc')}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm card-glow">
                  <h3 className="text-lg font-semibold mb-2">🎓 {t('about.featureExpert')}</h3>
                  <p className="text-muted-foreground">
                    {t('about.featureExpertDesc')}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm card-glow">
                  <h3 className="text-lg font-semibold mb-2">📈 {t('about.featureProgress')}</h3>
                  <p className="text-muted-foreground">
                    {t('about.featureProgressDesc')}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm card-glow">
                  <h3 className="text-lg font-semibold mb-2">🇻🇳 {t('about.featureVietnam')}</h3>
                  <p className="text-muted-foreground">
                    {t('about.featureVietnamDesc')}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('about.contactTitle')}</h2>
              <p>
                {t('about.contactDescription')}{' '}
                <a href="mailto:info@ai-elearning.com" className="text-primary">
                info@ai-elearning.com</a>
              </p>
            </section>
          </div>
        </div>
      </Container>
    </div>
  )
}