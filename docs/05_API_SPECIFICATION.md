# 🗂️ API Specification & Backend Workflows

## 🔐 Authentication Workflows (`/api/v1/auth/*`)

```
POST /api/v1/auth/register
  ├── Validate input (email, password, name)
  ├── Check email uniqueness
  ├── Hash password with bcrypt
  ├── Create User in MongoDB
  ├── Generate verification token
  ├── Send verification email
  └── Return success message

POST /api/v1/auth/login
  ├── Validate credentials
  ├── Check email verification
  ├── Verify password hash
  ├── Generate JWT access token
  ├── Create refresh token
  └── Return tokens + user data

POST /api/v1/auth/logout
  ├── Invalidate JWT token
  ├── Clear refresh token
  └── Return success

GET /api/v1/auth/verify-email?token={token}
  ├── Validate verification token
  ├── Update user.is_verified = True
  └── Redirect to login page

POST /api/v1/auth/refresh
  ├── Validate refresh token
  ├── Generate new access token
  └── Return new access token
```

## 📚 Course Management (`/api/v1/courses/*`)

```
POST /api/v1/courses/create
  ├── Verify role (Creator/Admin)
  ├── Generate: "Untitled Course #{count} ({DDMMYY})"
  ├── Create course (status: draft)
  ├── Set default permissions
  ├── Return course_id + redirect URL
  └── Frontend auto-redirects to editor

GET /api/v1/courses
  ├── Parse query params (search, category, level, pricing)
  ├── Apply filters
  ├── Check user access permissions
  ├── Return paginated list
  └── Include pricing info

GET /api/v1/courses/{course_id}
  ├── Fetch course details
  ├── Check enrollment status
  ├── Check pricing logic (Free/Pro/Purchased)
  ├── Return course data
  └── Include syllabus and instructor

POST /api/v1/courses/{course_id}/enroll
  ├── Check course exists and published
  ├── Verify user authentication
  ├── Check pricing logic:
  │   ├── Free → Grant access
  │   ├── Pro subscriber → Grant access
  │   ├── Premium user → Grant access
  │   └── Paid → Require payment
  ├── Create enrollment record
  ├── Send confirmation email
  └── Return enrollment status

GET /api/v1/courses/{course_id}/lessons
  ├── Verify user enrollment
  ├── Fetch lessons with completion status
  ├── Apply sequential learning logic
  ├── Return lessons with unlock status
  └── Include progress data
```

## 🎓 Learning Progress (`/api/v1/lessons/*`)

```
POST /api/v1/lessons/{lesson_id}/start
  ├── Verify lesson access
  ├── Create/update progress record
  ├── Set start_time
  ├── Track analytics event
  └── Return lesson content

PUT /api/v1/lessons/{lesson_id}/progress
  ├── Validate lesson access
  ├── Update watch_percentage
  ├── Check 80% completion threshold
  ├── Auto-mark complete if threshold reached
  ├── Update last_position for resume
  └── Return updated progress

POST /api/v1/lessons/{lesson_id}/complete
  ├── Verify 80% watch completion
  ├── Mark lesson as completed
  ├── Unlock next lesson
  ├── Update course progress percentage
  ├── Trigger quiz if available
  ├── Check course completion
  └── Return completion status + next lesson
```

## ❓ Quiz System (`/api/v1/quizzes/*`)

```
GET /api/v1/quizzes/{lesson_id}
  ├── Verify lesson completion
  ├── Fetch quiz questions
  ├── Shuffle answer options
  ├── Hide correct answers
  └── Return quiz data

POST /api/v1/quizzes/{quiz_id}/submit
  ├── Validate quiz access
  ├── Calculate score percentage
  ├── Check 70% pass threshold
  ├── Provide immediate feedback
  ├── Save attempt to database
  ├── Update lesson completion if passed
  ├── Unlock next lesson if quiz passed
  └── Return results with explanations

GET /api/v1/quizzes/{quiz_id}/attempts
  ├── Fetch user's quiz attempts
  ├── Calculate best score
  ├── Return attempt history
  └── Include retry availability
```

## 👤 User Management (`/api/v1/users/*`)

```
GET /api/v1/users/profile
  ├── Verify JWT token
  ├── Fetch user data
  ├── Include role and premium status
  ├── Calculate learning statistics
  └── Return profile data

PUT /api/v1/users/profile
  ├── Validate input data
  ├── Update user information
  ├── Handle profile image upload
  ├── Save changes to database
  └── Return updated profile

GET /api/v1/users/courses
  ├── Fetch enrolled courses
  ├── Calculate progress for each course
  ├── Include completion status
  ├── Sort by recent activity
  └── Return course list with progress

GET /api/v1/users/certificates
  ├── Fetch completed courses
  ├── Generate certificate data
  ├── Include LinkedIn sharing links
  ├── Return certificate gallery
  └── Include download URLs
```

## 💳 Payment Workflows (`/api/v1/payments/*`)

```
POST /api/v1/payments/course/{course_id}
  ├── Validate course exists and is paid
  ├── Check user not already enrolled
  ├── Create Stripe payment intent
  ├── Process payment
  ├── Create enrollment on success
  ├── Send purchase confirmation
  └── Return payment status + access

POST /api/v1/payments/subscription
  ├── Validate Pro subscription plan
  ├── Create Stripe subscription
  ├── Process recurring payment
  ├── Update user.subscription_status
  ├── Grant Pro access to all courses
  ├── Send subscription confirmation
  └── Return subscription details

GET /api/v1/payments/history
  ├── Fetch user payment records
  ├── Include subscription status
  ├── Format payment data
  └── Return transaction history

POST /api/v1/payments/cancel
  ├── Cancel Stripe subscription
  ├── Update user subscription status
  ├── Set expiry date to end of billing period
  ├── Send cancellation confirmation
  └── Return cancellation status
```

## 📖 Chapter Management (`/api/v1/chapters/*`)

```
POST /api/v1/chapters/create
  ├── Verify role (Creator/Admin)
  ├── Validate course ownership
  ├── Generate: "Untitled Chapter #{count} ({DDMMYY})"
  ├── Create chapter (status: draft)
  ├── Set chapter order
  ├── Return chapter_id + redirect URL
  └── Frontend auto-redirects to editor

GET /api/v1/courses/{course_id}/chapters
  ├── Verify course access
  ├── Fetch chapters ordered by sequence
  ├── Include lesson count per chapter
  ├── Calculate completion status
  ├── Apply sequential unlock logic
  └── Return chapters with metadata

GET /api/v1/chapters/{chapter_id}
  ├── Verify chapter access
  ├── Fetch chapter details
  ├── Include lesson list
  ├── Calculate chapter progress
  └── Return chapter data with lessons

PUT /api/v1/chapters/{chapter_id}
  ├── Verify edit permissions
  ├── Validate chapter data
  ├── Update chapter information
  ├── Handle autosave logic
  ├── Update last_modified timestamp
  └── Return updated chapter

DELETE /api/v1/chapters/{chapter_id}
  ├── Verify delete permissions
  ├── Check chapter has no lessons
  ├── Remove chapter from database
  ├── Update course structure
  └── Return deletion confirmation

POST /api/v1/chapters/{chapter_id}/reorder
  ├── Verify edit permissions
  ├── Validate new order sequence
  ├── Update chapter order
  ├── Recalculate sequential unlock logic
  └── Return updated chapter list
```

## 📝 Lesson Management (`/api/v1/lessons/*`)

```
POST /api/v1/lessons/create
  ├── Verify role (Creator/Admin)
  ├── Validate chapter ownership
  ├── Generate: "Untitled Lesson #{count} ({DDMMYY})"
  ├── Create lesson (status: draft)
  ├── Set lesson order within chapter
  ├── Return lesson_id + redirect URL
  └── Frontend auto-redirects to editor

GET /api/v1/chapters/{chapter_id}/lessons
  ├── Verify chapter access
  ├── Fetch lessons ordered by sequence
  ├── Include completion status per user
  ├── Apply sequential unlock logic
  ├── Include quiz availability
  └── Return lessons with progress

GET /api/v1/lessons/{lesson_id}
  ├── Verify lesson access
  ├── Fetch lesson content
  ├── Include quiz data if available
  ├── Track lesson view analytics
  └── Return lesson data with player config

PUT /api/v1/lessons/{lesson_id}
  ├── Verify edit permissions
  ├── Validate lesson data
  ├── Handle video upload and processing
  ├── Update lesson information
  ├── Apply autosave logic
  ├── Update last_modified timestamp
  └── Return updated lesson

DELETE /api/v1/lessons/{lesson_id}
  ├── Verify delete permissions
  ├── Remove associated progress records
  ├── Delete lesson from database
  ├── Update chapter structure
  ├── Recalculate course completion logic
  └── Return deletion confirmation

POST /api/v1/lessons/{lesson_id}/upload-video
  ├── Verify edit permissions
  ├── Validate video file (format, size, duration)
  ├── Upload to CDN/cloud storage
  ├── Generate video thumbnails
  ├── Extract video metadata
  ├── Update lesson.video_url
  └── Return upload status + video data

POST /api/v1/lessons/{lesson_id}/reorder
  ├── Verify edit permissions
  ├── Validate new order within chapter
  ├── Update lesson sequence
  ├── Recalculate sequential unlock logic
  └── Return updated lesson list
```

## ❓ FAQ Management (`/api/v1/faq/*`)

```
GET /api/v1/faq
  ├── Fetch all published FAQ items
  ├── Group by categories
  ├── Sort by priority and popularity
  ├── Include search functionality
  └── Return categorized FAQ list

GET /api/v1/faq/search?q={query}
  ├── Parse search query
  ├── Search in questions and answers
  ├── Rank results by relevance
  ├── Include related FAQs
  └── Return search results

POST /api/v1/faq (Admin only)
  ├── Verify admin permissions
  ├── Validate FAQ data
  ├── Create new FAQ item
  ├── Set publication status
  └── Return created FAQ

PUT /api/v1/faq/{faq_id} (Admin only)
  ├── Verify admin permissions
  ├── Update FAQ content
  ├── Handle category changes
  ├── Update last_modified timestamp
  └── Return updated FAQ

DELETE /api/v1/faq/{faq_id} (Admin only)
  ├── Verify admin permissions
  ├── Remove FAQ from database
  └── Return deletion confirmation

POST /api/v1/faq/{faq_id}/helpful
  ├── Track user feedback
  ├── Update FAQ helpfulness score
  ├── Use for ranking and improvements
  └── Return feedback confirmation
```

## 🛠️ Admin Workflows (`/api/v1/admin/*`)

```
GET /api/v1/admin/users
  ├── Verify admin role
  ├── Fetch user list with pagination
  ├── Include role and premium status
  ├── Apply search/filter parameters
  └── Return user management data

PUT /api/v1/admin/users/{user_id}/premium
  ├── Verify admin permissions
  ├── Toggle premium status
  ├── Update database record
  ├── Send notification to user
  └── Return updated status

PUT /api/v1/admin/users/{user_id}/role
  ├── Validate admin permissions
  ├── Change user role (Student/Creator/Admin)
  ├── Update permissions
  ├── Log role change event
  └── Return success status

DELETE /api/v1/admin/users/{user_id}
  ├── Verify admin permissions
  ├── Soft delete user account
  ├── Anonymize personal data
  ├── Transfer course ownership if creator
  └── Return deletion confirmation

POST /api/v1/admin/users/bulk-action
  ├── Verify admin permissions
  ├── Validate bulk operation
  ├── Process users in batches
  ├── Log all changes
  └── Return operation results

GET /api/v1/admin/courses
  ├── Verify admin role
  ├── Fetch all courses (including drafts)
  ├── Include creator info and status
  ├── Apply filters (status, creator, category)
  └── Return admin course list

PUT /api/v1/admin/courses/{course_id}/status
  ├── Verify admin permissions
  ├── Change course status (draft/review/published/archived)
  ├── Send notification to creator
  ├── Log status change
  └── Return updated course

PUT /api/v1/admin/courses/{course_id}/free
  ├── Verify admin role
  ├── Toggle course free badge
  ├── Update course pricing
  ├── Notify affected users
  └── Return updated course status

POST /api/v1/admin/courses/{course_id}/approve
  ├── Verify admin permissions
  ├── Review course content quality
  ├── Set status to published
  ├── Send approval notification
  └── Return approval status

DELETE /api/v1/admin/courses/{course_id}
  ├── Verify admin permissions
  ├── Check for enrolled students
  ├── Handle refunds if needed
  ├── Archive course data
  └── Return deletion confirmation

GET /api/v1/admin/analytics
  ├── Aggregate platform metrics
  ├── Calculate revenue data
  ├── User engagement statistics
  ├── Course performance data
  └── Return analytics dashboard
```

## 🤖 AI Assistant Workflows (`/api/v1/ai/*`)

```
POST /api/v1/ai/chat
  ├── Verify user authentication
  ├── Extract user context (current course, lesson)
  ├── Prepare AI prompt with context
  ├── Call PydanticAI service
  ├── Generate response with code examples
  ├── Log AI interaction
  └── Return AI response

POST /api/v1/ai/quiz-generate
  ├── Verify creator/admin role
  ├── Extract lesson transcript
  ├── Generate quiz questions via AI
  ├── Validate question format
  ├── Save generated quiz
  └── Return quiz questions

GET /api/v1/ai/learning-path
  ├── Analyze user progress
  ├── Identify knowledge gaps
  ├── Generate personalized recommendations
  ├── Calculate estimated learning time
  └── Return recommended learning path
```