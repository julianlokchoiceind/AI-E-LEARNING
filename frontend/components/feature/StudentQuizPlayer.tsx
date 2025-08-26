import React, { useState, useEffect } from 'react';
import { HelpCircle, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingStates';
import { ToastService } from '@/lib/toast/ToastService';
import { useLessonQuizQuery } from '@/hooks/queries/useQuizzes';
import { useApiMutation } from '@/hooks/useApiMutation';
import { quizAPI } from '@/lib/api/quizzes';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface StudentQuizPlayerProps {
  lessonId: string;
  onComplete?: (passed: boolean) => void;
  isPreviewMode?: boolean;
}

export const StudentQuizPlayer: React.FC<StudentQuizPlayerProps> = ({
  lessonId,
  onComplete,
  isPreviewMode = false
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string | boolean>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [isReviewExpanded, setIsReviewExpanded] = useState(true);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [savedProgress, setSavedProgress] = useState<any>(null);


  // Fetch quiz data - pass enabled=true and preview=true/false based on mode
  const { data: quizResponse, loading, error } = useLessonQuizQuery(lessonId, true, isPreviewMode);
  const { mutate: submitQuiz, loading: submitting } = useApiMutation(
    (data) => quizAPI.submitQuiz(data.quizId, data.submission),
    { operationName: 'submit-quiz' }
  );
  
  const quiz = quizResponse?.data;

  // Auto-resume quiz if progress exists (Smart Backend handles logic)
  useEffect(() => {
    const checkAndAutoResume = async () => {
      if (!quiz?.id || isPreviewMode || (quiz as any)?.is_completed) {
        return;
      }
      
      try {
        const response = await quizAPI.getSavedProgress(quiz.id);
        
        if (response.success && response.data?.has_saved_progress) {
          // Auto-resume - no UI prompt needed!
          const savedAnswers: Record<number, string | boolean> = {};
          response.data.saved_answers?.forEach((answer: any, index: number) => {
            if (answer !== -1) savedAnswers[index] = answer;
          });
          
          setQuizStarted(true);
          setSelectedAnswers(savedAnswers);
          setCurrentQuestionIndex(response.data.current_question_index || 0);
          setSavedProgress(response.data);
          
          if (quiz?.config?.time_limit) {
            setTimeRemaining(quiz.config.time_limit);
          }
        }
      } catch (error) {
        // Silent fail - no saved progress
      }
    };
    
    checkAndAutoResume();
  }, [quiz?.id, isPreviewMode, (quiz as any)?.is_completed, quiz?.config?.time_limit]);

  // Auto-save when question index changes (navigation)
  useEffect(() => {
    if (!isPreviewMode && quiz?.id && quizStarted) {
      const answersArray = quiz.questions?.map((_, index) => {
        const answer = selectedAnswers[index];
        if (answer === undefined) return -1;
        if (typeof answer === 'boolean') return answer ? 1 : 0;
        if (typeof answer === 'string') return parseInt(answer, 10) || -1;
        return answer;
      }) || [];
      
      const timer = setTimeout(() => {
        quizAPI.saveProgress(quiz.id, answersArray, currentQuestionIndex)
          .catch(() => {}); // Silent fail
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIndex, quiz?.id, quizStarted, isPreviewMode]);

  // Timer effect
  useEffect(() => {
    if (!quizStarted || !timeRemaining || timeRemaining <= 0 || quizCompleted) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (!prev || prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, timeRemaining, quizCompleted]);

  const handleStartQuiz = () => {
    setQuizStarted(true);
    
    if (quiz?.config?.time_limit) {
      setTimeRemaining(quiz.config.time_limit);
    }
  };

  const handleAnswerSelect = (answer: string | boolean) => {
    const newAnswers = {
      ...selectedAnswers,
      [currentQuestionIndex]: answer
    };
    setSelectedAnswers(newAnswers);
    
    // Auto-save progress (debounced - Smart Backend handles storage)
    if (!isPreviewMode && quiz?.id && quizStarted) {
      const answersArray = quiz.questions?.map((_, index) => {
        const answer = newAnswers[index];
        if (answer === undefined) return -1;
        if (typeof answer === 'boolean') return answer ? 1 : 0;
        if (typeof answer === 'string') return parseInt(answer, 10) || -1;
        return answer;
      }) || [];
      
      setTimeout(async () => {
        try {
          await quizAPI.saveProgress(quiz.id, answersArray, currentQuestionIndex);
        } catch (error) {
          // Silent fail
        }
      }, 1000);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handlePreviousReview = () => {
    if (currentReviewIndex > 0) {
      setCurrentReviewIndex(currentReviewIndex - 1);
    }
  };

  const handleNextReview = () => {
    if (currentReviewIndex < (quiz?.questions?.length || 0) - 1) {
      setCurrentReviewIndex(currentReviewIndex + 1);
    }
  };

  const handleSubmitQuiz = async () => {
    // Validation: Check if all questions are answered
    const totalQuestions = quiz?.questions?.length || 0;
    const answeredQuestions = Object.keys(selectedAnswers).length;
    const unansweredQuestions = [];
    
    for (let i = 0; i < totalQuestions; i++) {
      if (selectedAnswers[i] === undefined) {
        unansweredQuestions.push(i + 1);
      }
    }
    
    if (unansweredQuestions.length > 0) {
      ToastService.error(`Please answer all questions. Missing: Question ${unansweredQuestions.join(', ')}`);
      return;
    }
    
    if (isPreviewMode) {
      // Calculate score locally for preview
      let correctCount = 0;
      quiz?.questions?.forEach((question: any, index: number) => {
        // selectedAnswers now contains indexes (integers) which match question.correct_answer
        if (selectedAnswers[index] === question.correct_answer) {
          correctCount++;
        }
      });
      
      const finalScore = Math.round((correctCount / (quiz?.questions?.length || 1)) * 100);
      setScore(finalScore);
      setQuizCompleted(true);
      
      ToastService.info('Preview mode - results not saved');
      onComplete?.(finalScore >= (quiz?.config?.pass_percentage || 70));
      return;
    }

    // Real submission for students
    try {
      const answers = quiz?.questions?.map((question: any, index: number) => 
        selectedAnswers[index] !== undefined ? selectedAnswers[index] : -1
      );

      submitQuiz(
        { 
          quizId: quiz?.id, 
          submission: { 
            answers, 
            time_taken: quiz?.config?.time_limit ? (quiz.config.time_limit * 60) - (timeRemaining || 0) : undefined 
          } 
        },
        {
          onSuccess: async (response) => {
            if (response.success) {
              // Clear auto-save progress (Smart Backend cleanup)
              try {
                if (quiz?.id) {
                  await quizAPI.clearProgress(quiz.id);
                }
              } catch (error) {
                // Silent fail
              }
              
              // After successful submission, reload to show the completed quiz state with review
              if (response.data) {
                onComplete?.(response.data.passed);
              }
              window.location.reload();
            }
          }
        }
      );
    } catch (error) {
      console.error('Quiz submission error:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="md" message="Loading quiz..." />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
        <p className="text-muted-foreground">No quiz available for this lesson.</p>
      </div>
    );
  }

  // Simple logic: Show results if completed, otherwise show quiz
  if (!quizStarted) {
    // Case 1: Quiz already completed - show results and review
    // Check both backend data and local state for optimal experience
    if (((quiz as any)?.is_completed || quizCompleted) && ((quiz as any)?.score !== undefined || score !== null)) {
      return (
        <div className="space-y-6">
          {/* Score Display */}
          <Card className="p-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">{quiz.title}</h3>
              
              <div className="text-4xl font-bold my-4 text-primary">
                {(quiz as any)?.score !== undefined ? (quiz as any).score : score}%
              </div>
              
              <p className="text-muted-foreground mb-4">
                {((quiz as any)?.score !== undefined ? (quiz as any).score : score) >= (quiz.config?.pass_percentage || 70) ? 'You passed!' : `Need ${quiz.config?.pass_percentage}% to pass`}
              </p>
              
              <div className="text-muted-foreground text-sm">
                Quiz completed - Final result
              </div>
            </div>
          </Card>

          {/* Review Answers - Always visible when completed */}
          {((quiz as any)?.is_completed && quiz?.questions && (quiz as any)?.answers) && (
            <div className="space-y-4">
              <button
                onClick={() => setIsReviewExpanded(!isReviewExpanded)}
                className="flex items-center gap-2 text-lg font-semibold hover:text-primary transition-colors"
              >
                <span>Review Your Answers:</span>
                <ChevronDown 
                  className={`h-5 w-5 transition-transform duration-200 ${
                    isReviewExpanded ? '' : '-rotate-90'
                  }`}
                />
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ease-in-out space-y-4 ${
                isReviewExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
              }`}>
                {/* Review Question Header */}
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-muted-foreground">
                    Question {currentReviewIndex + 1} of {quiz.questions?.length}
                  </div>
                </div>

                {/* Current Review Question */}
                {(() => {
                  const question = quiz.questions?.[currentReviewIndex];
                  const studentAnswer = (quiz as any)?.answers?.[currentReviewIndex];
                  const isCorrect = studentAnswer === question?.correct_answer;
                  
                  if (!question) return null;
                  
                  return (
                    <Card className="p-6">
                      <div className="flex justify-between mb-4">
                        <h4 className="font-medium">
                          Q{currentReviewIndex + 1}: {question.question}
                        </h4>
                        <span className={isCorrect ? 'text-success' : 'text-destructive'}>
                          {isCorrect ? '✓' : '✗'}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {question.type === 'true_false' ? (
                          ['True', 'False'].map((label, i) => (
                            <label key={i} className={`
                              flex items-center p-3 rounded-lg border cursor-not-allowed
                              ${studentAnswer === i && isCorrect ? 'bg-success/20 border-success' : ''}
                              ${studentAnswer === i && !isCorrect ? 'bg-destructive/20 border-destructive' : ''}
                              ${question.correct_answer === i && studentAnswer !== i ? 'border-success border-dashed' : ''}
                              ${studentAnswer !== i && question.correct_answer !== i ? 'border-border' : ''}
                            `.trim()}>
                              <input type="radio" checked={studentAnswer === i} disabled className="mr-2" />
                              <span>{label}</span>
                              {question.correct_answer === i && <span className="ml-auto text-success">✓</span>}
                            </label>
                          ))
                        ) : (
                          question.options?.map((option, i) => (
                            <label key={i} className={`
                              flex items-center p-3 rounded-lg border cursor-not-allowed
                              ${studentAnswer === i && isCorrect ? 'bg-success/20 border-success' : ''}
                              ${studentAnswer === i && !isCorrect ? 'bg-destructive/20 border-destructive' : ''}
                              ${question.correct_answer === i && studentAnswer !== i ? 'border-success border-dashed' : ''}
                              ${studentAnswer !== i && question.correct_answer !== i ? 'border-border' : ''}
                            `.trim()}>
                              <input type="radio" checked={studentAnswer === i} disabled className="mr-2" />
                              <span>{option}</span>
                              {question.correct_answer === i && <span className="ml-auto text-success">✓</span>}
                            </label>
                          ))
                        )}
                      </div>
                    </Card>
                  );
                })()}

                {/* Review Navigation Buttons */}
                {quiz.questions && quiz.questions.length > 1 && (
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={handlePreviousReview}
                      disabled={currentReviewIndex === 0}
                    >
                      Previous
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleNextReview}
                      disabled={currentReviewIndex === (quiz.questions?.length || 0) - 1}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Case 2: Quiz not taken yet - show start quiz (auto-resume handled above)
    return (
      <Card className="p-6">
        <div className="text-center">
          <HelpCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 capitalize">{quiz.title}</h3>
          {quiz.description && (
            <p className="text-muted-foreground mb-4">{quiz.description}</p>
          )}
          
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto my-6 text-sm">
            <div className="text-left">
              <span className="text-muted-foreground">Questions:</span>
              <span className="ml-2 font-medium">{quiz.questions?.length || 0}</span>
            </div>
            <div className="text-left">
              <span className="text-muted-foreground">Pass Score:</span>
              <span className="ml-2 font-medium">{quiz.config?.pass_percentage}%</span>
            </div>
            {quiz.config?.time_limit && (
              <div className="text-left">
                <span className="text-muted-foreground">Time Limit:</span>
                <span className="ml-2 font-medium">{Math.round(quiz.config.time_limit / 60)} min</span>
              </div>
            )}
          </div>
          
          <Button onClick={handleStartQuiz} size="lg">
            Start Quiz
          </Button>
        </div>
      </Card>
    );
  }

  // After submission, we reload to show the completed quiz state with review
  // This temporary completion state should not be shown anymore
  if (quizCompleted && score !== null) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="md" message="Loading quiz results..." />
      </div>
    );
  }

  // Quiz in progress
  const currentQuestion = quiz.questions?.[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / (quiz.questions?.length || 1)) * 100;

  return (
    <div className="space-y-4">
      {/* Quiz Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {quiz.questions?.length}
        </div>
        {timeRemaining && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            <span className={timeRemaining < 60 ? 'text-destructive font-medium' : ''}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        )}
      </div>

      <ProgressBar value={progress} className="mb-4" />

      {/* Question Card */}
      <Card className="p-6">
        <h4 className="text-lg font-medium mb-4">{currentQuestion?.question}</h4>
        
        <div className="space-y-3">
          {currentQuestion?.type === 'true_false' ? (
            <>
              <button
                onClick={() => handleAnswerSelect(true)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedAnswers[currentQuestionIndex] === true
                    ? 'border-primary bg-primary/20'
                    : 'border-border hover:border-border'
                }`}
              >
                True
              </button>
              <button
                onClick={() => handleAnswerSelect(false)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedAnswers[currentQuestionIndex] === false
                    ? 'border-primary bg-primary/20'
                    : 'border-border hover:border-border'
                }`}
              >
                False
              </button>
            </>
          ) : (
            currentQuestion?.options?.map((option: string, index: number) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index.toString())}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedAnswers[currentQuestionIndex] === index.toString()
                    ? 'border-primary bg-primary/20'
                    : 'border-border hover:border-border'
                }`}
              >
                {option}
              </button>
            ))
          )}
        </div>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>

        {currentQuestionIndex === (quiz.questions?.length || 0) - 1 ? (
          <Button
            variant="primary"
            onClick={handleSubmitQuiz}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleNextQuestion}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
};

export default StudentQuizPlayer;