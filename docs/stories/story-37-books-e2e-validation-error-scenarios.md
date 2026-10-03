# Story 37 — Books E2E: Validation & Error Scenarios

## Objective

Extend the Books E2E suite with negative and error-handling scenarios.

The goal of this Story is to verify that the Books experience behaves correctly when the user submits invalid data, attempts operations on resources that do not exist, encounters API errors, or reaches application states that require an explicit error or conflict response.

This Story builds on the Playwright infrastructure and successful critical flows implemented in Stories 33–36.

## Scope

### 1. Book creation validation

Add E2E coverage for invalid Create Book scenarios, including the validation rules that are actually enforced by the application.

Examples may include:

- Required fields left empty
- Invalid field values
- Invalid genre selection/value, if the UI allows such a state to be exercised
- Fields exceeding supported limits, if applicable
- Form submission with invalid data
- Correct display of validation feedback
- The book must not be created when validation fails

Tests should verify observable user behavior rather than implementation details.

### 2. Book editing validation

Add E2E coverage for invalid Edit Book scenarios.

Examples may include:

- Clearing required fields
- Providing invalid values
- Submitting an invalid form
- Correct display of validation feedback
- Existing valid book data must remain intact when the update fails

Use the existing Edit Book flow and validation behavior.

### 3. Resource not found

Add E2E coverage for attempting to access a Book that does not exist.

The test should verify the user-facing behavior when navigating to a valid Book Details route containing an unknown/nonexistent identifier.

Verify the expected:

- HTTP/API behavior
- UI error state
- User-readable message or fallback
- Navigation/recovery behavior, if provided by the application

The test must not rely on manually copying IDs from MongoDB.

The nonexistent identifier should be deterministic and intentionally invalid.

### 4. API error scenarios

Add E2E coverage for relevant API failures that can be reproduced deterministically.

Examples may include:

- Book creation API failure
- Book update API failure
- Book deletion API failure
- Book details API failure
- Books list API failure

The exact scenarios should be selected during planning based on the existing application architecture and Playwright/MSW capabilities.

Tests should verify that:

- The API failure is represented correctly
- The UI does not incorrectly report success
- The user receives an appropriate error state/message
- The application remains usable after the failure where applicable
- Data is not silently corrupted or lost

Do not introduce artificial production behavior solely to make tests possible unless the planning phase determines that a minimal application change is genuinely required.

### 5. Duplicate/conflict scenarios

Add E2E coverage for conflicts supported by the Books API.

The existing backend rejects duplicate Books based on the application's title + author uniqueness rule.

The E2E suite should verify the complete user-visible behavior when a user attempts to create a duplicate Book:

- Submit a Book that conflicts with an existing Book
- API returns the expected conflict response
- UI presents the appropriate error state/message
- User remains on an appropriate page/state
- No unintended duplicate Book is created

The test data strategy must make the conflict deterministic and independent.

### 6. Delete error scenarios

If the existing UI and architecture support deterministic simulation of a failed delete request, add E2E coverage for it.

Verify that:

- The delete request fails
- The UI does not report the Book as successfully deleted
- The user receives the appropriate error feedback
- The Book remains available

Do not redesign the Delete Book feature merely to create a test case.

### 7. Error recovery

Where the application provides explicit recovery behavior, verify that users can recover from an error.

Examples:

- Returning to the Books List
- Retrying an operation
- Correcting invalid form data and submitting again
- Navigating away from an error state
- Successfully completing an operation after a previous failed attempt

Only test recovery mechanisms that actually exist or are explicitly part of the approved design.

## Test Data Strategy

Follow the test-data architecture established in Story 36 and Story 34.

Tests must be:

- Deterministic
- Independent
- Repeatable
- Safe to run in any order
- Free from dependencies on data manually created in MongoDB
- Free from hardcoded production/staging IDs
- Free from assumptions about execution order

Do not introduce a large fixture/factory/data-management framework unless the planning phase demonstrates that the existing strategy is insufficient.

API failures should be simulated through the appropriate E2E testing mechanism rather than modifying the production API simply to return errors for tests.

## Selectors and Assertions

Follow the E2E testing architecture established in Story 34.

**Use:**

- User-facing selectors
- Accessible roles/names where appropriate
- Stable semantic selectors when necessary
- Assertions based on observable UI behavior

**Avoid:**

- CSS selectors tied to implementation details
- React internals
- Component implementation details
- Direct database assertions
- Arbitrary `waitForTimeout`
- Assertions against internal state that the user cannot observe

## Synchronization

Use Playwright's built-in waiting and assertion mechanisms.

Tests must not rely on arbitrary delays.

Network interception/mocking should be synchronized with the intended request/response lifecycle.

## Scope Boundaries

### In scope

- Books validation E2E scenarios
- Books API error E2E scenarios
- Book not-found scenarios
- Duplicate/conflict scenarios
- Delete failure scenarios where deterministically testable
- Error recovery where supported
- Supporting E2E helpers/fixtures only when necessary
- Minimal application changes only when genuinely required by the approved plan

### Out of scope

- Successful Books flows already covered by Story 36, except where they are required as setup or recovery
- Authentication and authorization
- Cross-browser execution
- Responsive/mobile-specific E2E coverage
- Visual regression testing
- Performance testing
- Accessibility audit
- CI integration
- Staging-specific validation
- E2E API/UI contract testing as a separate concern
- Large-scale E2E framework refactoring
- Unrelated application refactoring

## Acceptance Criteria

- Invalid Create Book scenarios are covered
- Invalid Edit Book scenarios are covered
- Nonexistent Book/resource behavior is covered
- Relevant API failure scenarios are covered
- Duplicate Book conflict behavior is covered
- Delete failure is covered when the existing architecture allows deterministic testing
- Relevant error recovery behavior is covered
- Tests are deterministic and independent
- Tests use the Story 34 E2E architecture
- Tests use the Story 36 test-data strategy
- Tests do not depend on manually created database records
- Tests do not use hardcoded database IDs
- Tests do not use arbitrary timeouts
- Assertions verify observable user behavior
- Existing Story 36 tests continue passing
- Existing frontend tests continue passing
- Existing backend tests continue passing
- Playwright tests remain maintainable and appropriately scoped
- No unnecessary application architecture changes are introduced

## Definition of Done

- All planned Story 37 E2E scenarios are implemented
- Negative and error scenarios are clearly separated from successful-flow tests
- Tests pass reliably in local execution
- Existing E2E infrastructure remains intact
- Story 36 critical-flow coverage remains intact
- Frontend unit/component/integration tests remain green
- Backend tests remain green
- Lint and build remain green where applicable
- No unrelated refactors are included
- Documentation is updated only where the new E2E architecture or conventions require it
- Implementation follows the approved Story 37 planning
- No commits, pushes, or Git history changes are performed by the AI agent

## Expected Outcome

At the end of Story 37, the Books E2E suite should cover not only successful user journeys but also the principal failure conditions users can encounter.

The resulting coverage should include a meaningful combination of:

- Validation failures
- Resource-not-found behavior
- API failures
- Conflict handling
- Delete failures where supported
- Error recovery

This establishes a more realistic E2E safety net before moving into authentication/authorization and broader application-level E2E coverage.
