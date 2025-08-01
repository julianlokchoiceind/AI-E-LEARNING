'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Video, 
  FileText, 
  Link, 
  HelpCircle,
  Settings,
  BookOpen,
  Clock,
  Youtube,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { SaveStatusIndicator } from '@/components/ui/SaveStatusIndicator';
import NavigationGuard from '@/components/feature/NavigationGuard';
import { useAutosave } from '@/hooks/useAutosave';
import { useEditorStore } from '@/stores/editorStore';
import { useAuth } from '@/hooks/useAuth';
import { 
  useLessonQuery,
  useUpdateLesson 
} from '@/hooks/queries/useLessons';
import { useDeleteLessonResource } from '@/hooks/queries/useLessonResources';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingStates';
import { ToastService } from '@/lib/toast/ToastService';
import { Lesson, LessonResource } from '@/lib/types/course';
import { StandardResponse } from '@/lib/types/api';
import { EmptyResourceState } from '@/components/feature/EmptyResourceState';
import { ResourceTypeModal } from '@/components/feature/ResourceTypeModal';
import { ResourceForm } from '@/components/feature/ResourceForm';
import { Modal } from '@/components/ui/Modal';

// Use LessonResource from types instead of duplicate interface

const LessonEditPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;

  // State management
  const [lessonData, setLessonData] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState('content');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [resources, setResources] = useState<LessonResource[]>([]);
  
  // Resource workflow state
  const [showResourceTypeModal, setShowResourceTypeModal] = useState(false);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [resourceFormMode, setResourceFormMode] = useState<'upload' | 'url'>('upload');
  
  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedResourceIndex, setSelectedResourceIndex] = useState<number | null>(null);

  // React Query hooks  
  const { data: lessonResponse, loading: lessonLoading } = useLessonQuery(lessonId) as {
    data: StandardResponse<Lesson> | undefined;
    loading: boolean;
  };
  const { mutateAsync: updateLessonAction } = useUpdateLesson();
  const { mutate: deleteResource } = useDeleteLessonResource();

  // Initialize lesson data
  useEffect(() => {
    if (lessonResponse?.success && lessonResponse.data) {
      const lesson = lessonResponse.data;
      const resources = lesson.resources || [];
      
      // Ensure video object is properly initialized to prevent input field reset
      const lessonDataWithResources = {
        ...lesson,
        video: lesson.video || { url: '', youtube_id: '', duration: 0 },
        resources: resources // 🔧 CRITICAL FIX: Ensure resources are included in lessonData
      };
      
      setLessonData(lessonDataWithResources);
      setTitleInput(lesson.title);
      setResources(resources); // Keep separate state for UI, but ensure sync with lessonData
    }
  }, [lessonResponse]);

  // Auto-save hook
  const { saveStatus, lastSavedAt, error, forceSave, hasUnsavedChanges } = useAutosave(
    lessonData,
    {
      delay: 2000,
      onSave: async (data) => {
        if (!data || !data.id) return;
        
        try {
          // Filter out invalid resources before sending to API
          const validResources = data.resources?.filter(resource => 
            resource.title.trim().length > 0 && 
            resource.url.trim().length > 0
          ) || [];

          await updateLessonAction({ 
            lessonId: data.id, 
            data: {
              title: data.title,
              description: data.description,
              video: data.video || undefined,
              content: data.content,
              resources: validResources as any, // Type assertion to handle extended resource types
              status: data.status as 'draft' | 'published'
            }
          });
        } catch (error) {
          throw error;
        }
      },
      enabled: !!lessonData,
    }
  );

  // Check permissions
  useEffect(() => {
    if (user && user.role !== 'creator' && user.role !== 'admin') {
      ToastService.error('Access denied. Creator access required.');
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleTitleSave = () => {
    if (titleInput.trim() !== lessonData?.title) {
      setLessonData((prev: Lesson | null) => ({ ...prev!, title: titleInput.trim() }));
    }
    setIsEditingTitle(false);
  };

  const handleVideoUrlChange = (url: string) => {
    // Extract YouTube ID if YouTube URL
    let youtubeId = '';
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      youtubeId = youtubeMatch[1];
    }

    setLessonData(prev => ({
      ...prev!,
      video: {
        // Default structure and spread existing properties
        duration: 0,
        ...prev?.video,
        // Override with new values
        url,
        youtube_id: youtubeId
      }
    }));
  };

  // Resource workflow handlers
  const handleAddResourceClick = () => {
    setShowResourceTypeModal(true);
  };

  const handleResourceTypeSelect = (type: 'upload' | 'url') => {
    setResourceFormMode(type);
    setShowResourceTypeModal(false);
    setShowResourceForm(true);
  };

  const handleResourceSuccess = () => {
    // Close modal and let the query invalidation + useEffect handle the resource update
    // The invalidateQueries in useLessonResources will trigger a refetch of lesson data
    // which will then update resources through the useEffect that watches lessonResponse
    setShowResourceForm(false);
  };

  const handleCloseModals = () => {
    setShowResourceTypeModal(false);
    setShowResourceForm(false);
  };

  const handleDeleteResource = (resourceIndex: number) => {
    // Show confirmation modal
    setSelectedResourceIndex(resourceIndex);
    setShowDeleteModal(true);
  };

  const confirmDeleteResource = () => {
    if (selectedResourceIndex === null) return;
    
    // Call delete mutation
    deleteResource(
      { lessonId, resourceIndex: selectedResourceIndex },
      {
        onSuccess: () => {
          // Resource list will auto-refresh due to invalidation
          // Update local state to remove the resource immediately for better UX
          setResources(prev => prev.filter((_, index) => index !== selectedResourceIndex));
          setLessonData(prev => {
            if (!prev || !prev.resources) return prev;
            return {
              ...prev,
              resources: prev.resources.filter((_, index) => index !== selectedResourceIndex)
            };
          });
          
          // Close modal and reset state
          setShowDeleteModal(false);
          setSelectedResourceIndex(null);
        }
      }
    );
  };

  if (lessonLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Loading lesson data..." />
      </div>
    );
  }

  if (!lessonData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="Lesson not found"
          description="The lesson you're looking for doesn't exist or you don't have permission to edit it."
          action={{
            label: 'Back to Course',
            onClick: () => router.push(`/creator/courses/${courseId}/edit`)
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
                
                {/* Lesson Title - Inline Editing */}
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
                    className="text-2xl font-bold cursor-pointer hover:text-blue-600 flex items-center gap-2"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    <BookOpen className="w-6 h-6" />
                    {lessonData.title}
                  </h1>
                )}

                <Badge className={lessonData.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                  {lessonData.status}
                </Badge>
              </div>

              <div className="flex items-center gap-4">
                <SaveStatusIndicator
                  status={saveStatus}
                  lastSavedAt={lastSavedAt}
                  error={error}
                />
                
                <Button
                  variant="outline"
                  onClick={() => router.push(`/learn/${courseId}/${lessonId}?preview=true`)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Preview
                </Button>

                <Button
                  variant="primary"
                  onClick={forceSave}
                  disabled={saveStatus === 'saving' || !hasUnsavedChanges}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4">
            <nav className="flex space-x-8">
              {[
                { id: 'content', label: 'Content', icon: FileText },
                { id: 'video', label: 'Video', icon: Video },
                { id: 'resources', label: 'Resources', icon: Link },
                { id: 'quiz', label: 'Quiz', icon: HelpCircle },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-2 border-b-2 transition-colors
                    ${activeTab === tab.id 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Lesson Details</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={lessonData.description || ''}
                        onChange={(e) => setLessonData((prev: Lesson | null) => ({ ...prev!, description: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Brief description of what students will learn..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lesson Content (Markdown)
                      </label>
                      <textarea
                        value={lessonData.content || ''}
                        onChange={(e) => setLessonData((prev: Lesson | null) => ({ ...prev!, content: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        rows={15}
                        placeholder="Detailed lesson content in markdown format..."
                      />
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Lesson Status</h3>
                  <select
                    value={lessonData.status}
                    onChange={(e) => setLessonData((prev: Lesson | null) => ({ ...prev!, status: e.target.value as 'draft' | 'published' }))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Quick Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Chapter</span>
                      <span>{lessonData.chapter_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order</span>
                      <span>{lessonData.order}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration</span>
                      <span>{lessonData.video?.duration || 0} min</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Video Tab */}
          {activeTab === 'video' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Video Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Video URL (YouTube/Vimeo)
                  </label>
                  <div className="flex gap-2">
                    <Youtube className="w-5 h-5 text-gray-400 mt-2" />
                    <Input
                      value={lessonData.video?.url || ''}
                      onChange={(e) => handleVideoUrlChange(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="flex-1"
                    />
                  </div>
                  {lessonData.video?.youtube_id && (
                    <p className="text-sm text-gray-600 mt-1">
                      YouTube ID: {lessonData.video.youtube_id}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <div className="flex gap-2">
                    <Clock className="w-5 h-5 text-gray-400 mt-2" />
                    <Input
                      type="number"
                      value={lessonData.video?.duration || ''}
                      onChange={(e) => setLessonData(prev => ({
                        ...prev!,
                        video: { 
                          ...prev?.video, 
                          duration: parseInt(e.target.value) || 0 
                        }
                      }))}
                      placeholder="15"
                      className="w-32"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Video Transcript
                  </label>
                  <textarea
                    value={lessonData.video?.transcript || ''}
                    onChange={(e) => setLessonData(prev => ({
                      ...prev!,
                      video: { 
                        duration: 0,
                        ...prev?.video, 
                        transcript: e.target.value 
                      }
                    }))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={10}
                    placeholder="Video transcript for accessibility and AI features..."
                  />
                </div>

                {/* Video Preview */}
                {lessonData.video?.youtube_id && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Video Preview</h3>
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <iframe
                        src={`https://www.youtube.com/embed/${lessonData.video.youtube_id}`}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Learning Resources</h2>
                {resources.length > 0 && (
                  <Button variant="outline" onClick={handleAddResourceClick}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Resource
                  </Button>
                )}
              </div>
              
              {resources.length === 0 ? (
                <EmptyResourceState 
                  onAddResource={handleAddResourceClick}
                  className="my-8"
                />
              ) : (
                <div className="space-y-4">
                  {resources.map((resource, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900">{resource.title}</h3>
                            <Badge 
                              variant={resource.type === 'link' ? 'secondary' : 'default'}
                              className="text-xs"
                            >
                              {resource.type.toUpperCase()}
                            </Badge>
                          </div>
                          
                          {resource.description && (
                            <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                          )}
                          
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {resource.url}
                          </a>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteResource(index)}
                          className="text-red-600 hover:text-red-700 ml-4"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Quiz Tab */}
          {activeTab === 'quiz' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Quiz Settings</h2>
              <div className="text-center py-12 text-gray-600">
                <HelpCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Quiz builder coming soon!</p>
                <p className="text-sm mt-2">You'll be able to create multiple choice questions for this lesson.</p>
              </div>
            </Card>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Lesson Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Sequential Learning</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={lessonData.unlock_conditions?.previous_lesson_required ?? true}
                        onChange={(e) => setLessonData((prev: Lesson | null) => ({
                          ...prev!,
                          unlock_conditions: {
                            ...prev?.unlock_conditions,
                            previous_lesson_required: e.target.checked
                          }
                        }))}
                        className="rounded"
                      />
                      <span className="text-sm">Previous lesson must be completed</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={lessonData.unlock_conditions?.quiz_pass_required ?? false}
                        onChange={(e) => setLessonData((prev: Lesson | null) => ({
                          ...prev!,
                          unlock_conditions: {
                            ...prev?.unlock_conditions,
                            quiz_pass_required: e.target.checked
                          }
                        }))}
                        className="rounded"
                      />
                      <span className="text-sm">Previous quiz must be passed</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Watch Percentage for Completion
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={lessonData.unlock_conditions?.minimum_watch_percentage ?? 80}
                      onChange={(e) => setLessonData((prev: Lesson | null) => ({
                        ...prev!,
                        unlock_conditions: {
                          ...prev?.unlock_conditions,
                          minimum_watch_percentage: parseInt(e.target.value)
                        }
                      }))}
                      className="w-24"
                      min="0"
                      max="100"
                    />
                    <span className="text-sm text-gray-600">%</span>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={lessonData.is_free_preview ?? false}
                      onChange={(e) => setLessonData((prev: Lesson | null) => ({
                        ...prev!,
                        is_free_preview: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Free Preview</span>
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Allow non-enrolled users to preview this lesson
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Resource Management Modals */}
      <ResourceTypeModal
        isOpen={showResourceTypeModal}
        onClose={handleCloseModals}
        onSelectFileUpload={() => handleResourceTypeSelect('upload')}
        onSelectUrlResource={() => handleResourceTypeSelect('url')}
      />

      <ResourceForm
        isOpen={showResourceForm}
        onClose={handleCloseModals}
        onSuccess={handleResourceSuccess}
        lessonId={lessonId}
        mode={resourceFormMode}
      />

      {/* Delete Resource Confirmation Modal */}
      {showDeleteModal && selectedResourceIndex !== null && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedResourceIndex(null);
          }}
          title="Delete Resource"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this resource? This action cannot be undone.
            </p>
            
            {resources[selectedResourceIndex] && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-sm">{resources[selectedResourceIndex].title}</p>
                {resources[selectedResourceIndex].description && (
                  <p className="text-sm text-gray-600 mt-1">{resources[selectedResourceIndex].description}</p>
                )}
              </div>
            )}
            
            <div className="flex space-x-3">
              <Button
                onClick={confirmDeleteResource}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Delete Resource
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedResourceIndex(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </NavigationGuard>
  );
};

export default LessonEditPage;