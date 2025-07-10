'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, BookOpen, TrendingUp, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCreatorDashboardQuery, useCreateCourse } from '@/hooks/queries/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { ToastService } from '@/lib/toast/ToastService';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingStates';

const CreatorDashboard = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // React Query hooks
  const { 
    data: dashboardResponse, 
    loading: dashboardLoading, 
    execute: refetchDashboard 
  } = useCreatorDashboardQuery(!!user);
  
  const { mutate: createCourse, loading: createLoading } = useCreateCourse();

  // Extract data from React Query response
  const dashboardData = dashboardResponse?.data || null;
  const courses = dashboardData?.courses || [];
  const stats = dashboardData?.stats || {
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    avgRating: 0,
  };

  // Combined loading state
  const loading = authLoading || dashboardLoading;

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
        if (response.success && response.data?._id) {
          // Redirect based on user role
          if (user?.role === 'admin') {
            router.push(`/admin/courses/${response.data._id}/edit`);
          } else {
            router.push(`/creator/courses/${response.data._id}/edit`);
          }
        }
      }
    });
  };

  // Manual refresh function for dashboard data
  const refreshDashboard = async () => {
    if (!user) return;
    
    try {
      await refetchDashboard();
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

  if (!dashboardData) {
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
            <h1 className="text-2xl font-bold">Creator Dashboard</h1>
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
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold">{stats.totalCourses}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">${(stats.totalRevenue || 0).toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-indigo-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold">{(stats.avgRating || 0).toFixed(1)} ⭐</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/creator/courses">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <BookOpen className="w-8 h-8 text-blue-500 mb-3" />
              <h3 className="font-semibold mb-2">Manage Courses</h3>
              <p className="text-sm text-gray-600">View and edit your courses</p>
            </Card>
          </Link>

          <Link href="/creator/analytics">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <TrendingUp className="w-8 h-8 text-green-500 mb-3" />
              <h3 className="font-semibold mb-2">View Analytics</h3>
              <p className="text-sm text-gray-600">Track your course performance</p>
            </Card>
          </Link>

          <div onClick={handleCreateCourse}>
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <Plus className="w-8 h-8 text-indigo-500 mb-3" />
              <h3 className="font-semibold mb-2">Create Course</h3>
              <p className="text-sm text-gray-600">Start a new course</p>
            </Card>
          </div>
        </div>

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
                  key={course._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <h3 className="font-semibold">{course.title}</h3>
                    <p className="text-sm text-gray-600">
                      {course.stats?.total_enrollments || 0} students • {' '}
                      {course.total_lessons || 0} lessons • {' '}
                      <span className={`font-medium ${
                        course.status === 'published' ? 'text-green-600' : 
                        course.status === 'review' ? 'text-yellow-600' : 'text-gray-600'
                      }`}>
                        {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                      </span>
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/creator/courses/${course._id}/edit`)}
                  >
                    Edit
                  </Button>
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