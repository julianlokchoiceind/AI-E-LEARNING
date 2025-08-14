from datetime import datetime, timezone
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
            "course_id": str(lesson.course_id),
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
                course_id=str(lesson.course_id),
                lesson_id=lesson_id,
                started_at=datetime.now(timezone.utc)
            )
        
        # Update video progress - PROTECT AGAINST RESET
        # Only update percentage if it's higher than current (prevent going backwards)
        if watch_percentage > progress.video_progress.watch_percentage:
            progress.video_progress.watch_percentage = watch_percentage
        
        # Always update current position (allow rewind)
        progress.video_progress.current_position = current_position
        progress.video_progress.total_watch_time += 1  # Increment by 1 second
        
        # Check if completed (95% threshold)
        if watch_percentage >= 95 and not progress.video_progress.is_completed:
            progress.video_progress.is_completed = True
            progress.video_progress.completed_at = datetime.now(timezone.utc)
            progress.is_completed = True
            progress.completed_at = datetime.now(timezone.utc)
            
            # Unlock next lesson
            await self._unlock_next_lesson(lesson, user_id)
        
        # Update enrollment's current lesson to ensure consistency
        # This ensures the Continue button works correctly everywhere
        enrollment.progress.current_lesson_id = lesson_id
        enrollment.last_accessed = datetime.now(timezone.utc)
        await enrollment.save()
        
        # Always update enrollment progress for real-time updates
        await self._update_enrollment_progress(enrollment.id, str(lesson.course_id))
        
        progress.last_accessed = datetime.now(timezone.utc)
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
            "course_id": str(lesson.course_id),
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
                course_id=str(lesson.course_id),
                lesson_id=lesson_id,
                started_at=datetime.now(timezone.utc),
                is_unlocked=True
            )
            await progress.save()
        
        # Update enrollment's current lesson
        enrollment.progress.current_lesson_id = lesson_id
        enrollment.last_accessed = datetime.now(timezone.utc)
        await enrollment.save()
        
        return progress
    
    async def complete_lesson(self, lesson_id: str, user_id: str) -> Progress:
        """Mark a lesson as completed."""
        progress = await self.get_lesson_progress(lesson_id, user_id)
        if not progress:
            raise NotFoundError("Progress record not found")
        
        if progress.video_progress.watch_percentage < 95:
            raise ForbiddenError("Watch at least 95% of the video to complete the lesson")
        
        progress.is_completed = True
        progress.completed_at = datetime.now(timezone.utc)
        progress.video_progress.is_completed = True
        progress.video_progress.completed_at = datetime.now(timezone.utc)
        
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
            # Keep current_lesson_id to track the last accessed lesson for review purposes
            # This ensures completed courses can navigate to the last lesson for review
            enrollment.last_accessed = datetime.now(timezone.utc)
            await enrollment.save()
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
        """Calculate course completion percentage using weighted average of lesson progress."""
        # Get lessons through chapters to match UI display
        from app.models.chapter import Chapter
        
        # ULTRATHINK: Chapters được ưu tiên cao nhất! 
        # Chỉ lấy PUBLISHED chapters trước, sau đó mới lấy PUBLISHED lessons
        
        # Get only PUBLISHED chapters for this course
        # IMPORTANT: Convert course_id to ObjectId for MongoDB query
        from beanie import PydanticObjectId
        course_obj_id = PydanticObjectId(course_id) if isinstance(course_id, str) else course_id
        
        chapters = await Chapter.find({
            "course_id": course_obj_id, 
            "status": "published"
        }).sort([("order", 1)]).to_list()
        
        if not chapters:
            return {
                "total_lessons": 0,
                "completed_lessons": 0,
                "completion_percentage": 0.0,
                "is_completed": False
            }
        
        # Get only PUBLISHED lessons from PUBLISHED chapters
        lessons = []
        for chapter in chapters:
            # IMPORTANT: chapter_id in Lesson is also PydanticObjectId
            chapter_lessons = await Lesson.find({
                "chapter_id": chapter.id,  # Use ObjectId directly, not string
                "status": "published"
            }).sort([("order", 1)]).to_list()
            lessons.extend(chapter_lessons)
        
        total_lessons = len(lessons)
        
        if total_lessons == 0:
            return {
                "total_lessons": 0,
                "completed_lessons": 0,
                "completion_percentage": 0.0,
                "is_completed": False
            }
        
        # Calculate weighted average completion percentage
        total_progress = 0.0
        completed_lessons = 0
        total_watch_time_seconds = 0.0  # Track total watch time across all lessons
        
        for lesson in lessons:
            lesson_id = str(lesson.id)
            
            # Get progress for this lesson
            progress = await Progress.find_one({
                "lesson_id": lesson_id,
                "user_id": user_id
            })
            
            if progress:
                # Add lesson watch percentage to total
                watch_percentage = progress.video_progress.watch_percentage
                total_progress += watch_percentage
                
                # Accumulate watch time (in seconds)
                total_watch_time_seconds += progress.video_progress.total_watch_time
                
                # Count as completed if watch_percentage >= 95
                if progress.is_completed:
                    completed_lessons += 1
            else:
                # No progress record = 0% for this lesson
                total_progress += 0.0
        
        # Calculate weighted average completion percentage (rounded to 1 decimal)
        completion_percentage = round(total_progress / total_lessons, 1) if total_lessons > 0 else 0.0
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
            
            # Convert total watch time from seconds to minutes and update enrollment
            enrollment.progress.total_watch_time = round(total_watch_time_seconds / 60.0, 2)
            
            if is_completed and not enrollment.progress.completed_at:
                enrollment.progress.completed_at = datetime.now(timezone.utc)
                
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
        # First, try to find next lesson in the same chapter
        next_lesson = await Lesson.find_one({
            "chapter_id": current_lesson.chapter_id,
            "order": current_lesson.order + 1
        })
        
        # If no next lesson in current chapter, find first lesson of next chapter
        if not next_lesson:
            from app.models.chapter import Chapter
            
            # Get current chapter
            current_chapter = await Chapter.get(current_lesson.chapter_id)
            if current_chapter:
                # Find next chapter
                next_chapter = await Chapter.find_one({
                    "course_id": current_chapter.course_id,
                    "order": current_chapter.order + 1
                })
                
                if next_chapter:
                    # Get first lesson of next chapter
                    next_lesson = await Lesson.find_one({
                        "chapter_id": str(next_chapter.id),
                        "order": 1
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
                    course_id=str(next_lesson.course_id),
                    lesson_id=str(next_lesson.id),
                    is_unlocked=True
                )
                await progress.save()
            elif not progress.is_unlocked:
                # Update existing progress to unlock
                progress.is_unlocked = True
                await progress.save()
    
    async def _update_enrollment_progress(self, enrollment_id: str, course_id: str) -> None:
        """Update course enrollment progress statistics using weighted calculation."""
        enrollment = await Enrollment.get(enrollment_id)
        if not enrollment:
            return
        
        # Use the same weighted calculation as calculate_course_completion
        completion_data = await self.calculate_course_completion(course_id, enrollment.user_id)
        
        # Update enrollment progress with weighted data
        enrollment.progress.total_lessons = completion_data["total_lessons"]
        enrollment.progress.lessons_completed = completion_data["completed_lessons"]
        enrollment.progress.completion_percentage = completion_data["completion_percentage"]
        enrollment.progress.is_completed = completion_data["is_completed"]
        
        # Set completion timestamp if completed
        if completion_data["is_completed"] and not enrollment.progress.completed_at:
            enrollment.progress.completed_at = datetime.now(timezone.utc)
        
        enrollment.updated_at = datetime.now(timezone.utc)
        await enrollment.save()
    
    async def get_batch_lesson_progress(self, lesson_ids: List[str], user_id: str) -> List[dict]:
        """Get progress for multiple lessons in a single query."""
        if not lesson_ids:
            return []
        
        # Get all progress records in one query
        progress_list = await Progress.find({
            "lesson_id": {"$in": lesson_ids},
            "user_id": user_id
        }).to_list()
        
        # Convert to dict format expected by frontend
        result = []
        for progress in progress_list:
            result.append({
                "lesson_id": progress.lesson_id,
                "is_completed": progress.is_completed,
                "is_unlocked": progress.is_unlocked,
                "video_progress": {
                    "watch_percentage": progress.video_progress.watch_percentage,
                    "current_position": progress.video_progress.current_position,
                    "is_completed": progress.video_progress.is_completed
                } if progress.video_progress else {
                    "watch_percentage": 0,
                    "current_position": 0,
                    "is_completed": False
                }
            })
        
        return result

# Create service instance
progress_service = ProgressService()