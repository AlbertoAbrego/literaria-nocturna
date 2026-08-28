# Story 24 — API Contract, Validation & Swagger Hardening

## Implementation Plan

### Overview

Strengthen the API contract by implementing runtime DTO validation, eliminating genre definition duplication across layers, hardening Swagger documentation, and adding comprehensive contract verification tests. This story addresses audit findings H-03, H-04, and M-08.

- **Why this exists:** The current validation is split between controllers (partial) and Mongoose (persistence layer), causing inconsistent error formats and allowing invalid data to reach the database. Genre definitions are duplicated in three places (Mongoose model, Swagger config, frontend types), creating drift risk. Swagger documentation has gaps in error response coverage and endpoint verification.
- **Out of Scope:**
  - Members/Readings modules (future stories)
  - Frontend UI changes (no visual changes required)
  - Backend validation library selection (use pure TS functions per existing conventions)
  - Database migrations

---

## Phases

### Phase 1 – Foundation: Shared Genre Contract & Types

**Goal:** Establish a single source of truth for Genre enum shared across backend, Swagger, and frontend. Create the validation function infrastructure.

#### Tasks

1. Create shared Genre constant in backend (`backend/src/constants/genres.ts`):
   - Export `GENRES` array and `Genre` type
   - Replace inline enum in `book.model.ts` and `swagger.ts`
   - Update DTOs to import from constants
2. Create shared validation utilities in backend (`backend/src/utils/validation.ts`):
   - `validateGenre(genre: string): boolean`
   - `validatePage(page: unknown): ValidationResult`
   - `validateLimit(limit: unknown): ValidationResult`
   - `validateRequiredBody(body: unknown): ValidationResult`
   - `validateObjectId(id: string): boolean`
   - Mirror frontend contract validators exactly
3. Update backend DTOs to use shared Genre type:
   - `create-book.dto.ts`, `update-book.dto.ts`, `book-query.dto.ts`
4. Update frontend Genre definition (`frontend/src/features/books/types/book.types.ts`):
   - Import `Genre` from generated contract types (`@/test/contract/openapi-types`)
   - Remove local `GENRES` array definition
   - Keep `SearchFilters` using `Genre | ""` for UI convenience
5. Update frontend contract validators (`frontend/src/test/contract/validators.ts`):
   - Import `Genre` from `@/test/contract/openapi-types`
   - Ensure validators match backend implementation exactly

#### Files

- **Backend (new):**
  - `backend/src/constants/genres.ts`
  - `backend/src/utils/validation.ts`
- **Backend (modified):**
  - `backend/src/models/book.model.ts`
  - `backend/src/config/swagger.ts`
  - `backend/src/dto/book/create-book.dto.ts`
  - `backend/src/dto/book/update-book.dto.ts`
  - `backend/src/dto/book/book-query.dto.ts`
  - `backend/src/controllers/book.controller.ts`
- **Frontend (modified):**
  - `frontend/src/features/books/types/book.types.ts`
  - `frontend/src/test/contract/validators.ts`

#### Deliverables

- Single Genre definition used by Mongoose, Swagger, and frontend
- Shared validation functions used by both controllers and MSW handlers
- `npm run contract:extract` generates consistent types
- All existing tests pass

---

### Phase 2 – Core Implementation: Runtime DTO Validation

**Goal:** Implement runtime validation for `CreateBookDto`, `UpdateBookDto`, and `BookQueryDto` in controllers before service layer, producing standardized error format with details field.

#### Tasks

1. Create validation functions in backend (`backend/src/utils/dto-validation.ts`):
   - `validateCreateBookDto(body: unknown): ValidationResultWithDetails`
   - `validateUpdateBookDto(body: unknown): ValidationResultWithDetails`
   - `validateBookQueryDto(query: unknown): ValidationResultWithDetails`
   - Return `{ valid: boolean; details?: Record<string, string> }`
   - Use shared validators from `backend/src/utils/validation.ts`
   - Produce field-level error messages matching Mongoose format
2. Integrate validation in controllers (`backend/src/controllers/book.controller.ts`):
   - `createBook`: Call `validateCreateBookDto(req.body)` before service
   - `getAllBooks`: Call `validateBookQueryDto(req.query)` before service
   - `updateBook`: Call `validateUpdateBookDto(req.body)` before service
   - Return 400 with `{ message: "Validation failed", code: "VALIDATION_ERROR", details }` on failure
3. Update Swagger error response examples (`backend/src/config/swagger.ts`):
   - Ensure `ValidationError` example shows details object
   - Document 400 responses for all endpoints with validation
4. Update MSW handlers (`frontend/src/test/handlers/books.ts`):
   - Import and use backend-mirrored validation logic
   - Ensure field-level details in validation errors
   - Match error messages exactly via `ERROR_MESSAGES`

#### Files

- **Backend (new):**
  - `backend/src/utils/dto-validation.ts`
- **Backend (modified):**
  - `backend/src/controllers/book.controller.ts`
  - `backend/src/config/swagger.ts`
- **Frontend (modified):**
  - `frontend/src/test/handlers/books.ts`
  - `frontend/src/test/contract/error-messages.ts` (if new messages added)

#### Deliverables

- Invalid requests rejected at controller layer with standardized format
- Field-level details in all validation error responses
- Mongoose validation remains as second layer (defense in depth)
- MSW handlers produce identical validation behavior
- All existing backend and frontend tests pass

---

### Phase 3 – Swagger Hardening & Contract Verification

**Goal:** Strengthen Swagger specification accuracy and implement automated contract verification that fails on drift.

#### Tasks

1. Enhance Swagger schemas (`backend/src/config/swagger.ts`):
   - Reference shared Genre enum from constants (not hardcoded)
   - Mark all required fields in `CreateBookDto`, `Book` schemas
   - Add 204 response with description: `"No Content"` and no body for `DELETE`
   - Add 400 `ValidationError` response to all endpoints
   - Add 404 `NotFoundError` to `GET`/`PATCH`/`DELETE` `/books/{id}`
   - Add 409 `ConflictError` to `POST`/`PATCH` `/books`
   - Verify `PaginatedResponse` schema matches actual response shape
2. Add Swagger contract tests (backend):
   - `backend/src/test/integration/swagger-contract.integration.test.ts`
   - Verify all endpoints documented in spec
   - Verify response schemas match actual responses
   - Verify error response codes documented for each endpoint
   - Verify Genre enum in spec matches constants
3. Enhance frontend contract verification (`frontend/src/test/contract/`):
   - Run `npm run contract:extract` after backend Swagger changes
   - Update `msw-contract.test.ts` for new validation scenarios
   - Add tests for field-level details in validation errors
   - Verify all OpenAPI endpoints have MSW handlers
4. CI Integration:
   - Ensure `npm run contract:check` runs in frontend CI
   - Add backend Swagger verification to backend CI if not present

#### Files

- **Backend (new):**
  - `backend/src/test/integration/swagger-contract.integration.test.ts`
- **Backend (modified):**
  - `backend/src/config/swagger.ts`
- **Frontend (modified):**
  - `frontend/src/test/contract/msw-contract.test.ts`
  - Auto-generated: `frontend/src/test/contract/openapi-types.ts`, `endpoints.ts`

#### Deliverables

- Swagger spec accurately represents all endpoints, schemas, and error responses
- Automated verification detects contract drift in CI
- Frontend MSW handlers verified against OpenAPI spec
- `npm run contract:check` passes in CI

---

### Phase 4 – Comprehensive Testing

**Goal:** Add integration tests covering all validation scenarios, Swagger parity, and edge cases.

#### Tasks

1. Backend validation tests (new test files):
   - `backend/src/test/integration/books.validation.integration.test.ts`
   - Invalid `CreateBookDto` (missing fields, invalid genre, empty body)
   - Invalid `UpdateBookDto` (empty body, invalid genre)
   - Invalid `BookQueryDto` (invalid genre, page, limit)
   - Field-level details assertions
   - Update existing create/list/update/delete tests for new error format
2. Backend Swagger parity tests:
   - Verify `swagger.json` matches runtime behavior
   - Test 204 No Content response body is empty
3. Frontend contract tests (extend existing):
   - `frontend/src/test/contract/msw-contract.test.ts`
   - Add tests for field-level details in validation errors
   - Test all new validation error scenarios
   - Verify 204 delete response handling
4. Frontend hook/component tests:
   - Verify `useCreateBook`, `useUpdateBook`, `useBooks` handle new error format
   - Verify `ErrorAlert` displays field-level details if applicable

#### Files

- **Backend (new):**
  - `backend/src/test/integration/books.validation.integration.test.ts`
- **Backend (modified):**
  - Existing integration test files (update assertions for new error format)
- **Frontend (modified):**
  - `frontend/src/test/contract/msw-contract.test.ts`
  - Hook tests: `useCreateBook.test.ts`, `useUpdateBook.test.ts`, `useBooks.test.ts`

#### Deliverables

- All validation scenarios covered by integration tests
- Swagger parity verified
- Frontend tests pass with new error format
- Full test suite passes in CI

---

### Final Phase – Verification & Polish

**Goal:** Ensure code quality, documentation consistency, and all acceptance criteria met.

#### Tasks

1. Code Quality Checks:
   - Backend: `npm run lint`, `npx tsc --noEmit`, `npm run test:ci`
   - Frontend: `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run contract:check`
2. Manual Verification:
   - Start backend, verify Swagger UI at `/api/docs`
   - Test all endpoints with invalid inputs via Swagger UI
   - Start frontend, verify book CRUD operations work
   - Test validation error display in UI
3. Documentation Updates:
   - Update `docs/frontend-context.md` if API client patterns change
   - Update `docs/frontend-testing.md` if contract verification workflow changes
   - Update `docs/project-context.md` with new validation conventions
4. Cleanup:
   - Remove any temporary test overrides
   - Ensure no `console.log` statements remain
   - Verify all TODO comments addressed

#### Files

- **Modified (potential):**
  - `docs/frontend-context.md`
  - `docs/frontend-testing.md`
  - `docs/project-context.md`

#### Deliverables

- All lint, typecheck, and test commands pass
- Swagger UI accurately documents API
- Frontend integrates seamlessly with validated backend
- Documentation reflects new conventions

---

## Testing Scope

### Component Tests

| Component      | Test Focus                                      | File                  |
| :------------- | :---------------------------------------------- | :-------------------- |
| **BookForm**   | Form validation display, field-level errors     | `BookForm.test.tsx`   |
| **FilterBar**  | Query param validation, genre filter            | `FilterBar.test.tsx`  |
| **ErrorAlert** | Display of details field from validation errors | `ErrorAlert.test.tsx` |

### Hook / Service Tests

| Hook               | Test Focus                                                 | File                      |
| :----------------- | :--------------------------------------------------------- | :------------------------ |
| **useCreateBook**  | Mutation with invalid DTO $\rightarrow$ field-level errors | `useCreateBook.test.ts`   |
| **useUpdateBook**  | Mutation with invalid DTO $\rightarrow$ field-level errors | `useUpdateBook.test.ts`   |
| **useBooks**       | Query with invalid params $\rightarrow$ validation error   | `useBooks.test.ts`        |
| **useBookFilters** | URL sync with invalid params                               | `useBookFilters.test.tsx` |

### Integration Tests

| Scenario                  | Test Focus                                                                               | File                      |
| :------------------------ | :--------------------------------------------------------------------------------------- | :------------------------ |
| **BooksPage full flow**   | Filter $\rightarrow$ validation error $\rightarrow$ recovery                             | `BooksPage.test.tsx`      |
| **CreateBookPage**        | Submit invalid form $\rightarrow$ field errors $\rightarrow$ fix $\rightarrow$ success   | `CreateBookPage.test.tsx` |
| **EditBookPage**          | Submit invalid update $\rightarrow$ field errors $\rightarrow$ fix $\rightarrow$ success | `EditBookPage.test.tsx`   |
| **Contract verification** | All OpenAPI endpoints have MSW handlers                                                  | `msw-contract.test.ts`    |

---

## File Structure

```text
backend/
├── src/
│   ├── constants/
│   │   └── genres.ts                           # NEW: Single Genre source
│   ├── utils/
│   │   ├── validation.ts                       # NEW: Shared validators
│   │   └── dto-validation.ts                   # NEW: DTO validation fns
│   ├── models/
│   │   └── book.model.ts                       # MODIFIED: Import Genre from constants
│   ├── dto/book/
│   │   ├── create-book.dto.ts                  # MODIFIED: Import Genre from constants
│   │   ├── update-book.dto.ts                  # MODIFIED: Import Genre from constants
│   │   └── book-query.dto.ts                   # MODIFIED: Import Genre from constants
│   ├── controllers/
│   │   └── book.controller.ts                  # MODIFIED: Runtime DTO validation
│   ├── config/
│   │   └── swagger.ts                          # MODIFIED: Reference constants, full error responses
│   └── test/integration/
│       ├── swagger-contract.integration.test.ts # NEW
│       ├── books.validation.integration.test.ts # NEW
│       └── *.integration.test.ts               # MODIFIED: Updated assertions

frontend/
├── src/
│   ├── features/books/
│   │   ├── types/
│   │   │   └── book.types.ts                   # MODIFIED: Import Genre from contract
│   │   ├── hooks/
│   │   │   ├── useCreateBook.test.ts           # MODIFIED: New error format
│   │   │   ├── useUpdateBook.test.ts           # MODIFIED: New error format
│   │   │   └── useBooks.test.ts                # MODIFIED: New error format
│   │   └── components/
│   │       ├── BookForm.test.tsx               # MODIFIED: Field-level errors
│   │       └── FilterBar.test.tsx              # MODIFIED: Query validation
│   ├── test/
│   │   ├── contract/
│   │   │   ├── validators.ts                   # MODIFIED: Import Genre from openapi-types
│   │   │   ├── msw-contract.test.ts            # MODIFIED: Extended validation tests
│   │   │   ├── openapi-types.ts                # AUTO-GENERATED
│   │   │   └── endpoints.ts                    # AUTO-GENERATED
│   │   └── handlers/
│   │       └── books.ts                        # MODIFIED: Mirror backend validation

## Implementation Sequence

### Recommended Commit Order
1. `feat: add shared genre constants and validation utilities (backend)`
2. `feat: implement runtime DTO validation in controllers (backend)`
3. `feat: harden Swagger spec with full error responses (backend)`
4. `test: add validation and Swagger contract tests (backend)`
5. `feat: sync frontend Genre type with contract (frontend)`
6. `feat: update MSW handlers for new validation behavior (frontend)`
7. `test: extend contract verification and frontend tests (frontend)`
8. `chore: run contract:extract, update docs, verify CI`

---

## Design System Compliance

This story involves no new UI components or visual changes. Existing components must continue to comply with:

* **Colors:** Use design tokens (`bg-charcoal`, `text-parchment`, `border-graphite`, `focus-antique-gold`)
* **Typography:** Cormorant Garamond (headings), Inter (body/forms)
* **Spacing:** 4px base unit (`xs=4`, `sm=8`, `md=16`, `lg=24`, `xl=32`)
* **Border Radius:** Buttons/Inputs 10px, Cards/Tables 12px, Modals 16px
* **Shadows:** Soft layered, low opacity, wide blur
* **Motion:** 150-300ms, ease-out/ease-in-out, subtle hover/focus
* **Accessibility:** `aria-label` on pagination, `aria-current="page"`, focus management, semantic HTML

> **Note:** Error display uses existing `ErrorAlert` with error token (`#A35A5A`). No hardcoded colors/spacing allowed.

---

## Dependencies

| Category | Dependency |
| :--- | :--- |
| **Backend Endpoints** | `POST /api/books` (201/400/409), `GET /api/books` (200/400), `GET /api/books/:id` (200/400/404), `PATCH /api/books/:id` (200/400/404/409), `DELETE /api/books/:id` (204/400/404) |
| **Frontend Infrastructure** | TanStack Query v5, Axios HTTP client, MSW v2, Vitest + RTL |
| **Shared Components** | Button, Input, Select, Table, Pagination, ErrorAlert, Modal, Skeleton |
| **Testing Infrastructure** | `renderWithProviders`, `createTestQueryClient`, `book.factory.ts`, contract test helpers |
| **Design System Dependencies** | Tailwind CSS v4 with `@theme` tokens in `src/index.css` |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| :--- | :---: | :---: | :--- |
| **Genre enum drift between backend/frontend** | High | High | Single source in backend constants; frontend imports from generated `openapi-types.ts`; `contract:verify` fails on mismatch. |
| **Validation error format breaking frontend** | Medium | High | MSW handlers mirror backend exactly; contract tests verify error shape; `details` field is optional in frontend types. |
| **Swagger spec not matching runtime** | Medium | High | Swagger contract tests in backend CI; `contract:check` in frontend CI. |
| **Mongoose validation vs runtime validation conflict** | Low | Medium | Runtime validation first (controller), Mongoose second (service); both produce same error format via global middleware. |
| **204 No Content breaking frontend axios** | Low | Medium | `deleteBook` API returns `void`; axios handles 204 correctly; MSW returns null body. |
| **Contract extraction failing after Swagger changes** | Medium | Medium | Run `contract:extract` immediately after backend Swagger changes; commit generated files. |
| **Test flakiness from validation timing** | Low | Low | Use `createTestQueryClient({ retry: false })`; MSW handlers are synchronous. |

---

## Acceptance Criteria Mapping

| Acceptance Criterion | Phase Implemented |
| :--- | :--- |
| Invalid requests rejected before persistence when appropriate | Phase 2 |
| Validation errors follow standard API contract (`message`, `code`, `details`) | Phase 2 |
| Genre definitions cannot silently diverge between layers | Phase 1 |
| Swagger accurately represents the API | Phase 3 |
| Swagger verification detects incompatible contract changes | Phase 3 |
| Backend and frontend tests continue to pass | Phase 4 + Final |

---

## Definition of Done

* **Backend:** `npm run lint` passes
* **Backend:** `npx tsc --noEmit` passes
* **Backend:** `npm run test:ci` passes (all integration tests)
* **Frontend:** `npm run lint` passes
* **Frontend:** `npm run typecheck` passes
* **Frontend:** `npm run test:run` passes (all Vitest tests)
* **Frontend:** `npm run contract:check` passes (extract + verify)
* **Swagger UI:** `/api/docs` loads and shows all endpoints with correct schemas
* **Error format:** All endpoints return standardized error format with `details` on validation failure
* **Genre Enum:** Defined in backend constants, used by Mongoose, Swagger, and frontend
* **Clean Spec:** No hardcoded genre arrays in Swagger config or frontend types; 204 No Content responses have no body
* **Polish:** Documentation updated, no `console.log` or debug code remaining, atomic reviewable commits

---

## Architectural Constraints Enforced

* **Feature-based architecture:** All changes scoped to books feature or shared infrastructure.
* **Data flow:** Page $\rightarrow$ Feature Component $\rightarrow$ Hook $\rightarrow$ API $\rightarrow$ HTTP Client. No Axios in components; validation logic in API/hook layer.
* **TanStack Query:** Server state management without manual loading/error flags.
* **Shared UI:** Consistent styling using `ErrorAlert`, `Input`, `Select`, `Pagination`.
* **Design tokens:** No hardcoded colors in any modified files.
* **Component limits:** Modified components remain under 150 lines.
```
