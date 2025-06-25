from datetime import datetime
from typing import Optional, List
from bson import ObjectId
from app.models.progress import Progress, VideoProgress
from app.models.lesson import Lesson
from app.models.enrollment import Enrollment
from app.core.exceptions import NotFoundError, ForbiddenError

class ProgressService:
    
    async def get_lesson_progress(self, lesson_id: str, user_id: str) -> Optional[Progress]:
        """Get user's progress for a specific lesson."""
        progress = await Progress.find_one({
            "lesson_id": lesson_id,
            "user_id": user_id
        })
        return progress
    
    async def update_video_progress(
        self, 
        lesson_id: str, 
        user_id: str, 
        watch_percentage: float,
        current_position: float
    ) -> Progress:
        """Update video watching progress for a lesson."""
        # Check if lesson exists
        lesson = await Lesson.get(lesson_id)
        if not lesson:
            raise NotFoundError(f"Lesson {lesson_id} not found")
        
        # Check enrollment
        enrollment = await Enrollment.find_one({
            "user_id": user_id,
            "course_id": lesson.course_id,
            "is_active": True
        })
        if not enrollment:
            raise ForbiddenError("User is not enrolled in this course")
        
        # Get or create progress record
        progress = await Progress.find_one({
            "lesson_id": lesson_id,
            "user_id": user_id
        })
        
        if not progress:
            progress = Progress(
                user_id=user_id,
                course_id=lesson.course_id,
                lesson_id=lesson_id,
                started_at=datetime.utcnow()
            )
        
        # Update video progress
        progress.video_progress.watch_percentage = watch_percentage
        progress.video_progress.current_position = current_position
        progress.video_progress.total_watch_time += 1  # Increment by 1 second
        
        # Check if completed (80% threshold)
        if watch_percentage >= 80 and not progress.video_progress.is_completed:
            progress.video_progress.is_completed = True
            progress.video_progress.completed_at = datetime.utcnow()
            progress.is_completed = True
            progress.completed_at = datetime.utcnow()
            
            # Unlock next lesson
            await self._unlock_next_lesson(lesson, user_id)
            
            # Update enrollment progress
            await self._update_enrollment_progress(enrollment.id, lesson.course_id)
        
        progress.last_accessed = datetime.utcnow()
        await progress.save()
        
        return progress
    
    async def start_lesson(self, lesson_id: str, user_id: str) -> Progress:
        """Start a lesson and create initial progress record."""
        # Check if lesson exists and user has access
        lesson = await Lesson.get(lesson_id)
        if not lesson:
            raise NotFoundError(f"Lesson {lesson_id} not found")
        
        # Check enrollment
        enrollment = await Enrollment.find_one({
            "user_id": user_id,
            "course_id": lesson.course_id,
            "is_active": True
        })
        if not enrollment:
            raise ForbiddenError("User is not enrolled in this course")
        
        # Check if lesson is unlocked (sequential learning)
        is_unlocked = await self._check_lesson_unlock_status(lesson, user_id)
        if not is_unlocked:
            raise ForbiddenError("Complete previous lessons first")
        
        # Get or create progress
        progress = await Progress.find_one({
            "lesson_id": lesson_id,
            "user_id": user_id
        })
        
        if not progress:
            progress = Progress(
                user_id=user_id,
                course_id=lesson.course_id,
                lesson_id=lesson_id,
                started_at=datetime.utcnow(),
                is_unlocked=True
            )
            await progress.save()
        
        # Update enrollment's current lesson
        enrollment.progress.current_lesson_id = lesson_id
        enrollment.last_accessed = datetime.utcnow()
        await enrollment.save()
        
        return progress
    
    async def complete_lesson(self, lesson_id: str, user_id: str) -> Progress:
        """Mark a lesson as completed."""
        progress = await self.get_lesson_progress(lesson_id, user_id)
        if not progress:
            raise NotFoundError("Progress record not found")
        
        if progress.video_progress.watch_percentage < 80:
            raise ForbiddenError("Watch at least 80% of the video to complete the lesson")
        
        progress.is_completed = True
        progress.completed_at = datetime.utcnow()
        progress.video_progress.is_completed = True
        progress.video_progress.completed_at = datetime.utcnow()
        
        await progress.save()
        
        # Get lesson details
        lesson = await Lesson.get(lesson_id)
        
        # Unlock next lesson
        await self._unlock_next_lesson(lesson, user_id)
        
        # Update enrollment progress
        enrollment = await Enrollment.find_one({
            "user_id": user_id,
            "course_id": lesson.course_id
        })
        if enrollment:
            await self._update_enrollment_progress(enrollment.id, lesson.course_id)
        
        return progress
    
    async def get_course_progress(self, course_id: str, user_id: str) -> List[Progress]:
        """Get all lesson progress for a course."""
        progress_list = await Progress.find({
            "course_id": course_id,
            "user_id": user_id
        }).to_list()
        
        return progress_list
    
    async def calculate_course_completion(self, course_id: str, user_id: str) -> dict:
        """Calculate course completion percentage and update enrollment."""
        # Get all lessons in the course
        total_lessons = await Lesson.find({"course_id": course_id}).count()
        
        if total_lessons == 0:
            return {
                "total_lessons": 0,
                "completed_lessons": 0,
                "completion_percentage": 0.0,
                "is_completed": False
            }
        
        # Get completed lessons
        completed_lessons = await Progress.find({
            "course_id": course_id,
            "user_id": user_id,
            "is_completed": True
        }).count()
        
        # Calculate percentage
        completion_percentage = (completed_lessons / total_lessons) * 100
        is_completed = completion_percentage >= 100
        
        # Update enrollment progress
        from app.models.enrollment import Enrollment
        enrollment = await Enrollment.find_one({
            "course_id": course_id,
            "user_id": user_id
        })
        
        if enrollment:
            enrollment.progress.lessons_completed = completed_lessons
            enrollment.progress.total_lessons = total_lessons
            enrollment.progress.completion_percentage = completion_percentage
            enrollment.progress.is_completed = is_completed
            
            if is_completed and not enrollment.progress.completed_at:
                enrollment.progress.completed_at = datetime.utcnow()
                
                # Update user stats
                from app.models.user import User
                user = await User.get(user_id)
                if user:
                    user.stats.courses_completed += 1
                    user.stats.certificates_earned += 1
                    await user.save()
            
            await enrollment.save()
        
        return {
            "total_lessons": total_lessons,
            "completed_lessons": completed_lessons,
            "completion_percentage": round(completion_percentage, 1),
            "is_completed": is_completed
        }
    
    async def get_user_learning_stats(self, user_id: str) -> dict:
        """Get overall learning statistics for a user."""
        # Get all progress records
        all_progress = await Progress.find({"user_id": user_id}).to_list()
        
        total_watch_time = sum(p.video_progress.total_watch_time for p in all_progress)
        completed_lessons = sum(1 for p in all_progress if p.is_completed)
        
        # Get unique courses
        unique_courses = set(p.course_id for p in all_progress)
        
        return {
            "total_courses": len(unique_courses),
            "total_lessons_completed": completed_lessons,
            "total_watch_time_minutes": round(total_watch_time / 60, 1)
        }
    
    async def _check_lesson_unlock_status(self, lesson: Lesson, user_id: str) -> bool:
        """Check if a lesson is unlocked based on sequential learning rules."""
        # First lesson in the course is always unlocked
        if lesson.order == 1:
            return True
        
        # Check if previous lesson in the same chapter is completed
        prev_lesson = await Lesson.find_one({
            "chapter_id": lesson.chapter_id,
            "order": lesson.order - 1
        })
        
        if prev_lesson:
            prev_progress = await Progress.find_one({
                "lesson_id": str(prev_lesson.id),
                "user_id": user_id
            })
            
            if not prev_progress or not prev_progress.is_completed:
                return False
        
        return True
    
    async def _unlock_next_lesson(self, current_lesson: Lesson, user_id: str) -> None:
        """Unlock the next lesson in sequence."""
        # Find next lesson in the same chapter
        next_lesson = await Lesson.find_one({
            "chapter_id": current_lesson.chapter_id,
            "order": current_lesson.order + 1
        })
        
        if next_lesson:
            # Create progress record for next lesson if it doesn't exist
            progress = await Progress.find_one({
                "lesson_id": str(next_lesson.id),
                "user_id": user_id
            })
            
            if not progress:
                progress = Progress(
                    user_id=user_id,
                    course_id=next_lesson.course_id,
                    lesson_id=str(next_lesson.id),
                    is_unlocked=True
                )
                await progress.save()
    
    async def _update_enrollment_progress(self, enrollment_id: str, course_id: str) -> None:
        """Update course enrollment progress statistics."""
        enrollment = await Enrollment.get(enrollment_id)
        if not enrollment:
            return
        
        # Count total lessons in course
        from app.models.lesson import Lesson
        total_lessons = await Lesson.find({"course_id": course_id}).count()
        
        # Count completed lessons
        completed_lessons = await Progress.find({
            "course_id": course_id,
            "user_id": enrollment.user_id,
            "is_completed": True
        }).count()
        
        # Update enrollment progress
        enrollment.progress.total_lessons = total_lessons
        enrollment.progress.lessons_completed = completed_lessons
        enrollment.progress.completion_percentage = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
        
        # Check if course is completed
        if completed_lessons == total_lessons and total_lessons > 0:
            enrollment.progress.is_completed = True
            enrollment.progress.completed_at = datetime.utcnow()
        
        enrollment.updated_at = datetime.utcnow()
        await enrollment.save()

# Create service instance
progress_service = ProgressService()