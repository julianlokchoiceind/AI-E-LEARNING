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
        
        # Get user to check role
        from app.models.user import User
        user = await User.get(PydanticObjectId(user_id))
        
        # Allow admin or course creator to add lessons
        if user.role != "admin" and str(course.creator_id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only course creator or admin can add lessons"
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
        if lesson.video and lesson.video.duration:
            course.total_duration += lesson.video.duration // 60
        await course.save()
        
        return lesson
    
    @staticmethod
    async def get_lessons_by_chapter(
        chapter_id: str,
        user_id: Optional[str] = None
    ) -> List[dict]:
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
        
        # Convert to dict and add progress for authenticated users
        result = []
        progress_map = {}
        
        if user_id:
            # Get progress data for all lessons
            progress_data = await Progress.find({
                "user_id": user_id,
                "lesson_id": {"$in": [str(lesson.id) for lesson in lessons]}
            }).to_list()
            
            # Create progress map for quick lookup
            progress_map = {str(p.lesson_id): p for p in progress_data}
        
        # Process each lesson
        for i, lesson in enumerate(lessons):
            lesson_progress = progress_map.get(str(lesson.id))
            
            # Convert lesson to dict
            lesson_dict = {
                "id": str(lesson.id),
                "_id": str(lesson.id),  # Frontend expects _id
                "chapter_id": str(lesson.chapter_id),
                "course_id": str(lesson.course_id),
                "title": lesson.title,
                "description": lesson.description or "",
                "order": lesson.order,
                "video": lesson.video.dict() if lesson.video else None,
                "content": lesson.content,
                "resources": lesson.resources or [],
                "has_quiz": lesson.has_quiz,  # Include has_quiz field from model
                "status": lesson.status,
                "created_at": lesson.created_at,
                "updated_at": lesson.updated_at
            }
            
            # Add progress data if user is authenticated
            if user_id:
                # Check if lesson is unlocked based on unlock conditions
                is_unlocked = True
                
                if i > 0 and lesson.unlock_conditions:
                    # Check previous lesson completion
                    if lesson.unlock_conditions.previous_lesson_id:
                        prev_lesson_progress = progress_map.get(str(lesson.unlock_conditions.previous_lesson_id))
                        if prev_lesson_progress:
                            # Check video completion
                            video_completed = prev_lesson_progress.video_progress.is_completed
                            # Check quiz requirement if enabled
                            quiz_passed = True
                            if lesson.unlock_conditions.quiz_pass_required and prev_lesson_progress.quiz_progress:
                                quiz_passed = prev_lesson_progress.quiz_progress.is_passed
                            is_unlocked = video_completed and quiz_passed
                        else:
                            is_unlocked = False
                
                lesson_dict["progress"] = {
                    "is_unlocked": is_unlocked,
                    "is_completed": lesson_progress.video_progress.is_completed if lesson_progress else False,
                    "watch_percentage": lesson_progress.video_progress.watch_percentage if lesson_progress else 0,
                    "current_position": lesson_progress.video_progress.current_position if lesson_progress else 0,
                    "quiz_passed": lesson_progress.quiz_progress.is_passed if lesson_progress and lesson_progress.quiz_progress else None
                }
            else:
                # Default progress for non-authenticated users
                lesson_dict["progress"] = {
                    "is_unlocked": True,  # All lessons unlocked for preview
                    "is_completed": False,
                    "watch_percentage": 0,
                    "current_position": 0,
                    "quiz_passed": None
                }
            
            result.append(lesson_dict)
        
        return result
    
    @staticmethod
    async def get_lessons_by_course(
        course_id: str,
        user_id: Optional[str] = None
    ) -> List[dict]:
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
        
        # Convert to dict and add progress for authenticated users
        result = []
        progress_map = {}
        
        if user_id:
            # Get progress data for all lessons
            progress_data = await Progress.find({
                "user_id": PydanticObjectId(user_id),
                "lesson_id": {"$in": [lesson.id for lesson in lessons]}
            }).to_list()
            
            # Create progress map for quick lookup
            progress_map = {str(p.lesson_id): p for p in progress_data}
        
        for lesson in lessons:
            # Convert lesson to dict
            lesson_dict = lesson.dict()
            lesson_dict["id"] = str(lesson.id)
            lesson_dict["course_id"] = str(lesson.course_id)
            lesson_dict["chapter_id"] = str(lesson.chapter_id)
            
            # Add progress data if available
            progress = progress_map.get(str(lesson.id))
            if progress:
                lesson_dict["is_unlocked"] = progress.is_unlocked
                lesson_dict["is_completed"] = progress.is_completed
                lesson_dict["progress_percentage"] = progress.progress_percentage
            else:
                lesson_dict["is_unlocked"] = None
                lesson_dict["is_completed"] = None
                lesson_dict["progress_percentage"] = None
            
            result.append(lesson_dict)
        
        return result
    
    @staticmethod
    async def get_lesson_detail(
        lesson_id: str,
        user_id: Optional[str] = None,
        user_role: Optional[str] = None
    ) -> dict:
        """Get lesson details."""
        lesson = await Lesson.get(PydanticObjectId(lesson_id))
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        # Check if user has access to this lesson
        if user_id:
            # Skip enrollment check for admin or course creator
            should_check_enrollment = True
            
            if user_role == "admin":
                # Admin can access any lesson
                should_check_enrollment = False
            elif user_role == "creator":
                # Check if user is the course creator
                course = await Course.get(lesson.course_id)
                if course and str(course.creator_id) == user_id:
                    should_check_enrollment = False
            
            # Only check enrollment for regular students
            if should_check_enrollment:
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
        
        # Convert lesson to dict to avoid Pydantic issues
        lesson_dict = {
            "id": str(lesson.id),
            "_id": str(lesson.id),  # Frontend expects _id
            "course_id": str(lesson.course_id),
            "chapter_id": str(lesson.chapter_id),
            "title": lesson.title,
            "description": lesson.description or "",
            "order": lesson.order,
            "video": lesson.video.dict() if lesson.video else None,
            "content": lesson.content,
            "resources": lesson.resources or [],
            "has_quiz": lesson.has_quiz,  # Include has_quiz field from model
            "unlock_conditions": lesson.unlock_conditions.dict() if lesson.unlock_conditions else {},
            "status": lesson.status,
            "created_at": lesson.created_at,
            "updated_at": lesson.updated_at
        }
        
        # Add progress data for authenticated users
        if user_id:
            progress = await Progress.find_one({
                "user_id": user_id,
                "lesson_id": lesson_id
            })
            
            lesson_dict["progress"] = {
                "is_completed": progress.video_progress.is_completed if progress else False,
                "watch_percentage": progress.video_progress.watch_percentage if progress else 0,
                "current_position": progress.video_progress.current_position if progress else 0,
                "quiz_attempts": len(progress.quiz_progress.attempts) if progress and progress.quiz_progress else 0,
                "quiz_best_score": progress.quiz_progress.best_score if progress and progress.quiz_progress else 0,
                "quiz_passed": progress.quiz_progress.is_passed if progress and progress.quiz_progress else False
            }
        
        return lesson_dict
    
    @staticmethod
    async def update_lesson(
        lesson_id: str,
        lesson_update: LessonUpdate,
        user_id: str
    ) -> Lesson:
        """Update a lesson with status validation."""
        # Get lesson
        lesson = await Lesson.get(PydanticObjectId(lesson_id))
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        # Verify permissions
        course = await Course.get(lesson.course_id)
        
        # Get user to check role
        from app.models.user import User
        user = await User.get(PydanticObjectId(user_id))
        
        # Allow admin or course creator to update lessons
        if user.role != "admin" and str(course.creator_id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only course creator or admin can update lessons"
            )
        
        # Handle status validation
        update_data = lesson_update.dict(exclude_unset=True)
        
        # Check if status is being updated
        if 'status' in update_data:
            new_status = update_data['status']
            old_status = lesson.status
            
            # Validate status transition
            if new_status == 'published' and old_status == 'draft':
                # Check if parent chapter is published
                chapter = await Chapter.get(lesson.chapter_id)
                if not chapter:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Chapter not found"
                    )
                
                if chapter.status != 'published':
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Cannot publish lesson: Parent chapter must be published first"
                    )
        
        # Track duration change for course stats
        old_duration = (lesson.video.duration or 0) if lesson.video else 0
        
        # Handle nested objects - SMART VIDEO HANDLING
        if "video" in update_data:
            video_data = update_data["video"]
            
            # Case 1: video is None or empty dict - DELETE video
            if not video_data or (isinstance(video_data, dict) and not any(video_data.values())):
                lesson.video = None
            
            # Case 2: video has data - UPDATE/CREATE video
            else:
                # Clean HTML entities from URLs before processing
                if isinstance(video_data, dict):
                    if "url" in video_data and video_data["url"]:
                        # Fix HTML entities (&amp; -> &, etc.)
                        import html
                        video_data["url"] = html.unescape(str(video_data["url"]))
                    
                    if "youtube_url" in video_data and video_data["youtube_url"]:
                        import html
                        # Convert to string first if it's HttpUrl
                        video_data["youtube_url"] = html.unescape(str(video_data["youtube_url"]))
                    
                    # Map frontend 'url' field to 'youtube_url' if needed
                    if "url" in video_data and not video_data.get("youtube_url"):
                        video_data["youtube_url"] = video_data["url"]
                
                # Create VideoContent object
                lesson.video = VideoContent(**video_data)
        if "resources" in update_data:
            # Convert resources to Resource objects
            from app.models.lesson import Resource
            resources_list = []
            for resource_data in update_data["resources"]:
                if isinstance(resource_data, dict):
                    resources_list.append(Resource(**resource_data))
                else:
                    resources_list.append(resource_data)
            lesson.resources = resources_list
        if "unlock_conditions" in update_data:
            lesson.unlock_conditions = UnlockConditions(**update_data["unlock_conditions"])
        
        # Update simple fields
        for field in ["title", "description", "order", "content", "status"]:
            if field in update_data:
                setattr(lesson, field, update_data[field])
        
        # Update timestamp to reflect changes
        from datetime import datetime
        lesson.updated_at = datetime.utcnow()
        
        await lesson.save()
        
        # Update chapter stats if needed
        await chapter_service.update_chapter_stats(lesson.chapter_id)
        
        # Update course duration if video duration changed
        new_duration = (lesson.video.duration or 0) if lesson.video else 0
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
        
        # Get user to check role
        from app.models.user import User
        user = await User.get(PydanticObjectId(user_id))
        
        # Allow admin or course creator to delete lessons
        if user.role != "admin" and str(course.creator_id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only course creator or admin can delete lessons"
            )
        
        # Delete lesson
        await lesson.delete()
        
        # Update chapter stats
        await chapter_service.update_chapter_stats(lesson.chapter_id)
        
        # Update course stats
        course.total_lessons -= 1
        if lesson.video and lesson.video.duration:
            course.total_duration -= lesson.video.duration // 60
        await course.save()
        
        # Delete associated progress records
        from app.models.progress import Progress
        from app.models.enrollment import Enrollment
        
        # Delete all progress records for this lesson
        deleted_progress = await Progress.find({
            "lesson_id": str(lesson.id)
        }).delete()
        
        # Update enrollments if this was the current lesson
        # Use batch update for better performance
        update_result = await Enrollment.collection.update_many(
            {
                "course_id": str(course.id),
                "progress.current_lesson_id": str(lesson.id)
            },
            {
                "$set": {"progress.current_lesson_id": None}
            }
        )
        
        # If any enrollments were updated, recalculate course completion
        if update_result.modified_count > 0:
            # Get unique user IDs from affected enrollments for progress recalculation
            affected_enrollments = await Enrollment.find({
                "course_id": str(course.id)
            }).to_list()
            
            from app.services.progress_service import progress_service
            unique_user_ids = set(enrollment.user_id for enrollment in affected_enrollments)
            
            # Update progress for each affected user
            for user_id in unique_user_ids:
                await progress_service.calculate_course_completion(str(course.id), user_id)
        
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
        old_duration = (lesson.video.duration or 0) if lesson.video else 0
        lesson.video = VideoContent(**video_data)
        await lesson.save()
        
        # Update chapter and course stats
        await chapter_service.update_chapter_stats(lesson.chapter_id)
        
        new_duration = lesson.video.duration or 0
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

    @staticmethod
    async def validate_lesson_status_change(
        lesson_id: str,
        new_status: str
    ) -> dict:
        """Validate if lesson status can be changed and return validation info."""
        lesson = await Lesson.get(PydanticObjectId(lesson_id))
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        # If trying to publish lesson
        if new_status == 'published' and lesson.status == 'draft':
            # Check if parent chapter is published
            chapter = await Chapter.get(lesson.chapter_id)
            if not chapter:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Chapter not found"
                )
            
            if chapter.status != 'published':
                return {
                    "can_change": False,
                    "warning": "Cannot publish lesson: Parent chapter must be published first",
                    "suggested_action": "Publish the chapter first, then publish this lesson"
                }
        
        return {
            "can_change": True,
            "warning": None,
            "suggested_action": None
        }
    
    @staticmethod
    async def get_lesson_by_id(lesson_id: str) -> Optional[Lesson]:
        """Get lesson by ID. Used for resource management."""
        try:
            return await Lesson.get(PydanticObjectId(lesson_id))
        except Exception:
            return None
    
    @staticmethod
    async def add_resource_to_lesson(
        lesson_id: str,
        resource: dict,
        user_id: str
    ) -> Lesson:
        """Add a resource to a lesson."""
        # Get lesson
        lesson = await Lesson.get(PydanticObjectId(lesson_id))
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        # Verify user permissions
        course = await Course.get(lesson.course_id)
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        # Get user to check role
        from app.models.user import User
        user = await User.get(PydanticObjectId(user_id))
        
        # Allow admin or course creator to add resources
        if user.role != "admin" and str(course.creator_id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only course creator or admin can add resources"
            )
        
        # Initialize resources list if None
        if lesson.resources is None:
            lesson.resources = []
        
        # Add resource to lesson
        lesson.resources.append(resource)
        
        # Save lesson
        await lesson.save()
        
        return lesson
    
    @staticmethod
    async def remove_resource_from_lesson(
        lesson_id: str,
        resource_index: int,
        user_id: str
    ) -> Lesson:
        """Remove a resource from a lesson by index."""
        # Get lesson
        lesson = await Lesson.get(PydanticObjectId(lesson_id))
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        # Verify user permissions
        course = await Course.get(lesson.course_id)
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        # Get user to check role
        from app.models.user import User
        user = await User.get(PydanticObjectId(user_id))
        
        # Allow admin or course creator to remove resources
        if user.role != "admin" and str(course.creator_id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only course creator or admin can remove resources"
            )
        
        # Check if resources exist
        if not lesson.resources or len(lesson.resources) == 0:
            raise ValueError("No resources found in lesson")
        
        # Check if index is valid
        if resource_index < 0 or resource_index >= len(lesson.resources):
            raise ValueError(f"Invalid resource index: {resource_index}")
        
        # Get resource to be deleted
        resource_to_delete = lesson.resources[resource_index]
        
        # Check if it's an uploaded file (not external URL)
        # Handle both object and dict formats
        url = None
        if isinstance(resource_to_delete, dict):
            url = resource_to_delete.get('url')
        elif hasattr(resource_to_delete, 'url'):
            url = resource_to_delete.url
            
        if url:
            # Check if it's a local upload (contains /uploads/ path)
            if '/uploads/' in url:
                try:
                    # Extract file path from URL
                    # URL format: http://localhost:8000/uploads/lesson-resources/filename.ext
                    # or just: /uploads/lesson-resources/filename.ext
                    import logging
                    logger = logging.getLogger(__name__)
                    
                    # Find the /uploads/ part and extract everything after it
                    uploads_index = url.find('/uploads/')
                    if uploads_index != -1:
                        # Get path after /uploads/ (e.g., lesson-resources/filename.ext)
                        file_path = url[uploads_index + len('/uploads/'):]
                        
                        # Get storage backend and delete file
                        from app.core.config import get_storage_backend
                        storage = get_storage_backend()
                        
                        # Try to delete the actual file
                        deleted = await storage.delete_file(file_path)
                        if deleted:
                            logger.info(f"Deleted file: {file_path}")
                        else:
                            logger.warning(f"Could not delete file (may not exist): {file_path}")
                except Exception as e:
                    # Log error but don't fail the resource removal
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error deleting file for resource: {e}")
        
        # Remove resource from list
        del lesson.resources[resource_index]
        
        # Save lesson
        await lesson.save()
        
        return lesson
    
    @staticmethod
    async def update_resource_in_lesson(
        lesson_id: str,
        resource_index: int,
        updated_resource: dict,
        user_id: str
    ) -> Lesson:
        """Update a resource in a lesson by index."""
        # Get lesson
        lesson = await Lesson.get(PydanticObjectId(lesson_id))
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        # Verify user permissions
        course = await Course.get(lesson.course_id)
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        # Get user to check role
        from app.models.user import User
        user = await User.get(PydanticObjectId(user_id))
        
        # Allow admin or course creator to update resources
        if user.role != "admin" and str(course.creator_id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only course creator or admin can update resources"
            )
        
        # Check if resources exist
        if not lesson.resources or len(lesson.resources) == 0:
            raise ValueError("No resources found in lesson")
        
        # Check if index is valid
        if resource_index < 0 or resource_index >= len(lesson.resources):
            raise ValueError(f"Invalid resource index: {resource_index}")
        
        # Update resource
        lesson.resources[resource_index] = updated_resource
        
        # Save lesson
        await lesson.save()
        
        return lesson


# Create service instance
lesson_service = LessonService()