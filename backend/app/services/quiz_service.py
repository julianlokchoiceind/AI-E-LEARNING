"""
Quiz service for managing quiz logic and operations.
"""
from typing import List, Optional, Tuple
from datetime import datetime
from beanie import PydanticObjectId
import random

from app.models.quiz import Quiz, QuizProgress, QuizAttempt
from app.models.lesson import Lesson
from app.models.enrollment import Enrollment
from app.schemas.quiz import (
    QuizCreate, QuizUpdate, QuizResponse, QuizQuestionResponse,
    QuizAnswerSubmit, QuizAttemptResult, QuizProgressResponse
)
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError


class QuizService:
    """Service class for quiz operations."""
    
    @staticmethod
    async def create_quiz(quiz_data: QuizCreate, creator_id: PydanticObjectId) -> Quiz:
        """Create a new quiz for a lesson."""
        # Check if lesson exists
        lesson = await Lesson.get(quiz_data.lesson_id)
        if not lesson:
            raise NotFoundError("Lesson not found")
        
        # Check if quiz already exists for this lesson
        existing_quiz = await Quiz.find_one(Quiz.lesson_id == quiz_data.lesson_id)
        if existing_quiz:
            raise BadRequestError("Quiz already exists for this lesson")
        
        # Calculate total points
        total_points = sum(q.points for q in quiz_data.questions)
        
        # Create quiz
        quiz = Quiz(
            lesson_id=quiz_data.lesson_id,
            course_id=quiz_data.course_id,
            title=quiz_data.title,
            description=quiz_data.description,
            config=quiz_data.config,
            questions=[q.dict() for q in quiz_data.questions],
            total_points=total_points,
            is_active=True
        )
        
        await quiz.create()
        return quiz
    
    @staticmethod
    async def get_quiz_for_student(
        quiz_id: PydanticObjectId,
        user_id: PydanticObjectId
    ) -> Tuple[QuizResponse, QuizProgressResponse]:
        """Get quiz for student (questions without answers)."""
        # Get quiz
        quiz = await Quiz.get(quiz_id)
        if not quiz or not quiz.is_active:
            raise NotFoundError("Quiz not found")
        
        # Check enrollment
        enrollment = await Enrollment.find_one(
            Enrollment.user_id == user_id,
            Enrollment.course_id == quiz.course_id
        )
        if not enrollment:
            raise ForbiddenError("You are not enrolled in this course")
        
        # Get or create progress
        progress = await QuizProgress.find_one(
            QuizProgress.user_id == user_id,
            QuizProgress.quiz_id == quiz_id
        )
        
        if not progress:
            progress = QuizProgress(
                user_id=user_id,
                quiz_id=quiz_id,
                lesson_id=quiz.lesson_id,
                course_id=quiz.course_id
            )
            await progress.create()
        
        # Prepare questions for student (hide answers)
        questions = quiz.questions.copy()
        
        # Shuffle questions if configured
        if quiz.config.shuffle_questions:
            random.shuffle(questions)
        
        # Process questions
        student_questions = []
        for q in questions:
            # Shuffle answer options if configured
            options = q["options"].copy()
            if quiz.config.shuffle_answers:
                # Create mapping of old to new indices
                indices = list(range(len(options)))
                random.shuffle(indices)
                # Rearrange options
                shuffled_options = [options[i] for i in indices]
                options = shuffled_options
            
            student_questions.append(
                QuizQuestionResponse(
                    question=q["question"],
                    options=options,
                    points=q["points"],
                    correct_answer=None,  # Hide correct answer
                    explanation=None  # Hide explanation
                )
            )
        
        # Create response
        quiz_response = QuizResponse(
            _id=quiz.id,
            lesson_id=quiz.lesson_id,
            course_id=quiz.course_id,
            title=quiz.title,
            description=quiz.description,
            config=quiz.config,
            questions=student_questions,
            total_points=quiz.total_points,
            is_active=quiz.is_active,
            created_at=quiz.created_at
        )
        
        # Check if can retry
        can_retry = progress.total_attempts < quiz.config.max_attempts
        
        # Create progress response
        progress_response = QuizProgressResponse(
            quiz_id=quiz.id,
            lesson_id=quiz.lesson_id,
            course_id=quiz.course_id,
            attempts=[
                QuizAttemptResult(
                    attempt_number=a.attempt_number,
                    score=a.score,
                    total_questions=a.total_questions,
                    correct_answers=a.correct_answers,
                    passed=a.passed,
                    time_taken=a.time_taken,
                    questions_feedback=[],  # Don't show detailed feedback in list
                    attempted_at=a.attempted_at
                )
                for a in progress.attempts
            ],
            best_score=progress.best_score,
            total_attempts=progress.total_attempts,
            is_passed=progress.is_passed,
            passed_at=progress.passed_at,
            can_retry=can_retry
        )
        
        return quiz_response, progress_response
    
    @staticmethod
    async def submit_quiz_attempt(
        quiz_id: PydanticObjectId,
        user_id: PydanticObjectId,
        submission: QuizAnswerSubmit
    ) -> QuizAttemptResult:
        """Submit quiz answers and calculate result."""
        # Get quiz
        quiz = await Quiz.get(quiz_id)
        if not quiz or not quiz.is_active:
            raise NotFoundError("Quiz not found")
        
        # Get progress
        progress = await QuizProgress.find_one(
            QuizProgress.user_id == user_id,
            QuizProgress.quiz_id == quiz_id
        )
        
        if not progress:
            raise NotFoundError("Quiz progress not found")
        
        # Check if can retry
        if progress.total_attempts >= quiz.config.max_attempts:
            raise ForbiddenError("Maximum attempts reached")
        
        # Validate answers count
        if len(submission.answers) != len(quiz.questions):
            raise BadRequestError("Invalid number of answers")
        
        # Calculate score
        correct_count = 0
        questions_feedback = []
        
        for i, (question, answer) in enumerate(zip(quiz.questions, submission.answers)):
            is_correct = answer == question["correct_answer"]
            if is_correct:
                correct_count += 1
            
            feedback = {
                "question_index": i,
                "is_correct": is_correct,
                "selected_answer": answer,
                "correct_answer": question["correct_answer"]
            }
            
            # Add explanation if configured
            if quiz.config.immediate_feedback and question.get("explanation"):
                feedback["explanation"] = question["explanation"]
            
            questions_feedback.append(feedback)
        
        # Calculate percentage score
        score = int((correct_count / len(quiz.questions)) * 100)
        passed = score >= quiz.config.pass_percentage
        
        # Create attempt record
        attempt = QuizAttempt(
            user_id=user_id,
            attempt_number=progress.total_attempts + 1,
            score=score,
            total_questions=len(quiz.questions),
            correct_answers=correct_count,
            time_taken=submission.time_taken,
            passed=passed,
            answers=submission.answers
        )
        
        # Update progress
        progress.attempts.append(attempt)
        progress.total_attempts += 1
        progress.best_score = max(progress.best_score, score)
        
        if passed and not progress.is_passed:
            progress.is_passed = True
            progress.passed_at = datetime.utcnow()
        
        if not progress.first_attempt_at:
            progress.first_attempt_at = datetime.utcnow()
        progress.last_attempt_at = datetime.utcnow()
        
        await progress.save()
        
        # Return result
        return QuizAttemptResult(
            attempt_number=attempt.attempt_number,
            score=score,
            total_questions=len(quiz.questions),
            correct_answers=correct_count,
            passed=passed,
            time_taken=submission.time_taken,
            questions_feedback=questions_feedback if quiz.config.show_correct_answers else [],
            attempted_at=attempt.attempted_at
        )
    
    @staticmethod
    async def get_quiz_progress(
        quiz_id: PydanticObjectId,
        user_id: PydanticObjectId
    ) -> Optional[QuizProgressResponse]:
        """Get user's quiz progress."""
        # Get quiz
        quiz = await Quiz.get(quiz_id)
        if not quiz:
            raise NotFoundError("Quiz not found")
        
        # Get progress
        progress = await QuizProgress.find_one(
            QuizProgress.user_id == user_id,
            QuizProgress.quiz_id == quiz_id
        )
        
        if not progress:
            return None
        
        # Check if can retry
        can_retry = progress.total_attempts < quiz.config.max_attempts
        
        # Create response
        return QuizProgressResponse(
            quiz_id=quiz.id,
            lesson_id=quiz.lesson_id,
            course_id=quiz.course_id,
            attempts=[
                QuizAttemptResult(
                    attempt_number=a.attempt_number,
                    score=a.score,
                    total_questions=a.total_questions,
                    correct_answers=a.correct_answers,
                    passed=a.passed,
                    time_taken=a.time_taken,
                    questions_feedback=[],
                    attempted_at=a.attempted_at
                )
                for a in progress.attempts
            ],
            best_score=progress.best_score,
            total_attempts=progress.total_attempts,
            is_passed=progress.is_passed,
            passed_at=progress.passed_at,
            can_retry=can_retry
        )
    
    @staticmethod
    async def update_quiz(
        quiz_id: PydanticObjectId,
        quiz_update: QuizUpdate
    ) -> Quiz:
        """Update quiz details."""
        quiz = await Quiz.get(quiz_id)
        if not quiz:
            raise NotFoundError("Quiz not found")
        
        # Update fields
        update_data = quiz_update.dict(exclude_unset=True)
        
        # Recalculate total points if questions updated
        if "questions" in update_data:
            update_data["total_points"] = sum(q["points"] for q in update_data["questions"])
        
        # Update timestamp
        update_data["updated_at"] = datetime.utcnow()
        
        # Apply updates
        await quiz.set(update_data)
        
        return quiz
    
    @staticmethod
    async def delete_quiz(quiz_id: PydanticObjectId) -> bool:
        """Delete a quiz (soft delete by marking inactive)."""
        quiz = await Quiz.get(quiz_id)
        if not quiz:
            raise NotFoundError("Quiz not found")
        
        quiz.is_active = False
        quiz.updated_at = datetime.utcnow()
        await quiz.save()
        
        return True