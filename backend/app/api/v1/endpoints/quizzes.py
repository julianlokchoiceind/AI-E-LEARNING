"""
Quiz endpoints for managing lesson assessments.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from beanie import PydanticObjectId

from app.models.user import User
from app.schemas.quiz import QuizCreate, QuizUpdate, QuizAnswerSubmit, QuizProgressSave
from app.schemas.base import StandardResponse
from app.core.deps import get_current_user, get_current_optional_user
from app.services.quiz_service import QuizService
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError

router = APIRouter()


@router.post("/", response_model=StandardResponse[dict], status_code=status.HTTP_201_CREATED)
async def create_quiz(
    quiz_data: QuizCreate,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Create a new quiz for a lesson.
    
    - **lesson_id**: The lesson this quiz belongs to
    - **course_id**: The course ID for easier querying
    - **questions**: List of multiple choice questions
    - **config**: Quiz configuration settings
    
    Only content creators and admins can create quizzes.
    """
    # Check permissions
    if current_user.role not in ["creator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content creators and admins can create quizzes"
        )
    
    try:
        quiz = await QuizService.create_quiz(quiz_data, current_user.id)
        # Convert to dict with string IDs
        quiz_dict = {
            "id": str(quiz.id),
            "lesson_id": str(quiz.lesson_id),
            "course_id": str(quiz.course_id),
            "title": quiz.title,
            "description": quiz.description,
            "config": quiz.config,
            "questions": quiz.questions,
            "total_points": quiz.total_points,
            "created_at": quiz.created_at,
            "updated_at": quiz.updated_at
        }
        return StandardResponse(
            success=True,
            data=quiz_dict,
            message="Quiz created successfully"
        )
    except (NotFoundError, BadRequestError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/lesson/{lesson_id}", response_model=StandardResponse[dict])
async def get_lesson_quiz(
    lesson_id: PydanticObjectId,
    preview: bool = Query(False, description="Preview mode flag"),
    current_user: Optional[User] = Depends(get_current_optional_user)
) -> StandardResponse[dict]:
    """
    Get quiz for a specific lesson.
    
    Returns quiz questions without correct answers for students.
    For preview mode, returns quiz structure without requiring authentication.
    """
    from app.models.quiz import Quiz
    
    # Find quiz for lesson - lesson_id in DB is ObjectId, need to match with ObjectId
    quiz = await Quiz.find_one(Quiz.lesson_id == lesson_id)
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No quiz found for this lesson"
        )
    
    # Preview mode: return basic quiz structure without progress
    if preview:
        return StandardResponse(
            success=True,
            data={
                "id": str(quiz.id),
                "title": quiz.title,
                "description": quiz.description,
                "questions": [
                    {
                        "question": q.question,
                        "options": q.options,
                        "type": q.type,
                        "points": q.points
                    } for q in quiz.questions
                ],
                "config": quiz.config,
                "total_points": quiz.total_points,
                "preview_mode": True
            },
            message="Quiz retrieved successfully (preview mode)"
        )
    
    # Normal mode: require authentication
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    try:
        quiz_response, progress_response = await QuizService.get_quiz_for_student(
            quiz.id, current_user.id
        )
        # Merge simplified progress into quiz response (Smart Backend)
        quiz_response["is_completed"] = progress_response["is_completed"]
        quiz_response["score"] = progress_response["score"]
        quiz_response["answers"] = progress_response["answers"]
        quiz_response["passed"] = progress_response["passed"]
        quiz_response["completed_at"] = progress_response["completed_at"]
        
        return StandardResponse(
            success=True,
            data=quiz_response,
            message="Quiz retrieved successfully"
        )
    except ForbiddenError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/{quiz_id}", response_model=StandardResponse[dict])
async def get_quiz(
    quiz_id: PydanticObjectId,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Get a specific quiz.
    
    Returns quiz questions without correct answers for students.
    For admin/creator, returns raw quiz data for editing.
    """
    from app.models.quiz import Quiz
    
    # Admin/Creator: Get raw quiz without shuffling for editing
    if current_user.role in ["admin", "creator"]:
        quiz = await Quiz.find_one(Quiz.id == quiz_id)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found"
            )
        
        # Return raw data for editing
        return StandardResponse(
            success=True,
            data={
                "id": str(quiz.id),
                "lesson_id": str(quiz.lesson_id),
                "course_id": str(quiz.course_id),
                "title": quiz.title,
                "description": quiz.description,
                "config": quiz.config.dict() if hasattr(quiz.config, 'dict') else quiz.config,
                "questions": [q.dict() if hasattr(q, 'dict') else q for q in quiz.questions],
                "total_points": quiz.total_points
            },
            message="Quiz retrieved for editing"
        )
    
    # Students: Apply shuffling and hide answers
    try:
        quiz_response, _ = await QuizService.get_quiz_for_student(
            quiz_id, current_user.id
        )
        return StandardResponse(
            success=True,
            data=quiz_response,
            message="Quiz retrieved successfully"
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ForbiddenError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )




@router.post("/{quiz_id}/save-progress", response_model=StandardResponse[dict])
async def save_quiz_progress(
    quiz_id: PydanticObjectId,
    progress_data: QuizProgressSave,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Save quiz progress for auto-save functionality.
    
    - **saved_answers**: Current answers (may include -1 for unanswered)
    - **current_question_index**: Current question index
    
    Enables cross-device resume capability.
    """
    try:
        progress = await QuizService.save_quiz_progress(
            quiz_id, current_user.id, progress_data
        )
        return StandardResponse(
            success=True,
            data={"saved": True, "last_saved_at": progress.last_saved_at},
            message="Progress saved successfully"
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/{quiz_id}/progress", response_model=StandardResponse[dict])
async def get_quiz_progress(
    quiz_id: PydanticObjectId,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Get saved quiz progress for auto-resume functionality.
    
    Returns saved progress if quiz is in progress, otherwise returns no progress.
    Enables seamless cross-device quiz resumption.
    """
    try:
        progress = await QuizService.get_saved_quiz_progress(quiz_id, current_user.id)
        return StandardResponse(
            success=True,
            data=progress or {"has_saved_progress": False},
            message="Progress retrieved successfully"
        )
    except NotFoundError as e:
        return StandardResponse(
            success=True,
            data={"has_saved_progress": False},
            message="No saved progress found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve progress: {str(e)}"
        )


@router.delete("/{quiz_id}/progress", response_model=StandardResponse[dict])
async def clear_quiz_progress(
    quiz_id: PydanticObjectId,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Clear saved quiz progress after successful submission.
    
    Called automatically after quiz submission to clean up temporary data.
    """
    try:
        await QuizService.clear_quiz_progress(quiz_id, current_user.id)
        return StandardResponse(
            success=True,
            data={},
            message="Progress cleared successfully"
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/{quiz_id}/submit", response_model=StandardResponse[dict])
async def submit_quiz(
    quiz_id: PydanticObjectId,
    submission: QuizAnswerSubmit,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Submit quiz answers and get results.
    
    - **answers**: Array of selected answer indices (0-3)
    - **time_taken**: Optional time taken in seconds
    
    Returns score and feedback based on quiz configuration.
    """
    try:
        result = await QuizService.submit_quiz_attempt(
            quiz_id, current_user.id, submission
        )
        return StandardResponse(
            success=True,
            data=result.dict(),
            message="Quiz submitted successfully"
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ForbiddenError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except BadRequestError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{quiz_id}", response_model=StandardResponse[dict])
async def update_quiz(
    quiz_id: PydanticObjectId,
    quiz_update: QuizUpdate,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Update quiz details.
    
    Only content creators and admins can update quizzes.
    """
    # Check permissions
    if current_user.role not in ["creator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content creators and admins can update quizzes"
        )
    
    try:
        quiz = await QuizService.update_quiz(quiz_id, quiz_update)
        # Convert to dict with string IDs
        quiz_dict = {
            "id": str(quiz.id),
            "lesson_id": str(quiz.lesson_id),
            "course_id": str(quiz.course_id),
            "title": quiz.title,
            "description": quiz.description,
            "config": quiz.config,
            "questions": quiz.questions,
            "total_points": quiz.total_points,
            "created_at": quiz.created_at,
            "updated_at": quiz.updated_at
        }
        return StandardResponse(
            success=True,
            data=quiz_dict,
            message="Quiz updated successfully"
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/{quiz_id}", response_model=StandardResponse[dict])
async def delete_quiz(
    quiz_id: PydanticObjectId,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Delete a quiz permanently (hard delete).
    
    Only content creators and admins can delete quizzes.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Delete quiz endpoint called with ID: {str(quiz_id)} by user: {current_user.email}")
    
    # Check permissions
    if current_user.role not in ["creator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content creators and admins can delete quizzes"
        )
    
    try:
        result = await QuizService.delete_quiz(quiz_id)
        logger.info(f"Quiz deletion result: {result}")
        return StandardResponse(
            success=True,
            data={},
            message="Quiz deleted successfully"
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/{quiz_id}/analytics", response_model=StandardResponse[dict])
async def get_quiz_analytics(
    quiz_id: PydanticObjectId,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Get analytics for a specific quiz.
    
    Returns:
    - Total attempts
    - Average score
    - Pass rate
    - Question-level statistics
    
    Only creators and admins can view analytics.
    """
    # Check permissions
    if current_user.role not in ["creator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content creators and admins can view analytics"
        )
    
    try:
        analytics = await QuizService.get_quiz_analytics(quiz_id)
        return StandardResponse(
            success=True,
            data=analytics,
            message="Quiz analytics retrieved successfully"
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/course/{course_id}/analytics", response_model=StandardResponse[dict])
async def get_course_quiz_analytics(
    course_id: PydanticObjectId,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Get quiz analytics for all quizzes in a course.
    
    Returns aggregated statistics for all quizzes.
    
    Only creators and admins can view analytics.
    """
    # Check permissions
    if current_user.role not in ["creator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content creators and admins can view analytics"
        )
    
    try:
        analytics = await QuizService.get_course_quiz_analytics(course_id)
        return StandardResponse(
            success=True,
            data=analytics,
            message="Course quiz analytics retrieved successfully"
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )