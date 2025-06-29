'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Settings, BookOpen, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SaveStatusIndicator } from '@/components/ui/SaveStatusIndicator';
import NavigationGuard from '@/components/feature/NavigationGuard';
import ChapterCard from '@/components/feature/ChapterCard';
import DraggableChapterCard from '@/components/feature/DraggableChapterCard';
import { useAutosave } from '@/hooks/useAutosave';
import { useEditorStore } from '@/stores/editorStore';
import { useAuth } from '@/hooks/useAuth';
import { getCourseById, updateCourse } from '@/lib/api/courses';
import { getChaptersByCourse, getChaptersWithLessons, createChapter, updateChapter, deleteChapter } from '@/lib/api/chapters';
import { reorderLesson } from '@/lib/api/lessons';
import { toast } from 'react-hot-toast';

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
  const [loading, setLoading] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  // Auto-save hook
  const { saveStatus, lastSavedAt, error, forceSave, hasUnsavedChanges } = useAutosave(
    courseData,
    {
      delay: 2000,
      onSave: async (data) => {
        if (!data || !data._id) return;
        await updateCourse(data._id, data);
      },
      enabled: !!courseData,
    }
  );

  useEffect(() => {
    fetchCourseData();
    return () => {
      reset(); // Clean up on unmount
    };
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      
      // Check permissions
      if (user?.role !== 'creator' && user?.role !== 'admin') {
        toast.error('You do not have permission to edit courses');
        router.push('/dashboard');
        return;
      }

      // Fetch course details
      const courseResponse = await getCourseById(courseId);
      setCourseData(courseResponse);
      setTitleInput(courseResponse.title);

      // Fetch chapters with lessons
      const chaptersWithLessons = await getChaptersWithLessons(courseId);
      setChapters(chaptersWithLessons || []);
    } catch (error) {
      console.error('Failed to fetch course data:', error);
      toast.error('Failed to load course data');
      router.push('/creator/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleSave = () => {
    if (titleInput.trim() && titleInput !== courseData?.title) {
      updateCourseData({ title: titleInput.trim() });
      setIsEditingTitle(false);
    }
  };

  const handleCreateChapter = async () => {
    try {
      const response = await createChapter({ course_id: courseId });
      setChapters([...chapters, response]);
      toast.success('Chapter created successfully');
    } catch (error) {
      console.error('Failed to create chapter:', error);
      toast.error('Failed to create chapter');
    }
  };

  const handleCreateLesson = async (chapterId: string) => {
    try {
      const { createLesson } = await import('@/lib/api/lessons');
      const response = await createLesson({ 
        chapter_id: chapterId,
        title: `Untitled Lesson ${new Date().toLocaleDateString()}`
      });
      
      // Update local state - add lesson to the chapter
      setChapters(prevChapters => {
        return prevChapters.map(chapter => {
          if (chapter._id === chapterId) {
            const updatedLessons = [...(chapter.lessons || []), response];
            return {
              ...chapter,
              lessons: updatedLessons,
              total_lessons: updatedLessons.length
            };
          }
          return chapter;
        });
      });
      
      // Redirect to lesson editor
      router.push(`/creator/courses/${courseId}/lessons/${response._id}/edit`);
      toast.success('Lesson created successfully');
    } catch (error) {
      console.error('Failed to create lesson:', error);
      toast.error('Failed to create lesson');
    }
  };

  const handleChapterEdit = (chapterId: string) => {
    router.push(`/creator/courses/${courseId}/chapters/${chapterId}/edit`);
  };

  const handleChapterDelete = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return;

    try {
      await deleteChapter(chapterId);
      setChapters(chapters.filter(ch => ch._id !== chapterId));
      toast.success('Chapter deleted successfully');
    } catch (error) {
      console.error('Failed to delete chapter:', error);
      toast.error('Failed to delete chapter');
    }
  };

  const handleLessonEdit = (lessonId: string) => {
    router.push(`/creator/courses/${courseId}/lessons/${lessonId}/edit`);
  };

  const handleLessonDelete = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      // Import deleteLesson from lessons API
      const { deleteLesson } = await import('@/lib/api/lessons');
      await deleteLesson(lessonId);
      
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
      
      toast.success('Lesson deleted successfully');
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      toast.error('Failed to delete lesson');
    }
  };

  const handleChapterReorder = async (chapterId: string, direction: 'up' | 'down') => {
    // Find chapter index
    const index = chapters.findIndex(ch => ch._id === chapterId);
    if (index === -1) return;

    // Check bounds
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === chapters.length - 1) return;

    // Create new array with swapped chapters
    const newChapters = [...chapters];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap orders
    const tempOrder = newChapters[index].order;
    newChapters[index].order = newChapters[swapIndex].order;
    newChapters[swapIndex].order = tempOrder;
    
    // Swap positions in array
    [newChapters[index], newChapters[swapIndex]] = [newChapters[swapIndex], newChapters[index]];
    
    setChapters(newChapters);

    // Update both chapters in backend
    try {
      await Promise.all([
        updateChapter(newChapters[index]._id, { order: newChapters[index].order }),
        updateChapter(newChapters[swapIndex]._id, { order: newChapters[swapIndex].order })
      ]);
    } catch (error) {
      console.error('Failed to reorder chapters:', error);
      toast.error('Failed to reorder chapters');
      // Revert on error
      setChapters(chapters);
    }
  };

  const handleLessonReorder = async (chapterId: string, lessonId: string, newOrder: number) => {
    try {
      await reorderLesson(lessonId, newOrder);
      
      // Update local state - find the chapter and update its lessons
      setChapters(prevChapters => {
        return prevChapters.map(chapter => {
          if (chapter._id === chapterId) {
            // Re-fetch lessons for this chapter or update locally
            const updatedLessons = [...chapter.lessons];
            const lessonIndex = updatedLessons.findIndex(l => l._id === lessonId);
            if (lessonIndex !== -1) {
              const [movedLesson] = updatedLessons.splice(lessonIndex, 1);
              updatedLessons.splice(newOrder - 1, 0, movedLesson);
              
              // Update order values
              updatedLessons.forEach((lesson, index) => {
                lesson.order = index + 1;
              });
            }
            
            return {
              ...chapter,
              lessons: updatedLessons,
            };
          }
          return chapter;
        });
      });
      
      toast.success('Lesson order updated');
    } catch (error) {
      console.error('Failed to reorder lesson:', error);
      toast.error('Failed to reorder lesson');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600 text-lg">Course not found</p>
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
                  onClick={() => router.push(`/courses/${courseId}`)}
                >
                  Preview
                </Button>
                
                <Button
                  variant="primary"
                  size="sm"
                  onClick={forceSave}
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
                    <div className="space-y-4">
                      {chapters
                        .sort((a, b) => a.order - b.order)
                        .map((chapter) => (
                          <DraggableChapterCard
                            key={chapter._id}
                            chapter={chapter}
                            isEnrolled={true}
                            isEditable={true}
                            onEdit={handleChapterEdit}
                            onDelete={handleChapterDelete}
                            onReorder={handleChapterReorder}
                            onLessonReorder={handleLessonReorder}
                            onLessonEdit={handleLessonEdit}
                            onLessonDelete={handleLessonDelete}
                            onCreateLesson={handleCreateLesson}
                          />
                        ))}
                    </div>
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
    </NavigationGuard>
  );
};

export default CourseBuilderPage;