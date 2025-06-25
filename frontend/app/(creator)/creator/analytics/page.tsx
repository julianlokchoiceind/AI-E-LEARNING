'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, TrendingUp, Users, DollarSign, Clock, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { AnalyticsChart } from '@/components/feature/AnalyticsChart';

const CreatorAnalyticsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');

  useEffect(() => {
    if (user?.role !== 'creator' && user?.role !== 'admin') {
      toast.error('Access denied. Creator access required.');
      router.push('/dashboard');
      return;
    }

    fetchAnalytics();
  }, [user, router, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(
        `/api/v1/courses/creator/analytics?time_range=${timeRange}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600 text-lg">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            
            {/* Time Range Selector */}
            <div className="flex gap-2">
              <Button
                variant={timeRange === '7days' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('7days')}
              >
                7 Days
              </Button>
              <Button
                variant={timeRange === '30days' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('30days')}
              >
                30 Days
              </Button>
              <Button
                variant={timeRange === '90days' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('90days')}
              >
                90 Days
              </Button>
              <Button
                variant={timeRange === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('all')}
              >
                All Time
              </Button>
            </div>
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
                <p className="text-2xl font-bold">${analytics.total_revenue?.toFixed(2) || 0}</p>
                <p className="text-sm text-green-600">
                  +${analytics.revenue_this_period?.toFixed(2) || 0} this period
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">{analytics.total_students || 0}</p>
                <p className="text-sm text-blue-600">
                  {analytics.active_students || 0} active
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">{analytics.completion_rate?.toFixed(1) || 0}%</p>
                <p className="text-sm text-indigo-600">
                  {analytics.lessons_completed || 0} lessons
                </p>
              </div>
              <Award className="w-8 h-8 text-indigo-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold">{analytics.average_rating?.toFixed(1) || 0} ⭐</p>
                <p className="text-sm text-yellow-600">
                  {analytics.total_courses || 0} courses
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
        </div>

        {/* Top Courses */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Top Performing Courses</h2>
          {analytics.top_courses?.length > 0 ? (
            <div className="space-y-4">
              {analytics.top_courses.map((course: any, index: number) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                    <div>
                      <h3 className="font-semibold">{course.title}</h3>
                      <p className="text-sm text-gray-600">
                        {course.students} students • ${course.revenue?.toFixed(2)} revenue
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{course.rating?.toFixed(1)} ⭐</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/creator/courses/${course.id}/analytics`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No course data available for this period</p>
          )}
        </Card>

        {/* Engagement Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Student Engagement</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Average Watch Time</span>
                <span className="font-medium">
                  {Math.floor(analytics.average_watch_time || 0)} min/student
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Watch Time</span>
                <span className="font-medium">
                  {Math.floor((analytics.total_watch_time || 0) / 60)} hours
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lessons Completed</span>
                <span className="font-medium">{analytics.lessons_completed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quizzes Passed</span>
                <span className="font-medium">{analytics.quizzes_passed || 0}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Period Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">New Enrollments</span>
                <span className="font-medium">{analytics.enrollments_this_period || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Students</span>
                <span className="font-medium">{analytics.students_this_period || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Period Revenue</span>
                <span className="font-medium">
                  ${analytics.revenue_this_period?.toFixed(2) || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Published Courses</span>
                <span className="font-medium">{analytics.published_courses || 0}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Analytics Visualizations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card>
            <AnalyticsChart
              title="Revenue by Course"
              type="bar"
              data={
                analytics.top_courses?.slice(0, 5).map((course: any) => ({
                  label: course.title.substring(0, 20) + '...',
                  value: course.revenue || 0,
                  color: '#10B981'
                })) || []
              }
            />
          </Card>

          <Card>
            <AnalyticsChart
              title="Students by Course"
              type="bar"
              data={
                analytics.top_courses?.slice(0, 5).map((course: any) => ({
                  label: course.title.substring(0, 20) + '...',
                  value: course.students || 0,
                  color: '#3B82F6'
                })) || []
              }
            />
          </Card>
        </div>

        {/* Course Status Distribution */}
        <Card className="mt-8">
          <AnalyticsChart
            title="Course Status Distribution"
            type="pie"
            data={[
              {
                label: 'Published',
                value: analytics.published_courses || 0,
                color: '#10B981'
              },
              {
                label: 'Draft',
                value: (analytics.total_courses || 0) - (analytics.published_courses || 0),
                color: '#6B7280'
              }
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

export default CreatorAnalyticsPage;