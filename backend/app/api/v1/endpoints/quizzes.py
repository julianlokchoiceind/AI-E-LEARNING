"""
Quiz endpoints for managing lesson assessments.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from beanie import PydanticObjectId

from app.models.user import User
from app.schemas.quiz import QuizCreate, QuizUpdate, QuizAnswerSubmit
from app.schemas.base import StandardResponse
from app.api.deps import get_current_user
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
        return StandardResponse(
            success=True,
            data=quiz.dict(),
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
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Get quiz for a specific lesson.
    
    Returns quiz questions without correct answers for students.
    """
    from app.models.quiz import Quiz
    
    # Find quiz for lesson
    quiz = await Quiz.find_one(Quiz.lesson_id == lesson_id, Quiz.is_active == True)
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No quiz found for this lesson"
        )
    
    try:
        quiz_response, _ = await QuizService.get_quiz_for_student(
            quiz.id, current_user.id
        )
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
    """
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


@router.get("/{quiz_id}/progress", response_model=StandardResponse[dict])
async def get_quiz_progress(
    quiz_id: PydanticObjectId,
    current_user: User = Depends(get_current_user)
) -> StandardResponse[dict]:
    """
    Get user's progress for a specific quiz.
    
    Returns attempt history and current status.
    """
    try:
        progress = await QuizService.get_quiz_progress(quiz_id, current_user.id)
        if not progress:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No progress found for this quiz"
            )
        return StandardResponse(
            success=True,
            data=progress,
            message="Quiz progress retrieved successfully"
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
            data=result,
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
        return StandardResponse(
            success=True,
            data=quiz.dict(),
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
    Delete a quiz (soft delete).
    
    Only content creators and admins can delete quizzes.
    """
    # Check permissions
    if current_user.role not in ["creator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only content creators and admins can delete quizzes"
        )
    
    try:
        await QuizService.delete_quiz(quiz_id)
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