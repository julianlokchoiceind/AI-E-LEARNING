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
import { 
  useCourseQuery,
  useUpdateCourse,
  useCourseChaptersQuery, 
  useReorderChapters,
  useReorderLessons 
} from '@/hooks/queries/useCourses';
import { CourseDetailData } from '@/lib/api/courses';
import { useDeleteChapter } from '@/hooks/queries/useChapters';
import { useDeleteLesson } from '@/hooks/queries/useLessons';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingStates';
import { ToastService } from '@/lib/toast/ToastService';
import { StandardResponse } from '@/lib/types/api';

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
  const typedCourseResponse = courseResponse as StandardResponse<CourseDetailData> | null;
  const { data: chaptersResponse, loading: chaptersLoading, refetch: refetchChapters } = useCourseChaptersQuery(courseId);
  const typedChaptersResponse = chaptersResponse as StandardResponse<{ chapters: any[] }> | null;
  const { mutateAsync: updateCourseAction } = useUpdateCourse(true); // 🔧 FIX: silent=true for autosave (no toast spam)
  const { mutateAsync: manualSaveCourseAction } = useUpdateCourse(false); // 🔧 Manual save with toast feedback

  // 🔧 Custom manual save handler with toast feedback
  const handleManualSave = async () => {
    if (!courseData) {
      ToastService.error('No course data to save');
      return;
    }

    const courseIdToUse = courseData.id || courseId;
    if (!courseIdToUse) {
      ToastService.error('Course ID missing');
      return;
    }

    // Filter out system fields (same logic as autosave)
    const { 
      _id, id, created_at, updated_at, stats, creator_id, creator_name, slug,
      ...userEditableFields  
    } = courseData;

    const updateData = Object.fromEntries(
      Object.entries(userEditableFields).filter(([_, v]) => v !== undefined && v !== null)
    );

    try {
      await manualSaveCourseAction({ courseId: courseIdToUse, data: updateData });
      // Toast will be shown automatically by useApiMutation (showToast=true)
    } catch (error: any) {
      // Error toast will be shown automatically by useApiMutation
      console.error('Manual save failed:', error);
    }
  };
  
  // React Query mutations for chapter and lesson operations
  const { mutate: deleteChapterMutation } = useDeleteChapter();
  const { mutate: deleteLessonMutation } = useDeleteLesson();
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

  // Auto-save hook - only initialize when courseData is available
  const { saveStatus, lastSavedAt, error, forceSave, hasUnsavedChanges, isOnline, hasPendingChanges } = useAutosave(
    courseData,
    {
      delay: 2000, // 🔧 CHANGED: 2s after user stops typing as requested
      initialLastSavedAt: courseData?.updated_at || courseData?.created_at, // Initialize from server data
      enabled: !!courseData, // 🔧 FIX: Only enable when courseData exists
      onSave: async (data) => {
        console.log('🚀 [FORCE SAVE DEBUG] onSave called with data:', {
          hasData: !!data,
          hasId: !!data?.id,
          hasUnderscore_id: !!data?._id,
          dataKeys: data ? Object.keys(data) : [],
          idValue: data?.id,
          _idValue: data?._id,
          title: data?.title
        });
        
        if (!data) {
          console.error('❌ [FORCE SAVE] No data provided');
          return;
        }
        
        // Get courseId from data or use the route param as fallback
        const courseIdToUse = data.id || courseId;
        
        if (!courseIdToUse) {
          console.error('❌ [FORCE SAVE] No course ID found in data or route params');
          return;
        }
        
        // Autosave triggered with course data
        console.log('✅ [FORCE SAVE] Proceeding with save, courseId:', courseIdToUse);
        
        // Send ALL fields dynamically - no need to list manually!
        // We filter out system/read-only fields that shouldn't be sent in updates
        const { 
          _id,           // MongoDB ID
          id,            // Our ID  
          created_at,    // System timestamp
          updated_at,    // System timestamp
          stats,         // Read-only statistics
          creator_id,    // Can't change creator
          creator_name,  // Derived from creator
          slug,          // Auto-generated
          ...userEditableFields  // Everything else can be edited
        } = data;
        
        // Remove undefined/null fields to keep payload clean
        const updateData = Object.fromEntries(
          Object.entries(userEditableFields).filter(([_, v]) => v !== undefined && v !== null)
        );
        
        try {
          console.log('📤 [FORCE SAVE] Calling updateCourseAction with ALL fields:', { courseId: courseIdToUse, data: updateData });
          await updateCourseAction({ courseId: courseIdToUse, data: updateData });
          console.log('✅ [FORCE SAVE] Update successful');
        } catch (error) {
          console.error('❌ [FORCE SAVE] Update failed:', error);
          // Autosave failed - error will be handled by useAutosave hook
          throw error;
        }
      },
    }
  );

  // Initialize data from React Query responses
  useEffect(() => {
    if (typedCourseResponse?.data) {
      // Backend returns { success: true, data: { id, title, ... } }
      // So courseResponse.data is the actual course data
      const courseData = typedCourseResponse.data;
      console.log('🔍 [DEBUG] Course response data:', {
        hasId: !!courseData?.id,
        hasUnderscore_id: !!(courseData as any)?._id,
        keys: courseData ? Object.keys(courseData) : [],
        idValue: courseData?.id,
        _idValue: (courseData as any)?._id
      });
      setCourseData(courseData);
      setTitleInput(courseData?.title || '');
    }
  }, [typedCourseResponse, setCourseData]);
  
  useEffect(() => {
    if (typedChaptersResponse?.data) {
      // Backend returns { success: true, data: { chapters: [...] } }
      // So chaptersResponse.data.chapters is the chapters array
      const chapters = typedChaptersResponse.data.chapters || [];
      setChapters(chapters);
    }
  }, [typedChaptersResponse]);
  
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
    // React Query cache invalidation handles updates automatically
    // Manual state update removed to prevent conflicts with React Query
    
    // Toast is already shown in CreateChapterModal
  };

  const handleCreateLesson = (chapterId: string) => {
    // Use setTimeout to ensure React state updates are complete
    setTimeout(() => {
      setSelectedChapterId(chapterId);
      setIsLessonModalOpen(true);
    }, 0);
  };

  const handleLessonCreated = (newLesson: LessonResponse) => {
    // React Query cache invalidation handles updates automatically
    // Manual state update removed to prevent conflicts with React Query
    
    // Toast is already shown in CreateLessonModal
  };

  const handleChapterEdit = (chapterId: string) => {
    // Find the chapter to edit
    const chapterToEdit = chapters.find(ch => ch.id === chapterId);
    if (chapterToEdit) {
      setSelectedChapterForEdit({
        id: chapterToEdit.id,
        title: chapterToEdit.title,
        description: chapterToEdit.description || '',
        order: chapterToEdit.order,
        course_id: chapterToEdit.course_id,
        status: chapterToEdit.status || 'draft'
      });
      setIsEditChapterModalOpen(true);
    }
  };

  const handleChapterEditDetailed = (chapterId: string) => {
    router.push(`/admin/courses/${courseId}/chapters/${chapterId}/edit`);
  };

  const handleChapterUpdated = (updatedChapter: ChapterEditData) => {
    // Update the local state so modal reflects current data when reopened
    setSelectedChapterForEdit(updatedChapter);
    
    // Update local state
    setChapters(prevChapters => {
      return prevChapters.map(chapter => {
        if (chapter.id === updatedChapter.id) {
          return {
            ...chapter,
            title: updatedChapter.title,
            description: updatedChapter.description,
            status: updatedChapter.status || 'draft'
          };
        }
        return chapter;
      });
    });
    
    // 🔧 FIX: Update SaveStatusIndicator manually since backend doesn't update course.updated_at
    // When chapter updates, we know content changed, so update the UI timestamp
    const updatedCourseData = { 
      ...courseData, 
      updated_at: new Date().toISOString() 
    };
    updateCourseData(updatedCourseData);
  };

  const handleChapterDelete = (chapterId: string) => {
    // Find the chapter to delete
    const chapterToDelete = chapters.find(ch => ch.id === chapterId);
    
    if (chapterToDelete) {
      setSelectedChapterForDelete({
        id: chapterToDelete.id,
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
    // Simply call the delete action - optimistic updates and toasts are handled in the hook
    deleteChapterMutation(chapterId);
  };

  const handleLessonEdit = (lessonId: string) => {
    // Find the lesson to edit across all chapters
    let lessonToEdit: any = null;
    let chapterOfLesson: any = null;

    for (const chapter of chapters) {
      if (chapter.lessons) {
        const foundLesson = chapter.lessons.find((lesson: any) => lesson.id === lessonId);
        if (foundLesson) {
          lessonToEdit = foundLesson;
          chapterOfLesson = chapter;
          break;
        }
      }
    }

    if (lessonToEdit && chapterOfLesson) {
      setSelectedLessonForEdit({
        id: lessonToEdit.id,
        chapter_id: chapterOfLesson.id,
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
        if (chapter.id === updatedLesson.chapter_id) {
          const updatedLessons = chapter.lessons.map((lesson: any) => {
            if (lesson.id === updatedLesson.id) {
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
    
    // 🔧 FIX: Update SaveStatusIndicator manually since backend doesn't update course.updated_at
    // When lesson updates, we know content changed, so update the UI timestamp
    const updatedCourseData = { 
      ...courseData, 
      updated_at: new Date().toISOString() 
    };
    updateCourseData(updatedCourseData);
    
    // 🔧 FIX: Force refetch to ensure lesson card sync
    setTimeout(() => {
      refetchChapters();
    }, 100);
  };

  const handleLessonDelete = (lessonId: string) => {
    // Find the lesson to delete across all chapters
    let lessonToDelete: any = null;
    let chapterOfLesson: any = null;

    for (const chapter of chapters) {
      if (chapter.lessons) {
        const foundLesson = chapter.lessons.find((lesson: any) => lesson.id === lessonId);
        if (foundLesson) {
          lessonToDelete = foundLesson;
          chapterOfLesson = chapter;
          break;
        }
      }
    }

    if (lessonToDelete && chapterOfLesson) {
      setSelectedLessonForDelete({
        id: lessonToDelete.id,
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

  const handleConfirmLessonDelete = (lessonId: string) => {
    // Simply call the delete action - optimistic updates and toasts are handled in the hook
    deleteLessonMutation(lessonId);
  };

  const handleChaptersReorder = async (reorderedChapters: any[]) => {
    try {
      // Update local state optimistically
      setChapters(reorderedChapters);

      // Prepare data for bulk reorder API
      const chapterOrders = reorderedChapters.map((chapter, index) => ({
        id: chapter.id,
        order: index + 1
      }));

      // Use React Query mutation instead of direct API call
      const response = await reorderChaptersMutation({ courseId, reorderData: chapterOrders });
      
      if (response?.success && response?.data) {
        // Update with response data to ensure consistency
        setChapters(response.data.chapters || reorderedChapters);
      }
    } catch (error: any) {
      console.error('Failed to reorder chapters:', error);
      ToastService.error(error.message || 'Something went wrong');
      
      // Error handled by optimistic update rollback in React Query
      throw error; // Re-throw so DroppableChapterList can handle it
    }
  };

  const handleLessonsReorder = async (chapterId: string, reorderedLessons: any[]) => {
    try {
      // Update local state optimistically
      setChapters(prevChapters => {
        return prevChapters.map(chapter => {
          if (chapter.id === chapterId) {
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
        id: lesson.id,
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
            if (chapter.id === chapterId) {
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
    <NavigationGuard 
      hasUnsavedChanges={hasUnsavedChanges}
      saveStatus={saveStatus}
      errorMessage={error}
      onForceSave={forceSave}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-40">
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
                <SaveStatusIndicator
                  status={saveStatus}
                  lastSavedAt={lastSavedAt}
                  error={error}
                />
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Find the first lesson of the first chapter
                    const firstChapter = chapters.find(ch => ch.lessons && ch.lessons.length > 0);
                    if (firstChapter && firstChapter.lessons && firstChapter.lessons.length > 0) {
                      const firstLesson = firstChapter.lessons[0];
                      router.push(`/learn/${courseId}/${firstLesson.id}?preview=true`);
                    } else {
                      ToastService.info('No lessons available yet. Please add chapters and lessons first.');
                    }
                  }}
                >
                  Preview
                </Button>
                
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleManualSave}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
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
                    onClick={() => setActiveTab('chapters')}
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
                    onClick={() => setActiveTab('settings')}
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
                      onLessonEditDetailed={handleLessonEditDetailed}
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