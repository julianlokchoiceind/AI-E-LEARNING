"""
Course service for business logic.
Based on CLAUDE.md course creation workflow.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from beanie import PydanticObjectId
from slugify import slugify
from app.models.course import Course, CourseCategory, CourseLevel, CourseStatus, Pricing
from app.models.user import User
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse
from app.core.exceptions import (
    NotFoundException,
    ForbiddenException,
    BadRequestException
)
from app.core.performance import measure_performance, timed_lru_cache


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
        
        # Count courses created today by this user
        start_of_day = datetime(now.year, now.month, now.day)
        end_of_day = datetime(now.year, now.month, now.day, 23, 59, 59)
        
        count = await Course.find(
            Course.creator_id == PydanticObjectId(user_id),
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
            category=CourseCategory.PROGRAMMING,  # Default category
            level=CourseLevel.BEGINNER,  # Default level
            creator_id=user.id,
            creator_name=user.name,
            pricing=Pricing()  # Default pricing (not free, price 0)
        )
        
        # Save to database
        await course.create()
        
        return {
            "_id": str(course.id),
            "redirect_url": f"/courses/{course.id}/edit",
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
        # Get course
        course = await CourseService.get_course(course_id)
        
        # Check permissions
        if str(course.creator_id) != str(user.id) and user.role != "admin":
            raise ForbiddenException("You don't have permission to update this course")
        
        # Update fields if provided
        update_dict = update_data.dict(exclude_unset=True)
        
        # If title is updated, update slug too
        if "title" in update_dict:
            update_dict["slug"] = await CourseService.generate_unique_slug(update_dict["title"])
        
        # Update timestamps
        update_dict["updated_at"] = datetime.utcnow()
        
        # Apply updates
        for field, value in update_dict.items():
            setattr(course, field, value)
        
        # Save changes
        await course.save()
        
        return course
    
    @staticmethod
    async def list_courses(
        page: int = 1,
        per_page: int = 20,
        category: Optional[CourseCategory] = None,
        level: Optional[CourseLevel] = None,
        search: Optional[str] = None,
        status: Optional[CourseStatus] = None,
        creator_id: Optional[str] = None,
        is_free: Optional[bool] = None
    ) -> Dict[str, Any]:
        """List courses with filters and pagination"""
        # Build query
        query_conditions = []
        
        # Only show published courses to non-admins
        if status is not None:
            query_conditions.append(Course.status == status)
        
        if category:
            query_conditions.append(Course.category == category)
        
        if level:
            query_conditions.append(Course.level == level)
        
        if creator_id:
            query_conditions.append(Course.creator_id == PydanticObjectId(creator_id))
        
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
        # TODO: Implement enrollment check when Enrollment model is created
        # For now, return no access
        return {
            "has_access": False,
            "is_enrolled": False
        }
    
    @staticmethod
    @measure_performance("course.batch_check_access")
    async def batch_check_course_access(courses: List[Course], user: Optional[User] = None) -> Dict[str, Dict[str, bool]]:
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
                    "is_enrolled": False
                }
                continue
            
            # Check various access conditions
            if course.pricing.is_free:
                # Free course
                access_info = {"has_access": True, "is_enrolled": False}
            elif user.premium_status:
                # Premium user has access to all courses
                access_info = {"has_access": True, "is_enrolled": True}
            elif str(course.creator_id) == str(user.id):
                # Creator has access to their own course
                access_info = {"has_access": True, "is_enrolled": True}
            elif user.role == "admin":
                # Admin has access to all courses
                access_info = {"has_access": True, "is_enrolled": True}
            elif user.subscription and user.subscription.get("type") == "pro":
                # Pro subscription
                access_info = {"has_access": True, "is_enrolled": True}
            else:
                # TODO: Check enrollments when implemented
                access_info = {"has_access": False, "is_enrolled": False}
            
            result[str(course.id)] = access_info
        
        return result
    
    @staticmethod
    async def delete_course(course_id: str, user: User) -> Dict[str, str]:
        """Delete a course (soft delete by archiving)"""
        # Get course
        course = await CourseService.get_course(course_id)
        
        # Check permissions (only creator or admin can delete)
        if str(course.creator_id) != str(user.id) and user.role != "admin":
            raise ForbiddenException("You don't have permission to delete this course")
        
        # Check if course has enrollments
        # TODO: Check enrollments when Enrollment model is created
        
        # Soft delete by archiving
        course.status = CourseStatus.ARCHIVED
        course.updated_at = datetime.utcnow()
        await course.save()
        
        return {"message": "Course archived successfully"}