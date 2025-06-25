'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, Settings, Video, FileQuestion, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SaveStatusIndicator } from '@/components/ui/SaveStatusIndicator';
import NavigationGuard from '@/components/feature/NavigationGuard';
import { useAutosave } from '@/hooks/useAutosave';
import { useEditorStore } from '@/stores/editorStore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { quizAPI, Quiz, QuizQuestion } from '@/lib/api/quizzes';
import { updateLesson } from '@/lib/api/lessons';

interface Lesson {
  _id: string;
  title: string;
  description: string;
  video?: {
    youtube_url: string;
    duration?: number;
  };
  chapter_id: string;
  course_id: string;
  order: number;
  status: string;
}

interface QuizFormData {
  title: string;
  description: string;
  pass_percentage: number;
  max_attempts: number;
  shuffle_questions: boolean;
  shuffle_answers: boolean;
  show_correct_answers: boolean;
  immediate_feedback: boolean;
  questions: QuizQuestion[];
}

// YouTube URL validation helper
const isValidYouTubeUrl = (url: string): boolean => {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+(&.*)?$/,
    /^https?:\/\/youtu\.be\/[\w-]+(\?.*)?$/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+(\?.*)?$/,
  ];
  
  return patterns.some(pattern => pattern.test(url));
};

const LessonEditPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'quiz'>('general');
  const [loading, setLoading] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  
  // Quiz form state
  const [quizData, setQuizData] = useState<QuizFormData>({
    title: '',
    description: '',
    pass_percentage: 70,
    max_attempts: 3,
    shuffle_questions: true,
    shuffle_answers: true,
    show_correct_answers: true,
    immediate_feedback: true,
    questions: []
  });

  // Auto-save hook for lesson data
  const { saveStatus, lastSavedAt, error, forceSave, hasUnsavedChanges } = useAutosave(
    lesson,
    {
      delay: 2000,
      onSave: async (data) => {
        if (!data || !data._id) return;
        await updateLesson(data._id, data);
      },
      enabled: !!lesson,
    }
  );

  useEffect(() => {
    fetchLessonData();
  }, [lessonId]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      
      // Check permissions
      if (user?.role !== 'creator' && user?.role !== 'admin') {
        toast.error('You do not have permission to edit lessons');
        router.push('/dashboard');
        return;
      }

      // Fetch lesson details
      const lessonResponse = await fetch(`/api/v1/lessons/${lessonId}`, {
        credentials: 'include'
      });
      if (!lessonResponse.ok) throw new Error('Failed to fetch lesson');
      
      const lessonData = await lessonResponse.json();
      setLesson(lessonData.data);
      setTitleInput(lessonData.data.title);

      // Try to fetch quiz for this lesson
      try {
        const quizData = await quizAPI.getLessonQuiz(lessonId);
        setQuiz(quizData);
        
        // Populate quiz form with existing data
        setQuizData({
          title: quizData.title,
          description: quizData.description || '',
          pass_percentage: quizData.config.pass_percentage,
          max_attempts: quizData.config.max_attempts,
          shuffle_questions: quizData.config.shuffle_questions,
          shuffle_answers: quizData.config.shuffle_answers,
          show_correct_answers: quizData.config.show_correct_answers,
          immediate_feedback: quizData.config.immediate_feedback,
          questions: quizData.questions
        });
      } catch (error) {
        // No quiz exists yet, that's okay
        console.log('No quiz found for this lesson');
      }
    } catch (error) {
      console.error('Failed to fetch lesson data:', error);
      toast.error('Failed to load lesson data');
      router.push(`/creator/courses/${courseId}/edit`);
    } finally {
      setLoading(false);
    }
  };

  const handleTitleSave = () => {
    if (titleInput.trim() && titleInput !== lesson?.title) {
      setLesson(prev => prev ? { ...prev, title: titleInput.trim() } : null);
      setIsEditingTitle(false);
    }
  };

  const handleLessonUpdate = (field: string, value: any) => {
    setLesson(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleAddQuestion = () => {
    const newQuestion: QuizQuestion = {
      question: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: 0,
      explanation: '',
      points: 1
    };
    
    setQuizData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const handleQuestionUpdate = (index: number, field: string, value: any) => {
    setQuizData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      return { ...prev, questions: newQuestions };
    });
  };

  const handleOptionUpdate = (questionIndex: number, optionIndex: number, value: string) => {
    setQuizData(prev => {
      const newQuestions = [...prev.questions];
      const newOptions = [...newQuestions[questionIndex].options];
      newOptions[optionIndex] = value;
      newQuestions[questionIndex].options = newOptions;
      return { ...prev, questions: newQuestions };
    });
  };

  const handleDeleteQuestion = (index: number) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleSaveQuiz = async () => {
    try {
      // Validate quiz data
      if (!quizData.title.trim()) {
        toast.error('Quiz title is required');
        return;
      }
      
      if (quizData.questions.length === 0) {
        toast.error('Add at least one question');
        return;
      }
      
      // Validate all questions
      for (let i = 0; i < quizData.questions.length; i++) {
        const q = quizData.questions[i];
        if (!q.question.trim()) {
          toast.error(`Question ${i + 1} text is required`);
          return;
        }
        if (q.options.some(opt => !opt.trim())) {
          toast.error(`All options in question ${i + 1} must be filled`);
          return;
        }
      }
      
      // Calculate total points
      const totalPoints = quizData.questions.reduce((sum, q) => sum + q.points, 0);
      
      const quizPayload = {
        lesson_id: lessonId,
        course_id: courseId,
        title: quizData.title,
        description: quizData.description,
        config: {
          time_limit: null, // Can be added later
          pass_percentage: quizData.pass_percentage,
          max_attempts: quizData.max_attempts,
          shuffle_questions: quizData.shuffle_questions,
          shuffle_answers: quizData.shuffle_answers,
          show_correct_answers: quizData.show_correct_answers,
          immediate_feedback: quizData.immediate_feedback
        },
        questions: quizData.questions,
        total_points: totalPoints
      };
      
      if (quiz) {
        // Update existing quiz
        const updated = await quizAPI.updateQuiz(quiz._id, quizPayload);
        setQuiz(updated);
        toast.success('Quiz updated successfully');
      } else {
        // Create new quiz
        const created = await quizAPI.createQuiz(quizPayload);
        setQuiz(created);
        toast.success('Quiz created successfully');
      }
    } catch (error) {
      console.error('Failed to save quiz:', error);
      toast.error('Failed to save quiz');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600 text-lg">Lesson not found</p>
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
                    className="text-2xl font-bold cursor-pointer hover:text-blue-600"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {lesson.title}
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
                  onClick={() => router.push(`/learn/${courseId}/${lessonId}`)}
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
                    <Video className="w-4 h-4 inline mr-2" />
                    General Info
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('quiz')}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'quiz'
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <FileQuestion className="w-4 h-4 inline mr-2" />
                    Quiz
                    {quiz && <span className="ml-2 text-xs text-green-600">✓</span>}
                  </button>
                </nav>
              </Card>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3">
              {activeTab === 'general' && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Lesson Information</h2>
                  
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={lesson.description || ''}
                        onChange={(e) => handleLessonUpdate('description', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter lesson description..."
                      />
                    </div>

                    {/* Video URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        YouTube Video URL
                      </label>
                      <input
                        type="url"
                        value={lesson.video?.youtube_url || ''}
                        onChange={(e) => {
                          const url = e.target.value;
                          handleLessonUpdate('video', { 
                            ...lesson.video, 
                            youtube_url: url 
                          });
                          
                          // Validate YouTube URL
                          if (url && !isValidYouTubeUrl(url)) {
                            toast.error('Please enter a valid YouTube URL');
                          }
                        }}
                        onBlur={(e) => {
                          const url = e.target.value;
                          if (url && !isValidYouTubeUrl(url)) {
                            toast.error('Invalid YouTube URL format. Please use: https://www.youtube.com/watch?v=... or https://youtu.be/...');
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Supported formats: youtube.com/watch?v=... or youtu.be/...
                      </p>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={lesson.status || 'draft'}
                        onChange={(e) => handleLessonUpdate('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>
                </Card>
              )}

              {activeTab === 'quiz' && (
                <div className="space-y-6">
                  {/* Quiz Settings */}
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-6">Quiz Settings</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Quiz Title */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quiz Title
                        </label>
                        <input
                          type="text"
                          value={quizData.title}
                          onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="End of Lesson Quiz"
                        />
                      </div>

                      {/* Quiz Description */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description (Optional)
                        </label>
                        <textarea
                          value={quizData.description}
                          onChange={(e) => setQuizData(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Test your understanding of the concepts covered in this lesson"
                        />
                      </div>

                      {/* Pass Percentage */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pass Percentage
                        </label>
                        <input
                          type="number"
                          value={quizData.pass_percentage}
                          onChange={(e) => setQuizData(prev => ({ 
                            ...prev, 
                            pass_percentage: parseInt(e.target.value) || 70 
                          }))}
                          min="0"
                          max="100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Max Attempts */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum Attempts
                        </label>
                        <input
                          type="number"
                          value={quizData.max_attempts}
                          onChange={(e) => setQuizData(prev => ({ 
                            ...prev, 
                            max_attempts: parseInt(e.target.value) || 3 
                          }))}
                          min="1"
                          max="10"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Quiz Options */}
                      <div className="md:col-span-2 space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={quizData.shuffle_questions}
                            onChange={(e) => setQuizData(prev => ({ 
                              ...prev, 
                              shuffle_questions: e.target.checked 
                            }))}
                            className="mr-2"
                          />
                          Shuffle questions order
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={quizData.shuffle_answers}
                            onChange={(e) => setQuizData(prev => ({ 
                              ...prev, 
                              shuffle_answers: e.target.checked 
                            }))}
                            className="mr-2"
                          />
                          Shuffle answer options
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={quizData.show_correct_answers}
                            onChange={(e) => setQuizData(prev => ({ 
                              ...prev, 
                              show_correct_answers: e.target.checked 
                            }))}
                            className="mr-2"
                          />
                          Show correct answers after submission
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={quizData.immediate_feedback}
                            onChange={(e) => setQuizData(prev => ({ 
                              ...prev, 
                              immediate_feedback: e.target.checked 
                            }))}
                            className="mr-2"
                          />
                          Provide immediate feedback
                        </label>
                      </div>
                    </div>
                  </Card>

                  {/* Questions */}
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold">Questions</h2>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAddQuestion}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                      </Button>
                    </div>

                    {quizData.questions.length === 0 ? (
                      <div className="text-center py-12">
                        <FileQuestion className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-600 mb-4">No questions yet</p>
                        <Button
                          variant="primary"
                          onClick={handleAddQuestion}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Question
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {quizData.questions.map((question, qIndex) => (
                          <div key={qIndex} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-4">
                              <h3 className="font-medium">Question {qIndex + 1}</h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteQuestion(qIndex)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Question Text */}
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Question Text
                              </label>
                              <textarea
                                value={question.question}
                                onChange={(e) => handleQuestionUpdate(qIndex, 'question', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your question..."
                              />
                            </div>

                            {/* Answer Options */}
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Answer Options
                              </label>
                              <div className="space-y-2">
                                {question.options.map((option, oIndex) => (
                                  <div key={oIndex} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`correct-${qIndex}`}
                                      checked={question.correct_answer === oIndex}
                                      onChange={() => handleQuestionUpdate(qIndex, 'correct_answer', oIndex)}
                                      className="flex-shrink-0"
                                    />
                                    <input
                                      type="text"
                                      value={option}
                                      onChange={(e) => handleOptionUpdate(qIndex, oIndex, e.target.value)}
                                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder={`Option ${oIndex + 1}`}
                                    />
                                    {question.correct_answer === oIndex && (
                                      <span className="text-green-600 text-sm">✓ Correct</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Explanation */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Explanation (Optional)
                              </label>
                              <textarea
                                value={question.explanation || ''}
                                onChange={(e) => handleQuestionUpdate(qIndex, 'explanation', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Explain why this answer is correct..."
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Save Button */}
                    {quizData.questions.length > 0 && (
                      <div className="mt-6 flex justify-end">
                        <Button
                          variant="primary"
                          onClick={handleSaveQuiz}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {quiz ? 'Update Quiz' : 'Save Quiz'}
                        </Button>
                      </div>
                    )}
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </NavigationGuard>
  );
};

export default LessonEditPage;