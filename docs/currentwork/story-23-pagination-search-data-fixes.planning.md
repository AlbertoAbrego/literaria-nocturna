# Story 23 – Pagination, Search & Data Integrity Fixes

## Implementation Plan

## Overview

This story addresses critical bugs in pagination, search, and data integrity identified during the audit (H-02, H-05, H-08). The fixes span both backend and frontend, ensuring robust handling of edge cases before E2E testing begins.

**Why it exists:**
- Pagination breaks when deleting the last item on a page
- Search treats user input as raw regex, breaking on metacharacters
- Race condition allows duplicate (title, author) pairs despite service-level check

**Out of Scope:**
- Members/Readings modules
- UI redesign or new components
- Performance optimization beyond correctness fixes
- Backend pagination algorithm changes (already correct)

---

# Phase 1 – Backend Foundation

## Goal

Establish backend fixes for search safety, data integrity, and duplicate key handling. These are prerequisites for frontend fixes to work correctly.

## Tasks

### 1.1 Add Unique Compound Index on (title, author)
- File: ackend/src/models/book.model.ts
- Add ookSchema.index({ title: 1, author: 1 }, { unique: true })
- This enforces uniqueness at the database level, eliminating race conditions

### 1.2 Handle MongoDB Duplicate Key Error (11000) → 409 CONFLICT
- File: ackend/src/middleware/error.middleware.ts
- Add check for err instanceof mongoose.mongo.MongoServerError && err.code === 11000
- Return standardized 409 response with code: "CONFLICT", message: "Book already exists."

### 1.3 Escape Regex Metacharacters in Search
- File: ackend/src/services/book.service.ts
- Create utility function escapeRegex(input: string): string that escapes: . - ? ( ) [ ] { } | ^ $ \
- Apply to ilters.author and ilters.title before constructing $regex queries
- Preserve case-insensitive ($options: "i") and partial matching behavior

### 1.4 Update OpenAPI Contract (if needed)
- Run 
pm run contract:extract after changes to regenerate types
- Verify Swagger UI reflects 409 CONFLICT for duplicate key

## Files

`
backend/src/models/book.model.ts
backend/src/middleware/error.middleware.ts
backend/src/services/book.service.ts
backend/src/config/swagger.ts (auto-regenerated)
`

## Deliverables

- Unique index on (title, author) enforced by MongoDB
- Duplicate key error returns 409 CONFLICT with standardized format
- Search safely handles all regex metacharacters
- Partial + case-insensitive matching preserved
- Backend tests pass

---

# Phase 2 – Backend Test Coverage

## Goal

Add comprehensive integration tests for the backend fixes to prevent regressions.

## Tasks

### 2.1 Search Special Character Tests
- File: ackend/src/test/integration/books.list.integration.test.ts
- Add tests for each metacharacter: . - ? ( ) [ ] { } | ^ $ \
- Verify partial matching still works (e.g., "Dune" matches "Dune Messiah")
- Verify case-insensitive matching still works
- Verify normal text searches unaffected

### 2.2 Data Integrity Tests
- File: ackend/src/test/integration/books.create.integration.test.ts (or new file)
- Test duplicate (title + author) → 409 CONFLICT
- Test same title, different author → 201 CREATED
- Test same author, different title → 201 CREATED
- Test concurrent duplicate creation (simulate race condition)

### 2.3 Pagination Edge Case Tests
- File: ackend/src/test/integration/books.list.integration.test.ts
- Verify pagination metadata correctness with active filters
- Verify empty page beyond totalPages returns correct metadata
- Verify total/totalPages recalculation after deletions (via list endpoint)

## Files

`
backend/src/test/integration/books.list.integration.test.ts
backend/src/test/integration/books.create.integration.test.ts
`

## Deliverables

- All new tests pass
- Existing tests still pass
- Coverage for all acceptance criteria backend portions

---

# Phase 3 – Frontend Search Safety & MSW Alignment

## Goal

Align frontend MSW handlers with backend behavior and ensure search input handling is safe.

## Tasks

### 3.1 Add Regex Escape Utility
- File: rontend/src/features/books/utils/searchFilters.ts (or new utils/regex.ts)
- Export escapeRegex(input: string): string mirroring backend implementation
- Unit test the utility with all metacharacters

### 3.2 Update MSW Handlers for Search
- File: rontend/src/test/handlers/books.ts
- Apply escapeRegex to uthor and 	itle query params before filtering in-memory
- Ensure MSW handlers mirror backend validation and filtering logic exactly

### 3.3 Update MSW Handlers for Duplicate Key
- File: rontend/src/test/handlers/books.ts
- In POST /api/books and PATCH /api/books/:id, detect duplicate (title, author) and return 409 CONFLICT
- Use conflictError(ERROR_MESSAGES.BOOK_EXISTS) helper

### 3.4 Run Contract Verification
- Run 
pm run contract:verify to ensure MSW handlers match OpenAPI spec
- Run 
pm run contract:check in CI pipeline

## Files

`
frontend/src/features/books/utils/regex.ts (new)
frontend/src/features/books/utils/searchFilters.ts (update exports)
frontend/src/test/handlers/books.ts
frontend/src/test/contract/validators.ts (if needed)
`

## Deliverables

- MSW handlers match backend behavior exactly
- Contract verification passes
- Frontend search safe from regex injection

---

# Phase 4 – Frontend Pagination Fixes

## Goal

Fix pagination bugs in the frontend: page adjustment after deletion, totalPages recalculation, and filter-aware metadata.

## Tasks

### 4.1 Fix Optimistic Update in useDeleteBook
- File: rontend/src/features/books/hooks/useDeleteBook.ts
- Update emoveBookFromList to recalculate 	otalPages = Math.ceil(total / limit)
- After optimistic removal, if currentPage > totalPages and 	otalPages > 0, adjust to last valid page
- If 	otalPages === 0, reset to page 1
- The hook should return the adjusted page or communicate it to useBookFilters

### 4.2 Coordinate Page Adjustment with URL State
- File: rontend/src/features/books/hooks/useBookFilters.ts
- Add djustPageAfterDeletion(totalPages: number) function that:
  - Computes safe page: Math.min(page, Math.max(1, totalPages))
  - Calls setSearchParams with adjusted page if different
- Call this from useDeleteBook.onSuccess after invalidation

### 4.3 Ensure Pagination Metadata Consistency with Filters
- File: rontend/src/pages/BooksPage.tsx
- Verify data.pagination reflects filtered results (backend already correct)
- Ensure "Showing X–Y of Z volumes" uses data.pagination.total (already correct)

### 4.4 Handle Empty Page After Deletion
- File: rontend/src/pages/BooksPage.tsx
- When data.data.length === 0 && pagination.total > 0, show empty state but keep pagination if 	otalPages > 1
- When data.data.length === 0 && pagination.total === 0, show empty state without pagination

## Files

`
frontend/src/features/books/hooks/useDeleteBook.ts
frontend/src/features/books/hooks/useBookFilters.ts
frontend/src/pages/BooksPage.tsx
`

## Deliverables

- Deleting last item on page adjusts to previous page
- Deleting only item on page adjusts to page 1
- Deleting with filters active maintains correct counts
- totalPages recalculated correctly in optimistic update
- Pagination UI stays consistent with data

---

# Phase 5 – Frontend Test Coverage

## Goal

Add comprehensive tests for frontend fixes, following the testing conventions in rontend-testing.md.

## Tasks

### 5.1 Pagination Hook/Component Tests
- File: rontend/src/features/books/hooks/useDeleteBook.test.ts
  - Test: delete last book on page → page adjusts
  - Test: delete only book on page → page resets to 1
  - Test: delete item with filters active → correct total/totalPages
  - Test: navigate after deletion → correct page shown
  - Test: verify total, totalPages, currentPage consistency

- File: rontend/src/shared/components/ui/Pagination.test.tsx
  - Test: component handles 	otalPages change correctly
  - Test: currentPage clamped to valid range

### 5.2 Search Hook/Component Tests
- File: rontend/src/features/books/hooks/useBookFilters.test.ts
  - Test: special characters in search input don't break requests
  - Test: partial matching works (via MSW)
  - Test: case-insensitive matching works (via MSW)
  - Test: normal text searches work

- File: rontend/src/pages/BooksPage.test.tsx
  - Test: search with special characters (., -, ?, etc.)
  - Test: search maintains partial/case-insensitive behavior

### 5.3 Data Integrity Tests
- File: rontend/src/features/books/hooks/useCreateBook.test.ts (or new)
  - Test: duplicate title + author → 409 CONFLICT surfaced
  - Test: same title different author → success
  - Test: same author different title → success
  - Test: concurrent duplicate creation where practical

### 5.4 Integration Tests
- File: rontend/src/pages/BooksPage.test.tsx
  - Test: full delete flow with page adjustment
  - Test: delete with filters + verify metadata
  - Test: create duplicate → shows error alert

## Files

`
frontend/src/features/books/hooks/useDeleteBook.test.ts
frontend/src/features/books/hooks/useBookFilters.test.ts
frontend/src/features/books/hooks/useCreateBook.test.ts (extend)
frontend/src/pages/BooksPage.test.tsx
frontend/src/shared/components/ui/Pagination.test.tsx
frontend/src/test/utils/factories/book.factory.ts (if needed)
`

## Deliverables

- All new tests pass
- Test suite runs with 
pm run test:run
- Coverage meets project standards

---

# Final Phase – Verification & Polish

## Goal

Final quality checks, documentation updates, and validation that all acceptance criteria are met.

## Tasks

### 6.1 Code Quality Checks
- Run 
pm run lint (both frontend and backend)
- Run 
px tsc --noEmit (both frontend and backend)
- Run 
pm run test:run (frontend)
- Run 
pm run test:ci (backend)
- Run 
pm run contract:check (frontend)

### 6.2 Manual Verification
- Start backend and frontend
- Test search with special characters: . - ? ( ) [ ] { } | ^ $ \
- Test delete last item on page → auto-adjust
- Test delete only item on page → reset to page 1
- Test delete with filters → correct counts
- Test create duplicate book → 409 error displayed
- Verify pagination metadata shows correct totals with filters

### 6.3 Documentation Updates
- Update docs/frontend-context.md if any architectural patterns changed
- Update docs/frontend-testing.md if new testing patterns introduced
- Update docs/design/design-system.md if new tokens added (unlikely)

## Files

`
docs/frontend-context.md (if needed)
docs/frontend-testing.md (if needed)
`

## Deliverables

- All lint/typecheck/test commands pass
- Manual verification confirms all acceptance criteria
- Documentation updated if needed

---

# Testing Scope

## Component Tests

| Component | Test File | Key Scenarios |
|-----------|-----------|---------------|
| Pagination | shared/components/ui/Pagination.test.tsx | Page clamping, ellipsis rendering, keyboard nav, loading state |
| FilterBar | eatures/books/components/FilterBar.test.tsx | Input handling, clear filters, genre select |
| SearchBar | eatures/books/components/SearchBar.test.tsx | Special char input, debounce, URL sync |
| BookTable | eatures/books/components/BookTable.test.tsx | Empty state, error state, loading skeleton, delete button |
| DeleteBookButton | eatures/books/components/DeleteBookButton.test.tsx | Confirmation modal, cancel flow, keyboard |

## Hook / Service Tests

| Hook | Test File | Key Scenarios |
|------|-----------|---------------|
| useDeleteBook | eatures/books/hooks/useDeleteBook.test.ts | Optimistic update, page adjustment, rollback, cache invalidation, 404/500 errors |
| useBookFilters | eatures/books/hooks/useBookFilters.test.ts | Draft/committed sync, URL sync, back/forward nav, debounce, page adjustment |
| useBooks | eatures/books/hooks/useBooks.test.ts | Query key derivation, filter changes trigger refetch, caching |
| useCreateBook | eatures/books/hooks/useCreateBook.test.ts | Success, validation error, 409 conflict |
| useUpdateBook | eatures/books/hooks/useUpdateBook.test.ts | Success, 409 conflict, 404 not found |

## Integration Tests

| Page/Flow | Test File | Key Scenarios |
|-----------|-----------|---------------|
| BooksPage | pages/BooksPage.test.tsx | Load, filter, paginate, delete, search special chars, URL sync, empty states |
| CreateBookPage | pages/CreateBookPage.test.tsx | Form validation, submit, duplicate error display |
| EditBookPage | pages/EditBookPage.test.tsx | Load, update, duplicate error, 404 |

---

# File Structure

`	ext
backend/
├── src/
│   ├── models/
│   │   └── book.model.ts              # + unique index
│   ├── services/
│   │   └── book.service.ts            # + escapeRegex utility
│   ├── middleware/
│   │   └── error.middleware.ts        # + 11000 handling
│   └── test/integration/
│       ├── books.list.integration.test.ts      # + search char tests, pagination
│       └── books.create.integration.test.ts    # + duplicate/409 tests

frontend/
├── src/
│   ├── features/books/
│   │   ├── utils/
│   │   │   ├── regex.ts               # NEW: escapeRegex utility
│   │   │   └── searchFilters.ts       # export escapeRegex
│   │   ├── hooks/
│   │   │   ├── useDeleteBook.ts       # + page adjustment logic
│   │   │   ├── useDeleteBook.test.ts  # + pagination edge cases
│   │   │   ├── useBookFilters.ts      # + adjustPageAfterDeletion
│   │   │   ├── useBookFilters.test.ts # + search special chars
│   │   │   └── useCreateBook.test.ts  # + 409 conflict test
│   │   ├── api/
│   │   │   └── books.api.ts           # (no changes expected)
│   ├── pages/
│   │   ├── BooksPage.tsx              # + empty page handling
│   │   └── BooksPage.test.tsx         # + pagination/delete/search tests
│   ├── shared/components/ui/
│   │   ├── Pagination.tsx             # (no changes expected)
│   │   └── Pagination.test.tsx        # + page clamping tests
│   └── test/
│       ├── handlers/
│       │   └── books.ts               # + regex escape, 409 handling
│       └── contract/
│           └── validators.ts          # (verify alignment)
`

---

# Implementation Sequence

## Phase Dependency Flow

`
Phase 1 (Backend Foundation)
    │
    ├──→ Phase 2 (Backend Tests) ──────────────────────────┐
    │                                                      │
    ├──→ Phase 3 (Frontend MSW/Regex) ────────────────────┤
    │                                                      │
    └──→ Phase 4 (Frontend Pagination) ───────────────────┤
                                                         │
Phase 5 (Frontend Tests) ◄───────────────────────────────┘
    │
    └──→ Phase 6 (Verification & Polish)
`

## Recommended Implementation Order

1. **Backend first** (Phases 1–2): Fixes are prerequisites for frontend behavior
2. **MSW alignment** (Phase 3): Frontend tests need correct mock behavior
3. **Frontend logic** (Phase 4): Core fixes with working mocks
4. **Frontend tests** (Phase 5): Validate fixes with correct mocks
5. **Verification** (Phase 6): Full suite + manual check

---

# Design System Compliance

All new/modified components must adhere to:

| Aspect | Requirement |
|--------|-------------|
| **Colors** | Use tokens: obsidian, midnight, charcoal, graphite, ntique-gold, urnished-gold, parchment, og, sh, semantic Success/Warning/Error |
| **Typography** | Headings: Cormorant Garamond; Body/UI: Inter; Scale per design-system.md |
| **Spacing** | 4px base unit; tokens xs(4), sm(8), md(16), lg(24), xl(32), 2xl(48), 3xl(64) |
| **Border Radius** | Buttons/Inputs: 10px; Cards/Tables: 12px; Modals: 16px |
| **Shadows** | Soft layered; card: subtle elevation; modal: stronger separation |
| **Motion** | Durations: 150/200/300ms; Easing: ease-out, ease-in-out; Subtle, calm |
| **Accessibility** | ria-label on pagination nav; ria-current="page" on active; keyboard nav (ArrowLeft/Right); focus-visible outlines; role="status" for loading; color contrast per WCAG AA |

No hardcoded colors, spacing, or radii. Use Tailwind semantic utilities (g-charcoal, 	ext-parchment, ounded-button, etc.).

---

# Dependencies

## Backend Endpoints
- GET /api/books — list with filters/pagination (search safety, metadata)
- POST /api/books — create (409 CONFLICT on duplicate)
- PATCH /api/books/:id — update (409 CONFLICT on duplicate)
- DELETE /api/books/:id — delete (204)

## Frontend Infrastructure
- TanStack Query v5 (cache management, invalidation)
- React Router v6 (URL-synced filter state via useSearchParams)
- MSW v2 (contract-driven handlers)
- Vitest + React Testing Library

## Shared Components
- Pagination (controlled, accessible)
- FilterBar / SearchBar (draft/committed filter state)
- BookTable / DeleteBookButton (delete flow)
- EmptyState / ErrorState / Skeleton

## Testing Infrastructure
- createTestQueryClient() — etry: false, gcTime: 0
- enderWithProviders — QueryClientProvider + router context
- createMemoryRouter — for URL-synced filter tests
- Contract layer: contract/validators.ts, contract/error-messages.ts

## Design System
- src/index.css @theme block (tokens)
- shared/components/ui/* (semantic component library)

---

# Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Regex escape logic differs between backend/frontend | Medium | High | Single source of truth: implement in backend service, mirror in MSW; test both with identical inputs |
| Page adjustment breaks URL sync | Medium | High | Coordinate useDeleteBook → useBookFilters via explicit function; test with createMemoryRouter |
| Optimistic update race with invalidation | Low | Medium | Follow existing pattern: onMutate cancel + snapshot, onError restore, onSuccess invalidate |
| MSW contract drift after backend changes | Medium | High | Run 
pm run contract:check in CI; add to pre-push if not present |
| Unique index migration on existing data | Low | High | Story assumes clean slate; if data exists, add migration script (out of scope) |
| Concurrent duplicate creation test flakiness | Medium | Medium | Use deterministic timing; mock at service level for unit test, rely on DB index for integration |

---

# Acceptance Criteria Mapping

| AC | Phase | Verification |
|----|-------|--------------|
| Identified pagination bugs are fixed | 4, 5 | Frontend integration tests: delete last/only item, navigate after deletion |
| Pagination metadata remains correct with filters | 1, 4, 5 | Backend list tests + frontend BooksPage tests with active filters |
| Special characters do not break search requests | 1, 3, 5 | Backend service tests + MSW handler tests + frontend search tests |
| Search maintains expected partial/case-insensitive behavior | 1, 3, 5 | Backend list tests (TC-H8-002, TC-H8-003) + frontend filter tests |
| Database enforces uniqueness for (title, author) | 1, 2 | Backend create tests: duplicate → 409; unique index in model |
| Duplicate key errors return 409 CONFLICT | 1, 2, 3 | Error middleware test + MSW handler test + frontend create test |
| Backend and frontend test suites pass | 2, 5, 6 | 
pm run test:ci (backend), 
pm run test:run (frontend) |

---

# Definition of Done

- [ ] Backend: Unique index on (title, author) created
- [ ] Backend: MongoDB error 11000 → 409 CONFLICT in error middleware
- [ ] Backend: Search escapes regex metacharacters (. - ? ( ) [ ] { } | ^ $ \)
- [ ] Backend: Partial + case-insensitive matching preserved
- [ ] Backend: All integration tests pass (
pm run test:ci)
- [ ] Frontend: MSW handlers mirror backend search + duplicate behavior
- [ ] Frontend: Contract verification passes (
pm run contract:check)
- [ ] Frontend: useDeleteBook adjusts page after deletion (last item, only item, with filters)
- [ ] Frontend: useBookFilters coordinates page adjustment with URL
- [ ] Frontend: Pagination metadata correct in all filter/delete scenarios
- [ ] Frontend: All component/hook/integration tests pass (
pm run test:run)
- [ ] Frontend: Lint + typecheck pass (
pm run lint, 
px tsc --noEmit)
- [ ] Manual verification: All acceptance criteria confirmed in browser
- [ ] Documentation updated if architectural patterns changed