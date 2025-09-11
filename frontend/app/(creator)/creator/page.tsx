'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, BookOpen, TrendingUp, Users, DollarSign, Star, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { useCreatorCoursesQuery, useCreateCourse } from '@/hooks/queries/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { ToastService } from '@/lib/toast/ToastService';
import { LoadingSpinner, EmptyState, SkeletonBox, SkeletonCircle, SkeletonText } from '@/components/ui/LoadingStates';
import { formatCurrency } from '@/lib/utils/formatters';

const CreatorDashboard = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Use Creator Courses data and calculate statistics locally
  const {
    data: coursesResponse,
    loading: coursesLoading,
    execute: refetchCourses
  } = useCreatorCoursesQuery();
  
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
  const overview = {
    total_courses: stats?.total_courses || 0,
    published_courses: stats?.published_courses || 0,
    draft_courses: stats?.draft_courses || 0,
    total_revenue: stats?.total_revenue || 0,
    total_students: stats?.total_students || 0,
    average_rating: stats?.average_rating || 0,
    total_reviews: stats?.total_reviews || 0,
    active_students: undefined as number | undefined
  };
  
  
  // Combined loading state
  const loading = authLoading || coursesLoading;

  useEffect(() => {
    if (!authLoading && user && user.role !== 'creator') {
      if (user.role === 'admin') {
        // Admin redirect to admin courses
        router.push('/admin/courses');
      } else {
        // Students/others redirect to 404
        router.push('/not-found');
      }
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
      console.log('Dashboard refreshed'); // Success feedback removed
    } catch (error) {
      console.error('Dashboard refresh error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted">
        {/* Header - STATIC */}
        <div className="bg-background border-b">
          <Container variant="admin">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Creator Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {user?.name}!</p>
              </div>
              <SkeletonBox className="h-10 w-40 rounded" />
            </div>
          </Container>
        </div>
        
        {/* Stats Cards */}
        <Container variant="admin">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-background rounded-lg border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <SkeletonBox className="h-4 w-24 mb-2" />
                      <SkeletonBox className="h-8 w-16 mb-1" />
                      <SkeletonBox className="h-3 w-20" />
                    </div>
                    <SkeletonBox className="h-8 w-8 rounded" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-background rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <SkeletonBox className="h-6 w-32" />
                  <SkeletonBox className="h-5 w-5" />
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <SkeletonCircle className="h-6 w-6" />
                        <div>
                          <SkeletonBox className="h-4 w-32 mb-1" />
                          <SkeletonBox className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="text-right">
                        <SkeletonBox className="h-4 w-16 mb-1" />
                        <SkeletonBox className="h-3 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <SkeletonBox className="h-8 w-full rounded" />
                </div>
              </div>
              
              <div className="bg-background rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <SkeletonBox className="h-6 w-24" />
                  <SkeletonBox className="h-5 w-5" />
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <SkeletonBox className="h-8 w-8 mx-auto mb-1" />
                      <SkeletonBox className="h-4 w-16 mx-auto" />
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <SkeletonBox className="h-8 w-8 mx-auto mb-1" />
                      <SkeletonBox className="h-4 w-20 mx-auto" />
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <SkeletonBox className="h-5 w-32 mb-3" />
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <SkeletonBox className="h-6 w-8 mx-auto mb-1" />
                        <SkeletonBox className="h-3 w-16 mx-auto" />
                      </div>
                      <div>
                        <SkeletonBox className="h-6 w-12 mx-auto mb-1" />
                        <SkeletonBox className="h-3 w-20 mx-auto" />
                      </div>
                      <div>
                        <SkeletonBox className="h-6 w-10 mx-auto mb-1" />
                        <SkeletonBox className="h-3 w-16 mx-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (!coursesResponse && !loading) {
    return (
      <div className="space-y-6">
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
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-background border-b">
        <Container variant="admin">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Creator Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user?.name}!</p>
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
        </Container>
      </div>

      {/* Stats */}
      <Container variant="admin">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(overview.total_revenue || 0)}</p>
                <p className="text-sm text-success">
                  All-time earnings
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-success" />
            </div>
          </Card>

          {/* Total Students Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{overview.total_students || 0}</p>
                {overview.active_students !== undefined && (
                  <p className="text-sm text-primary">
                    {overview.active_students} active
                  </p>
                )}
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </Card>

          {/* Total Courses Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-2xl font-bold">{overview.total_courses || 0}</p>
                {overview.published_courses !== undefined && (
                  <p className="text-sm text-primary">
                    {overview.published_courses} published
                  </p>
                )}
              </div>
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
          </Card>

          {/* Average Rating Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">{(overview.average_rating || 0).toFixed(1)} ⭐</p>
                {overview.total_reviews !== undefined && (
                  <p className="text-sm text-warning">
                    {overview.total_reviews} reviews
                  </p>
                )}
              </div>
              <Star className="w-8 h-8 text-warning" />
            </div>
          </Card>
        </div>


        {/* Two Column Layout for Dashboard Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performing Courses */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Top Performing Courses</h2>
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>
            {topCourses.length === 0 ? (
              <div className="text-center py-8">
                <BarChart2 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No performance data yet</p>
                <p className="text-muted-foreground text-xs">Create and publish courses to see analytics</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topCourses.slice(0, 4).map((course: any, index: number) => (
                  <div key={course.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{course.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {course.total_enrollments || 0} students • {course.average_rating?.toFixed(1) || '0.0'} ⭐
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-success">
                        {formatCurrency(course.total_revenue || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">revenue</p>
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
              <BookOpen className="w-5 h-5 text-muted-foreground" />
            </div>
            {overview.total_courses === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No courses created yet</p>
                <Button variant="primary" onClick={handleCreateCourse} disabled={createLoading} className="mt-2">
                  {createLoading ? 'Creating...' : 'Create Your First Course'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-success/20 rounded-lg">
                    <div className="text-3xl font-bold text-success">
                      {overview.published_courses}
                    </div>
                    <p className="text-sm text-success font-medium">Published</p>
                  </div>
                  <div className="text-center p-4 bg-warning/20 rounded-lg">
                    <div className="text-3xl font-bold text-warning">
                      {overview.draft_courses}
                    </div>
                    <p className="text-sm text-warning font-medium">Draft/Review</p>
                  </div>
                </div>
                
                {/* Course Performance Summary */}
                <div className="mt-6 p-4 bg-primary/20 rounded-lg">
                  <h3 className="font-semibold text-primary mb-3">Course Performance</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-primary">
                        {overview.total_students}
                      </div>
                      <p className="text-xs text-primary">Total Students</p>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">
                        {formatCurrency(overview.total_revenue)}
                      </div>
                      <p className="text-xs text-primary">Total Revenue</p>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">
                        {overview.average_rating.toFixed(1)} ⭐
                      </div>
                      <p className="text-xs text-primary">Avg Rating</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

      </Container>
    </div>
  );
};

export default CreatorDashboard;