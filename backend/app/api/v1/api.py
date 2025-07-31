"""
API v1 router that includes all endpoints.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, courses, chapters, lessons, progress, enrollments, users, ai, quizzes, admin, payments, analytics, security, performance, faq, faq_categories, support, reviews, certificates, onboarding, learn

api_router = APIRouter()

# Include routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(chapters.router, tags=["chapters"])
api_router.include_router(lessons.router, tags=["lessons"])
api_router.include_router(progress.router, prefix="/progress", tags=["progress"])
api_router.include_router(enrollments.router, prefix="/enrollments", tags=["enrollments"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai-assistant"])
api_router.include_router(quizzes.router, prefix="/quizzes", tags=["quizzes"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(security.router, prefix="/security", tags=["security"])
api_router.include_router(performance.router, prefix="/performance", tags=["performance"])
api_router.include_router(faq.router, prefix="/faq", tags=["faq"])
api_router.include_router(faq_categories.router, prefix="/faq-categories", tags=["faq-categories"])
api_router.include_router(support.router, prefix="/support", tags=["support"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(certificates.router, prefix="/certificates", tags=["certificates"])
api_router.include_router(learn.router, prefix="/learn", tags=["learn-page"])

# All test endpoints have been removed from production codebase