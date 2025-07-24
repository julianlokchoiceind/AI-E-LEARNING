'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, TrendingUp, Users, DollarSign, Clock, Award, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { ToastService } from '@/lib/toast/ToastService';
import { useCreatorCoursesQuery } from '@/hooks/queries/useCourses';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingStates';

const CreatorAnalyticsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30days');

  // Use Creator Courses data - same as dashboard
  const {
    data: coursesResponse,
    loading: coursesLoading,
    execute: refetchCourses
  } = useCreatorCoursesQuery({}, !!user);

  // Extract real courses data and calculate statistics
  const courses = coursesResponse?.data?.courses || [];
  
  // Calculate real analytics from courses data
  const analytics = React.useMemo(() => {
    if (!courses.length) return null;
    
    const published = courses.filter(c => c.status === 'published');
    const totalRevenue = courses.reduce((sum, c) => sum + (c.stats?.total_revenue || 0), 0);
    const totalStudents = courses.reduce((sum, c) => sum + (c.stats?.total_enrollments || 0), 0);
    const totalReviews = courses.reduce((sum, c) => sum + (c.stats?.total_reviews || 0), 0);
    const avgRating = courses.length > 0 ? 
      courses.reduce((sum, c) => sum + (c.stats?.average_rating || 0), 0) / courses.length : 0;
    
    // Revenue by course for chart
    const revenueByCoursе = courses
      .filter(c => c.stats?.total_revenue > 0)
      .map(c => ({
        name: c.title.length > 20 ? c.title.substring(0, 20) + '...' : c.title,
        value: c.stats?.total_revenue || 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    
    // Students by course for chart
    const studentsByCourse = courses
      .filter(c => c.stats?.total_enrollments > 0)
      .map(c => ({
        name: c.title.length > 20 ? c.title.substring(0, 20) + '...' : c.title,
        value: c.stats?.total_enrollments || 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    
    return {
      overview: {
        total_courses: courses.length,
        published_courses: published.length,
        total_revenue: totalRevenue,
        total_students: totalStudents,
        average_rating: avgRating,
        total_reviews: totalReviews
      },
      revenueByCoursе,
      studentsByCourse,
      courseDetails: courses.map(c => ({
        id: c.id,
        title: c.title,
        status: c.status,
        students: c.stats?.total_enrollments || 0,
        revenue: c.stats?.total_revenue || 0,
        rating: c.stats?.average_rating || 0,
        reviews: c.stats?.total_reviews || 0,
        updated: c.updated_at
      }))
    };
  }, [courses]);

  useEffect(() => {
    if (user?.role !== 'creator' && user?.role !== 'admin') {
      ToastService.error('Access denied. Creator access required.');
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  if (coursesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Loading analytics..." />
      </div>
    );
  }

  if (!analytics || courses.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="No analytics data yet"
          description="Create and publish courses to see your analytics"
          action={{
            label: 'Create First Course',
            onClick: () => router.push('/creator/courses')
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
              <h1 className="text-2xl font-bold">Analytics Overview</h1>
              <p className="text-gray-600">Track your course performance and revenue</p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/creator/courses')}
            >
              Manage Courses
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.overview.total_revenue)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  All time earnings
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">{analytics.overview.total_students}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Across all courses
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Published Courses</p>
                <p className="text-2xl font-bold">{analytics.overview.published_courses}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Out of {analytics.overview.total_courses} total
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-indigo-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold">{analytics.overview.average_rating.toFixed(1)} ⭐</p>
                <p className="text-sm text-gray-500 mt-1">
                  {analytics.overview.total_reviews} reviews
                </p>
              </div>
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        {(analytics.revenueByCoursе.length > 0 || analytics.studentsByCourse.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue by Course */}
            {analytics.revenueByCoursе.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Top Revenue Courses</h2>
                <div className="space-y-3">
                  {analytics.revenueByCoursе.map((course, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium">{course.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(course.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Students by Course */}
            {analytics.studentsByCourse.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Most Popular Courses</h2>
                <div className="space-y-3">
                  {analytics.studentsByCourse.map((course, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium">{course.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-blue-600">
                        {course.value} students
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Course Details Table */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Course Performance Details</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Course</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Students</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Revenue</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Rating</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Last Updated</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {analytics.courseDetails.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-sm">{course.title}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        course.status === 'published' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm">{course.students}</td>
                    <td className="py-3 px-4 text-right text-sm font-medium">
                      {formatCurrency(course.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm">
                      {course.rating.toFixed(1)} ⭐ ({course.reviews})
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-500">
                      {formatDate(course.updated)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/creator/courses/${course.id}/analytics`)}
                      >
                        <BarChart className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Info Message */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This analytics overview uses data from your courses. 
            For detailed analytics on individual courses, click the analytics icon next to each course.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreatorAnalyticsPage;