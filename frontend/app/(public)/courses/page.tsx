'use client';

import React, { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import CourseCard from '@/components/feature/CourseCard';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { SkeletonBox, SkeletonCircle, EmptyState, LoadingSpinner } from '@/components/ui/LoadingStates';
import { useCoursesQuery } from '@/hooks/queries/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

const CourseCatalogPage = () => {
  // UI state only - data fetching handled by React Query
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  
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
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-16">
        <Container variant="header">
          <h1 className="text-4xl font-bold mb-4">Explore Our Courses</h1>
          <p className="text-xl mb-8">Learn AI programming from industry experts</p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 pr-12 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>
          </form>
        </Container>
      </div>

      {/* Filters and Course Grid */}
      <Container variant="public">
        {/* Filter Bar */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
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

              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-border rounded-lg"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => (
              <CourseCard
                key={course.id}
                course={course}
              />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
};

export default CourseCatalogPage;