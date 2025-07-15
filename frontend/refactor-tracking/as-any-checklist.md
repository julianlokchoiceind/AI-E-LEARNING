# AS ANY REFACTOR CHECKLIST

## STATUS LEGEND
- ⬜ Not started
- 🟨 In progress  
- ✅ Completed
- ❌ Blocked/Issue

## PHASE 1: TYPE INFRASTRUCTURE ⬜
- [ ] Create `/frontend/types/browser.d.ts`
- [ ] Create `/frontend/lib/types/forms.ts`
- [ ] Create `/frontend/lib/types/auth.ts`
- [ ] Update `tsconfig.json` to include new types
- [ ] Run `tsc --noEmit` to verify no type errors

## PHASE 2: BROWSER API CASTS (28 items) ⬜

### 2.1 Navigator Connection API (14 items)
- [ ] `/frontend/hooks/useVideoOptimization.ts:41` - connection cast
- [ ] `/frontend/hooks/useVideoOptimization.ts:42` - mozConnection cast
- [ ] `/frontend/hooks/useVideoOptimization.ts:43` - webkitConnection cast
- [ ] `/frontend/hooks/useMobile.ts:323` - connection cast
- [ ] `/frontend/hooks/useMobile.ts:336` - connection event listener
- [ ] `/frontend/hooks/useMobile.ts:342` - connection event removal

### 2.2 Battery API (6 items)
- [ ] `/frontend/hooks/useVideoOptimization.ts:162` - getBattery cast
- [ ] `/frontend/hooks/useMobile.ts:314` - getBattery cast

### 2.3 Performance API (2 items)
- [ ] `/frontend/lib/utils/performance.ts:248` - performance.memory cast

### 2.4 YouTube Player (6 items)
- [ ] `/frontend/components/feature/VideoPlayer.tsx:134` - onReady event
- [ ] `/frontend/components/feature/VideoPlayer.tsx:146` - onStateChange event
- [ ] `/frontend/components/feature/VideoPlayer.tsx:165` - onError event
- [ ] `/frontend/components/feature/PreviewVideoPlayer.tsx:100` - onReady event
- [ ] `/frontend/components/feature/PreviewVideoPlayer.tsx:104` - onStateChange event

## PHASE 3: RESPONSE DATA TYPES (25 items) ⬜

### 3.1 Auth Response (8 items)
- [ ] `/frontend/lib/auth.ts:50` - data.access_token
- [ ] `/frontend/lib/auth.ts:61` - data.access_token
- [ ] `/frontend/lib/auth.ts:62` - data.refresh_token
- [ ] `/frontend/lib/auth.ts:155` - token.error assignment
- [ ] `/frontend/lib/auth.ts:162` - token.error assignment
- [ ] `/frontend/lib/auth.ts:224` - data.data check
- [ ] `/frontend/lib/auth.ts:234` - currentSession cast
- [ ] `/frontend/lib/auth.ts:235` - currentSession cast

### 3.2 Course/Chapter Response (10 items)
- [ ] `/frontend/app/(admin)/admin/courses/[id]/edit:184` - courseData keys cast
- [ ] `/frontend/app/(admin)/admin/courses/[id]/edit:187` - typeof courseData cast
- [ ] `/frontend/app/(admin)/admin/courses/[id]/edit:198` - chapters response cast
- [ ] `/frontend/app/(creator)/creator/courses/[id]/edit:66` - chapters response cast
- [ ] `/frontend/lib/api/chapters.ts:174` - response.data cast

### 3.3 API Client Headers (7 items)
- [ ] `/frontend/lib/api/api-client.ts:150` - headers cast
- [ ] `/frontend/lib/api/api-client.ts:151` - authHeader cast
- [ ] `/frontend/lib/api/api-client.ts:152` - headers spread cast
- [ ] `/frontend/lib/api/api-client.ts:459` - headers Content-Type cast

## PHASE 4: FORM/EVENT HANDLERS (12 items) ⬜

### 4.1 Form Submit Events (5 items)
- [ ] `/frontend/components/feature/EditChapterModal.tsx:148` - form submit
- [ ] `/frontend/components/feature/CreateLessonModal.tsx:220` - form submit
- [ ] `/frontend/components/feature/CreateChapterModal.tsx:128` - form submit
- [ ] `/frontend/components/feature/EditLessonModal.tsx:242` - form submit

### 4.2 Select Change Events (7 items)
- [ ] `/frontend/app/(admin)/admin/support/page.tsx:52` - status filter cast
- [ ] `/frontend/app/(admin)/admin/support/page.tsx:53` - priority filter cast
- [ ] `/frontend/app/(admin)/admin/support/page.tsx:72` - update mutation cast
- [ ] `/frontend/app/(admin)/admin/support/page.tsx:292` - priority change cast
- [ ] `/frontend/app/(admin)/admin/support/page.tsx:308` - status change cast
- [ ] `/frontend/app/(admin)/admin/faq/page.tsx:418` - category change cast
- [ ] `/frontend/app/(dashboard)/support/page.tsx:278` - category change cast

## PHASE 5: ERROR HANDLING (10 items) ⬜

### 5.1 Sentry Integration (6 items)
- [ ] `/frontend/lib/utils/error-handler.ts:249` - Sentry check cast
- [ ] `/frontend/lib/utils/error-handler.ts:250` - Sentry capture cast
- [ ] `/frontend/components/ErrorBoundary.tsx:42` - Sentry check cast
- [ ] `/frontend/components/ErrorBoundary.tsx:43` - Sentry capture cast
- [ ] `/frontend/components/feature/PaymentErrorBoundary.tsx:51` - Sentry check cast
- [ ] `/frontend/components/feature/PaymentErrorBoundary.tsx:52` - Sentry capture cast

### 5.2 Error Object Casts (4 items)
- [ ] `/frontend/components/feature/CourseCheckoutForm.tsx:130` - error.code cast
- [ ] `/frontend/components/feature/CourseCheckoutForm.tsx:131` - error.type cast
- [ ] `/frontend/components/feature/PaymentErrorBoundary.tsx:40` - error.code cast
- [ ] `/frontend/components/feature/PaymentErrorBoundary.tsx:55` - error.type cast

## PHASE 6: MUTATIONS/QUERIES (20 items) ⬜

### 6.1 Optimistic Updates (10 items)
- [ ] `/frontend/hooks/queries/useCourses.ts:159` - queryClient.setQueryData cast
- [ ] `/frontend/hooks/queries/useCourses.ts:337` - queryClient.setQueryData cast
- [ ] `/frontend/hooks/queries/useCourses.ts:631` - old courses cast
- [ ] `/frontend/hooks/queries/useSupport.ts:109` - old tickets cast
- [ ] `/frontend/hooks/queries/useChapters.ts:163` - old chapters cast

### 6.2 Mutation Variables (10 items)
- [ ] `/frontend/hooks/useApiMutation.ts:9` - onMutate type
- [ ] `/frontend/hooks/queries/useFAQ.ts:100` - old FAQs cast
- [ ] `/frontend/hooks/queries/useAdminUsers.ts:81` - old users cast
- [ ] `/frontend/hooks/queries/useLessons.ts:179` - old lessons cast

## PHASE 7: MISC CASTS (7 items) ⬜
- [ ] `/frontend/hooks/useAutosave.ts:145` - formDataCopy cast
- [ ] `/frontend/hooks/useAutosave.ts:146` - previousDataCopy cast
- [ ] `/frontend/components/feature/SubscriptionCheckoutForm.tsx:98` - payment error cast
- [ ] `/frontend/app/(dashboard)/support/page.tsx:201` - Badge variant cast
- [ ] `/frontend/app/(dashboard)/support/page.tsx:205` - Badge variant cast
- [ ] `/frontend/app/(dashboard)/support/[ticketId]/page.tsx:177` - Badge variant cast
- [ ] `/frontend/app/(dashboard)/support/[ticketId]/page.tsx:181` - Badge variant cast

## TOTAL: 82 items
- Total items: 82
- Completed: 0
- Remaining: 82
- Progress: 0%

## TRACKING LOG
<!-- Add entries here as work progresses -->
### [Date] - Session 1
- Started: Phase X
- Completed: X items
- Issues: None
- Next: Continue Phase X
