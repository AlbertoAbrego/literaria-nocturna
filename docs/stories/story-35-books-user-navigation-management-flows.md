# Story 35 — Books User Navigation & Management Flows

## Objective

Improve the Books user experience by enabling users to navigate from the Books List to the details page of a specific book through a natural UI interaction.

The goal is to eliminate the current dependency on manually obtaining a book ID in order to access Book Details and establish a complete user-facing navigation flow that can later be covered by E2E tests.

This story focuses on the missing Books navigation functionality only. Existing book management functionality must remain unchanged.

## Current Context

The Books area currently provides:

- Books List
- Book Details page
- Create Book
- Edit Book
- Delete Book directly from the Books List
- Delete confirmation modal

However, the Books List does not currently provide a user-facing way to navigate to the details page of a specific book.

At the moment, accessing Book Details requires manually obtaining the book ID, for example by retrieving it from MongoDB Atlas and using it in the URL.

This is not an acceptable user flow and would also make future E2E tests dependent on implementation details.

## Desired User Flow

The intended flow is:

```text
Books List
→ select a book
→ Book Details
→ return to Books List
```

The user must be able to select a specific book directly from the Books List without knowing or manually entering its database ID.

## Scope

### 1. Books List → Book Details Navigation

Add a clear user-facing interaction that allows the user to navigate from a book displayed in the Books List to its corresponding Book Details page.

The interaction should:

- Be clearly associated with the specific book
- Use the existing book identifier internally
- Navigate to the correct Book Details route
- Not expose the database ID as something the user needs to provide
- Work for any book displayed in the list
- Follow the existing UI/design conventions of the application

The exact UI mechanism should be determined after inspecting the current implementation.

Possible approaches include, but are not limited to:

- A "View Details" action
- Making the book title clickable
- An action in the existing table actions column

Do **not** assume one approach before reviewing the existing UI.

### 2. Book Details → Books List Navigation

Provide a clear way for the user to return to the Books List from Book Details if one does not already exist.

The navigation should use the application's existing routing conventions.

If an appropriate return mechanism already exists, do not replace or unnecessarily modify it.

### 3. Existing Book Management Flows

The following functionality already exists and is explicitly outside the implementation scope of this story:

- Create Book
- Edit Book
- Delete Book
- Delete confirmation modal

These flows should remain functional after the changes.

In particular, Delete Book must continue to operate from the Books List through its existing trash icon and confirmation modal.

## Routing

The implementation must use the existing React Router architecture.

Do not introduce a second routing mechanism or bypass the existing route structure.

The selected book's existing identifier should be used internally to resolve the correct Book Details page.

The user must not need to manually know or enter that identifier.

## UI/UX Requirements

The new navigation should:

- Be understandable without additional instructions
- Be visually consistent with the existing Books table/actions
- Clearly indicate what action will occur
- Avoid introducing unnecessary UI elements
- Preserve the existing Books List layout and actions
- Preserve the existing Delete action and confirmation modal

Do **not** redesign the Books List as part of this story.

## Data and State

The implementation should use the book data already available to the Books List.

Do not introduce:

- New database queries solely to obtain IDs
- New backend endpoints
- New database fields
- A new state-management mechanism
- A separate book-selection system

The existing book identifier should be passed through the existing routing mechanism.

## Testing

Add or update tests at the appropriate existing frontend testing layer to verify the new navigation behavior.

At minimum, verify that:

- A book displayed in the Books List exposes the new navigation interaction
- Activating that interaction navigates to the corresponding Book Details route
- The correct book information is displayed after navigation, where this can be appropriately verified at the existing frontend test layer
- Navigation back to Books List works if a new back/list interaction is introduced

Tests should follow the testing conventions established in previous stories.

Do **not** introduce Playwright E2E tests in this story.

E2E coverage belongs to the following story.

## Regression Verification

The existing Books functionality must remain intact.

Verify at minimum that:

- Books List still loads correctly
- Delete Book still works from the existing trash action
- Delete confirmation modal still works
- Create Book remains functional
- Edit Book remains functional
- Existing Book Details behavior remains functional
- Existing frontend tests remain passing
- Existing backend tests remain passing
- Lint/build remain passing according to the repository's established checks

## Scope Constraints

This story does **not** include:

- Playwright E2E tests
- E2E infrastructure
- E2E test data infrastructure
- Validation/error scenarios
- New Books functionality unrelated to navigation
- Redesign of Books List
- Redesign of Book Details
- Changes to Delete Book
- Changes to Create Book
- Changes to Edit Book unless a minimal routing adjustment is strictly required for the new navigation flow
- Backend API changes unless the existing implementation unexpectedly makes them strictly necessary
- Database schema changes
- Authentication/authorization
- Responsive redesign
- Accessibility audit
- Performance improvements
- Unrelated refactoring

## Acceptance Criteria

### AC1 — Book Selection

A user can identify and select a specific book from the Books List through a clear UI interaction.

### AC2 — Details Navigation

Selecting a book from the Books List navigates to the corresponding Book Details page.

### AC3 — No Manual ID Required

The user does not need to know, copy, or manually enter the book's database ID to access its details.

### AC4 — Correct Book

The Book Details page displays the book selected from the Books List.

### AC5 — Return Navigation

The user has a clear way to return from Book Details to Books List.

### AC6 — Delete Regression

The existing Delete Book action remains available from Books List and continues to use its existing confirmation modal.

### AC7 — Existing Functionality

Create Book, Edit Book, Delete Book, Books List, and Book Details continue to function without regressions.

### AC8 — Frontend Tests

Appropriate frontend tests cover the new navigation behavior.

### AC9 — Existing Checks

Existing frontend and backend tests, linting, and builds remain passing.

### AC10 — No E2E

No Playwright E2E tests are introduced as part of this story.

## Definition of Done

- Users can navigate from Books List to a specific Book Details page
- Users do not need to manually obtain a book ID
- Users can return from Book Details to Books List
- The existing Delete Book flow remains unchanged and functional
- Existing Create/Edit/Delete functionality remains functional
- Appropriate frontend tests cover the new behavior
- Existing project checks pass
- No backend or database changes were introduced unless proven necessary
- No Playwright tests were introduced
- No unrelated refactoring or UI redesign was performed
- The implementation is ready to become the subject of Story 36's E2E critical-flow coverage

## Expected Outcome

The Books section now supports a natural user flow:

```text
Books List → select book → Book Details → return to Books List
```

Book IDs remain an internal implementation detail rather than something the user must manually obtain.

Existing management operations, including the current Delete action and confirmation modal, remain unchanged.
