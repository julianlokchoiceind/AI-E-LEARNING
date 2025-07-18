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
  useCourseEditorQuery, 
  useCourseChaptersQuery, 
  useUpdateCourse,
  useReorderChapters,
  useReorderLessons
} from '@/hooks/queries/useCourses';
import { useDeleteChapter } from '@/hooks/queries/useChapters';
import { useDeleteLesson } from '@/hooks/queries/useLessons';
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

  // React Query hooks for data fetching
  const { data: courseResponse, loading: courseLoading, refetch: refetchCourse } = useCourseEditorQuery(courseId);
  const { data: chaptersResponse, loading: chaptersLoading, refetch: refetchChapters } = useCourseChaptersQuery(courseId);
  
  // React Query mutations
  const { mutateAsync: updateCourseAction } = useUpdateCourse();
  const { mutate: deleteChapterAction } = useDeleteChapter();
  const { mutate: deleteLessonAction } = useDeleteLesson();
  const { mutateAsync: reorderChaptersAction } = useReorderChapters();
  const { mutateAsync: reorderLessonsAction } = useReorderLessons();
  
  // Combined loading state
  const loading = courseLoading || chaptersLoading;
  
  // Computed data from React Query responses
  const chapters = React.useMemo(() => {
    console.log('[DEBUG] chaptersResponse:', chaptersResponse);
    if (chaptersResponse?.data) {
      // Backend returns { success: true, data: { chapters: [...] } }
      // So chaptersResponse.data.chapters is the chapters array
      return (chaptersResponse.data as any)?.chapters || [];
    }
    return [];
  }, [chaptersResponse]);
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

  // Auto-save hook with React Query mutation - only when courseData available
  const { saveStatus, lastSavedAt, error, forceSave, hasUnsavedChanges, isOnline, hasPendingChanges } = useAutosave(
    courseData,
    {
      delay: 2000,
      initialLastSavedAt: courseData?.updated_at || courseData?.created_at,
      enabled: !!courseData, // 🔧 FIX: Only enable when courseData exists
      onSave: async (data) => {
        console.log('🔧 [AUTOSAVE DEBUG] onSave called with data:', {
          hasData: !!data,
          dataId: data?.id,
          dataTitle: data?.title,
          dataKeys: data ? Object.keys(data) : null
        });
        
        if (!data) {
          console.log('🔧 [AUTOSAVE DEBUG] onSave early return - no data');
          return;
        }
        
        // Get courseId from data or use the route param as fallback
        const courseIdToUse = data.id || courseId;
        
        if (!courseIdToUse) {
          console.error('❌ [AUTOSAVE DEBUG] No course ID found in data or route params');
          return;
        }
        
        try {
          console.log('🔧 [AUTOSAVE DEBUG] Calling updateCourseAction with:', {
            courseId: courseIdToUse,
            data: data
          });
          
          const result = await updateCourseAction({ courseId: courseIdToUse, data: data });
          
          console.log('🔧 [AUTOSAVE DEBUG] updateCourseAction success:', result);
        } catch (error) {
          console.error('🔧 [AUTOSAVE DEBUG] Autosave failed:', error);
          throw error;
        }
      },
      enabled: !!courseData,
      showToastOnError: false, // Prevent duplicate toast notifications
    }
  );

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
    if (user && user?.role !== 'creator' && user?.role !== 'admin') {
      ToastService.error('You do not have permission to edit courses');
      router.push('/dashboard');
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
    console.log('🔧 [TITLE DEBUG] handleTitleSave called:', {
      titleInput: titleInput.trim(),
      currentTitle: courseData?.title,
      willUpdate: titleInput.trim() && titleInput !== courseData?.title
    });
    
    if (titleInput.trim() && titleInput !== courseData?.title) {
      console.log('🔧 [TITLE DEBUG] Calling updateCourseData with title:', titleInput.trim());
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
    // Simply call the delete action - optimistic updates and toasts are handled in the hook
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
    // Simply call the delete action - optimistic updates and toasts are handled in the hook
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!loading && !courseData && !courseResponse?.data) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600 text-lg">Course not found</p>
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
        <div className="bg-white border-b sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
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
                  onClick={() => forceSave()}
                  loading={saveStatus === 'saving'}
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
                    onClick={() => setActiveTab('general')}
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
                        onChange={(e) => {
                          console.log('🔧 [DESCRIPTION DEBUG] onChange called:', {
                            newValue: e.target.value,
                            currentValue: courseData.description
                          });
                          updateCourseData({ description: e.target.value });
                        }}
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