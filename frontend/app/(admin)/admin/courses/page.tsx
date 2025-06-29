'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { 
  getAdminCourses, 
  approveCourse, 
  rejectCourse, 
  setCoursePrice,
  toggleCourseFree
} from '@/lib/api/admin';
import { toast } from 'react-hot-toast';
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
  Gift
} from 'lucide-react';

interface Course {
  _id: string;
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
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('review');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await getAdminCourses({
        search: searchTerm,
        status: statusFilter,
        category: categoryFilter
      });
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCourse = async (courseId: string) => {
    try {
      setActionLoading({ ...actionLoading, [courseId]: true });
      const response = await approveCourse(courseId);
      
      if (response.success) {
        toast.success('Course approved successfully');
        await fetchCourses(); // Refresh list
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve course');
    } finally {
      setActionLoading({ ...actionLoading, [courseId]: false });
    }
  };

  const handleRejectCourse = async () => {
    if (!selectedCourse || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    
    try {
      setActionLoading({ ...actionLoading, [selectedCourse._id]: true });
      const response = await rejectCourse(selectedCourse._id, rejectionReason);
      
      if (response.success) {
        toast.success('Course rejected');
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedCourse(null);
        await fetchCourses(); // Refresh list
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject course');
    } finally {
      setActionLoading({ ...actionLoading, [selectedCourse._id]: false });
    }
  };

  const handleToggleFree = async (courseId: string, currentStatus: boolean) => {
    try {
      setActionLoading({ ...actionLoading, [courseId]: true });
      const response = await toggleCourseFree(courseId, !currentStatus);
      
      if (response.success) {
        toast.success(`Course marked as ${!currentStatus ? 'free' : 'paid'}`);
        await fetchCourses(); // Refresh list
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update course pricing');
    } finally {
      setActionLoading({ ...actionLoading, [courseId]: false });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case 'review':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
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

  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchTerm === '' || 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.creator_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || course.status === statusFilter;
    const matchesCategory = categoryFilter === '' || course.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
          <p className="text-gray-600">Review and approve courses from content creators</p>
        </div>
        <Button onClick={fetchCourses}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">
                {courses.filter(c => c.status === 'review').length}
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
                {courses.filter(c => c.status === 'published').length}
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
                {courses.filter(c => c.status === 'rejected').length}
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
                {courses.filter(c => c.pricing.is_free).length}
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
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchCourses()}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Status</option>
            <option value="review">Pending Review</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
            <option value="draft">Draft</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Categories</option>
            <option value="programming">Programming</option>
            <option value="ai-fundamentals">AI Fundamentals</option>
            <option value="machine-learning">Machine Learning</option>
            <option value="ai-tools">AI Tools</option>
            <option value="production-ai">Production AI</option>
          </select>

          {/* Search Button */}
          <Button onClick={fetchCourses} className="w-full">
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </Button>
        </div>
      </Card>

      {/* Courses Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            Courses ({filteredCourses.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                {filteredCourses.map((course) => (
                  <tr key={course._id} className="hover:bg-gray-50">
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
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedCourse(course);
                            setShowCourseModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {course.status === 'review' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleApproveCourse(course._id)}
                              loading={actionLoading[course._id]}
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
                            onClick={() => handleToggleFree(course._id, course.pricing.is_free)}
                            loading={actionLoading[course._id]}
                            className={`${course.pricing.is_free ? 'text-yellow-600' : 'text-blue-600'} hover:bg-blue-50`}
                          >
                            <Gift className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                    onClick={() => handleApproveCourse(selectedCourse._id)}
                    loading={actionLoading[selectedCourse._id]}
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
                  onClick={() => handleToggleFree(selectedCourse._id, selectedCourse.pricing.is_free)}
                  loading={actionLoading[selectedCourse._id]}
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
                loading={actionLoading[selectedCourse._id]}
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
    </div>
  );
}