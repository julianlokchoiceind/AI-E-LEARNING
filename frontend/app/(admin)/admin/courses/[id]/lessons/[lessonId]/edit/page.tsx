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
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingStates';
import { ToastService } from '@/lib/toast/ToastService';

interface ResourceItem {
  title: string;
  type: 'pdf' | 'code' | 'link' | 'exercise';
  url: string;
  description?: string;
}

const LessonEditPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;

  // State management
  const [lessonData, setLessonData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('content');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [resources, setResources] = useState<ResourceItem[]>([]);

  // React Query hooks
  const { data: lessonResponse, loading: lessonLoading } = useLessonQuery(lessonId);
  const { mutateAsync: updateLessonAction } = useUpdateLesson();

  // Initialize lesson data
  useEffect(() => {
    if (lessonResponse?.success && lessonResponse.data) {
      const lesson = lessonResponse.data;
      setLessonData(lesson);
      setTitleInput(lesson.title);
      setResources(lesson.resources || []);
    }
  }, [lessonResponse]);

  // Auto-save hook
  const { saveStatus, lastSavedAt, error, forceSave, hasUnsavedChanges } = useAutosave(
    lessonData,
    {
      delay: 2000,
      onSave: async (data) => {
        if (!data || !data._id) return;
        
        try {
          await updateLessonAction({ 
            lessonId: data._id, 
            data: {
              title: data.title,
              description: data.description,
              video: data.video,
              content: data.content,
              resources: data.resources
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
    if (user && user.role !== 'admin') {
      ToastService.error('Access denied. Admin access required.');
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleTitleSave = () => {
    if (titleInput.trim() !== lessonData?.title) {
      setLessonData(prev => ({ ...prev, title: titleInput.trim() }));
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
      ...prev,
      video: {
        ...prev?.video,
        url,
        youtube_id: youtubeId
      }
    }));
  };

  const handleAddResource = () => {
    const newResource: ResourceItem = {
      title: '',
      type: 'link',
      url: '',
      description: ''
    };
    const updatedResources = [...resources, newResource];
    setResources(updatedResources);
    setLessonData(prev => ({ ...prev, resources: updatedResources }));
  };

  const handleResourceChange = (index: number, field: keyof ResourceItem, value: string) => {
    const updatedResources = resources.map((resource, i) => 
      i === index ? { ...resource, [field]: value } : resource
    );
    setResources(updatedResources);
    setLessonData(prev => ({ ...prev, resources: updatedResources }));
  };

  const handleRemoveResource = (index: number) => {
    const updatedResources = resources.filter((_, i) => i !== index);
    setResources(updatedResources);
    setLessonData(prev => ({ ...prev, resources: updatedResources }));
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
            onClick: () => router.push(`/admin/courses/${courseId}/edit`)
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
                  onClick={() => router.push(`/admin/courses/${courseId}/edit`)}
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
                  onClick={() => router.push(`/learn/${courseId}/${lessonId}`)}
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
                        onChange={(e) => setLessonData(prev => ({ ...prev, description: e.target.value }))}
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
                        onChange={(e) => setLessonData(prev => ({ ...prev, content: e.target.value }))}
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
                    onChange={(e) => setLessonData(prev => ({ ...prev, status: e.target.value }))}
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
                        ...prev,
                        video: { ...prev?.video, duration: parseInt(e.target.value) }
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
                      ...prev,
                      video: { ...prev?.video, transcript: e.target.value }
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
                <Button variant="outline" onClick={handleAddResource}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Resource
                </Button>
              </div>
              
              {resources.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No resources added yet. Click "Add Resource" to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {resources.map((resource, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                          </label>
                          <Input
                            value={resource.title}
                            onChange={(e) => handleResourceChange(index, 'title', e.target.value)}
                            placeholder="Resource title"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                          </label>
                          <select
                            value={resource.type}
                            onChange={(e) => handleResourceChange(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="pdf">PDF</option>
                            <option value="code">Code</option>
                            <option value="link">Link</option>
                            <option value="exercise">Exercise</option>
                          </select>
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            URL
                          </label>
                          <Input
                            value={resource.url}
                            onChange={(e) => handleResourceChange(index, 'url', e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description (optional)
                          </label>
                          <textarea
                            value={resource.description || ''}
                            onChange={(e) => handleResourceChange(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                            placeholder="Brief description of the resource..."
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveResource(index)}
                          className="text-red-600 hover:text-red-700"
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
                        onChange={(e) => setLessonData(prev => ({
                          ...prev,
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
                        onChange={(e) => setLessonData(prev => ({
                          ...prev,
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
                      onChange={(e) => setLessonData(prev => ({
                        ...prev,
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
                      onChange={(e) => setLessonData(prev => ({
                        ...prev,
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
    </NavigationGuard>
  );
};

export default LessonEditPage;