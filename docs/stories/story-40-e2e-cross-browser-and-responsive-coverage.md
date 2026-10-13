# Story 40 — E2E Cross-Browser & Responsive Coverage

**Status:** Planning Pending  
**Type:** Testing / Quality Engineering  
**Priority:** Quality and compatibility hardening  
**Dependencies:** Stories 33–39

## Objective

Expand the existing Playwright E2E coverage to validate critical user journeys across a justified selection of browser engines and responsive viewport profiles.

The goal is to detect browser compatibility and responsive layout issues without creating an unnecessarily large, slow, or difficult-to-maintain test matrix.

The story must build upon the existing E2E infrastructure, test strategy, test-data management, and API/UI contract validation rather than duplicating their responsibilities.

## Context

Literaria Nocturna already has a Playwright E2E testing foundation and critical user journeys covering book management, validation, error handling, test-data/environment management, and API/UI contract validation.

The current repository state must be inspected before determining which additional configurations, tests, or CI changes are necessary.

This story does not assume that all existing scenarios must run in every browser or at every viewport size. Coverage decisions must be based on application behavior, existing test coverage, technical constraints, and maintenance cost.

## Scope

### 1. Browser Coverage Assessment

Inspect the current Playwright configuration and determine which browser engines are relevant to the application's critical user journeys.

Evaluate Chromium, Firefox, and WebKit as potential candidates, based on the existing infrastructure and the project's compatibility goals.

Define:

- The primary browser engine used for the baseline E2E suite.
- Which additional browser engines, if any, should be covered.
- Which critical scenarios should run across multiple browser engines.
- Which scenarios can remain exclusive to the primary browser.
- How browser-specific execution should be configured and maintained.
- Any relevant compatibility or execution constraints.

Do not require the full E2E suite to run in every browser without a clear justification.

### 2. Responsive Coverage Assessment

Inspect the existing frontend layout, responsive styles, components, and critical user journeys.

Select a small set of representative viewport profiles based on actual application breakpoints and meaningful layout changes.

Consider desktop and mobile profiles. Include an intermediate or tablet profile only if the application's behavior or layout justifies it.

Identify critical interfaces and interactions that should be verified at smaller viewport sizes, including applicable examples such as:

- Application navigation.
- Book listing, browsing, and details.
- Search and filtering controls.
- Create and edit forms.
- Validation feedback and error states.
- Dialogs, action buttons, and other interactive elements.

The selected checks must validate usability and observable behavior, not merely confirm that a page renders.

Avoid duplicating every browser test at every viewport size.

### 3. Lean Cross-Browser and Responsive Execution Matrix

Define a maintainable execution matrix that specifies:

- Browser engine.
- Viewport profile.
- Critical scenarios to execute.
- Execution frequency and CI placement.
- Rationale for each selected combination.

Prefer targeted coverage over exhaustive combinations.

Reuse existing scenarios, fixtures, and test helpers wherever appropriate. Avoid introducing custom testing abstractions when existing Playwright capabilities are sufficient.

### 4. CI Integration and Execution Reliability

Evaluate how the selected coverage should integrate with the existing CI workflows.

Determine whether changes are required to:

- Playwright browser project configuration.
- Browser installation or CI dependencies.
- Test scripts and execution filters.
- Workflow jobs or stages.
- Test reporting and failure artifacts.
- Execution time and reliability.

Preserve the existing baseline E2E execution and avoid unnecessarily increasing the duration of routine pull-request checks.

Cross-browser or responsive tests must not introduce dependencies on test execution order, shared mutable data, or non-deterministic cleanup.

### 5. Regression Safety

Ensure the additional coverage works with the existing E2E infrastructure and preserves the testing responsibilities established by previous stories.

In particular:

- Preserve test-data isolation and cleanup mechanisms.
- Reuse existing API/UI contract validation where appropriate without duplicating it.
- Do not weaken existing assertions or skip existing tests to make new configurations pass.
- Do not modify application behavior merely to accommodate a browser without identifying and justifying the underlying compatibility issue.
- Document any browser-specific limitations or exclusions.

## Acceptance Criteria

**AC1 — Browser coverage is explicitly defined**

The project has a documented, justified selection of browser engines and a clear primary E2E baseline. Any exclusions are intentional and explained.

**AC2 — Critical cross-browser journeys are verified**

The selected critical user journeys execute successfully in the additional browser engines chosen for this story, where applicable.

**AC3 — Responsive behavior is verified**

The selected representative viewport profiles have automated checks for the relevant critical interfaces and interactions.

**AC4 — Assertions validate meaningful behavior**

Cross-browser and responsive tests verify observable application behavior and usability, rather than only page loading or element presence.

**AC5 — Existing test infrastructure remains reliable**

Existing E2E scenarios, test-data isolation, setup, and cleanup continue to work under the selected execution configurations.

**AC6 — CI execution is intentional and maintainable**

The selected coverage is integrated into the appropriate existing CI workflow or workflows, with a clearly defined execution scope. The test matrix remains proportionate to the project's needs.

**AC7 — Existing coverage is preserved**

Existing tests and quality checks are not weakened or removed to accommodate the new coverage.

**AC8 — Results and limitations are documented**

The final documentation identifies the browser and viewport coverage, execution commands, verification results, known limitations, and any justified exclusions.

If repository inspection demonstrates that an acceptance criterion is already fully satisfied, the implementation may preserve the existing behavior rather than introducing redundant changes. The planning and completion reports must include evidence supporting that conclusion.

## Out of Scope

Unless explicitly justified by the existing project requirements, this story does not include:

- Exhaustive combinations of every test, browser, and viewport.
- Visual regression or screenshot-diff infrastructure.
- A complete accessibility audit.
- Performance benchmarking.
- Real-device testing or paid device-farm integration.
- Application redesign or unrelated responsive UI changes.
- A replacement of the existing Playwright architecture.
- Duplication of the API/UI contract validation implemented in Story 39.

## Implementation Approach

The implementation plan must be based on repository inspection and should follow these steps as applicable:

1. Audit the current browser, viewport, and CI coverage.
2. Identify the coverage gaps and agree on a minimal execution matrix.
3. Implement only the missing Playwright configuration and test coverage.
4. Integrate the selected execution profiles into CI where required.
5. Run targeted tests and the relevant regression checks.
6. Document actual coverage, results, limitations, and any criteria already satisfied without code changes.

The implementation should be divided into small, independently verifiable phases.

## Definition of Done

- All applicable acceptance criteria are satisfied.
- Any pre-existing criteria are supported by evidence.
- The selected browser and responsive configurations are reproducible.
- New or modified tests pass in the intended execution environments.
- Relevant existing tests, type checks, linting, and builds pass, or any failures are accurately documented.
- CI executes the intended coverage without an unjustified expansion of the test matrix.
- Documentation reflects the actual implementation and verification results.
- No unrelated changes, commits, or pushes are performed without explicit authorization.

## Constraints

- Inspect the repository before making implementation decisions.
- Reuse existing infrastructure where appropriate.
- Do not introduce dependencies or services without justification.
- Do not assume that additional code is necessary merely because this is a new story.
- Do not claim successful verification without executing and inspecting the relevant commands.
- Do not create commits, push changes, or switch branches.

## Expected Deliverables

1. A Story 40 planning document consistent with the existing story documentation conventions.
2. A justified browser and responsive viewport execution matrix.
3. The minimum necessary implementation changes, if any.
4. Automated test and CI changes where required.
5. A final report documenting implementation, verification, acceptance criteria, and remaining limitations.