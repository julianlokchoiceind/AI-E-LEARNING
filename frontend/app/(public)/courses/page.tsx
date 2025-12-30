'use client';

import React, { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import CourseCard from '@/components/feature/CourseCard';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { HeroSection } from '@/components/ui/HeroSection';
import { SkeletonBox, SkeletonCircle, EmptyState, LoadingSpinner } from '@/components/ui/LoadingStates';
import { SearchBar } from '@/components/ui/SearchBar';
import { useCoursesQuery } from '@/hooks/queries/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';

const CourseCatalogPage = () => {
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();

  // UI state only - data fetching handled by React Query
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination state
  const COURSES_PER_PAGE = 20;
  const [displayCount, setDisplayCount] = useState(COURSES_PER_PAGE);

  // Update selectedCategory when URL params change (for View All functionality)
  React.useEffect(() => {
    const categoryFromUrl = searchParams.get('category') || '';
    setSelectedCategory(categoryFromUrl);
  }, [searchParams]);

  // Reset display count when filters change (including locale)
  React.useEffect(() => {
    setDisplayCount(COURSES_PER_PAGE);
  }, [selectedCategory, selectedLevel, priceFilter, sortBy, searchQuery, locale]);
  
  const { user } = useAuth();
  const router = useRouter();
  
  // React Query hooks - automatic caching and state management
  // Auto-filter courses by user's selected locale (vi/en)
  const { data: coursesData, loading, execute: refetchCourses } = useCoursesQuery({
    search: searchQuery,
    category: selectedCategory,
    level: selectedLevel,
    pricing: priceFilter === 'all' ? undefined : (priceFilter as "free" | "paid"),
    sort: sortBy as "rating" | "popular" | "newest" | "price",
    language: locale, // Filter courses by current language
  });
  
  // Extract courses from React Query response
  const courses = coursesData?.data?.courses || [];

  // Pagination logic
  const displayedCourses = courses.slice(0, displayCount);
  const remainingCount = courses.length - displayCount;
  const hasMore = remainingCount > 0;

  const categories = [
    { value: '', label: t('courses.allCategories') },
    { value: 'ml-basics', label: t('categories.ml_basics') },
    { value: 'deep-learning', label: t('categories.deep_learning') },
    { value: 'nlp', label: t('categories.nlp') },
    { value: 'computer-vision', label: t('categories.computer_vision') },
    { value: 'generative-ai', label: t('categories.generative_ai') },
    { value: 'ai-ethics', label: t('categories.ai_ethics') },
    { value: 'ai-for-work', label: t('categories.ai_for_work') }
  ];

  const levels = [
    { value: '', label: t('courses.allLevels') },
    { value: 'beginner', label: t('courses.beginner') },
    { value: 'intermediate', label: t('courses.intermediate') },
    { value: 'advanced', label: t('courses.advanced') }
  ];

  const priceOptions = [
    { value: 'all', label: t('courses.allCourses') },
    { value: 'free', label: t('courses.freeCourses') },
    { value: 'paid', label: t('courses.paidCourses') }
  ];

  const sortOptions = [
    { value: 'newest', label: t('courses.newestFirst') },
    { value: 'popular', label: t('courses.mostPopular') },
    { value: 'rating', label: t('courses.highestRated') },
    { value: 'price-low', label: t('courses.priceLowToHigh') },
    { value: 'price-high', label: t('courses.priceHighToLow') }
  ];

  // No manual fetchCourses needed - React Query handles this automatically

  const handleEnroll = (courseId: string) => {
    // This function is no longer needed as CourseCard now handles navigation directly
    // Keeping it for backward compatibility but it just navigates to course detail
    router.push(`/courses/${courseId}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // No manual trigger needed - React Query automatically refetches when searchQuery changes
    // If manual refetch is needed, use: refetchCourses();
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Hero Section */}
      <HeroSection
        title={t('courses.heroTitle')}
        subtitle={t('courses.heroSubtitle')}
        align="left"
        size="lg"
        backgroundImage="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&h=600&fit=crop"
        tabletImage="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1024&h=400&fit=crop"
        mobileImage="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=768&h=300&fit=crop"
      >
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSearch}
          placeholder={t('courses.searchPlaceholder')}
          className="w-full max-w-2xl"
        />
      </HeroSection>

      {/* Filters and Course Grid */}
      <Container variant="public">
        {/* Filter Bar */}
        <div className="mb-8">
          <div className="grid grid-cols-2 gap-4 lg:flex lg:items-center lg:gap-4">
            <div className="contents lg:contents">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              {/* Level Filter */}
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {levels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>

              {/* Price Filter */}
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {priceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {loading ? t('courses.loading') : t('courses.foundCourses').replace('{count}', String(courses.length))}
          </p>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-background rounded-lg border overflow-hidden">
                {/* Course Thumbnail */}
                <SkeletonBox className="h-48 w-full" />
                
                {/* Course Content */}
                <div className="p-6">
                  {/* Title */}
                  <SkeletonBox className="h-6 w-full mb-2" />
                  
                  {/* Description */}
                  <SkeletonBox className="h-4 w-3/4 mb-4" />
                  
                  {/* Creator */}
                  <div className="flex items-center gap-3 mb-4">
                    <SkeletonCircle className="h-8 w-8" />
                    <SkeletonBox className="h-4 w-24" />
                  </div>
                  
                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <SkeletonBox className="h-4 w-16" />
                    <SkeletonBox className="h-4 w-20" />
                    <SkeletonBox className="h-4 w-12" />
                  </div>
                  
                  {/* Price */}
                  <SkeletonBox className="h-8 w-20 mb-4" />
                  
                  {/* Button */}
                  <SkeletonBox className="h-10 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <EmptyState
            title={t('courses.noCoursesFound')}
            description={t('courses.adjustFilters')}
            action={{
              label: t('courses.clearFilters'),
              onClick: () => {
                setSearchQuery('');
                setSelectedCategory('');
                setSelectedLevel('');
                setPriceFilter('all');
                setSortBy('newest');
              }
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedCourses.map((course: any) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  variant="catalog"
                />
              ))}
            </div>

            {/* Show More Button */}
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={() => {
                    const nextBatch = Math.min(remainingCount, COURSES_PER_PAGE);
                    setDisplayCount(prev => prev + nextBatch);
                  }}
                  variant="primary"
                  size="lg"
                  className="min-w-[200px]"
                >
                  {t('courses.showMore').replace('{count}', String(Math.min(remainingCount, COURSES_PER_PAGE)))}
                </Button>
              </div>
            )}

            {/* Show Fewer Button */}
            {!hasMore && displayCount > COURSES_PER_PAGE && (
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={() => setDisplayCount(COURSES_PER_PAGE)}
                  variant="primary"
                  size="lg"
                  className="min-w-[200px]"
                >
                  {t('courses.showFewer')}
                </Button>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default CourseCatalogPage;