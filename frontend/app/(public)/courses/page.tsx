'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, Sparkles, TrendingUp, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModernCourseCard, AnimatedButton, GlassCard } from '@/components/ui/modern/ModernComponents';
import { CourseCardSkeleton, EmptyState } from '@/components/ui/LoadingStates';
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
  
  // Extract courses from React Query response or use fallback data
  const displayCourses = courses.length > 0 ? courses : [
    {
      id: '1',
      title: 'AI Programming Fundamentals',
      description: 'Learn the basics of AI programming with Python, machine learning algorithms, and neural networks.',
      thumbnail: '/api/placeholder/400/225',
      instructor: 'Dr. Minh Nguyen',
      duration: '12h 30m',
      students: 2340,
      rating: 4.9,
      price: 0,
      level: 'Beginner' as const,
      category: 'AI Fundamentals',
      isPremium: false
    },
    {
      id: '2',
      title: 'Advanced React Patterns',
      description: 'Master advanced React concepts including custom hooks, context patterns, and performance optimization.',
      thumbnail: '/api/placeholder/400/225',
      instructor: 'Sarah Chen',
      duration: '8h 45m',
      students: 1250,
      rating: 4.8,
      price: 99,
      level: 'Advanced' as const,
      category: 'React',
      isPremium: true
    },
    {
      id: '3',
      title: 'Machine Learning with Python',
      description: 'Deep dive into machine learning algorithms, data preprocessing, and model evaluation techniques.',
      thumbnail: '/api/placeholder/400/225',
      instructor: 'Alex Kim',
      duration: '15h 20m',
      students: 3200,
      rating: 4.9,
      price: 149,
      level: 'Intermediate' as const,
      category: 'Machine Learning',
      isPremium: true
    },
    {
      id: '4',
      title: 'Deep Learning Fundamentals',
      description: 'Understanding neural networks, backpropagation, and implementing deep learning models from scratch.',
      thumbnail: '/api/placeholder/400/225',
      instructor: 'Dr. Lisa Wang',
      duration: '20h 15m',
      students: 1890,
      rating: 4.7,
      price: 199,
      level: 'Advanced' as const,
      category: 'Deep Learning',
      isPremium: true
    },
    {
      id: '5',
      title: 'JavaScript for Beginners',
      description: 'Complete beginner guide to JavaScript programming with hands-on projects and real-world examples.',
      thumbnail: '/api/placeholder/400/225',
      instructor: 'Tom Wilson',
      duration: '6h 30m',
      students: 4500,
      rating: 4.6,
      price: 0,
      level: 'Beginner' as const,
      category: 'Programming',
      isPremium: false
    },
    {
      id: '6',
      title: 'Computer Vision with OpenCV',
      description: 'Learn computer vision techniques, image processing, and object detection using OpenCV and Python.',
      thumbnail: '/api/placeholder/400/225',
      instructor: 'Maria Rodriguez',
      duration: '18h 45m',
      students: 1650,
      rating: 4.8,
      price: 179,
      level: 'Intermediate' as const,
      category: 'Computer Vision',
      isPremium: true
    }
  ];

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
    const course = displayCourses.find((c: any) => c.id === courseId || c._id === courseId);
    if (!course) {
      ToastService.error('Something went wrong');
      return;
    }

    // Check if it's a free course or user has premium access
    if (course.price === 0 || user.premiumStatus) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 mr-3 text-yellow-300" />
              <span className="text-yellow-300 font-semibold text-lg">Discover & Learn</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Explore Our <span className="text-yellow-300">Courses</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Master AI programming from industry experts with hands-on projects and real-world applications
            </p>
            
            {/* Enhanced Search Bar */}
            <motion.form 
              onSubmit={handleSearch} 
              className="max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <GlassCard variant="light" className="p-2">
                <div className="relative flex items-center">
                  <Search className="w-6 h-6 text-gray-400 ml-4" />
                  <input
                    type="text"
                    placeholder="Search for courses, instructors, or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-4 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none text-lg"
                  />
                  <AnimatedButton
                    variant="gradient"
                    size="md"
                    className="mr-2"
                  >
                    Search
                  </AnimatedButton>
                </div>
              </GlassCard>
            </motion.form>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-300">150+</div>
                <div className="text-blue-100">Courses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-300">10k+</div>
                <div className="text-blue-100">Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-300">94%</div>
                <div className="text-blue-100">Success Rate</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Filters and Course Grid */}
      <div className="container mx-auto px-6 py-12">
        {/* Enhanced Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <GlassCard variant="light" className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Category Filter */}
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="appearance-none bg-white px-4 py-3 pr-8 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                {/* Level Filter */}
                <div className="relative">
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="appearance-none bg-white px-4 py-3 pr-8 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  >
                    {levels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                {/* Price Filter */}
                <div className="relative">
                  <select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="appearance-none bg-white px-4 py-3 pr-8 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  >
                    {priceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                {/* Mobile Filter Toggle */}
                <AnimatedButton
                  variant="ghost"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                  icon={<Filter className="w-4 h-4" />}
                >
                  Filters
                </AnimatedButton>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white px-4 py-3 pr-8 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Enhanced Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <p className="text-gray-700 font-medium">
              {loading ? 'Loading...' : `Found ${displayCourses.length} courses`}
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Updated daily</span>
          </div>
        </motion.div>

        {/* Enhanced Course Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {[...Array(6)].map((_, index) => (
                <CourseCardSkeleton key={index} />
              ))}
            </motion.div>
          ) : displayCourses.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
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
            </motion.div>
          ) : (
            <motion.div
              key="courses"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {displayCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <ModernCourseCard
                    {...course}
                    variant={index % 4 === 1 ? 'featured' : 'default'}
                    onClick={() => {
                      router.push(`/courses/${course.id}`);
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CourseCatalogPage;