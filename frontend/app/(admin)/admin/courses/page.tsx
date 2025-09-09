'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import DeleteCourseModal, { CourseDeleteData } from '@/components/feature/DeleteCourseModal';
import { LoadingSpinner, EmptyState, SkeletonBox, SkeletonCircle, SkeletonText } from '@/components/ui/LoadingStates';
import { Container } from '@/components/ui/Container';
import { StandardResponse } from '@/lib/types/api';
import { getAttachmentUrl } from '@/lib/utils/attachmentUrl';
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
  AlertTriangle,
  CheckCircle,
  Gift,
  Edit3,
  Trash2
} from 'lucide-react';
import { getLevelColorClass } from '@/lib/utils/badge-helpers';

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


  // No client-side filtering needed - all filtering is done server-side
  const filteredCourses = courses;

  return (
    <Container variant="admin">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Course Management</h1>
          <p className="text-muted-foreground">Review and approve courses from content creators</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={handleCreateCourse}
            className="bg-primary hover:bg-primary/90"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Create New Course
          </Button>
        </div>
      </div>

      {/* Quick Stats - Using real database totals, not current page data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                {statisticsLoading ? '...' : (statistics?.pending_review || 0)}
              </p>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </div>
            <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-8 h-8 text-warning" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                {statisticsLoading ? '...' : (statistics?.published || 0)}
              </p>
              <p className="text-sm text-muted-foreground">Published</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                {statisticsLoading ? '...' : (statistics?.rejected || 0)}
              </p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                {statisticsLoading ? '...' : (statistics?.free_courses || 0)}
              </p>
              <p className="text-sm text-muted-foreground">Free Courses</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Gift className="w-8 h-8 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => handleFilterChange(e.target.value, 'search')}
              className="pl-10 w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value, 'status')}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive"
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
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive"
          >
            <option value="">All Categories</option>
            <option value="ml-basics">ML Basics</option>
            <option value="deep-learning">Deep Learning</option>
            <option value="nlp">NLP</option>
            <option value="computer-vision">Computer Vision</option>
            <option value="generative-ai">Generative AI</option>
            <option value="ai-ethics">AI Ethics</option>
            <option value="ai-in-business">AI in Business</option>
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
          <div className="mt-4 flex items-center justify-between p-4 bg-primary/10 rounded-lg">
            <span className="text-primary">
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
                className="text-destructive hover:bg-destructive/10"
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
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Courses ({totalItems})
            </h2>
          </div>
        </div>

        {showLoadingSpinner ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3"><SkeletonCircle className="h-4 w-4" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border">
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-4 py-4">
                      <SkeletonCircle className="h-4 w-4" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <SkeletonBox className="h-16 w-20 rounded-lg mr-4" />
                        <div>
                          <SkeletonBox className="h-4 w-48 mb-1" />
                          <SkeletonBox className="h-3 w-32" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkeletonBox className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <SkeletonBox className="h-6 w-20 rounded-full" />
                        <SkeletonBox className="h-6 w-12 rounded-full" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <SkeletonBox className="h-4 w-16 mb-1" />
                        <SkeletonBox className="h-3 w-20" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkeletonBox className="h-4 w-12" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center space-x-2">
                        <SkeletonBox className="h-8 w-8 rounded" />
                        <SkeletonBox className="h-8 w-8 rounded" />
                        <SkeletonBox className="h-8 w-8 rounded" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedCourses.size === courses.length && courses.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Pricing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {filteredCourses.map((course: Course) => {
                  const courseId = course.id || course._id || '';
                  return (
                  <tr key={courseId} className="hover:bg-muted">
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
                            src={getAttachmentUrl(course.thumbnail)} 
                            alt={course.title}
                            className="h-12 w-16 object-cover rounded-lg mr-4"
                          />
                        ) : (
                          <div className="h-12 w-16 bg-muted rounded-lg mr-4 flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-foreground truncate">
                            {course.title}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {course.category} • <span className={getLevelColorClass(course.level)}>{course.level}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {course.creator_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(course.status)}
                      {course.pricing.is_free && (
                        <Badge variant="primary" className="ml-2">Free</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      <div>
                        <div>{course.total_lessons} lessons</div>
                        <div className="text-xs text-muted-foreground">
                          {course.total_chapters} chapters
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {course.pricing.is_free ? (
                        <span className="text-success font-medium">Free</span>
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
                          className="text-primary hover:bg-primary/10"
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
                          className="text-muted-foreground hover:bg-muted"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>

                        {/* Delete Action */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCourse(course)}
                          className="text-destructive hover:bg-destructive/10"
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
                              className="text-success hover:bg-success/10"
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
                              className="text-destructive hover:bg-destructive/10"
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
                            className={`${course.pricing.is_free ? 'text-warning' : 'text-primary'} hover:bg-primary/10`}
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
          <div className="border-t border-border bg-muted px-6 py-4">
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
                  src={getAttachmentUrl(selectedCourse.thumbnail)} 
                  alt={selectedCourse.title}
                  className="h-24 w-32 object-cover rounded-lg"
                />
              ) : (
                <div className="h-24 w-32 bg-muted rounded-lg flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground">{selectedCourse.title}</h3>
                <p className="text-muted-foreground mt-1">{selectedCourse.description}</p>
                <div className="flex items-center space-x-4 mt-3">
                  {getStatusBadge(selectedCourse.status)}
                  <Badge variant="primary">
                    {selectedCourse.pricing.is_free ? 'Free' : `$${selectedCourse.pricing.price}`}
                  </Badge>
                  <span className="text-sm text-muted-foreground">by {selectedCourse.creator_name}</span>
                </div>
              </div>
            </div>

            {/* Course Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{selectedCourse.total_lessons}</div>
                <div className="text-sm text-muted-foreground">Lessons</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{selectedCourse.total_chapters}</div>
                <div className="text-sm text-muted-foreground">Chapters</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{selectedCourse.stats.total_enrollments}</div>
                <div className="text-sm text-muted-foreground">Enrollments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{selectedCourse.stats.average_rating || 0}</div>
                <div className="text-sm text-muted-foreground">Rating</div>
              </div>
            </div>

            {/* Rejection Reason */}
            {selectedCourse.status === 'rejected' && selectedCourse.rejection_reason && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                <h4 className="font-medium text-destructive mb-2">Rejection Reason:</h4>
                <p className="text-destructive">{selectedCourse.rejection_reason}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3">
              {selectedCourse.status === 'review' && (
                <>
                  <Button
                    onClick={() => handleApproveCourse(selectedCourse)}
                    loading={actionLoading}
                    className="bg-success hover:bg-success/80"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve Course
                  </Button>
                  
                  <Button
                    onClick={() => setShowRejectModal(true)}
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
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
            <p className="text-muted-foreground">
              Please provide a reason for rejecting <strong>{selectedCourse.title}</strong>. 
              This feedback will be sent to the content creator.
            </p>
            
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this course is being rejected..."
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive"
              rows={4}
            />
            
            <div className="flex space-x-3">
              <Button
                onClick={handleRejectCourse}
                loading={actionLoading}
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
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
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Confirm Bulk Deletion
                </h3>
                <p className="text-muted-foreground">
                  You are about to permanently delete {selectedCourses.size} course{selectedCourses.size > 1 ? 's' : ''}. 
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Warning Details */}
            <div className="bg-warning/10 border border-warning/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <h4 className="font-medium text-warning">Warning</h4>
              </div>
              <p className="text-sm text-warning">
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
    </Container>
  );
}