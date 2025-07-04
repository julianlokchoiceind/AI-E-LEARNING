'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Eye, MoreVertical, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getCourses, deleteCourse } from '@/lib/api/courses';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

const CreatorCoursesPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'creator' && user?.role !== 'admin') {
      toast.error('Access denied. Creator access required.');
      router.push('/dashboard');
      return;
    }

    fetchCourses();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await getCourses(`creator_id=${user?.id}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Something went wrong');
      }
      
      setCourses(response.data?.courses || []);
    } catch (error: any) {
      console.error('Failed to fetch courses:', error);
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = () => {
    router.push('/creator/courses/new');
  };

  const handleEditCourse = (courseId: string) => {
    router.push(`/creator/courses/${courseId}/edit`);
  };

  const handleDeleteCourse = async (courseId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await deleteCourse(courseId);
      
      if (response.success) {
        setCourses(courses.filter(c => c._id !== courseId));
        toast.success(response.message || 'Something went wrong');
      } else {
        throw new Error(response.message || 'Something went wrong');
      }
    } catch (error: any) {
      console.error('Failed to delete course:', error);
      toast.error(error.message || 'Something went wrong');
    }
  };

  const handleViewCourse = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
      review: { label: 'In Review', className: 'bg-yellow-100 text-yellow-700' },
      published: { label: 'Published', className: 'bg-green-100 text-green-700' },
      archived: { label: 'Archived', className: 'bg-red-100 text-red-700' },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return <Badge className={config.className}>{config.label}</Badge>;
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
            <h1 className="text-2xl font-bold">My Courses</h1>
            <Button variant="primary" onClick={handleCreateCourse}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Course
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {courses.length === 0 ? (
          <Card className="p-12 text-center">
            <Plus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No courses yet</h2>
            <p className="text-gray-600 mb-6">
              Start creating your first course and share your knowledge with students
            </p>
            <Button variant="primary" onClick={handleCreateCourse}>
              Create Your First Course
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Course Thumbnail */}
                <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 relative">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="w-16 h-16 text-white/50" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(course.status)}
                  </div>
                  
                  {/* Actions Dropdown */}
                  <div className="absolute top-4 left-4">
                    <div className="relative">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === course._id ? null : course._id)}
                        className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {activeDropdown === course._id && (
                        <div className="absolute top-10 left-0 bg-white rounded-lg shadow-lg py-2 w-48 z-10">
                          <button
                            onClick={() => {
                              handleEditCourse(course._id);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Course
                          </button>
                          
                          <button
                            onClick={() => {
                              handleViewCourse(course._id);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </button>
                          
                          <hr className="my-2" />
                          
                          <button
                            onClick={() => {
                              handleDeleteCourse(course._id, course.title);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Course Info */}
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.short_description || course.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{course.stats?.total_enrollments || 0} students</span>
                    <span>{course.total_lessons || 0} lessons</span>
                  </div>

                  {/* Revenue */}
                  {course.pricing?.is_free ? (
                    <div className="text-green-600 font-semibold">Free</div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">${course.pricing?.price || 0}</span>
                      <span className="text-sm text-gray-600">
                        Revenue: ${course.stats?.total_revenue || 0}
                      </span>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    variant="primary"
                    className="w-full mt-4"
                    onClick={() => handleEditCourse(course._id)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Course
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorCoursesPage;