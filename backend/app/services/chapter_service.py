"""
Service layer for chapter-related business logic.
"""
from typing import List, Optional
from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.models.chapter import Chapter
from app.models.course import Course
from app.models.lesson import Lesson
from app.schemas.chapter import ChapterCreate, ChapterUpdate, ChapterReorder


class ChapterService:
    """Service class for chapter operations."""
    
    @staticmethod
    async def create_chapter(
        course_id: str,
        chapter_data: ChapterCreate,
        user_id: str
    ) -> Chapter:
        """Create a new chapter in a course."""
        # Verify course exists and user has permission
        course = await Course.get(PydanticObjectId(course_id))
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        # Check if user is course creator or admin
        if str(course.creator_id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only course creator can add chapters"
            )
        
        # Auto-assign order if not provided
        if chapter_data.order is None:
            # Get the highest order number and add 1
            existing_chapters = await Chapter.find(
                Chapter.course_id == PydanticObjectId(course_id)
            ).sort("-order").limit(1).to_list()
            
            chapter_data.order = 1 if not existing_chapters else existing_chapters[0].order + 1
        
        # Create chapter
        chapter = Chapter(
            course_id=PydanticObjectId(course_id),
            title=chapter_data.title,
            description=chapter_data.description,
            order=chapter_data.order
        )
        
        await chapter.insert()
        
        # Update course chapter count
        course.total_chapters += 1
        await course.save()
        
        return chapter
    
    @staticmethod
    async def get_chapters_by_course(
        course_id: str,
        user_id: Optional[str] = None
    ) -> List[Chapter]:
        """Get all chapters for a course."""
        # Verify course exists
        course = await Course.get(PydanticObjectId(course_id))
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        # Get chapters sorted by order
        chapters = await Chapter.find(
            Chapter.course_id == PydanticObjectId(course_id)
        ).sort("order").to_list()
        
        return chapters
    
    @staticmethod
    async def get_chapter_detail(
        chapter_id: str,
        user_id: Optional[str] = None
    ) -> Chapter:
        """Get chapter details."""
        chapter = await Chapter.get(PydanticObjectId(chapter_id))
        if not chapter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chapter not found"
            )
        
        return chapter
    
    @staticmethod
    async def update_chapter(
        chapter_id: str,
        chapter_update: ChapterUpdate,
        user_id: str
    ) -> Chapter:
        """Update a chapter."""
        # Get chapter with course info
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
                detail="Only course creator can update chapters"
            )
        
        # Update fields
        update_data = chapter_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(chapter, field, value)
        
        await chapter.save()
        return chapter
    
    @staticmethod
    async def delete_chapter(
        chapter_id: str,
        user_id: str
    ) -> dict:
        """Delete a chapter and all its lessons."""
        # Get chapter
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
                detail="Only course creator can delete chapters"
            )
        
        # Delete all lessons in this chapter
        await Lesson.find(
            Lesson.chapter_id == PydanticObjectId(chapter_id)
        ).delete()
        
        # Delete chapter
        await chapter.delete()
        
        # Update course stats
        course.total_chapters -= 1
        await course.save()
        
        # Reorder remaining chapters
        remaining_chapters = await Chapter.find(
            Chapter.course_id == chapter.course_id,
            Chapter.order > chapter.order
        ).to_list()
        
        for ch in remaining_chapters:
            ch.order -= 1
            await ch.save()
        
        return {"message": "Chapter deleted successfully"}
    
    @staticmethod
    async def reorder_chapters(
        course_id: str,
        reorder_data: ChapterReorder,
        user_id: str
    ) -> List[Chapter]:
        """Reorder chapters within a course."""
        # Verify course and permissions
        course = await Course.get(PydanticObjectId(course_id))
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        if str(course.creator_id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only course creator can reorder chapters"
            )
        
        # Update chapter orders
        for item in reorder_data.chapter_orders:
            chapter = await Chapter.get(PydanticObjectId(item["chapter_id"]))
            if chapter and chapter.course_id == PydanticObjectId(course_id):
                chapter.order = item["order"]
                await chapter.save()
        
        # Return updated chapters
        chapters = await Chapter.find(
            Chapter.course_id == PydanticObjectId(course_id)
        ).sort("order").to_list()
        
        return chapters
    
    @staticmethod
    async def update_chapter_stats(chapter_id: PydanticObjectId) -> None:
        """Update chapter statistics (lesson count, duration)."""
        # Get all lessons in chapter
        lessons = await Lesson.find(
            Lesson.chapter_id == chapter_id
        ).to_list()
        
        # Calculate stats
        lesson_count = len(lessons)
        total_duration = sum(
            lesson.video.duration // 60 if lesson.video else 0
            for lesson in lessons
        )
        
        # Update chapter
        chapter = await Chapter.get(chapter_id)
        if chapter:
            chapter.lesson_count = lesson_count
            chapter.total_duration = total_duration
            await chapter.save()

    async def get_chapters_with_lessons(self, course_id: str) -> List[dict]:
        """Get all chapters for a course with lessons included."""
        from app.models.lesson import Lesson
        from beanie import PydanticObjectId
        
        # Convert to MongoDB ObjectId if needed
        if isinstance(course_id, str):
            course_id = PydanticObjectId(course_id)
        
        # Get all chapters for the course
        chapters = await Chapter.find(
            Chapter.course_id == course_id
        ).sort("+order").to_list()
        
        # Build result with lessons
        result = []
        for chapter in chapters:
            # Get lessons for this chapter
            lessons = await Lesson.find(
                Lesson.chapter_id == chapter.id
            ).sort("+order").to_list()
            
            # Convert chapter to dict
            chapter_dict = {
                "id": str(chapter.id),
                "course_id": str(chapter.course_id),
                "title": chapter.title,
                "description": chapter.description,
                "order": chapter.order,
                "lesson_count": chapter.lesson_count,
                "total_duration": chapter.total_duration,
                "status": chapter.status,
                "created_at": chapter.created_at,
                "updated_at": chapter.updated_at,
                "lessons": []
            }
            
            # Add lessons to chapter
            for lesson in lessons:
                lesson_dict = {
                    "_id": str(lesson.id),  # Frontend expects _id
                    "id": str(lesson.id),
                    "title": lesson.title,
                    "description": lesson.description or "",
                    "order": lesson.order,
                    "video_duration": lesson.video.get("duration", 0) if lesson.video else 0,
                    "has_quiz": False,  # Default - will be updated when quiz system is implemented
                    "status": lesson.status
                }
                chapter_dict["lessons"].append(lesson_dict)
            
            result.append(chapter_dict)
        
        return result


# Create service instance
chapter_service = ChapterService()