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

const CourseCatalogPage = () => {
  const searchParams = useSearchParams();

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

  // Reset display count when filters change
  React.useEffect(() => {
    setDisplayCount(COURSES_PER_PAGE);
  }, [selectedCategory, selectedLevel, priceFilter, sortBy, searchQuery]);
  
  const { user } = useAuth();
  const router = useRouter();
  
  // React Query hooks - automatic caching and state management
  const { data: coursesData, loading, execute: refetchCourses } = useCoursesQuery({
    search: searchQuery,
    category: selectedCategory,
    level: selectedLevel,
    pricing: priceFilter === 'all' ? undefined : (priceFilter as "free" | "paid"),
    sort: sortBy as "rating" | "popular" | "newest" | "price",
  });
  
  // Extract courses from React Query response
  const courses = coursesData?.data?.courses || [];

  // Pagination logic
  const displayedCourses = courses.slice(0, displayCount);
  const remainingCount = courses.length - displayCount;
  const hasMore = remainingCount > 0;

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'ml-basics', label: 'ML Basics' },
    { value: 'deep-learning', label: 'Deep Learning' },
    { value: 'nlp', label: 'NLP' },
    { value: 'computer-vision', label: 'Computer Vision' },
    { value: 'generative-ai', label: 'Generative AI' },
    { value: 'ai-ethics', label: 'AI Ethics' },
    { value: 'ai-in-business', label: 'AI in Business' }
  ];

  const levels = [
    { value: '', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const priceOptions = [
    { value: 'all', label: 'All Courses' },
    { value: 'free', label: 'Free Courses' },
    { value: 'paid', label: 'Paid Courses' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' }
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
        title="Explore Our Courses"
        subtitle="Learn AI programming from industry experts"
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
          placeholder="Search for courses..."
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
            {loading ? 'Loading...' : `Found ${courses.length} courses`}
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
            title="No courses found"
            description="Try adjusting your filters or search query"
            action={{
              label: 'Clear filters',
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
                  Show {Math.min(remainingCount, COURSES_PER_PAGE)} more
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
                  Show fewer
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