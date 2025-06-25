'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VideoPlayer } from '@/components/feature/VideoPlayer';
import { toast } from 'react-hot-toast';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';

interface Lesson {
  _id: string;
  title: string;
  description: string;
  video: {
    url: string;
    youtube_id: string;
    duration: number;
  };
  order: number;
  chapter_id: string;
}

interface Chapter {
  _id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Progress {
  video_progress: {
    watch_percentage: number;
    current_position: number;
    is_completed: boolean;
  };
  is_completed: boolean;
  is_unlocked: boolean;
}

export default function LessonPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressUpdateInterval, setProgressUpdateInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchLessonData();
    startLesson();
    fetchCourseStructure();

    return () => {
      if (progressUpdateInterval) {
        clearInterval(progressUpdateInterval);
      }
    };
  }, [lessonId]);

  const fetchLessonData = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.LESSONS}/${lessonId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lesson');
      }

      const data = await response.json();
      setLesson(data.data);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      toast.error('Failed to load lesson');
    }
  };

  const startLesson = async () => {
    try {
      // Start lesson to create progress record
      const startResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/progress/lessons/${lessonId}/start`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!startResponse.ok) {
        const error = await startResponse.json();
        if (error.detail?.includes('Complete previous lessons')) {
          toast.error('Please complete previous lessons first');
          router.back();
          return;
        }
        throw new Error('Failed to start lesson');
      }

      // Get progress data
      const progressResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/progress/lessons/${lessonId}/progress`, {
        credentials: 'include',
      });

      if (progressResponse.ok) {
        const data = await progressResponse.json();
        setProgress(data.data);
      }
    } catch (error) {
      console.error('Error starting lesson:', error);
      toast.error('Failed to start lesson');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseStructure = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.CHAPTERS}/courses/${courseId}/chapters-with-lessons`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setChapters(data.data);
        
        // Find current chapter and next lesson
        for (const chapter of data.data) {
          const lessonIndex = chapter.lessons.findIndex((l: Lesson) => l._id === lessonId);
          if (lessonIndex !== -1) {
            setCurrentChapter(chapter);
            
            // Check for next lesson in same chapter
            if (lessonIndex < chapter.lessons.length - 1) {
              setNextLesson(chapter.lessons[lessonIndex + 1]);
            } else {
              // Check for first lesson in next chapter
              const chapterIndex = data.data.findIndex((c: Chapter) => c._id === chapter._id);
              if (chapterIndex < data.data.length - 1 && data.data[chapterIndex + 1].lessons.length > 0) {
                setNextLesson(data.data[chapterIndex + 1].lessons[0]);
              }
            }
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching course structure:', error);
    }
  };

  const handleVideoProgress = async (percentage: number) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/progress/lessons/${lessonId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          watch_percentage: percentage,
          current_position: 0, // VideoPlayer should provide this
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(data.data);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleVideoComplete = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/progress/lessons/${lessonId}/complete`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Lesson completed! 🎉');
        
        // Update local progress state
        if (progress) {
          setProgress({
            ...progress,
            is_completed: true,
            video_progress: {
              ...progress.video_progress,
              is_completed: true,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

  const navigateToLesson = (targetLessonId: string) => {
    router.push(`/learn/${courseId}/${targetLessonId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-600">Lesson not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar - Course Navigation */}
        <aside className="w-80 bg-white border-r h-screen overflow-y-auto">
          <div className="p-4 border-b">
            <button
              onClick={() => router.push(`/courses/${courseId}`)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to course
            </button>
          </div>

          <div className="p-4">
            {chapters.map((chapter) => (
              <div key={chapter._id} className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Chapter {chapter.order}: {chapter.title}
                </h3>
                <div className="space-y-1">
                  {chapter.lessons.map((chapterLesson) => {
                    const isCurrentLesson = chapterLesson._id === lessonId;
                    const isCompleted = false; // TODO: Check completion status
                    
                    return (
                      <button
                        key={chapterLesson._id}
                        onClick={() => navigateToLesson(chapterLesson._id)}
                        className={`w-full text-left px-3 py-2 rounded transition-colors ${
                          isCurrentLesson
                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className={`mr-2 ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                            {isCompleted ? '✓' : '○'}
                          </span>
                          <span className="text-sm">{chapterLesson.title}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-5xl mx-auto p-8">
            {/* Lesson Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
              {currentChapter && (
                <p className="text-gray-600">
                  Chapter {currentChapter.order}: {currentChapter.title}
                </p>
              )}
            </div>

            {/* Video Player */}
            <div className="mb-8">
              <VideoPlayer
                videoUrl={lesson.video.url}
                lessonId={lessonId}
                courseId={courseId}
                onProgress={handleVideoProgress}
                onComplete={handleVideoComplete}
                initialProgress={progress?.video_progress.watch_percentage || 0}
                nextLessonId={nextLesson?._id}
              />
            </div>

            {/* Lesson Description */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">About this lesson</h2>
              <div className="prose max-w-none text-gray-700">
                {lesson.description || 'No description available.'}
              </div>
            </div>

            {/* Completion Status */}
            {progress?.is_completed && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✓ You have completed this lesson
                </p>
              </div>
            )}

            {/* Next Lesson Button */}
            {nextLesson && progress?.video_progress.watch_percentage >= 80 && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => navigateToLesson(nextLesson._id)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue to Next Lesson →
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}