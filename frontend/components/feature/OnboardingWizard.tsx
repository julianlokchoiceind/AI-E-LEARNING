'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { OnboardingStatus, OnboardingRecommendations } from '@/lib/api/onboarding';
import {
  useOnboardingStatusQuery,
  useStartOnboarding,
  useSkipOnboarding,
  useUpdateLearningPath,
  useUpdateProfileSetup,
  useCourseRecommendationsQuery,
  useCompleteOnboarding
} from '@/hooks/queries/useStudent';
import { 
  ArrowRight, 
  ArrowLeft, 
  X, 
  BookOpen, 
  Target, 
  User, 
  Sparkles,
  CheckCircle,
  Clock,
  TrendingUp,
  Users
} from 'lucide-react';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  onShowMessage?: (message: string, type: 'info' | 'error') => void;
}

type OnboardingStep = 'welcome' | 'learning_path' | 'profile_setup' | 'course_recommendations' | 'completed';

interface WizardState {
  currentStep: OnboardingStep;
  progress: number;
  isLoading: boolean;
  
  // Learning path data
  selectedPaths: string[];
  skillLevel: string;
  timeCommitment: string;
  learningGoals: string[];
  
  // Profile data
  bio: string;
  title: string;
  location: string;
  interests: string[];
  careerGoals: string[];
  linkedin: string;
  github: string;
  
  // Recommendations
  recommendations: OnboardingRecommendations | null;
  selectedCourses: string[];
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
  onShowMessage
}) => {
  const [state, setState] = useState<WizardState>({
    currentStep: 'welcome',
    progress: 0,
    isLoading: false,
    
    selectedPaths: [],
    skillLevel: '',
    timeCommitment: '',
    learningGoals: [],
    
    bio: '',
    title: '',
    location: '',
    interests: [],
    careerGoals: [],
    linkedin: '',
    github: '',
    
    recommendations: null,
    selectedCourses: []
  });

  // React Query hooks for onboarding operations
  const { data: onboardingStatusResponse, execute: fetchOnboardingStatus } = useOnboardingStatusQuery(false);
  const { data: recommendationsResponse, execute: fetchRecommendations } = useCourseRecommendationsQuery(false);
  const { mutate: startOnboardingMutation } = useStartOnboarding();
  const { mutate: skipOnboardingMutation } = useSkipOnboarding();
  const { mutate: updateLearningPathMutation } = useUpdateLearningPath();
  const { mutate: updateProfileSetupMutation } = useUpdateProfileSetup();
  const { mutate: completeOnboardingMutation } = useCompleteOnboarding();

  // Check onboarding status when modal opens
  useEffect(() => {
    if (isOpen) {
      checkOnboardingStatus();
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const checkOnboardingStatus = async () => {
    try {
      // Use React Query hook instead of direct API call
      await fetchOnboardingStatus();
      
      if (!onboardingStatusResponse?.success || !onboardingStatusResponse.data) {
        throw new Error(onboardingStatusResponse?.message || 'Something went wrong');
      }
      
      const status = onboardingStatusResponse.data as OnboardingStatus;
      if (status.is_completed || status.skipped) {
        onClose();
        return;
      }
      
      setState(prev => ({
        ...prev,
        currentStep: status.current_step as OnboardingStep,
        progress: status.progress_percentage
      }));
    } catch (error: any) {
      console.error('Failed to check onboarding status:', error);
      onShowMessage?.(error.message || 'Something went wrong', 'error');
    }
  };

  const handleSkipOnboarding = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Use React Query mutation instead of direct API call
    skipOnboardingMutation(undefined, {
      onSuccess: (response) => {
        // Manual toast removed - useApiMutation handles API response toast automatically
        onClose();
        onComplete?.();
      },
      onError: (error: any) => {
        console.error('Failed to skip onboarding:', error);
        // Manual toast removed - useApiMutation handles API error toast automatically
      },
      onSettled: () => {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });
  };

  const handleStartOnboarding = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Use React Query mutation instead of direct API call
    startOnboardingMutation(false, {
      onSuccess: (response) => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Something went wrong');
        }
        
        const data = response.data;
        setState(prev => ({
          ...prev,
          currentStep: 'learning_path',
          progress: data.progress_percentage
        }));
      },
      onError: (error: any) => {
        console.error('Failed to start onboarding:', error);
        // Manual toast removed - useApiMutation handles API error toast automatically
      },
      onSettled: () => {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });
  };

  const handleLearningPathSubmit = async () => {
    if (state.selectedPaths.length === 0 || !state.skillLevel || !state.timeCommitment) {
      onShowMessage?.('Please complete all required fields', 'error');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));
    
    // Use React Query mutation instead of direct API call
    updateLearningPathMutation({
      selected_paths: state.selectedPaths,
      skill_level: state.skillLevel,
      time_commitment: state.timeCommitment,
      learning_goals: state.learningGoals
    }, {
      onSuccess: (response) => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Something went wrong');
        }
        
        const data = response.data;
        setState(prev => ({
          ...prev,
          currentStep: 'profile_setup',
          progress: data.progress_percentage
        }));
      },
      onError: (error: any) => {
        console.error('Failed to update learning path:', error);
        // Manual toast removed - useApiMutation handles API error toast automatically
      },
      onSettled: () => {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });
  };

  const handleProfileSetupSubmit = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Use React Query mutation instead of direct API call
    updateProfileSetupMutation({
      bio: state.bio,
      title: state.title,
      location: state.location,
      interests: state.interests,
      career_goals: state.careerGoals,
      linkedin: state.linkedin,
      github: state.github
    }, {
      onSuccess: async (response) => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Something went wrong');
        }
        
        const data = response.data;
        
        // Get course recommendations using React Query
        try {
          await fetchRecommendations();
          
          if (!recommendationsResponse?.success || !recommendationsResponse.data) {
            throw new Error(recommendationsResponse?.message || 'Something went wrong');
          }
          
          const recommendations = recommendationsResponse.data;
          
          setState(prev => ({
            ...prev,
            currentStep: 'course_recommendations',
            progress: data.progress_percentage,
            recommendations
          }));
        } catch (error: any) {
          console.error('Failed to get recommendations:', error);
          // Manual toast removed - useApiMutation handles API error toast automatically
        }
      },
      onError: (error: any) => {
        console.error('Failed to update profile setup:', error);
        // Manual toast removed - useApiMutation handles API error toast automatically
      },
      onSettled: () => {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });
  };

  const handleCompleteOnboarding = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Use React Query mutation instead of direct API call
    completeOnboardingMutation({
      selected_courses: state.selectedCourses,
      subscribe_to_newsletter: false,
      enable_notifications: true
    }, {
      onSuccess: (response) => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Something went wrong');
        }
        
        setState(prev => ({
          ...prev,
          currentStep: 'completed',
          progress: 100
        }));
        
        // Manual toast removed - useApiMutation handles API response toast automatically
        
        // Close modal after showing completion for a moment
        setTimeout(() => {
          onClose();
          onComplete?.();
        }, 2000);
      },
      onError: (error: any) => {
        console.error('Failed to complete onboarding:', error);
        // Manual toast removed - useApiMutation handles API error toast automatically
      },
      onSettled: () => {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });
  };

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
        <Sparkles className="w-10 h-10 text-primary" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-3">
          Welcome to AI E-Learning Platform! 🚀
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Let's personalize your learning journey. We'll help you find the perfect courses 
          based on your goals, skill level, and interests.
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-sm">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <CheckCircle className="w-4 h-4 text-success" />
          <span>Personalized recommendations</span>
        </div>
        <div className="flex items-center space-x-2 text-muted-foreground">
          <CheckCircle className="w-4 h-4 text-success" />
          <span>AI Study Buddy</span>
        </div>
        <div className="flex items-center space-x-2 text-muted-foreground">
          <CheckCircle className="w-4 h-4 text-success" />
          <span>Progress tracking</span>
        </div>
        <div className="flex items-center space-x-2 text-muted-foreground">
          <CheckCircle className="w-4 h-4 text-success" />
          <span>Certificates</span>
        </div>
      </div>
      
      <div className="flex space-x-3">
        <Button
          onClick={handleStartOnboarding}
          disabled={state.isLoading}
          className="flex-1"
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Let's Get Started
        </Button>
        <Button
          variant="outline"
          onClick={handleSkipOnboarding}
          disabled={state.isLoading}
        >
          Skip for now
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Takes 2-3 minutes • You can always change these later
      </p>
    </div>
  );

  const renderLearningPathStep = () => {
    const learningPaths = [
      { id: 'ml_basics', title: 'ML Basics', description: 'Python for AI, Math, Basic ML', icon: '🤖' },
      { id: 'deep_learning', title: 'Deep Learning', description: 'Neural Networks, TensorFlow, PyTorch', icon: '🧠' },
      { id: 'nlp', title: 'NLP', description: 'Language Models, Text Processing', icon: '🗣️' },
      { id: 'computer_vision', title: 'Computer Vision', description: 'Image Processing, CNNs, OpenCV', icon: '👁️' },
      { id: 'generative_ai', title: 'Generative AI', description: 'Claude, LangChain, Vector DBs', icon: '🛠️' },
      { id: 'ai_ethics', title: 'AI Ethics', description: 'Responsible AI, Bias Detection', icon: '⚖️' },
      { id: 'ai_in_business', title: 'AI in Business', description: 'MLOps, Deployment, Scaling', icon: '🚀' }
    ];

    const skillLevels = [
      { id: 'complete_beginner', title: 'Complete Beginner', description: 'New to programming' },
      { id: 'some_programming', title: 'Some Programming', description: 'Basic coding experience' },
      { id: 'experienced_developer', title: 'Experienced Developer', description: 'Years of programming' },
      { id: 'ai_familiar', title: 'AI Familiar', description: 'Some AI/ML experience' }
    ];

    const timeCommitments = [
      { id: 'casual', title: 'Casual', description: '1-3 hours/week', icon: <Clock className="w-4 h-4" /> },
      { id: 'regular', title: 'Regular', description: '4-8 hours/week', icon: <TrendingUp className="w-4 h-4" /> },
      { id: 'intensive', title: 'Intensive', description: '8+ hours/week', icon: <Target className="w-4 h-4" /> }
    ];

    return (
      <div className="space-y-6">
        <div className="text-center">
          <Target className="w-12 h-12 text-primary mx-auto mb-3" />
          <h2 className="text-xl font-bold text-foreground mb-2">Choose Your Learning Path</h2>
          <p className="text-muted-foreground">Select the areas you're most interested in learning</p>
        </div>

        {/* Learning Paths */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-3">
            Learning Paths <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {learningPaths.map((path) => (
              <button
                key={path.id}
                onClick={() => {
                  const newPaths = state.selectedPaths.includes(path.id)
                    ? state.selectedPaths.filter(p => p !== path.id)
                    : [...state.selectedPaths, path.id];
                  setState(prev => ({ ...prev, selectedPaths: newPaths }));
                }}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  state.selectedPaths.includes(path.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-border/80'
                }`}
              >
                <div className="text-lg mb-1">{path.icon}</div>
                <div className="text-sm font-medium text-foreground">{path.title}</div>
                <div className="text-xs text-muted-foreground">{path.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Skill Level */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-3">
            Current Skill Level <span className="text-destructive">*</span>
          </label>
          <div className="space-y-2">
            {skillLevels.map((level) => (
              <button
                key={level.id}
                onClick={() => setState(prev => ({ ...prev, skillLevel: level.id }))}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  state.skillLevel === level.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-border/80'
                }`}
              >
                <div className="font-medium text-foreground">{level.title}</div>
                <div className="text-sm text-muted-foreground">{level.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Time Commitment */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-3">
            Time Commitment <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {timeCommitments.map((time) => (
              <button
                key={time.id}
                onClick={() => setState(prev => ({ ...prev, timeCommitment: time.id }))}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  state.timeCommitment === time.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-border/80'
                }`}
              >
                <div className="flex justify-center mb-2">{time.icon}</div>
                <div className="text-sm font-medium text-foreground">{time.title}</div>
                <div className="text-xs text-muted-foreground">{time.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={handleLearningPathSubmit}
            disabled={state.isLoading || state.selectedPaths.length === 0 || !state.skillLevel || !state.timeCommitment}
            className="flex-1"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Continue
          </Button>
        </div>
      </div>
    );
  };

  const renderProfileSetupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <User className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-bold text-foreground mb-2">Complete Your Profile</h2>
        <p className="text-muted-foreground">Help us personalize your experience</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Job Title</label>
          <input
            type="text"
            value={state.title}
            onChange={(e) => setState(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g. Software Developer"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Location</label>
          <input
            type="text"
            value={state.location}
            onChange={(e) => setState(prev => ({ ...prev, location: e.target.value }))}
            placeholder="e.g. Ho Chi Minh City, Vietnam"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">Bio</label>
        <textarea
          value={state.bio}
          onChange={(e) => setState(prev => ({ ...prev, bio: e.target.value }))}
          placeholder="Tell us about yourself and your learning goals..."
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">LinkedIn Profile</label>
          <input
            type="url"
            value={state.linkedin}
            onChange={(e) => setState(prev => ({ ...prev, linkedin: e.target.value }))}
            placeholder="https://linkedin.com/in/username"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">GitHub Profile</label>
          <input
            type="url"
            value={state.github}
            onChange={(e) => setState(prev => ({ ...prev, github: e.target.value }))}
            placeholder="https://github.com/username"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex space-x-3">
        <Button
          variant="outline"
          onClick={() => setState(prev => ({ ...prev, currentStep: 'learning_path' }))}
          disabled={state.isLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleProfileSetupSubmit}
          disabled={state.isLoading}
          className="flex-1"
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Continue
        </Button>
      </div>
    </div>
  );

  const renderRecommendationsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <BookOpen className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-bold text-foreground mb-2">Recommended for You</h2>
        <p className="text-muted-foreground">Based on your preferences, here are some great courses to start with</p>
      </div>

      {state.recommendations && (
        <div className="space-y-4">
          <div className="grid gap-3 max-h-96 overflow-y-auto">
            {state.recommendations.recommended_courses.slice(0, 6).map((course) => (
              <div
                key={course.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  state.selectedCourses.includes(course.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-border/80'
                }`}
                onClick={() => {
                  const newSelected = state.selectedCourses.includes(course.id)
                    ? state.selectedCourses.filter(id => id !== course.id)
                    : [...state.selectedCourses, course.id];
                  setState(prev => ({ ...prev, selectedCourses: newSelected }));
                }}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <span>{course.level}</span>
                      <span>•</span>
                      <span>{course.total_lessons} lessons</span>
                      <span>•</span>
                      <span>{course.is_free ? 'Free' : `$${course.price}`}</span>
                    </div>
                    <p className="text-xs text-primary mt-1">{course.recommendation_reason}</p>
                  </div>
                  {state.selectedCourses.includes(course.id) && (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Your Learning Timeline</h4>
            <p className="text-sm text-muted-foreground">{state.recommendations.estimated_timeline}</p>
            <div className="mt-3 space-y-1">
              {state.recommendations.next_steps.slice(0, 3).map((step, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-3 h-3 text-success" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <Button
          variant="outline"
          onClick={() => setState(prev => ({ ...prev, currentStep: 'profile_setup' }))}
          disabled={state.isLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleCompleteOnboarding}
          disabled={state.isLoading}
          className="flex-1"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Complete Setup
        </Button>
      </div>
    </div>
  );

  const renderCompletedStep = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-10 h-10 text-success" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-3">
          Welcome to the Platform! 🎉
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your learning journey is ready to begin. Start with your recommended courses
          and don't forget to use the AI Study Buddy for help along the way.
        </p>
      </div>
      
      <div className="bg-primary/10 rounded-lg p-4">
        <h3 className="font-medium text-primary mb-2">What's Next?</h3>
        <ul className="text-sm text-primary space-y-1">
          <li>• Start your first recommended course</li>
          <li>• Set up your learning schedule</li>
          <li>• Join the community discussions</li>
          <li>• Track your progress daily</li>
        </ul>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'learning_path':
        return renderLearningPathStep();
      case 'profile_setup':
        return renderProfileSetupStep();
      case 'course_recommendations':
        return renderRecommendationsStep();
      case 'completed':
        return renderCompletedStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="lg"
    >
      <div className="space-y-6">
        {/* Header with Progress */}
        {state.currentStep !== 'welcome' && state.currentStep !== 'completed' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-foreground">Setup Your Account</h1>
              <button
                onClick={handleSkipOnboarding}
                disabled={state.isLoading}
                className="text-sm text-muted-foreground hover:text-muted-foreground"
              >
                Skip
              </button>
            </div>
            <ProgressBar value={state.progress} className="h-2" />
            <p className="text-sm text-muted-foreground">Step {getStepNumber(state.currentStep)} of 3</p>
          </div>
        )}

        {/* Content */}
        <div className="min-h-[400px]">
          {renderCurrentStep()}
        </div>
      </div>
    </Modal>
  );
};

function getStepNumber(step: OnboardingStep): number {
  switch (step) {
    case 'learning_path': return 1;
    case 'profile_setup': return 2;
    case 'course_recommendations': return 3;
    default: return 1;
  }
}