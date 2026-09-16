# Story 34 – E2E Testing Strategy

## Context

Story 33 introduced the Playwright E2E infrastructure and a minimal smoke test for local execution.

The current repository includes E2E-related infrastructure and documentation such as:

- `e2e/smoke.test.ts`
- `playwright.config.ts`
- Root `package.json`
- `docs/testing.md`
- `docs/project-context.md`
- Playwright test result artifacts

Story 34 builds on that foundation by defining the conventions that future E2E tests must follow.

The strategy must remain consistent with the existing frontend, backend, and repository architecture.

## Goal

Establish a documented E2E testing strategy covering:

- The purpose and scope of E2E testing
- Criteria for deciding which scenarios deserve E2E coverage
- The relationship between E2E tests and existing frontend/backend tests
- E2E directory and file organization
- Test naming conventions
- `describe` and `test` organization
- Selector strategy
- Assertions and synchronization
- Test isolation
- Fixtures
- Test data strategy and principles
- Reusability guidelines
- Parallel execution considerations
- Debugging and failure artifacts
- Flakiness prevention
- Local and future CI/staging execution considerations
- Guidelines for keeping the E2E suite small, meaningful, and maintainable

## Scope

### 1. E2E Testing Responsibilities

Document what E2E testing is responsible for validating.

E2E tests should focus primarily on realistic user-facing workflows that cross application boundaries, including interactions between:

- Browser UI
- Frontend application
- Backend API
- Persistence layer when relevant to the user flow

The strategy should distinguish user-visible behavior from implementation details.

### 2. E2E vs Other Testing Layers

Define clear responsibilities for:

- Backend integration tests
- Frontend unit tests
- Frontend component tests
- Frontend integration tests with MSW
- E2E tests

Establish criteria for selecting the lowest appropriate testing layer.

E2E should **not** become the default testing mechanism for behavior that can be tested reliably and efficiently at a lower layer.

### 3. Criteria for E2E Coverage

Define criteria for determining whether a scenario should become an E2E test.

Consider factors such as:

- Business/user importance
- Critical user journeys
- Cross-application integration
- Risk of regression
- Real browser behavior
- Cost and maintenance burden
- Whether the scenario can be reliably tested at a lower level

The strategy should explicitly discourage testing every possible variation through E2E.

### 4. Directory and File Structure

Define conventions for organizing E2E tests within the repository.

The strategy must preserve the dedicated repository-level `e2e/` directory introduced by Story 33.

The structure should support future growth without introducing unnecessary abstraction or excessive directory nesting.

### 5. Naming Conventions

Define conventions for:

- Test files
- Test descriptions
- `describe` blocks
- Individual tests
- Fixtures
- Test data

Names should describe user behavior or business intent rather than implementation details.

### 6. Selector Strategy

Define a selector hierarchy for Playwright tests.

Prefer stable, user-facing selectors and avoid selectors that depend unnecessarily on:

- CSS implementation details
- DOM structure
- Generated class names
- Positional selectors
- Database IDs
- Implementation-specific React details

The strategy should document when dedicated test identifiers such as `data-testid` are appropriate.

The goal is to balance realistic user interaction with selector stability.

### 7. Assertions

Define expectations for E2E assertions.

Assertions should verify observable application behavior rather than internal implementation details.

Tests should contain meaningful assertions that demonstrate the intended user outcome.

Avoid excessive assertions that make tests unnecessarily coupled to unrelated UI details.

### 8. Synchronization and Waiting

Define how tests should handle asynchronous behavior.

Prefer Playwright's built-in auto-waiting and web-first assertions.

Avoid arbitrary fixed delays such as `waitForTimeout` unless there is a documented and exceptional reason.

Tests should wait for observable conditions rather than implementation timing.

### 9. Test Isolation

Define the principle that tests must be independently executable.

A test should not rely on:

- Execution order
- State created by another test
- Shared mutable application state
- Manually prepared database records
- Hardcoded database identifiers

Future E2E tests should be designed so that parallel execution is possible when appropriate.

### 10. Fixtures

Define the purpose and appropriate use of Playwright fixtures.

Fixtures should provide reusable setup or context without hiding important test behavior.

Avoid creating a large abstraction layer before the project demonstrates a real need for it.

The strategy should establish when functionality belongs in:

- A test
- A helper
- A fixture
- A future test-data utility

### 11. Test Data

Define principles for E2E test data.

Tests should not depend on arbitrary records already existing in the database.

The strategy should establish how future stories should approach:

- Creating required data
- Reusing deterministic data
- Cleaning up test data
- Avoiding collisions between tests
- Supporting parallel execution

Story 34 should define the strategy and constraints, but should **not** introduce a complex test-data management system unless required by the existing implementation.

### 12. Reusability

Define when code should be extracted for reuse.

Prefer simple and explicit tests over excessive abstraction.

Shared helpers and fixtures should be introduced when they remove meaningful duplication without obscuring the user flow being tested.

### 13. Flakiness Prevention

Define principles for preventing flaky tests.

Include guidance around:

- Stable selectors
- Explicit application states
- Auto-waiting
- Network synchronization
- Test isolation
- Deterministic data
- Avoiding timing assumptions
- Avoiding test-order dependencies

### 14. Debugging and Failure Artifacts

Document the intended use of Playwright debugging artifacts such as:

- Screenshots
- Traces
- Videos, when appropriate
- Test result output

The strategy should distinguish between artifacts useful during local debugging and artifacts that should be retained routinely in automated execution.

### 15. Parallel Execution

Define principles for designing tests that can eventually run in parallel.

Parallel execution should not be treated as a requirement to optimize prematurely, but the architecture must avoid introducing unnecessary shared state that would prevent it.

### 16. Local, Staging, and CI Strategy

Document the intended evolution of E2E execution:

1. Local development
2. Future CI execution
3. Future staging validation

Story 34 should define the strategy without implementing CI or staging execution.

## Out of Scope

The following are explicitly outside the scope of this story:

- Implementing Books E2E flows
- Implementing validation/error E2E scenarios
- Implementing authentication E2E
- Adding new application features
- Changing application behavior to support E2E
- Integrating Playwright into GitHub Actions
- Implementing staging E2E execution
- Implementing production E2E execution
- Adding Firefox or WebKit coverage
- Visual regression testing
- Performance testing
- Full automated accessibility testing
- Building a complex fixture framework
- Building a complete test-data factory system
- Creating a dedicated E2E database infrastructure
- Adding unnecessary application-specific test hooks
- Refactoring unrelated frontend or backend code

## Documentation

This story is primarily a documentation and strategy story.

Expected documentation work includes:

- Creating or updating the E2E testing strategy documentation
- Updating `docs/testing.md` if necessary to incorporate the E2E layer
- Updating `docs/project-context.md` only if Story 33 introduced architectural information that should be formally documented there
- Documenting conventions that future E2E stories must follow

Documentation should describe the actual repository state rather than hypothetical infrastructure.

## Acceptance Criteria

### AC1 — E2E Responsibility

The project has documented criteria defining what E2E testing is responsible for validating.

### AC2 — Testing Layer Boundaries

The documentation clearly distinguishes E2E testing from backend integration, frontend unit/component, and frontend integration testing.

### AC3 — E2E Selection Criteria

The documentation defines clear criteria for deciding when a scenario should be covered by E2E.

### AC4 — Directory Structure

The E2E directory and file organization conventions are documented and compatible with the Playwright infrastructure introduced in Story 33.

### AC5 — Naming Conventions

Naming conventions for E2E test files, suites, and test cases are documented.

### AC6 — Selector Strategy

A selector strategy is documented, including preferred selectors and selectors that should generally be avoided.

### AC7 — Synchronization

Guidelines for asynchronous behavior, waiting, and Playwright auto-waiting are documented.

### AC8 — Assertions

Guidelines for meaningful user-facing assertions are documented.

### AC9 — Test Isolation

The strategy defines how tests should remain independent and avoid execution-order or shared-state dependencies.

### AC10 — Fixtures

The intended role and boundaries of Playwright fixtures are documented.

### AC11 — Test Data

The strategy defines principles for deterministic and isolated E2E test data without prematurely introducing unnecessary infrastructure.

### AC12 — Flakiness

The documentation contains guidelines for preventing and diagnosing flaky E2E tests.

### AC13 — Debugging

The intended use of Playwright screenshots, traces, videos, and test results is documented.

### AC14 — Future Execution

The documentation defines the intended evolution from local E2E execution toward future CI and staging execution without implementing those integrations.

### AC15 — No Scope Creep

No unrelated application features, functional E2E flows, cross-browser support, CI integration, or unnecessary testing infrastructure are introduced.

### AC16 — Existing Infrastructure Remains Functional

The Playwright infrastructure and smoke test introduced in Story 33 remain functional after the documentation changes.

### AC17 — Documentation Consistency

Existing testing and project documentation is consistent with the strategy defined by this story.

## Definition of Done

- E2E testing responsibilities are documented
- Boundaries between testing layers are documented
- Criteria for selecting E2E scenarios are documented
- E2E directory structure is documented
- Naming conventions are documented
- Selector strategy is documented
- Assertion guidelines are documented
- Synchronization and waiting guidelines are documented
- Test isolation principles are documented
- Fixture strategy is documented
- Test-data principles are documented
- Flakiness prevention guidelines are documented
- Debugging artifact strategy is documented
- Parallel execution considerations are documented
- Local/CI/staging execution strategy is documented
- `docs/testing.md` is updated if required
- `docs/project-context.md` is updated if required
- Existing Playwright smoke test remains functional
- Existing frontend tests remain functional
- Existing backend tests remain functional
- No application behavior was unnecessarily modified
- No future E2E stories were implemented
- Documentation reflects the actual repository state

## Expected Outcome

After Story 34, future E2E stories should not need to redefine how Playwright tests are structured or what conventions they follow.

Future stories should be able to focus primarily on application behavior and user journeys while following the strategy established here.
