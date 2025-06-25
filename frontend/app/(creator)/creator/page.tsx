'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, BookOpen, TrendingUp, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getCourses } from '@/lib/api/courses';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

const CreatorDashboard = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    avgRating: 0,
  });

  useEffect(() => {
    if (user?.role !== 'creator' && user?.role !== 'admin') {
      toast.error('Access denied. Creator access required.');
      router.push('/dashboard');
      return;
    }

    fetchCreatorData();
  }, [user, router]);

  const fetchCreatorData = async () => {
    try {
      setLoading(true);
      // Fetch creator's courses
      const response = await getCourses(`creator_id=${user?._id}`);
      setCourses(response.data || []);

      // Calculate stats
      const totalStudents = response.data.reduce((sum: number, course: any) => 
        sum + (course.stats?.total_enrollments || 0), 0
      );
      const totalRevenue = response.data.reduce((sum: number, course: any) => 
        sum + (course.stats?.total_revenue || 0), 0
      );
      const avgRating = response.data.length > 0
        ? response.data.reduce((sum: number, course: any) => 
            sum + (course.stats?.average_rating || 0), 0
          ) / response.data.length
        : 0;

      setStats({
        totalCourses: response.data.length,
        totalStudents,
        totalRevenue,
        avgRating,
      });
    } catch (error) {
      console.error('Failed to fetch creator data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = () => {
    router.push('/creator/courses/new');
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
            <h1 className="text-2xl font-bold">Creator Dashboard</h1>
            <Button variant="primary" onClick={handleCreateCourse}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Course
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
                <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-indigo-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)} ⭐</p>
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
              <Button variant="primary" onClick={handleCreateCourse}>
                Create Your First Course
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.slice(0, 5).map((course) => (
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