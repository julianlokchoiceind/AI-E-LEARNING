'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import DeleteCourseModal, { CourseDeleteData } from '@/components/feature/DeleteCourseModal';
import { LoadingSpinner, EmptyState, AdCoursesTableSkeleton } from '@/components/ui/LoadingStates';
import { StandardResponse } from '@/lib/types/api';
import { 
  useAdminCoursesQuery, 
  useApproveCourse, 
  useRejectCourse, 
  useToggleCourseFree, 
  useDeleteCourseAdmin as useDeleteCourse,
  useCreateCourse,
  useAdminStatistics
} from '@/hooks/queries/useCourses';
import { Pagination } from '@/components/ui/Pagination';
import { 
  Search, 
  Filter, 
  Eye, 
  Check, 
  X, 
  Clock, 
  Star, 
  Users, 
  DollarSign,
  BookOpen,
  Calendar,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Gift,
  Edit3,
  Trash2
} from 'lucide-react';

interface Course {
  _id?: string;      // Optional since API might return id instead
  id?: string;       // API actually returns this field
  title: string;
  description: string;
  thumbnail: string;
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
  status: 'draft' | 'review' | 'published' | 'rejected';
  stats: {
    total_enrollments: number;
    average_rating: number;
    total_reviews: number;
  };
  created_at: string;
  published_at?: string;
  rejection_reason?: string;
}

export default function CourseApproval() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCourseForDelete, setSelectedCourseForDelete] = useState<CourseDeleteData | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const router = useRouter();
  
  // React Query hooks for data fetching and mutations with server-side pagination
  const { 
    data: coursesData, 
    loading: isInitialLoading, 
    query: { isFetching, isRefetching },
  } = useAdminCoursesQuery({
    search: searchTerm,
    status: statusFilter,
    category: categoryFilter,
    page: currentPage,
    per_page: itemsPerPage
  });

  // Separate statistics hook for Dashboard Quick Stats (real database totals)
  const { 
    data: statisticsData,
    loading: statisticsLoading 
  } = useAdminStatistics();
  
  // Smart loading states: Only show spinner on initial load, not background refetch
  const showLoadingSpinner = isInitialLoading && !coursesData;
  const showBackgroundUpdate = (isFetching || isRefetching) && coursesData;
  
  const { mutate: approveCourse, loading: approveLoading } = useApproveCourse();
  const { mutate: rejectCourse, loading: rejectLoading } = useRejectCourse();
  const { mutate: toggleFree, loading: toggleLoading } = useToggleCourseFree();
  const { mutate: deleteCourseAction, loading: deleteLoading } = useDeleteCourse();
  const { mutate: createCourseAction, loading: createLoading } = useCreateCourse();
  
  // Combined loading state for actions
  const actionLoading = approveLoading || rejectLoading || toggleLoading || deleteLoading || createLoading;
  
  // Extract courses and pagination data from response (flat structure from backend)
  const typedCoursesData = coursesData as StandardResponse<{ courses: any[], total: number, page: number, per_page: number, total_pages: number, summary: any }> | null;
  const courses = typedCoursesData?.data?.courses || [];
  const totalItems = typedCoursesData?.data?.total || 0;
  const totalPages = typedCoursesData?.data?.total_pages || 1;

  // Extract statistics for Dashboard Quick Stats
  const typedStatisticsData = statisticsData as StandardResponse<any> | null;
  const statistics = typedStatisticsData?.data || null;

  const handleApproveCourse = (course: Course) => {
    const courseId = course.id;
    if (courseId) {
      approveCourse(courseId);
    }
  };

  const handleRejectCourse = () => {
    if (!selectedCourse || !rejectionReason.trim()) {
      // Let the mutation handle the validation error
      return;
    }
    
    const courseId = selectedCourse.id!;
    rejectCourse({ courseId, reason: rejectionReason }, {
      onSuccess: () => {
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedCourse(null);
      }
    });
  };

  const handleToggleFree = (course: Course, currentStatus: boolean) => {
    const courseId = course.id || course._id;
    if (!courseId) return;
    toggleFree({ courseId, isFree: !currentStatus });
  };

  const handleDeleteCourse = (course: Course) => {
    // Use course.id (API consistently returns id field)
    const courseId = course.id;
    
    if (courseId) {
      setSelectedCourseForDelete({
        id: courseId,  // Fix: Use 'id' to match DeleteCourseModal interface
        title: course.title,
        description: course.description,
        total_lessons: course.total_lessons,
        total_chapters: course.total_chapters,
        creator_name: course.creator_name,
        status: course.status
      });
    }
    setShowDeleteModal(true);
  };

  const handleConfirmDeleteCourse = async (courseId: string) => {
    deleteCourseAction(courseId, {
      onSuccess: () => {
        setShowDeleteModal(false);
        setSelectedCourseForDelete(null);
      }
    });
  };

  const handleCreateCourse = () => {
    createCourseAction({}, {
      onSuccess: (response) => {
        if (response.success && response.data?.id) {
          router.push(`/admin/courses/${response.data.id}/edit`);
        }
      }
    });
  };

  // Filter change handlers - reset to page 1 when filters change
  const handleFilterChange = (newValue: string, filterType: 'search' | 'status' | 'category') => {
    setCurrentPage(1); // Reset to first page when filters change
    
    switch (filterType) {
      case 'search':
        setSearchTerm(newValue);
        break;
      case 'status':
        setStatusFilter(newValue);
        break;
      case 'category':
        setCategoryFilter(newValue);
        break;
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSelectAll = () => {
    if (selectedCourses.size === courses.length) {
      setSelectedCourses(new Set());
    } else {
      const courseIds = courses.map((c: Course) => c.id || c._id).filter(Boolean) as string[];
      setSelectedCourses(new Set(courseIds));
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

  const handleBulkDelete = () => {
    if (selectedCourses.size === 0) return;
    setShowBulkDeleteModal(true);
  };

  const handleConfirmBulkDelete = async () => {
    // Store the courses to delete
    const coursesToDelete = Array.from(selectedCourses);
    
    // Delete all selected courses sequentially to avoid overwhelming the server
    for (const courseId of coursesToDelete) {
      await new Promise<void>((resolve) => {
        deleteCourseAction(courseId, {
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
    setShowBulkDeleteModal(false);
    // React Query will auto-refetch due to cache invalidation
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge status="published" />;
      case 'review':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'rejected':
      case 'archived':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'draft':
        return <Badge status="draft" />;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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

  // No client-side filtering needed - all filtering is done server-side
  const filteredCourses = courses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
          <p className="text-gray-600">Review and approve courses from content creators</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={handleCreateCourse}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Create New Course
          </Button>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats - Using real database totals, not current page data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">
                {statisticsLoading ? '...' : (statistics?.pending_review || 0)}
              </p>
              <p className="text-sm text-gray-600">Pending Review</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">
                {statisticsLoading ? '...' : (statistics?.published || 0)}
              </p>
              <p className="text-sm text-gray-600">Published</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">
                {statisticsLoading ? '...' : (statistics?.rejected || 0)}
              </p>
              <p className="text-sm text-gray-600">Rejected</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <Gift className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">
                {statisticsLoading ? '...' : (statistics?.free_courses || 0)}
              </p>
              <p className="text-sm text-gray-600">Free Courses</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => handleFilterChange(e.target.value, 'search')}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value, 'status')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Status</option>
            <option value="review">Pending Review</option>
            <option value="published">Published</option>
            <option value="archived">Rejected</option>
            <option value="draft">Draft</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => handleFilterChange(e.target.value, 'category')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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
              setStatusFilter('');
              setCategoryFilter('');
              setCurrentPage(1);
            }} 
            variant="outline"
            className="w-full"
          >
            <Filter className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedCourses.size > 0 && (
          <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <span className="text-blue-700">
              {selectedCourses.size} course{selectedCourses.size > 1 ? 's' : ''} selected
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
      </Card>

      {/* Courses Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Courses ({totalItems})
            </h2>
            {showBackgroundUpdate && (
              <div className="flex items-center text-sm text-blue-600">
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                Refreshing...
              </div>
            )}
          </div>
        </div>

        {showLoadingSpinner ? (
          <AdCoursesTableSkeleton rows={6} />
        ) : filteredCourses.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <EmptyState
              title="No courses found"
              description="No courses match your current search and filter criteria"
              action={{
                label: 'Clear Filters',
                onClick: () => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setCategoryFilter('');
                }
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedCourses.size === courses.length && courses.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pricing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.map((course: Course) => {
                  const courseId = course.id || course._id || '';
                  return (
                  <tr key={courseId} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCourses.has(courseId)}
                        onChange={() => handleSelectCourse(courseId)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {course.thumbnail ? (
                          <img 
                            src={course.thumbnail} 
                            alt={course.title}
                            className="h-12 w-16 object-cover rounded-lg mr-4"
                          />
                        ) : (
                          <div className="h-12 w-16 bg-gray-200 rounded-lg mr-4 flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {course.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {course.category} • <span className={getLevelColor(course.level)}>{course.level}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.creator_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(course.status)}
                      {course.pricing.is_free && (
                        <Badge className="bg-blue-100 text-blue-800 ml-2">Free</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{course.total_lessons} lessons</div>
                        <div className="text-xs text-gray-500">
                          {course.total_chapters} chapters
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.pricing.is_free ? (
                        <span className="text-green-600 font-medium">Free</span>
                      ) : (
                        <span className="font-medium">${course.pricing.price}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {/* View Action */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedCourse(course);
                            setShowCourseModal(true);
                          }}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Edit Action */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const courseId = course.id;
                            router.push(`/admin/courses/${courseId}/edit`);
                          }}
                          className="text-gray-600 hover:bg-gray-50"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>

                        {/* Delete Action */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCourse(course)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        {course.status === 'review' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleApproveCourse(course)}
                              loading={actionLoading}
                              className="text-green-600 hover:bg-green-50"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedCourse(course);
                                setShowRejectModal(true);
                              }}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {course.status === 'published' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleFree(course, course.pricing.is_free)}
                            loading={actionLoading}
                            className={`${course.pricing.is_free ? 'text-yellow-600' : 'text-blue-600'} hover:bg-blue-50`}
                          >
                            <Gift className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
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
      </Card>

      {/* Course Details Modal */}
      {showCourseModal && selectedCourse && (
        <Modal
          isOpen={showCourseModal}
          onClose={() => setShowCourseModal(false)}
          title="Course Details"
          size="xl"
        >
          <div className="space-y-6">
            {/* Course Header */}
            <div className="flex items-start space-x-4">
              {selectedCourse.thumbnail ? (
                <img 
                  src={selectedCourse.thumbnail} 
                  alt={selectedCourse.title}
                  className="h-24 w-32 object-cover rounded-lg"
                />
              ) : (
                <div className="h-24 w-32 bg-gray-200 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{selectedCourse.title}</h3>
                <p className="text-gray-600 mt-1">{selectedCourse.description}</p>
                <div className="flex items-center space-x-4 mt-3">
                  {getStatusBadge(selectedCourse.status)}
                  <Badge className={`${selectedCourse.pricing.is_free ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                    {selectedCourse.pricing.is_free ? 'Free' : `$${selectedCourse.pricing.price}`}
                  </Badge>
                  <span className="text-sm text-gray-500">by {selectedCourse.creator_name}</span>
                </div>
              </div>
            </div>

            {/* Course Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{selectedCourse.total_lessons}</div>
                <div className="text-sm text-gray-500">Lessons</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{selectedCourse.total_chapters}</div>
                <div className="text-sm text-gray-500">Chapters</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{selectedCourse.stats.total_enrollments}</div>
                <div className="text-sm text-gray-500">Enrollments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{selectedCourse.stats.average_rating || 0}</div>
                <div className="text-sm text-gray-500">Rating</div>
              </div>
            </div>

            {/* Rejection Reason */}
            {selectedCourse.status === 'rejected' && selectedCourse.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Rejection Reason:</h4>
                <p className="text-red-700">{selectedCourse.rejection_reason}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3">
              {selectedCourse.status === 'review' && (
                <>
                  <Button
                    onClick={() => handleApproveCourse(selectedCourse)}
                    loading={actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve Course
                  </Button>
                  
                  <Button
                    onClick={() => setShowRejectModal(true)}
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject Course
                  </Button>
                </>
              )}
              
              {selectedCourse.status === 'published' && (
                <Button
                  onClick={() => handleToggleFree(selectedCourse, selectedCourse.pricing.is_free)}
                  loading={actionLoading}
                  variant="outline"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  {selectedCourse.pricing.is_free ? 'Make Paid' : 'Make Free'}
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => setShowCourseModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Course Modal */}
      {showRejectModal && selectedCourse && (
        <Modal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          title="Reject Course"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Please provide a reason for rejecting <strong>{selectedCourse.title}</strong>. 
              This feedback will be sent to the content creator.
            </p>
            
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this course is being rejected..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
            />
            
            <div className="flex space-x-3">
              <Button
                onClick={handleRejectCourse}
                loading={actionLoading}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                disabled={!rejectionReason.trim()}
              >
                <X className="h-4 w-4 mr-2" />
                Reject Course
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Course Modal */}
      <DeleteCourseModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        course={selectedCourseForDelete}
        onConfirmDelete={handleConfirmDeleteCourse}
      />

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <Modal
          isOpen={showBulkDeleteModal}
          onClose={() => setShowBulkDeleteModal(false)}
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
                onClick={() => setShowBulkDeleteModal(false)}
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
    </div>
  );
}