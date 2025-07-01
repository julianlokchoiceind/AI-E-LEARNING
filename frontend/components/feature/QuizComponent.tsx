'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Clock, CheckCircle, XCircle, RotateCcw, Trophy } from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardContent,
  Button,
  RadioGroup,
  RadioGroupItem,
  Label,
  ProgressBar as Progress
} from '@/components/ui';
import { quizAPI, Quiz, QuizProgress, QuizAnswerSubmit, QuizAttemptResult } from '@/lib/api/quizzes';

interface QuizComponentProps {
  lessonId: string;
  onComplete?: (passed: boolean) => void;
}

export function QuizComponent({ lessonId, onComplete }: QuizComponentProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [progress, setProgress] = useState<QuizProgress | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [attemptResult, setAttemptResult] = useState<QuizAttemptResult | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch quiz and progress
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setIsLoading(true);
        const quizData = await quizAPI.getLessonQuiz(lessonId);
        setQuiz(quizData);
        
        // Initialize answers array
        setSelectedAnswers(new Array(quizData.questions.length).fill(-1));
        
        // Try to get progress
        try {
          const progressData = await quizAPI.getQuizProgress(quizData._id);
          setProgress(progressData);
        } catch (error) {
          // No progress yet, that's okay
        }
      } catch (error: any) {
        console.error('Failed to fetch quiz:', error);
        toast.error(error.message || 'Operation Failed');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizData();
  }, [lessonId]);

  // Calculate current question
  const currentQuestion = useMemo(() => {
    if (!quiz || currentQuestionIndex >= quiz.questions.length) return null;
    return quiz.questions[currentQuestionIndex];
  }, [quiz, currentQuestionIndex]);

  // Handle answer selection
  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  // Navigate between questions
  const goToNextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Submit quiz
  const handleSubmit = async () => {
    if (!quiz) return;

    // Check if all questions are answered
    const unansweredCount = selectedAnswers.filter(a => a === -1).length;
    if (unansweredCount > 0) {
      toast.error(`Please answer all questions. ${unansweredCount} questions remaining.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      
      const submission: QuizAnswerSubmit = {
        answers: selectedAnswers,
        time_taken: timeTaken
      };

      const result = await quizAPI.submitQuiz(quiz._id, submission);
      setAttemptResult(result);
      setShowResults(true);

      // Update progress
      if (progress) {
        const updatedProgress = {
          ...progress,
          attempts: [...progress.attempts, result],
          total_attempts: progress.total_attempts + 1,
          best_score: Math.max(progress.best_score, result.score),
          is_passed: progress.is_passed || result.passed,
          can_retry: progress.total_attempts + 1 < quiz.config.max_attempts
        };
        setProgress(updatedProgress);
      }

      // Notify parent component
      if (onComplete) {
        onComplete(result.passed);
      }

      // Show result message
      if (result.passed) {
        toast.success(result.message || 'Operation Failed');
      } else {
        toast.error(result.message || 'Operation Failed');
      }
    } catch (error: any) {
      console.error('Failed to submit quiz:', error);
      toast.error(error.message || 'Operation Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retry quiz
  const handleRetry = () => {
    setSelectedAnswers(new Array(quiz?.questions.length || 0).fill(-1));
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setAttemptResult(null);
    setStartTime(Date.now());
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (!quiz) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No quiz available for this lesson.</p>
        </CardContent>
      </Card>
    );
  }

  // Show results
  if (showResults && attemptResult) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Quiz Results</h3>
            {attemptResult.passed ? (
              <Trophy className="h-8 w-8 text-yellow-500" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Score Summary */}
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl font-bold mb-2">
                {attemptResult.score}%
              </div>
              <p className="text-gray-600">
                {attemptResult.correct_answers} out of {attemptResult.total_questions} correct
              </p>
              {attemptResult.passed ? (
                <p className="text-green-600 font-semibold mt-2">PASSED</p>
              ) : (
                <p className="text-red-600 font-semibold mt-2">
                  FAILED (Need {quiz.config.pass_percentage}% to pass)
                </p>
              )}
            </div>

            {/* Question Feedback */}
            {quiz.config.show_correct_answers && attemptResult.questions_feedback && (
              <div className="space-y-4">
                <h4 className="font-semibold">Review Your Answers:</h4>
                {attemptResult.questions_feedback.map((feedback, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      feedback.is_correct
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {feedback.is_correct ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium mb-2">
                          Question {index + 1}: {quiz.questions[index].question}
                        </p>
                        <p className="text-sm">
                          Your answer: {quiz.questions[index].options[feedback.selected_answer]}
                        </p>
                        {!feedback.is_correct && (
                          <p className="text-sm text-green-600 mt-1">
                            Correct answer: {quiz.questions[index].options[feedback.correct_answer]}
                          </p>
                        )}
                        {feedback.explanation && (
                          <p className="text-sm text-gray-600 mt-2">
                            <strong>Explanation:</strong> {feedback.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              {progress && progress.can_retry && !attemptResult.passed && (
                <Button onClick={handleRetry} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again ({quiz.config.max_attempts - progress.total_attempts} attempts left)
                </Button>
              )}
              <Button onClick={() => window.location.reload()}>
                Continue to Lesson
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show quiz interface
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">{quiz.title}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {quiz.config.time_limit && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{quiz.config.time_limit} min</span>
              </div>
            )}
            <span>
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>
          </div>
        </div>
        <Progress
          value={((currentQuestionIndex + 1) / quiz.questions.length) * 100}
          className="mt-2"
        />
      </CardHeader>
      <CardContent>
        {currentQuestion && (
          <div className="space-y-6">
            {/* Question */}
            <div>
              <h4 className="text-lg font-medium mb-4">{currentQuestion.question}</h4>
              
              {/* Answer Options */}
              <RadioGroup
                value={selectedAnswers[currentQuestionIndex]?.toString() || ''}
                onValueChange={(value) => handleAnswerSelect(parseInt(value))}
              >
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                    >
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label
                        htmlFor={`option-${index}`}
                        className="flex-1 cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              
              {currentQuestionIndex === quiz.questions.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </Button>
              ) : (
                <Button onClick={goToNextQuestion}>
                  Next
                </Button>
              )}
            </div>

            {/* Progress Info */}
            {progress && progress.total_attempts > 0 && (
              <div className="text-sm text-gray-600 text-center">
                <p>
                  Previous attempts: {progress.total_attempts} | Best score: {progress.best_score}%
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}