"""
Onboarding endpoints for user onboarding flow.
Following PRD specifications and StandardResponse patterns.
All errors return "Operation Failed" to users as per memory guidelines.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.deps import get_current_user
from app.models.user import User
from app.services.onboarding_service import OnboardingService
from app.schemas.base import StandardResponse
from app.schemas.onboarding import (
    OnboardingStatusResponse,
    OnboardingWelcomeRequest,
    OnboardingLearningPathRequest,
    OnboardingProfileSetupRequest,
    OnboardingRecommendationsResponse,
    OnboardingCompletionRequest,
    OnboardingStepResponse,
    OnboardingPlatformTourResponse
)
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/status", response_model=StandardResponse[OnboardingStatusResponse])
async def get_onboarding_status(
    current_user: User = Depends(get_current_user)
):
    """
    Get current onboarding status for the user.
    
    Returns onboarding progress, current step, and completion status.
    """
    try:
        progress_percentage = OnboardingService.calculate_progress_percentage(current_user)
        
        status_data = OnboardingStatusResponse(
            is_completed=current_user.onboarding.is_completed,
            current_step=current_user.onboarding.current_step,
            skipped=current_user.onboarding.skipped,
            completed_at=current_user.onboarding.completed_at.strftime("%Y-%m-%d %H:%M:%S") if current_user.onboarding.completed_at else None,
            steps_completed=current_user.onboarding.steps_completed,
            progress_percentage=progress_percentage
        )
        
        return StandardResponse(
            success=True,
            data=status_data,
            message="Onboarding status retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Error getting onboarding status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Operation Failed"
        )


@router.post("/start", response_model=StandardResponse[OnboardingStepResponse])
async def start_onboarding(
    request: OnboardingWelcomeRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Start the onboarding process or skip it entirely.
    
    If skip_onboarding is True, marks onboarding as completed.
    Otherwise, initializes the onboarding flow.
    """
    try:
        if request.skip_onboarding:
            # Skip onboarding entirely
            updated_user = await OnboardingService.skip_onboarding(current_user)
            
            return StandardResponse(
                success=True,
                data=OnboardingStepResponse(
                    current_step=updated_user.onboarding.current_step,
                    next_step=None,
                    progress_percentage=100.0,
                    is_completed=True,
                    message="Onboarding skipped successfully"
                ),
                message="Welcome! You can start learning immediately."
            )
        else:
            # Start onboarding process
            updated_user = await OnboardingService.start_onboarding(current_user)
            
            return StandardResponse(
                success=True,
                data=OnboardingStepResponse(
                    current_step=updated_user.onboarding.current_step,
                    next_step="learning_path",
                    progress_percentage=OnboardingService.calculate_progress_percentage(updated_user),
                    is_completed=False,
                    message="Let's set up your learning journey!"
                ),
                message="Onboarding started successfully"
            )
    except Exception as e:
        logger.error(f"Error starting onboarding: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Operation Failed"
        )


@router.post("/learning-path", response_model=StandardResponse[OnboardingStepResponse])
async def update_learning_path(
    request: OnboardingLearningPathRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Update user's learning path preferences.
    
    Saves selected learning paths, skill level, time commitment, and goals.
    Advances to profile setup step.
    """
    try:
        updated_user = await OnboardingService.update_learning_path(
            user=current_user,
            selected_paths=request.selected_paths,
            skill_level=request.skill_level,
            time_commitment=request.time_commitment,
            learning_goals=request.learning_goals
        )
        
        return StandardResponse(
            success=True,
            data=OnboardingStepResponse(
                current_step=updated_user.onboarding.current_step,
                next_step="profile_setup",
                progress_percentage=OnboardingService.calculate_progress_percentage(updated_user),
                is_completed=False,
                message="Great! Now let's set up your profile."
            ),
            message="Learning path preferences saved successfully"
        )
    except Exception as e:
        logger.error(f"Error updating learning path: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Operation Failed"
        )


@router.post("/profile-setup", response_model=StandardResponse[OnboardingStepResponse])
async def update_profile_setup(
    request: OnboardingProfileSetupRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Update user profile during onboarding.
    
    Saves profile information and advances to course recommendations.
    """
    try:
        updated_user = await OnboardingService.update_profile_setup(
            user=current_user,
            bio=request.bio,
            title=request.title,
            location=request.location,
            interests=request.interests,
            career_goals=request.career_goals,
            linkedin=request.linkedin,
            github=request.github
        )
        
        return StandardResponse(
            success=True,
            data=OnboardingStepResponse(
                current_step=updated_user.onboarding.current_step,
                next_step="course_recommendations",
                progress_percentage=OnboardingService.calculate_progress_percentage(updated_user),
                is_completed=False,
                message="Perfect! Let's find courses for you."
            ),
            message="Profile setup completed successfully"
        )
    except Exception as e:
        logger.error(f"Error updating profile setup: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Operation Failed"
        )


@router.get("/recommendations", response_model=StandardResponse[OnboardingRecommendationsResponse])
async def get_course_recommendations(
    current_user: User = Depends(get_current_user)
):
    """
    Get personalized course recommendations based on onboarding preferences.
    
    Returns recommended courses, learning paths, and next steps.
    """
    try:
        recommendations = await OnboardingService.generate_course_recommendations(current_user)
        
        return StandardResponse(
            success=True,
            data=recommendations,
            message="Course recommendations generated successfully"
        )
    except Exception as e:
        logger.error(f"Error getting course recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Operation Failed"
        )


@router.post("/complete", response_model=StandardResponse[OnboardingStepResponse])
async def complete_onboarding(
    request: OnboardingCompletionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Complete the onboarding process.
    
    Enrolls user in selected courses and marks onboarding as finished.
    """
    try:
        # Update user preferences from completion request
        if hasattr(request, 'subscribe_to_newsletter'):
            current_user.preferences.marketing_emails = request.subscribe_to_newsletter
        if hasattr(request, 'enable_notifications'):
            current_user.preferences.email_notifications = request.enable_notifications
        
        updated_user = await OnboardingService.complete_onboarding(
            user=current_user,
            selected_courses=request.selected_courses
        )
        
        return StandardResponse(
            success=True,
            data=OnboardingStepResponse(
                current_step=updated_user.onboarding.current_step,
                next_step=None,
                progress_percentage=100.0,
                is_completed=True,
                message="Welcome to the platform! Start learning now."
            ),
            message="Onboarding completed successfully"
        )
    except Exception as e:
        logger.error(f"Error completing onboarding: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Operation Failed"
        )


@router.get("/platform-tour", response_model=StandardResponse[OnboardingPlatformTourResponse])
async def get_platform_tour(
    current_user: User = Depends(get_current_user)
):
    """
    Get platform tour steps configuration.
    
    Returns interactive tour steps for the UI to display.
    """
    try:
        tour_config = OnboardingService.get_platform_tour_steps()
        
        return StandardResponse(
            success=True,
            data=tour_config,
            message="Platform tour configuration retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Error getting platform tour: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Operation Failed"
        )


@router.post("/skip", response_model=StandardResponse[OnboardingStepResponse])
async def skip_onboarding(
    current_user: User = Depends(get_current_user)
):
    """
    Skip the entire onboarding process.
    
    Marks onboarding as skipped and completed.
    """
    try:
        updated_user = await OnboardingService.skip_onboarding(current_user)
        
        return StandardResponse(
            success=True,
            data=OnboardingStepResponse(
                current_step=updated_user.onboarding.current_step,
                next_step=None,
                progress_percentage=100.0,
                is_completed=True,
                message="You can always access onboarding from your profile settings."
            ),
            message="Onboarding skipped successfully"
        )
    except Exception as e:
        logger.error(f"Error skipping onboarding: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Operation Failed"
        )