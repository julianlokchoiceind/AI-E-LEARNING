"""
Quiz service for managing quiz logic and operations.
"""
from typing import List, Optional, Tuple
from datetime import datetime
from beanie import PydanticObjectId
import random

from app.models.quiz import Quiz, QuizProgress
from app.models.lesson import Lesson
from app.models.enrollment import Enrollment
from app.schemas.quiz import (
    QuizCreate, QuizUpdate, QuizResponse, QuizQuestionResponse,
    QuizAnswerSubmit, QuizAttemptResult, QuizProgressResponse, QuizProgressSave
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
        
        # Check if a quiz already exists for this lesson
        existing_quiz = await Quiz.find_one(Quiz.lesson_id == quiz_data.lesson_id)
        if existing_quiz:
            raise BadRequestError("A quiz already exists for this lesson")
        
        # Calculate total points
        total_points = sum(q.points for q in quiz_data.questions)
        
        # Create quiz
        quiz = Quiz(
            lesson_id=quiz_data.lesson_id,
            course_id=quiz_data.course_id,
            title=quiz_data.title,
            description=quiz_data.description,
            config=quiz_data.config.dict() if quiz_data.config else {},
            questions=[q.dict() for q in quiz_data.questions],
            total_points=total_points
        )
        
        await quiz.create()
        
        # Update lesson to indicate it has a quiz
        lesson.has_quiz = True
        await lesson.save()
        
        return quiz
    
    @staticmethod
    async def get_quiz_for_student(
        quiz_id: PydanticObjectId,
        user_id: PydanticObjectId
    ) -> Tuple[QuizResponse, QuizProgressResponse]:
        """Get quiz for student - simplified version."""
        # Get quiz
        quiz = await Quiz.get(quiz_id)
        if not quiz:
            raise NotFoundError("Quiz not found")
        
        # Check enrollment
        enrollment = await Enrollment.find_one(
            Enrollment.user_id == str(user_id),
            Enrollment.course_id == str(quiz.course_id)
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
        
        # Prepare questions based on completion status
        questions = quiz.questions.copy()
        
        if progress.is_completed:
            # Show questions with correct answers for review
            student_questions = []
            for q in questions:
                if isinstance(q, dict):
                    question_text = q["question"]
                    options = q["options"].copy()
                    points = q["points"]
                    correct_answer = q["correct_answer"]
                    explanation = q.get("explanation")
                else:
                    question_text = q.question
                    options = q.options.copy()
                    points = q.points
                    correct_answer = q.correct_answer
                    explanation = getattr(q, 'explanation', None)
                
                student_questions.append(
                    QuizQuestionResponse(
                        question=question_text,
                        options=options,
                        points=points,
                        correct_answer=correct_answer,  # Include for review
                        explanation=explanation
                    )
                )
        else:
            # Show questions without answers (quiz mode)
            # Shuffle if configured
            if quiz.config.shuffle_questions:
                random.shuffle(questions)
            
            student_questions = []
            for q in questions:
                if isinstance(q, dict):
                    question_text = q["question"]
                    options = q["options"].copy()
                    points = q["points"]
                else:
                    question_text = q.question
                    options = q.options.copy()
                    points = q.points
                
                # Shuffle answer options if configured
                if quiz.config.shuffle_answers:
                    random.shuffle(options)
                
                student_questions.append(
                    QuizQuestionResponse(
                        question=question_text,
                        options=options,
                        points=points,
                        correct_answer=None,  # Hide correct answer
                        explanation=None  # Hide explanation
                    )
                )
        
        # Create quiz response
        quiz_response = {
            "id": str(quiz.id),
            "lesson_id": str(quiz.lesson_id),
            "course_id": str(quiz.course_id),
            "title": quiz.title,
            "description": quiz.description,
            "config": quiz.config,
            "questions": [q.dict() for q in student_questions],
            "total_points": quiz.total_points,
            "created_at": quiz.created_at
        }
        
        # Create simple progress response
        progress_response = {
            "quiz_id": str(quiz.id),
            "lesson_id": str(quiz.lesson_id),
            "course_id": str(quiz.course_id),
            "is_completed": progress.is_completed,
            "score": progress.score,
            "answers": progress.answers,
            "passed": progress.passed,
            "time_taken": progress.time_taken,
            "completed_at": progress.completed_at
        }
        
        return quiz_response, progress_response
    
    @staticmethod
    async def submit_quiz_attempt(
        quiz_id: PydanticObjectId,
        user_id: PydanticObjectId,
        submission: QuizAnswerSubmit
    ) -> QuizAttemptResult:
        """Submit quiz answers - simplified version (one submission only)."""
        # Get quiz
        quiz = await Quiz.get(quiz_id)
        if not quiz:
            raise NotFoundError("Quiz not found")
        
        # Ensure questions are dictionaries
        if quiz.questions and not isinstance(quiz.questions[0], dict):
            quiz.questions = [q.dict() if hasattr(q, 'dict') else q for q in quiz.questions]
        
        # Get progress
        progress = await QuizProgress.find_one(
            QuizProgress.user_id == user_id,
            QuizProgress.quiz_id == quiz_id
        )
        
        if not progress:
            raise NotFoundError("Quiz progress not found")
        
        # Check if already completed
        if progress.is_completed:
            raise ForbiddenError("Quiz already completed")
        
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
            
            # Add explanation if available
            if question.get("explanation"):
                feedback["explanation"] = question["explanation"]
            
            questions_feedback.append(feedback)
        
        # Calculate final score
        score = int((correct_count / len(quiz.questions)) * 100)
        passed = score >= quiz.config.pass_percentage
        
        # Update progress to completed
        progress.is_completed = True
        progress.score = score
        progress.answers = submission.answers
        progress.passed = passed
        progress.time_taken = submission.time_taken
        progress.completed_at = datetime.utcnow()
        
        await progress.save()
        
        # Update lesson progress if passed
        if passed:
            from app.models.progress import Progress as LessonProgress
            lesson_progress = await LessonProgress.find_one(
                LessonProgress.user_id == str(user_id),
                LessonProgress.lesson_id == str(quiz.lesson_id)
            )
            if lesson_progress:
                if not lesson_progress.quiz_progress:
                    from app.models.progress import QuizProgress as QuizProgressEmbed
                    lesson_progress.quiz_progress = QuizProgressEmbed()
                lesson_progress.quiz_progress.is_passed = True
                lesson_progress.quiz_progress.passed_at = datetime.utcnow()
                lesson_progress.quiz_progress.best_score = score
                await lesson_progress.save()
        
        # Return simple result
        return QuizAttemptResult(
            attempt_number=1,  # Always 1 now
            score=score,
            total_questions=len(quiz.questions),
            correct_answers=correct_count,
            passed=passed,
            time_taken=submission.time_taken,
            questions_feedback=questions_feedback,
            attempted_at=progress.completed_at
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
        
        # Ensure lesson.has_quiz is set to true
        lesson = await Lesson.get(quiz.lesson_id)
        if lesson and not lesson.has_quiz:
            lesson.has_quiz = True
            await lesson.save()
        
        return quiz
    
    @staticmethod
    async def delete_quiz(quiz_id: PydanticObjectId) -> bool:
        """Delete a quiz permanently from database (hard delete)."""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"Attempting to delete quiz with ID: {str(quiz_id)}")
        
        quiz = await Quiz.get(quiz_id)
        if not quiz:
            logger.error(f"Quiz not found with ID: {str(quiz_id)}")
            raise NotFoundError("Quiz not found")
        
        # Store lesson_id before deletion
        lesson_id = quiz.lesson_id
        logger.info(f"Found quiz for lesson: {str(lesson_id)}, proceeding with deletion")
        
        # Delete all related quiz progress records
        progress_count = await QuizProgress.find(QuizProgress.quiz_id == quiz_id).count()
        logger.info(f"Deleting {progress_count} quiz progress records")
        await QuizProgress.find(QuizProgress.quiz_id == quiz_id).delete()
        
        # Hard delete the quiz from database
        await quiz.delete()
        logger.info(f"Quiz {str(quiz_id)} deleted from database")
        
        # Update lesson to indicate it no longer has a quiz
        lesson = await Lesson.get(lesson_id)
        if lesson:
            lesson.has_quiz = False
            await lesson.save()
            logger.info(f"Updated lesson {str(lesson_id)} has_quiz to False")
        
        return True
    
    @staticmethod
    async def save_quiz_progress(
        quiz_id: PydanticObjectId,
        user_id: PydanticObjectId,
        progress_data: QuizProgressSave
    ) -> QuizProgress:
        """Save quiz progress for auto-save functionality."""
        # Check if quiz exists
        quiz = await Quiz.get(quiz_id)
        if not quiz:
            raise NotFoundError("Quiz not found")
        
        # Find or create progress document
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
        
        # Update auto-save fields
        progress.saved_answers = progress_data.saved_answers
        progress.current_question_index = progress_data.current_question_index
        progress.is_in_progress = True
        progress.last_saved_at = datetime.utcnow()
        
        # Save progress
        if progress.id:
            await progress.save()
        else:
            await progress.create()
        
        return progress
    
    @staticmethod
    async def clear_quiz_progress(
        quiz_id: PydanticObjectId,
        user_id: PydanticObjectId
    ) -> bool:
        """Clear saved quiz progress after submission."""
        progress = await QuizProgress.find_one(
            QuizProgress.user_id == user_id,
            QuizProgress.quiz_id == quiz_id
        )
        
        if progress:
            # Clear auto-save fields
            progress.saved_answers = []
            progress.current_question_index = 0
            progress.is_in_progress = False
            progress.last_saved_at = None
            await progress.save()
        
        return True
    
    @staticmethod
    async def get_saved_quiz_progress(
        quiz_id: PydanticObjectId,
        user_id: PydanticObjectId
    ) -> Optional[dict]:
        """Get saved quiz progress for resume functionality."""
        progress = await QuizProgress.find_one(
            QuizProgress.user_id == user_id,
            QuizProgress.quiz_id == quiz_id
        )
        
        if progress and progress.is_in_progress and progress.saved_answers:
            return {
                "has_saved_progress": True,
                "saved_answers": progress.saved_answers,
                "current_question_index": progress.current_question_index,
                "last_saved_at": progress.last_saved_at,
                "questions_completed": len([a for a in progress.saved_answers if a != -1])
            }
        
        return None
    
    @staticmethod
    async def get_quiz_analytics(quiz_id: PydanticObjectId) -> dict:
        """Get analytics for a specific quiz."""
        quiz = await Quiz.get(quiz_id)
        if not quiz:
            raise NotFoundError("Quiz not found")
        
        # Ensure questions are dictionaries
        if quiz.questions and not isinstance(quiz.questions[0], dict):
            quiz.questions = [q.dict() if hasattr(q, 'dict') else q for q in quiz.questions]
        
        # Get all quiz progress for this quiz
        all_progress = await QuizProgress.find(
            QuizProgress.quiz_id == quiz_id
        ).to_list()
        
        # Calculate analytics
        total_users = len(all_progress)
        total_completed = len([p for p in all_progress if p.is_completed])
        passed_users = len([p for p in all_progress if p.passed])
        
        # Calculate average score from completed quizzes
        completed_scores = [p.score for p in all_progress if p.is_completed and p.score is not None]
        avg_score = sum(completed_scores) / len(completed_scores) if completed_scores else 0
        
        # Question-level statistics
        question_stats = []
        for i, question in enumerate(quiz.questions):
            correct_count = 0
            total_answered = 0
            
            for progress in all_progress:
                if progress.is_completed and progress.answers and i < len(progress.answers):
                    total_answered += 1
                    if progress.answers[i] == question["correct_answer"]:
                        correct_count += 1
            
            question_stats.append({
                "question_index": i,
                "question_text": question["question"],
                "type": question.get("type", "multiple_choice"),
                "total_answered": total_answered,
                "correct_count": correct_count,
                "success_rate": (correct_count / total_answered * 100) if total_answered > 0 else 0
            })
        
        return {
            "quiz_id": str(quiz_id),
            "quiz_title": quiz.title,
            "total_users": total_users,
            "total_completed": total_completed,
            "passed_users": passed_users,
            "completion_rate": (total_completed / total_users * 100) if total_users > 0 else 0,
            "pass_rate": (passed_users / total_completed * 100) if total_completed > 0 else 0,
            "average_score": round(avg_score, 2),
            "question_statistics": question_stats
        }
    
    @staticmethod
    async def get_course_quiz_analytics(course_id: PydanticObjectId) -> dict:
        """Get aggregated quiz analytics for a course."""
        # Get all quizzes for the course
        quizzes = await Quiz.find(
            Quiz.course_id == course_id
        ).to_list()
        
        if not quizzes:
            return {
                "course_id": str(course_id),
                "total_quizzes": 0,
                "message": "No quizzes found for this course"
            }
        
        # Aggregate analytics
        total_quizzes = len(quizzes)
        all_analytics = []
        
        for quiz in quizzes:
            try:
                quiz_analytics = await QuizService.get_quiz_analytics(quiz.id)
                all_analytics.append(quiz_analytics)
            except:
                continue
        
        # Calculate course-level statistics
        total_users = sum(a["total_users"] for a in all_analytics)
        total_completed = sum(a["total_completed"] for a in all_analytics)
        total_passed = sum(a["passed_users"] for a in all_analytics)
        avg_scores = [a["average_score"] for a in all_analytics if a["average_score"] > 0]
        
        return {
            "course_id": str(course_id),
            "total_quizzes": total_quizzes,
            "total_users_attempted": total_users,
            "total_completed": total_completed,
            "total_passed_users": total_passed,
            "overall_completion_rate": (total_completed / total_users * 100) if total_users > 0 else 0,
            "overall_pass_rate": (total_passed / total_completed * 100) if total_completed > 0 else 0,
            "average_score_across_quizzes": round(sum(avg_scores) / len(avg_scores), 2) if avg_scores else 0,
            "quiz_summaries": [
                {
                    "quiz_id": a["quiz_id"],
                    "quiz_title": a["quiz_title"],
                    "pass_rate": a["pass_rate"],
                    "average_score": a["average_score"]
                }
                for a in all_analytics
            ]
        }