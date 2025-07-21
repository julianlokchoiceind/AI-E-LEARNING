'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, BookOpen, TrendingUp, Users, DollarSign, Star, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCreatorDashboardQuery, useCreateCourse, useCreatorCoursesQuery } from '@/hooks/queries/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { ToastService } from '@/lib/toast/ToastService';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingStates';
import { formatCurrency } from '@/lib/utils/formatters';
import { formatDistanceToNow } from 'date-fns';

const CreatorDashboard = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // React Query hooks - Analytics API
  const { 
    data: analyticsResponse, 
    loading: analyticsLoading, 
    execute: refetchAnalytics 
  } = useCreatorDashboardQuery(!!user);
  
  // React Query hooks - Courses
  const {
    data: coursesResponse,
    loading: coursesLoading,
    execute: refetchCourses
  } = useCreatorCoursesQuery(!!user);
  
  const { mutate: createCourse, loading: createLoading } = useCreateCourse();

  // Extract data from Analytics API response
  const overview = analyticsResponse?.data?.overview || {};
  const recentActivity = analyticsResponse?.data?.recent_activity || [];
  
  // Extract courses from courses API
  const courses = coursesResponse?.data?.courses || [];

  // Combined loading state
  const loading = authLoading || analyticsLoading || coursesLoading;

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
      await Promise.all([refetchAnalytics(), refetchCourses()]);
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

  if (!analyticsResponse && !coursesResponse) {
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
                <p className="text-2xl font-bold">{overview.total_courses || courses.length}</p>
                {courses.length > 0 && (
                  <p className="text-sm text-indigo-600">
                    {courses.filter(c => c.status === 'published').length} published
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

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={`${activity.type}-${activity.timestamp}-${index}`} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user_name}</span>
                      {activity.type === 'enrollment' && ' enrolled in '}
                      <span className="font-medium">{activity.course_title}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Courses */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Your Courses</h2>
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">You haven't created any courses yet</p>
              <Button variant="primary" onClick={handleCreateCourse} disabled={createLoading}>
                {createLoading ? 'Creating...' : 'Create Your First Course'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.slice(0, 5).map((course: any) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{course.title}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        course.status === 'published' ? 'text-green-600 bg-green-100' : 
                        course.status === 'review' ? 'text-yellow-600 bg-yellow-100' : 
                        'text-gray-600 bg-gray-100'
                      }`}>
                        {course.status}
                      </span>
                      <span className="text-sm text-gray-600">
                        {course.stats?.total_enrollments || 0} students
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(course.stats?.total_revenue || 0)} revenue
                      </span>
                      {course.stats?.average_rating > 0 && (
                        <span className="text-sm text-gray-600">
                          {course.stats.average_rating.toFixed(1)} ⭐
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/creator/courses/${course.id}/analytics`)}
                    >
                      <TrendingUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/creator/courses/${course.id}/edit`)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
              
              {courses.length > 5 && (
                <div className="text-center pt-4">
                  <Link href="/creator/courses">
                    <Button variant="outline">View All Courses</Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CreatorDashboard;