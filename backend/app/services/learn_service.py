"""
Learn page service - Smart Backend implementation.
Consolidates all learn page data fetching into single optimized service.
"""
import asyncio
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from fastapi import HTTPException, status
from beanie import PydanticObjectId

from app.models.course import Course
from app.models.lesson import Lesson
from app.models.chapter import Chapter
from app.models.progress import Progress
from app.models.enrollment import Enrollment
from app.models.user import User
from app.schemas.learn import (
    LearnPageResponse, CourseSchema, LessonSchema, ChapterSchema,
    EnrollmentSchema, LessonProgressSchema, VideoProgressSchema,
    QuizProgressSchema, CourseProgressSchema, NavigationInfoSchema,
    VideoContentSchema, ResourceSchema, UpdateProgressRequest,
    ProgressUpdateResponse
)
from app.core.exceptions import NotFoundError, ForbiddenError


class LearnService:
    """
    Smart Backend service for learn page data consolidation.
    Replaces 7 frontend API calls with single optimized backend endpoint.
    """

    @staticmethod
    async def get_learn_page_data(
        course_id: str,
        lesson_id: str,
        user_id: Optional[str] = None
    ) -> LearnPageResponse:
        """
        FULL VERSION - Consolidated learn page data fetching.
        Smart Backend: Fetches all required data in parallel with proper error handling.
        """
        try:
            # Phase 1: Validate course and lesson exist  
            course_obj_id = PydanticObjectId(course_id)
            lesson_obj_id = PydanticObjectId(lesson_id)
            
            course = await Course.get(course_obj_id)
            lesson = await Lesson.get(lesson_obj_id)
            
            if not course:
                raise NotFoundError(f"Course {course_id} not found")
            
            # If lesson not found, try to find next available lesson for enrolled users
            if not lesson and user_id:
                # Check if user is enrolled
                enrollment = await Enrollment.find_one({
                    "user_id": user_id,
                    "course_id": course_id,
                    "is_active": True
                })
                
                if enrollment:
                    # User is enrolled, find next incomplete lesson
                    next_lesson_id = await LearnService._find_first_incomplete_lesson(course_id, user_id)
                    
                    if next_lesson_id:
                        # Found a lesson to redirect to
                        lesson_obj_id = PydanticObjectId(next_lesson_id)
                        lesson = await Lesson.get(lesson_obj_id)
                        lesson_id = next_lesson_id  # Update lesson_id for rest of the flow
                        logger.info(f"Redirected from deleted lesson to {next_lesson_id}")
                    else:
                        # No incomplete lessons found, get first lesson of course
                        first_chapter = await Chapter.find_one(
                            {"course_id": course_obj_id, "status": "published"},
                            sort=[("order", 1)]
                        )
                        if first_chapter:
                            first_lesson = await Lesson.find_one(
                                {"chapter_id": first_chapter.id, "status": "published"},
                                sort=[("order", 1)]
                            )
                            if first_lesson:
                                lesson = first_lesson
                                lesson_id = str(first_lesson.id)
                                logger.info(f"Redirected to first lesson {lesson_id}")
            
            # If still no lesson found, raise error
            if not lesson:
                raise NotFoundError(f"Lesson {lesson_id} not found")
            
            # Verify lesson belongs to course
            if str(lesson.course_id) != course_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Lesson does not belong to this course"
                )
            
            # Phase 2: Parallel data fetching for optimal performance
            tasks = [
                LearnService._fetch_chapters_with_lessons(course_id),
            ]
            
            # Add user-specific data fetching if authenticated
            if user_id:
                tasks.append(LearnService._fetch_user_data(course_id, user_id))
            else:
                # Create a simple async function that returns guest data
                async def get_guest_data():
                    return LearnService._create_guest_data()
                tasks.append(get_guest_data())
            
            # Execute all data fetching in parallel
            chapters_data, user_data = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Handle fetch errors gracefully
            if isinstance(chapters_data, Exception):
                logger.warning(f"Failed to fetch chapters: {chapters_data}")
                chapters_data = []
            if isinstance(user_data, Exception):
                logger.warning(f"Failed to fetch user data: {user_data}")
                user_data = LearnService._create_guest_data()
            
            # Phase 3: Data serialization and enrichment
            serialized_course = LearnService._serialize_course(course)

            # Enrich chapters and lessons with progress data
            enriched_chapters = await LearnService._enrich_chapters_with_progress(
                chapters_data, user_data['progress_map'], user_id, course
            )
            
            # Enrich current lesson with progress
            current_lesson = await LearnService._enrich_lesson_with_progress(
                lesson, user_data['progress_map'], user_id
            )
            
            # Calculate navigation context
            navigation = LearnService._calculate_navigation(lesson, enriched_chapters)
            
            # Build comprehensive response
            response = LearnPageResponse(
                course=serialized_course,
                current_lesson=current_lesson,
                chapters=enriched_chapters,
                enrollment=user_data['enrollment'],
                user_progress=user_data['progress_map'],
                navigation=navigation,
                is_preview_mode=user_data['is_preview_mode'],
                total_watch_time_minutes=user_data['total_watch_time_minutes'],
                data_sources=['course', 'lesson', 'chapters', 'enrollment', 'progress']
            )
            
            return response
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to load learn page data: {str(e)}"
            )

    @staticmethod
    async def _fetch_chapters_with_lessons(course_id: str) -> List[Dict]:
        """Fetch all chapters with lessons for the course."""
        course_obj_id = PydanticObjectId(course_id)
        
        # Get chapters sorted by order
        chapters = await Chapter.find(
            Chapter.course_id == course_obj_id
        ).sort("order").to_list()
        
        if not chapters:
            return []
        
        # Get all lessons for all chapters in parallel
        chapter_ids = [chapter.id for chapter in chapters]
        lessons = await Lesson.find(
            {"chapter_id": {"$in": chapter_ids}}
        ).sort([("chapter_id", 1), ("order", 1)]).to_list()
        
        # Group lessons by chapter
        lessons_by_chapter = {}
        for lesson in lessons:
            chapter_id = str(lesson.chapter_id)
            if chapter_id not in lessons_by_chapter:
                lessons_by_chapter[chapter_id] = []
            lessons_by_chapter[chapter_id].append(lesson)
        
        # Build chapter data structure
        chapters_data = []
        for chapter in chapters:
            chapter_lessons = lessons_by_chapter.get(str(chapter.id), [])
            chapters_data.append({
                'chapter': chapter,
                'lessons': chapter_lessons
            })
        
        return chapters_data

    @staticmethod
    async def _fetch_user_data(course_id: str, user_id: str) -> Dict:
        """Fetch user-specific data (enrollment, progress)."""
        # Note: Enrollment and Progress models store IDs as strings, not ObjectIds
        
        # Parallel fetch of enrollment and progress data
        enrollment, progress_list = await asyncio.gather(
            Enrollment.find_one({
                "user_id": user_id,  # Use string ID to match model
                "course_id": course_id,  # Use string ID to match model
                "is_active": True
            }),
            Progress.find({
                "user_id": user_id,  # Use string ID to match how progress is saved
                "course_id": course_id
            }).to_list(),
            return_exceptions=True
        )
        
        # Handle errors gracefully
        if isinstance(enrollment, Exception):
            enrollment = None
        if isinstance(progress_list, Exception):
            progress_list = []
        
        # Update enrollment last_accessed when learn page is loaded
        if enrollment:
            enrollment.last_accessed = datetime.utcnow()
            enrollment.updated_at = datetime.utcnow()
            
            # Recalculate progress to ensure it reflects current course structure
            # (e.g., if lessons changed from published to draft)
            from app.services.progress_service import progress_service
            await progress_service.calculate_course_completion(course_id, user_id)
            
            # Refresh enrollment to get updated progress
            enrollment = await Enrollment.find_one({
                "user_id": user_id,
                "course_id": course_id,
                "is_active": True
            })
        
        # Create progress map for quick lookup
        progress_map = {}
        total_watch_time = 0
        
        for progress in progress_list:
            try:
                lesson_id_key = str(progress.lesson_id)
                progress_map[lesson_id_key] = LearnService._serialize_lesson_progress(progress)
                if progress.video_progress:
                    total_watch_time += progress.video_progress.total_watch_time or 0
                
            except Exception as e:
                # Skip problematic progress entries
                logger.warning(f"Skipped progress entry due to error: {e}")
                continue
        
        return {
            'enrollment': await LearnService._serialize_enrollment(enrollment, user_id) if enrollment else None,
            'progress_map': progress_map,
            'is_preview_mode': enrollment is None,
            'total_watch_time_minutes': round(total_watch_time / 60, 1)
        }

    @staticmethod
    def _create_guest_data() -> Dict:
        """Create default data structure for guest users."""
        return {
            'enrollment': None,
            'progress_map': {},
            'is_preview_mode': True,
            'total_watch_time_minutes': 0
        }

    @staticmethod
    async def _enrich_lesson_with_progress(
        lesson: Lesson,
        progress_map: Dict[str, LessonProgressSchema],
        user_id: Optional[str]
    ) -> LessonSchema:
        """Enrich lesson data with user progress."""
        # Serialize basic lesson data
        lesson_data = LearnService._serialize_lesson(lesson)
        
        # Add progress data if available
        if user_id and str(lesson.id) in progress_map:
            lesson_data.progress = progress_map[str(lesson.id)]
        
        return lesson_data

    @staticmethod
    async def _enrich_chapters_with_progress(
        chapters_data: List[Dict],
        progress_map: Dict[str, LessonProgressSchema],
        user_id: Optional[str],
        course: Course
    ) -> List[ChapterSchema]:
        """Enrich chapters and lessons with user progress."""
        enriched_chapters = []
        
        for chapter_data in chapters_data:
            chapter = chapter_data['chapter']
            lessons = chapter_data['lessons']
            
            # Serialize lessons with progress
            enriched_lessons = []
            completed_count = 0
            published_count = 0  # Count only published lessons
            
            for i, lesson in enumerate(lessons):
                lesson_schema = LearnService._serialize_lesson(lesson)
                
                # Count published lessons
                if lesson.status == "published":
                    published_count += 1
                
                # Add progress data if available
                if user_id and str(lesson.id) in progress_map:
                    lesson_schema.progress = progress_map[str(lesson.id)]
                    if lesson_schema.progress.is_completed:
                        completed_count += 1
                else:
                    # Default progress for guest users or lessons without progress
                    # Check if this lesson should be unlocked based on previous lesson completion
                    should_unlock = False
                    if not course.sequential_learning_enabled or not user_id:  # Free learning mode or Guest mode - all unlocked
                        should_unlock = True
                    elif i == 0:  # First lesson in chapter
                        # Check if this is the first chapter or previous chapter is completed
                        if enriched_chapters:  # Not the first chapter
                            # Check if last lesson of previous chapter is completed
                            prev_chapter_lessons = enriched_chapters[-1].lessons
                            if prev_chapter_lessons and prev_chapter_lessons[-1].progress:
                                should_unlock = prev_chapter_lessons[-1].progress.is_completed
                            else:
                                should_unlock = False
                        else:  # First chapter, first lesson
                            should_unlock = True
                    else:  # Not first lesson in chapter
                        # Check if previous lesson in same chapter is completed
                        if i > 0 and enriched_lessons and enriched_lessons[-1].progress:
                            should_unlock = enriched_lessons[-1].progress.is_completed
                    
                    lesson_schema.progress = LessonProgressSchema(
                        lesson_id=str(lesson.id),
                        is_unlocked=should_unlock,
                        is_completed=False,
                        video_progress=VideoProgressSchema()
                    )
                
                enriched_lessons.append(lesson_schema)
            
            # Create chapter schema
            chapter_schema = ChapterSchema(
                id=str(chapter.id),
                title=chapter.title,
                description=chapter.description,
                order=chapter.order,
                lessons=enriched_lessons,
                total_lessons=published_count,  # Use published count instead of all lessons
                completed_lessons=completed_count,
                status=chapter.status,
                created_at=chapter.created_at,
                updated_at=chapter.updated_at
            )
            
            enriched_chapters.append(chapter_schema)
        
        return enriched_chapters

    @staticmethod
    def _calculate_navigation(lesson: Lesson, chapters: List[ChapterSchema]) -> NavigationInfoSchema:
        """Calculate navigation context for current lesson."""
        current_chapter = None
        current_chapter_index = -1
        current_lesson_index = -1
        
        # Find current lesson position
        for chapter_idx, chapter in enumerate(chapters):
            for lesson_idx, chapter_lesson in enumerate(chapter.lessons):
                if chapter_lesson.id == str(lesson.id):
                    current_chapter = chapter
                    current_chapter_index = chapter_idx
                    current_lesson_index = lesson_idx
                    break
            if current_chapter:
                break
        
        if not current_chapter:
            # Fallback navigation
            return NavigationInfoSchema(
                current_lesson_order=lesson.order,
                total_lessons_in_chapter=1,
                current_chapter_order=1,
                total_chapters=len(chapters)
            )
        
        # Calculate navigation state
        has_previous = current_lesson_index > 0 or current_chapter_index > 0
        has_next = (current_lesson_index < len(current_chapter.lessons) - 1 or 
                   current_chapter_index < len(chapters) - 1)
        
        # Find previous and next lesson IDs
        previous_lesson_id = None
        next_lesson_id = None
        
        if current_lesson_index > 0:
            # Previous lesson in same chapter
            previous_lesson_id = current_chapter.lessons[current_lesson_index - 1].id
        elif current_chapter_index > 0:
            # Last lesson of previous chapter
            prev_chapter = chapters[current_chapter_index - 1]
            if prev_chapter.lessons:
                previous_lesson_id = prev_chapter.lessons[-1].id
        
        if current_lesson_index < len(current_chapter.lessons) - 1:
            # Next lesson in same chapter
            next_lesson_id = current_chapter.lessons[current_lesson_index + 1].id
        elif current_chapter_index < len(chapters) - 1:
            # First lesson of next chapter
            next_chapter = chapters[current_chapter_index + 1]
            if next_chapter.lessons:
                next_lesson_id = next_chapter.lessons[0].id
        
        return NavigationInfoSchema(
            current_lesson_order=lesson.order,
            total_lessons_in_chapter=len(current_chapter.lessons),
            current_chapter_order=current_chapter.order,
            total_chapters=len(chapters),
            previous_lesson_id=previous_lesson_id,
            next_lesson_id=next_lesson_id,
            can_navigate_previous=has_previous,
            can_navigate_next=has_next
        )

    @staticmethod
    def _serialize_course(course: Course) -> CourseSchema:
        """Serialize course data following existing patterns."""
        # Follow existing pattern: dict() then set id field
        course_dict = course.dict()
        course_dict["id"] = str(course.id)
        
        # Map fields that don't match schema exactly
        course_dict["thumbnail_url"] = course.thumbnail
        course_dict["difficulty_level"] = course.level.value if hasattr(course.level, 'value') else str(course.level)
        course_dict["tags"] = []  # No tags field in model
        course_dict["is_free"] = course.pricing.is_free if course.pricing else False
        
        return CourseSchema(**course_dict)

    @staticmethod
    def _serialize_lesson(lesson: Lesson) -> LessonSchema:
        """Serialize lesson data following existing patterns."""
        # Follow existing pattern: dict() then set id field
        lesson_dict = lesson.dict()
        lesson_dict["id"] = str(lesson.id)
        
        # Handle video content serialization
        if lesson.video:
            lesson_dict["video"] = {
                "youtube_url": str(lesson.video.youtube_url) if lesson.video.youtube_url else None,
                "duration": lesson.video.duration,
                "thumbnail_url": getattr(lesson.video, 'thumbnail_url', None),
                "title": getattr(lesson.video, 'title', None),
                "description": getattr(lesson.video, 'description', None)
            }
        
        # Handle resources serialization
        if lesson.resources:
            resources = []
            for resource in lesson.resources:
                if isinstance(resource, dict):
                    resources.append(resource)
                else:
                    resources.append({
                        "title": getattr(resource, 'title', ''),
                        "url": getattr(resource, 'url', ''),
                        "type": getattr(resource, 'type', 'link'),
                        "description": getattr(resource, 'description', None)
                    })
            lesson_dict["resources"] = resources
        else:
            lesson_dict["resources"] = []
        
        # Set quiz fields from lesson data
        lesson_dict["has_quiz"] = lesson.has_quiz if hasattr(lesson, 'has_quiz') else False
        lesson_dict["quiz_required"] = False
        
        return LessonSchema(**lesson_dict)

    @staticmethod
    async def _serialize_enrollment(enrollment: Enrollment, user_id: str) -> EnrollmentSchema:
        """Serialize enrollment data following existing patterns."""
        # Get smart continue_lesson_id
        continue_lesson_id = await LearnService._get_smart_continue_lesson_id(
            enrollment, user_id, str(enrollment.course_id)
        )
        
        course_progress = CourseProgressSchema(
            total_lessons=enrollment.progress.total_lessons or 0,
            completed_lessons=enrollment.progress.lessons_completed or 0,
            completion_percentage=enrollment.progress.completion_percentage or 0.0,
            is_completed=enrollment.progress.is_completed or False,
            current_lesson_id=enrollment.progress.current_lesson_id,
            continue_lesson_id=continue_lesson_id,
            last_accessed=enrollment.last_accessed,
            completed_at=enrollment.progress.completed_at
        )
        
        return EnrollmentSchema(
            id=str(enrollment.id),
            user_id=str(enrollment.user_id),
            course_id=str(enrollment.course_id),
            is_active=enrollment.is_active,
            enrolled_at=enrollment.enrolled_at,
            progress=course_progress,
            access_type="full",  # Default access type
            expires_at=getattr(enrollment, 'expires_at', None),
            enrollment_type=enrollment.enrollment_type.value if enrollment.enrollment_type else None
        )

    @staticmethod
    def _serialize_lesson_progress(progress: Progress) -> LessonProgressSchema:
        """Serialize lesson progress data following existing patterns."""
        video_progress = VideoProgressSchema(
            watch_percentage=progress.video_progress.watch_percentage or 0.0,
            current_position=progress.video_progress.current_position or 0.0,
            total_watch_time=progress.video_progress.total_watch_time or 0,
            is_completed=progress.video_progress.is_completed or False,
            completed_at=progress.video_progress.completed_at
        )
        
        quiz_progress = None
        if hasattr(progress, 'quiz_progress') and progress.quiz_progress:
            quiz_progress = QuizProgressSchema(
                attempts=len(progress.quiz_progress.attempts) if progress.quiz_progress.attempts else 0,
                best_score=progress.quiz_progress.best_score or 0.0,
                is_passed=progress.quiz_progress.is_passed or False,
                last_attempt_at=getattr(progress.quiz_progress, 'last_attempt_at', None)
            )
        
        return LessonProgressSchema(
            lesson_id=str(progress.lesson_id),
            is_unlocked=progress.is_unlocked or False,
            is_completed=progress.is_completed or False,
            video_progress=video_progress,
            quiz_progress=quiz_progress,
            started_at=progress.started_at,
            completed_at=progress.completed_at
        )

    @staticmethod
    async def update_lesson_progress(
        course_id: str,
        user_id: str,
        progress_data: UpdateProgressRequest
    ) -> ProgressUpdateResponse:
        """
        Update lesson progress with optimistic response.
        Smart Backend: Handles business logic and notifications.
        """
        try:
            # Import progress service to leverage existing logic
            from app.services.progress_service import progress_service
            
            # Update progress using existing service
            updated_progress = await progress_service.update_video_progress(
                lesson_id=progress_data.lesson_id,
                user_id=user_id,
                watch_percentage=progress_data.watch_percentage,
                current_position=progress_data.current_position
            )
            
            # Check if lesson was just completed
            lesson_completed = (
                progress_data.watch_percentage >= 95 and 
                updated_progress.video_progress.is_completed
            )
            
            # Check if course was completed
            course_completion = await progress_service.calculate_course_completion(course_id, user_id)
            course_completed = course_completion['is_completed']
            
            # Find next unlocked lesson if current lesson was completed
            next_lesson_unlocked = None
            if lesson_completed:
                # This would be implemented based on existing unlock logic
                pass
            
            # Serialize progress for response
            serialized_progress = LearnService._serialize_lesson_progress(updated_progress)
            
            return ProgressUpdateResponse(
                updated=True,
                lesson_completed=lesson_completed,
                course_completed=course_completed,
                next_lesson_unlocked=next_lesson_unlocked,
                updated_progress=serialized_progress
            )
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update progress: {str(e)}"
            )

    @staticmethod
    async def _get_smart_continue_lesson_id(
        enrollment: Enrollment, 
        user_id: str, 
        course_id: str
    ) -> Optional[str]:
        """
        Get the smart continue lesson ID.
        Returns the current lesson if not completed, otherwise finds the next incomplete lesson.
        Handles multi-chapter scenarios properly.
        Validates lesson still exists to handle deleted lessons gracefully.
        """
        # If has current_lesson_id, check if lesson still exists and is not completed
        if enrollment.progress.current_lesson_id:
            # First verify the lesson still exists in database
            try:
                lesson_obj_id = PydanticObjectId(enrollment.progress.current_lesson_id)
                lesson_exists = await Lesson.get(lesson_obj_id)
                
                if lesson_exists:
                    # Lesson exists, check if it's completed
                    progress = await Progress.find_one({
                        "lesson_id": enrollment.progress.current_lesson_id,
                        "user_id": user_id
                    })
                    
                    if not progress or not progress.is_completed:
                        # Current lesson exists and not completed, continue with it
                        return enrollment.progress.current_lesson_id
            except Exception as e:
                # Invalid lesson ID or other error, fallback to finding next lesson
                logger.warning(f"Current lesson {enrollment.progress.current_lesson_id} not found: {e}")
        
        # Current lesson is completed, deleted, or no current lesson - find next incomplete
        return await LearnService._find_first_incomplete_lesson(course_id, user_id)
    
    @staticmethod
    async def _find_first_incomplete_lesson(course_id: str, user_id: str) -> Optional[str]:
        """
        Find the first incomplete lesson in the course.
        Properly handles multi-chapter courses by iterating through chapters in order.
        """
        # Convert course_id to ObjectId for MongoDB query
        course_obj_id = PydanticObjectId(course_id) if isinstance(course_id, str) else course_id
        
        # Get all published chapters sorted by order
        chapters = await Chapter.find({
            "course_id": course_obj_id,
            "status": "published"
        }).sort([("order", 1)]).to_list()
        
        # Iterate through each chapter in order
        for chapter in chapters:
            # Get all published lessons in this chapter sorted by order
            lessons = await Lesson.find({
                "chapter_id": chapter.id,
                "status": "published"
            }).sort([("order", 1)]).to_list()
            
            # Check each lesson in the chapter
            for lesson in lessons:
                # Check if this lesson has progress
                progress = await Progress.find_one({
                    "lesson_id": str(lesson.id),
                    "user_id": user_id
                })
                
                # Found an incomplete lesson - return it
                if not progress or not progress.is_completed:
                    return str(lesson.id)
        
        # All lessons completed - return last lesson for review
        return await LearnService._find_last_lesson_in_course(course_id)
    
    @staticmethod
    async def _find_last_lesson_in_course(course_id: str) -> Optional[str]:
        """
        Find the last lesson in the course for review purposes.
        Returns the lesson with the highest order in the last chapter.
        """
        # Convert course_id to ObjectId for MongoDB query
        course_obj_id = PydanticObjectId(course_id) if isinstance(course_id, str) else course_id
        
        # Get last published chapter (highest order)
        chapters = await Chapter.find({
            "course_id": course_obj_id,
            "status": "published"
        }).sort([("order", -1)]).limit(1).to_list()
        
        if not chapters:
            return None
            
        last_chapter = chapters[0]
        
        # Get last published lesson in the last chapter
        lessons = await Lesson.find({
            "chapter_id": last_chapter.id,
            "status": "published"
        }).sort([("order", -1)]).limit(1).to_list()
        
        if lessons:
            return str(lessons[0].id)
            
        return None


# Create service instance
learn_service = LearnService()