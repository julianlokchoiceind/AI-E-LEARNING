'use client'

import { useAuth } from '@/hooks/useAuth'
import { useCategoryStatsQuery, useCoursesQuery } from '@/hooks/queries/useCourses'
import { LocaleLink } from '@/components/ui/LocaleLink'
import { Container } from '@/components/ui/Container'
import { HeroSection } from '@/components/ui/HeroSection'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CategoryCard } from '@/components/feature/CategoryCard'
import CourseCard from '@/components/feature/CourseCard'
import { WaitlistSection } from '@/components/feature/WaitlistSection'
import { TestimonialsSection } from '@/components/feature/TestimonialsSection'
import { PricingSection } from '@/components/feature/PricingSection'
import { FeaturesSection } from '@/components/feature/FeaturesSection'
import { SkeletonBox } from '@/components/ui/LoadingStates'
import { useI18n } from '@/lib/i18n/context'
import { useHeaderTransparency } from '@/lib/hooks/useHeaderTransparency'
import { useEffect } from 'react'

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const { t, locale } = useI18n()
  const { setTransparent } = useHeaderTransparency()

  // Enable transparent header for homepage hero
  useEffect(() => {
    setTransparent(true)
    return () => setTransparent(false)
  }, [setTransparent])

  // Fetch category statistics with global cache (filtered by current language)
  const { data: categoryStats, loading: statsLoading } = useCategoryStatsQuery(locale)

  // Fetch latest 3 courses (filtered by current language)
  const { data: latestCoursesData, loading: coursesLoading } = useCoursesQuery({
    limit: 3,
    sort: 'newest',
    language: locale
  })
  const latestCourses = latestCoursesData?.data?.courses || []

  // Featured categories (4 main categories) - static images in codebase
  const allCategories = [
    {
      value: 'ml-basics',
      label: t('categories.ml_basics'),
      image: '/images/categories/ml-basics.png',
      count: (categoryStats?.data as any)?.['ml-basics'] || 0,
    },
    {
      value: 'generative-ai',
      label: t('categories.generative_ai'),
      image: '/images/categories/generative-ai.png',
      count: (categoryStats?.data as any)?.['generative-ai'] || 0,
    },
    {
      value: 'deep-learning',
      label: t('categories.deep_learning'),
      image: '/images/categories/deep-learning.png',
      count: (categoryStats?.data as any)?.['deep-learning'] || 0,
    },
    {
      value: 'ai-for-work',
      label: t('categories.ai_for_work'),
      image: '/images/categories/ai-for-work.jpg',
      count: (categoryStats?.data as any)?.['ai-for-work'] || 0,
    },
  ]

  // Show all 4 categories
  const categoriesToShow = allCategories

  return (
    <div>
      {/* Hero Section - Fullscreen with Parallax */}
      <HeroSection
        title={<span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">{t('homepage.heroTitle')}</span>}
        subtitle={t('homepage.heroSubtitle')}
        size="fullscreen"
        align="center"
        backgroundImage="/images/backgrounds/homepage-hero-navy.jpeg"
        overlayOpacity={0.38}
        parallax
        showScrollIndicator
        scrollIndicatorText={t('homepage.scrollToExplore')}
      >
        <LocaleLink href={isAuthenticated ? '/dashboard' : '/register'} className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto btn-interactive animate-fade-in-up stagger-1">{t('homepage.startLearning')}</Button>
        </LocaleLink>
        <LocaleLink href="/courses" className="w-full sm:w-auto">
          <Button size="lg" variant="outline" className="w-full sm:w-auto btn-interactive animate-fade-in-up stagger-2 !text-white !border-white !bg-white/10 hover:!bg-white/20">
            {t('homepage.browseCourses')}
          </Button>
        </LocaleLink>
      </HeroSection>

      {/* Course Categories Section - With Background Image */}
      <div
        className="flex-1 relative noise-overlay"
        style={{
          backgroundImage: 'url(/images/backgrounds/category-section-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-background/85 backdrop-blur-[2px]"></div>
        <Container variant="public" className="py-8 md:py-12 lg:py-24 relative z-10">
          <SectionHeader
            title={<span>{t('homepage.categoriesTitle')} <span className="gradient-text-bold">{t('homepage.categoriesTitleHighlight')}</span></span>}
            subtitle={t('homepage.categoriesSubtitle')}
            align="left"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categoriesToShow.map((category) => (
              <CategoryCard
                key={category.value}
                value={category.value}
                label={category.label}
                image={category.image}
                count={statsLoading ? 0 : category.count}
              />
            ))}
          </div>
        </Container>
      </div>

      {/* Latest/Newest Courses Section - Muted Background */}
      <div className="flex-1 bg-mesh-muted">
        <Container variant="public" className="py-8 md:py-12 lg:py-24">
          <SectionHeader
            title={<span>{t('homepage.latestCoursesTitle')} <span className="gradient-text-bold">{t('homepage.latestCoursesTitleHighlight')}</span></span>}
            subtitle={t('homepage.latestCoursesSubtitle')}
            align="left"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {coursesLoading ? (
              // Show skeleton cards while loading
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                  <SkeletonBox className="h-48 mb-4" />
                  <SkeletonBox className="h-6 mb-2" />
                  <SkeletonBox className="h-4 w-3/4" />
                </div>
              ))
            ) : (
              latestCourses.slice(0, 3).map((course: any) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  variant="homepage"
                />
              ))
            )}
          </div>

          {/* Show All Courses Button - Left aligned */}
          <div className="mt-8">
            <LocaleLink href="/courses" className="inline-block">
              <Button size="md">
                {t('homepage.showAllCourses')}
              </Button>
            </LocaleLink>
          </div>
        </Container>
      </div>

      {/* Compact Waitlist Section - White Background */}
      <WaitlistSection />

      {/* Features Section - Muted Background */}
      <div className="flex-1 bg-mesh-muted">
        <Container variant="public" className="py-8 md:py-12 lg:py-24">
          <SectionHeader
            title={t('homepage.featuresTitle')}
            subtitle={t('homepage.featuresSubtitle')}
            align="left"
          />
          <FeaturesSection />
        </Container>
      </div>

      {/* Pricing Section - White Background */}
      <div className="flex-1 bg-background noise-overlay">
        <Container variant="public" className="py-8 md:py-12 lg:py-24">
          <SectionHeader
            title={t('homepage.pricingTitle')}
            subtitle={t('homepage.pricingSubtitle')}
            align="left"
          />
          <PricingSection />
        </Container>
      </div>

      {/* Testimonials Section - Muted Background - Last section before footer */}
      <div className="flex-1 bg-mesh-muted">
        <Container variant="public" className="py-8 md:py-12 lg:py-24">
          <SectionHeader
            title={t('homepage.testimonialsTitle')}
            subtitle={t('homepage.testimonialsSubtitle')}
            align="left"
          />
          <TestimonialsSection />
        </Container>
      </div>
    </div>
  )
}