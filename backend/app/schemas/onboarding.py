"""
Onboarding schemas for user onboarding flow.
Following PRD specifications and StandardResponse patterns.
"""
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.user import OnboardingStep, LearningPath, SkillLevel, TimeCommitment


class OnboardingStatusResponse(BaseModel):
    """Current onboarding status for a user."""
    is_completed: bool
    current_step: OnboardingStep
    skipped: bool
    completed_at: Optional[str] = None
    steps_completed: List[OnboardingStep]
    progress_percentage: float


class OnboardingWelcomeRequest(BaseModel):
    """Start onboarding process."""
    skip_onboarding: bool = False


class OnboardingLearningPathRequest(BaseModel):
    """Learning path selection step."""
    selected_paths: List[LearningPath]
    skill_level: SkillLevel
    time_commitment: TimeCommitment
    learning_goals: List[str] = Field(default_factory=list)


class OnboardingProfileSetupRequest(BaseModel):
    """Profile setup step."""
    bio: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    interests: List[str] = Field(default_factory=list)
    career_goals: List[str] = Field(default_factory=list)
    linkedin: Optional[str] = None
    github: Optional[str] = None


class CourseRecommendation(BaseModel):
    """Course recommendation for onboarding."""
    id: str
    title: str
    description: str
    category: str
    level: str
    duration: int  # in minutes
    thumbnail: Optional[str] = None
    is_free: bool
    price: float
    rating: float
    total_lessons: int
    recommendation_reason: str


class OnboardingRecommendationsResponse(BaseModel):
    """Course recommendations based on onboarding preferences."""
    recommended_courses: List[CourseRecommendation]
    learning_paths: List[dict]
    next_steps: List[str]
    estimated_timeline: str


class OnboardingCompletionRequest(BaseModel):
    """Complete onboarding process."""
    selected_courses: List[str] = Field(default_factory=list)  # Course IDs to enroll in
    subscribe_to_newsletter: bool = False
    enable_notifications: bool = True


class OnboardingStepRequest(BaseModel):
    """Generic step update request."""
    step: OnboardingStep
    data: dict = Field(default_factory=dict)


class OnboardingStepResponse(BaseModel):
    """Response for step completion."""
    current_step: OnboardingStep
    next_step: Optional[OnboardingStep]
    progress_percentage: float
    is_completed: bool
    message: str


class PlatformTourStep(BaseModel):
    """Platform tour step information."""
    id: str
    title: str
    description: str
    target_element: str
    position: str
    action_required: bool = False


class OnboardingPlatformTourResponse(BaseModel):
    """Platform tour configuration."""
    steps: List[PlatformTourStep]
    total_steps: int
    estimated_duration: int  # in minutes