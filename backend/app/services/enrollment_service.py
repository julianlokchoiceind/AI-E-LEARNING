from datetime import datetime
from typing import List, Optional
from app.models.enrollment import Enrollment, EnrollmentType
from app.models.course import Course
from app.models.user import User
from app.models.progress import Progress
from app.models.lesson import Lesson
from app.core.exceptions import NotFoundError, BadRequestError, ForbiddenError
from app.core.performance import measure_performance
from app.services.db_optimization import db_optimizer

class EnrollmentService:
    
    async def enroll_user(
        self, 
        course_id: str, 
        user_id: str,
        enrollment_type: EnrollmentType = EnrollmentType.FREE,
        payment_id: Optional[str] = None
    ) -> Enrollment:
        """Enroll a user in a course."""
        # Check if course exists
        course = await Course.get(course_id)
        if not course:
            raise NotFoundError(f"Course {course_id} not found")
        
        # Get user to check premium status first
        user = await User.get(user_id)
        if not user:
            raise NotFoundError(f"User {user_id} not found")
        
        # Check if already enrolled
        existing_enrollment = await Enrollment.find_one({
            "user_id": user_id,
            "course_id": course_id
        })
        
        if existing_enrollment:
            if existing_enrollment.is_active:
                # Already enrolled and active → return existing enrollment
                return existing_enrollment
            else:
                # Inactive enrollment → reactivate
                existing_enrollment.is_active = True
                existing_enrollment.enrolled_at = datetime.utcnow()
                await existing_enrollment.save()
                
                # Restore statistics
                course.stats.active_students += 1
                await course.save()
                
                if user and user.stats:
                    user.stats.courses_enrolled += 1
                    await user.save()
                
                return existing_enrollment
        
        # Determine enrollment type based on course pricing and user status
        if course.pricing.is_free:
            enrollment_type = EnrollmentType.FREE
        elif user.premium_status:
            enrollment_type = EnrollmentType.ADMIN_GRANTED
        elif user.subscription and user.subscription.get('type') == 'pro' and user.subscription.get('status') == 'active':
            enrollment_type = EnrollmentType.SUBSCRIPTION
        elif not payment_id and course.pricing.price > 0:
            raise BadRequestError("Payment required for this course")
        
        # Get total lessons count
        total_lessons = await Lesson.find({"course_id": course_id}).count()
        
        # Create enrollment
        enrollment = Enrollment(
            user_id=user_id,
            course_id=course_id,
            enrollment_type=enrollment_type,
            payment_id=payment_id,
            progress={
                "total_lessons": total_lessons,
                "lessons_completed": 0,
                "completion_percentage": 0.0
            }
        )
        
        await enrollment.save()
        
        # Create progress record for first lesson
        await self._create_first_lesson_progress(course_id, user_id)
        
        # Update course enrollment stats
        course.stats.total_enrollments += 1
        course.stats.active_students += 1
        await course.save()
        
        # Update user stats
        user = await User.get(user_id)
        if user:
            # Ensure stats object exists
            if not user.stats:
                from app.models.user import Stats
                user.stats = Stats()
            
            # Update courses_enrolled using proper object notation
            user.stats.courses_enrolled = user.stats.courses_enrolled + 1
            await user.save()
        
        return enrollment
    
    async def get_user_enrollments(self, user_id: str) -> List[Enrollment]:
        """Get all courses a user is enrolled in."""
        enrollments = await Enrollment.find({
            "user_id": user_id,
            "is_active": True
        }).sort(-Enrollment.enrolled_at).to_list()
        
        return enrollments
    
    @measure_performance("enrollment.get_user_courses")
    async def get_user_enrollments_with_courses(self, user_id: str) -> List[dict]:
        """Get all courses a user is enrolled in with course details - optimized version."""
        enrollments = await Enrollment.find({
            "user_id": user_id,
            "is_active": True
        }).sort(-Enrollment.enrolled_at).to_list()
        
        # Extract course IDs for batch fetching
        course_ids = [enrollment.course_id for enrollment in enrollments]
        
        # Batch fetch all courses at once (avoid N+1 queries)
        courses = await db_optimizer.batch_get_courses(course_ids)
        
        # Create course lookup dictionary
        course_lookup = {str(course.id): course for course in courses}
        
        # Build result with course details
        result = []
        for enrollment in enrollments:
            course = course_lookup.get(str(enrollment.course_id))
            if course:
                enrollment_dict = enrollment.dict()
                enrollment_dict['course'] = {
                    "id": str(course.id),
                    "title": course.title,
                    "description": course.description,
                    "short_description": course.short_description,
                    "thumbnail": course.thumbnail,
                    "category": course.category,
                    "level": course.level,
                    "total_duration": course.total_duration,
                    "total_lessons": course.total_lessons,
                    "instructor": course.creator_name
                }
                result.append(enrollment_dict)
        
        return result
    
    async def get_enrollment(self, course_id: str, user_id: str) -> Optional[Enrollment]:
        """Get specific enrollment record."""
        enrollment = await Enrollment.find_one({
            "user_id": user_id,
            "course_id": course_id,
            "is_active": True
        })
        
        return enrollment
    
    async def check_enrollment(self, course_id: str, user_id: str) -> bool:
        """Check if user is enrolled in a course."""
        enrollment = await self.get_enrollment(course_id, user_id)
        return enrollment is not None and enrollment.is_active
    
    async def update_last_accessed(self, enrollment_id: str) -> None:
        """Update last accessed time for an enrollment."""
        enrollment = await Enrollment.get(enrollment_id)
        if enrollment:
            enrollment.last_accessed = datetime.utcnow()
            await enrollment.save()
    
    async def get_course_enrollments(self, course_id: str) -> List[Enrollment]:
        """Get all enrollments for a course."""
        enrollments = await Enrollment.find({
            "course_id": course_id,
            "is_active": True
        }).to_list()
        
        return enrollments
    
    async def unenroll_user(self, course_id: str, user_id: str) -> None:
        """Unenroll a user from a course."""
        enrollment = await Enrollment.find_one({
            "user_id": user_id,
            "course_id": course_id
        })
        
        if not enrollment:
            raise NotFoundError("Enrollment not found")
        
        enrollment.is_active = False
        enrollment.updated_at = datetime.utcnow()
        await enrollment.save()
        
        # Update course stats
        course = await Course.get(course_id)
        if course:
            course.stats.active_students = max(0, course.stats.active_students - 1)
            await course.save()
        
        # Update user stats - decrement courses_enrolled
        user = await User.get(user_id)
        if user and user.stats:
            user.stats.courses_enrolled = max(0, user.stats.courses_enrolled - 1)
            await user.save()
    
    async def _create_first_lesson_progress(self, course_id: str, user_id: str) -> None:
        """Create progress record for the first lesson of the course."""
        # Find first lesson (order = 1)
        first_lesson = await Lesson.find_one({
            "course_id": course_id,
            "order": 1
        })
        
        if first_lesson:
            # Create progress record
            progress = Progress(
                user_id=user_id,
                course_id=course_id,
                lesson_id=str(first_lesson.id),
                is_unlocked=True  # First lesson is always unlocked
            )
            await progress.save()
    
    async def issue_certificate(self, enrollment_id: str) -> Enrollment:
        """Issue a certificate for a completed course."""
        enrollment = await Enrollment.get(enrollment_id)
        if not enrollment:
            raise NotFoundError("Enrollment not found")
        
        if not enrollment.progress.is_completed:
            raise BadRequestError("Course not completed yet")
        
        if enrollment.certificate.is_issued:
            raise BadRequestError("Certificate already issued")
        
        # Generate certificate ID
        import uuid
        certificate_id = f"CERT-{enrollment.course_id[-6:]}-{enrollment.user_id[-6:]}-{uuid.uuid4().hex[:8]}"
        
        # Update certificate info
        enrollment.certificate.is_issued = True
        enrollment.certificate.issued_at = datetime.utcnow()
        enrollment.certificate.certificate_id = certificate_id
        enrollment.certificate.final_score = 100.0  # Can be calculated based on quiz scores
        enrollment.certificate.verification_url = f"/certificates/verify/{certificate_id}"
        
        enrollment.updated_at = datetime.utcnow()
        await enrollment.save()
        
        return enrollment

# Create service instance
enrollment_service = EnrollmentService()