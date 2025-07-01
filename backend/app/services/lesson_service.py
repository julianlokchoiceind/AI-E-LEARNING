"""
Service layer for lesson-related business logic.
"""
from typing import List, Optional
from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.models.lesson import Lesson, VideoContent, UnlockConditions
from app.models.course import Course
from app.models.chapter import Chapter
from app.models.progress import Progress
from app.models.enrollment import Enrollment
from app.schemas.lesson import LessonCreate, LessonUpdate, LessonReorder
from app.services.chapter_service import chapter_service


class LessonService:
    """Service class for lesson operations."""
    
    @staticmethod
    async def create_lesson(
        course_id: str,
        chapter_id: str,
        lesson_data: LessonCreate,
        user_id: str
    ) -> Lesson:
        """Create a new lesson in a chapter."""
        # Verify course exists and user has permission
        course = await Course.get(PydanticObjectId(course_id))
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        if str(course.creator_id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only course creator can add lessons"
            )
        
        # Verify chapter exists and belongs to course
        chapter = await Chapter.get(PydanticObjectId(chapter_id))
        if not chapter or str(chapter.course_id) != course_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chapter not found in this course"
            )
        
        # Auto-assign order if not provided
        if lesson_data.order is None:
            existing_lessons = await Lesson.find(
                Lesson.chapter_id == PydanticObjectId(chapter_id)
            ).sort("-order").limit(1).to_list()
            
            lesson_data.order = 1 if not existing_lessons else existing_lessons[0].order + 1
        
        # Create lesson
        lesson = Lesson(
            course_id=PydanticObjectId(course_id),
            chapter_id=PydanticObjectId(chapter_id),
            title=lesson_data.title,
            description=lesson_data.description,
            order=lesson_data.order,
            video=lesson_data.video.dict() if lesson_data.video else None,
            content=lesson_data.content,
            resources=[r.dict() for r in lesson_data.resources],
            unlock_conditions=lesson_data.unlock_conditions.dict() if lesson_data.unlock_conditions else UnlockConditions().dict()
        )
        
        await lesson.insert()
        
        # Update chapter stats
        await chapter_service.update_chapter_stats(PydanticObjectId(chapter_id))
        
        # Update course stats
        course.total_lessons += 1
        if lesson.video:
            course.total_duration += lesson.video.duration // 60
        await course.save()
        
        return lesson
    
    @staticmethod
    async def get_lessons_by_chapter(
        chapter_id: str,
        user_id: Optional[str] = None
    ) -> List[Lesson]:
        """Get all lessons for a chapter."""
        # Verify chapter exists
        chapter = await Chapter.get(PydanticObjectId(chapter_id))
        if not chapter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chapter not found"
            )
        
        # Get lessons sorted by order
        lessons = await Lesson.find(
            Lesson.chapter_id == PydanticObjectId(chapter_id)
        ).sort("order").to_list()
        
        # Add unlock status and progress for authenticated users
        if user_id:
            # Get progress data for all lessons
            progress_data = await Progress.find({
                "user_id": user_id,
                "lesson_id": {"$in": [str(lesson.id) for lesson in lessons]}
            }).to_list()
            
            # Create progress map for quick lookup
            progress_map = {str(p.lesson_id): p for p in progress_data}
            
            # Check if previous lessons are completed
            for i, lesson in enumerate(lessons):
                lesson_progress = progress_map.get(str(lesson.id))
                
                # Add progress data to lesson (as extra field)
                lesson.progress = {
                    "is_unlocked": i == 0 or (i > 0 and lessons[i-1].progress.get("is_completed", False)),
                    "is_completed": lesson_progress.video_progress.is_completed if lesson_progress else False,
                    "watch_percentage": lesson_progress.video_progress.watch_percentage if lesson_progress else 0,
                    "current_position": lesson_progress.video_progress.current_position if lesson_progress else 0,
                    "quiz_passed": lesson_progress.quiz_progress.is_passed if lesson_progress and lesson.has_quiz else None
                }
        
        return lessons
    
    @staticmethod
    async def get_lessons_by_course(
        course_id: str,
        user_id: Optional[str] = None
    ) -> List[Lesson]:
        """Get all lessons for a course."""
        # Verify course exists
        course = await Course.get(PydanticObjectId(course_id))
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        # Get lessons sorted by chapter and order
        lessons = await Lesson.find(
            Lesson.course_id == PydanticObjectId(course_id)
        ).sort([("chapter_id", 1), ("order", 1)]).to_list()
        
        return lessons
    
    @staticmethod
    async def get_lesson_detail(
        lesson_id: str,
        user_id: Optional[str] = None
    ) -> Lesson:
        """Get lesson details."""
        lesson = await Lesson.get(PydanticObjectId(lesson_id))
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        # Check if user has access to this lesson
        if user_id:
            # Check enrollment
            enrollment = await Enrollment.find_one({
                "user_id": user_id,
                "course_id": str(lesson.course_id),
                "is_active": True
            })
            
            if not enrollment:
                # Check if course is free or user has special access
                course = await Course.get(lesson.course_id)
                if not (course and course.pricing.is_free):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You are not enrolled in this course"
                    )
            
            # Add progress data for authenticated users
            progress = await Progress.find_one({
                "user_id": user_id,
                "lesson_id": lesson_id
            })
            
            # Add progress as extra field
            lesson.progress = {
                "is_completed": progress.video_progress.is_completed if progress else False,
                "watch_percentage": progress.video_progress.watch_percentage if progress else 0,
                "current_position": progress.video_progress.current_position if progress else 0,
                "quiz_attempts": len(progress.quiz_progress.attempts) if progress and progress.quiz_progress else 0,
                "quiz_best_score": progress.quiz_progress.best_score if progress and progress.quiz_progress else 0,
                "quiz_passed": progress.quiz_progress.is_passed if progress and progress.quiz_progress else False
            }
        
        return lesson
    
    @staticmethod
    async def update_lesson(
        lesson_id: str,
        lesson_update: LessonUpdate,
        user_id: str
    ) -> Lesson:
        """Update a lesson."""
        # Get lesson
        lesson = await Lesson.get(PydanticObjectId(lesson_id))
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        # Verify permissions
        course = await Course.get(lesson.course_id)
        if str(course.creator_id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only course creator can update lessons"
            )
        
        # Track duration change for course stats
        old_duration = lesson.video.duration if lesson.video else 0
        
        # Update fields
        update_data = lesson_update.dict(exclude_unset=True)
        
        # Handle nested objects
        if "video" in update_data and update_data["video"]:
            lesson.video = VideoContent(**update_data["video"])
        if "resources" in update_data:
            lesson.resources = update_data["resources"]
        if "unlock_conditions" in update_data:
            lesson.unlock_conditions = UnlockConditions(**update_data["unlock_conditions"])
        
        # Update simple fields
        for field in ["title", "description", "order", "content", "status"]:
            if field in update_data:
                setattr(lesson, field, update_data[field])
        
        await lesson.save()
        
        # Update chapter stats if needed
        await chapter_service.update_chapter_stats(lesson.chapter_id)
        
        # Update course duration if video duration changed
        new_duration = lesson.video.duration if lesson.video else 0
        if old_duration != new_duration:
            duration_diff = (new_duration - old_duration) // 60
            course.total_duration += duration_diff
            await course.save()
        
        return lesson
    
    @staticmethod
    async def delete_lesson(
        lesson_id: str,
        user_id: str
    ) -> dict:
        """Delete a lesson."""
        # Get lesson
        lesson = await Lesson.get(PydanticObjectId(lesson_id))
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        # Verify permissions
        course = await Course.get(lesson.course_id)
        if str(course.creator_id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only course creator can delete lessons"
            )
        
        # Delete lesson
        await lesson.delete()
        
        # Update chapter stats
        await chapter_service.update_chapter_stats(lesson.chapter_id)
        
        # Update course stats
        course.total_lessons -= 1
        if lesson.video:
            course.total_duration -= lesson.video.duration // 60
        await course.save()
        
        # TODO: Delete associated progress records
        
        # Reorder remaining lessons
        remaining_lessons = await Lesson.find(
            Lesson.chapter_id == lesson.chapter_id,
            Lesson.order > lesson.order
        ).to_list()
        
        for ls in remaining_lessons:
            ls.order -= 1
            await ls.save()
        
        return {"message": "Lesson deleted successfully"}
    
    @staticmethod
    async def reorder_lessons(
        chapter_id: str,
        reorder_data: LessonReorder,
        user_id: str
    ) -> List[Lesson]:
        """Reorder lessons within a chapter."""
        # Verify chapter
        chapter = await Chapter.get(PydanticObjectId(chapter_id))
        if not chapter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chapter not found"
            )
        
        # Verify permissions
        course = await Course.get(chapter.course_id)
        if str(course.creator_id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only course creator can reorder lessons"
            )
        
        # Update lesson orders
        for item in reorder_data.lesson_orders:
            lesson = await Lesson.get(PydanticObjectId(item["lesson_id"]))
            if lesson and lesson.chapter_id == PydanticObjectId(chapter_id):
                lesson.order = item["order"]
                await lesson.save()
        
        # Return updated lessons
        lessons = await Lesson.find(
            Lesson.chapter_id == PydanticObjectId(chapter_id)
        ).sort("order").to_list()
        
        return lessons
    
    @staticmethod
    async def upload_video(
        lesson_id: str,
        video_data: dict,
        user_id: str
    ) -> Lesson:
        """Handle video upload for a lesson."""
        # Get lesson
        lesson = await Lesson.get(PydanticObjectId(lesson_id))
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        # Verify permissions
        course = await Course.get(lesson.course_id)
        if str(course.creator_id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only course creator can upload videos"
            )
        
        # Update video info
        old_duration = lesson.video.duration if lesson.video else 0
        lesson.video = VideoContent(**video_data)
        await lesson.save()
        
        # Update chapter and course stats
        await chapter_service.update_chapter_stats(lesson.chapter_id)
        
        new_duration = lesson.video.duration
        if old_duration != new_duration:
            duration_diff = (new_duration - old_duration) // 60
            course.total_duration += duration_diff
            await course.save()
        
        return lesson

    async def reorder_lesson(self, lesson_id: str, new_order: int, user_id: str) -> None:
        """Reorder a lesson within its chapter."""
        # Get the lesson
        lesson = await Lesson.get(lesson_id)
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        # Verify permissions
        course = await Course.get(lesson.course_id)
        if str(course.creator_id) != user_id and user_id != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only course creator can reorder lessons"
            )
        
        old_order = lesson.order
        
        # If the order hasn't changed, do nothing
        if old_order == new_order:
            return
        
        # Get all lessons in the same chapter
        lessons = await Lesson.find(
            Lesson.chapter_id == lesson.chapter_id
        ).to_list()
        
        # Sort lessons by current order
        lessons.sort(key=lambda x: x.order)
        
        # Reorder lessons
        if old_order < new_order:
            # Moving down: shift other lessons up
            for l in lessons:
                if old_order < l.order <= new_order:
                    l.order -= 1
                    await l.save()
        else:
            # Moving up: shift other lessons down
            for l in lessons:
                if new_order <= l.order < old_order:
                    l.order += 1
                    await l.save()
        
        # Update the lesson's order
        lesson.order = new_order
        await lesson.save()


# Create service instance
lesson_service = LessonService()