# 📋 AI E-Learning Platform - Complete PRD

## 📝 Project Information
**Project Name:** AI E-Learning Platform  
**Version:** 1.0  
**Created:** January 20, 2025  
**Product Manager:** Julian  
**Status:** Ready for Development

---

# 📚 TABLE OF CONTENTS

## PART I: BUSINESS FOUNDATION
**Strategic Overview & Market Positioning**
- [🎯 Product Overview & Objectives](#-product-overview--objectives)
- [👥 User Personas & Target Audience](#-user-personas--target-audience)
- [💰 Business Model & Monetization](#-business-model--monetization)
- [📚 Content Strategy & Course Structure](#-content-strategy--course-structure)

## PART II: PRODUCT SPECIFICATION
**Feature Definition & User Experience**
- [🎭 User Roles & Permissions](#-user-roles--permissions)
- [🔧 Core Features & User Stories](#-core-features--user-stories)
- [🤖 AI-Powered Features](#-ai-powered-features)

## PART III: TECHNICAL ARCHITECTURE
**System Design & Development Framework**
- [🏗️ System Architecture & Tech Stack](#-system-architecture--tech-stack)
- [🏗️ Code Organization & Project Structure](#-code-organization--project-structure)
- [🗂️ API Design & Backend Workflows](#-frontend-pages-structure--backend-workflows)
- [🧪 Testing Strategy & Quality Assurance](#-testing-strategy--quality-assurance)
- [♿ Accessibility & Inclusive Design](#-accessibility--inclusive-design)

## PART IV: PRODUCTION REQUIREMENTS
**Quality, Security & Operations**
- [🔒 Security & Compliance](#-security--compliance)
- [📊 Analytics, Monitoring & Observability](#-analytics-monitoring--observability)
- [📱 Performance & Technical Requirements](#-performance--technical-requirements)
- [⚠️ Error Handling & Recovery](#-error-handling--recovery)
- [🏭 Infrastructure & Deployment](#-infrastructure--deployment)

## PART V: PROJECT EXECUTION
**Timeline, Delivery & Growth**
- [🚀 Development Phases & Timeline](#-development-phases--timeline)
- [📋 Launch Readiness & Quality Gates](#-launch-readiness--quality-gates)
- [🔄 Future Roadmap & Innovation](#-future-roadmap--innovation)

## PART VI: SUPPORT & DOCUMENTATION
**Knowledge Base & Maintenance**
- [❓ FAQ & Troubleshooting](#-faq--troubleshooting)

## PART VII: ENVIRONMENT SETUP
**Development Configuration**
- [🔧 Environment Setup & Configuration](#-part-vii-environment-setup--configuration)
- [📋 Document Control & Version History](#-document-control--version-history)

---  

# PART I: BUSINESS FOUNDATION

## 🎯 Product Overview & Objectives

### **Product Vision**
Build Vietnam's leading AI programming education platform, empowering developers from beginner to advanced levels to master AI/ML through high-quality video courses and intelligent AI assistants.

### **Business Objectives**
- **Primary Goal:** Become the #1 platform for AI programming education in Vietnam
- **Revenue Target:** $100K ARR within first 12 months
- **User Target:** 10,000 registered users, 1,000 paid subscribers

### **Problem Statement**
- Lack of high-quality AI programming resources in Vietnamese
- Developers struggle to access AI/ML due to insufficient practical guidance
- No mentorship and real-time support available for AI learning

### **Solution**
AI programming learning platform featuring:
- Video courses from beginner to advanced levels
- 24/7 AI Study Buddy support
- Interactive coding assignments
- Real-time progress tracking

## 👥 User Personas & Target Audience

### **Primary Persona - Junior Developer "Minh"**
- **Age:** 22-28
- **Occupation:** Web Developer, Fresh Graduate  
- **Goals:** Transition to AI/ML career, increase salary
- **Pain Points:** Don't know where to start, complex documentation
- **Behavior:** Online learner, prefers video content, active in tech communities

### **Secondary Persona - Senior Developer "Linh"**  
- **Age:** 28-35
- **Occupation:** Senior Engineer, Team Lead
- **Goals:** Upskill team, integrate AI into projects
- **Pain Points:** Limited time, needs practical examples  
- **Behavior:** Efficiency-focused, prefers microlearning

## 💰 Business Model & Monetization

### **Pricing Structure**
- **Pay-per-course:** Individual course purchases ($19-99/course)
- **Pro:** $29/month - unlimited access + full AI features
- **Premium Users:** Admin can grant individual users free access to all courses

### **Pricing Logic Flow:**
```
When user accesses course:
1. Check if course has "Free" badge? → Free access for everyone
2. Check if user has premium status? → Free access to all courses  
3. Check if user has Pro subscription? → Full access
4. Check if user purchased this course? → Access granted
5. If none → Display payment options with clear pricing (individual purchase or Pro upgrade)
```

### **Revenue Sources**
- **Subscription Revenue:** $29/month Pro plans
- **Pay-per-course:** Individual course purchases ($19-99/course)

## 📚 Content Strategy & Course Structure

### **Course Categories**
1. **Programming Foundations**
   - HTML/CSS Basics
   - JavaScript Fundamentals  
   - React Development
   - Python for Beginners

2. **AI Fundamentals**
   - Python for AI/ML
   - Mathematical Foundations (Linear Algebra, Statistics)
   - Basic ML Algorithms

3. **Machine Learning**
   - Supervised/Unsupervised Learning
   - Deep Learning with TensorFlow/PyTorch
   - Computer Vision, NLP

4. **AI Tools & Frameworks**
   - Anthropic Claude 3.5 Sonnet
   - LangChain, LlamaIndex
   - Vector Databases (Pinecone, Weaviate)

5. **Production AI**
   - MLOps, Model Deployment
   - AI System Architecture
   - Performance Optimization

### **Content Hierarchy**
**Structure:** Course → Chapter → Lesson
- **Course:** Complete learning path (10-20 hours)
- **Chapter:** Topic-based modules (1-3 hours) 
- **Lesson:** Focused videos (5-15 minutes)

# PART II: PRODUCT SPECIFICATION

## 🎭 User Roles & Permissions

### **Student (Learner) - Default role upon registration**
- Watch videos, read materials
- Take quizzes and exercises
- Track personal progress
- Comment and discuss
- Download materials

### **Content Creator**
- Upload video courses
- Create quiz for each lesson
- Set course pricing (Free/Paid)
- Manage student comments
- View analytics and revenue
- Edit course content after publish

#### **Course Creation Workflow - Best Practice Pattern**
```
User Story: As a Content Creator, I want to create courses quickly and be redirected immediately to the editor to start building content

Workflow:
1. Click "Create New Course" button
2. Course is created with temporary name: "Untitled Course #1 (250115)"
   - Format: "Untitled Course #{count} ({short_date})"
   - Short date format: DDMMYY (15/01/25 → 150125)
   - Counter increments based on courses created per day
3. Auto-redirect to /courses/:id/edit
4. Course editor displays with inline name editing
5. User can edit name by clicking on title
6. Auto-save when user blurs from input field

Frontend Behavior:
- No modal/form required for creation
- Immediate redirect to editor
- Inline editing for course name
- Clear visual cues for unsaved changes
- Progressive disclosure of advanced settings
```

### **Admin**
- **Set user roles:** Can change users to Admin, Content Creator, or Student
- **Set premium users:** Assign "premium" status for users to access all courses for free
- **Set course pricing:** Assign "Free" badge for free courses, assign pricing badge for paid courses
- **Create courses:** Admin can also create courses like Content Creator
- Approve courses before publish
- Manage users and content
- View platform analytics
- Configure AI features
- Handle customer support

#### **Admin Course Creation Permissions**
```
Admin has all permissions of Content Creator + additional admin functions:
- Create course with same workflow as Content Creator
- Set course visibility (public/private/draft)
- Assign course ownership to other Content Creators
- Override course pricing and free status
- Access course analytics of all creators
```

## 🔧 Core Features & User Stories

### **1. Authentication & Onboarding**

**User Stories:**
- As a Student, I want to register quickly to start learning immediately
- As a User, I want to login with Google/GitHub so I don't have to remember a new password

**Acceptance Criteria:**
```
Given: User on homepage
When: Click "Sign Up"  
Then:
- Form displays with fields: Full Name, Email, Password
- Social login buttons (Google, Facebook, Microsoft, GitHub)
- Email verification with SMTP config (info@choiceind.com)
- Create account in <3 seconds
- Default role = Student

Given: New user after registration and email verification
When: First login successful
Then:
- Redirect directly to Student Dashboard
- Dashboard displays: enrolled courses, progress, recommendations
- Onboarding wizard optional (can skip)
```

**User Workflow - Registration:**
```mermaid
graph TD
    A[Homepage] --> B[Click Sign Up]
    B --> C[Choose Login Method]
    C --> D[Email/Password]
    C --> E[Social Login]
    D --> F[Fill Form]
    E --> F
    F --> G[Email Verification]
    G --> H[Onboarding Wizard]
    H --> I[Choose Learning Path]
    I --> J[Profile Setup]
    J --> K[Course Recommendations]
    K --> L[Dashboard]
```
### **2. Course Discovery & Enrollment**

**User Stories:**
- As a Student, I want to find courses easily by skill level
- As a Student, I want to preview course content before enrolling
- As a Student, I want to save courses to learn later

**Acceptance Criteria:**
```
Given: User on course catalog
When: Search "TensorFlow"
Then:
- Results are filtered by relevance
- Display course thumbnails with pricing badge (Free/$X)
- Course info clearly visible (description, syllabus, ratings)
- Duration and difficulty level visible

Given: User viewing course page
When: Click "Enroll"
Then:
- Check if course has "Free" badge? → Access immediately
- Check Pro subscription? → Access immediately  
- Paid course → Display payment options with clear pricing
- Course is added to "My Learning"
- Email confirmation sent
```

**User Workflow - Course Discovery:**
```mermaid
graph TD
    A[Dashboard] --> B[Browse Courses]
    B --> C[Search/Filter]
    C --> D[View Course Details]
    D --> E[Preview Content]
    E --> F[Check Prerequisites]
    F --> G[Enrollment Decision]
    G --> H[Check User Status]
    H --> I[Free User/Pro/Purchased?]
    I --> J[Free Access]
    I --> K[Payment Required]
    K --> L[Payment Process]
    L --> M[Payment Success]
    J --> N[Course Dashboard]
    M --> N
```

### **3. Video Learning Experience with Sequential Learning**

**User Stories:**
- As a Student, I want videos with multiple playback speeds
- As a Student, I want to learn in the designed sequence
- As a Student, I want to continue from the last position I watched
- As a Student, I want to not be distracted by YouTube controls

**Acceptance Criteria:**
```
Given: Student is watching video lesson
When: Video player loads
Then:
- YouTube embed with controls=0 (disable seekbar drag)
- Video auto-resume from last position
- Progress automatically tracked
- Next lesson locked until current lesson complete

Given: Student completes lesson (watch 80% video)
When: Lesson marked complete
Then:
- Next lesson automatically unlocked
- Progress bar updated
- Quiz/assignment displays (if available)
- Auto-suggest next lesson

Given: Student attempts to skip lessons
When: Click on future lessons
Then:
- Display "Complete previous lessons first"
- Redirect to current lesson
- Clear indication of completion requirements
```

**User Workflow - Sequential Video Learning:**
```mermaid
graph TD
    A[Course Dashboard] --> B[Start with Lesson 1]
    B --> C[Video Player Loads]
    C --> D[Watch Video - No Skip Controls]
    D --> E[Track Progress]
    E --> F[80% Complete?]
    F --> G[No: Continue Watching]
    F --> H[Yes: Mark Lesson Complete]
    G --> D
    H --> I[Show Quiz/Assignment]
    I --> J[Complete Quiz]
    J --> K[Unlock Next Lesson]
    K --> L[Auto-suggest Next Lesson]
    L --> M[Continue to Next or Dashboard]
```

### **4. AI-Powered Learning Assistant**

**User Stories:**
- As a Student, I want to ask questions about course content
- As a Student, I want to get help with coding when stuck
- As a Student, I want to receive personalized study recommendations

**Acceptance Criteria:**
```
Given: Student is stuck on coding assignment
When: Ask AI Study Buddy "How to implement CNN in TensorFlow?"
Then:
- Response within 3 seconds
- Code examples included
- Links to relevant course sections
- Follow-up questions suggested

Given: Student completes course
When: Ask for next learning path
Then:
- Personalized recommendations based on progress
- Skill gap analysis
- Estimated learning time
- Prerequisite courses highlighted
```

**User Workflow - AI Assistant:**
```mermaid
graph TD
    A[Student has Questions] --> B[Open AI Chat]
    B --> C[Type Question]
    C --> D[AI Processing]
    D --> E[Context Analysis]
    E --> F[Course Content Reference]
    F --> G[Generate Response]
    G --> H[Show Code Examples]
    G --> I[Provide Explanations]
    G --> J[Suggest Resources]
    H --> K[Student Feedback]
    I --> K
    J --> K
```

### **5. Progress Tracking & Achievements**

**User Stories:**
- As a Student, I want to view overall learning progress
- As a Student, I want to earn certificates for completed courses
- As a Student, I want to track coding assignment scores

**Acceptance Criteria:**
```
Given: Student completes lesson
When: Progress updates
Then:
- Lesson is marked complete with checkmark
- Course progress percentage updated
- Time spent recorded
- Next lesson unlocked

Given: Student completes entire course
When: Final assessment passed (>80%)
Then:
- Certificate auto-generated with student name
- Shareable LinkedIn certificate link
- Added to student achievements
- Email notification sent
```

**User Workflow - Progress Tracking:**
```mermaid
graph TD
    A[Lesson Start] --> B[Video Completion]
    B --> C[Mark as Complete]
    C --> D[Update Progress Bar]
    D --> E[Save to Database]
    E --> F[Check Course Completion]
    F --> G[All Lessons Done?]
    G --> H[Yes: Generate Certificate]
    G --> I[No: Recommend Next Lesson]
    H --> J[Certificate Available]
    I --> K[Continue Learning]
```

### **6. Quiz & Assessment System - Per Lesson**

**User Stories:**
- As a Student, I want to take quiz after each lesson to reinforce knowledge
- As a Student, I want to receive immediate feedback on answers
- As a Student, I want to see explanations when answering incorrectly

**Acceptance Criteria:**
```
Given: Student completes video lesson
When: Quiz displays
Then:
- Quiz questions related to lesson content
- Multiple choice format with 4 options
- Must score ≥70% to pass
- Immediate feedback after submit

Given: Student fails quiz (<70%)
When: Click "Retry"
Then:
- Quiz reset with questions shuffle
- Previous answers cleared
- Unlimited retry attempts
- Hints display after 2 failed attempts

Given: Student passes quiz (≥70%)
When: Quiz completed
Then:
- Next lesson unlocked
- Progress updated
- Success message displays
- Option to continue to next lesson
```

**User Workflow - Per-Lesson Quiz:**
```mermaid
graph TD
    A[Complete Video Lesson] --> B[Quiz Appears]
    B --> C[Answer Questions]
    C --> D[Submit Quiz]
    D --> E[Score ≥70%?]
    E --> F[Pass: Next Lesson Unlocked]
    E --> G[Fail: Show Explanations]
    G --> H[Retry Quiz]
    H --> C
    F --> I[Continue to Next Lesson]
    F --> J[Return to Course Dashboard]
```

## 🤖 AI-Powered Features

---

# PART III: TECHNICAL ARCHITECTURE

## 🏗️ System Architecture & Tech Stack

### **Technology Stack**
- **Frontend:** NextJS 14+ (App Router), TailwindCSS, TypeScript
- **Backend:** FastAPI (Python), PydanticAI
- **Database:** MongoDB Atlas
- **Authentication:** NextAuth.js (frontend) + JWT verification (FastAPI backend)
- **Storage:** localStorage (development), migrating to AWS S3/Google Cloud
- **CDN:** Cloudflare for video streaming and static files
- **Video:** YouTube embed + transcript extraction
- **Payment:** Stripe, MoMo, ZaloPay

### **Performance Requirements**
- Support 10,000 concurrent users
- Page load time < 2 seconds
- Video streaming with 99.9% uptime
- Responsive mobile design

### **Study Buddy - Intelligent Q&A**
```python
# Example AI prompt structure
system_prompt = """
You are an AI Study Buddy specializing in AI programming.
Context: Student is learning {course_name}, lesson "{lesson_title}"
Course content: {transcript_content}
Student level: {user_level}

Answer questions with:
- Practical code examples
- Simple explanations in user's preferred language
- Links to relevant course sections
- Follow-up questions to deepen understanding
"""
```

### **Quiz Generator - Auto Assessment**
- Extract key concepts from video transcripts
- Generate multiple choice questions
- Create coding challenges based on lesson content
- Adaptive difficulty based on student performance

### **Learning Path Optimizer**
- Analyze student progress patterns
- Recommend optimal next courses
- Identify knowledge gaps
- Suggest review materials

### **Progress Coach - Personal Mentor**
- Weekly learning summary emails
- Motivation messages when student is stuck
- Study habit recommendations
- Goal setting and tracking

## 🏗️ Code Organization & Project Structure

### **📋 DESIGN SYSTEM REFERENCE**
**UI Design System:** See [UI_DESIGN_SYSTEM.md](./UI_DESIGN_SYSTEM.md) for complete visual specifications
- Color palette, component patterns, accessibility guidelines
- E-learning specific components (pricing badges, progress bars, quiz interfaces)  
- WCAG 2.1 AA compliance specifications
- Responsive design patterns and CSS variables

### **📁 Frontend Structure (NextJS 14+ App Router)**

```
frontend/
├── app/                              # NextJS 14+ App Router
│   ├── (public)/                    # Route Groups - Public pages
│   │   ├── page.tsx                 # Homepage (/)
│   │   ├── courses/
│   │   │   ├── page.tsx             # Course catalog (/courses)
│   │   │   └── [id]/
│   │   │       └── page.tsx         # Course detail (/courses/:id)
│   │   ├── about/
│   │   │   └── page.tsx             # About us (/about)
│   │   ├── contact/
│   │   │   └── page.tsx             # Contact (/contact)
│   │   ├── faq/
│   │   │   └── page.tsx             # FAQ page (/faq)
│   │   └── pricing/
│   │       └── page.tsx             # Pricing plans (/pricing)
│   ├── (auth)/                      # Route Groups - Authentication
│   │   ├── login/
│   │   │   └── page.tsx             # Login page (/login)
│   │   ├── register/
│   │   │   └── page.tsx             # Register page (/register)
│   │   └── layout.tsx
│   ├── (dashboard)/                 # Route Groups - Authenticated pages
│   │   ├── dashboard/
│   │   │   └── page.tsx             # Student Dashboard (/dashboard)
│   │   ├── learn/
│   │   │   └── [courseId]/
│   │   │       └── [lessonId]/
│   │   │           └── page.tsx     # Course Player (/learn/:courseId/:lessonId)
│   │   ├── my-courses/
│   │   │   └── page.tsx             # My Learning (/my-courses)
│   │   ├── profile/
│   │   │   └── page.tsx             # Profile (/profile)
│   │   ├── certificates/
│   │   │   └── page.tsx             # Certificates (/certificates)
│   │   ├── billing/
│   │   │   └── page.tsx             # Payment & billing (/billing)
│   │   └── layout.tsx
│   ├── (creator)/                   # Route Groups - Content Creator
│   │   ├── creator/
│   │   │   ├── page.tsx             # Creator Dashboard (/creator)
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx         # Course Management (/creator/courses)
│   │   │   │   └── new/
│   │   │   │       └── page.tsx     # Course Builder (/creator/courses/new)
│   │   │   └── analytics/
│   │   │       └── page.tsx         # Analytics (/creator/analytics)
│   │   └── layout.tsx
│   ├── (admin)/                     # Route Groups - Admin
│   │   ├── admin/
│   │   │   ├── page.tsx             # Admin Dashboard (/admin)
│   │   │   ├── users/
│   │   │   │   └── page.tsx         # User Management (/admin/users)
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx         # Course Management (/admin/courses)
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx     # Course overview
│   │   │   │       ├── lessons/
│   │   │   │       │   ├── page.tsx # Lesson management list
│   │   │   │       │   └── [lessonId]/
│   │   │   │       │       └── page.tsx # Individual lesson editor
│   │   │   │       └── chapters/
│   │   │   │           ├── page.tsx # Chapter management list
│   │   │   │           └── [chapterId]/
│   │   │   │               └── page.tsx # Individual chapter editor
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx         # Analytics (/admin/analytics)
│   │   │   └── settings/
│   │   │       └── page.tsx         # Settings (/admin/settings)
│   │   └── layout.tsx
│   ├── globals.css
│   └── layout.tsx                   # Root layout
├── components/                      # Reusable components
│   ├── ui/                         # Basic UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── SaveStatusIndicator.tsx # ✨ NEW - Shows save status
│   │   └── UnsavedChangesWarning.tsx # ✨ NEW - Warns about unsaved changes
│   ├── feature/                    # Feature-specific components
│   │   ├── CourseCard.tsx
│   │   ├── VideoPlayer.tsx
│   │   ├── QuizComponent.tsx
│   │   ├── ProgressTracker.tsx
│   │   ├── AIAssistant.tsx
│   │   ├── CertificateDisplay.tsx
│   │   └── NavigationGuard.tsx     # ✨ NEW - Prevents navigation with unsaved changes
│   └── layout/                     # Layout components
│       ├── Header.tsx
│       ├── Footer.tsx
│       ├── Sidebar.tsx
│       └── Navigation.tsx
├── lib/                           # Utility functions & configurations
│   ├── api/                       # API client functions
│   │   ├── auth.ts
│   │   ├── courses.ts
│   │   ├── chapters.ts
│   │   ├── lessons.ts
│   │   ├── quizzes.ts
│   │   ├── faq.ts
│   │   ├── users.ts
│   │   ├── payments.ts
│   │   └── admin.ts
│   ├── utils/                     # Helper functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── auth-helpers.ts
│   │   └── video-helpers.ts
│   ├── constants/                 # App constants
│   │   ├── api-endpoints.ts
│   │   ├── app-config.ts
│   │   └── course-categories.ts
│   └── types/                     # TypeScript types
│       ├── auth.ts
│       ├── course.ts
│       ├── chapter.ts
│       ├── lesson.ts
│       ├── faq.ts
│       ├── user.ts
│       └── api.ts
├── hooks/                         # Custom React hooks
│   ├── useAuth.ts
│   ├── useCourses.ts
│   ├── useProgress.ts
│   ├── useQuiz.ts
│   ├── useLocalStorage.ts
│   ├── useAPI.ts
│   ├── useAutosave.ts             # ✨ NEW - Autosave functionality
│   └── useNavigationGuard.ts     # ✨ NEW - Navigation protection
├── stores/                        # State management (Zustand/Context)
│   ├── authStore.ts
│   ├── courseStore.ts
│   ├── progressStore.ts
│   ├── uiStore.ts
│   └── editorStore.ts             # ✨ NEW - Editor state management
├── styles/                        # Styling files
│   ├── globals.css
│   └── components.css
├── public/                        # Static assets
│   ├── icons/
│   ├── images/
│   └── favicon.ico
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

### **🔧 Development Standards & Pattern Enforcement**

#### **📋 CODING STANDARDS REFERENCE**
**Detailed Standards:** See `CODING_RULES.md` for complete development guidelines
- Naming conventions, code formatting, and documentation standards
- TypeScript usage patterns and error handling best practices
- API design patterns and testing requirements
- UI/UX consistency rules and accessibility compliance

#### **🔒 PATTERN CONSISTENCY MATRIX**

| Feature Type | Mandatory Pattern | Reference Files |
|--------------|-------------------|-----------------|
| **CRUD Forms** | `useAutosave` + `NavigationGuard` + `SaveStatusIndicator` | `/courses/[id]/edit/page.tsx` |
| **API Calls** | `try/catch` + `loading states` + `error boundaries` | `/lib/api/*.ts` |
| **Authentication** | `NextAuth` + `useAuth` hook + `JWT verification` | `/hooks/useAuth.ts` |
| **Data Fetching** | `React Query` + `loading/error/success` states | `/hooks/useAPI.ts` |
| **Form Validation** | `Zod schemas` + `react-hook-form` | `/lib/validators/*.ts` |
| **Error Handling** | `ErrorBoundary` + `toast notifications` + `Sentry logging` | `/components/ErrorBoundary.tsx` |

#### **🎯 GOLDEN RULE: COPY-PASTE CONSISTENCY**
```typescript
// ✅ CORRECT: When building new features, COPY exact pattern from existing
// Example: Create Chapter Editor → Copy from Course Editor pattern
const ChapterEditor = () => {
  // Same hooks order
  const { courseData, setCourseData } = useState();
  const { forceSave, saveStatus } = useAutosave();
  const { reset } = useEditorStore();
  
  // Same error handling
  // Same UI structure
  // Same navigation guard
}

// ❌ WRONG: Create new pattern for same functionality
const ChapterEditor = () => {
  // Different state management
  // Different save logic  
  // Different error handling
}
```

#### **🔔 USER FEEDBACK PATTERN**

**Backend (FastAPI):**
- ❌ NO toast notifications
- ✅ Return structured JSON responses
- ✅ Use HTTP status codes correctly
- ✅ Include helpful error messages

**Frontend (React):**
- ✅ Handle API responses
- ✅ Show toast notifications to user
- ✅ Display loading/error states
- ✅ Provide user feedback for all actions

```typescript
// MANDATORY API Response Pattern
// Backend returns using StandardResponse:
class StandardResponse<T> {
  success: boolean;
  data?: T;
  message: string;
}

// Frontend handles:
const result = await apiCall<StandardResponse<DataType>>();
if (result.success) {
  toast.success(result.message);
} else {
  toast.error(result.message);
}
```

#### **🚨 CRITICAL RULE: ZERO SCOPE CREEP**

**GOLDEN RULE: ONLY CHANGE WHAT'S EXPLICITLY REQUESTED**

**❌ STRICTLY FORBIDDEN:**
- Making "improvements" not requested
- Changing UI elements not mentioned
- Removing buttons/badges/features
- Modifying layouts for "consistency"
- Adding new functionality
- Changing file structure
- Updating dependencies
- Refactoring code for "better practices"

**✅ ALLOWED ONLY:**
- Exact changes requested by user
- Nothing more, nothing less
- Zero creative additions

### **📁 Backend Structure (FastAPI)**

```
backend/
├── app/                           # Application code
│   ├── api/                       # API endpoints
│   │   ├── v1/                    # API version 1
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py        # Authentication endpoints
│   │   │   │   ├── courses.py     # Course management
│   │   │   │   ├── chapters.py    # Chapter management
│   │   │   │   ├── lessons.py     # Lesson & video tracking
│   │   │   │   ├── quizzes.py     # Quiz system
│   │   │   │   ├── users.py       # User management
│   │   │   │   ├── payments.py    # Payment processing
│   │   │   │   ├── faq.py         # FAQ management
│   │   │   │   ├── admin.py       # Admin operations
│   │   │   │   └── ai.py          # AI assistant endpoints
│   │   │   └── api.py             # API router
│   │   └── deps.py                # Dependencies
│   ├── core/                      # Core functionality
│   │   ├── config.py              # App configuration
│   │   ├── security.py            # Security utilities
│   │   ├── database.py            # Database connection
│   │   └── exceptions.py          # Custom exceptions
│   ├── models/                    # Database models
│   │   ├── user.py
│   │   ├── course.py
│   │   ├── chapter.py
│   │   ├── lesson.py
│   │   ├── quiz.py
│   │   ├── faq.py
│   │   ├── progress.py
│   │   └── payment.py
│   ├── schemas/                   # Pydantic schemas
│   │   ├── auth.py
│   │   ├── course.py
│   │   ├── chapter.py
│   │   ├── lesson.py
│   │   ├── quiz.py
│   │   ├── faq.py
│   │   ├── user.py
│   │   └── payment.py
│   ├── services/                  # Business logic
│   │   ├── auth_service.py
│   │   ├── course_service.py
│   │   ├── chapter_service.py
│   │   ├── lesson_service.py
│   │   ├── quiz_service.py
│   │   ├── faq_service.py
│   │   ├── payment_service.py
│   │   ├── ai_service.py          # PydanticAI integration
│   │   └── email_service.py
│   ├── utils/                     # Utility functions
│   │   ├── email.py
│   │   ├── video_utils.py
│   │   └── helpers.py
│   └── main.py                    # FastAPI app entry point
├── tests/                         # Test files
│   ├── test_auth.py
│   ├── test_courses.py
│   └── test_api.py
├── requirements.txt
├── alembic/                       # Database migrations
└── README.md
```

### **📁 Root Project Structure**

```
AI-E-LEARNING/                        # Root project directory
├── .gitignore                         # Git ignore file (includes .env files)
├── frontend/                          # NextJS frontend application
├── backend/                           # FastAPI backend application
├── plans/                             # Project documentation and implementation plans
│   ├── PRD.md                         # Product Requirements Document
│   ├── CODING_RULES.md                # Development standards
│   ├── UI_DESIGN_SYSTEM.md            # Design system
│   ├── PHASE_1_FOUNDATION.md          # Phase 1 implementation plan
│   ├── PHASE_2_ENHANCED.md            # Phase 2 implementation plan
│   ├── PHASE_3_AI_INTELLIGENCE.md     # Phase 3 implementation plan
│   ├── PHASE_4_ENTERPRISE.md          # Phase 4 implementation plan
│   ├── TECHNICAL_ARCHITECTURE.md      # Technical specifications
│   ├── AI_DETAILED_IMPLEMENTATION.md  # AI implementation details
│   ├── PAYMENT_PROVIDERS.md           # Payment integration guide
│   ├── SECURITY_COMPLIANCE.md         # Security specifications
│   ├── TESTING_STRATEGY.md            # Testing framework
│   ├── INTERNATIONALIZATION.md        # i18n implementation
│   ├── PERFORMANCE_OPTIMIZATION.md    # Performance guidelines
│   ├── ADMIN_IMPLEMENTATION.md        # Admin panel specifications
│   └── IMPLEMENTATION_MASTER_PLAN.md  # Complete implementation roadmap
├── scripts/                           # Utility scripts
│   ├── generate-secrets.js            # Auto-generate environment secrets
│   ├── setup-dev.sh                   # Development environment setup
│   └── deploy.sh                      # Deployment script
├── docker-compose.yml                 # Docker development setup
├── package.json                       # Root package.json for workspace
├── .env.local                         # Development environment (DO NOT COMMIT)
├── .env.production                    # Production environment (DO NOT COMMIT)
└── README.md                          # Project overview
```

## 🗂️ Database Schemas & Data Models

### **📊 Complete MongoDB Schemas**

**User Schema (users collection):**
```javascript
const userSchema = {
  _id: ObjectId,
  email: { type: String, unique: true, required: true, index: true },
  password: { type: String, required: true }, // hashed with bcrypt
  name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'creator', 'admin'], 
    default: 'student',
    index: true 
  },
  premium_status: { type: Boolean, default: false, index: true },
  is_verified: { type: Boolean, default: false },
  verification_token: String,
  reset_password_token: String,
  reset_password_expires: Date,
  
  // Subscription details
  subscription: {
    type: { type: String, enum: ['free', 'pro'], default: 'free' },
    status: { 
      type: String, 
      enum: ['active', 'inactive', 'cancelled', 'past_due'], 
      default: 'inactive' 
    },
    stripe_customer_id: String,
    stripe_subscription_id: String,
    current_period_start: Date,
    current_period_end: Date,
    cancel_at_period_end: { type: Boolean, default: false }
  },
  
  // Profile information
  profile: {
    avatar: String, // URL to profile image
    bio: String,
    location: String,
    linkedin: String,
    github: String,
    website: String,
    title: String, // Job title
    skills: [String], // Array of skills
    learning_goals: [String]
  },
  
  // Learning statistics
  stats: {
    courses_enrolled: { type: Number, default: 0 },
    courses_completed: { type: Number, default: 0 },
    total_hours_learned: { type: Number, default: 0 },
    certificates_earned: { type: Number, default: 0 },
    current_streak: { type: Number, default: 0 },
    longest_streak: { type: Number, default: 0 },
    last_active: Date
  },
  
  // Preferences
  preferences: {
    language: { type: String, default: 'vi' },
    timezone: { type: String, default: 'Asia/Ho_Chi_Minh' },
    email_notifications: { type: Boolean, default: true },
    push_notifications: { type: Boolean, default: true },
    marketing_emails: { type: Boolean, default: false }
  },
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  last_login: Date
};

// Indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "premium_status": 1 });
db.users.createIndex({ "subscription.status": 1 });
db.users.createIndex({ "created_at": -1 });
```

**Course Schema (courses collection):**
```javascript
const courseSchema = {
  _id: ObjectId,
  title: { type: String, required: true },
  description: { type: String, required: true },
  short_description: String, // For course cards
  slug: { type: String, unique: true, index: true },
  
  // Course metadata
  category: { 
    type: String, 
    enum: ['programming', 'ai-fundamentals', 'machine-learning', 'ai-tools', 'production-ai'],
    required: true,
    index: true 
  },
  level: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'], 
    required: true,
    index: true 
  },
  language: { type: String, default: 'vi' },
  
  // Creator information
  creator_id: { type: ObjectId, ref: 'User', required: true, index: true },
  creator_name: String, // Denormalized for performance
  
  // Course content
  thumbnail: String, // URL to course thumbnail
  preview_video: String, // URL to preview video
  syllabus: [String], // Array of learning objectives
  prerequisites: [String],
  target_audience: [String],
  
  // Pricing
  pricing: {
    is_free: { type: Boolean, default: false, index: true },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    discount_price: Number,
    discount_expires: Date
  },
  
  // Course structure
  total_chapters: { type: Number, default: 0 },
  total_lessons: { type: Number, default: 0 },
  total_duration: { type: Number, default: 0 }, // in minutes
  
  // Course status
  status: { 
    type: String, 
    enum: ['draft', 'review', 'published', 'archived'], 
    default: 'draft',
    index: true 
  },
  published_at: Date,
  
  // Statistics
  stats: {
    total_enrollments: { type: Number, default: 0 },
    active_students: { type: Number, default: 0 },
    completion_rate: { type: Number, default: 0 },
    average_rating: { type: Number, default: 0 },
    total_reviews: { type: Number, default: 0 },
    total_revenue: { type: Number, default: 0 }
  },
  
  // SEO and marketing
  seo: {
    meta_title: String,
    meta_description: String,
    keywords: [String]
  },
  
  created_at: { type: Date, default: Date.now, index: true },
  updated_at: { type: Date, default: Date.now }
};

// Indexes
db.courses.createIndex({ "creator_id": 1 });
db.courses.createIndex({ "category": 1, "level": 1 });
db.courses.createIndex({ "status": 1 });
db.courses.createIndex({ "pricing.is_free": 1 });
db.courses.createIndex({ "stats.total_enrollments": -1 });
db.courses.createIndex({ "created_at": -1 });
```

**Chapter Schema (chapters collection):**
```javascript
const chapterSchema = {
  _id: ObjectId,
  course_id: { type: ObjectId, ref: 'Course', required: true, index: true },
  title: { type: String, required: true },
  description: String,
  
  // Chapter order within course
  order: { type: Number, required: true },
  
  // Chapter content
  total_lessons: { type: Number, default: 0 },
  total_duration: { type: Number, default: 0 }, // in minutes
  
  // Chapter status
  status: { 
    type: String, 
    enum: ['draft', 'published'], 
    default: 'draft' 
  },
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
};

// Indexes
db.chapters.createIndex({ "course_id": 1, "order": 1 });
```

**Lesson Schema (lessons collection):**
```javascript
const lessonSchema = {
  _id: ObjectId,
  course_id: { type: ObjectId, ref: 'Course', required: true, index: true },
  chapter_id: { type: ObjectId, ref: 'Chapter', required: true, index: true },
  title: { type: String, required: true },
  description: String,
  
  // Lesson order within chapter
  order: { type: Number, required: true },
  
  // Video content
  video: {
    url: String, // YouTube URL or CDN URL
    youtube_id: String, // YouTube video ID
    duration: Number, // in seconds
    transcript: String, // Auto-generated or manual transcript
    captions: String, // URL to captions file
    thumbnail: String // Video thumbnail URL
  },
  
  // Lesson content
  content: String, // Rich text content/notes
  resources: [{
    title: String,
    type: { type: String, enum: ['pdf', 'code', 'link', 'exercise'] },
    url: String,
    description: String
  }],
  
  // Quiz association
  has_quiz: { type: Boolean, default: false },
  quiz_required: { type: Boolean, default: false },
  
  // Sequential learning
  unlock_conditions: {
    previous_lesson_required: { type: Boolean, default: true },
    quiz_pass_required: { type: Boolean, default: false },
    minimum_watch_percentage: { type: Number, default: 80 }
  },
  
  // Lesson status
  status: { 
    type: String, 
    enum: ['draft', 'published'], 
    default: 'draft' 
  },
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
};

// Indexes
db.lessons.createIndex({ "course_id": 1 });
db.lessons.createIndex({ "chapter_id": 1, "order": 1 });
```

**Quiz Schema (quizzes collection):**
```javascript
const quizSchema = {
  _id: ObjectId,
  lesson_id: { type: ObjectId, ref: 'Lesson', required: true, index: true },
  course_id: { type: ObjectId, ref: 'Course', required: true, index: true },
  title: { type: String, required: true },
  description: String,
  
  // Quiz configuration
  config: {
    time_limit: Number, // in minutes, null = no limit
    pass_percentage: { type: Number, default: 70 },
    max_attempts: { type: Number, default: 3 },
    shuffle_questions: { type: Boolean, default: true },
    shuffle_answers: { type: Boolean, default: true },
    show_correct_answers: { type: Boolean, default: true },
    immediate_feedback: { type: Boolean, default: true }
  },
  
  // Questions array
  questions: [{
    question: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['multiple_choice', 'true_false', 'fill_blank'], 
      default: 'multiple_choice' 
    },
    options: [String], // Answer choices
    correct_answer: Number, // Index of correct answer
    explanation: String, // Explanation for correct answer
    points: { type: Number, default: 1 }
  }],
  
  total_points: { type: Number, default: 0 },
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
};

// Indexes
db.quizzes.createIndex({ "lesson_id": 1 });
db.quizzes.createIndex({ "course_id": 1 });
```

**Progress Schema (progress collection):**
```javascript
const progressSchema = {
  _id: ObjectId,
  user_id: { type: ObjectId, ref: 'User', required: true, index: true },
  course_id: { type: ObjectId, ref: 'Course', required: true, index: true },
  lesson_id: { type: ObjectId, ref: 'Lesson', required: true, index: true },
  
  // Video progress
  video_progress: {
    watch_percentage: { type: Number, default: 0 }, // 0-100
    current_position: { type: Number, default: 0 }, // in seconds
    total_watch_time: { type: Number, default: 0 }, // in seconds
    is_completed: { type: Boolean, default: false },
    completed_at: Date
  },
  
  // Quiz progress (if lesson has quiz)
  quiz_progress: {
    attempts: [{
      attempt_number: Number,
      score: Number, // 0-100 percentage
      total_questions: Number,
      correct_answers: Number,
      time_taken: Number, // in seconds
      passed: Boolean,
      answers: [Number], // Array of selected answer indexes
      attempted_at: Date
    }],
    best_score: { type: Number, default: 0 },
    total_attempts: { type: Number, default: 0 },
    is_passed: { type: Boolean, default: false },
    passed_at: Date
  },
  
  // Overall lesson status
  is_unlocked: { type: Boolean, default: false },
  is_completed: { type: Boolean, default: false },
  
  // Timestamps
  started_at: Date,
  completed_at: Date,
  last_accessed: Date,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
};

// Indexes
db.progress.createIndex({ "user_id": 1, "course_id": 1 });
db.progress.createIndex({ "user_id": 1, "lesson_id": 1 });
db.progress.createIndex({ "course_id": 1, "lesson_id": 1 });
```

**Payment Schema (payments collection):**
```javascript
const paymentSchema = {
  _id: ObjectId,
  user_id: { type: ObjectId, ref: 'User', required: true, index: true },
  
  // Payment details
  type: { 
    type: String, 
    enum: ['course_purchase', 'subscription', 'refund'], 
    required: true,
    index: true 
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  
  // Related entities
  course_id: { type: ObjectId, ref: 'Course' }, // For course purchases
  subscription_id: String, // Stripe subscription ID
  
  // Payment provider details
  provider: { 
    type: String, 
    enum: ['stripe', 'momo', 'zalopay'], 
    required: true 
  },
  provider_payment_id: String, // Payment ID from provider
  provider_customer_id: String, // Customer ID from provider
  
  // Payment status
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'], 
    default: 'pending',
    index: true 
  },
  
  // Payment metadata
  metadata: {
    payment_method: String, // card, bank_transfer, etc.
    last_4_digits: String, // For cards
    brand: String, // visa, mastercard, etc.
    country: String
  },
  
  // Timestamps
  paid_at: Date,
  refunded_at: Date,
  created_at: { type: Date, default: Date.now, index: true },
  updated_at: { type: Date, default: Date.now }
};

// Indexes
db.payments.createIndex({ "user_id": 1, "status": 1 });
db.payments.createIndex({ "type": 1, "status": 1 });
db.payments.createIndex({ "created_at": -1 });
```

**Enrollment Schema (enrollments collection):**
```javascript
const enrollmentSchema = {
  _id: ObjectId,
  user_id: { type: ObjectId, ref: 'User', required: true, index: true },
  course_id: { type: ObjectId, ref: 'Course', required: true, index: true },
  
  // Enrollment details
  enrollment_type: { 
    type: String, 
    enum: ['free', 'purchased', 'subscription', 'admin_granted'], 
    required: true 
  },
  payment_id: { type: ObjectId, ref: 'Payment' }, // For purchased courses
  
  // Progress tracking
  progress: {
    lessons_completed: { type: Number, default: 0 },
    total_lessons: { type: Number, default: 0 },
    completion_percentage: { type: Number, default: 0 },
    total_watch_time: { type: Number, default: 0 }, // in minutes
    current_lesson_id: { type: ObjectId, ref: 'Lesson' },
    is_completed: { type: Boolean, default: false },
    completed_at: Date
  },
  
  // Certificate
  certificate: {
    is_issued: { type: Boolean, default: false },
    issued_at: Date,
    certificate_id: String, // Unique certificate identifier
    final_score: Number, // Overall course score
    verification_url: String
  },
  
  // Access control
  is_active: { type: Boolean, default: true },
  expires_at: Date, // For time-limited access
  
  enrolled_at: { type: Date, default: Date.now, index: true },
  last_accessed: Date,
  updated_at: { type: Date, default: Date.now }
};

// Indexes
db.enrollments.createIndex({ "user_id": 1, "course_id": 1 }, { unique: true });
db.enrollments.createIndex({ "course_id": 1 });
db.enrollments.createIndex({ "enrolled_at": -1 });
```

**FAQ Schema (faqs collection):**
```javascript
const faqSchema = {
  _id: ObjectId,
  question: { type: String, required: true },
  answer: { type: String, required: true },
  
  // Organization
  category: { 
    type: String, 
    enum: ['general', 'pricing', 'learning', 'technical', 'creator', 'admin'],
    required: true,
    index: true 
  },
  priority: { type: Number, default: 0 }, // Higher = more important
  
  // Content metadata
  tags: [String],
  related_faqs: [{ type: ObjectId, ref: 'FAQ' }],
  
  // Analytics
  view_count: { type: Number, default: 0 },
  helpful_votes: { type: Number, default: 0 },
  unhelpful_votes: { type: Number, default: 0 },
  
  // Status
  is_published: { type: Boolean, default: true, index: true },
  
  // SEO
  slug: { type: String, unique: true },
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
};

// Indexes
db.faqs.createIndex({ "category": 1, "priority": -1 });
db.faqs.createIndex({ "is_published": 1 });
```

## 🗂️ Frontend Pages Structure & Backend Workflows

### **Backend API Workflows (Version 1)**

**🔐 Authentication Workflows (`app/api/v1/endpoints/auth.py`)**
```
POST /api/v1/auth/register
  ├── Validate input data (email, password, name)
  ├── Check email uniqueness
  ├── Hash password with bcrypt
  ├── Create User model in MongoDB
  ├── Generate verification token
  ├── Send verification email via email_service
  └── Return success message

POST /api/v1/auth/login
  ├── Validate credentials
  ├── Check email verification status
  ├── Verify password hash
  ├── Generate JWT access token
  ├── Create refresh token
  └── Return tokens + user data

POST /api/v1/auth/logout
  ├── Invalidate JWT token (blacklist)
  ├── Clear refresh token
  └── Return success

GET /api/v1/auth/verify-email?token={verification_token}
  ├── Validate verification token
  ├── Update user.is_verified = True
  └── Redirect to login page

POST /api/v1/auth/refresh
  ├── Validate refresh token
  ├── Generate new access token
  └── Return new access token
```

**📚 Course Management Workflows (`app/api/v1/endpoints/courses.py`)**
```
POST /api/v1/courses/create
  ├── Verify user role (Content Creator or Admin)
  ├── Generate temporary name: "Untitled Course #{count} ({short_date})"
  ├── Create course record (status: draft, creator: user_id)
  ├── Set default permissions (creator access only)
  ├── Return course_id + redirect URL (/courses/:id/edit)
  └── Frontend auto-redirects to course editor

GET /api/v1/courses
  ├── Parse query parameters (search, category, level, pricing)
  ├── Apply filters in course_service
  ├── Check user access permissions
  ├── Return paginated course list with metadata
  └── Include pricing info and access status

GET /api/v1/courses/{course_id}
  ├── Fetch course details from MongoDB
  ├── Check user enrollment status
  ├── Check pricing logic (Free badge, Pro subscription, purchased)
  ├── Return course data with access permissions
  └── Include syllabus and instructor info

POST /api/v1/courses/{course_id}/enroll
  ├── Check course exists and is published
  ├── Verify user authentication
  ├── Check pricing logic:
  │   ├── Free course → Grant immediate access
  │   ├── Pro subscriber → Grant immediate access
  │   ├── Premium user → Grant immediate access
  │   └── Paid course → Require payment processing
  ├── Create enrollment record
  ├── Send enrollment confirmation email
  └── Return enrollment status

GET /api/v1/courses/{course_id}/lessons
  ├── Verify user enrollment
  ├── Fetch lesson list with completion status
  ├── Apply sequential learning logic
  ├── Return lessons with unlock status
  └── Include progress data
```

**🎓 Learning Progress Workflows (`app/api/v1/endpoints/lessons.py`)**
```
POST /api/v1/lessons/{lesson_id}/start
  ├── Verify lesson access (enrollment + sequential unlock)
  ├── Create/update progress record
  ├── Set start_time in database
  ├── Track analytics event
  └── Return lesson content and player config

PUT /api/v1/lessons/{lesson_id}/progress
  ├── Validate lesson access
  ├── Update watch_progress percentage
  ├── Check 80% completion threshold
  ├── Auto-mark complete if threshold reached
  ├── Update last_position for resume
  └── Return updated progress

POST /api/v1/lessons/{lesson_id}/complete
  ├── Verify 80% watch completion
  ├── Mark lesson as completed
  ├── Unlock next lesson in sequence
  ├── Update course progress percentage
  ├── Trigger quiz if available
  ├── Check course completion status
  └── Return completion status + next lesson info
```

**❓ Quiz System Workflows (`app/api/v1/endpoints/quizzes.py`)**
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

**👤 User Management Workflows (`app/api/v1/endpoints/users.py`)**
```
GET /api/v1/users/profile
  ├── Verify JWT token
  ├── Fetch user data from database
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

**💳 Payment Workflows (`app/api/v1/endpoints/payments.py`)**
```
POST /api/v1/payments/course/{course_id}
  ├── Validate course exists and is paid
  ├── Check user not already enrolled
  ├── Create Stripe payment intent
  ├── Process payment with payment_service
  ├── Create enrollment on success
  ├── Send purchase confirmation email
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

**📖 Chapter Management Workflows (`app/api/v1/endpoints/chapters.py`)**
```
POST /api/v1/chapters/create
  ├── Verify user role (Content Creator or Admin)
  ├── Validate course ownership/permissions
  ├── Generate temporary name: "Untitled Chapter #{count} ({short_date})"
  ├── Create chapter record (course_id, creator_id, status: draft)
  ├── Set chapter order (auto-increment)
  ├── Return chapter_id + redirect URL (/courses/:courseId/chapters/:id/edit)
  └── Frontend auto-redirects to chapter editor

GET /api/v1/courses/{course_id}/chapters
  ├── Verify course access permissions
  ├── Fetch chapters list ordered by sequence
  ├── Include lesson count per chapter
  ├── Calculate completion status
  ├── Apply sequential unlock logic
  └── Return chapters with metadata

GET /api/v1/chapters/{chapter_id}
  ├── Verify chapter access (enrollment + unlock status)
  ├── Fetch chapter details and content
  ├── Include lesson list within chapter
  ├── Calculate chapter progress percentage
  └── Return chapter data with lessons

PUT /api/v1/chapters/{chapter_id}
  ├── Verify edit permissions (creator or admin)
  ├── Validate chapter data (title, description, order)
  ├── Update chapter information
  ├── Handle autosave logic
  ├── Update last_modified timestamp
  └── Return updated chapter data

DELETE /api/v1/chapters/{chapter_id}
  ├── Verify delete permissions
  ├── Check chapter has no lessons (or cascade delete)
  ├── Remove chapter from database
  ├── Update course structure
  └── Return deletion confirmation

POST /api/v1/chapters/{chapter_id}/reorder
  ├── Verify edit permissions
  ├── Validate new order sequence
  ├── Update chapter order in database
  ├── Recalculate sequential unlock logic
  └── Return updated chapter list
```

**📝 Lesson Management Workflows (`app/api/v1/endpoints/lessons.py`)**
```
POST /api/v1/lessons/create
  ├── Verify user role (Content Creator or Admin)
  ├── Validate chapter ownership/permissions
  ├── Generate temporary name: "Untitled Lesson #{count} ({short_date})"
  ├── Create lesson record (chapter_id, creator_id, status: draft)
  ├── Set lesson order within chapter
  ├── Return lesson_id + redirect URL (/courses/:courseId/lessons/:id/edit)
  └── Frontend auto-redirects to lesson editor

GET /api/v1/chapters/{chapter_id}/lessons
  ├── Verify chapter access permissions
  ├── Fetch lessons ordered by sequence
  ├── Include completion status per user
  ├── Apply sequential unlock logic
  ├── Include quiz availability
  └── Return lessons with progress data

GET /api/v1/lessons/{lesson_id}
  ├── Verify lesson access (enrollment + sequential unlock)
  ├── Fetch lesson content (video_url, description, resources)
  ├── Include quiz data if available
  ├── Track lesson view analytics
  └── Return lesson data with player config

PUT /api/v1/lessons/{lesson_id}
  ├── Verify edit permissions (creator or admin)
  ├── Validate lesson data (title, video_url, description)
  ├── Handle video upload and processing
  ├── Update lesson information
  ├── Apply autosave logic
  ├── Update last_modified timestamp
  └── Return updated lesson data

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
  ├── Extract video metadata (duration, resolution)
  ├── Update lesson.video_url
  └── Return upload status + video data

POST /api/v1/lessons/{lesson_id}/reorder
  ├── Verify edit permissions
  ├── Validate new order within chapter
  ├── Update lesson sequence
  ├── Recalculate sequential unlock logic
  └── Return updated lesson list
```

**❓ FAQ Management Workflows (`app/api/v1/endpoints/faq.py`)**
```
GET /api/v1/faq
  ├── Fetch all published FAQ items
  ├── Group by categories (General, Pricing, Learning, etc.)
  ├── Sort by priority and popularity
  ├── Include search functionality
  └── Return categorized FAQ list

GET /api/v1/faq/search?q={query}
  ├── Parse search query
  ├── Search in FAQ questions and answers
  ├── Rank results by relevance
  ├── Include related FAQs
  └── Return search results

POST /api/v1/faq (Admin only)
  ├── Verify admin permissions
  ├── Validate FAQ data (question, answer, category)
  ├── Create new FAQ item
  ├── Set publication status
  └── Return created FAQ item

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

GET /api/v1/faq/categories
  ├── Fetch FAQ categories
  ├── Include FAQ count per category
  ├── Return category list
  └── Used for filtering and navigation

POST /api/v1/faq/{faq_id}/helpful
  ├── Track user feedback (helpful/not helpful)
  ├── Update FAQ helpfulness score
  ├── Use for ranking and improvements
  └── Return feedback confirmation
```

**🛠️ Admin Workflows (`app/api/v1/endpoints/admin.py`)**
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
  ├── Validate bulk operation (delete, role change, premium toggle)
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

POST /api/v1/admin/courses/{course_id}/reject
  ├── Verify admin permissions
  ├── Add rejection reason/feedback
  ├── Set status to needs_revision
  ├── Send rejection notification with feedback
  └── Return rejection status

DELETE /api/v1/admin/courses/{course_id}
  ├── Verify admin permissions
  ├── Check for enrolled students
  ├── Handle refunds if needed
  ├── Archive course data
  └── Return deletion confirmation

POST /api/v1/admin/courses/bulk-action
  ├── Verify admin permissions
  ├── Validate bulk operation (approve, reject, delete, archive)
  ├── Process courses in batches
  ├── Handle notifications and refunds
  └── Return operation results

GET /api/v1/admin/content-moderation
  ├── Verify admin role
  ├── Fetch flagged content (comments, courses, reviews)
  ├── Include flagging reasons and user reports
  ├── Sort by severity and date
  └── Return moderation queue

POST /api/v1/admin/content-moderation/{item_id}/action
  ├── Verify admin permissions
  ├── Take action (approve, remove, warn_user, ban_user)
  ├── Add moderation notes
  ├── Send notifications to affected users
  └── Return moderation result

GET /api/v1/admin/payments
  ├── Verify admin role
  ├── Fetch payment transactions
  ├── Include refund requests and disputes
  ├── Apply filters (status, amount, date range)
  └── Return payment management data

POST /api/v1/admin/payments/{payment_id}/refund
  ├── Verify admin permissions
  ├── Process refund through payment provider
  ├── Update enrollment status
  ├── Send refund confirmation
  └── Return refund status

GET /api/v1/admin/support-tickets
  ├── Verify admin role
  ├── Fetch support tickets
  ├── Include priority and status
  ├── Apply filters (status, priority, category)
  └── Return ticket management data

PUT /api/v1/admin/support-tickets/{ticket_id}
  ├── Verify admin permissions
  ├── Update ticket status and priority
  ├── Add admin response
  ├── Send notification to user
  └── Return updated ticket

GET /api/v1/admin/system-settings
  ├── Verify admin role
  ├── Fetch platform configuration
  ├── Include feature flags and limits
  └── Return system settings

PUT /api/v1/admin/system-settings
  ├── Verify admin permissions
  ├── Update platform configuration
  ├── Validate setting values
  ├── Log configuration changes
  └── Return updated settings

GET /api/v1/admin/analytics
  ├── Aggregate platform metrics
  ├── Calculate revenue data
  ├── User engagement statistics
  ├── Course performance data
  └── Return analytics dashboard

GET /api/v1/admin/analytics/revenue
  ├── Verify admin role
  ├── Calculate revenue by period
  ├── Include subscription vs one-time sales
  ├── Creator revenue sharing data
  └── Return detailed revenue analytics

GET /api/v1/admin/analytics/users
  ├── Verify admin role
  ├── User acquisition and retention metrics
  ├── Role distribution and activity
  ├── Geographic and demographic data
  └── Return user analytics

GET /api/v1/admin/audit-logs
  ├── Verify admin role
  ├── Fetch system audit logs
  ├── Include user actions and admin changes
  ├── Apply filters (user, action, date range)
  └── Return audit trail
```

**🤖 AI Assistant Workflows (`app/api/v1/endpoints/ai.py`)**
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

## 🧪 Testing Strategy & Quality Assurance

### **Testing Pyramid**
```
E2E Tests (10%)
├── User Journey Testing
├── Payment Flow Testing
├── Video Playback Testing
└── Cross-browser Testing

Integration Tests (20%)
├── API Endpoint Testing
├── Database Integration
├── Authentication Flow
└── Third-party Services

Unit Tests (70%)
├── Component Testing
├── Hook Testing
├── Utility Function Testing
└── Service Layer Testing
```

### **Frontend Testing Stack**
```typescript
// Testing Tools
- Jest: Unit testing framework
- React Testing Library: Component testing
- Playwright: End-to-end testing
- MSW (Mock Service Worker): API mocking
- Storybook: Component documentation and testing

// Test Structure
describe('CourseCard Component', () => {
  it('should display course information correctly', () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText(mockCourse.title)).toBeInTheDocument();
    expect(screen.getByText(mockCourse.price)).toBeInTheDocument();
  });

  it('should handle enrollment click', async () => {
    const mockEnroll = jest.fn();
    render(<CourseCard course={mockCourse} onEnroll={mockEnroll} />);
    
    await user.click(screen.getByRole('button', { name: /enroll/i }));
    expect(mockEnroll).toHaveBeenCalledWith(mockCourse.id);
  });
});
```

### **Backend Testing Stack**
```python
# Testing Tools
- pytest: Testing framework
- pytest-asyncio: Async testing
- httpx: HTTP client for testing
- factory-boy: Test data generation
- pytest-mock: Mocking utilities

# Test Structure
class TestCourseAPI:
    async def test_create_course_success(self, client, auth_headers):
        course_data = {
            "title": "Test Course",
            "description": "Test Description",
            "price": 99.99
        }
        
        response = await client.post(
            "/api/v1/courses",
            json=course_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        assert response.json()["success"] is True
        assert response.json()["data"]["title"] == course_data["title"]

    async def test_create_course_unauthorized(self, client):
        course_data = {"title": "Test Course"}
        
        response = await client.post("/api/v1/courses", json=course_data)
        
        assert response.status_code == 401
        assert "unauthorized" in response.json()["error"]["message"].lower()
```

### **Test Coverage Requirements**
- **Unit Tests:** Minimum 80% code coverage
- **Integration Tests:** All API endpoints covered
- **E2E Tests:** Critical user journeys covered
- **Performance Tests:** Load testing for 10K concurrent users
- **Security Tests:** OWASP vulnerability scanning

### **Automated Testing Pipeline**
```yaml
# GitHub Actions Workflow
name: Test Pipeline

on: [push, pull_request]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run Unit Tests
        run: npm run test:unit
      - name: Run Integration Tests
        run: npm run test:integration
      - name: Run E2E Tests
        run: npm run test:e2e

  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run Unit Tests
        run: pytest tests/unit/
      - name: Run Integration Tests
        run: pytest tests/integration/
      - name: Run API Tests
        run: pytest tests/api/

  security-tests:
    runs-on: ubuntu-latest
    steps:
      - name: OWASP ZAP Scan
        run: zap-baseline.py -t ${{ env.APP_URL }}
      - name: Dependency Check
        run: safety check
```

### **Quality Gates**
- All tests must pass before deployment
- Code coverage must meet minimum thresholds
- Security scans must show no high-severity issues
- Performance tests must meet response time targets
- Manual testing checklist completed

## ♿ Accessibility & Inclusive Design

### **WCAG 2.1 AA Compliance**

**Level A Requirements:**
- **Keyboard Navigation:** All functionality accessible via keyboard
- **Screen Reader Support:** Proper ARIA labels and semantic HTML
- **Alternative Text:** All images have descriptive alt text
- **Video Captions:** All course videos include captions
- **Color Independence:** Information not conveyed by color alone

**Level AA Requirements:**
- **Color Contrast:** Minimum 4.5:1 ratio for normal text, 3:1 for large text
- **Text Scaling:** Text can be scaled up to 200% without loss of functionality
- **Focus Indicators:** Visible focus indicators for all interactive elements
- **Consistent Navigation:** Navigation order is logical and consistent
- **Error Identification:** Clear error messages and correction suggestions

### **Implementation Guidelines**

**Semantic HTML Structure:**
```html
<!-- Course Card with proper semantics -->
<article role="region" aria-labelledby="course-title-123">
  <header>
    <h3 id="course-title-123">AI Programming Fundamentals</h3>
    <p aria-label="Course price">$49.99</p>
  </header>
  
  <div class="course-content">
    <p aria-describedby="course-desc-123">
      Learn the basics of AI programming with Python
    </p>
    <div id="course-desc-123" class="sr-only">
      This course covers machine learning fundamentals, 
      neural networks, and practical AI applications.
    </div>
  </div>
  
  <footer>
    <button 
      aria-label="Enroll in AI Programming Fundamentals course"
      type="button"
    >
      Enroll Now
    </button>
  </footer>
</article>
```

**Video Player Accessibility:**
```typescript
// Accessible Video Player Component
const AccessibleVideoPlayer = ({ videoUrl, captions, transcript }) => {
  return (
    <div role="region" aria-label="Video Player">
      <video
        controls
        aria-describedby="video-description"
        crossOrigin="anonymous"
      >
        <source src={videoUrl} type="video/mp4" />
        <track
          kind="captions"
          src={captions}
          srcLang="en"
          label="English Captions"
          default
        />
        <track
          kind="descriptions"
          src={transcript}
          srcLang="en"
          label="Audio Description"
        />
      </video>
      
      <div id="video-description" className="sr-only">
        {transcript}
      </div>
      
      <button
        aria-label="Toggle Captions"
        onClick={toggleCaptions}
      >
        CC
      </button>
    </div>
  );
};
```

**Form Accessibility:**
```typescript
// Accessible Form Components
const AccessibleForm = () => {
  return (
    <form role="form" aria-labelledby="form-title">
      <h2 id="form-title">Course Registration</h2>
      
      <div className="form-group">
        <label htmlFor="email" className="required">
          Email Address
          <span aria-label="required" className="required-indicator">*</span>
        </label>
        <input
          id="email"
          type="email"
          required
          aria-describedby="email-error email-help"
          aria-invalid={hasEmailError}
        />
        <div id="email-help" className="help-text">
          We'll use this email for course notifications
        </div>
        {hasEmailError && (
          <div id="email-error" role="alert" className="error-message">
            Please enter a valid email address
          </div>
        )}
      </div>
    </form>
  );
};
```

### **Assistive Technology Support**

**Screen Readers:**
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)
- TalkBack (Android)

**Testing Tools:**
- axe-core: Automated accessibility testing
- WAVE: Web accessibility evaluation
- Lighthouse: Accessibility auditing
- Color Oracle: Color blindness simulation

### **Accessibility Testing Requirements**
All interactive elements must support keyboard navigation and screen readers must announce content correctly. Color contrast must meet WCAG AA standards with visible focus indicators. Error messages should be descriptive and helpful. Videos require captions and transcripts, forms need proper labels and validation, images must have meaningful alt text, page structure should use semantic HTML, and content must be readable when zoomed to 200%.

### **Inclusive Design Principles**

**Universal Design:**
- Design works for users with diverse abilities
- Multiple ways to access the same information
- Flexible interaction methods (mouse, keyboard, touch, voice)
- Clear and simple language
- Consistent and predictable interface

**Cultural Accessibility:**
- Support for right-to-left languages
- Cultural color considerations
- Appropriate imagery and icons
- Localized date/time formats
- Currency and number formatting

---

# PART IV: PRODUCTION REQUIREMENTS

## 🔒 Security & Compliance

### **Security Standards**
- **OWASP Compliance**: Follow OWASP Top 10 security practices
- **Data Encryption**: AES-256 encryption for sensitive data at rest
- **Transport Security**: TLS 1.3 for all API communications
- **Authentication Security**: 
  - JWT tokens with 15-minute expiry
  - Refresh tokens with 7-day expiry
  - Rate limiting: 100 requests/minute per user
- **Password Policy**: Minimum 8 characters, complexity requirements
- **Session Management**: Secure session handling with automatic timeout

### **Data Privacy & GDPR Compliance**
- **Data Minimization**: Collect only necessary user data
- **Right to Access**: Users can export their data
- **Right to Deletion**: Complete data removal on request
- **Data Portability**: Export in standard formats (JSON, CSV)
- **Consent Management**: Clear opt-in for data collection
- **Cookie Policy**: GDPR-compliant cookie consent

### **API Security**
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Sanitize all user inputs
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Protection**: Content Security Policy headers
- **CSRF Protection**: Anti-CSRF tokens for state-changing operations

### **Infrastructure Security**
- **Environment Isolation**: Separate dev/staging/production
- **Secrets Management**: Use environment variables for sensitive config
- **Database Security**: Connection encryption, access controls
- **CDN Security**: Secure video delivery with signed URLs
- **Backup Encryption**: Encrypted database backups

### **Monitoring & Incident Response**
- **Security Logging**: Log all authentication and admin actions
- **Intrusion Detection**: Monitor for suspicious activities
- **Incident Response Plan**: Documented security breach procedures
- **Regular Security Audits**: Quarterly penetration testing

## 📊 Analytics, Monitoring & Observability

### **Key Performance Indicators (KPIs)**
- **Course Completion Rate:** >70%
- **Student Engagement:** >80% weekly active users
- **AI Assistant Usage:** >50% students use weekly
- **Revenue Growth:** 20% monthly growth
- **Net Promoter Score:** >8.0
- **Customer Acquisition Cost (CAC):** <$50
- **Customer Lifetime Value (CLV):** >$200
- **Churn Rate:** <5% monthly

### **Learning Analytics**
- **Average Study Time:** Track daily/weekly learning hours
- **Lesson Completion Rate:** Monitor drop-off points
- **Quiz Performance:** Identify difficult concepts
- **Video Engagement:** Watch time and replay patterns
- **AI Assistant Effectiveness:** Question resolution rate

### **Business Metrics**
- **Monthly Recurring Revenue (MRR):** Track subscription growth
- **Course Sales:** Individual course purchase trends
- **Creator Revenue:** Revenue sharing and creator retention
- **Support Ticket Volume:** Customer satisfaction indicator
- **Platform Uptime:** 99.9% availability target

### **Application Performance Monitoring (APM)**
```yaml
# Monitoring Stack
- Application: Sentry for error tracking
- Performance: New Relic or DataDog for APM
- Uptime: Pingdom for service availability
- Logs: ELK Stack (Elasticsearch, Logstash, Kibana)
- Metrics: Prometheus + Grafana for custom metrics
```

### **Key Metrics to Monitor**
```javascript
// Frontend Metrics
- Page Load Time: Core Web Vitals (LCP, FID, CLS)
- User Engagement: Session duration, bounce rate
- Error Rates: JavaScript errors, API failures
- Performance: Bundle size, render time

// Backend Metrics
- API Response Time: P50, P95, P99 percentiles
- Error Rates: 4xx and 5xx responses
- Database Performance: Query execution time
- Resource Usage: CPU, memory, disk utilization

// Business Metrics
- User Conversion: Registration to first course enrollment
- Payment Success Rate: Successful vs failed transactions
- Course Completion: Lesson and course completion rates
- AI Assistant Usage: Query volume and satisfaction
```

### **Alerting Strategy**
```yaml
# Critical Alerts (Immediate Response)
- API Error Rate > 5%
- Database Connection Failures
- Payment Processing Failures
- Security Incidents

# Warning Alerts (Monitor Closely)
- API Response Time > 1 second
- High Memory Usage > 80%
- Low Disk Space < 20%
- Unusual Traffic Patterns

# Info Alerts (Daily Review)
- Daily Active Users
- Course Enrollment Trends
- Revenue Metrics
- Content Performance
```

### **Logging Standards**
```python
# Structured Logging Format
import structlog

logger = structlog.get_logger()

# User Action Logging
logger.info(
    "user_action",
    user_id="123",
    action="course_enrollment",
    course_id="456",
    timestamp="2025-01-20T10:30:00Z",
    ip_address="192.168.1.1",
    user_agent="Mozilla/5.0..."
)

# Error Logging
logger.error(
    "api_error",
    error_code="PAYMENT_FAILED",
    user_id="123",
    payment_id="pay_789",
    error_message="Card declined",
    stack_trace="...",
    request_id="req_abc123"
)
```

## 📱 Performance & Technical Requirements

### **Performance Targets**
- **Page Load Time:** <2 seconds for all pages
- **Video Start Time:** <3 seconds for video playback
- **API Response Time:** <500ms for 95% of requests
- **Database Query Time:** <100ms for 90% of queries
- **Concurrent Users:** Support 10,000 simultaneous users
- **CDN Performance:** Global video delivery <5 seconds

### **Browser Support**
- **Desktop:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile:** iOS Safari 14+, Chrome Mobile 90+, Samsung Internet
- **Progressive Web App:** Offline capability for core features
- **Accessibility:** WCAG 2.1 AA compliance

### **YouTube Embed Configuration**
- **Player Parameters:**
  - `controls=0` to disable seekbar dragging
  - `disablekb=1` to disable keyboard shortcuts
  - `modestbranding=1` to hide YouTube logo
  - `rel=0` to disable related videos
- **Auto-transcript:** YouTube API transcript extraction
- **Progress Tracking:** Custom overlay for completion detection

### **Sequential Learning Implementation**
- **Database Design:** Optimized for progress queries
- **Frontend Validation:** Prevent unauthorized lesson access
- **Progress Calculation:** Real-time completion tracking
- **Auto-unlock Logic:** Immediate next lesson availability
- **Offline Support:** Cache completed lessons for offline review

### **Scalability Architecture**
- **Database Sharding:** Horizontal scaling for user data
- **CDN Strategy:** Global content delivery network
- **Caching Layers:** Redis for session and frequently accessed data
- **Load Balancing:** Auto-scaling backend instances
- **Microservices:** Independent scaling of core services

---

# PART V: PROJECT EXECUTION

## 🚀 Development Phases & Timeline

### **Phase 1 - MVP Foundation (Months 1-2)**
**Core Infrastructure:**
- User authentication system with social login
- Basic course structure (Course → Chapter → Lesson)
- Video player with YouTube integration
- Simple progress tracking
- Core AI Study Buddy functionality
- Payment integration (Stripe + local methods)

**Deliverables:**
- Working authentication flow
- Course catalog with enrollment
- Video playback with progress tracking
- Basic AI chat functionality
- Payment processing for courses

### **Phase 2 - Enhanced Learning Features (Months 3-4)**
**Advanced Features:**
- Quiz system per lesson with auto-grading
- Certificate generation and verification
- Advanced video features (speed control, captions)
- AI Quiz Generator from lesson content
- Complete payment integration
- Email notification system

**Deliverables:**
- Interactive quiz system
- Automated certificate generation
- Enhanced video player
- AI-powered content creation tools
- Complete billing and subscription management

### **Phase 3 - AI & Analytics (Months 5-6)**
**Intelligence Layer:**
- Learning Path Optimizer
- AI Progress Coach with personalized recommendations
- Advanced analytics dashboard
- Mobile responsive optimization
- Performance monitoring and optimization

**Deliverables:**
- Personalized learning recommendations
- Comprehensive analytics for students and creators
- Mobile-optimized experience
- Performance optimization
- AI-driven learning insights

### **Phase 4 - Scale & Enterprise (Months 7+)**
**Scaling & Advanced Features:**
- Performance optimization for 10K+ users
- Advanced AI features (code review, project feedback)
- Enterprise features (SSO, team management)
- Public API for third-party integrations
- Advanced content creation tools

**Deliverables:**
- Scalable infrastructure
- Enterprise-ready features
- Public API documentation
- Advanced AI capabilities
- Third-party integrations

## 📋 Launch Readiness & Quality Gates

### **Technical Readiness**
All core user workflows must be tested and validated. Payment system needs integration and testing. AI features should work reliably with fallbacks. Mobile responsiveness must be verified across devices. Security audit should be completed and vulnerabilities addressed. Performance testing must pass for target load. Database backup and recovery procedures need testing.

### **Content Readiness**
Platform requires 20+ high-quality courses available at launch. Course content needs review and approval. AI training data must be prepared and validated. FAQ content should be comprehensive and accurate. Help documentation must be complete.

### **Business Readiness**
Customer support process needs establishment. Payment processing and refund procedures require testing. Legal terms and privacy policy must be finalized. Marketing website and materials should be ready. Creator onboarding process needs documentation. Analytics and monitoring systems must be operational.

### **Operational Readiness**
Monitoring and alerting systems need configuration. Incident response procedures require documentation. Backup and disaster recovery plans need testing. Team training must be completed. Go-live runbook should be prepared.

## 🔄 Future Roadmap & Innovation

### **Q1 2026 - Mobile & Community**
- **Native Mobile Apps:** React Native iOS/Android apps
- **Live Learning:** Real-time coding sessions with instructors
- **Community Features:** Forums, study groups, peer learning
- **Offline Mode:** Download courses for offline learning
- **Push Notifications:** Learning reminders and updates

### **Q2 2026 - Enterprise & Integration**
- **Enterprise SSO:** SAML/OAuth integration for companies
- **White-label Solutions:** Branded platforms for organizations
- **Advanced Analytics:** Predictive learning analytics
- **LMS Integration:** Canvas, Moodle, Blackboard compatibility
- **Corporate Training:** Team management and reporting

### **Q3 2026 - AI & Innovation**
- **AI-Generated Courses:** Automatic course creation from topics
- **VR/AR Learning:** Immersive coding environments
- **Global Expansion:** Multi-language support and localization
- **Blockchain Certificates:** Verified credentials on blockchain
- **Advanced AI Tutoring:** Personalized 1-on-1 AI instruction

### **Q4 2026 - Platform Evolution**
- **Marketplace Expansion:** Third-party content creators
- **Advanced Simulations:** Real-world project environments
- **Industry Partnerships:** Certification partnerships
- **Research Platform:** Learning effectiveness studies
- **Open Source Components:** Community-driven development

## ⚠️ Error Handling & Recovery Workflows

### **Frontend Error Handling**
```typescript
// Global Error Boundary Implementation
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    logErrorToService(error, errorInfo);
    
    // Show user-friendly error message
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
```

### **API Error Handling Patterns**
```python
# Backend Error Response Format
{
  "error": {
    "code": "COURSE_NOT_FOUND",
    "message": "The requested course could not be found",
    "details": {
      "course_id": "123",
      "user_id": "456"
    },
    "timestamp": "2025-01-20T10:30:00Z",
    "request_id": "req_abc123"
  }
}

# Standard Error Codes
- UNAUTHORIZED: 401 - Invalid or expired token
- FORBIDDEN: 403 - Insufficient permissions
- NOT_FOUND: 404 - Resource not found
- VALIDATION_ERROR: 422 - Input validation failed
- RATE_LIMITED: 429 - Too many requests
- INTERNAL_ERROR: 500 - Server error
```

### **Recovery Strategies**
- **Auto-Retry Logic:** Exponential backoff for transient failures
- **Graceful Degradation:** Fallback to cached data when API unavailable
- **Offline Mode:** Queue actions for when connection restored
- **User Feedback:** Clear error messages with suggested actions
- **Error Reporting:** Automatic error logging and monitoring

### **Video Player Error Handling**
```javascript
// YouTube Player Error Recovery
const handleVideoError = (error) => {
  switch (error.data) {
    case 2: // Invalid video ID
      showError("Video not available. Please contact support.");
      break;
    case 5: // HTML5 player error
      // Fallback to different player or quality
      retryWithLowerQuality();
      break;
    case 100: // Video not found
      markVideoAsUnavailable();
      break;
    case 101: // Private video
    case 150: // Embedding disabled
      showError("Video cannot be played. Please try another lesson.");
      break;
    default:
      // Generic retry mechanism
      retryVideoLoad();
  }
};
```

### **Payment Error Handling**
- **Failed Payments:** Retry mechanism with different payment methods
- **Declined Cards:** Clear messaging and alternative options
- **Network Issues:** Queue payment for retry when connection restored
- **Webhook Failures:** Automatic retry with exponential backoff
- **Refund Processing:** Automated refund workflows with status tracking



## 📛 Naming Conventions & Technical Standards

### **🎯 High-Level Naming Guidelines**

**File & Directory Naming:**
- **Frontend React component files:** PascalCase (CourseCard.tsx, VideoPlayer.tsx, QuizComponent.tsx)
- **Frontend utility/helper files:** camelCase (formatters.ts, validators.ts, authHelpers.ts)
- **Backend files:** snake_case (user_service.py, auth_endpoints.py)
- **Directories:** kebab-case (user-management, course-builder)
- **Component names:** PascalCase (VideoPlayer, QuizComponent)

**API Conventions:**
- **Endpoints:** kebab-case with RESTful patterns
  ```
  ✅ Good: /api/v1/courses, /api/v1/user-profile
  ❌ Bad: /api/v1/getCourses, /api/v1/userProfile
  ```
- **Query parameters:** camelCase
  ```
  ✅ Good: ?sortBy=createdAt&pageSize=20
  ❌ Bad: ?sort_by=created_at&page_size=20
  ```
- **Response fields:** camelCase for consistency with TypeScript
  ```json
  {
    "courseId": "123",
    "courseName": "AI Programming",
    "createdAt": "2025-01-20"
  }
  ```

**Database Naming:**
- **Collections/Tables:** snake_case (user_profiles, course_enrollments)
- **Fields:** snake_case (first_name, enrollment_date, is_premium)
- **Indexes:** descriptive names (idx_user_email_unique, idx_course_category)

**Code Variables & Functions:**
- **TypeScript/JavaScript:** camelCase
  ```typescript
  // Variables
  const userProgress = getUserProgress();
  const isEnrolled = checkEnrollment();
  
  // Functions
  function calculateCourseProgress() {}
  const handleVideoComplete = () => {};
  ```
- **Python:** snake_case following PEP 8
  ```python
  # Variables
  user_progress = get_user_progress()
  is_enrolled = check_enrollment()
  
  # Functions
  def calculate_course_progress():
      pass
  ```

**Constants & Environment Variables:**
- **Constants:** SCREAMING_SNAKE_CASE
  ```typescript
  const API_BASE_URL = "https://api.example.com";
  const MAX_RETRY_ATTEMPTS = 3;
  ```
- **Environment variables:** SCREAMING_SNAKE_CASE
  ```
  DATABASE_URL=mongodb://localhost:27017
  STRIPE_SECRET_KEY=sk_test_...
  NEXTAUTH_SECRET=your-secret-here
  ```

---

## 🏭 Infrastructure & Deployment

### **Deployment Architecture**
```yaml
# Production Environment Setup
Environments:
  - Development: Local development with Docker Compose
  - Staging: Pre-production testing environment
  - Production: Live platform with auto-scaling

Infrastructure:
  - Platform: Railway (primary) with AWS backup
  - Database: MongoDB Atlas with automated backups
  - CDN: Cloudflare for global content delivery
  - Monitoring: Integrated APM and logging
```

### **CI/CD Pipeline**
```yaml
# GitHub Actions Workflow
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Run unit tests
      - Run integration tests
      - Security scanning
      - Performance testing

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - Build Docker images
      - Push to container registry
      - Deploy to staging
      - Run smoke tests
      - Deploy to production
      - Post-deployment verification
```



### **Database Strategy**
```javascript
// MongoDB Collections Structure
{
  users: {
    indexes: ["email", "role", "premium_status"],
    sharding: "user_id"
  },
  courses: {
    indexes: ["creator_id", "category", "status", "created_at"],
    sharding: "course_id"
  },
  progress: {
    indexes: ["user_id", "course_id", "lesson_id"],
    sharding: "user_id"
  },
  payments: {
    indexes: ["user_id", "status", "created_at"],
    sharding: "user_id"
  }
}

// Backup Strategy
- Automated daily backups to AWS S3
- Point-in-time recovery capability
- Cross-region backup replication
- Monthly backup testing and restoration
```

### **Scaling Strategy**
```yaml
# Auto-scaling Configuration
Frontend:
  - CDN caching for static assets
  - Edge computing for global performance
  - Progressive Web App for offline capability

Backend:
  - Horizontal scaling with load balancers
  - Database connection pooling
  - Redis caching for frequently accessed data
  - Microservices architecture for independent scaling

Database:
  - MongoDB sharding for horizontal scaling
  - Read replicas for improved performance
  - Connection pooling and query optimization
  - Automated failover and recovery
```

---

# PART VI: SUPPORT & DOCUMENTATION

## ❓ FAQ & Troubleshooting

### **🎯 General Platform Questions**

**Q: Who is the primary target audience for this platform?**
A: The platform serves 3 main groups:
- **Students/Learners**: People who want to learn online with AI support
- **Content Creators**: Teachers and experts who want to create and sell courses
- **Admins**: Platform, user, and content managers

**Q: How is this platform different from Udemy, Coursera?**
A: Key differentiators:
- **Integrated AI Assistant**: Claude 3.5 Sonnet provides personalized learning support
- **Sequential Learning**: Learn in sequence, unlock lessons based on progress
- **Flexible Pricing**: Both subscription and pay-per-course options
- **Vietnamese-focused**: Optimized for the Vietnamese market

**Q: Does the platform support mobile?**
A: Yes, the platform is designed to be responsive and includes a mobile app (Progressive Web App) for learning anytime, anywhere.

### **💰 Pricing & Payment Questions**

**Q: How can I tell which courses are Free and which are Paid?**
A: 
- **Free courses**: Have a green "Free" badge
- **Paid courses**: Display price and "Enroll Now" button  
- **Pro subscribers**: Access all courses for free
- **Premium users**: Admin sets free access to all courses

**Q: What are the benefits of Pro subscription?**
A: Pro subscription ($29/month) includes:
- Unlimited access to all courses
- Priority AI Assistant support
- Download courses for offline learning
- Certificate verification
- Ad-free experience

**Q: Can I get a refund if I'm not satisfied?**
A: Yes, the platform has a 14-day money-back guarantee for:
- Individual course purchases
- Pro subscription (prorated refund)
- Does not apply to courses >80% completed

### **📚 Course & Learning Questions**

**Q: How does sequential learning work?**
A: 
- Must complete current lesson (watch 80% video + pass quiz) to unlock next lesson
- Chapter unlocks when completing all lessons in that chapter
- Course completion when finishing all chapters + final assessment

**Q: What if I get stuck on a lesson?**
A: Platform provides multiple support options:
- **AI Assistant**: Explains concepts, answers questions
- **Community Forum**: Q&A with other learners
- **Instructor Support**: Direct contact with course creator
- **Hint System**: Step-by-step hints for quizzes

**Q: What is the value of certificates?**
A: 
- **Digital Certificate**: Blockchain-verified, shareable on LinkedIn
- **Course Completion**: Completion certification with score
- **Skill Assessment**: Real skill evaluation
- **Industry Recognition**: Partnerships with Vietnamese tech companies

### **🎨 Content Creation Questions**

**Q: Who can create courses on the platform?**
A: 
- **Content Creators**: Register and get approved by Admin
- **Admins**: Have full rights to create courses
- **Requirements**: Portfolio, expertise proof, content quality standards

**Q: How do Content Creators share revenue?**
A: Revenue sharing model:
- **Individual sales**: Creator receives 70%, Platform 30%
- **Pro subscription**: Shared based on watch time and engagement
- **Bonus**: Performance incentives for top-rated courses

**Q: What tools does the platform support for Content Creation?**
A: Built-in course builder includes:
- Video upload with auto-compression
- Quiz builder with multiple question types
- Rich text editor for descriptions
- Analytics dashboard for performance tracking
- Bulk upload tools for large courses

### **🔐 Technical & Security Questions**

**Q: Is my data secure?**
A: Platform ensures security with:
- **SSL encryption** for all data transmission
- **JWT authentication** with refresh token
- **Role-based access control** 
- **Regular security audits**
- **GDPR compliance** for data privacy

**Q: Does the platform have offline support?**
A: Limited offline support:
- **Progressive Web App**: Cache basic functionality
- **Video download**: Pro subscribers can download
- **Sync when online**: Progress sync automatically
- **Offline quiz**: Cached questions, submit when internet available

**Q: How does the platform scale?**
A: Architecture designed for scalability:
- **CDN**: Video delivery through global CDN
- **Database sharding**: MongoDB with horizontal scaling
- **Microservices**: FastAPI backend can scale independently
- **Railway deployment**: Auto-scaling infrastructure

### **👥 User Management Questions**

**Q: How to upgrade/downgrade account?**
A: Users can:
- **Self-service**: Upgrade/downgrade through billing page
- **Admin intervention**: Admin can set user roles manually
- **Automatic**: Pro subscription auto-renew, can cancel anytime

**Q: What if I forget my password?**
A: Password recovery process:
1. Click "Forgot Password" on login page
2. Enter email → receive reset link
3. Click link → set new password
4. Auto-login with new password

**Q: Can I have multiple accounts?**
A: 
- **Not recommended**: Each user should have 1 unique account
- **Role switching**: User can have multiple roles (Student + Creator)
- **Family accounts**: Planning for future release

### **🚀 Future Development Questions**

**Q: What are the platform's development plans?**
A: Roadmap includes:
- **Phase 2**: Mobile native app (React Native)
- **Phase 3**: Live streaming classes
- **Phase 4**: VR/AR learning experiences
- **Phase 5**: Corporate training solutions

**Q: Is there an API for third-party integration?**
A: 
- **Public API**: Planning for Phase 2
- **Webhook support**: For payment notifications
- **SSO integration**: Enterprise customers
- **LMS integration**: Canvas, Moodle compatibility

**Q: Does the platform have multi-language support?**
A: 
- **Current**: Vietnamese and English
- **Future**: Planning to add Thai, Indonesian
- **Content**: Creators can upload multi-language subtitles

### **🛠️ Troubleshooting Questions**

**Q: What if videos won't load?**
A: Troubleshooting steps:
1. Check internet connection
2. Try different browser/device
3. Clear browser cache
4. Contact support with error details

**Q: How to handle payment failures?**
A: 
- **Auto-retry**: System automatically retries 3 times
- **Alternative payment**: Suggest other payment methods
- **Manual process**: Admin can manually approve
- **Support**: 24/7 payment support team

**Q: What if AI Assistant doesn't respond?**
A: 
- **Check API status**: PydanticAI service health
- **Retry mechanism**: Auto-retry with exponential backoff
- **Fallback**: Pre-defined responses for common questions
- **Escalation**: Route to human support if needed

---

*📞 **Need More Help?** Contact our support team at support@elearning-platform.com or use in-app chat support.*

---

## 🔧 **PART VII: ENVIRONMENT SETUP & CONFIGURATION**

### **📁 A. Environment Files Structure (Shared Approach)**

```bash
# Project Root Structure - Shared Environment Files
AI-E-LEARNING/
├── frontend/           # NextJS frontend application
├── backend/            # FastAPI backend application
├── .env.local          # Shared development environment (DO NOT COMMIT)
├── .env.production     # Shared production environment (DO NOT COMMIT)
├── .gitignore          # Include .env files
└── README.md           # Project overview
```

**Environment Priority:**
1. `.env.local` (Development - shared by frontend & backend)
2. `.env.production` (Production - shared by frontend & backend)
3. Platform environment variables (Vercel/deployment)

### **🔑 B. Required Environment Variables Template**

```bash
# ===========================================
# AI E-LEARNING PLATFORM - SHARED ENVIRONMENT
# Frontend + Backend Shared Configuration
# ===========================================

# ---- DATABASE CONFIGURATION ----
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://elearning-admin:rizjez-9rotgy-kacXog@cluster1.wq3m07y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1

# ---- AUTHENTICATION (NEXTAUTH) ----
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=qKkozD1CuYtJX59jsg3wOUEg2onqVHi53xq+fHo+vV8=
JWT_SECRET=N9mb4fNnbpOZIdvWaxQ2gGbbm59nUqJDXNaRvLmvPLk=

# ---- AI SERVICE (ANTHROPIC CLAUDE) ----
# Claude 3.5 Sonnet (June 2024) - Optimal balance for AI Study Buddy
ANTHROPIC_API_KEY=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
ANTHROPIC_MODEL=claude-3-5-sonnet-20240620

# ---- OAUTH LOGIN PROVIDERS ----
# Google OAuth
GOOGLE_CLIENT_ID=18917206079-aid5ubqv9cntc3ob6q8r6k02i3ln5ltl.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# GitHub OAuth
GITHUB_CLIENT_ID=Ov23liSFvlSiXONKm9HA
GITHUB_CLIENT_SECRET=39b4653127b3e973c0c9deedd014ba5aad68e89e

# Microsoft OAuth
AZURE_AD_CLIENT_ID=958b8cf6-53ca-4bcb-91fc-fa7ba3c08412
AZURE_AD_CLIENT_SECRET=ykM8Q~VTCXIQFF.iCYInfMu0Lmd7qQ9IlnfySdeF
AZURE_AD_TENANT_ID=6906b6b5-5d7d-4b61-838b-b60393b4c357

# ---- PAYMENT SERVICE (STRIPE) ----
# Test Keys (Development)
STRIPE_PUBLISHABLE_KEY=pk_test_51RceLPQctoHjmRkjxJuEtrWeiHtJnSjXrKLEGYydZ3Xtav8xoKUt4AgAbi13IaA9G5wXywO60hRr10wrG0Zu4X9T00JJ6GA1Fo
STRIPE_SECRET_KEY=sk_test_51RceLPQctoHjmRkj0SvcOM8hZt5zCKHGllevlitAoQewJQzSSSkaQY7kK5XJAQE4RAZlol2n4mWJx66i6ThliqzY004vciWOJ5
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
# Production Keys (Live)
# STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
# STRIPE_SECRET_KEY=sk_live_your_secret_key
# STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret

# ---- EMAIL SERVICE ----
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=info@choiceind.com
SMTP_PASS=dycphhkfvnfjgqhj

# ---- CDN & STORAGE ----
CLOUDFLARE_API_TOKEN=your_cloudflare_token
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
S3_BUCKET_NAME=elearning-videos

# ---- MONITORING & ERROR TRACKING ----
SENTRY_DSN=https://e361b6f5a71325c0649205ce514e1a31@o4509546120675328.ingest.us.sentry.io/4509546126114816

# ---- APPLICATION SETTINGS ----
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **⚡ C. Auto-Generation Scripts**

**Method 1: Using OpenSSL (Recommended)**
```bash
# Generate NextAuth Secret
openssl rand -base64 32

# Generate JWT Secret  
openssl rand -hex 64
```

### **🔐 D. Quick Setup Guide**

#### **OAuth Providers Setup:**
| **Provider** | **Console URL** | **Callback URL** |
|--------------|-----------------|------------------|
| **Google** | [Google Cloud Console](https://console.cloud.google.com/) | `/api/auth/callback/google` |
| **GitHub** | [GitHub Developer Settings](https://github.com/settings/developers) | `/api/auth/callback/github` |
| **Microsoft** | [Azure Portal](https://portal.azure.com/) | `/api/auth/callback/azure-ad` |

#### **API Keys Setup:**
| **Service** | **Dashboard URL** | **Key Type** |
|-------------|-------------------|--------------|
| **Anthropic Claude** | [Console](https://console.anthropic.com/) | API Key (sk-ant-api03-...) |
| **Stripe** | [Dashboard](https://dashboard.stripe.com/) | Test Keys (pk_test_... & sk_test_...) |

### **🔒 E. Security & Best Practices**

### **Environment File Security**
```bash
# .gitignore
.env.local
.env.production
.env.development
.env.test
.env*.local

# Never commit environment files to Git
```

#### **Key Management Best Practices**
1. **Separate Test/Live Keys**: Always use test keys in development
2. **Rotate Secrets**: Change secrets periodically
3. **Limit API Key Permissions**: Use minimum required permissions
4. **Monitor Usage**: Set up alerts for unusual API usage
5. **Environment Isolation**: Never use production keys in development

#### **Next.js Environment Variables Rules**
```bash
# Server-only variables (secure)
NEXTAUTH_SECRET=...
JWT_SECRET=...
STRIPE_SECRET_KEY=sk_test_51RceLPQctoHjmRkj0SvcOM8hZt5zCKHGllevlitAoQewJQzSSSkaQY7kK5XJAQE4RAZlol2n4mWJx66i6ThliqzY004vciWOJ5
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20240620

# Client-exposed variables (public)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51RceLPQctoHjmRkjxJuEtrWeiHtJnSjXrKLEGYydZ3Xtav8xoKUt4AgAbi13IaA9G5wXywO60hRr10wrG0Zu4X9T00JJ6GA1Fo
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_NEXTAUTH_URL=http://localhost:3000
```

### **📝 E. Development Setup Checklist**

#### **🚀 Recommended: Use Complete Setup Script**
```bash
# Use setup-complete.sh for 100% PRD-compliant structure
./setup-complete.sh

# This creates:
✅ Complete monorepo structure (frontend + backend)
✅ All PRD components (useAutosave, NavigationGuard, etc.)
✅ All 26+ API endpoints from PRD specification
✅ Sentry monitoring configuration (Section G)
✅ Real environment variables and API keys
✅ Complete database models and schemas
✅ Next.js + FastAPI integration ready
```

#### **⚠️ Alternative: Manual Setup (Not Recommended)**
```bash
# Using npx create-next-app alone will NOT match PRD structure
# It creates basic Next.js without backend separation
# Missing: FastAPI backend, PRD patterns, Sentry, etc.

☐ 1. Clone repository & install dependencies
☐ 2. Create .env.local file with all variables above
☐ 3. Generate NextAuth & JWT secrets 
☐ 4. Add OAuth providers (Google, GitHub, Microsoft)
☐ 5. Add Claude API key & Stripe test keys
☐ 6. Test all integrations & start development
```

#### **🎯 Why Use setup-complete.sh?**
| **Aspect** | **setup-complete.sh** | **create-next-app alone** |
|------------|----------------------|---------------------------|
| **Structure** | ✅ 100% PRD-compliant monorepo | ❌ Basic Next.js only |
| **Backend** | ✅ Complete FastAPI structure | ❌ Missing backend |
| **Patterns** | ✅ All PRD patterns included | ❌ Manual implementation needed |
| **Sentry** | ✅ Full monitoring setup | ❌ Manual configuration |
| **API Keys** | ✅ Real environment variables | ❌ Manual setup required |
| **Database** | ✅ Complete models/schemas | ❌ Missing data layer |
| **Time to Start** | ✅ 5 minutes ready | ❌ Hours of manual work |

### **🚀 F. Quick Deployment Guide**

| **Platform** | **Environment Setup** | **Key Notes** |
|--------------|----------------------|---------------|
| **Vercel** | Project Settings → Environment Variables | Auto-deployment from GitHub |
| **Railway** | Environment Variables tab | Built-in PostgreSQL & Redis |
| **Docker** | Use .env.production file | Container orchestration |

### **📊 G. Sentry Monitoring Configuration**

**Project DSN:** `https://e361b6f5a71325c0649205ce514e1a31@o4509546120675328.ingest.us.sentry.io/4509546126114816`

#### **NextJS Sentry Setup Files:**
- **Client**: `instrumentation-client.ts`
- **Server**: `sentry.server.config.ts` 
- **Edge**: `sentry.edge.config.ts`

#### **Baseline Configuration:**
```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://e361b6f5a71325c0649205ce514e1a31@o4509546120675328.ingest.us.sentry.io/4509546126114816",
  _experiments: {
    enableLogs: true,
  },
});
```

#### **Exception Catching Pattern:**
```javascript
try {
  await enrollInCourse(courseId);
} catch (error) {
  Sentry.captureException(error);
  toast.error("Enrollment failed");
}
```

#### **Performance Tracing Examples:**
```javascript
// Course enrollment tracking
Sentry.startSpan({
  op: "ui.click.enroll",
  name: "Course Enrollment Click",
}, (span) => {
  span.setAttribute("courseId", courseId);
  span.setAttribute("userType", userType);
  enrollInCourse();
});

// AI assistant calls
async function askAI(question) {
  return Sentry.startSpan({
    op: "ai.chat.question",
    name: "AI Assistant Query",
  }, async () => {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ question })
    });
    return response.json();
  });
}
```

#### **Structured Logging for E-Learning:**
```javascript
import * as Sentry from "@sentry/nextjs";
const { logger } = Sentry;

// Course interactions
logger.info("Course enrollment", { 
  courseId: "123", 
  userId: "456",
  enrollmentType: "premium" 
});

// Video performance
logger.info("Video playback", {
  videoId: "vid_123",
  duration: 1800,
  completionRate: 0.85
});

// AI usage
logger.debug(logger.fmt`AI response time: ${responseTime}ms`);

// Payment events
logger.warn("Payment retry", {
  orderId: "order_123",
  attempt: 2,
  errorCode: "CARD_DECLINED"
});
```

#### **Critical Monitoring Priorities:**
- **User Flows**: Registration, enrollment, payment, video streaming
- **Performance**: Page load < 2s, video start < 3s, AI response < 5s
- **Business Metrics**: Enrollment rates, payment success, course completion
- **AI Operations**: Chat questions, code analysis, quiz generation

---

## 📋 Document Control & Version History

### **Version History**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-20 | Julian | Initial PRD creation with comprehensive specifications |

### **Document Status**
- **Current Status:** ✅ Production Ready - Implementation Approved
- **Next Review Date:** 2025-02-20
- **Stakeholder Approval:** ✅ Approved by Product Manager (Julian) - 2025-01-20
- **Technical Review:** ✅ Complete - All technical specifications validated
- **Business Review:** ✅ Complete - Business requirements confirmed
- **Implementation Status:** 🚀 Ready for Development Phase 1

### **Key Improvements Made**
1. **🗃️ Complete Database Design**: Added comprehensive MongoDB schemas for all collections with indexing strategy
2. **🔧 Enhanced Admin API**: Added 15+ new admin endpoints for comprehensive platform management
3. **🔒 Security Framework**: Added OWASP compliance, GDPR requirements, and security monitoring
4. **📊 Advanced Analytics**: Expanded KPIs and monitoring with business and technical metrics
5. **⚠️ Error Handling**: Comprehensive error recovery and monitoring strategies
6. **🏭 Infrastructure**: Complete deployment and scaling architecture
7. **💾 Autosave System**: Updated code organization with editor state management
8. **📈 Performance**: Detailed performance targets and optimization strategies
9. **📋 Stakeholder Approval**: Documented sign-off and implementation readiness status

### **PRD Completeness Score: 100%**
- ✅ Business Requirements: Complete with comprehensive user personas and business model
- ✅ Technical Architecture: Complete with full system design and database schemas
- ✅ API Specifications: Complete with detailed endpoint workflows and error handling
- ✅ Security Requirements: Complete with OWASP compliance and GDPR framework
- ✅ Performance Targets: Complete with scalability architecture and monitoring
- ✅ Deployment Strategy: Complete with CI/CD pipeline and infrastructure setup
- ✅ Monitoring & Observability: Complete with KPIs, metrics, and alerting strategy
- ✅ Error Handling: Complete with recovery workflows and user feedback patterns
- ✅ Testing Strategy: Complete with comprehensive test plans and quality gates
- ✅ Accessibility Guidelines: Complete with WCAG 2.1 AA implementation details
- ✅ Development Standards: Complete with pattern enforcement and naming conventions
- ✅ Database Design: Complete with full MongoDB schemas and indexing strategy
- ✅ Stakeholder Approval: Complete with documented sign-off and implementation readiness

This PRD now follows modern best practices and provides comprehensive guidance for building a production-ready AI E-Learning platform.
