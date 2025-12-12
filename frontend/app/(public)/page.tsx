'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCategoryStatsQuery, useCoursesQuery } from '@/hooks/queries/useCourses'
import Link from 'next/link'
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

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const [showAllCategories, setShowAllCategories] = useState(false)

  // Fetch category statistics with global cache
  const { data: categoryStats, loading: statsLoading } = useCategoryStatsQuery()

  // Fetch latest 3 courses
  const { data: latestCoursesData, loading: coursesLoading } = useCoursesQuery({
    limit: 3,
    sort: 'newest'
  })
  const latestCourses = latestCoursesData?.data?.courses || []

  // All categories - Top 4 featured + remaining 3
  const allCategories = [
    {
      value: 'ml-basics',
      label: 'Machine Learning Basics',
      image: 'https://storage.googleapis.com/ai-elearning-uploads/course-category-thumbnail/Course_Category_Image_4purvm4purvm4pur.png',
      count: (categoryStats?.data as any)?.['ml-basics'] || 0,
    },
    {
      value: 'computer-vision',
      label: 'Computer Vision',
      image: 'https://storage.googleapis.com/ai-elearning-uploads/course-category-thumbnail/Course_Category_Image_n60jtln60jtln60j.png',
      count: (categoryStats?.data as any)?.['computer-vision'] || 0,
    },
    {
      value: 'nlp',
      label: 'Natural Language Processing',
      image: 'https://storage.googleapis.com/ai-elearning-uploads/course-category-thumbnail/Course_Category_Image_18asfy18asfy18as.png',
      count: (categoryStats?.data as any)?.['nlp'] || 0,
    },
    {
      value: 'generative-ai',
      label: 'Generative AI',
      image: 'https://storage.googleapis.com/ai-elearning-uploads/course-category-thumbnail/Course_Category_Image_e208j5e208j5e208.png',
      count: (categoryStats?.data as any)?.['generative-ai'] || 0,
    },
    {
      value: 'ai-ethics',
      label: 'AI Ethics',
      image: 'https://storage.googleapis.com/ai-elearning-uploads/course-category-thumbnail/Course_Category_Image_afdqw4afdqw4afdq.png',
      count: (categoryStats?.data as any)?.['ai-ethics'] || 0,
    },
    {
      value: 'ai-in-business',
      label: 'AI in Business',
      image: 'https://storage.googleapis.com/ai-elearning-uploads/course-category-thumbnail/Course_Category_Image_t7yezit7yezit7ye.png',
      count: (categoryStats?.data as any)?.['ai-in-business'] || 0,
    },
    {
      value: 'deep-learning',
      label: 'Deep Learning',
      image: 'https://storage.googleapis.com/ai-elearning-uploads/course-category-thumbnail/Course_Category_Image_qv0tn8qv0tn8qv0t.png',
      count: (categoryStats?.data as any)?.['deep-learning'] || 0,
    },
  ]

  // Show first 4 by default, all when expanded
  const categoriesToShow = showAllCategories ? allCategories : allCategories.slice(0, 4)

  return (
    <div>
      {/* Hero Section */}
      <HeroSection
        title={<span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Master AI Programming</span>}
        subtitle="Learn from industry experts with intelligent AI assistance"
        size="lg"
        align="center"
        backgroundImage="/images/backgrounds/homepage-hero-section.jpg"
        overlayOpacity={0.38}
      >
        <Link href={isAuthenticated ? '/dashboard' : '/register'} className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto btn-interactive animate-fade-in-up stagger-1">Start Learning</Button>
        </Link>
        <Link href="/courses" className="w-full sm:w-auto">
          <Button size="lg" variant="outline" className="w-full sm:w-auto btn-interactive animate-fade-in-up stagger-2 !text-white !border-white !bg-white/10 hover:!bg-white/20">
            Browse Courses
          </Button>
        </Link>
      </HeroSection>

      {/* Course Categories Section - With Background Image */}
      <div
        className="flex-1 relative"
        style={{
          backgroundImage: 'url(/images/backgrounds/category-section-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* White overlay for readability */}
        <div className="absolute inset-0 bg-white/95"></div>
        <Container variant="public" className="py-8 md:py-12 lg:py-24 relative z-10">
          <SectionHeader
            title={<span>Start Your <span className="gradient-text">AI Journey</span></span>}
            subtitle="From machine learning basics to cutting-edge applications"
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

          {/* Show All Categories Button */}
          <div className="mt-8">
            <Button
              size="md"
              onClick={() => setShowAllCategories(!showAllCategories)}
            >
              {showAllCategories ? 'Show Less' : 'Show All Categories'}
            </Button>
          </div>
        </Container>
      </div>

      {/* Latest/Newest Courses Section - Muted Background */}
      <div className="flex-1 bg-muted">
        <Container variant="public" className="py-8 md:py-12 lg:py-24">
          <SectionHeader
            title={<span>Coming Soon: <span className="gradient-text">First Courses</span></span>}
            subtitle="Be among the first to access our premium AI programming courses"
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
            <Link href="/courses" className="inline-block">
              <Button size="md">
                Show all courses
              </Button>
            </Link>
          </div>
        </Container>
      </div>

      {/* Compact Waitlist Section - White Background */}
      <WaitlistSection />

      {/* Features Section - Muted Background */}
      <div className="flex-1 bg-muted">
        <Container variant="public" className="py-8 md:py-12 lg:py-24">
          <SectionHeader
            title="Why Choose Our Platform"
            subtitle="Discover the features that make learning AI programming more effective and enjoyable"
            align="left"
          />
          <FeaturesSection />
        </Container>
      </div>

      {/* Pricing Section - White Background */}
      <div className="flex-1 bg-white">
        <Container variant="public" className="py-8 md:py-12 lg:py-24">
          <SectionHeader
            title="Choose Your Learning Path"
            subtitle="Select the plan that best fits your learning goals and budget"
            align="left"
          />
          <PricingSection />
        </Container>
      </div>

      {/* Testimonials Section - Muted Background - Last section before footer */}
      <div className="flex-1 bg-muted">
        <Container variant="public" className="py-8 md:py-12 lg:py-24">
          <SectionHeader
            title="Early Access Feedback"
            subtitle="Early testers are excited about what's coming"
            align="left"
          />
          <TestimonialsSection />
        </Container>
      </div>
    </div>
  )
}