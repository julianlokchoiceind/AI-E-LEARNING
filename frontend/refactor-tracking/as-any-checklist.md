# AS ANY REFACTOR CHECKLIST (UPDATED)

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

## PHASE 2: BROWSER API CASTS (12 items) ⬜

### 2.1 Navigator Connection API (8 items)
- [ ] `/frontend/hooks/useVideoOptimization.ts:41` - connection cast
- [ ] `/frontend/hooks/useVideoOptimization.ts:42` - mozConnection cast
- [ ] `/frontend/hooks/useVideoOptimization.ts:43` - webkitConnection cast
- [ ] `/frontend/hooks/useMobile.ts:323` - connection cast
- [ ] `/frontend/hooks/useMobile.ts:336` - connection event listener
- [ ] `/frontend/hooks/useMobile.ts:342` - connection event removal

### 2.2 Battery API (2 items)
- [ ] `/frontend/hooks/useVideoOptimization.ts:162` - battery cast
- [ ] `/frontend/hooks/useMobile.ts:314` - getBattery cast

### 2.3 Performance API (1 item)
- [ ] `/frontend/lib/utils/performance.ts:248` - performance.memory cast

## PHASE 3: RESPONSE DATA TYPES (15 items) ⬜

### 3.1 Auth Response (2 items)
- [ ] `/frontend/lib/auth.ts:155` - token.error assignment
- [ ] `/frontend/lib/auth.ts:162` - token.error assignment

### 3.2 Course/Chapter Response (5 items)
- [ ] `/frontend/app/(admin)/admin/courses/[id]/edit/page.tsx:187` - courseData _id cast
- [ ] `/frontend/app/(admin)/admin/courses/[id]/edit/page.tsx:190` - courseData _id cast
- [ ] `/frontend/app/(creator)/creator/courses/[id]/edit/page.tsx:66` - chapters response cast

### 3.3 API Client Headers (5 items)
- [ ] `/frontend/lib/api/api-client.ts:150` - hasAuthHeader cast
- [ ] `/frontend/lib/api/api-client.ts:151` - authHeaderLength cast (2 occurrences)
- [ ] `/frontend/lib/api/api-client.ts:152` - allHeaders cast
- [ ] `/frontend/lib/api/api-client.ts:234` - currentSession accessToken cast
- [ ] `/frontend/lib/api/api-client.ts:235` - currentSession refreshToken cast
- [ ] `/frontend/lib/api/api-client.ts:459` - headers Content-Type cast

## PHASE 4: FORM/EVENT HANDLERS (15 items) ⬜

### 4.1 Form Submit Events (4 items)
- [ ] `/frontend/components/feature/EditChapterModal.tsx:154` - form submit
- [ ] `/frontend/components/feature/CreateLessonModal.tsx:220` - form submit
- [ ] `/frontend/components/feature/CreateChapterModal.tsx:128` - form submit
- [ ] `/frontend/components/feature/EditLessonModal.tsx:242` - form submit

### 4.2 Select Change Events (11 items)
- [ ] `/frontend/app/(admin)/admin/support/page.tsx:52` - status filter cast
- [ ] `/frontend/app/(admin)/admin/support/page.tsx:53` - priority filter cast
- [ ] `/frontend/app/(admin)/admin/support/page.tsx:54` - category filter cast
- [ ] `/frontend/app/(admin)/admin/support/page.tsx:72` - update mutation cast
- [ ] `/frontend/app/(admin)/admin/support/page.tsx:292` - priority change cast
- [ ] `/frontend/app/(admin)/admin/support/page.tsx:308` - status change cast
- [ ] `/frontend/app/(admin)/admin/support/page.tsx:399` - Badge variant cast
- [ ] `/frontend/app/(admin)/admin/faq/page.tsx:418` - category change cast
- [ ] `/frontend/app/(dashboard)/support/page.tsx:52` - status filter cast
- [ ] `/frontend/app/(dashboard)/support/page.tsx:278` - category change cast
- [ ] `/frontend/app/(dashboard)/support/page.tsx:295` - priority change cast

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
- [ ] `/frontend/components/feature/CourseCheckoutForm.tsx:154` - error.code cast
- [ ] `/frontend/components/feature/CourseCheckoutForm.tsx:155` - error.type cast
- [ ] `/frontend/components/feature/PaymentErrorBoundary.tsx:40` - error.code cast
- [ ] `/frontend/components/feature/PaymentErrorBoundary.tsx:55` - error.code cast
- [ ] `/frontend/components/feature/SubscriptionCheckoutForm.tsx:98` - error.code cast
- [ ] `/frontend/components/feature/SubscriptionCheckoutForm.tsx:99` - error.type cast

## PHASE 6: BADGE VARIANTS (4 items) ⬜
- [ ] `/frontend/app/(dashboard)/support/page.tsx:201` - Badge status color cast
- [ ] `/frontend/app/(dashboard)/support/page.tsx:205` - Badge priority color cast
- [ ] `/frontend/app/(dashboard)/support/[ticketId]/page.tsx:177` - Badge status color cast
- [ ] `/frontend/app/(dashboard)/support/[ticketId]/page.tsx:181` - Badge priority color cast

## PHASE 7: MISC CASTS (2 items) ⬜
- [ ] `/frontend/hooks/useAutosave.ts:151` - formData currentCopy cast
- [ ] `/frontend/hooks/useAutosave.ts:152` - formData previousCopy cast

## TOTAL: 55 items (Updated)
- Total items: 55
- Completed: 0
- Remaining: 55
- Progress: 0%

## TRACKING LOG
<!-- Add entries here as work progresses -->
### [Date] - Session 1
- Started: Phase X
- Completed: X items
- Issues: None
- Next: Continue Phase X
