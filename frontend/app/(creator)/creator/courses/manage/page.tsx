'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  MoreVertical,
  BarChart,
  Copy,
  Archive,
  CheckSquare,
  Square
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { getCourses, deleteCourse } from '@/lib/api/courses';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';
import { toast } from 'react-hot-toast';

interface CourseManageItem {
  id: string;
  title: string;
  status: string;
  category: string;
  level: string;
  students: number;
  revenue: number;
  rating: number;
  reviews: number;
  createdAt: string;
  updatedAt: string;
  selected?: boolean;
}

const CourseManagePage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseManageItem[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseManageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('updated');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
      toast.error('Access denied. Creator access required.');
      router.push('/dashboard');
      return;
    }

    fetchCourses();
  }, [user, router]);

  useEffect(() => {
    filterAndSortCourses();
  }, [courses, searchTerm, filterStatus, sortBy]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await getCourses(`creator_id=${user?.id}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Operation Failed');
      }
      
      const formattedCourses = (response.data?.courses || []).map((course: any) => ({
        id: course._id,
        title: course.title,
        status: course.status,
        category: course.category,
        level: course.level,
        students: course.stats?.total_enrollments || 0,
        revenue: course.stats?.total_revenue || 0,
        rating: course.stats?.average_rating || 0,
        reviews: course.stats?.total_reviews || 0,
        createdAt: course.created_at,
        updatedAt: course.updated_at,
        selected: false
      }));
      setCourses(formattedCourses);
    } catch (error: any) {
      console.error('Failed to fetch courses:', error);
      toast.error(error.message || 'Operation Failed');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCourses = () => {
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
        filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'students':
        filtered.sort((a, b) => b.students - a.students);
        break;
      case 'revenue':
        filtered.sort((a, b) => b.revenue - a.revenue);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    setFilteredCourses(filtered);
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
      toast.error('No courses selected');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedCourses.length} courses? This action cannot be undone.`)) {
      return;
    }

    try {
      // In real app, would have bulk delete endpoint
      let lastResponse;
      for (const courseId of selectedCourses) {
        lastResponse = await deleteCourse(courseId);
      }
      
      setCourses(courses.filter(c => !selectedCourses.includes(c.id)));
      setSelectedCourses([]);
      toast.success(lastResponse?.message || 'Operation Failed');
    } catch (error: any) {
      console.error('Failed to delete courses:', error);
      toast.error(error.message || 'Operation Failed');
    }
  };

  const handleExportData = () => {
    // In real app, would generate CSV/Excel file
    const csvData = filteredCourses.map(course => ({
      Title: course.title,
      Status: course.status,
      Students: course.students,
      Revenue: course.revenue,
      Rating: course.rating,
      Created: formatDate(course.createdAt),
      Updated: formatDate(course.updatedAt)
    }));

    console.log('Export data:', csvData);
    toast.success('Course data exported successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-600 bg-green-100';
      case 'draft':
        return 'text-gray-600 bg-gray-100';
      case 'review':
        return 'text-yellow-600 bg-yellow-100';
      case 'archived':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
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
            <h1 className="text-2xl font-bold">Manage Courses</h1>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleExportData}
                disabled={filteredCourses.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push('/creator/courses/new')}
              >
                Create Course
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

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedCourses.length > 0 && (
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
            <p className="text-gray-600">No courses found matching your criteria</p>
          </Card>
        ) : (
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
                      <Badge className={getStatusColor(course.status)}>
                        {course.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {course.students}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatCurrency(course.revenue)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900">
                          {course.rating.toFixed(1)}
                        </span>
                        <span className="text-yellow-400 ml-1">⭐</span>
                        <span className="text-sm text-gray-500 ml-1">
                          ({course.reviews})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(course.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/creator/courses/${course.id}/analytics`)}
                          title="Analytics"
                        >
                          <BarChart className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/creator/courses/${course.id}/edit`)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/courses/${course.id}`)}
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

export default CourseManagePage;