# Story 39 — E2E API/UI Contract Validation

## Objective

Validate that a small set of critical, real end-to-end user workflows still honors the API contract between the frontend and the real backend. The tests must verify the requests the UI constructs, the responses it consumes, and the user-visible result when representative success and error contracts are returned.

The goal is to catch integration regressions and representative API breaking changes at the UI boundary, without turning Playwright into a second backend integration-test suite.

## Context

Stories 36–37 already cover critical Books workflows, validation, and user-visible error handling, with frontend/MSW and backend/integration tests covering their respective layers. Story 39 adds value only where it verifies the connection against the **real backend API** and checks contract details that mocks or isolated tests can miss.

The suite should remain small and intentional. It should use a representative set of flows to establish that the frontend and backend agree on:

- HTTP method, endpoint, and relevant path/query parameters.
- Request payload shape and values.
- Response status and response-body shape consumed by the UI.
- Representative standardized error responses and the UI behavior they trigger.

A breaking-change scenario must make a contract mismatch observable—for example, a renamed response property that the UI depends on. It must not require deliberately changing the production API or maintain a parallel copy of every backend schema.

## Scope

1. **Choose a minimal representative workflow set** from existing critical Books user journeys. Prefer workflows that cover distinct contract surfaces, such as:
   - Loading a collection or detail view from the backend.
   - Creating or updating a resource with a request body.
   - A search/filter workflow that sends query parameters, if supported by the product.
   - A representative conflict or not-found response that the UI maps to a clear outcome.

2. **Verify request construction through the UI.** For selected workflows, assert the outgoing method, route, relevant path and query parameters, and the meaningful request fields. Assert values and contract-relevant fields; avoid brittle snapshots of unrelated headers or incidental payload details.

3. **Verify response consumption.** Confirm that representative successful backend responses are interpreted correctly and that the corresponding data or state is rendered in the UI. Include required response fields and any contract-relevant nesting or pagination used by the chosen flow.

4. **Verify representative error-contract handling.** Exercise only errors that are meaningful to the selected workflows and already part of the API contract (for example, a duplicate/conflict or a not-found response). Confirm the UI's expected user-visible behavior and that it does not present a false success state.

5. **Detect representative breaking changes.** Add a deterministic contract-focused check that would fail if a critical field or response shape consumed by the UI changed incompatibly. This may use a controlled test response at the real-backend E2E boundary or an equivalent contract assertion, provided it complements—not replaces—the real-backend flow. Document what incompatibility it detects.

6. **Run against the real backend** in the supported E2E environment, using the project's established test-data and environment-management approach. Keep test data isolated and clean up created data when the existing strategy supports it.

7. **Document the scenarios and their contract purpose** so maintainers can see which integration risk each scenario covers and why it belongs in E2E.

## Out of Scope

- Repeating exhaustive backend status-code, validation, persistence, or business-rule tests already covered by backend integration tests.
- Repeating frontend component, form-validation, state-management, or broad error-mapping coverage already covered by frontend/MSW tests.
- Rebuilding all Stories 36–37 scenarios as real-backend E2E tests.
- Creating a generic API contract-testing platform, schema registry, or a second source of truth for API schemas.
- Exhaustively testing every endpoint, field, HTTP status, or malformed response.
- Introducing authentication, authorization, roles, or session infrastructure unless required by an already implemented product flow.
- Changing production API behavior solely to make tests pass.
- Broad changes to test data/environment architecture already established by Story 38.

## Constraints

- Follow the project's existing Playwright conventions, fixtures, selectors, API client conventions, and E2E environment setup.
- Use the real backend for the selected integration scenarios. Do not silently replace the backend with MSW for the core contract-validation flows.
- Keep the suite deterministic, independent, and safe for the configured test environment.
- Reuse the project's established test-data lifecycle and avoid dependence on manually seeded or shared mutable records.
- Assert only stable, user-relevant contract details. Do not couple tests to implementation-only headers, incidental ordering, generated identifiers, timestamps, or unrelated response fields.
- Keep the number of scenarios proportionate to the unique contract surfaces they cover; each scenario must have a stated reason for belonging at E2E.
- Do not add duplicate assertions whose only purpose is to restate backend behavior already guaranteed by integration tests.
- If the current API does not support a suggested query, path, or error scenario, select an existing supported contract surface and record the limitation rather than inventing an endpoint or behavior.
- Preserve the existing test suite and workflow. Any required environment prerequisites must be documented.

## Acceptance Criteria

- [ ] A concise set of critical UI workflows is selected, with each scenario linked to a distinct API/UI contract risk.
- [ ] At least one real-backend success workflow verifies the UI's outgoing request method, endpoint, and contract-relevant payload fields.
- [ ] At least one real-backend success workflow verifies that the UI consumes the backend response shape and renders the expected user-visible result.
- [ ] Where supported by the product, a selected workflow verifies relevant path and/or query parameters, including correct encoding and values.
- [ ] At least one representative, contract-defined error response is exercised against the real backend and the UI shows the expected outcome without a false success state.
- [ ] A deterministic breaking-change check demonstrates that an incompatible change to a critical consumed field or response shape is detected. The check identifies the field/shape and the expected failure signal.
- [ ] E2E scenarios use the established test environment and test-data strategy, are independently runnable, and do not rely on shared mutable data.
- [ ] Scenarios clean up test-created data where appropriate and supported by the project’s established strategy.
- [ ] Scenario documentation explains why each check belongs in E2E and how it complements Stories 36–38 and existing backend/frontend tests.
- [ ] No broad duplication of backend integration or frontend/MSW coverage is introduced.
- [ ] The relevant E2E command and prerequisites are documented, and the new scenarios pass in the supported environment.

## Definition of Done

- All acceptance criteria are met.
- The selected E2E scenarios run against the real backend and pass in the supported environment.
- The breaking-change check is deterministic and its covered contract assumption is documented.
- Test data is isolated and cleaned up according to the project’s established approach.
- Tests are reviewed for scope, brittleness, and overlap with existing coverage.
- Required setup, execution commands, and any environment limitations are documented.
- The final change set contains only work needed for this story and follows repository conventions.

## Risks and Tradeoffs

- **E2E reliability and runtime:** Real-backend tests are slower and can be more environment-sensitive than isolated tests. Limit the suite to high-value contract surfaces and use deterministic data and environment setup.
- **Assertions becoming brittle:** Checking every property or header makes harmless API evolution expensive. Assert only fields and semantics the UI actually depends on.
- **False confidence from controlled responses:** A simulated incompatible response can prove that the UI detects a shape change, but cannot prove that the deployed backend has changed. Pair it with real-backend happy-path contract checks and clearly label the controlled breaking-change check.
- **Duplicate coverage:** Repeating backend rules or MSW scenarios at E2E adds cost without meaningful confidence. Require each scenario to cover a cross-boundary risk that isolated tests cannot establish.
- **Environment/data coupling:** Shared test records can make results order-dependent. Reuse Story 38’s environment and test-data strategy and avoid persistent shared fixtures.
- **API limitations:** The current backend may not expose every example surface (such as filtering or a standardized conflict body). Select only existing, stable contract behavior and document unavailable cases.

## Expected Outcome

A focused, maintainable Playwright E2E layer that gives confidence that critical UI workflows construct requests the real backend understands, consume its responses correctly, and handle representative contract-defined errors. A documented breaking-change check makes a critical incompatibility visible early, while the suite remains complementary to—rather than duplicative of—backend integration and frontend/MSW testing.
