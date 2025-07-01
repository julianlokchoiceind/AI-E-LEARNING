'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { 
  getOnboardingStatus, 
  startOnboarding, 
  updateLearningPath, 
  updateProfileSetup, 
  getCourseRecommendations,
  completeOnboarding,
  skipOnboarding,
  OnboardingStatus,
  OnboardingRecommendations
} from '@/lib/api/onboarding';
import { toast } from 'react-hot-toast';
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
  onComplete
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

  // Check onboarding status when modal opens
  useEffect(() => {
    if (isOpen) {
      checkOnboardingStatus();
    }
  }, [isOpen]);

  const checkOnboardingStatus = async () => {
    try {
      const status = await getOnboardingStatus();
      if (status.is_completed || status.skipped) {
        onClose();
        return;
      }
      
      setState(prev => ({
        ...prev,
        currentStep: status.current_step as OnboardingStep,
        progress: status.progress_percentage
      }));
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    }
  };

  const handleSkipOnboarding = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await skipOnboarding();
      toast.success('You can always complete onboarding from your profile settings');
      onClose();
      onComplete?.();
    } catch (error) {
      toast.error('Operation Failed');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleStartOnboarding = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await startOnboarding(false);
      setState(prev => ({
        ...prev,
        currentStep: 'learning_path',
        progress: response.progress_percentage
      }));
    } catch (error) {
      toast.error('Operation Failed');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleLearningPathSubmit = async () => {
    if (state.selectedPaths.length === 0 || !state.skillLevel || !state.timeCommitment) {
      toast.error('Please complete all required fields');
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await updateLearningPath({
        selected_paths: state.selectedPaths,
        skill_level: state.skillLevel,
        time_commitment: state.timeCommitment,
        learning_goals: state.learningGoals
      });
      
      setState(prev => ({
        ...prev,
        currentStep: 'profile_setup',
        progress: response.progress_percentage
      }));
    } catch (error) {
      toast.error('Operation Failed');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleProfileSetupSubmit = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await updateProfileSetup({
        bio: state.bio,
        title: state.title,
        location: state.location,
        interests: state.interests,
        career_goals: state.careerGoals,
        linkedin: state.linkedin,
        github: state.github
      });
      
      // Get course recommendations
      const recommendations = await getCourseRecommendations();
      
      setState(prev => ({
        ...prev,
        currentStep: 'course_recommendations',
        progress: response.progress_percentage,
        recommendations
      }));
    } catch (error) {
      toast.error('Operation Failed');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await completeOnboarding({
        selected_courses: state.selectedCourses,
        subscribe_to_newsletter: false,
        enable_notifications: true
      });
      
      setState(prev => ({
        ...prev,
        currentStep: 'completed',
        progress: 100
      }));
      
      toast.success('Welcome to the platform! Start learning now.');
      
      // Close modal after showing completion for a moment
      setTimeout(() => {
        onClose();
        onComplete?.();
      }, 2000);
    } catch (error) {
      toast.error('Operation Failed');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
        <Sparkles className="w-10 h-10 text-blue-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Welcome to AI E-Learning Platform! 🚀
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Let's personalize your learning journey. We'll help you find the perfect courses 
          based on your goals, skill level, and interests.
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-sm">
        <div className="flex items-center space-x-2 text-gray-600">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Personalized recommendations</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>AI Study Buddy</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Progress tracking</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <CheckCircle className="w-4 h-4 text-green-500" />
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
      
      <p className="text-xs text-gray-500">
        Takes 2-3 minutes • You can always change these later
      </p>
    </div>
  );

  const renderLearningPathStep = () => {
    const learningPaths = [
      { id: 'programming_basics', title: 'Programming Basics', description: 'HTML, CSS, JavaScript, Python', icon: '💻' },
      { id: 'ai_fundamentals', title: 'AI Fundamentals', description: 'Python for AI, Math, Basic ML', icon: '🤖' },
      { id: 'machine_learning', title: 'Machine Learning', description: 'Deep Learning, TensorFlow, PyTorch', icon: '🧠' },
      { id: 'ai_tools', title: 'AI Tools', description: 'Claude, LangChain, Vector DBs', icon: '🛠️' },
      { id: 'production_ai', title: 'Production AI', description: 'MLOps, Deployment, Scaling', icon: '🚀' },
      { id: 'full_stack', title: 'Full Stack', description: 'End-to-end development', icon: '📱' }
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
          <Target className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Choose Your Learning Path</h2>
          <p className="text-gray-600">Select the areas you're most interested in learning</p>
        </div>

        {/* Learning Paths */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Learning Paths <span className="text-red-500">*</span>
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
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-lg mb-1">{path.icon}</div>
                <div className="text-sm font-medium text-gray-900">{path.title}</div>
                <div className="text-xs text-gray-500">{path.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Skill Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Current Skill Level <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {skillLevels.map((level) => (
              <button
                key={level.id}
                onClick={() => setState(prev => ({ ...prev, skillLevel: level.id }))}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  state.skillLevel === level.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{level.title}</div>
                <div className="text-sm text-gray-500">{level.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Time Commitment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Time Commitment <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {timeCommitments.map((time) => (
              <button
                key={time.id}
                onClick={() => setState(prev => ({ ...prev, timeCommitment: time.id }))}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  state.timeCommitment === time.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-center mb-2">{time.icon}</div>
                <div className="text-sm font-medium text-gray-900">{time.title}</div>
                <div className="text-xs text-gray-500">{time.description}</div>
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
        <User className="w-12 h-12 text-blue-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
        <p className="text-gray-600">Help us personalize your experience</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
          <input
            type="text"
            value={state.title}
            onChange={(e) => setState(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g. Software Developer"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <input
            type="text"
            value={state.location}
            onChange={(e) => setState(prev => ({ ...prev, location: e.target.value }))}
            placeholder="e.g. Ho Chi Minh City, Vietnam"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
        <textarea
          value={state.bio}
          onChange={(e) => setState(prev => ({ ...prev, bio: e.target.value }))}
          placeholder="Tell us about yourself and your learning goals..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
          <input
            type="url"
            value={state.linkedin}
            onChange={(e) => setState(prev => ({ ...prev, linkedin: e.target.value }))}
            placeholder="https://linkedin.com/in/username"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">GitHub Profile</label>
          <input
            type="url"
            value={state.github}
            onChange={(e) => setState(prev => ({ ...prev, github: e.target.value }))}
            placeholder="https://github.com/username"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Recommended for You</h2>
        <p className="text-gray-600">Based on your preferences, here are some great courses to start with</p>
      </div>

      {state.recommendations && (
        <div className="space-y-4">
          <div className="grid gap-3 max-h-96 overflow-y-auto">
            {state.recommendations.recommended_courses.slice(0, 6).map((course) => (
              <div
                key={course.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  state.selectedCourses.includes(course.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
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
                    <h3 className="font-medium text-gray-900">{course.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>{course.level}</span>
                      <span>•</span>
                      <span>{course.total_lessons} lessons</span>
                      <span>•</span>
                      <span>{course.is_free ? 'Free' : `$${course.price}`}</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">{course.recommendation_reason}</p>
                  </div>
                  {state.selectedCourses.includes(course.id) && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Your Learning Timeline</h4>
            <p className="text-sm text-gray-600">{state.recommendations.estimated_timeline}</p>
            <div className="mt-3 space-y-1">
              {state.recommendations.next_steps.slice(0, 3).map((step, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="w-3 h-3 text-green-500" />
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
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Welcome to the Platform! 🎉
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Your learning journey is ready to begin. Start with your recommended courses
          and don't forget to use the AI Study Buddy for help along the way.
        </p>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">What's Next?</h3>
        <ul className="text-sm text-blue-800 space-y-1">
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
      hideCloseButton={state.currentStep === 'completed'}
    >
      <div className="space-y-6">
        {/* Header with Progress */}
        {state.currentStep !== 'welcome' && state.currentStep !== 'completed' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900">Setup Your Account</h1>
              <button
                onClick={handleSkipOnboarding}
                disabled={state.isLoading}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Skip
              </button>
            </div>
            <ProgressBar value={state.progress} className="h-2" />
            <p className="text-sm text-gray-500">Step {getStepNumber(state.currentStep)} of 3</p>
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