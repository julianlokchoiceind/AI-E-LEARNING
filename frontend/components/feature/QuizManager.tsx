import React, { useState, useEffect } from 'react';
import { Edit3, Trash2, HelpCircle, Clock, Target, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useLessonQuizQuery, useDeleteQuiz } from '@/hooks/queries/useQuizzes';
import { LoadingSpinner } from '@/components/ui/LoadingStates';
import { EmptyQuizState } from '@/components/feature/EmptyQuizState';
import { ToastService } from '@/lib/toast/ToastService';

interface QuizManagerProps {
  lessonId: string;
  hasQuiz?: boolean;
  onEditQuiz?: (quizId: string) => void;
  onCreateQuiz?: () => void;
  onQuizDeleted?: () => void;
  className?: string;
}

export const QuizManager: React.FC<QuizManagerProps> = ({
  lessonId,
  hasQuiz = false,
  onEditQuiz,
  onCreateQuiz,
  onQuizDeleted,
  className = ''
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Only fetch quiz data if has_quiz is true (prevents 404 errors)
  const { data: quizResponse, loading, error, refetch } = useLessonQuizQuery(lessonId, hasQuiz, true); // enabled=hasQuiz, preview=true
  const { mutate: deleteQuizMutation, loading: deleteLoading } = useDeleteQuiz();

  const quiz = quizResponse?.success ? quizResponse.data : null;

  const handleEditQuiz = () => {
    if (quiz?.id && onEditQuiz) {
      onEditQuiz(quiz.id);
    }
  };

  const handleDeleteQuiz = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteQuiz = () => {
    if (!quiz?.id) return;

    deleteQuizMutation(quiz.id, {
      onSuccess: (response) => {
        if (response.success) {
          setShowDeleteModal(false);
          onQuizDeleted?.();
        }
      },
      onError: (error: any) => {
        console.error('Failed to delete quiz:', error);
        setShowDeleteModal(false);
      }
    });
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'true_false':
        return '✓/✗';
      case 'multiple_choice':
        return 'A/B/C';
      default:
        return '?';
    }
  };

  const getConfigBadges = () => {
    if (!quiz?.config) return [];
    
    const badges = [];
    
    if (quiz.config.time_limit) {
      badges.push({ 
        label: `${Math.round(quiz.config.time_limit / 60)}min`, 
        icon: <Clock className="w-3 h-3" />,
        variant: 'secondary' as const
      });
    }
    
    badges.push({ 
      label: `${quiz.config.pass_percentage}% to pass`, 
      icon: <Target className="w-3 h-3" />,
      variant: 'success' as const
    });
    

    return badges;
  };

  // If has_quiz is false, show empty state immediately (no API call)
  if (!hasQuiz) {
    if (onCreateQuiz) {
      return <EmptyQuizState onCreateQuiz={onCreateQuiz} />;
    }
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <HelpCircle className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">No Quiz Available</h3>
        <p className="text-muted-foreground max-w-md">
          This lesson doesn't have a quiz yet.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" message="Loading quiz..." />
      </div>
    );
  }

  // Handle network/connection errors only
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <HelpCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Connection Error</h3>
        <p className="text-muted-foreground mb-4">Failed to load quiz data.</p>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  // Handle empty state (no quiz exists) - Use the existing EmptyQuizState component  
  if (!quiz) {
    // If onCreateQuiz is provided, show the empty state with create button
    if (onCreateQuiz) {
      return <EmptyQuizState onCreateQuiz={onCreateQuiz} />;
    }
    
    // If no onCreateQuiz handler (e.g., in student view), just show a simple message
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <HelpCircle className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">No Quiz Available</h3>
        <p className="text-muted-foreground max-w-md">
          This lesson doesn't have a quiz yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-6 ${className}`}>
        {/* Quiz Header */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <HelpCircle className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">{quiz.title}</h2>
              </div>
              
              {quiz.description && (
                <p className="text-muted-foreground mb-4">{quiz.description}</p>
              )}

              {/* Quiz Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <HelpCircle className="w-4 h-4" />
                  {quiz.questions?.length || 0} Questions
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {quiz.total_points} Points
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditQuiz}
                className="flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteQuiz}
                className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/20"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </div>

          {/* Configuration Badges */}
          <div className="flex flex-wrap gap-2">
            {getConfigBadges().map((badge, index) => (
              <Badge
                key={index}
                variant={badge.variant}
                className="flex items-center gap-1 text-xs"
              >
                {badge.icon}
                {badge.label}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Quiz Questions Preview */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Questions Preview</h3>
            <Badge variant="secondary" className="text-xs">
              Preview Mode
            </Badge>
          </div>

          <div className="space-y-4">
            {quiz.questions?.map((question, index) => (
              <div key={index} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-2">{question.question}</h4>
                      
                      {/* Question Options */}
                      <div className="space-y-2">
                        {question.options?.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2 text-sm">
                            <span className="w-4 h-4 border border-border rounded-full flex-shrink-0"></span>
                            <span className="text-foreground">{option}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant="secondary" size="sm">
                      {getQuestionTypeIcon(question.type)}
                    </Badge>
                    <Badge variant="info" size="sm">
                      {question.points}pt
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quiz Settings Summary */}
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="font-medium text-foreground mb-3">Quiz Settings</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pass Percentage:</span>
                  <span className="font-medium">{quiz.config?.pass_percentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time Limit:</span>
                  <span className="font-medium">
                    {quiz.config?.time_limit ? `${Math.round(quiz.config.time_limit / 60)} minutes` : 'No limit'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shuffle Questions:</span>
                  <span className="font-medium">{quiz.config?.shuffle_questions ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shuffle Answers:</span>
                  <span className="font-medium">{quiz.config?.shuffle_answers ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Quiz"
        >
          <div className="space-y-4 p-6">
            <p className="text-muted-foreground">
              Are you sure you want to delete this quiz? This action cannot be undone and will affect all students who have taken or are planning to take this quiz.
            </p>
            
            <div className="bg-destructive/10 p-3 rounded-lg">
              <p className="font-medium text-destructive text-sm">{quiz.title}</p>
              <p className="text-destructive text-sm mt-1">
                {quiz.questions?.length} questions • {quiz.total_points} total points
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={confirmDeleteQuiz}
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/20 flex-1"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Quiz'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default QuizManager;