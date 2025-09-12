import React, { useState, useEffect } from 'react';
import { Plus, Trash2, HelpCircle, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { MobileInput, MobileTextarea, MobileForm, MobileFormActions } from '@/components/ui/MobileForm';
import { LoadingSpinner } from '@/components/ui/LoadingStates';
import { useQuizQuery, useUpdateQuiz } from '@/hooks/queries/useQuizzes';
import { useGenerateQuizFromTranscript } from '@/hooks/queries/useAI';
import { ToastService } from '@/lib/toast/ToastService';
import { Lesson } from '@/lib/types/course';

interface QuizQuestion {
  question: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank';
  options: string[];
  correct_answer: number;
  explanation?: string;
  points: number;
}

interface EditQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  lessonData?: Lesson;
  onQuizUpdated: () => void;
}

interface QuizFormData {
  title: string;
  description: string;
  questions: QuizQuestion[];
  pass_percentage: number;
  time_limit: number | null;
  shuffle_questions: boolean;
  shuffle_answers: boolean;
}

export const EditQuizModal: React.FC<EditQuizModalProps> = ({
  isOpen,
  onClose,
  quizId,
  lessonData,
  onQuizUpdated
}) => {
  const [formData, setFormData] = useState<QuizFormData>({
    title: '',
    description: '',
    questions: [],
    pass_percentage: 70,
    time_limit: null,
    shuffle_questions: false,
    shuffle_answers: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({ });
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Fetch existing quiz data
  const { data: quizResponse, loading: fetchLoading } = useQuizQuery(quizId, isOpen);
  const { mutate: updateQuizMutation, loading } = useUpdateQuiz();
  const { mutate: generateFromTranscript } = useGenerateQuizFromTranscript();

  // Load quiz data when modal opens
  useEffect(() => {
    if (isOpen && quizResponse?.success && quizResponse.data) {
      const quiz = quizResponse.data;
      setFormData({
        title: quiz.title || '',
        description: quiz.description || '',
        questions: quiz.questions?.map(q => ({
          question: q.question || '',
          type: q.type || 'multiple_choice',
          options: q.options || ['', '', '', ''],
          correct_answer: q.correct_answer ?? 0,
          explanation: q.explanation || '',
          points: q.points || 1
        })) || [],
        pass_percentage: quiz.config?.pass_percentage || 70,
        time_limit: quiz.config?.time_limit || null,
        shuffle_questions: quiz.config?.shuffle_questions || false,
        shuffle_answers: quiz.config?.shuffle_answers || false
      });
    }
  }, [isOpen, quizResponse]);

  const handleInputChange = (field: keyof QuizFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleQuestionChange = (index: number, field: keyof QuizQuestion, value: any) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData(prev => ({ ...prev, questions: newQuestions }));
    
    // Clear related errors
    const errorKey = `question_${index}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const changeQuestionType = (index: number, type: 'multiple_choice' | 'true_false') => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = {
      ...newQuestions[index],
      type,
      options: type === 'true_false' ? ['True', 'False'] : ['', '', '', ''],
      correct_answer: 0
    };
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      question: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: 0,
      explanation: '',
      points: 1
    };
    setFormData(prev => ({ ...prev, questions: [...prev.questions, newQuestion] }));
  };

  const removeQuestion = (index: number) => {
    if (formData.questions.length > 1) {
      const newQuestions = formData.questions.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, questions: newQuestions }));
    }
  };

  const handleRegenerateQuiz = () => {
    // Start generating without clearing questions (so button stays visible)
    setIsGenerating(true);
    
    generateFromTranscript(
      {
        transcript: lessonData?.video?.transcript || '',
        difficulty: 'intermediate'
      },
      {
        onSuccess: (response) => {
          if (response.success && response.data.questions) {
            // Replace questions with new ones only on success
            setFormData(prev => ({
              ...prev,
              questions: response.data.questions
            }));
          }
          setIsGenerating(false);
        },
        onError: () => {
          setIsGenerating(false);
        }
      }
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = { };

    // Validate title
    if (!formData.title.trim()) {
      newErrors.title = 'Quiz title is required';
    } else if (formData.title.trim().length < 2) {
      newErrors.title = 'Quiz title must be at least 2 characters';
    }

    // Validate questions
    formData.questions.forEach((question, index) => {
      if (!question.question.trim()) {
        newErrors[`question_${index}`] = `Question ${index + 1} text is required`;
      }

      if (question.type === 'multiple_choice') {
        const nonEmptyOptions = question.options.filter(opt => opt.trim().length > 0);
        if (nonEmptyOptions.length < 2) {
          newErrors[`question_${index}_options`] = `Question ${index + 1} must have at least 2 options`;
        }
        
        if (question.correct_answer >= nonEmptyOptions.length) {
          newErrors[`question_${index}_correct`] = `Question ${index + 1} must have a valid correct answer`;
        }
      }
    });

    // Validate pass percentage
    if (formData.pass_percentage < 1 || formData.pass_percentage > 100) {
      newErrors.pass_percentage = 'Pass percentage must be between 1 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare quiz data for API
    const quizData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      config: {
        time_limit: formData.time_limit,
        pass_percentage: formData.pass_percentage,
        shuffle_questions: formData.shuffle_questions,
        shuffle_answers: formData.shuffle_answers
      },
      questions: formData.questions.map(q => {
        let options: string[];
        if (q.type === 'true_false') {
          options = ['True', 'False'];
        } else {
          // Multiple choice: ensure exactly 4 options (fill empty ones with placeholder)
          const filledOptions = [...q.options];
          while (filledOptions.length < 4) {
            filledOptions.push('');
          }
          options = filledOptions.slice(0, 4); // Take first 4 only
        }
        
        return {
          question: q.question.trim(),
          type: q.type,
          options,
          correct_answer: q.correct_answer,
          explanation: q.explanation?.trim() || undefined,
          points: q.points
        };
      })
    };

    updateQuizMutation({ quizId, data: quizData }, {
      onSuccess: (response) => {
        if (response.success) {
          onQuizUpdated();
          handleClose();
        }
      },
      onError: (error: any) => {
        console.error('Failed to update quiz:', error);
      }
    });
  };

  const handleClose = () => {
    if (!loading) {
      setErrors({ });
      onClose();
    }
  };

  if (fetchLoading) {
    return (
      <Modal isOpen={isOpen} onClose={() => { }} title="Loading Quiz...">
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      </Modal>
    );
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Edit Quiz"
      size="4xl"
    >
      <MobileForm onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <MobileInput
              label="Quiz Title"
              placeholder="Enter quiz title..."
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              error={errors.title}
              required
              disabled={loading}
            />

            <MobileTextarea
              label="Description (Optional)"
              placeholder="Describe what this quiz covers..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={loading}
              rows={2}
            />

            <div className="grid grid-cols-2 gap-4">
              <MobileInput
                label="Pass Percentage"
                type="number"
                placeholder="70"
                value={formData.pass_percentage}
                onChange={(e) => handleInputChange('pass_percentage', parseInt(e.target.value) || 70)}
                error={errors.pass_percentage}
                required
                min="1"
                max="100"
                disabled={loading}
              />

            </div>
          </div>

          {/* Questions */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Questions</h3>
              <div className="flex gap-2">
                {formData.questions.length > 0 && (
                  <Button
                    type="button"
                    onClick={handleRegenerateQuiz}
                    disabled={isGenerating}
                    variant="secondary"
                    size="sm"
                  >
                    {isGenerating ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Regenerate
                      </>
                    )}
                  </Button>
                )}
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={addQuestion}
                  disabled={loading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {formData.questions.map((question, qIndex) => (
                <div key={qIndex} className="border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium">Question {qIndex + 1}</h4>
                    {formData.questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(qIndex)}
                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Question Type */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Question Type
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`type_${qIndex}`}
                          checked={question.type === 'multiple_choice'}
                          onChange={() => changeQuestionType(qIndex, 'multiple_choice')}
                          className="mr-2"
                          disabled={loading}
                        />
                        Multiple Choice
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`type_${qIndex}`}
                          checked={question.type === 'true_false'}
                          onChange={() => changeQuestionType(qIndex, 'true_false')}
                          className="mr-2"
                          disabled={loading}
                        />
                        True/False
                      </label>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="mb-4">
                    <MobileTextarea
                      label="Question"
                      placeholder="Enter your question..."
                      value={question.question}
                      onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                      error={errors[`question_${qIndex}`]}
                      required
                      disabled={loading}
                      rows={2}
                    />
                  </div>

                  {/* Answer Options */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Answer Options
                    </label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Select the correct answer by clicking the radio button next to it:
                    </p>
                    {question.type === 'true_false' ? (
                      <div className="space-y-2">
                        <label className={`flex items-center p-3 rounded-lg border transition-colors cursor-pointer ${
                          question.correct_answer === 0 
                            ? 'bg-success/10 border-success text-success' 
                            : 'bg-muted border-border hover:border-border'
                        }`}>
                          <input
                            type="radio"
                            name={`correct_${qIndex}`}
                            checked={question.correct_answer === 0}
                            onChange={() => handleQuestionChange(qIndex, 'correct_answer', 0)}
                            className="mr-2"
                            disabled={loading}
                          />
                          <span className="flex items-center gap-2">
                            True
                            {question.correct_answer === 0 && (
                              <span className="text-success font-medium">✓ Correct Answer</span>
                            )}
                          </span>
                        </label>
                        <label className={`flex items-center p-3 rounded-lg border transition-colors cursor-pointer ${
                          question.correct_answer === 1 
                            ? 'bg-success/10 border-success text-success' 
                            : 'bg-muted border-border hover:border-border'
                        }`}>
                          <input
                            type="radio"
                            name={`correct_${qIndex}`}
                            checked={question.correct_answer === 1}
                            onChange={() => handleQuestionChange(qIndex, 'correct_answer', 1)}
                            className="mr-2"
                            disabled={loading}
                          />
                          <span className="flex items-center gap-2">
                            False
                            {question.correct_answer === 1 && (
                              <span className="text-success font-medium">✓ Correct Answer</span>
                            )}
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                            question.correct_answer === oIndex 
                              ? 'bg-success/10 border-success' 
                              : 'bg-muted border-border'
                          }`}>
                            <input
                              type="radio"
                              name={`correct_${qIndex}`}
                              checked={question.correct_answer === oIndex}
                              onChange={() => handleQuestionChange(qIndex, 'correct_answer', oIndex)}
                              disabled={loading}
                              className="flex-shrink-0"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                              placeholder={`Option ${oIndex + 1}...`}
                              className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                                question.correct_answer === oIndex 
                                  ? 'border-success/50 bg-white' 
                                  : 'border-border'
                              }`}
                              disabled={loading}
                            />
                            {question.correct_answer === oIndex && (
                              <span className="text-success font-medium flex-shrink-0">✓ Correct</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {errors[`question_${qIndex}_options`] && (
                      <p className="text-destructive text-sm mt-1">{errors[`question_${qIndex}_options`]}</p>
                    )}
                    {errors[`question_${qIndex}_correct`] && (
                      <p className="text-destructive text-sm mt-1">{errors[`question_${qIndex}_correct`]}</p>
                    )}
                  </div>

                  {/* Explanation (Optional) */}
                  <div>
                    <MobileTextarea
                      label="Explanation (Optional)"
                      placeholder="Explain why this is the correct answer..."
                      value={question.explanation || ''}
                      onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                      disabled={loading}
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quiz Settings */}
          <div className="space-y-4 bg-muted p-4 rounded-lg">
            <h3 className="font-medium">Quiz Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.shuffle_questions}
                  onChange={(e) => handleInputChange('shuffle_questions', e.target.checked)}
                  className="mr-2"
                  disabled={loading}
                />
                <span className="text-sm">Shuffle Questions</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.shuffle_answers}
                  onChange={(e) => handleInputChange('shuffle_answers', e.target.checked)}
                  className="mr-2"
                  disabled={loading}
                />
                <span className="text-sm">Shuffle Answers</span>
              </label>
            </div>
          </div>
        </div>

        <MobileFormActions>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              
            </>
          ) : (
            <Button 
              type="submit"
              variant="primary"
              disabled={loading}
            >
              Update Quiz
            </Button>
          )}
        </MobileFormActions>
      </MobileForm>
    </Modal>
  );
};

export default EditQuizModal;