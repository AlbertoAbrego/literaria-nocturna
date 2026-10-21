# Story 42 — E2E Staging Validation

## Objective

Validate the existing Playwright E2E test suite against the deployed staging environment to verify that Literaria Nocturna works as an integrated system across Vercel (frontend), Render (backend API), and MongoDB Atlas (database).

The goal is to support running the same relevant E2E tests locally and against staging through environment-specific configuration, without duplicating test scenarios or compromising data safety.

## Scope

### 1. Staging Configuration

- Inspect the existing Playwright configuration, staging projects, environment variables, and `test:e2e:staging` script.
- Verify that Playwright can target the deployed staging frontend through a configurable base URL.
- Ensure staging execution does not unintentionally start local frontend or backend servers.
- Reuse existing configuration and scripts whenever possible.
- Keep local execution behavior unchanged.

### 2. Deployed System Validation

Verify the integration between:

- **Vercel:** deployed frontend.
- **Render:** deployed backend API.
- **MongoDB Atlas:** staging database used by the backend.

Confirm that the frontend communicates with the expected API, that the API can access its configured database, and that representative user journeys work against the deployed system.

Distinguish application failures from infrastructure, deployment, connectivity, and configuration failures where possible.

### 3. E2E Test Execution

- Reuse the existing Playwright tests and staging projects wherever appropriate.
- Identify a small, representative set of critical journeys for staging validation.
- Verify that tests use the correct staging configuration and do not depend on local services.
- Avoid duplicating existing unit, integration, or E2E coverage without a clear reason.
- Do not expand the browser or viewport matrix beyond what is justified by the existing E2E strategy.

### 4. Test Data Safety

- Confirm that any test that creates, updates, or deletes data operates only on explicitly identified test data.
- Verify that cleanup mechanisms cannot delete unrelated staging data.
- Avoid production credentials and production databases.
- Document any required staging configuration or test data prerequisites.
- If safe execution cannot be guaranteed, do not run destructive tests against the deployed environment.

### 5. Execution and Documentation

- Provide a reproducible way to execute the approved staging E2E suite.
- Document required environment variables, configuration, and the command used to run the suite.
- Document which tests are included, what they validate, and any exclusions or limitations.
- Record the actual verification results and distinguish local checks from successful execution against the deployed staging environment.

## Acceptance Criteria

- [ ] **AC1 — Existing Setup Assessed:** The current Playwright configuration, staging projects, scripts, and environment requirements have been inspected before implementation.
- [ ] **AC2 — Configurable Target:** Playwright can target the deployed staging frontend through environment-specific configuration without hardcoding staging URLs into individual tests.
- [ ] **AC3 — Local Execution Preserved:** Existing local E2E execution remains functional and does not require staging configuration.
- [ ] **AC4 — No Unintended Local Servers:** Staging execution does not unintentionally start local frontend or backend servers.
- [ ] **AC5 — Integrated System Validated:** Representative E2E journeys validate the deployed frontend and its interaction with the backend API and database.
- [ ] **AC6 — Data Safety:** Staging tests use appropriately isolated test data, and destructive operations cannot affect unrelated or production data.
- [ ] **AC7 — Reproducible Execution:** The staging suite can be run using documented commands and configuration prerequisites.
- [ ] **AC8 — Existing Coverage Preserved:** Existing E2E tests, assertions, and local test infrastructure remain intact unless an explicitly justified change is approved.
- [ ] **AC9 — Results and Limitations Documented:** Actual staging execution results, covered journeys, exclusions, and unresolved environment issues are documented accurately.

## Out of Scope

- Rebuilding the GitHub Actions E2E integration covered by Story 41.
- Automatically triggering E2E tests after every deployment, unless already supported and requiring only a small, directly relevant adjustment.
- Rewriting existing E2E scenarios or introducing another testing framework.
- Exhaustive cross-browser or responsive testing beyond the existing strategy.
- Production E2E execution.
- Load testing, performance benchmarking, and visual regression testing.
- Unrelated application, deployment, or infrastructure refactoring.

## Definition of Done

- All applicable acceptance criteria are satisfied.
- Existing staging functionality is reused where it already meets the requirements.
- Any necessary configuration or test changes are minimal and justified by repository evidence.
- Relevant local tests and quality checks have been executed, with their actual results recorded.
- Staging execution has been attempted against the real deployed environment when access and prerequisites permit.
- Successful local verification is not misrepresented as successful staging verification.
- Test-data isolation and cleanup have been reviewed before executing potentially destructive tests.
- Documentation reflects the actual configuration and verified behavior.
- No unrelated changes, commits, or pushes are introduced as part of the implementation.

## Implementation Constraints

- Inspect the repository and current working tree before making changes.
- Follow the existing Playwright architecture and conventions.
- Prefer existing scripts, fixtures, projects, and environment variables over new abstractions.
- Do not invent staging URLs, credentials, or infrastructure configuration.
- Do not expose secrets in logs, reports, or documentation.
- Do not weaken assertions or skip tests merely to make staging execution pass.
- If the story is already satisfied, provide evidence and recommend completion without unnecessary code changes.
