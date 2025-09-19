"""
Course service for business logic.
Based on CLAUDE.md course creation workflow.
"""
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from beanie import PydanticObjectId
from slugify import slugify
from app.models.course import Course, CourseCategory, CourseLevel, CourseStatus, Pricing
from app.models.user import User
from app.models.enrollment import Enrollment
from app.models.progress import Progress
from app.models.lesson import Lesson
from app.models.chapter import Chapter
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse
from app.core.exceptions import (
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    ValidationException
)
from app.core.performance import measure_performance
from app.services.learn_service import LearnService
import logging

logger = logging.getLogger(__name__)


class CourseService:
    """Service for course-related operations"""
    
    @staticmethod
    async def generate_course_title(user_id: str) -> str:
        """
        Generate course title based on PRD workflow:
        Format: "Untitled Course #{count} ({short_date})"
        Short date format: DDMMYY (15/01/25 → 150125)
        Counter increments based on courses created per day
        """
        # Get current date in DDMMYY format
        now = datetime.utcnow()
        short_date = now.strftime("%d%m%y")
        
        # Count ALL courses created today (platform-wide) to avoid duplicates
        start_of_day = datetime(now.year, now.month, now.day)
        end_of_day = datetime(now.year, now.month, now.day, 23, 59, 59)
        
        count = await Course.find(
            Course.created_at >= start_of_day,
            Course.created_at <= end_of_day
        ).count()
        
        # Generate title with count + 1
        return f"Untitled Course #{count + 1} ({short_date})"
    
    @staticmethod
    async def generate_unique_slug(title: str) -> str:
        """Generate unique slug from title"""
        base_slug = slugify(title)
        slug = base_slug
        counter = 1
        
        # Check if slug exists and increment counter if needed
        while await Course.find_one(Course.slug == slug):
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        return slug
    
    @staticmethod
    async def create_course(user: User) -> Dict[str, Any]:
        """
        Create a new course with auto-generated title.
        Returns course ID and redirect URL.
        """
        # Check if user can create courses (creator or admin)
        if user.role not in ["creator", "admin"]:
            raise ForbiddenException("Only content creators and admins can create courses")
        
        # Generate temporary title
        title = await CourseService.generate_course_title(str(user.id))
        slug = await CourseService.generate_unique_slug(title)
        
        # Create course with minimal data
        course = Course(
            title=title,
            description="",  # Empty description initially
            slug=slug,
            category=CourseCategory.ML_BASICS,  # Default category - proper enum usage
            level=CourseLevel.BEGINNER,  # Default level - proper enum usage
            creator_id=user.id,
            creator_name=user.name,
            pricing=Pricing()  # Default pricing (not free, price 0)
        )
        
        # Save to database
        await course.create()
        
        # Return dictionary to avoid Pydantic v2 serialization issues
        # Following CLAUDE.md pattern: Dictionary approach for API responses
        return {
            "id": str(course.id),
            "redirect_url": f"/admin/courses/{course.id}/edit",
            "message": "Course created successfully"
        }
    
    @staticmethod
    async def get_course(course_id: str, user: Optional[User] = None) -> Course:
        """Get course by ID with access check"""
        try:
            course = await Course.get(PydanticObjectId(course_id))
        except:
            raise NotFoundException("Course not found")
        
        if not course:
            raise NotFoundException("Course not found")
        
        return course
    
    @staticmethod
    async def update_course(
        course_id: str,
        update_data: CourseUpdate,
        user: User
    ) -> Course:
        """Update course details"""
        logger.info(f"CourseService.update_course called: course_id={course_id}")
        
        try:
            # Get course
            course = await CourseService.get_course(course_id)
            logger.info(f"Course fetched successfully: {course.title}")
            
            # Check permissions
            if str(course.creator_id) != str(user.id) and user.role != "admin":
                raise ForbiddenException("You don't have permission to update this course")
            
            # Update fields if provided
            update_dict = update_data.dict(exclude_unset=True)
            logger.info(f"Update dict: {update_dict}")

            # Validate course when changing to review or published status
            if "status" in update_dict:
                new_status = update_dict["status"]

                # Only validate when changing to review or published
                # coming_soon and archived statuses skip validation
                if new_status in ["review", "published"]:
                    validation_errors = await CourseService.validate_course_for_publishing(course_id)
                    if validation_errors:
                        # Use first error for clear user message
                        logger.warning(f"Course validation failed: {validation_errors[0]}")
                        raise ValidationException(validation_errors[0])

            # TEMPORARY FIX: Skip slug update completely to fix autosave
            # TODO: Fix slug generation logic later
            if "slug" in update_dict:
                del update_dict["slug"]
                logger.info("Removed slug from update dict")
            
            # Convert enum values to strings for MongoDB and handle nested objects
            for field, value in update_dict.items():
                if hasattr(value, 'value'):  # It's an enum
                    update_dict[field] = value.value
                    logger.info(f"Converted enum {field}: {value} -> {value.value}")
                elif field == 'pricing' and isinstance(value, dict):
                    # Ensure pricing is properly formatted as dict for MongoDB
                    update_dict[field] = value
                    logger.info(f"Processing pricing update: {value}")
            
            # 🔧 FIX INFINITE AUTOSAVE LOOP: Only update if there are actual changes
            if not update_dict:
                logger.info("No changes detected - skipping update")
                return course
            
            # Check if data actually changed by comparing values
            has_changes = False
            for field, new_value in update_dict.items():
                current_value = getattr(course, field, None)
                if str(current_value) != str(new_value):
                    has_changes = True
                    logger.info(f"Field {field} changed: {current_value} -> {new_value}")
                    break
            
            if not has_changes:
                logger.info("Data identical - skipping update to prevent infinite autosave loops")
                return course
                
            # Only set updated_at if there are real changes
            update_dict["updated_at"] = datetime.utcnow()
            
            # Apply updates using Beanie's update method
            if update_dict:
                logger.info(f"Final update dict: {update_dict}")
                # Use Beanie's update method which properly updates MongoDB
                await course.update({"$set": update_dict})
                
                # Refresh the course object from database to ensure we have the latest data
                course = await Course.get(course.id)
                logger.info(f"Course refreshed from DB - title is now: {course.title}")
                
                logger.info("Course updated successfully!")
            return course
            
        except Exception as e:
            logger.error(f"Error in update_course: {type(e).__name__}: {e}")
            logger.error(f"Stack trace:", exc_info=True)
            raise
    
    @staticmethod
    async def list_courses(
        page: int = 1,
        per_page: int = 20,
        category: Optional[CourseCategory] = None,
        level: Optional[CourseLevel] = None,
        search: Optional[str] = None,
        status: Optional[Union[CourseStatus, List[CourseStatus]]] = None,
        creator_id: Optional[str] = None,
        is_free: Optional[bool] = None
    ) -> Dict[str, Any]:
        """List courses with filters and pagination"""
        # Build query
        query_conditions = []
        
        # Handle creator special case: ONLY show own courses (PRD compliance)
        if creator_id:
            # PRD: Content Creators should only see their own courses regardless of status
            query_conditions.append({"creator_id": PydanticObjectId(creator_id)})
        else:
            # Regular status filtering for non-creators (students, non-authenticated users)
            if status is not None:
                if isinstance(status, list):
                    # Multiple statuses - use $in operator
                    query_conditions.append({"status": {"$in": status}})
                else:
                    # Single status
                    query_conditions.append(Course.status == status)
        
        if category:
            query_conditions.append(Course.category == category)
        
        if level:
            query_conditions.append(Course.level == level)
        
        if is_free is not None:
            query_conditions.append(Course.pricing.is_free == is_free)
        
        # Text search
        if search:
            # MongoDB text search would be better, but for now use regex
            query_conditions.append({
                "$or": [
                    {"title": {"$regex": search, "$options": "i"}},
                    {"description": {"$regex": search, "$options": "i"}}
                ]
            })
        
        # Execute query with pagination
        skip = (page - 1) * per_page
        
        if query_conditions:
            query = Course.find(*query_conditions)
        else:
            query = Course.find()
        
        # Get total count
        total = await query.count()
        
        # Get paginated results
        courses = await query.skip(skip).limit(per_page).sort("-created_at").to_list()
        
        # Calculate pagination info
        total_pages = (total + per_page - 1) // per_page
        
        return {
            "courses": courses,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages
        }
    
    @staticmethod
    async def check_course_access(course: Course, user: Optional[User] = None) -> Dict[str, bool]:
        """
        Check user's access to a course based on PRD pricing logic:
        1. Check if course has "Free" badge? → Free access for everyone
        2. Check if user has premium status? → Free access to all courses
        3. Check if user has Pro subscription? → Full access
        4. Check if user purchased this course? → Access granted
        5. If none → No access
        """
        # Not logged in users can only access free courses
        if not user:
            return {
                "has_access": course.pricing.is_free,
                "is_enrolled": False
            }
        
        # Course creator and admins always have access
        if str(course.creator_id) == str(user.id) or user.role == "admin":
            return {
                "has_access": True,
                "is_enrolled": True
            }
        
        # Check pricing logic as per PRD
        # 1. Free course
        if course.pricing.is_free:
            return {
                "has_access": True,
                "is_enrolled": True
            }
        
        # 2. Premium user
        if user.premium_status:
            return {
                "has_access": True,
                "is_enrolled": True
            }
        
        # 3. Pro subscription
        if user.subscription and user.subscription.type == "pro" and user.subscription.status == "active":
            return {
                "has_access": True,
                "is_enrolled": True
            }
        
        # 4. Check if user purchased this course
        enrollment = await Enrollment.find_one({
            "user_id": str(user.id),
            "course_id": str(course.id),
            "is_active": True
        })
        
        if enrollment:
            return {
                "has_access": True,
                "is_enrolled": True
            }
        
        # No access if none of the above conditions are met
        return {
            "has_access": False,
            "is_enrolled": False
        }
    
    @staticmethod
    async def get_course_progress_info(course_id: str, user_id: str) -> Dict[str, Any]:
        """
        Get progress information for a course including continue_lesson_id and progress_percentage.
        """
        # Get enrollment info
        enrollment = await Enrollment.find_one({
            "user_id": user_id,
            "course_id": course_id,
            "is_active": True
        })
        
        if not enrollment:
            return {
                "progress_percentage": 0,
                "continue_lesson_id": None
            }
        
        # Calculate progress percentage from enrollment
        progress_percentage = enrollment.progress.completion_percentage if enrollment.progress else 0
        
        # Use smart logic to find the correct continue lesson
        continue_lesson_id = await LearnService._get_smart_continue_lesson_id(
            enrollment, user_id, course_id
        )
        
        return {
            "progress_percentage": progress_percentage,
            "continue_lesson_id": continue_lesson_id
        }
    
    @staticmethod
    @measure_performance("course.batch_check_access")
    async def batch_check_course_access(courses: List[Course], user: Optional[User] = None) -> Dict[str, Dict[str, Any]]:
        """
        Check access for multiple courses at once to avoid N+1 queries.
        Returns a dictionary mapping course_id to access info.
        """
        result = {}
        
        for course in courses:
            # If no user, return basic access info based on pricing
            if not user:
                result[str(course.id)] = {
                    "has_access": course.pricing.is_free,
                    "is_enrolled": False,
                    "progress_percentage": 0,
                    "continue_lesson_id": None
                }
                continue
            
            # Check various access conditions
            if course.pricing.is_free:
                # Free course - check actual enrollment
                enrollment = await Enrollment.find_one({
                    "user_id": str(user.id),
                    "course_id": str(course.id),
                    "is_active": True
                })
                access_info = {
                    "has_access": True,
                    "is_enrolled": enrollment is not None
                }
            elif user.premium_status:
                # Premium user has access to all courses
                access_info = {"has_access": True, "is_enrolled": True}
            elif str(course.creator_id) == str(user.id):
                # Creator has access to their own course
                access_info = {"has_access": True, "is_enrolled": True}
            elif user.role == "admin":
                # Admin has access to all courses
                access_info = {"has_access": True, "is_enrolled": True}
            elif user.subscription and hasattr(user.subscription, 'type') and user.subscription.type == "pro":
                # Pro subscription
                access_info = {"has_access": True, "is_enrolled": True}
            else:
                # Check if user has enrollment for this course
                enrollment = await Enrollment.find_one({
                    "user_id": str(user.id),
                    "course_id": str(course.id),
                    "is_active": True
                })
                
                if enrollment:
                    access_info = {"has_access": True, "is_enrolled": True}
                else:
                    access_info = {"has_access": False, "is_enrolled": False}
            
            # Add progress info if enrolled
            if access_info.get("is_enrolled"):
                progress_info = await CourseService.get_course_progress_info(str(course.id), str(user.id))
                access_info.update(progress_info)
            else:
                access_info.update({
                    "progress_percentage": 0,
                    "continue_lesson_id": None
                })
            
            result[str(course.id)] = access_info
        
        return result
    
    @staticmethod
    async def delete_course(course_id: str, user: User) -> Dict[str, str]:
        """Delete a course (hard delete from database)"""
        logger.info(f"🗑️ DELETE COURSE: Starting delete for course_id={course_id}, user={user.id}, role={user.role}")
        
        # Get course
        course = await CourseService.get_course(course_id)
        logger.info(f"🗑️ DELETE COURSE: Found course={course.title}, creator_id={course.creator_id}")
        
        # Check permissions (only creator or admin can delete)
        if str(course.creator_id) != str(user.id) and user.role != "admin":
            logger.error(f"🚨 DELETE COURSE: Permission denied - user {user.id} cannot delete course {course_id}")
            raise ForbiddenException("You don't have permission to delete this course")
        
        # Check if course has enrollments
        enrollment_count = await Enrollment.find({
            "course_id": str(course.id),
            "is_active": True
        }).count()
        
        logger.info(f"🗑️ DELETE COURSE: Found {enrollment_count} active enrollments")
        
        if enrollment_count > 0:
            # Archive instead of delete when has enrollments
            logger.info(f"📦 ARCHIVE COURSE: Course has {enrollment_count} enrollments - archiving instead of deleting")
            course.status = CourseStatus.ARCHIVED
            await course.save()
            logger.info(f"✅ ARCHIVE COURSE: Successfully archived course {course_id}")
            return {"action": "archived", "message": f"Course archived ({enrollment_count} students enrolled)"}
        
        # Cascade delete: Remove all related data first
        logger.info(f"🗑️ DELETE COURSE: Starting cascade deletion for course {course_id}")
        
        # 1. Delete all quizzes for this course
        from app.models.quiz import Quiz
        quiz_count = await Quiz.find({"course_id": str(course.id)}).count()
        if quiz_count > 0:
            await Quiz.find({"course_id": str(course.id)}).delete()
            logger.info(f"🗑️ DELETE COURSE: Deleted {quiz_count} quizzes")
        
        # 2. Delete all progress records for this course
        from app.models.progress import Progress
        progress_count = await Progress.find({"course_id": str(course.id)}).count()
        if progress_count > 0:
            await Progress.find({"course_id": str(course.id)}).delete()
            logger.info(f"🗑️ DELETE COURSE: Deleted {progress_count} progress records")
        
        # 3. Delete all lessons for this course
        from app.models.lesson import Lesson
        lesson_count = await Lesson.find({"course_id": str(course.id)}).count()
        if lesson_count > 0:
            await Lesson.find({"course_id": str(course.id)}).delete()
            logger.info(f"🗑️ DELETE COURSE: Deleted {lesson_count} lessons")
        
        # 4. Delete all chapters for this course
        from app.models.chapter import Chapter
        chapter_count = await Chapter.find({"course_id": str(course.id)}).count()
        if chapter_count > 0:
            await Chapter.find({"course_id": str(course.id)}).delete()
            logger.info(f"🗑️ DELETE COURSE: Deleted {chapter_count} chapters")
        
        # 5. Finally, delete the course itself
        await course.delete()
        logger.info(f"✅ DELETE COURSE: Successfully deleted course {course_id} and all related data")
        
        return {"message": "Course and all related content deleted successfully"}
    
    @staticmethod
    async def update_course_timestamp(course_id: str) -> None:
        """
        🔧 AUTO-CASCADE: Update course.updated_at timestamp.
        Used when nested resources (chapters/lessons) are modified.
        
        This ensures course timestamps reflect any content changes,
        making SaveStatusIndicator show accurate "last modified" time.
        """
        logger.info(f"⏰ AUTO-CASCADE: Updating course {course_id} timestamp")
        
        try:
            # Get course
            course = await Course.get(PydanticObjectId(course_id))
            if not course:
                logger.warning(f"⚠️ AUTO-CASCADE: Course {course_id} not found for timestamp update")
                return
            
            # Update timestamp
            course.updated_at = datetime.utcnow()
            await course.save()
            
            logger.info(f"✅ AUTO-CASCADE: Successfully updated course {course_id} timestamp")
            
        except Exception as e:
            logger.error(f"❌ AUTO-CASCADE: Failed to update course {course_id} timestamp: {e}")
            # Don't raise exception - timestamp update is non-critical
            pass

    @staticmethod
    async def validate_course_for_publishing(course_id: str) -> List[str]:
        """
        Validate course is ready for review/publishing.
        Returns list of validation errors, empty if valid.
        """
        errors = []

        # Get course
        course = await Course.get(PydanticObjectId(course_id))
        if not course:
            return ["Course not found"]

        # Check thumbnail
        if not course.thumbnail:
            errors.append("Please upload a course thumbnail before publishing")

        # Check duration
        if course.total_duration == 0:
            errors.append("Course duration must be set (appears to be 0 minutes)")

        # Check for published chapters
        published_chapters = await Chapter.find({
            "course_id": PydanticObjectId(course_id),
            "status": "published"
        }).count()

        if published_chapters == 0:
            errors.append("At least one chapter must be published")
            return errors  # No need to check lessons

        # Check for published lessons
        published_lessons = await Lesson.find({
            "course_id": PydanticObjectId(course_id),
            "status": "published"
        }).to_list()

        if not published_lessons:
            errors.append("At least one lesson must be published")
            return errors

        # Check YouTube URLs in published lessons
        for lesson in published_lessons:
            if not lesson.video or not lesson.video.youtube_url:
                errors.append(f"Lesson '{lesson.title}' needs a YouTube video URL")
                break  # Report first missing video only

        return errors