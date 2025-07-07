'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Settings, BookOpen, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SaveStatusIndicator } from '@/components/ui/SaveStatusIndicator';
import NavigationGuard from '@/components/feature/NavigationGuard';
import DroppableChapterList from '@/components/feature/DroppableChapterList';
import CreateChapterModal, { ChapterResponse } from '@/components/feature/CreateChapterModal';
import CreateLessonModal, { LessonResponse } from '@/components/feature/CreateLessonModal';
import EditChapterModal, { ChapterEditData } from '@/components/feature/EditChapterModal';
import DeleteChapterModal, { ChapterDeleteData } from '@/components/feature/DeleteChapterModal';
import EditLessonModal, { LessonEditData } from '@/components/feature/EditLessonModal';
import DeleteLessonModal, { LessonDeleteData } from '@/components/feature/DeleteLessonModal';
import { useAutosave } from '@/hooks/useAutosave';
import { useEditorStore } from '@/stores/editorStore';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateCourse } from '@/hooks/queries/useCreatorCourses';
import { useCourseQuery } from '@/hooks/queries/useCourses';
import { 
  useCourseChaptersQuery, 
  useDeleteChapter, 
  useReorderChapters,
  useDeleteLesson, 
  useReorderLessons 
} from '@/hooks/queries/useCreatorCourses';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingStates';
import { ToastService } from '@/lib/toast/ToastService';

const CourseBuilderPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;

  const {
    courseData,
    setCourseData,
    updateCourseData,
    activeTab,
    setActiveTab,
    reset,
  } = useEditorStore();

  const [chapters, setChapters] = useState<any[]>([]);
  
  // React Query hooks - automatic caching and state management
  const { data: courseResponse, loading: courseLoading, refetch: refetchCourse } = useCourseQuery(courseId);
  const { data: chaptersResponse, loading: chaptersLoading, refetch: refetchChapters } = useCourseChaptersQuery(courseId);
  const { mutateAsync: updateCourseAction } = useUpdateCourse();
  
  // React Query mutations for chapter and lesson operations
  const { mutateAsync: deleteChapterMutation } = useDeleteChapter();
  const { mutateAsync: deleteLessonMutation } = useDeleteLesson();
  const { mutateAsync: reorderChaptersMutation } = useReorderChapters();
  const { mutateAsync: reorderLessonsMutation } = useReorderLessons();
  
  // Combined loading state
  const loading = courseLoading || chaptersLoading;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isEditChapterModalOpen, setIsEditChapterModalOpen] = useState(false);
  const [isDeleteChapterModalOpen, setIsDeleteChapterModalOpen] = useState(false);
  const [isEditLessonModalOpen, setIsEditLessonModalOpen] = useState(false);
  const [isDeleteLessonModalOpen, setIsDeleteLessonModalOpen] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [selectedChapterForEdit, setSelectedChapterForEdit] = useState<ChapterEditData | null>(null);
  const [selectedChapterForDelete, setSelectedChapterForDelete] = useState<ChapterDeleteData | null>(null);
  const [selectedLessonForEdit, setSelectedLessonForEdit] = useState<LessonEditData | null>(null);
  const [selectedLessonForDelete, setSelectedLessonForDelete] = useState<LessonDeleteData | null>(null);

  // Auto-save hook
  const { saveStatus, lastSavedAt, error, forceSave, hasUnsavedChanges } = useAutosave(
    courseData,
    {
      delay: 5000, // Increased delay to 5 seconds to reduce timeout issues
      onSave: async (data) => {
        if (!data || !data._id) return;
        
        // Autosave triggered with course data
        
        // Try with minimal data first to isolate the issue
        const minimalData = {
          title: data.title,
          description: data.description,
        };
        
        try {
          await updateCourseAction({ courseId: data._id, courseData: minimalData });
        } catch (error) {
          // Autosave failed - error will be handled by useAutosave hook
          throw error;
        }
      },
      enabled: !!courseData,
    }
  );

  // Initialize data from React Query responses
  useEffect(() => {
    if (courseResponse?.data) {
      setCourseData(courseResponse.data);
      setTitleInput(courseResponse.data.title);
    }
  }, [courseResponse, setCourseData]);
  
  useEffect(() => {
    if (chaptersResponse?.data?.chapters) {
      setChapters(chaptersResponse.data.chapters);
    }
  }, [chaptersResponse]);
  
  useEffect(() => {
    return () => {
      reset(); // Clean up on unmount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Permission check and backend health check
  useEffect(() => {
    if (user && user.role !== 'creator' && user.role !== 'admin') {
      ToastService.error('You do not have permission to edit courses');
      router.push('/dashboard');
    }
    
    // Check backend health - health endpoint is at /health, not /api/v1/health
    const checkHealth = async () => {
      try {
        const response = await fetch('http://localhost:8000/health');
        if (!response.ok) {
          ToastService.error('Backend server is not responding properly');
        } else {
          // Backend health check successful
        }
      } catch (error) {
        ToastService.error('Cannot connect to backend server. Make sure it is running on http://localhost:8000');
      }
    };
    
    checkHealth();
  }, [user, router]);

  const handleTitleSave = () => {
    if (titleInput.trim() && titleInput !== courseData?.title) {
      updateCourseData({ title: titleInput.trim() });
      setIsEditingTitle(false);
    }
  };

  const handleCreateChapter = () => {
    setIsChapterModalOpen(true);
  };

  const handleChapterCreated = (newChapter: ChapterResponse) => {
    // Process chapter response from backend
    
    // 🔧 FIX: Backend returns 'id' field, but UI expects '_id' field
    const backendId = (newChapter as any).id;
    const frontendId = newChapter._id;
    const finalId = backendId || frontendId;
    
    if (!finalId) {
      ToastService.error('Chapter created but no ID returned from backend. Please refresh the page.');
      return;
    }
    
    const transformedChapter = {
      ...newChapter,
      _id: finalId, // Use backend 'id' first, fallback to '_id'
      lessons: [],
      total_lessons: 0,
      total_duration: 0
    };
    
    // Chapter transformed successfully
    
    setChapters(prev => {
      const newChapters = [...prev, transformedChapter];
      // Chapters array updated
      return newChapters;
    });
    // Auto-save will handle the course update automatically
  };

  const handleCreateLesson = (chapterId: string) => {
    // Use setTimeout to ensure React state updates are complete
    setTimeout(() => {
      setSelectedChapterId(chapterId);
      setIsLessonModalOpen(true);
    }, 0);
  };

  const handleLessonCreated = (newLesson: LessonResponse) => {
    
    // 🔧 FIX: Backend returns 'id' field, but UI expects '_id' field
    const backendId = (newLesson as any).id;
    const frontendId = newLesson._id;
    const finalId = backendId || frontendId;
    
    if (!finalId) {
      ToastService.error('Lesson created but no ID returned from backend. Please refresh the page.');
      return;
    }
    
    const transformedLesson = {
      ...newLesson,
      _id: finalId, // Use backend 'id' first, fallback to '_id'
    };
    
    // Lesson transformed successfully
    
    // Update local state - add lesson to the appropriate chapter
    setChapters(prevChapters => {
      return prevChapters.map(chapter => {
        if (chapter._id === transformedLesson.chapter_id) {
          const updatedLessons = [...(chapter.lessons || []), transformedLesson];
          // Lessons updated in chapter
          return {
            ...chapter,
            lessons: updatedLessons,
            total_lessons: updatedLessons.length
          };
        }
        return chapter;
      });
    });
    // Auto-save will handle the course update automatically
  };

  const handleChapterEdit = (chapterId: string) => {
    // Find the chapter to edit
    const chapterToEdit = chapters.find(ch => ch._id === chapterId);
    if (chapterToEdit) {
      setSelectedChapterForEdit({
        _id: chapterToEdit._id,
        title: chapterToEdit.title,
        description: chapterToEdit.description || '',
        order: chapterToEdit.order,
        course_id: chapterToEdit.course_id
      });
      setIsEditChapterModalOpen(true);
    }
  };

  const handleChapterEditDetailed = (chapterId: string) => {
    router.push(`/admin/courses/${courseId}/chapters/${chapterId}/edit`);
  };

  const handleChapterUpdated = (updatedChapter: ChapterEditData) => {
    // Update local state
    setChapters(prevChapters => {
      return prevChapters.map(chapter => {
        if (chapter._id === updatedChapter._id) {
          return {
            ...chapter,
            title: updatedChapter.title,
            description: updatedChapter.description
          };
        }
        return chapter;
      });
    });
  };

  const handleChapterDelete = (chapterId: string) => {
    // Find the chapter to delete
    const chapterToDelete = chapters.find(ch => ch._id === chapterId);
    
    if (chapterToDelete) {
      setSelectedChapterForDelete({
        _id: chapterToDelete._id,
        title: chapterToDelete.title,
        description: chapterToDelete.description,
        total_lessons: chapterToDelete.total_lessons || 0
      });
      setIsDeleteChapterModalOpen(true);
      // Delete modal opened
    } else {
      console.error('❌ Chapter not found for deletion');
    }
  };

  const handleConfirmChapterDelete = async (chapterId: string) => {
    try {
      // Use React Query mutation instead of direct API call
      const response = await deleteChapterMutation(chapterId);
      setChapters(chapters.filter(ch => ch._id !== chapterId));
      ToastService.success(response.message || 'Something went wrong');
    } catch (error: any) {
      console.error('Failed to delete chapter:', error);
      ToastService.error(error.message || 'Something went wrong');
      throw error; // Re-throw to handle in modal
    }
  };

  const handleLessonEdit = (lessonId: string) => {
    // Find the lesson to edit across all chapters
    let lessonToEdit: any = null;
    let chapterOfLesson: any = null;

    for (const chapter of chapters) {
      if (chapter.lessons) {
        const foundLesson = chapter.lessons.find((lesson: any) => lesson._id === lessonId);
        if (foundLesson) {
          lessonToEdit = foundLesson;
          chapterOfLesson = chapter;
          break;
        }
      }
    }

    if (lessonToEdit && chapterOfLesson) {
      setSelectedLessonForEdit({
        _id: lessonToEdit._id,
        chapter_id: chapterOfLesson._id,
        course_id: courseId,
        title: lessonToEdit.title,
        description: lessonToEdit.description,
        order: lessonToEdit.order,
        video: lessonToEdit.video,
        content: lessonToEdit.content,
        resources: lessonToEdit.resources,
        status: lessonToEdit.status || 'draft'
      });
      setIsEditLessonModalOpen(true);
    }
  };

  const handleLessonEditDetailed = (lessonId: string) => {
    router.push(`/admin/courses/${courseId}/lessons/${lessonId}/edit`);
  };

  const handleLessonUpdated = (updatedLesson: LessonEditData) => {
    // Update local state - find the chapter and update the lesson
    setChapters(prevChapters => {
      return prevChapters.map(chapter => {
        if (chapter._id === updatedLesson.chapter_id) {
          const updatedLessons = chapter.lessons.map((lesson: any) => {
            if (lesson._id === updatedLesson._id) {
              return {
                ...lesson,
                title: updatedLesson.title,
                description: updatedLesson.description,
                video: updatedLesson.video,
                content: updatedLesson.content,
                status: updatedLesson.status
              };
            }
            return lesson;
          });
          return {
            ...chapter,
            lessons: updatedLessons
          };
        }
        return chapter;
      });
    });
  };

  const handleLessonDelete = (lessonId: string) => {
    // Find the lesson to delete across all chapters
    let lessonToDelete: any = null;
    let chapterOfLesson: any = null;

    for (const chapter of chapters) {
      if (chapter.lessons) {
        const foundLesson = chapter.lessons.find((lesson: any) => lesson._id === lessonId);
        if (foundLesson) {
          lessonToDelete = foundLesson;
          chapterOfLesson = chapter;
          break;
        }
      }
    }

    if (lessonToDelete && chapterOfLesson) {
      setSelectedLessonForDelete({
        _id: lessonToDelete._id,
        title: lessonToDelete.title,
        description: lessonToDelete.description,
        chapter_title: chapterOfLesson.title,
        order: lessonToDelete.order,
        video: lessonToDelete.video,
        content: lessonToDelete.content,
        status: lessonToDelete.status || 'draft'
      });
      setIsDeleteLessonModalOpen(true);
    }
  };

  const handleConfirmLessonDelete = async (lessonId: string) => {
    try {
      // Use React Query mutation instead of direct API call
      const response = await deleteLessonMutation(lessonId);
      
      // Update local state - remove lesson from the chapter
      setChapters(prevChapters => {
        return prevChapters.map(chapter => {
          const updatedLessons = chapter.lessons.filter((l: any) => l._id !== lessonId);
          return {
            ...chapter,
            lessons: updatedLessons,
            total_lessons: updatedLessons.length
          };
        });
      });
      
      ToastService.success(response.message || 'Something went wrong');
    } catch (error: any) {
      console.error('Failed to delete lesson:', error);
      ToastService.error(error.message || 'Something went wrong');
      throw error; // Re-throw to handle in modal
    }
  };

  const handleChaptersReorder = async (reorderedChapters: any[]) => {
    try {
      // Update local state optimistically
      setChapters(reorderedChapters);

      // Prepare data for bulk reorder API
      const chapterOrders = reorderedChapters.map((chapter, index) => ({
        id: chapter._id,
        order: index + 1
      }));

      // Use React Query mutation instead of direct API call
      const response = await reorderChaptersMutation({ courseId, chapterOrders });
      
      if (response.success && response.data) {
        // Update with response data to ensure consistency
        setChapters(response.data.chapters || reorderedChapters);
      }
    } catch (error: any) {
      console.error('Failed to reorder chapters:', error);
      ToastService.error(error.message || 'Something went wrong');
      
      // Revert to original order on error
      refetchChapters();
      throw error; // Re-throw so DroppableChapterList can handle it
    }
  };

  const handleLessonsReorder = async (chapterId: string, reorderedLessons: any[]) => {
    try {
      // Update local state optimistically
      setChapters(prevChapters => {
        return prevChapters.map(chapter => {
          if (chapter._id === chapterId) {
            return {
              ...chapter,
              lessons: reorderedLessons
            };
          }
          return chapter;
        });
      });

      // Prepare data for bulk reorder API
      const lessonOrders = reorderedLessons.map((lesson, index) => ({
        id: lesson._id,
        order: index + 1
      }));

      // Use React Query mutation instead of direct API call
      const response = await reorderLessonsMutation({ 
        chapterId, 
        reorderData: { lesson_orders: lessonOrders.map(order => ({ lesson_id: order.id, new_order: order.order })) }
      });
      
      if (response.success && response.data) {
        // Update with response data to ensure consistency
        setChapters(prevChapters => {
          return prevChapters.map(chapter => {
            if (chapter._id === chapterId) {
              return {
                ...chapter,
                lessons: response.data?.lessons || reorderedLessons
              };
            }
            return chapter;
          });
        });
      }
    } catch (error: any) {
      console.error('Failed to reorder lessons:', error);
      ToastService.error(error.message || 'Something went wrong');
      
      // Revert to original order on error - React Query will handle refetch
      throw error; // Re-throw so DroppableLessonList can handle it
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Loading course data..." />
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="Course not found"
          description="The course you're looking for doesn't exist or you don't have permission to edit it."
          action={{
            label: 'Back to Courses',
            onClick: () => router.push('/admin/courses')
          }}
        />
      </div>
    );
  }

  return (
    <NavigationGuard hasUnsavedChanges={hasUnsavedChanges}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/admin/courses')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Courses
                </Button>
                
                {/* Course Title - Inline Editing */}
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyPress={(e) => e.key === 'Enter' && handleTitleSave()}
                    className="text-2xl font-bold px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                ) : (
                  <h1
                    className="text-2xl font-bold cursor-pointer hover:text-blue-600"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {courseData.title}
                  </h1>
                )}
              </div>

              <div className="flex items-center gap-4">
                {saveStatus !== 'saving' && (
                  <SaveStatusIndicator
                    status={saveStatus}
                    lastSavedAt={lastSavedAt}
                    error={error}
                  />
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/courses/${courseId}`)}
                >
                  Preview
                </Button>
                
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => forceSave()}
                  loading={saveStatus === 'saving'}
                  disabled={saveStatus === 'saving'}
                >
                  {saveStatus === 'saving' ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-4">
                <nav className="space-y-2">
                  <button
                    onClick={() => {
                      if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to switch tabs?')) {
                        return;
                      }
                      setActiveTab('general');
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'general'
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    General Info
                  </button>
                  
                  <button
                    onClick={() => {
                      if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to switch tabs?')) {
                        return;
                      }
                      setActiveTab('chapters');
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'chapters'
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    Chapters & Lessons
                  </button>
                  
                  <button
                    onClick={() => {
                      if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to switch tabs?')) {
                        return;
                      }
                      setActiveTab('settings');
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'settings'
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <Settings className="w-4 h-4 inline mr-2" />
                    Settings
                  </button>
                </nav>
              </Card>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3">
              {activeTab === 'general' && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-6">General Information</h2>
                  
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={courseData.description || ''}
                        onChange={(e) => updateCourseData({ description: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter course description..."
                      />
                    </div>

                    {/* Short Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Short Description
                      </label>
                      <input
                        type="text"
                        value={courseData.short_description || ''}
                        onChange={(e) => updateCourseData({ short_description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Brief description for course cards..."
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={courseData.category || ''}
                        onChange={(e) => updateCourseData({ category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select category</option>
                        <option value="programming">Programming</option>
                        <option value="ai-fundamentals">AI Fundamentals</option>
                        <option value="machine-learning">Machine Learning</option>
                        <option value="ai-tools">AI Tools</option>
                        <option value="production-ai">Production AI</option>
                      </select>
                    </div>

                    {/* Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Level
                      </label>
                      <select
                        value={courseData.level || ''}
                        onChange={(e) => updateCourseData({ level: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select level</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    {/* Syllabus */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What students will learn (one per line)
                      </label>
                      <textarea
                        value={(courseData.syllabus || []).join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n').filter(line => line.trim());
                          updateCourseData({ syllabus: lines });
                        }}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Build real-world AI applications&#10;Master machine learning fundamentals&#10;Deploy models to production"
                      />
                    </div>

                    {/* Prerequisites */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prerequisites (one per line)
                      </label>
                      <textarea
                        value={(courseData.prerequisites || []).join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n').filter(line => line.trim());
                          updateCourseData({ prerequisites: lines });
                        }}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Basic programming knowledge&#10;Familiarity with Python"
                      />
                    </div>
                  </div>
                </Card>
              )}

              {activeTab === 'chapters' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Chapters & Lessons</h2>
                    <Button
                      variant="primary"
                      onClick={handleCreateChapter}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Chapter
                    </Button>
                  </div>

                  {chapters.length === 0 ? (
                    <Card className="p-12 text-center">
                      <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold mb-2">No chapters yet</h3>
                      <p className="text-gray-600 mb-4">
                        Start building your course by adding chapters and lessons
                      </p>
                      <Button
                        variant="primary"
                        onClick={handleCreateChapter}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Chapter
                      </Button>
                    </Card>
                  ) : (
                    <DroppableChapterList
                      chapters={chapters}
                      onChaptersReorder={handleChaptersReorder}
                      onEdit={handleChapterEdit}
                      onDelete={handleChapterDelete}
                      onLessonEdit={handleLessonEdit}
                      onLessonDelete={handleLessonDelete}
                      onCreateLesson={handleCreateLesson}
                      onLessonsReorder={handleLessonsReorder}
                      isEditable={true}
                    />
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Course Settings</h2>
                  
                  <div className="space-y-6">
                    {/* Pricing */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pricing
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={courseData.pricing?.is_free === true}
                            onChange={() => updateCourseData({ 
                              pricing: { ...courseData.pricing, is_free: true, price: 0 }
                            })}
                            className="mr-2"
                          />
                          Free Course
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={courseData.pricing?.is_free === false}
                            onChange={() => updateCourseData({ 
                              pricing: { ...courseData.pricing, is_free: false }
                            })}
                            className="mr-2"
                          />
                          Paid Course
                        </label>
                        
                        {!courseData.pricing?.is_free && (
                          <div className="ml-6 space-y-3">
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                Price (USD)
                              </label>
                              <input
                                type="number"
                                value={courseData.pricing?.price || 0}
                                onChange={(e) => updateCourseData({
                                  pricing: { ...courseData.pricing, price: parseFloat(e.target.value) || 0 }
                                })}
                                min="0"
                                step="0.01"
                                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course Status
                      </label>
                      <select
                        value={courseData.status || 'draft'}
                        onChange={(e) => updateCourseData({ status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="review">Ready for Review</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                      <p className="mt-1 text-sm text-gray-500">
                        Only published courses are visible to students
                      </p>
                    </div>

                    {/* Target Audience */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Audience (one per line)
                      </label>
                      <textarea
                        value={(courseData.target_audience || []).join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n').filter(line => line.trim());
                          updateCourseData({ target_audience: lines });
                        }}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Beginner programmers&#10;Students interested in AI&#10;Professional developers"
                      />
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Creation Modal */}
      <CreateChapterModal
        isOpen={isChapterModalOpen}
        onClose={() => setIsChapterModalOpen(false)}
        courseId={courseId}
        onChapterCreated={handleChapterCreated}
      />

      {/* Lesson Creation Modal */}
      <CreateLessonModal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        chapterId={selectedChapterId}
        courseId={courseId}
        onLessonCreated={handleLessonCreated}
      />

      {/* Chapter Edit Modal */}
      <EditChapterModal
        isOpen={isEditChapterModalOpen}
        onClose={() => setIsEditChapterModalOpen(false)}
        chapter={selectedChapterForEdit}
        onChapterUpdated={handleChapterUpdated}
      />

      {/* Chapter Delete Modal */}
      <DeleteChapterModal
        isOpen={isDeleteChapterModalOpen}
        onClose={() => {
          setIsDeleteChapterModalOpen(false);
        }}
        chapter={selectedChapterForDelete}
        onConfirmDelete={handleConfirmChapterDelete}
      />

      {/* Lesson Edit Modal */}
      <EditLessonModal
        isOpen={isEditLessonModalOpen}
        onClose={() => setIsEditLessonModalOpen(false)}
        lesson={selectedLessonForEdit}
        onLessonUpdated={handleLessonUpdated}
      />

      {/* Lesson Delete Modal */}
      <DeleteLessonModal
        isOpen={isDeleteLessonModalOpen}
        onClose={() => setIsDeleteLessonModalOpen(false)}
        lesson={selectedLessonForDelete}
        onConfirmDelete={handleConfirmLessonDelete}
      />
    </NavigationGuard>
  );
};

export default CourseBuilderPage;