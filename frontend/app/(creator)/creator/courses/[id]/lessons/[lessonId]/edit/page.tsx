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
  Plus,
  File,
  X,
  Image,
  FileCode,
  FileArchive
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
import { useChapterQuery } from '@/hooks/queries/useChapters';
import { useDeleteLessonResource } from '@/hooks/queries/useLessonResources';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/ui/LoadingStates';
import { ToastService } from '@/lib/toast/ToastService';
import { Lesson, LessonResource } from '@/lib/types/course';
import { StandardResponse } from '@/lib/types/api';
import { EmptyResourceState } from '@/components/feature/EmptyResourceState';
import { ResourceTypeModal } from '@/components/feature/ResourceTypeModal';
import { getAttachmentUrl } from '@/lib/utils/attachmentUrl';
import { ResourceForm } from '@/components/feature/ResourceForm';
import { Modal } from '@/components/ui/Modal';
import { CreateQuizModal } from '@/components/feature/CreateQuizModal';
import { EditQuizModal } from '@/components/feature/EditQuizModal';
import { QuizManager } from '@/components/feature/QuizManager';
import { Container } from '@/components/ui/Container';

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
  
  // Quiz workflow state
  const [showCreateQuizModal, setShowCreateQuizModal] = useState(false);
  const [showEditQuizModal, setShowEditQuizModal] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);

  // React Query hooks  
  const { data: lessonResponse, loading: lessonLoading } = useLessonQuery(lessonId);
  const typedLessonResponse = lessonResponse as StandardResponse<Lesson> | null;
  const { mutateAsync: updateLessonAction } = useUpdateLesson(true); // silent autosave
  const { mutateAsync: manualSaveLessonAction } = useUpdateLesson(false); // manual save with toast
  const { mutate: deleteResource } = useDeleteLessonResource();
  
  // Fetch chapter data for Quick Stats display (leverages React Query cache)
  const { data: chapterResponse } = useChapterQuery(lessonData?.chapter_id || '');

  // Initialize lesson data
  useEffect(() => {
    if (typedLessonResponse?.success && typedLessonResponse.data) {
      const lesson = typedLessonResponse.data;
      const resources = lesson.resources || [];
      
      // Ensure video object is properly initialized to prevent input field reset
      const lessonDataWithResources = {
        ...lesson,
        video: lesson.video || { 
          url: '', 
          youtube_id: '', 
          duration: 0,
          transcript: '',
          captions: '',
          thumbnail: ''
        },
        unlock_conditions: lesson.unlock_conditions || {
          previous_lesson_required: true,
          quiz_pass_required: false,
          minimum_watch_percentage: 95
        },
        resources: resources, // 🔧 CRITICAL FIX: Ensure resources are included in lessonData
        has_quiz: lesson.has_quiz || false // 🔧 CRITICAL FIX: Include has_quiz field for consistency
      };
      
      setLessonData(lessonDataWithResources);
      setTitleInput(lesson.title);
      setResources(resources); // Keep separate state for UI, but ensure sync with lessonData
    }
  }, [typedLessonResponse]);

  // Sync resources with lessonData
  useEffect(() => {
    if (lessonData?.resources) {
      setResources(lessonData.resources);
    }
  }, [lessonData?.resources]);

  // 🔧 Manual save handler with course timestamp update (like Course Edit Page)
  const handleManualSave = async () => {
    if (!lessonData) {
      ToastService.error('No lesson data to save');
      return;
    }

    const lessonIdToUse = lessonData.id || lessonId;
    if (!lessonIdToUse) {
      ToastService.error('Lesson ID missing');
      return;
    }

    // Filter out system fields (same logic as autosave)
    const updateData: any = {};
    
    if (lessonData.title !== undefined) updateData.title = lessonData.title;
    if (lessonData.description !== undefined) updateData.description = lessonData.description;
    if (lessonData.content !== undefined) updateData.content = lessonData.content;
    if (lessonData.status !== undefined) updateData.status = lessonData.status;
    if (lessonData.resources !== undefined) {
      // Filter out invalid resources before sending to API
      updateData.resources = lessonData.resources.filter(resource => 
        resource.title.trim().length > 0 && 
        resource.url.trim().length > 0
      );
    }
    
    // Always include video field - send null/empty for deletion
    if (lessonData.video !== undefined) {
      updateData.video = lessonData.video;
    }

    try {
      await manualSaveLessonAction({ lessonId: lessonIdToUse, data: updateData });
      
      // React Query will automatically refetch course data
      
      // Toast will be shown automatically by useApiMutation (showToast=true)
    } catch (error: any) {
      // Error toast will be shown automatically by useApiMutation
      console.error('Manual save failed:', error);
    }
  };

  // Auto-save hook
  const { saveStatus, lastSavedAt, error, forceSave, hasUnsavedChanges } = useAutosave(
    lessonData,
    {
      delay: 2000,
      initialLastSavedAt: lessonData?.updated_at || lessonData?.created_at, // Initialize from server data
      onSave: async (data) => {
        if (!data || !data.id) return;
        
        try {
          // Clean the data before sending - only include non-null/undefined values
          const updateData: any = {};
          
          if (data.title !== undefined) updateData.title = data.title;
          if (data.description !== undefined) updateData.description = data.description;
          if (data.content !== undefined) updateData.content = data.content;
          if (data.status !== undefined) updateData.status = data.status;
          if (data.resources !== undefined) {
            // Filter out invalid resources before sending to API
            updateData.resources = data.resources.filter(resource => 
              resource.title.trim().length > 0 && 
              resource.url.trim().length > 0
            );
          }
          
          // Always include video field - send null/empty for deletion
          if (data.video !== undefined) {
            updateData.video = data.video;
          }
          
          await updateLessonAction({ 
            lessonId: data.id, 
            data: updateData
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
    if (user && user.role !== 'creator') {
      if (user.role === 'admin') {
        // Admin redirect to admin courses
        router.push('/admin/courses');
      } else {
        // Students/others redirect to 404
        router.push('/not-found');
      }
    }
  }, [user, router]);

  const handleTitleSave = () => {
    if (titleInput.trim() !== lessonData?.title) {
      setLessonData((prev: Lesson | null) => {
        if (!prev) return null;
        return { ...prev, title: titleInput.trim() };
      });
    }
    setIsEditingTitle(false);
  };

  const handleVideoUrlChange = (url: string) => {
    // Extract YouTube ID if YouTube URL
    let youtubeId = '';
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      youtubeId = youtubeMatch[1];
    }

    setLessonData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        video: {
          // Spread existing properties first
          ...prev?.video,
          // Override with new values
          url,
          youtube_id: youtubeId
        }
      };
    });
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

  // Get icon for resource type - matching ResourceDisplay component
  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-destructive" />;
      case 'doc':
        return <FileText className="w-5 h-5 text-primary" />;
      case 'code':
        return <FileCode className="w-5 h-5 text-success" />;
      case 'zip':
        return <FileArchive className="w-5 h-5 text-primary" />;
      case 'exercise':
        return <FileText className="w-5 h-5 text-warning" />;
      case 'link':
        return <Link className="w-5 h-5 text-primary" />;
      case 'other':
      default:
        // For 'other' type (images, etc)
        return <Image className="w-5 h-5 text-muted-foreground" />;
    }
  };

  // Quiz workflow handlers
  const handleCreateQuiz = () => {
    setShowCreateQuizModal(true);
  };

  const handleQuizCreated = () => {
    // Quiz created successfully - update lesson data to trigger autosave
    setLessonData(prev => {
      if (!prev) return prev;
      return { 
        ...prev, 
        has_quiz: true,
        quiz_updated_at: new Date().toISOString()
      };
    });
    setShowCreateQuizModal(false);
  };

  const handleQuizDeleted = () => {
    // Quiz deleted successfully - update lesson data to trigger autosave
    setLessonData(prev => {
      if (!prev) return prev;
      return { 
        ...prev, 
        has_quiz: false,
        quiz_updated_at: new Date().toISOString()
      };
    });
  };

  const handleEditQuiz = (quizId: string) => {
    setEditingQuizId(quizId);
    setShowEditQuizModal(true);
  };

  const handleQuizUpdated = () => {
    // Quiz updated successfully - trigger autosave by updating lesson data
    setLessonData(prev => {
      if (!prev) return prev;
      return { 
        ...prev,
        quiz_updated_at: new Date().toISOString()
      };
    });
    setShowEditQuizModal(false);
    setEditingQuizId(null);
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
      <Container variant="admin" className="py-8">
        <ErrorState
          title="Lesson not found"
          description="The lesson you're looking for doesn't exist or you don't have permission to edit it."
          action={{
            label: 'Back to Course',
            onClick: () => router.push(`/creator/courses/${courseId}/edit`)
          }}
        />
      </Container>
    );
  }

  return (
    <NavigationGuard 
      hasUnsavedChanges={hasUnsavedChanges}
      saveStatus={saveStatus}
      errorMessage={error}
      onForceSave={forceSave}
    >
      <div className="min-h-screen bg-muted/50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <Container variant="admin" className="py-4">
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
                    className="text-2xl font-bold px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                ) : (
                  <h1
                    className="text-2xl font-bold cursor-pointer hover:text-primary flex items-center gap-2"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    <BookOpen className="w-6 h-6" />
                    {lessonData.title}
                  </h1>
                )}

                <Badge className={lessonData.status === 'published' ? 'bg-success/20 text-success' : 'bg-muted/50 text-foreground'}>
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
                  onClick={handleManualSave}
                  disabled={saveStatus === 'saving'}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </Container>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b">
          <Container variant="admin">
            <nav className="flex space-x-8">
              {[
                { id: 'content', label: 'Content', icon: FileText },
                { id: 'video', label: 'Video', icon: Video },
                { id: 'resources', label: 'Resources', icon: Link },
                { id: 'quiz', label: 'Quiz', icon: HelpCircle }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-2 border-b-2 transition-colors
                    ${activeTab === tab.id 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </Container>
        </div>

        {/* Content */}
        <Container variant="admin" className="py-8">
          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Lesson Details</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Description
                      </label>
                      <textarea
                        value={lessonData.description || ''}
                        onChange={(e) => setLessonData((prev: Lesson | null) => {
                          if (!prev) return null;
                          return { ...prev, description: e.target.value };
                        })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={3}
                        placeholder="Brief description of what students will learn..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Lesson Content (Markdown)
                      </label>
                      <textarea
                        value={lessonData.content || ''}
                        onChange={(e) => setLessonData((prev: Lesson | null) => {
                          if (!prev) return null;
                          return { ...prev, content: e.target.value };
                        })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
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
                    onChange={(e) => setLessonData((prev: Lesson | null) => {
                      if (!prev) return null;
                      return { ...prev, status: e.target.value as 'draft' | 'published' };
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Quick Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chapter</span>
                      <span>{chapterResponse?.data?.title || lessonData.chapter_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order</span>
                      <span>{lessonData.order}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span>{lessonData.video?.duration ? Math.round(lessonData.video.duration / 60) : 0} min</span>
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
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Video URL (YouTube/Vimeo)
                  </label>
                  <div className="flex gap-2">
                    <Youtube className="w-5 h-5 text-muted-foreground mt-2" />
                    <Input
                      value={lessonData.video?.url || ''}
                      onChange={(e) => handleVideoUrlChange(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="flex-1"
                    />
                  </div>
                  {lessonData.video?.youtube_id && (
                    <p className="text-sm text-muted-foreground mt-1">
                      YouTube ID: {lessonData.video.youtube_id}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Duration (minutes)
                  </label>
                  <div className="flex gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground mt-2" />
                    <Input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]+([.][0-9]+)?"
                      value={lessonData.video?.duration && lessonData.video.duration > 0 ? (lessonData.video.duration / 60).toFixed(1) : ''}
                      onChange={(e) => {
                        // Normalize comma to dot for decimal separator
                        const normalizedValue = e.target.value.replace(',', '.');
                        const minutes = parseFloat(normalizedValue) || 0;
                        setLessonData(prev => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            video: { 
                              ...prev?.video, 
                              duration: Math.round(minutes * 60) // Convert minutes to seconds for storage
                            }
                          };
                        });
                      }}
                      placeholder="15.5"
                      className="w-32"
                      step="0.1"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Video Transcript
                  </label>
                  <textarea
                    value={lessonData.video?.transcript || ''}
                    onChange={(e) => setLessonData(prev => {
                      if (!prev) return null;
                      return {
                        ...prev,
                        video: { 
                          ...prev?.video, 
                          transcript: e.target.value 
                        }
                      };
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={10}
                    placeholder="Video transcript for accessibility and AI features..."
                  />
                </div>

                {/* Video Preview */}
                {lessonData.video?.youtube_id && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Video Preview</h3>
                    <div className="aspect-video bg-muted/50 rounded-lg overflow-hidden">
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
                    <div key={index} className="border rounded-lg p-4 hover:border-border transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getResourceIcon(resource.type)}
                          
                          <div className="flex-1">
                            <div className="mb-2">
                              <h3 className="font-medium text-foreground">
                                {resource.title}
                              </h3>
                            </div>
                          
                          {resource.description && (
                            <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                          )}
                          
                          <a
                            href={getAttachmentUrl(resource.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:text-primary"
                          >
                            {resource.url}
                          </a>
                          </div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteResource(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-4 p-1"
                          title="Remove resource"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Quiz Tab - Self-contained pattern */}
          {activeTab === 'quiz' && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Lesson Quiz</h2>
              </div>
              
              <QuizManager 
                lessonId={lessonId}
                hasQuiz={lessonData?.has_quiz}
                onCreateQuiz={handleCreateQuiz}
                onEditQuiz={handleEditQuiz}
                onQuizDeleted={handleQuizDeleted}
              />
            </Card>
          )}

        </Container>
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
            <p className="text-muted-foreground">
              Are you sure you want to delete this resource? This action cannot be undone.
            </p>
            
            {resources[selectedResourceIndex] && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="font-medium text-sm">{resources[selectedResourceIndex].title}</p>
                {resources[selectedResourceIndex].description && (
                  <p className="text-sm text-muted-foreground mt-1">{resources[selectedResourceIndex].description}</p>
                )}
              </div>
            )}
            
            <div className="flex space-x-3">
              <Button
                onClick={confirmDeleteResource}
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
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

      {/* Create Quiz Modal */}
      <CreateQuizModal
        isOpen={showCreateQuizModal}
        onClose={() => setShowCreateQuizModal(false)}
        lessonId={lessonId}
        courseId={courseId}
        lessonData={lessonData}  // ADD this line
        onQuizCreated={handleQuizCreated}
      />

      {/* Edit Quiz Modal */}
      {editingQuizId && (
        <EditQuizModal
          isOpen={showEditQuizModal}
          onClose={() => {
            setShowEditQuizModal(false);
            setEditingQuizId(null);
          }}
          quizId={editingQuizId}
          lessonData={lessonData}
          onQuizUpdated={handleQuizUpdated}
        />
      )}
    </NavigationGuard>
  );
};

export default LessonEditPage;