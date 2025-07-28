# 🏗️ Technical Architecture & Development Standards

## 🏗️ System Architecture & Tech Stack

### Technology Stack
- **Frontend:** NextJS 14+ (App Router), TailwindCSS, TypeScript
- **Backend:** FastAPI (Python), PydanticAI
- **Database:** MongoDB Atlas
- **Authentication:** NextAuth.js (frontend) + JWT verification (FastAPI backend)
- **Storage:** localStorage (dev) → AWS S3/Google Cloud (prod)
- **CDN:** Cloudflare for video streaming and static files
- **Video:** YouTube embed + transcript extraction
- **Payment:** Stripe, MoMo, ZaloPay

### Performance Requirements
- Support 10,000 concurrent users
- Page load time < 2 seconds
- Video streaming 99.9% uptime
- Responsive mobile design

## 📁 Frontend Structure (NextJS 14+ App Router)

```
frontend/
├── app/                              
│   ├── (public)/                    # Public pages
│   │   ├── page.tsx                 # Homepage (/)
│   │   ├── courses/                 # Course catalog
│   │   ├── about/                   # About us
│   │   ├── contact/                 # Contact
│   │   ├── faq/                     # FAQ
│   │   └── pricing/                 # Pricing
│   ├── (auth)/                      # Authentication
│   │   ├── login/                   # Login page
│   │   ├── register/                # Register page
│   │   └── layout.tsx
│   ├── (dashboard)/                 # Authenticated pages
│   │   ├── dashboard/               # Student Dashboard
│   │   ├── learn/                   # Course Player
│   │   ├── my-courses/              # My Learning
│   │   ├── profile/                 # Profile
│   │   ├── certificates/            # Certificates
│   │   └── billing/                 # Payment & billing
│   ├── (creator)/                   # Content Creator
│   │   └── creator/
│   │       ├── courses/             # Course Management
│   │       └── analytics/           # Analytics
│   ├── (admin)/                     # Admin
│   │   └── admin/
│   │       ├── users/               # User Management
│   │       ├── courses/             # Course Management
│   │       ├── analytics/           # Analytics
│   │       └── settings/            # Settings
│   └── layout.tsx                   # Root layout
├── components/
│   ├── ui/                         # Basic UI components
│   │   ├── SaveStatusIndicator.tsx # Shows save status
│   │   └── UnsavedChangesWarning.tsx
│   ├── feature/                    # Feature components
│   │   ├── NavigationGuard.tsx     # Navigation protection
│   │   ├── MobileNavigationDrawer.tsx
│   │   └── SimpleChatWidget.tsx    # AI Study Buddy
│   └── layout/                     # Layout components
├── lib/                           
│   ├── api/                       # API client functions
│   ├── utils/                     # Helper functions
│   ├── constants/                 # App constants
│   └── types/                     # TypeScript types
├── hooks/                         # Custom React hooks
│   ├── useAutosave.ts             # Autosave functionality
│   └── useNavigationGuard.ts     # Navigation protection
└── stores/                        # State management
    └── editorStore.ts             # Editor state
```

## 📁 Backend Structure (FastAPI)

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── auth.py
│   │       │   ├── courses.py
│   │       │   ├── chapters.py
│   │       │   ├── lessons.py
│   │       │   ├── quizzes.py
│   │       │   ├── users.py
│   │       │   ├── payments.py
│   │       │   ├── faq.py
│   │       │   ├── admin.py
│   │       │   └── ai.py
│   │       └── api.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── database.py
│   │   └── exceptions.py
│   ├── models/
│   ├── schemas/
│   ├── services/
│   └── main.py
└── tests/
```

## 🔧 Development Standards

### 🔒 Pattern Consistency Matrix

| Feature Type | Mandatory Pattern | Reference Files |
|--------------|-------------------|-----------------|
| **CRUD Forms** | `useAutosave` + `NavigationGuard` + `SaveStatusIndicator` | `/courses/[id]/edit/page.tsx` |
| **API Calls** | `useApiQuery` + `useApiMutation` + NO direct fetch() | `/hooks/useApiQuery.ts` |
| **Authentication** | `NextAuth` + `useAuth` hook + JWT verification | `/hooks/useAuth.ts` |
| **Data Fetching** | `React Query` + loading/error/success states | `/hooks/useApiQuery.ts` |
| **Mutations** | `useApiMutation` + `operationName` + automatic toasts | `/hooks/useApiMutation.ts` |
| **User Feedback** | `ToastService` + NEVER alert() + 'Something went wrong' fallback | `/lib/toast/service.ts` |
| **Form Validation** | `Zod schemas` + `react-hook-form` | `/lib/validators/*.ts` |
| **Error Handling** | `ErrorBoundary` + `ToastService` + `Sentry logging` | `/components/ErrorBoundary.tsx` |

### 🎯 GOLDEN RULE: COPY-PASTE CONSISTENCY
```typescript
// ✅ CORRECT: Copy exact pattern from existing
const ChapterEditor = () => {
  // Same hooks order
  const { courseData, setCourseData } = useState();
  const { forceSave, saveStatus } = useAutosave();
  const { reset } = useEditorStore();
  
  // Same error handling
  // Same UI structure
  // Same navigation guard
}

// ❌ WRONG: Create new pattern
const ChapterEditor = () => {
  // Different state management
  // Different save logic  
  // Different error handling
}
```

### 🔔 USER FEEDBACK PATTERN

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

### 🚨 CRITICAL ERROR HANDLING RULE:
```typescript
// MANDATORY: All error messages MUST follow this pattern:
// Backend MUST ALWAYS return a message
// ALL cases fallback to "Something went wrong"

// ✅ CORRECT:
toast.success(response.message || 'Something went wrong');
toast.error(error.message || 'Something went wrong');

// ❌ WRONG:
toast.success(response.message || 'Operation successful');
toast.error('Failed to load dashboard');
```

### 🔔 TOAST MANAGEMENT PATTERN

**GOLDEN RULE: Let useApiMutation handle ALL toasts automatically**

```typescript
// ✅ CORRECT - Automatic Toast Handling:
mutate(data, {
  onSuccess: (response) => {
    // Handle logic only, NO toast calls
    router.push('/success');
  },
  onError: (error) => {
    // Handle logic only, NO toast calls
    console.error('Operation failed:', error);
  }
});

// ❌ WRONG - Manual Toast:
mutate(data, {
  onSuccess: (response) => {
    ToastService.success(response.message); // NO! Duplicate
  }
});
```

### 🆔 TOAST ID PATTERN:
```typescript
// Always use operation-based IDs
// Format: {action}-{resource}-{id}

// ✅ CORRECT:
'delete-course-123'
'update-profile-456'
'create-faq'

// ❌ WRONG:
`toast-${Date.now()}`
'success-toast'
```

### 📊 MONGODB ID CONVERSION PATTERN

**MANDATORY: All backend services MUST convert MongoDB _id to id**

```python
# ✅ CORRECT (Smart Backend):
formatted_items = []
for item in items:
    item_dict = item.dict(exclude={"id"})
    item_dict["id"] = str(item.id)
    formatted_items.append(item_dict)

return {
    "items": formatted_items,
    "total": total,
}

# ❌ WRONG (Forces Frontend Mapping):
return {
    "items": items,  # Raw documents with _id
    "total": total,
}
```

### 📄 PAGINATION PATTERN

**GOLDEN RULE: Smart Backend, Dumb Frontend**

```python
# Backend MUST calculate total_pages:
async def list_items(page: int = 1, per_page: int = 20):
    total_count = await Model.find(filters).count()
    total_pages = (total_count + per_page - 1) // per_page
    
    skip = (page - 1) * per_page
    items = await Model.find(filters).skip(skip).limit(per_page).to_list()
    
    return {
        "items": items,
        "total": total_count,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages  # REQUIRED
    }
```

### 🎯 NAMING CONVENTIONS

**Files:**
- Frontend: camelCase (userProfile.tsx)
- Backend: snake_case (user_service.py)
- Directories: kebab-case (user-management)

**API:**
- Endpoints: kebab-case (/api/v1/courses)
- Query params: camelCase (?sortBy=createdAt)
- Response fields: camelCase

**Database:**
- Collections: snake_case (user_profiles)
- Fields: snake_case (first_name)

**Code:**
- TypeScript/JS: camelCase
- Python: snake_case (PEP 8)
- Constants: SCREAMING_SNAKE_CASE