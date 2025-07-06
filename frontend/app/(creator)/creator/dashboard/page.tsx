'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  BookOpen, 
  BarChart, 
  Clock,
  Plus,
  Eye,
  Edit,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { useCreatorDashboardQuery } from '@/hooks/queries/useCreatorCourses';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';
import { ToastService } from '@/lib/toast/ToastService';

interface DashboardStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalStudents: number;
  activeStudents: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
  totalReviews: number;
}

interface RecentCourse {
  id: string;
  title: string;
  status: string;
  students: number;
  revenue: number;
  rating: number;
  lastUpdated: string;
}

const CreatorDashboardPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  // React Query hook for dashboard data
  const { 
    data: dashboardResponse, 
    loading, 
    execute: refetchDashboard 
  } = useCreatorDashboardQuery(user?.id || '', !!user?.id);

  // Check permissions
  useEffect(() => {
    if (user && user.role !== 'creator' && user.role !== 'admin') {
      ToastService.error('Access denied. Creator access required.');
      router.push('/dashboard');
    }
  }, [user, router]);

  // Memoized computed stats and courses from React Query data
  const { stats, recentCourses } = useMemo(() => {
    if (!dashboardResponse?.success || !dashboardResponse.data?.courses) {
      return {
        stats: {
          totalCourses: 0,
          publishedCourses: 0,
          draftCourses: 0,
          totalStudents: 0,
          activeStudents: 0,
          totalRevenue: 0,
          monthlyRevenue: 0,
          averageRating: 0,
          totalReviews: 0
        },
        recentCourses: []
      };
    }

    const courses = dashboardResponse.data.courses;

    // Calculate statistics
    const publishedCourses = courses.filter((c: any) => c.status === 'published');
    const draftCourses = courses.filter((c: any) => c.status === 'draft');
    
    // Aggregate stats from courses
    let totalStudents = 0;
    let totalRevenue = 0;
    let totalRatings = 0;
    let totalReviews = 0;

    publishedCourses.forEach((course: any) => {
      totalStudents += course.stats?.total_enrollments || 0;
      totalRevenue += course.stats?.total_revenue || 0;
      totalRatings += (course.stats?.average_rating || 0) * (course.stats?.total_reviews || 0);
      totalReviews += course.stats?.total_reviews || 0;
    });

    const averageRating = totalReviews > 0 ? totalRatings / totalReviews : 0;

    // Calculate monthly revenue (simplified - last 30 days)
    // For now, estimate monthly revenue as 10% of total (in real app, would fetch from payments)
    const monthlyRevenue = totalRevenue * 0.1;

    const computedStats = {
      totalCourses: courses.length,
      publishedCourses: publishedCourses.length,
      draftCourses: draftCourses.length,
      totalStudents,
      activeStudents: Math.floor(totalStudents * 0.3), // Estimate 30% active
      totalRevenue,
      monthlyRevenue,
      averageRating,
      totalReviews
    };

    // Set recent courses (last 5)
    const recent = courses.slice(0, 5).map((course: any) => ({
      id: course._id,
      title: course.title,
      status: course.status,
      students: course.stats?.total_enrollments || 0,
      revenue: course.stats?.total_revenue || 0,
      rating: course.stats?.average_rating || 0,
      lastUpdated: course.updated_at
    }));

    return { stats: computedStats, recentCourses: recent };
  }, [dashboardResponse]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-600 bg-green-100';
      case 'draft':
        return 'text-gray-600 bg-gray-100';
      case 'review':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            <Button
              onClick={() => router.push('/creator/courses/new')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New Course
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-sm text-green-600">
                  +{formatCurrency(stats.monthlyRevenue)} this month
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
                <p className="text-sm text-blue-600">
                  {stats.activeStudents} active
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold">{stats.totalCourses}</p>
                <p className="text-sm text-indigo-600">
                  {stats.publishedCourses} published
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-indigo-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)} ⭐</p>
                <p className="text-sm text-yellow-600">
                  {stats.totalReviews} reviews
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/creator/courses/new')}
              className="justify-start"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Course
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/creator/courses')}
              className="justify-start"
            >
              <Edit className="w-4 h-4 mr-2" />
              Manage Courses
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/creator/analytics')}
              className="justify-start"
            >
              <BarChart className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </Card>

        {/* Recent Courses */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Courses</h2>
            <Button
              variant="ghost"
              onClick={() => router.push('/creator/courses')}
              className="text-blue-600"
            >
              View All →
            </Button>
          </div>
          
          {recentCourses.length > 0 ? (
            <div className="space-y-4">
              {recentCourses.map((course: any) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{course.title}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(course.status)}`}>
                        {course.status}
                      </span>
                      <span className="text-sm text-gray-600">
                        {course.students} students
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(course.revenue)} revenue
                      </span>
                      {course.rating > 0 && (
                        <span className="text-sm text-gray-600">
                          {course.rating.toFixed(1)} ⭐
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
                      <BarChart className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/creator/courses/${course.id}/edit`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/courses/${course.id}`)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No courses yet</p>
              <Button onClick={() => router.push('/creator/courses/new')}>
                Create Your First Course
              </Button>
            </div>
          )}
        </Card>

        {/* Performance Tips */}
        <Card className="p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">💡 Performance Tips</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Keep your content updated</h4>
                <p className="text-sm text-gray-600">
                  Regular updates help maintain student engagement and improve rankings
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Respond to student questions</h4>
                <p className="text-sm text-gray-600">
                  Quick responses lead to better reviews and higher completion rates
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Encourage reviews</h4>
                <p className="text-sm text-gray-600">
                  Ask satisfied students to leave reviews to attract more enrollments
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CreatorDashboardPage;