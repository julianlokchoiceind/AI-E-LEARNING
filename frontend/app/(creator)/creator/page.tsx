'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, BookOpen, TrendingUp, Users, DollarSign, Star, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCreatorCoursesQuery, useCreateCourse } from '@/hooks/queries/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { ToastService } from '@/lib/toast/ToastService';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingStates';
import { formatCurrency } from '@/lib/utils/formatters';

const CreatorDashboard = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Use Creator Courses data and calculate statistics locally
  const {
    data: coursesResponse,
    loading: coursesLoading,
    execute: refetchCourses
  } = useCreatorCoursesQuery(!!user);
  
  const { mutate: createCourse, loading: createLoading } = useCreateCourse();

  // Extract real courses data and calculate statistics
  const courses = coursesResponse?.data?.courses || [];
  
  // Calculate ONLY real statistics from courses data - No mockups!
  const stats = React.useMemo(() => {
    if (!courses.length) return null;
    
    const published = courses.filter(c => c.status === 'published');
    const drafts = courses.filter(c => c.status === 'draft');
    const reviews = courses.filter(c => c.status === 'review');
    
    const totalRevenue = courses.reduce((sum, c) => sum + (c.stats?.total_revenue || 0), 0);
    const totalStudents = courses.reduce((sum, c) => sum + (c.stats?.total_enrollments || 0), 0);
    const totalReviews = courses.reduce((sum, c) => sum + (c.stats?.total_reviews || 0), 0);
    const avgRating = courses.length > 0 ? 
      courses.reduce((sum, c) => sum + (c.stats?.average_rating || 0), 0) / courses.length : 0;
    
    return {
      total_courses: courses.length,
      published_courses: published.length,
      draft_courses: drafts.length + reviews.length,
      total_revenue: totalRevenue,
      total_students: totalStudents,
      average_rating: avgRating,
      total_reviews: totalReviews
    };
  }, [courses]);
  
  // Real top performing courses - No mockups
  const topCourses = React.useMemo(() => {
    return courses
      .filter(c => c.stats?.total_revenue > 0)
      .sort((a, b) => (b.stats?.total_revenue || 0) - (a.stats?.total_revenue || 0))
      .slice(0, 4)
      .map(course => ({
        id: course.id,
        title: course.title,
        total_enrollments: course.stats?.total_enrollments || 0,
        total_revenue: course.stats?.total_revenue || 0,
        average_rating: course.stats?.average_rating || 0
      }));
  }, [courses]);
  
  // Simplified for real data only
  const overview = stats || {
    total_courses: 0,
    published_courses: 0,
    draft_courses: 0,
    total_revenue: 0,
    total_students: 0,
    average_rating: 0,
    total_reviews: 0
  };
  
  
  // Combined loading state
  const loading = authLoading || coursesLoading;

  useEffect(() => {
    if (!authLoading && user && (user.role !== 'creator' && user.role !== 'admin')) {
      ToastService.error('Access denied. Creator access required.');
      router.push('/dashboard');
      return;
    }
  }, [user, authLoading, router]);

  const handleCreateCourse = () => {
    createCourse({}, {
      onSuccess: (response) => {
        if (response.success && response.data?.id) {
          // Redirect based on user role
          if (user?.role === 'admin') {
            router.push(`/admin/courses/${response.data.id}/edit`);
          } else {
            router.push(`/creator/courses/${response.data.id}/edit`);
          }
        }
      }
    });
  };

  // Manual refresh function for dashboard data
  const refreshDashboard = async () => {
    if (!user) return;
    
    try {
      await refetchCourses();
      ToastService.success('Dashboard refreshed');
    } catch (error) {
      console.error('Dashboard refresh error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Loading creator dashboard..." />
      </div>
    );
  }

  if (!coursesResponse && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="Unable to load dashboard"
          description="There was a problem loading your creator dashboard. Please try again."
          action={{
            label: 'Retry',
            onClick: refreshDashboard
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Creator Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name}!</p>
            </div>
            <Button variant="primary" onClick={handleCreateCourse} disabled={createLoading}>
              {createLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Course
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(overview.total_revenue || 0)}</p>
                {overview.monthly_revenue && (
                  <p className="text-sm text-green-600">
                    +{formatCurrency(overview.monthly_revenue)} this month
                  </p>
                )}
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          {/* Total Students Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">{overview.total_students || 0}</p>
                {overview.active_students !== undefined && (
                  <p className="text-sm text-blue-600">
                    {overview.active_students} active
                  </p>
                )}
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          {/* Total Courses Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold">{overview.total_courses || 0}</p>
                {overview.published_courses !== undefined && (
                  <p className="text-sm text-indigo-600">
                    {overview.published_courses} published
                  </p>
                )}
              </div>
              <BookOpen className="w-8 h-8 text-indigo-500" />
            </div>
          </Card>

          {/* Average Rating Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold">{(overview.average_rating || 0).toFixed(1)} ⭐</p>
                {overview.total_reviews !== undefined && (
                  <p className="text-sm text-yellow-600">
                    {overview.total_reviews} reviews
                  </p>
                )}
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
        </div>


        {/* Two Column Layout for Dashboard Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performing Courses */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Top Performing Courses</h2>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            {topCourses.length === 0 ? (
              <div className="text-center py-8">
                <BarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">No performance data yet</p>
                <p className="text-gray-500 text-xs">Create and publish courses to see analytics</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topCourses.slice(0, 4).map((course: any, index: number) => (
                  <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{course.title}</h4>
                        <p className="text-xs text-gray-600">
                          {course.total_enrollments || 0} students • {course.average_rating?.toFixed(1) || '0.0'} ⭐
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(course.total_revenue || 0)}
                      </p>
                      <p className="text-xs text-gray-500">revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t">
              <Link href="/creator/courses">
                <Button variant="outline" size="sm" className="w-full">
                  View All Courses
                </Button>
              </Link>
            </div>
          </Card>

          {/* Course Status Breakdown */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Course Status</h2>
              <BookOpen className="w-5 h-5 text-gray-400" />
            </div>
            {overview.total_courses === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">No courses created yet</p>
                <Button variant="primary" onClick={handleCreateCourse} disabled={createLoading} className="mt-2">
                  {createLoading ? 'Creating...' : 'Create Your First Course'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {overview.published_courses}
                    </div>
                    <p className="text-sm text-green-700 font-medium">Published</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-3xl font-bold text-yellow-600">
                      {overview.draft_courses}
                    </div>
                    <p className="text-sm text-yellow-700 font-medium">Draft/Review</p>
                  </div>
                </div>
                
                {/* Course Performance Summary */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-3">Course Performance</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {overview.total_students}
                      </div>
                      <p className="text-xs text-blue-700">Total Students</p>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(overview.total_revenue)}
                      </div>
                      <p className="text-xs text-blue-700">Total Revenue</p>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {overview.average_rating.toFixed(1)} ⭐
                      </div>
                      <p className="text-xs text-blue-700">Avg Rating</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>



      </div>
    </div>
  );
};

export default CreatorDashboard;