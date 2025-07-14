'use client';

import React, { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import CourseCard from '@/components/feature/CourseCard';
import { Button } from '@/components/ui/Button';
import { CourseCardSkeleton, EmptyState, LoadingSpinner } from '@/components/ui/LoadingStates';
import { useCoursesQuery, useEnrollInCourse } from '@/hooks/queries/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ToastService } from '@/lib/toast/ToastService';

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
  
  const { mutate: enrollInCourse, loading: enrollingCourse } = useEnrollInCourse();
  
  // Extract courses from React Query response
  const courses = coursesData?.data?.courses || [];

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'programming', label: 'Programming' },
    { value: 'ai-fundamentals', label: 'AI Fundamentals' },
    { value: 'machine-learning', label: 'Machine Learning' },
    { value: 'ai-tools', label: 'AI Tools' },
    { value: 'production-ai', label: 'Production AI' }
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
    // Check if user is logged in
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(`/courses/${courseId}`));
      return;
    }

    // Find the course to check pricing
    const course = courses.find((c: any) => c.id === courseId);
    if (!course) {
      ToastService.error('Something went wrong');
      return;
    }

    // Check if it's a free course or user has premium access
    if (course.pricing.is_free || user.premiumStatus) {
      // Direct enrollment for free access - React Query mutation handles error/success
      enrollInCourse({ courseId }, {
        onSuccess: () => {
          // React Query will show success toast automatically
          router.push(`/learn/${courseId}`);
        },
        // Error handling is automatic via useApiMutation
      });
    } else {
      // Redirect to payment for paid courses
      router.push(`/checkout/course/${courseId}`);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // No manual trigger needed - React Query automatically refetches when searchQuery changes
    // If manual refetch is needed, use: refetchCourses();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Explore Our Courses</h1>
          <p className="text-xl mb-8">Learn AI programming from industry experts</p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 pr-12 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-600 hover:text-gray-900"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Filters and Course Grid */}
      <div className="container mx-auto px-4 py-8">
        {/* Filter Bar */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <p className="text-gray-600">
            {loading ? 'Loading...' : `Found ${courses.length} courses`}
          </p>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <CourseCardSkeleton key={index} />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course: any) => (
              <CourseCard
                key={course.id}
                course={course}
                onEnroll={handleEnroll}
                isEnrolling={enrollingCourse}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCatalogPage;