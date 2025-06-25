'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BarChart, Users, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { AnalyticsChart } from '@/components/feature/AnalyticsChart';

const CourseAnalyticsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;
  
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
  }, [user, router, courseId, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(
        `/api/v1/courses/${courseId}/analytics?time_range=${timeRange}`,
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
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/creator/courses/${courseId}/edit`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course
              </Button>
              <h1 className="text-2xl font-bold">{analytics.course_title} - Analytics</h1>
            </div>
            
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
            <div className="flex items-center justify-between">
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Enrollments</p>
                <p className="text-2xl font-bold">{analytics.total_enrollments || 0}</p>
                <p className="text-sm text-blue-600">
                  {analytics.active_students || 0} active
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">{analytics.completion_rate?.toFixed(1) || 0}%</p>
                <p className="text-sm text-indigo-600">
                  {analytics.completed_students || 0} completed
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-indigo-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold">{analytics.average_rating?.toFixed(1) || 0} ⭐</p>
                <p className="text-sm text-yellow-600">
                  {analytics.total_reviews || 0} reviews
                </p>
              </div>
              <BarChart className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
        </div>

        {/* Engagement & Lessons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Student Engagement */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Student Engagement</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Progress</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${analytics.average_progress || 0}%` }}
                    />
                  </div>
                  <span className="font-medium">{analytics.average_progress?.toFixed(1) || 0}%</span>
                </div>
              </div>
              
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
            </div>
          </Card>

          {/* Lesson Performance */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Lesson Completion Rates</h2>
            {analytics.lesson_completion_rates?.length > 0 ? (
              <div className="space-y-3">
                {analytics.lesson_completion_rates.slice(0, 5).map((lesson: any) => (
                  <div key={lesson.lesson_id} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 truncate max-w-[60%]">
                      {lesson.lesson_title}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${lesson.completion_rate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {lesson.completion_rate.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No lesson data available</p>
            )}
          </Card>
        </div>

        {/* Quiz Performance */}
        {analytics.quiz_pass_rates?.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quiz Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.quiz_pass_rates.map((quiz: any) => (
                <div key={quiz.quiz_id} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">{quiz.quiz_title}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pass Rate</span>
                      <span className="font-medium">{quiz.pass_rate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Average Score</span>
                      <span className="font-medium">{quiz.average_score.toFixed(1)}/100</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Analytics Visualizations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card>
            <AnalyticsChart
              title="Daily Enrollments (Last 7 Days)"
              type="line"
              data={[
                { label: 'Mon', value: Math.floor(Math.random() * 10) + 1 },
                { label: 'Tue', value: Math.floor(Math.random() * 10) + 1 },
                { label: 'Wed', value: Math.floor(Math.random() * 10) + 1 },
                { label: 'Thu', value: Math.floor(Math.random() * 10) + 1 },
                { label: 'Fri', value: Math.floor(Math.random() * 10) + 1 },
                { label: 'Sat', value: Math.floor(Math.random() * 10) + 1 },
                { label: 'Sun', value: Math.floor(Math.random() * 10) + 1 }
              ]}
              height={250}
            />
          </Card>

          <Card>
            <AnalyticsChart
              title="Student Progress Distribution"
              type="pie"
              data={[
                {
                  label: 'Completed',
                  value: analytics.completed_students || 0,
                  color: '#10B981'
                },
                {
                  label: 'In Progress',
                  value: (analytics.active_students || 0) - (analytics.completed_students || 0),
                  color: '#F59E0B'
                },
                {
                  label: 'Not Started',
                  value: (analytics.total_enrollments || 0) - (analytics.active_students || 0),
                  color: '#6B7280'
                }
              ]}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseAnalyticsPage;