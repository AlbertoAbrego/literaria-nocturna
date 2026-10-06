# Story 38 — E2E Test Data & Environment Management
## Objective
Establish a reliable, deterministic, and maintainable strategy for preparing, controlling, and cleaning E2E test data across local development and staging environments.

The goal is to resolve the test-data problem identified during Stories 36 and 37 without introducing unnecessary complexity.

The E2E suite must be reproducible regardless of whether it is executed:

- Locally by a developer.
- In CI against a controlled environment.
- Against the staging environment.

This Story focuses on test-data and environment management rather than adding new functional E2E coverage.

## Context
Stories 33–37 established the Playwright infrastructure and the first meaningful Books E2E coverage.

During those Stories, the suite required different types of data:

- Books created through the UI.
- Books required as prerequisites for other flows.
- Data required for duplicate/conflict scenarios.
- Data required for edit/delete scenarios.
- Intentionally nonexistent identifiers.
- Data required when API responses are mocked.
- Cleanup after successful or failed tests.

The current strategy should now be reviewed as a complete system.

The objective is not to assume that the existing approach is wrong, but to determine whether it remains appropriate as the E2E suite grows.

## Scope
### 1. Define E2E test-data strategy

Establish a clear strategy for:

- Creating test data.
- Identifying test-owned data.
- Reusing data where appropriate.
- Isolating tests from each other.
- Cleaning up data.
- Handling failed/interrupted tests.
- Preventing stale data from affecting later executions.
- Supporting local and staging execution.

The strategy should distinguish between:

- Data created through the UI as part of a user journey.
- Data created as test setup.
- Data used only by mocked/intercepted scenarios.
- Data that should never be shared between tests.
- Data that can safely be reused.

### 2. Test data ownership

Define how the E2E suite identifies data that belongs to a particular test or test run.

The solution should make it possible to determine:

- Which records were created by E2E tests.
- Which records are safe to delete.
- Which records must never be deleted.
- How parallel test execution can avoid collisions.

The strategy must protect real/staging data from accidental deletion.

### 3. Test data preparation

Define how prerequisite data should be prepared.

Possible mechanisms may include:

- UI creation.
- API setup.
- Dedicated test-data endpoints.
- Database-level setup.
- Seed scripts.
- Fixtures.
- Other mechanisms already available in the project.

The chosen mechanism must be evaluated against:

- Reliability.
- Speed.
- Isolation.
- Maintainability.
- Environment compatibility.
- Security.
- Complexity.

Do not introduce a mechanism merely because it is technically possible.

### 4. Test data cleanup

Define a reliable cleanup strategy.

Cleanup must account for:

- Tests that pass.
- Tests that fail.
- Tests that are interrupted.
- Partial setup.
- Parallel execution.
- Repeated executions.
- Stale data from previous runs.

The strategy must avoid deleting records that do not belong to the E2E test suite.

### 5. Local environment

Define how E2E tests should operate locally.

The strategy should document:

- Required environment variables.
- Required services.
- Database expectations.
- Test-data initialization.
- Cleanup behavior.
- How a developer starts the application.
- How Playwright connects to the application.
- How test data is isolated from normal development data.

The local workflow should be reproducible by another developer without manually manipulating MongoDB.

### 6. Staging environment

Define how E2E tests should operate against staging.

The strategy must account for:

- Staging's shared nature.
- Existing application data.
- Potential concurrent users/developers.
- Parallel E2E runs.
- Test-data collisions.
- Cleanup safety.
- Environment-specific configuration.
- Secrets and credentials.
- Avoiding destructive operations against non-test data.

The strategy must not assume staging is an empty database.

### 7. Environment configuration

Define the configuration required to distinguish local E2E execution from staging E2E execution.

Determine appropriate configuration for things such as:

- Base URL.
- API URL.
- Database/test-data configuration.
- Environment identifier.
- Test-run identifier.
- Optional cleanup behavior.
- Authentication state if it becomes relevant later.

Configuration should use environment variables or existing project configuration conventions rather than hardcoded environment-specific values.

### 8. Test run identification

Evaluate whether E2E runs require a unique identifier.

A test-run identifier may be useful for:

- Test data ownership.
- Parallel execution.
- Cleanup.
- Debugging.
- Identifying stale records.

If a run identifier is introduced, define:

- Where it is generated.
- How it is propagated to tests.
- How it is attached to test data.
- How cleanup uses it.
- How local and CI/staging runs differ.

Do not introduce a run ID if the chosen architecture does not actually need one.

### 9. Parallel execution

The strategy must consider future parallel execution.

Tests should not assume:

- A single global database state.
- Sequential execution.
- Fixed record names.
- Shared mutable test records.

If full parallel execution is not yet enabled, the design should still avoid making it unnecessarily difficult later.

### 10. Existing Story 36–37 test data

Review the test-data patterns introduced in:

- Story 36 — Books E2E: Critical User Flows.
- Story 37 — Books E2E: Validation & Error Scenarios.

Determine:

- What works well.
- What is duplicated.
- What is fragile.
- What is difficult to clean up.
- What will become problematic as the suite grows.

Refactor existing tests only where necessary to adopt the approved Story 38 strategy.

Do not rewrite tests merely for stylistic consistency.

### 11. Test-data utilities

If the review determines that shared utilities are justified, establish only the minimum required abstraction.

Potential utilities could include:

- Test data builders.
- Test book creation.
- Test book cleanup.
- Run-scoped identifiers.
- Environment detection.
- API setup helpers.
- Cleanup helpers.

Avoid creating a generic framework for every possible future entity.

Books are currently the main E2E domain.

### 12. Safety mechanisms

The test-data strategy must include safeguards against destructive mistakes.

Examples may include:

- Explicit test environment identification.
- Test-data ownership markers.
- Refusing destructive cleanup when the environment is unexpected.
- Restricting cleanup to known test records.
- Separate test database where appropriate.
- Clear environment validation.

The exact safeguards should be determined during planning.

### 13. Documentation

Update the appropriate project documentation to explain:

- E2E data lifecycle.
- Local execution.
- Staging execution.
- Required environment variables.
- Data preparation.
- Cleanup.
- Safety rules.
- Troubleshooting common data problems.

Documentation should be concise and maintained alongside the implementation.

## Scope Boundaries
In scope:

- E2E test-data architecture.
- Data preparation.
- Data ownership.
- Cleanup.
- Local E2E environment management.
- Staging E2E environment management.
- Environment configuration.
- Test-run isolation.
- Parallel execution considerations.
- Refactoring existing Story 36–37 tests where necessary.
- Minimal shared E2E utilities.
- Documentation.

Out of scope:

- New functional Books E2E scenarios.
- Authentication/authorization implementation.
- Cross-browser testing.
- Responsive testing.
- Visual regression testing.
- Performance testing.
- CI pipeline implementation.
- Production environment changes.
- General application architecture refactoring.
- Generic test frameworks unrelated to E2E data/environment management.
- Full database migration/seeding architecture for the application.
- Managing production data.

## Important Constraints
The E2E strategy must never require developers to manually create or delete test records in MongoDB.

Tests must not depend on:

- Manually created database records.
- Hardcoded persistent database IDs.
- Test execution order.
- Existing staging data.
- Another developer's test data.

The cleanup strategy must never blindly delete all Books or all records in an environment.

The solution must protect real application data.

## Acceptance Criteria
- A documented E2E test-data lifecycle exists.
- Test-data preparation is deterministic.
- Tests can identify data created for E2E purposes.
- Test-owned data can be cleaned safely.
- Cleanup is safe after successful tests.
- Cleanup behavior for failed/interrupted tests is defined.
- Local E2E execution does not require manual database manipulation.
- Staging E2E execution does not depend on pre-existing test records.
- Staging cleanup cannot accidentally delete unrelated data.
- Environment-specific configuration is explicit.
- Required environment variables are documented.
- Test runs can be isolated from one another.
- The strategy considers parallel execution.
- Stories 36–37 are compatible with the new strategy.
- Existing E2E tests remain passing after any required refactor.
- Existing frontend tests remain passing.
- Existing backend tests remain passing.
- No unnecessary test-data framework is introduced.
- Documentation accurately describes the resulting workflow.
- The implementation does not modify production data or production infrastructure.

## Definition of Done
- The test-data strategy has been reviewed against the actual repository.
- A concrete implementation has been selected.
- Required utilities/configuration have been implemented.
- Existing affected E2E tests have been migrated.
- Local execution has been verified.
- Staging execution strategy has been verified to the extent possible without introducing unsafe changes.
- Cleanup has been tested.
- Isolation has been verified.
- Documentation has been updated.
- Existing E2E coverage remains intact.
- No unrelated refactoring has been introduced.
- No Git commits or pushes are performed by the AI agent.

## Expected Outcome
At the end of Story 38, Literaria Nocturna should have a clear and maintainable E2E data lifecycle.

A developer should be able to clone the project, configure the required environment, run the E2E suite, and know exactly:

- Where test data comes from.
- Who owns it.
- How it is isolated.
- How it is cleaned.
- How local and staging execution differ.
- How the suite protects non-test data.

The resulting architecture should provide a stable foundation for the later E2E work without prematurely building an oversized test-data framework.
