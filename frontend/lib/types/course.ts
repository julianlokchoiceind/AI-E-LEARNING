/**
 * Course-related types and interfaces
 */

export interface Course {
  id: string
  title: string
  description: string
  short_description?: string
  slug: string
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
  language: string
  creator_id: string
  creator_name: string
  thumbnail?: string
  preview_video?: string
  syllabus?: string[]
  prerequisites?: string[]
  target_audience?: string[]
  pricing: CoursePricing
  total_chapters: number
  total_lessons: number
  total_duration: number
  status: 'draft' | 'review' | 'published' | 'archived'
  published_at?: string
  stats: CourseStats
  seo?: CourseSEO
  created_at: string
  updated_at: string
  is_enrolled?: boolean
  has_access?: boolean
  progress_percentage?: number
  continue_lesson_id?: string
}

export interface CoursePricing {
  is_free: boolean
  price: number
  currency: string
  discount_price?: number
  discount_expires?: string
}

export interface CourseStats {
  total_enrollments: number
  active_students: number
  completion_rate: number
  average_rating: number
  total_reviews: number
  total_revenue: number
}

export interface CourseSEO {
  meta_title?: string
  meta_description?: string
  keywords?: string[]
}

export interface Chapter {
  id: string
  course_id: string
  title: string
  description?: string
  order: number
  total_lessons: number
  total_duration: number
  status: 'draft' | 'published'
  lessons?: Lesson[]
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  course_id: string
  chapter_id: string
  title: string
  description?: string
  order: number
  video?: LessonVideo | null
  content?: string
  resources?: LessonResource[]
  has_quiz?: boolean
  quiz_required?: boolean
  unlock_conditions?: LessonUnlockConditions | null
  status: 'draft' | 'published'
  is_completed?: boolean
  is_locked?: boolean
  is_free_preview?: boolean
  created_at: string
  updated_at: string
}

export interface LessonVideo {
  url?: string
  youtube_id?: string
  duration?: number
  transcript?: string
  captions?: string
  thumbnail?: string
}

export interface LessonResource {
  title: string
  type: 'pdf' | 'doc' | 'zip' | 'link' | 'code' | 'exercise' | 'other'
  url: string
  description?: string
  size?: number
}

export interface LessonUnlockConditions {
  previous_lesson_required?: boolean
  quiz_pass_required?: boolean
  minimum_watch_percentage?: number
}

export interface CourseProgress {
  course_id: string
  lessons_completed: number
  total_lessons: number
  completion_percentage: number
  total_watch_time: number
  current_lesson_id?: string
  is_completed: boolean
  completed_at?: string
  last_accessed?: string
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  enrollment_type: 'free' | 'purchased' | 'subscription' | 'admin_granted'
  payment_id?: string
  progress: CourseProgress
  certificate?: EnrollmentCertificate
  is_active: boolean
  expires_at?: string
  enrolled_at: string
  last_accessed?: string
  updated_at: string
}

export interface EnrollmentCertificate {
  is_issued: boolean
  issued_at?: string
  certificate_id?: string
  final_score?: number
  verification_url?: string
}

// Form types
export interface CourseCreateRequest {
  // Minimal for quick creation
}

export interface CourseUpdateRequest {
  title?: string
  description?: string
  short_description?: string
  category?: string
  level?: string
  language?: string
  thumbnail?: string
  preview_video?: string
  syllabus?: string[]
  prerequisites?: string[]
  target_audience?: string[]
  status?: string
}

// API Response types
export interface CourseListResponse {
  courses: Course[]
  total_count: number
  has_next: boolean
}

export interface CourseDetailResponse {
  course: Course
  chapters: Chapter[]
  enrollment?: Enrollment
}