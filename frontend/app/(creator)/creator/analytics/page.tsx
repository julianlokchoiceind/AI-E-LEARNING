'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, TrendingUp, Users, DollarSign, Clock, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { AnalyticsChart } from '@/components/feature/AnalyticsChart';
import { 
  getCreatorOverview, 
  getCourseAnalytics, 
  getStudentAnalytics, 
  getRevenueAnalytics,
  exportAnalytics 
} from '@/lib/api/analytics';
import type { 
  AnalyticsOverview, 
  CourseAnalytics, 
  StudentAnalytics, 
  RevenueAnalytics 
} from '@/lib/api/analytics';

const CreatorAnalyticsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [revenue, setRevenue] = useState<RevenueAnalytics | null>(null);
  const [students, setStudents] = useState<StudentAnalytics | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'students' | 'revenue'>('overview');

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
      
      // Fetch all analytics data in parallel
      const [overviewResponse, revenueResponse, studentsResponse] = await Promise.all([
        getCreatorOverview(timeRange),
        getRevenueAnalytics(timeRange),
        getStudentAnalytics(20, 0)
      ]);

      // Check responses and extract data
      if (!overviewResponse.success) {
        throw new Error(overviewResponse.message || 'Operation Failed');
      }
      if (!revenueResponse.success) {
        throw new Error(revenueResponse.message || 'Operation Failed');
      }
      if (!studentsResponse.success) {
        throw new Error(studentsResponse.message || 'Operation Failed');
      }

      setOverview(overviewResponse.data || null);
      setRevenue(revenueResponse.data || null);
      setStudents(studentsResponse.data || null);
      
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      toast.error(error.message || 'Operation Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (reportType: string) => {
    try {
      const response = await exportAnalytics(reportType, timeRange, 'csv');
      
      if (response.success) {
        toast.success(response.message || 'Export successful');
      } else {
        throw new Error(response.message || 'Operation Failed');
      }
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error(error.message || 'Operation Failed');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!overview) {
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
            <div>
              <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
              <p className="text-gray-600">Track your course performance and student engagement</p>
            </div>
            
            {/* Time Range Selector and Export */}
            <div className="flex items-center gap-4">
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
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExport('overview')}
              >
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'revenue'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('revenue')}
            >
              Revenue
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'students'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('students')}
            >
              Students
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold">${overview.overview.total_revenue?.toFixed(2) || 0}</p>
                    <p className="text-sm text-green-600">
                      {revenue && revenue.summary.growth_rate > 0 
                        ? `+${revenue.summary.growth_rate.toFixed(1)}% growth`
                        : 'Calculate growth'}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold">{overview.overview.total_students || 0}</p>
                    <p className="text-sm text-blue-600">
                      {overview.overview.active_students || 0} active
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Completion Rate</p>
                    <p className="text-2xl font-bold">{overview.overview.completion_rate?.toFixed(1) || 0}%</p>
                    <p className="text-sm text-indigo-600">
                      {overview.overview.total_courses || 0} courses
                    </p>
                  </div>
                  <Award className="w-8 h-8 text-indigo-500" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold">{overview.overview.average_rating?.toFixed(1) || 0} ⭐</p>
                    <p className="text-sm text-yellow-600">
                      {overview.overview.total_courses || 0} courses
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-yellow-500" />
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              {overview.recent_activity?.length > 0 ? (
                <div className="space-y-3">
                  {overview.recent_activity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{activity.user_name}</p>
                        <p className="text-sm text-gray-600">
                          Enrolled in {activity.course_title}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No recent activity</p>
              )}
            </Card>

          </>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && revenue && (
          <>
            {/* Revenue Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">${revenue.summary.total_revenue.toFixed(2)}</p>
                </div>
              </Card>
              
              <Card className="p-6">
                <div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold">{revenue.summary.total_transactions}</p>
                </div>
              </Card>
              
              <Card className="p-6">
                <div>
                  <p className="text-sm text-gray-600">Average Transaction</p>
                  <p className="text-2xl font-bold">${revenue.summary.average_transaction.toFixed(2)}</p>
                </div>
              </Card>
              
              <Card className="p-6">
                <div>
                  <p className="text-sm text-gray-600">Growth Rate</p>
                  <p className="text-2xl font-bold">{revenue.summary.growth_rate.toFixed(1)}%</p>
                </div>
              </Card>
            </div>

            {/* Revenue Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <AnalyticsChart
                title="Revenue Trends"
                type="line"
                data={revenue.revenue_trends}
                dataKey="revenue"
                xKey="date"
              />
              
              <AnalyticsChart
                title="Revenue by Course"
                type="bar"
                data={revenue.revenue_by_course.slice(0, 5)}
                dataKey="revenue"
                xKey="course"
              />
            </div>

            {/* Payment Types */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Payment Types</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">{revenue.payment_types.course_purchase}</p>
                  <p className="text-gray-600">One-time Purchases</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{revenue.payment_types.subscription}</p>
                  <p className="text-gray-600">Subscriptions</p>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && students && (
          <>
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Student Analytics</h2>
              <div className="space-y-4">
                {students.students.map((student) => (
                  <div key={student.student.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{student.student.name}</h3>
                        <p className="text-sm text-gray-600">{student.student.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{student.metrics.courses_enrolled} courses</p>
                        <p className="text-sm text-gray-600">
                          {student.metrics.average_progress.toFixed(1)}% avg progress
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Completed: {student.metrics.courses_completed}</span>
                        <span className="text-gray-600">
                          Last active: {student.metrics.last_activity 
                            ? new Date(student.metrics.last_activity).toLocaleDateString()
                            : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {students.pagination.has_more && (
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm">
                    Load More Students
                  </Button>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default CreatorAnalyticsPage;