# Story 36 — Books E2E: Critical User Flows

## Objective

Implement the first real Playwright E2E test suite for Literaria Nocturna.

The objective is to verify the critical Books user flows from the perspective of a real user, exercising the complete application across the frontend, backend, routing, API, and database.

The tests must validate observable user behavior rather than implementation details.

This story builds on:

- Story 33 — Playwright Test Infrastructure
- Story 34 — E2E Test Strategy & Architecture
- Story 35 — Books User Navigation & Management Flows

The application now provides a natural user-facing navigation flow from the Books List to Book Details, eliminating the previous need to manually obtain a book ID.

Story 36 should use that real application flow rather than bypassing the UI.

## Context

The current application provides the following Books functionality:

- Books List
- Search/filter/pagination functionality
- Navigation from Books List to Book Details
- Book Details
- Create Book
- Edit Book
- Delete Book
- Delete confirmation modal

The Playwright infrastructure was established in Story 33.

The E2E testing architecture and conventions were established in Story 34.

The user-facing Books navigation required for E2E was implemented in Story 35.

Story 36 is the first story that uses Playwright to validate real application behavior.

## Scope

### 1. Books List

Implement E2E coverage for the primary Books List flow.

The test should verify that a user can:

- Navigate to the Books section
- See the Books List
- Observe books displayed in the list
- Identify the relevant information for a book
- Interact with the list through the normal UI

The test should validate the user-visible result rather than internal API responses or React state.

Search, filtering, and pagination are not required to receive comprehensive coverage in this story unless they are necessary to establish the primary list flow.

### 2. Books List → Book Details

Implement E2E coverage for the navigation flow introduced in Story 35.

The test should:

- Start from Books List
- Select a book through the UI
- Navigate to Book Details
- Verify that the expected book information is displayed

The test must **not**:

- Obtain an ID from MongoDB
- Query MongoDB directly
- Hardcode a database ID
- Construct a details URL manually using a database ID
- Depend on a previously existing specific database record

The test must interact with the application as a user would.

### 3. Book Details

Verify the primary Book Details experience.

The test should verify that:

- The details page loads
- The selected book's information is displayed
- The book shown corresponds to the book selected from the Books List
- The user can return to the Books List if the application provides the corresponding navigation

Do not duplicate every frontend component assertion already covered by lower-level tests.

### 4. Create Book

Implement E2E coverage for the primary successful Create Book flow.

The test should:

- Navigate to the Create Book interface
- Enter valid deterministic data
- Submit the form
- Verify that the creation succeeds from the user's perspective
- Verify the resulting book can subsequently be located or viewed through the application

The test must not rely on an existing database record.

Test data must be controlled and deterministic according to the strategy established in Story 34.

### 5. Edit Book

Implement E2E coverage for the primary successful Edit Book flow.

The test should:

- Start from a book controlled by the test
- Navigate to the appropriate editing interface through the application
- Modify valid book information
- Save the changes
- Verify that the updated information is visible to the user

The test must not rely on a hardcoded database ID.

The test should obtain the target book through normal application behavior.

### 6. Delete Book

Implement E2E coverage for the primary successful Delete Book flow.

The test should:

- Identify a book controlled by the test
- Initiate deletion through the existing Books List trash action
- Interact with the existing confirmation modal
- Confirm deletion
- Verify that the book is no longer available through the relevant user-facing interface

The test must use the existing Delete Book UI.

Do not bypass the confirmation modal or call the API directly.

### 7. Critical Flow Coverage

The resulting suite should represent the critical Books user journeys without attempting exhaustive coverage.

The expected functional areas are:

- Books List
- List → Details navigation
- Book Details
- Create Book
- Edit Book
- Delete Book

The tests should focus on successful primary user journeys.

## Test Data Strategy

Follow the test-data principles established in Story 34.

Tests must **not** depend on:

- Arbitrary existing database records
- Hardcoded MongoDB IDs
- Manually created data
- Execution order
- Another test having created a record
- A specific seed record unless the approved test strategy explicitly defines it as deterministic and safe

Where a test needs a specific book, prefer creating or otherwise controlling that data through the established test-data strategy.

Test data must allow repeated test execution.

Avoid introducing a large test-data framework unless the existing architecture proves that it is necessary.

If Story 34's strategy is insufficient for the required isolation, stop and report the limitation before introducing significant new infrastructure.

## Test Independence

Every E2E test must be independently executable.

A test must not require another test to run first.

For example, avoid:

```text
Create Book test
→ Edit Book test depends on created book
→ Delete Book test depends on edited book
```

Instead, each test should establish the state it requires using the approved test-data strategy.

Shared fixtures/utilities may be used where appropriate, but shared mutable test state must be avoided.

## Selectors

Follow the selector strategy established in Story 34.

**Prefer:**

- Accessible roles
- Labels
- Stable user-facing text
- Existing stable attributes
- `data-testid` only when justified

**Avoid:**

- CSS implementation details
- Generated classes
- Positional selectors
- Fragile DOM traversal
- React internals
- MongoDB IDs

If a small number of additional stable selectors are genuinely necessary, they may be introduced following the conventions established in Story 34.

Do not add test hooks unnecessarily.

## Assertions

Assertions must focus on observable application behavior.

**Examples include:**

- The Books List is visible
- A book appears in the list
- The Book Details page is displayed
- The expected book information is visible
- A success state is displayed
- Updated information is visible
- A deleted book is no longer visible

**Avoid assertions about:**

- React state
- Hook internals
- Axios implementation
- TanStack Query internals
- Internal component structure
- Implementation-specific API calls unless required for a specific E2E contract

## Synchronization

Use Playwright's built-in auto-waiting and web-first assertions.

Do **not** use arbitrary delays such as `waitForTimeout` to synchronize application behavior.

Wait for meaningful application conditions such as:

- Elements becoming visible
- Navigation completing
- Expected content appearing
- The resulting UI state becoming available

## Fixtures and Reusability

Use the fixture and helper conventions established in Story 34.

Extract reusable functionality only when there is meaningful duplication.

Avoid building a large abstraction layer for a relatively small initial suite.

Helpers should make tests easier to understand, not hide the actual user journey.

A test should remain understandable by reading it from top to bottom.

## Test Organization

Place the tests under the existing root `e2e/` structure established in Story 33 and following the conventions documented in Story 34.

The organization should allow future stories to add:

- Validation/error scenarios
- Additional Books scenarios
- API/UI contract scenarios
- Cross-browser coverage

Do not reorganize the entire E2E structure unless the current implementation makes it necessary.

## Application Changes

Application changes should generally **NOT** be required because Story 35 was specifically created to establish the missing user-facing Books navigation.

However, if a minimal application adjustment is genuinely necessary to make the E2E flow testable through the real UI, it may be considered.

Any such change must:

- Be directly related to a critical flow in this story
- Follow the existing architecture
- Be minimal
- Include appropriate lower-level tests
- Not become an unrelated feature or refactor

Do not modify application behavior merely to make Playwright easier to use.

## Scope Constraints

This story does **not** include:

- Validation scenarios
- Error scenarios
- API failure scenarios
- Authentication/authorization
- New authentication functionality
- Firefox
- WebKit
- Cross-browser testing
- Responsive testing
- Visual regression testing
- Performance testing
- Full accessibility testing
- CI integration
- Staging E2E execution
- Complex E2E database infrastructure
- Large test-data factory systems
- New product features unrelated to Books critical flows
- General frontend/backend refactoring
- Exhaustive Books coverage

Validation and error scenarios belong to the following E2E story.

## Existing Test Protection

The implementation must preserve:

- Story 33 Playwright smoke test
- Existing frontend tests
- Existing backend tests
- Existing application behavior

Run the relevant existing checks after implementation.

## Acceptance Criteria

### AC1 — Books List E2E

A Playwright test verifies that the Books List loads and displays books through the real application.

### AC2 — List to Details E2E

A Playwright test selects a book from Books List and navigates to its Book Details page through the real UI.

### AC3 — Correct Book Details

The test verifies that the Book Details page corresponds to the book selected from Books List.

### AC4 — Details Return Navigation

The critical navigation flow verifies that the user can return from Book Details to Books List when that behavior is part of the application flow.

### AC5 — Create Book E2E

A Playwright test creates a controlled book through the UI and verifies the successful result.

### AC6 — Edit Book E2E

A Playwright test modifies a controlled book through the UI and verifies the updated information.

### AC7 — Delete Book E2E

A Playwright test deletes a controlled book through the existing UI and confirmation modal and verifies the resulting state.

### AC8 — No Manual IDs

No test depends on manually obtained MongoDB IDs or hardcoded database IDs.

### AC9 — Test Independence

Each test can run independently without relying on another test's execution or mutable state.

### AC10 — User-Centric Selectors

Tests follow the selector strategy defined in Story 34.

### AC11 — User-Centric Assertions

Assertions validate observable application behavior rather than implementation details.

### AC12 — Stable Synchronization

Tests use Playwright's waiting mechanisms and do not rely on arbitrary timing delays.

### AC13 — Controlled Test Data

Tests use deterministic, controlled test data according to the established E2E strategy.

### AC14 — Existing Infrastructure

The Story 33 Playwright smoke test continues to pass.

### AC15 — Existing Tests

Existing frontend and backend test suites continue to pass.

### AC16 — No Scope Creep

No validation/error scenarios or future E2E concerns are implemented.

## Definition of Done

- Playwright covers the primary Books List flow
- Playwright covers List → Book Details navigation
- Playwright verifies the selected book's details
- Playwright covers the primary Create Book flow
- Playwright covers the primary Edit Book flow
- Playwright covers the primary Delete Book flow
- Delete confirmation is exercised through the real UI
- Tests do not use manually obtained IDs
- Tests do not directly query MongoDB
- Tests do not call APIs instead of exercising the UI
- Tests are independently executable
- Selectors follow Story 34 conventions
- Assertions are user-centric
- Synchronization uses Playwright's built-in mechanisms
- Test data is deterministic and controlled
- Story 33 smoke test remains functional
- Existing frontend and backend tests remain functional
- No validation/error scenarios are introduced
- No CI/staging/cross-browser work is introduced
- The resulting suite provides the foundation for the next E2E stories

## Expected Outcome

At the end of Story 36, Literaria Nocturna will have its first meaningful Playwright E2E suite covering the primary Books user journeys:

```text
Books List
→ select book
→ Book Details
→ return to Books List
```

and the primary management operations:

```text
Create Book
→ Edit Book
→ Delete Book
```

The tests will interact with the application as a real user would, use controlled test data, avoid database IDs and implementation details, and establish the practical conventions that future E2E stories can build upon.
