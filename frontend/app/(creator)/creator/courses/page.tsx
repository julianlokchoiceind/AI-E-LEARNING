'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus,
  RefreshCw, 
  Edit, 
  Trash2, 
  Eye, 
  MoreVertical, 
  BookOpen,
  Grid3X3,
  List,
  Search,
  Filter,
  BarChart,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { EmptyState, CourseListSkeleton } from '@/components/ui/LoadingStates';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { ToastService } from '@/lib/toast/ToastService';
import { 
  useCreatorCoursesQuery,
  useDeleteCourse,
  useCreateCourse 
} from '@/hooks/queries/useCourses';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';
import DeleteCourseModal, { CourseDeleteData } from '@/components/feature/DeleteCourseModal';
import { StandardResponse } from '@/lib/types/api';

interface Course {
  _id?: string;      // Optional since API might return id instead
  id?: string;       // API actually returns this field
  title: string;
  description: string;
  short_description?: string;
  thumbnail?: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  creator_id: string;
  creator_name: string;
  total_chapters: number;
  total_lessons: number;
  total_duration: number;
  pricing: {
    is_free: boolean;
    price: number;
    currency: string;
  };
  status: 'draft' | 'review' | 'published' | 'archived';
  stats: {
    total_enrollments: number;
    average_rating: number;
    total_reviews: number;
    total_revenue?: number;
  };
  created_at: string;
  updated_at: string;
  published_at?: string;
}

const CreatorCoursesPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<CourseDeleteData | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  
  // React Query hooks with server-side pagination
  const { 
    data: coursesResponse, 
    loading: isInitialLoading,
    query: { isFetching, isRefetching }, 
    execute: refetchCourses 
  } = useCreatorCoursesQuery({
    search: searchTerm,
    status: filterStatus,
    category: categoryFilter,
    page: currentPage,
    per_page: itemsPerPage
  }, !!user);
  
  const { mutate: deleteCourse, loading: deleteLoading } = useDeleteCourse();
  const { mutate: createCourse, loading: createLoading } = useCreateCourse();

  // Smart loading states: Only show spinner on initial load, not background refetch
  const showLoadingSpinner = isInitialLoading && !coursesResponse;
  const showBackgroundUpdate = (isFetching || isRefetching) && coursesResponse;
  
  // Extract courses and pagination data from response (consistent with API structure)
  const courses = coursesResponse?.data?.courses || [];
  const totalItems = coursesResponse?.data?.total || 0;
  const totalPages = coursesResponse?.data?.total_pages || 1;
  
  // No client-side filtering needed - all filtering is done server-side
  const filteredCourses = courses;

  // Check permissions when user loads
  useEffect(() => {
    if (user && user.role !== 'creator' && user.role !== 'admin') {
      ToastService.error('Access denied. Creator access required.');
      router.push('/dashboard');
    }
  }, [user, router]);

  // Handle courses loading errors
  useEffect(() => {
    // Check for wrong response handling
    if (coursesResponse && !coursesResponse.success) {
      console.error('[CREATOR_COURSES_ERROR] API returned error:', coursesResponse);
      ToastService.error(coursesResponse.message || 'Something went wrong');
    }
  }, [coursesResponse]);

  // Filter change handlers - reset to page 1 when filters change
  const handleFilterChange = (newValue: string, filterType: 'search' | 'status' | 'category') => {
    setCurrentPage(1); // Reset to first page when filters change
    
    switch (filterType) {
      case 'search':
        setSearchTerm(newValue);
        break;
      case 'status':
        setFilterStatus(newValue);
        break;
      case 'category':
        setCategoryFilter(newValue);
        break;
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCreateCourse = () => {
    createCourse({}, {
      onSuccess: (response) => {
        if (response?.success && response?.data?.id) {
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

  const handleDeleteCourse = (course: typeof filteredCourses[0]) => {
    // Prepare course data for the modal
    setCourseToDelete({
      id: course.id,
      title: course.title,
      description: course.description || course.short_description,
      total_lessons: course.total_lessons || 0,
      total_chapters: course.total_chapters || 0,
      creator_name: user?.name || 'Unknown',
      status: course.status
    });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteCourse = async (courseId: string) => {
    deleteCourse(courseId, {
      onSuccess: (response) => {
        // ToastService already handled by useApiMutation
        setIsDeleteModalOpen(false);
        setCourseToDelete(null);
        // React Query will auto-refetch due to cache invalidation
      },
      onError: (error: any) => {
        console.error('Failed to delete course:', error);
        // Toast is handled by useApiMutation automatically
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
    if (selectedCourses.size === filteredCourses.length) {
      setSelectedCourses(new Set());
    } else {
      setSelectedCourses(new Set(filteredCourses.map(c => c.id)));
    }
  };

  const handleSelectCourse = (courseId: string) => {
    const newSelected = new Set(selectedCourses);
    if (newSelected.has(courseId)) {
      newSelected.delete(courseId);
    } else {
      newSelected.add(courseId);
    }
    setSelectedCourses(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedCourses.size === 0) {
      ToastService.error('No courses selected');
      return;
    }

    setIsBulkDeleteModalOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    // Store the courses to delete
    const coursesToDelete = Array.from(selectedCourses);
    
    // Delete all selected courses sequentially to avoid overwhelming the server
    for (const courseId of coursesToDelete) {
      await new Promise<void>((resolve) => {
        deleteCourse(courseId, {
          onSuccess: () => {
            // Remove from selected set immediately after successful deletion
            setSelectedCourses(prev => {
              const newSet = new Set(prev);
              newSet.delete(courseId);
              return newSet;
            });
            resolve();
          },
          onError: () => {
            console.error(`Failed to delete course ${courseId}`);
            resolve(); // Continue even if one fails
          }
        });
      });
    }
    
    // Close modal after all operations complete
    setIsBulkDeleteModalOpen(false);
    // React Query will auto-refetch due to cache invalidation
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge status="published" />;
      case 'review':
        return <Badge variant="warning">Awaiting Admin Approval</Badge>;
      case 'archived':
        return <Badge variant="destructive">Archived</Badge>;
      case 'draft':
        return <Badge status="draft" />;
      default:
        return <Badge status="draft" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'text-green-600';
      case 'intermediate':
        return 'text-yellow-600';
      case 'advanced':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (showLoadingSpinner) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">My Courses</h1>
              <Button variant="primary" disabled>
                <Plus className="w-4 h-4 mr-2" />
                Create New Course
              </Button>
            </div>
          </div>
        </div>
        {/* Skeleton Loader */}
        <div className="container mx-auto px-4 py-8">
          <CourseListSkeleton rows={6} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">My Courses</h1>
              {showBackgroundUpdate && (
                <div className="flex items-center text-sm text-blue-600">
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  Refreshing...
                </div>
              )}
            </div>
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
              
              
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              
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
                onChange={(e) => handleFilterChange(e.target.value, 'search')}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterStatus}
                onChange={(e) => handleFilterChange(e.target.value, 'status')}
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="review">Pending Admin Review</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>

              {/* Category Filter */}
              <select
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={categoryFilter}
                onChange={(e) => handleFilterChange(e.target.value, 'category')}
              >
                <option value="">All Categories</option>
                <option value="programming">Programming</option>
                <option value="ai-fundamentals">AI Fundamentals</option>
                <option value="machine-learning">Machine Learning</option>
                <option value="ai-tools">AI Tools</option>
                <option value="production-ai">Production AI</option>
              </select>

              {/* Clear Filters Button */}
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('');
                  setCategoryFilter('');
                  setCurrentPage(1);
                }} 
                variant="outline"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {viewMode === 'table' && selectedCourses.size > 0 && (
            <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <span className="text-blue-700">
                {selectedCourses.size} courses selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCourses(new Set())}
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
          <div className="flex justify-center items-center h-64">
            {coursesResponse?.data?.courses?.length === 0 ? (
              <EmptyState
                title="No courses yet"
                description="Start creating your first course and share your knowledge with students"
                action={{
                  label: 'Create Your First Course',
                  onClick: handleCreateCourse
                }}
                icon={<Plus className="w-16 h-16 text-gray-300" />}
              />
            ) : (
              <EmptyState
                title="No courses found"
                description="No courses match your current search and filter criteria"
                action={{
                  label: 'Clear Filters',
                  onClick: () => {
                    setSearchTerm('');
                    setFilterStatus('');
                    setCategoryFilter('');
                    setCurrentPage(1);
                  }
                }}
                icon={<Search className="w-16 h-16 text-gray-300" />}
              />
            )}
          </div>
        ) : viewMode === 'card' ? (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
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
                              handleDeleteCourse(course);
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
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                Courses ({totalItems})
              </h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 hover:text-blue-600"
                    >
                      {selectedCourses.size === filteredCourses.length ? (
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
                        {selectedCourses.has(course.id) ? (
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
                          {course.category} • <span className={getLevelColor(course.level)}>{course.level}</span>
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
        
        {/* Table Footer with Pagination */}
        {viewMode === 'table' && totalPages > 1 && (
          <div className="bg-white rounded-b-lg shadow border-t px-6 py-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              loading={isFetching}
              showInfo={true}
              className="flex justify-center"
            />
          </div>
        )}
      </div>
    </div>

    {/* Delete Course Modal */}
    <DeleteCourseModal
      isOpen={isDeleteModalOpen}
      onClose={() => {
        setIsDeleteModalOpen(false);
        setCourseToDelete(null);
      }}
      course={courseToDelete}
      onConfirmDelete={handleConfirmDeleteCourse}
    />

    {/* Bulk Delete Modal */}
    {isBulkDeleteModalOpen && (
      <Modal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        title="Delete Multiple Courses"
        size="md"
      >
        <div className="space-y-6">
          {/* Warning Icon & Message */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirm Bulk Deletion
              </h3>
              <p className="text-gray-600">
                You are about to permanently delete {selectedCourses.size} course{selectedCourses.size > 1 ? 's' : ''}. 
                This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Warning Details */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <h4 className="font-medium text-yellow-800">Warning</h4>
            </div>
            <p className="text-sm text-yellow-700">
              All course content, chapters, lessons, and student progress for these courses will be permanently deleted.
              This includes all enrollments, reviews, and associated data.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsBulkDeleteModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmBulkDelete}
              loading={deleteLoading}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete {selectedCourses.size} Course{selectedCourses.size > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>
    )}
    </>
  );
};

export default CreatorCoursesPage;