"""
Onboarding service for user onboarding flow.
Following PRD specifications and memory guidelines.
"""
from typing import List, Dict, Optional
from datetime import datetime
from app.models.user import User, OnboardingStep, LearningPath, SkillLevel, TimeCommitment
from app.models.course import Course
from app.schemas.onboarding import (
    CourseRecommendation, 
    OnboardingRecommendationsResponse,
    PlatformTourStep,
    OnboardingPlatformTourResponse
)
import logging

logger = logging.getLogger(__name__)


class OnboardingService:
    """Service for handling user onboarding workflow."""
    
    @staticmethod
    async def start_onboarding(user: User) -> User:
        """Initialize onboarding for a new user."""
        if not user.onboarding.started_at:
            user.onboarding.started_at = datetime.utcnow()
            user.onboarding.current_step = OnboardingStep.WELCOME
            user.updated_at = datetime.utcnow()
            await user.save()
        
        return user
    
    @staticmethod
    async def skip_onboarding(user: User) -> User:
        """Allow user to skip onboarding process."""
        user.onboarding.skipped = True
        user.onboarding.is_completed = True
        user.onboarding.current_step = OnboardingStep.COMPLETED
        user.onboarding.completed_at = datetime.utcnow()
        user.updated_at = datetime.utcnow()
        await user.save()
        
        return user
    
    @staticmethod
    async def update_learning_path(
        user: User,
        selected_paths: List[LearningPath],
        skill_level: SkillLevel,
        time_commitment: TimeCommitment,
        learning_goals: List[str]
    ) -> User:
        """Update user's learning path preferences."""
        user.onboarding.selected_paths = selected_paths
        user.onboarding.skill_level = skill_level
        user.onboarding.time_commitment = time_commitment
        user.onboarding.learning_goals = learning_goals
        
        # Update current step progress
        if OnboardingStep.LEARNING_PATH not in user.onboarding.steps_completed:
            user.onboarding.steps_completed.append(OnboardingStep.LEARNING_PATH)
        
        user.onboarding.current_step = OnboardingStep.PROFILE_SETUP
        user.updated_at = datetime.utcnow()
        await user.save()
        
        return user
    
    @staticmethod
    async def update_profile_setup(
        user: User,
        bio: Optional[str],
        title: Optional[str],
        location: Optional[str],
        interests: List[str],
        career_goals: List[str],
        linkedin: Optional[str] = None,
        github: Optional[str] = None
    ) -> User:
        """Update user profile during onboarding."""
        # Update profile fields
        if bio:
            user.profile.bio = bio
        if title:
            user.profile.title = title
        if location:
            user.profile.location = location
        if linkedin:
            user.profile.linkedin = linkedin
        if github:
            user.profile.github = github
        
        # Update onboarding specific fields
        user.onboarding.interests = interests
        user.onboarding.career_goals = career_goals
        
        # Update step progress
        if OnboardingStep.PROFILE_SETUP not in user.onboarding.steps_completed:
            user.onboarding.steps_completed.append(OnboardingStep.PROFILE_SETUP)
        
        user.onboarding.current_step = OnboardingStep.COURSE_RECOMMENDATIONS
        user.updated_at = datetime.utcnow()
        await user.save()
        
        return user
    
    @staticmethod
    async def generate_course_recommendations(user: User) -> OnboardingRecommendationsResponse:
        """Generate personalized course recommendations based on onboarding data."""
        try:
            # Get user preferences
            selected_paths = user.onboarding.selected_paths
            skill_level = user.onboarding.skill_level
            interests = user.onboarding.interests
            
            # Build course query based on preferences
            course_query = {"status": "published"}
            
            # Add category filter based on learning paths
            if selected_paths:
                categories = []
                for path in selected_paths:
                    if path == LearningPath.PROGRAMMING_BASICS:
                        categories.append("programming")
                    elif path == LearningPath.AI_FUNDAMENTALS:
                        categories.append("ai-fundamentals")
                    elif path == LearningPath.MACHINE_LEARNING:
                        categories.append("machine-learning")
                    elif path == LearningPath.AI_TOOLS:
                        categories.append("ai-tools")
                    elif path == LearningPath.PRODUCTION_AI:
                        categories.append("production-ai")
                
                if categories:
                    course_query["category"] = {"$in": categories}
            
            # Add level filter based on skill level
            if skill_level:
                if skill_level in [SkillLevel.COMPLETE_BEGINNER, SkillLevel.SOME_PROGRAMMING]:
                    course_query["level"] = {"$in": ["beginner", "intermediate"]}
                elif skill_level == SkillLevel.EXPERIENCED_DEVELOPER:
                    course_query["level"] = {"$in": ["intermediate", "advanced"]}
                elif skill_level == SkillLevel.AI_FAMILIAR:
                    course_query["level"] = {"$in": ["intermediate", "advanced"]}
            
            # Fetch recommended courses
            courses = await Course.find(course_query).limit(8).to_list()
            
            # Convert to recommendation objects
            recommended_courses = []
            for course in courses:
                # Generate recommendation reason
                reason = OnboardingService._generate_recommendation_reason(
                    course, user.onboarding.skill_level, user.onboarding.selected_paths
                )
                
                recommendation = CourseRecommendation(
                    id=str(course.id),
                    title=course.title,
                    description=course.description[:200] + "..." if len(course.description) > 200 else course.description,
                    category=course.category,
                    level=course.level,
                    duration=course.total_duration or 0,
                    thumbnail=course.thumbnail,
                    is_free=course.pricing.is_free,
                    price=course.pricing.price,
                    rating=course.stats.average_rating or 0,
                    total_lessons=course.total_lessons,
                    recommendation_reason=reason
                )
                recommended_courses.append(recommendation)
            
            # Generate learning paths
            learning_paths = OnboardingService._generate_learning_paths(user.onboarding.selected_paths)
            
            # Generate next steps
            next_steps = OnboardingService._generate_next_steps(
                user.onboarding.skill_level,
                user.onboarding.time_commitment,
                user.onboarding.selected_paths
            )
            
            # Estimate timeline
            estimated_timeline = OnboardingService._estimate_timeline(
                user.onboarding.time_commitment,
                len(recommended_courses)
            )
            
            return OnboardingRecommendationsResponse(
                recommended_courses=recommended_courses,
                learning_paths=learning_paths,
                next_steps=next_steps,
                estimated_timeline=estimated_timeline
            )
            
        except Exception as e:
            logger.error(f"Error generating course recommendations: {str(e)}")
            # Return fallback recommendations
            return OnboardingRecommendationsResponse(
                recommended_courses=[],
                learning_paths=[],
                next_steps=["Start with beginner courses", "Practice coding daily", "Join the community"],
                estimated_timeline="3-6 months"
            )
    
    @staticmethod
    def _generate_recommendation_reason(course, skill_level: SkillLevel, selected_paths: List[LearningPath]) -> str:
        """Generate personalized recommendation reason."""
        reasons = []
        
        if skill_level == SkillLevel.COMPLETE_BEGINNER and course.level == "beginner":
            reasons.append("Perfect for complete beginners")
        elif skill_level == SkillLevel.AI_FAMILIAR and course.category == "ml-basics":
            reasons.append("Builds on your AI knowledge")
        
        if course.pricing.is_free:
            reasons.append("Free to get started")
        
        if course.stats.average_rating > 4.0:
            reasons.append("Highly rated by students")
        
        return " • ".join(reasons) if reasons else "Recommended based on your preferences"
    
    @staticmethod
    def _generate_learning_paths(selected_paths: List[LearningPath]) -> List[dict]:
        """Generate learning path recommendations."""
        paths = []
        
        for path in selected_paths:
            if path == LearningPath.PROGRAMMING_BASICS:
                paths.append({
                    "title": "Programming Foundations",
                    "description": "Start with HTML, CSS, JavaScript, and Python basics",
                    "duration": "2-3 months",
                    "courses_count": 4
                })
            elif path == LearningPath.AI_FUNDAMENTALS:
                paths.append({
                    "title": "AI & Machine Learning Basics",
                    "description": "Learn Python for AI, mathematics, and basic ML algorithms",
                    "duration": "3-4 months",
                    "courses_count": 6
                })
            elif path == LearningPath.MACHINE_LEARNING:
                paths.append({
                    "title": "Advanced Machine Learning",
                    "description": "Deep learning, TensorFlow, computer vision, and NLP",
                    "duration": "4-6 months",
                    "courses_count": 8
                })
        
        return paths
    
    @staticmethod
    def _generate_next_steps(
        skill_level: SkillLevel,
        time_commitment: TimeCommitment,
        selected_paths: List[LearningPath]
    ) -> List[str]:
        """Generate personalized next steps."""
        steps = []
        
        if skill_level == SkillLevel.COMPLETE_BEGINNER:
            steps.append("Start with programming basics course")
            steps.append("Practice coding 30 minutes daily")
        else:
            steps.append("Begin with your chosen learning path")
            steps.append("Set up your development environment")
        
        if time_commitment == TimeCommitment.INTENSIVE:
            steps.append("Consider enrolling in multiple courses")
            steps.append("Join study groups and coding communities")
        else:
            steps.append("Focus on one course at a time")
            steps.append("Set realistic weekly learning goals")
        
        steps.append("Complete your first course within 30 days")
        steps.append("Earn your first certificate")
        
        return steps
    
    @staticmethod
    def _estimate_timeline(time_commitment: TimeCommitment, course_count: int) -> str:
        """Estimate learning timeline based on commitment level."""
        if time_commitment == TimeCommitment.CASUAL:
            return f"{course_count * 2}-{course_count * 3} months"
        elif time_commitment == TimeCommitment.REGULAR:
            return f"{course_count}-{course_count * 2} months"
        else:  # INTENSIVE
            return f"{int(course_count * 0.5)}-{course_count} months"
    
    @staticmethod
    async def complete_onboarding(user: User, selected_courses: List[str]) -> User:
        """Complete onboarding process and enroll in selected courses."""
        # Mark onboarding as completed
        user.onboarding.is_completed = True
        user.onboarding.current_step = OnboardingStep.COMPLETED
        user.onboarding.completed_at = datetime.utcnow()
        
        # Add remaining steps to completed
        for step in [OnboardingStep.COURSE_RECOMMENDATIONS, OnboardingStep.PLATFORM_TOUR]:
            if step not in user.onboarding.steps_completed:
                user.onboarding.steps_completed.append(step)
        
        user.updated_at = datetime.utcnow()
        await user.save()
        
        # TODO: Enroll user in selected courses (integrate with enrollment service)
        
        return user
    
    @staticmethod
    def get_platform_tour_steps() -> OnboardingPlatformTourResponse:
        """Get platform tour steps configuration."""
        steps = [
            PlatformTourStep(
                id="dashboard",
                title="Welcome to Your Dashboard",
                description="This is your learning command center. Track progress, see upcoming lessons, and manage your courses.",
                target_element="[data-tour='dashboard']",
                position="bottom"
            ),
            PlatformTourStep(
                id="courses",
                title="Browse Courses",
                description="Discover new courses in AI, programming, and machine learning. Filter by level and category.",
                target_element="[data-tour='courses-nav']",
                position="bottom"
            ),
            PlatformTourStep(
                id="ai-assistant",
                title="Meet Your AI Study Buddy",
                description="Get help anytime with our AI assistant. Ask questions about courses, concepts, or coding problems.",
                target_element="[data-tour='ai-assistant']",
                position="left"
            ),
            PlatformTourStep(
                id="progress",
                title="Track Your Progress",
                description="Monitor your learning journey with detailed progress tracking and achievement badges.",
                target_element="[data-tour='progress']",
                position="top"
            ),
            PlatformTourStep(
                id="certificates",
                title="Earn Certificates",
                description="Complete courses to earn shareable certificates for your LinkedIn profile and portfolio.",
                target_element="[data-tour='certificates']",
                position="top"
            )
        ]
        
        return OnboardingPlatformTourResponse(
            steps=steps,
            total_steps=len(steps),
            estimated_duration=3
        )
    
    @staticmethod
    def calculate_progress_percentage(user: User) -> float:
        """Calculate onboarding progress percentage."""
        if user.onboarding.is_completed or user.onboarding.skipped:
            return 100.0
        
        total_steps = len(OnboardingStep) - 1  # Exclude COMPLETED step
        completed_steps = len(user.onboarding.steps_completed)
        
        return (completed_steps / total_steps) * 100