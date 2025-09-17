'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Settings, BookOpen, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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
import CourseImageUpload from '@/components/feature/CourseImageUpload';
import { useAutosave } from '@/hooks/useAutosave';
import { useEditorStore } from '@/stores/editorStore';
import { useAuth } from '@/hooks/useAuth';
import { 
  useCourseEditorQuery, 
  useCourseChaptersQuery, 
  useUpdateCourse,
  useReorderChapters,
  useReorderLessons
} from '@/hooks/queries/useCourses';
import { useDeleteChapter } from '@/hooks/queries/useChapters';
import { useDeleteLesson } from '@/hooks/queries/useLessons';
import { ErrorState } from '@/components/ui/LoadingStates';
import { ToastService } from '@/lib/toast/ToastService';
import { Container } from '@/components/ui/Container';

// Type for chapters with lessons
interface ChapterWithLessons {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order: number;
  total_lessons: number;
  total_duration: number;
  status: string;
  created_at: string;
  updated_at: string;
  lessons?: LessonResponse[];
}

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

  // React Query hooks for data fetching
  const { data: courseResponse, loading: courseLoading, refetch: refetchCourse } = useCourseEditorQuery(courseId);
  const { data: chaptersResponse, loading: chaptersLoading, refetch: refetchChapters } = useCourseChaptersQuery(courseId);
  
  // React Query mutations
  const { mutateAsync: updateCourseAction } = useUpdateCourse(true); // silent=true for autosave (no toast spam)
  const { mutateAsync: manualSaveCourseAction } = useUpdateCourse(false); // Manual save with toast feedback
  const { mutate: deleteChapterAction } = useDeleteChapter();
  const { mutate: deleteLessonAction } = useDeleteLesson();
  const { mutateAsync: reorderChaptersAction } = useReorderChapters();
  const { mutateAsync: reorderLessonsAction } = useReorderLessons();
  
  // Combined loading state
  const loading = courseLoading || chaptersLoading;
  
  // Computed data from React Query responses
  const chapters = React.useMemo(() => {
    if (chaptersResponse?.data) {
      // Backend returns { success: true, data: { chapters: [...] } }
      // So chaptersResponse.data.chapters is the chapters array
      return (chaptersResponse.data as { chapters: ChapterWithLessons[] })?.chapters || [];
    }
    return [] as ChapterWithLessons[];
  }, [chaptersResponse]);

  // Calculate published chapters and lessons for validation requirements
  const publishedChapters = React.useMemo(() => {
    return chapters.filter(chapter => chapter.status === 'published').length;
  }, [chapters]);

  const publishedLessons = React.useMemo(() => {
    return chapters.reduce((total, chapter) => {
      if (chapter.lessons) {
        return total + chapter.lessons.filter(lesson =>
          lesson.status === 'published' &&
          (lesson.video?.url || lesson.video?.youtube_id)
        ).length;
      }
      return total;
    }, 0);
  }, [chapters]);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
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

  // Auto-save hook with React Query mutation - only when courseData available
  const { saveStatus, lastSavedAt, error, forceSave, hasUnsavedChanges, isOnline, hasPendingChanges } = useAutosave(
    courseData,
    {
      delay: 2000,
      initialLastSavedAt: courseData?.updated_at || courseData?.created_at,
      enabled: !!courseData, // 🔧 FIX: Only enable when courseData exists
      onSave: async (data) => {
        if (!data) {
          return;
        }
        
        // Get courseId from data or use the route param as fallback
        const courseIdToUse = data.id || courseId;
        
        if (!courseIdToUse) {
          console.error('❌ [AUTOSAVE DEBUG] No course ID found in data or route params');
          return;
        }
        
        try {
          const result = await updateCourseAction({ courseId: courseIdToUse, data: data });
        } catch (error: any) {
          // Show validation error toast
          const status = error?.statusCode;
          const message = error?.message;

          // Show validation error for 400 status
          if (status === 400 && message) {
            ToastService.error(message);
          }

          throw error;
        }
      },
      showToastOnError: false // Prevent duplicate toast notifications
    }
  );

  // Custom manual save handler with toast feedback
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

    setIsSaving(true);
    try {
      await manualSaveCourseAction({ courseId: courseIdToUse, data: updateData });
      // Toast will be shown automatically by useApiMutation (showToast=true)
    } catch (error: any) {
      // Check if it's a validation error and revert status to draft
      const status = error?.statusCode;
      if (status === 400 && courseData.status === 'review') {
        updateCourseData({ status: 'draft' });
      }
      // Error toast will be shown automatically by useApiMutation
      // Only log non-validation errors
      if (status !== 400) {
        console.error('Manual save failed:', error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Initialize data from React Query responses
  useEffect(() => {
    if (courseResponse?.data) {
      // Backend returns { success: true, data: { id, title, ... } }
      // So courseResponse.data is the actual course data
      const courseData = courseResponse.data;
      setCourseData(courseData);
      setTitleInput(courseData?.title || '');
    }
  }, [courseResponse, setCourseData]);

  useEffect(() => {
    // Check permissions
    if (user && user?.role !== 'creator') {
      if (user.role === 'admin') {
        // Admin redirect to admin courses
        router.push('/admin/courses');
      } else {
        // Students/others redirect to 404
        router.push('/not-found');
      }
      return;
    }
  }, [user, router]);
  
  useEffect(() => {
    return () => {
      reset(); // Clean up on unmount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React Query handles data fetching automatically

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
    // No manual refetch needed - this prevents loading states
    
    // Toast is already shown in CreateChapterModal
  };

  const handleCreateLesson = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setIsLessonModalOpen(true);
  };

  const handleLessonCreated = (newLesson: LessonResponse) => {
    // React Query cache invalidation handles updates automatically
    // No manual refetch needed - this prevents loading states
    
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
        course_name: courseData?.title,
        status: chapterToEdit.status || 'draft'
      });
      setIsEditChapterModalOpen(true);
    }
  };

  const handleChapterEditDetailed = (chapterId: string) => {
    router.push(`/creator/courses/${courseId}/chapters/${chapterId}/edit`);
  };

  const handleChapterUpdated = (updatedChapter: ChapterEditData) => {
    // Update the local state so modal reflects current data when reopened
    setSelectedChapterForEdit(updatedChapter);
    
    // React Query cache invalidation handles updates automatically
    // No manual refetch needed - this prevents loading states
    
    // Toast is already shown in EditChapterModal
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
    }
  };

  const handleConfirmChapterDelete = async (chapterId: string) => {
    // Simply call the delete action - cache invalidation and toasts are handled in the hook
    deleteChapterAction(chapterId);
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
        course_name: courseData?.title,
        chapter_name: chapterOfLesson?.title,
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
    router.push(`/creator/courses/${courseId}/lessons/${lessonId}/edit`);
  };

  const handleLessonUpdated = (updatedLesson: LessonEditData) => {
    // React Query cache invalidation handles updates automatically
    // No manual refetch needed - this prevents loading states
    
    // Toast is already shown in EditLessonModal
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
    // Simply call the delete action - cache invalidation and toasts are handled in the hook
    deleteLessonAction(lessonId);
  };

  const handleChaptersReorder = async (reorderedChapters: any[]) => {
    try {
      // Prepare data for bulk reorder API
      const reorderData = {
        chapter_orders: reorderedChapters.map((chapter, index) => ({
          chapter_id: chapter.id,
          new_order: index + 1
        }))
      };

      // Call React Query mutation
      const response = await reorderChaptersAction({ courseId, reorderData });
      
      if (response.success) {
        // Toast is already shown by useApiMutation with operation ID 'reorder-chapters'
        // React Query will automatically refetch chapters
      }
    } catch (error: any) {
      console.error('Failed to reorder chapters:', error);
      // Toast is already shown by useApiMutation with operation ID 'reorder-chapters-error'
      throw error; // Re-throw so DroppableChapterList can handle it
    }
  };

  const handleLessonsReorder = async (chapterId: string, reorderedLessons: any[]) => {
    try {
      // Prepare data for bulk reorder API
      const reorderData = {
        lesson_orders: reorderedLessons.map((lesson, index) => ({
          lesson_id: lesson.id,
          new_order: index + 1
        }))
      };

      // Call React Query mutation
      const response = await reorderLessonsAction({ chapterId, reorderData });
      
      if (response.success) {
        // Toast is already shown by useApiMutation with operation ID for lesson reorder
        // React Query will automatically refetch chapters with lessons
      }
    } catch (error: any) {
      console.error('Failed to reorder lessons:', error);
      // Toast is already shown by useApiMutation with operation ID for lesson reorder error
      throw error; // Re-throw so DroppableLessonList can handle it
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!loading && !courseData && !courseResponse?.data) {
    return (
      <div className="flex justify-center items-center min-h-screen text-primary">
        <ErrorState
          title="Course not found"
          description="The course you're looking for doesn't exist or you don't have permission to edit it."
          action={{
            label: 'Back to Courses',
            onClick: () => router.push('/creator/courses')
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
      <div className="min-h-screen bg-muted">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-50">
          <Container variant="admin" className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/creator/courses')}
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
                    className="text-2xl font-bold px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                ) : (
                  <h1
                    className="text-2xl font-bold cursor-pointer hover:text-primary"
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
                  loading={isSaving}
                >
                  Save
                </Button>
              </div>
            </div>
          </Container>
        </div>

        {/* Main Content */}
        <Container variant="admin" className="py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-4">
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab('general')}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'general'
                        ? 'bg-blue-100 text-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    General Info
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('chapters')}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'chapters'
                        ? 'bg-blue-100 text-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    Chapters & Lessons
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'settings'
                        ? 'bg-blue-100 text-primary'
                        : 'hover:bg-muted'
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
                    {/* Course Image Upload */}
                    <CourseImageUpload
                      courseId={courseId}
                      currentImage={courseData.thumbnail}
                      onImageUpdate={(imageUrl) => updateCourseData({ thumbnail: imageUrl })}
                      className="mb-6"
                    />

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Description
                      </label>
                      <textarea
                        value={courseData.description || ''}
                        onChange={(e) => {
                          updateCourseData({ description: e.target.value });
                        }}
                        rows={4}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Enter course description..."
                      />
                    </div>

                    {/* Short Description */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Short Description
                      </label>
                      <input
                        type="text"
                        value={courseData.short_description || ''}
                        onChange={(e) => updateCourseData({ short_description: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Brief description for course cards..."
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Category
                      </label>
                      <select
                        value={courseData.category || ''}
                        onChange={(e) => updateCourseData({ category: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select category</option>
                        <option value="ml-basics">ML Basics</option>
                        <option value="deep-learning">Deep Learning</option>
                        <option value="nlp">NLP</option>
                        <option value="computer-vision">Computer Vision</option>
                        <option value="generative-ai">Generative AI</option>
                        <option value="ai-ethics">AI Ethics</option>
                        <option value="ai-in-business">AI in Business</option>
                      </select>
                    </div>

                    {/* Level */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Level
                      </label>
                      <select
                        value={courseData.level || ''}
                        onChange={(e) => updateCourseData({ level: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select level</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    {/* Syllabus */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        What students will learn (one per line)
                      </label>
                      <textarea
                        value={(courseData.syllabus || []).join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n').filter(line => line.trim());
                          updateCourseData({ syllabus: lines });
                        }}
                        rows={6}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Build real-world AI applications&#10;Master machine learning fundamentals&#10;Deploy models to production"
                      />
                    </div>

                    {/* Prerequisites */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Prerequisites (one per line)
                      </label>
                      <textarea
                        value={(courseData.prerequisites || []).join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n').filter(line => line.trim());
                          updateCourseData({ prerequisites: lines });
                        }}
                        rows={4}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                      <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/60" />
                      <h3 className="text-lg font-semibold mb-2">No chapters yet</h3>
                      <p className="text-muted-foreground mb-4">
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
                      <label className="block text-sm font-medium text-foreground mb-2">
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
                              <label className="block text-sm text-muted-foreground mb-1">
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
                                className="w-32 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Course Status
                      </label>
                      <select
                        value={courseData.status || 'draft'}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          const oldStatus = courseData.status || 'draft';
                          updateCourseData({ status: newStatus });

                          // Force save for review status
                          if (newStatus === 'review') {
                            setTimeout(async () => {
                              const success = await forceSave();
                              // If validation failed, revert to previous status
                              if (!success) {
                                updateCourseData({ status: oldStatus });
                              }
                            }, 100);
                          }
                        }}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="draft">Draft</option>
                        <option value="review">Submit for Admin Review</option>
                        <option value="coming_soon">Coming Soon</option>
                        {courseData.status === 'archived' && (
                          <option value="archived" disabled>Archived (Rejected)</option>
                        )}
                      </select>
                      <p className="mt-3 text-xs text-red-600 italic text-[11px]">
                        Submit for review when ready. Use Coming Soon for public preview without validation.
                      </p>

                      {/* Validation Requirements - Fixed Display */}
                      <div className="mt-5 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex gap-3">
                          {/* Column 1: Icon */}
                          <div className="flex-shrink-0 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                          </div>

                          {/* Column 2: All content */}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 mb-2">Publishing Requirements</p>
                            <ul className="text-xs text-gray-700 space-y-2">
                              <li className="flex items-center gap-2">
                                <div className={`w-1 h-1 rounded-full ${courseData.thumbnail ? 'bg-green-600' : 'bg-red-500'}`} />
                                Course thumbnail uploaded
                              </li>
                              <li className="flex items-center gap-2">
                                <div className={`w-1 h-1 rounded-full ${courseData.total_duration && courseData.total_duration > 0 ? 'bg-green-600' : 'bg-red-500'}`} />
                                Course duration set
                              </li>
                              <li className="flex items-center gap-2">
                                <div className={`w-1 h-1 rounded-full ${publishedChapters > 0 ? 'bg-green-600' : 'bg-red-500'}`} />
                                At least one published chapter
                              </li>
                              <li className="flex items-center gap-2">
                                <div className={`w-1 h-1 rounded-full ${publishedLessons > 0 ? 'bg-green-600' : 'bg-red-500'}`} />
                                At least one published lesson with video
                              </li>
                            </ul>
                            <p className="text-xs text-red-600 mt-2 italic text-[11px]">
                              Note: Required for Review and Published status only
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Target Audience */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Target Audience (one per line)
                      </label>
                      <textarea
                        value={(courseData.target_audience || []).join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n').filter(line => line.trim());
                          updateCourseData({ target_audience: lines });
                        }}
                        rows={4}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Beginner programmers&#10;Students interested in AI&#10;Professional developers"
                      />
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </Container>
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
        onClose={() => setIsDeleteChapterModalOpen(false)}
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