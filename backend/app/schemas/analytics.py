"""
Analytics-related schemas.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel


class DailyStats(BaseModel):
    """Daily statistics data point."""
    date: datetime
    enrollments: int
    completions: int
    revenue: float
    watch_time_minutes: int
    active_students: int


class CreatorAnalytics(BaseModel):
    """Analytics data for content creators."""
    # Overview stats
    total_courses: int
    published_courses: int
    total_students: int
    active_students: int
    total_revenue: float
    average_rating: float
    completion_rate: float
    
    # Time-based stats
    revenue_this_period: float
    students_this_period: int
    enrollments_this_period: int
    
    # Course performance
    top_courses: List[Dict[str, Any]]  # title, students, revenue, rating
    
    # Student engagement
    average_watch_time: float  # minutes per student
    total_watch_time: float  # total minutes
    lessons_completed: int
    quizzes_passed: int
    
    # Time series data for charts
    daily_stats: List[DailyStats]
    
    # Period info
    time_range: str
    start_date: datetime
    end_date: datetime


class CourseAnalytics(BaseModel):
    """Analytics data for a specific course."""
    # Course info
    course_id: str
    course_title: str
    
    # Overview stats
    total_enrollments: int
    active_students: int
    completed_students: int
    completion_rate: float
    average_rating: float
    total_reviews: int
    
    # Revenue
    total_revenue: float
    revenue_this_period: float
    
    # Engagement
    average_progress: float  # percentage
    average_watch_time: float  # minutes per student
    total_watch_time: float  # total minutes
    
    # Lesson performance
    lesson_completion_rates: List[Dict[str, Any]]  # lesson_title, completion_rate
    
    # Quiz performance
    quiz_pass_rates: List[Dict[str, Any]]  # quiz_title, pass_rate, average_score
    
    # Student demographics
    student_countries: List[Dict[str, Any]]  # country, count
    student_levels: Dict[str, int]  # beginner, intermediate, advanced counts
    
    # Time series data
    daily_stats: List[DailyStats]
    
    # Period info
    time_range: str
    start_date: datetime
    end_date: datetime


class StudentAnalytics(BaseModel):
    """Analytics data for a student."""
    # Overview
    courses_enrolled: int
    courses_completed: int
    total_watch_time: float  # minutes
    certificates_earned: int
    
    # Progress
    average_course_progress: float  # percentage
    current_streak: int
    longest_streak: int
    
    # Performance
    average_quiz_score: float
    quizzes_passed: int
    quizzes_failed: int
    
    # Activity
    last_active: datetime
    most_active_time: str  # e.g., "14:00-16:00"
    favorite_category: str
    
    # Time series
    daily_activity: List[Dict[str, Any]]  # date, minutes_studied, lessons_completed