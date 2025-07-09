'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SaveStatusIndicator } from '@/components/ui/SaveStatusIndicator';
import NavigationGuard from '@/components/feature/NavigationGuard';
import { useAutosave } from '@/hooks/useAutosave';
import { useEditorStore } from '@/stores/editorStore';
import { useAuth } from '@/hooks/useAuth';
import { ToastService } from '@/lib/toast/ToastService';
import { 
  useChapterByIdQuery, 
  useUpdateChapter,
  useChapterLessonsQuery,
  useCreateLesson 
} from '@/hooks/queries/useLearning';

interface Chapter {
  _id: string;
  course_id: string;
  title: string;
  description?: string;
  order: number;
  total_lessons: number;
  total_duration: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Lesson {
  _id: string;
  title: string;
  description?: string;
  order: number;
  status: string;
  video?: {
    duration?: number;
  };
}

const ChapterEditPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;
  const chapterId = params.chapterId as string;

  // React Query hooks for data fetching
  const { 
    data: chapterResponse, 
    loading: chapterLoading, 
    execute: refetchChapter 
  } = useChapterByIdQuery(chapterId, !!chapterId);
  
  const { 
    data: lessonsResponse, 
    loading: lessonsLoading, 
    execute: refetchLessons 
  } = useChapterLessonsQuery(chapterId, !!chapterId);

  // React Query mutations
  const { mutate: updateChapterMutation, loading: updateLoading } = useUpdateChapter();
  const { mutate: createLessonMutation, loading: createLessonLoading } = useCreateLesson();

  // Local UI state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  // Extract data from React Query responses
  const chapter = chapterResponse?.success ? chapterResponse.data : null;
  const lessons = lessonsResponse?.success 
    ? (Array.isArray(lessonsResponse.data) 
        ? lessonsResponse.data 
        : lessonsResponse.data?.lessons || [])
    : [];
  const loading = chapterLoading || lessonsLoading;

  // Auto-save hook with React Query mutation
  const { saveStatus, lastSavedAt, error, forceSave, hasUnsavedChanges, isOnline, hasPendingChanges } = useAutosave(
    chapter,
    {
      delay: 2000,
      onSave: async (data) => {
        if (!data || !data._id) return;
        return new Promise((resolve, reject) => {
          updateChapterMutation({ chapterId: data._id, data }, {
            onSuccess: (response) => {
              if (response.success) {
                resolve(response);
              } else {
                reject(new Error(response.message || 'Something went wrong'));
              }
            },
            onError: (error: any) => {
              reject(error);
            }
          });
        });
      },
      enabled: !!chapter,
    }
  );

  // Initialize title input when chapter loads
  useEffect(() => {
    if (chapter && chapter.title) {
      setTitleInput(chapter.title);
    }
  }, [chapter]);

  // Check permissions when user loads
  useEffect(() => {
    if (user && user.role !== 'creator' && user.role !== 'admin') {
      ToastService.error('You do not have permission to edit chapters');
      router.push('/dashboard');
    }
  }, [user, router]);

  // Handle chapter loading errors
  useEffect(() => {
    if (chapterResponse && !chapterResponse.success) {
      ToastService.error(chapterResponse.message || 'Something went wrong');
      router.push(`/creator/courses/${courseId}/edit`);
    }
  }, [chapterResponse, router, courseId]);

  const handleTitleSave = () => {
    if (titleInput.trim() && titleInput !== chapter?.title && chapter) {
      // Trigger autosave with updated title
      const updatedChapter = { ...chapter, title: titleInput.trim() };
      updateChapterMutation({ chapterId: chapter._id, data: updatedChapter }, {
        onSuccess: (response) => {
          if (response.success) {
            ToastService.success(response.message || 'Something went wrong');
            refetchChapter(); // Refresh chapter data
          } else {
            ToastService.error(response.message || 'Something went wrong');
          }
        },
        onError: (error: any) => {
          ToastService.error(error.message || 'Something went wrong');
        }
      });
      setIsEditingTitle(false);
    }
  };

  const handleChapterUpdate = (field: string, value: any) => {
    if (chapter) {
      const updatedChapter = { ...chapter, [field]: value };
      // Trigger autosave will handle the update
      updateChapterMutation({ chapterId: chapter._id, data: updatedChapter }, {
        onSuccess: (response) => {
          if (response.success) {
            refetchChapter(); // Refresh chapter data
          } else {
            ToastService.error(response.message || 'Something went wrong');
          }
        },
        onError: (error: any) => {
          ToastService.error(error.message || 'Something went wrong');
        }
      });
    }
  };

  const handleCreateLesson = () => {
    const lessonCount = lessons.length + 1;
    const dateStr = new Date().toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit' 
    }).replace(/\//g, '');
    
    const lessonData = { 
      chapterId: chapterId,
      title: `Untitled Lesson #${lessonCount} (${dateStr})`
    };

    createLessonMutation(lessonData, {
      onSuccess: (response) => {
        if (response.success && response.data) {
          ToastService.success(response.message || 'Something went wrong');
          // Redirect to lesson editor
          router.push(`/creator/courses/${courseId}/lessons/${response.data._id}/edit`);
        } else {
          ToastService.error(response.message || 'Something went wrong');
        }
      },
      onError: (error: any) => {
        console.error('Failed to create lesson:', error);
        ToastService.error(error.message || 'Something went wrong');
      }
    });
  };

  const handleEditLesson = (lessonId: string) => {
    router.push(`/creator/courses/${courseId}/lessons/${lessonId}/edit`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600 text-lg">Chapter not found</p>
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
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/creator/courses/${courseId}/edit`)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Course
                </Button>
                
                {/* Chapter Title - Inline Editing */}
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
                    {chapter.title}
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
                  variant="primary"
                  size="sm"
                  onClick={() => forceSave()}
                  loading={saveStatus === 'saving' || updateLoading}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chapter Details */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Chapter Details</h2>
                
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={chapter.description || ''}
                      onChange={(e) => handleChapterUpdate('description', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter chapter description..."
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={chapter.status || 'draft'}
                      onChange={(e) => handleChapterUpdate('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      Only published chapters are visible to students
                    </p>
                  </div>
                </div>
              </Card>

              {/* Lessons */}
              <Card className="p-6 mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Lessons</h2>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCreateLesson}
                    loading={createLessonLoading}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lesson
                  </Button>
                </div>

                {lessons.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600 mb-4">No lessons in this chapter yet</p>
                    <Button
                      variant="primary"
                      onClick={handleCreateLesson}
                      loading={createLessonLoading}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Lesson
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lessons
                      .sort((a: Lesson, b: Lesson) => a.order - b.order)
                      .map((lesson: Lesson, index: number) => (
                        <div
                          key={lesson._id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleEditLesson(lesson._id)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-500">
                                Lesson {index + 1}
                              </span>
                              <h4 className="font-medium">{lesson.title}</h4>
                              <span className={`text-xs px-2 py-1 rounded ${
                                lesson.status === 'published' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {lesson.status}
                              </span>
                            </div>
                            {lesson.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm">
                            Edit →
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Chapter Info */}
            <div className="lg:col-span-1">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Chapter Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Chapter Order</p>
                    <p className="font-medium">Chapter {chapter.order}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Total Lessons</p>
                    <p className="font-medium">{lessons.length}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Total Duration</p>
                    <p className="font-medium">
                      {chapter.total_duration > 0 
                        ? `${Math.floor(chapter.total_duration / 60)} minutes`
                        : 'Not calculated yet'
                      }
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium">
                      {new Date(chapter.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-medium">
                      {new Date(chapter.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </NavigationGuard>
  );
};

export default ChapterEditPage;