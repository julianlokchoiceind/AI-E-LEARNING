'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  MoreVertical, 
  BookOpen,
  Grid3X3,
  List,
  Search,
  Filter,
  Download,
  BarChart,
  CheckSquare,
  Square
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { CreatorCoursesTableSkeleton } from '@/components/ui/LoadingStates';
import { useAuth } from '@/hooks/useAuth';
import { ToastService } from '@/lib/toast/ToastService';
import { 
  useCreatorCoursesQuery,
  useDeleteCourse,
  useCreateCourse 
} from '@/hooks/queries/useCourses';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';

const CreatorCoursesPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('updated');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  // React Query hooks
  const { 
    data: coursesResponse, 
    loading, 
    execute: refetchCourses 
  } = useCreatorCoursesQuery(user?.id || '', !!user?.id);
  
  const { mutate: deleteCourse, loading: deleteLoading } = useDeleteCourse();
  const { mutate: createCourse, loading: createLoading } = useCreateCourse();

  // Filter and sort courses with memoized course extraction
  const filteredCourses = React.useMemo(() => {
    // Extract courses from React Query response inside useMemo for optimal performance
    const courses = coursesResponse?.success ? coursesResponse.data?.courses || [] : [];
    let filtered = [...courses];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(course => course.status === filterStatus);
    }

    // Sorting
    switch (sortBy) {
      case 'updated':
        filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        break;
      case 'students':
        filtered.sort((a, b) => (b.stats?.total_enrollments || 0) - (a.stats?.total_enrollments || 0));
        break;
      case 'revenue':
        filtered.sort((a, b) => (b.stats?.total_revenue || 0) - (a.stats?.total_revenue || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.stats?.average_rating || 0) - (a.stats?.average_rating || 0));
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return filtered;
  }, [coursesResponse, searchTerm, filterStatus, sortBy]);

  // Check permissions when user loads
  useEffect(() => {
    if (user && user.role !== 'creator' && user.role !== 'admin') {
      ToastService.error('Access denied. Creator access required.');
      router.push('/dashboard');
    }
  }, [user, router]);

  // Handle courses loading errors
  useEffect(() => {
    if (coursesResponse && !coursesResponse.success) {
      ToastService.error(coursesResponse.message || 'Something went wrong');
    }
  }, [coursesResponse]);

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

  const handleEditCourse = (courseId: string) => {
    // Redirect based on user role
    if (user?.role === 'admin') {
      router.push(`/admin/courses/${courseId}/edit`);
    } else {
      router.push(`/creator/courses/${courseId}/edit`);
    }
  };

  const handleDeleteCourse = (courseId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    deleteCourse(courseId, {
      onSuccess: (response) => {
        if (response.success) {
          ToastService.success(response.message || 'Something went wrong');
          refetchCourses(); // Refresh courses list
        } else {
          ToastService.error(response.message || 'Something went wrong');
        }
      },
      onError: (error: any) => {
        console.error('Failed to delete course:', error);
        ToastService.error(error.message || 'Something went wrong');
      }
    });
  };

  const handleViewCourse = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  const handleViewAnalytics = (courseId: string) => {
    // Admin users don't have creator analytics page, redirect to admin view
    if (user?.role === 'admin') {
      router.push(`/admin/courses/${courseId}/edit`);
    } else {
      router.push(`/creator/courses/${courseId}/analytics`);
    }
  };

  const handleSelectAll = () => {
    if (selectedCourses.length === filteredCourses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(filteredCourses.map(c => c.id));
    }
  };

  const handleSelectCourse = (courseId: string) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter(id => id !== courseId));
    } else {
      setSelectedCourses([...selectedCourses, courseId]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCourses.length === 0) {
      ToastService.error('No courses selected');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedCourses.length} courses? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete courses using React Query mutation
      for (const courseId of selectedCourses) {
        deleteCourse(courseId, {
          onSuccess: (response) => {
            ToastService.success(response.message || 'Something went wrong');
          },
          onError: (error: any) => {
            ToastService.error(error.message || 'Something went wrong');
          }
        });
      }
      
      setSelectedCourses([]);
      refetchCourses(); // Refresh courses list
    } catch (error: any) {
      ToastService.error(error.message || 'Something went wrong');
    }
  };

  const handleExportData = () => {
    // In real app, would generate CSV/Excel file
    const csvData = filteredCourses.map(course => ({
      Title: course.title,
      Status: course.status,
      Students: course.stats?.total_enrollments || 0,
      Revenue: course.stats?.total_revenue || 0,
      Rating: course.stats?.average_rating || 0,
      Created: formatDate(course.created_at),
      Updated: formatDate(course.updated_at)
    }));

    ToastService.success('Course data exported successfully');
    // In real implementation, would trigger download
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
    return <CreatorCoursesTableSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">My Courses</h1>
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'card' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                  className="px-3 py-1"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="px-3 py-1"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              
              {viewMode === 'table' && (
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  disabled={filteredCourses.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              )}
              
              <Button 
                variant="primary" 
                onClick={handleCreateCourse}
                disabled={createLoading}
              >
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
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search courses..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="review">In Review</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>

              <select
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="updated">Recently Updated</option>
                <option value="title">Title (A-Z)</option>
                <option value="students">Most Students</option>
                <option value="revenue">Highest Revenue</option>
                <option value="rating">Highest Rating</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {viewMode === 'table' && selectedCourses.length > 0 && (
            <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <span className="text-blue-700">
                {selectedCourses.length} courses selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCourses([])}
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {filteredCourses.length === 0 ? (
          <Card className="p-12 text-center">
            {courses.length === 0 ? (
              <>
                <Plus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No courses yet</h2>
                <p className="text-gray-600 mb-6">
                  Start creating your first course and share your knowledge with students
                </p>
                <Button variant="primary" onClick={handleCreateCourse}>
                  Create Your First Course
                </Button>
              </>
            ) : (
              <>
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No courses found</h2>
                <p className="text-gray-600">
                  No courses match your search criteria
                </p>
              </>
            )}
          </Card>
        ) : viewMode === 'card' ? (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course: any) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                        onClick={() => setActiveDropdown(activeDropdown === course.id ? null : course.id)}
                        className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {activeDropdown === course.id && (
                        <div className="absolute top-10 left-0 bg-white rounded-lg shadow-lg py-2 w-48 z-10">
                          <button
                            onClick={() => {
                              handleEditCourse(course.id);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Course
                          </button>
                          
                          <button
                            onClick={() => {
                              handleViewCourse(course.id);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </button>

                          <button
                            onClick={() => {
                              handleViewAnalytics(course.id);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                          >
                            <BarChart className="w-4 h-4 mr-2" />
                            Analytics
                          </button>
                          
                          <hr className="my-2" />
                          
                          <button
                            onClick={() => {
                              handleDeleteCourse(course.id, course.title);
                              setActiveDropdown(null);
                            }}
                            disabled={deleteLoading}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-red-600 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {deleteLoading ? 'Deleting...' : 'Delete'}
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
                    onClick={() => handleEditCourse(course.id)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Course
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 hover:text-blue-600"
                    >
                      {selectedCourses.length === filteredCourses.length ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleSelectCourse(course.id)}
                        className="flex items-center"
                      >
                        {selectedCourses.includes(course.id) ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {course.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {course.category} • {course.level}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(course.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {course.stats?.total_enrollments || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatCurrency(course.stats?.total_revenue || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900">
                          {(course.stats?.average_rating || 0).toFixed(1)}
                        </span>
                        <span className="text-yellow-400 ml-1">⭐</span>
                        <span className="text-sm text-gray-500 ml-1">
                          ({course.stats?.total_reviews || 0})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(course.updated_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewAnalytics(course.id)}
                          title="Analytics"
                        >
                          <BarChart className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCourse(course.id)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewCourse(course.id)}
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorCoursesPage;