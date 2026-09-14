# Story 33 — Playwright Test Infrastructure

## Objective

Introduce Playwright as the project's E2E testing framework and establish the foundational infrastructure required to run browser-based end-to-end tests locally.

This story establishes the E2E testing environment but does not implement application-specific E2E coverage.

The first validation will use a minimal smoke test that starts the application, launches Chromium, navigates to the application, and verifies that the main page loads successfully.

---

## Scope

### Playwright setup

- Add Playwright as an E2E testing dependency.
- Create a dedicated E2E test project at the repository root.
- Keep E2E tests separate from the frontend and backend test suites.
- Configure Playwright for local execution.
- Configure Chromium as the initial browser project.

Expected conceptual structure:

```text
literaria-nocturna/
├── frontend/
├── backend/
├── e2e/
│   └── ...
├── playwright.config.ts
└── ...
```

The exact directory/file structure may follow Playwright conventions where appropriate.

### Local application execution

Configure Playwright so the E2E environment can reliably execute against the local application.

The configuration should account for the existing frontend/backend architecture.

Do not introduce a new application startup mechanism if the repository already provides suitable development scripts.

The solution should be compatible with the existing project workflow and should avoid unnecessary architectural changes.

### Initial smoke test

Create one minimal E2E smoke test whose purpose is to verify the Playwright infrastructure.

The test should:

1. Start or connect to the local application using the established project configuration.
2. Launch Chromium.
3. Navigate to the application's main page.
4. Verify that the page loads successfully.
5. Verify a stable application-level element or condition that confirms the application rendered correctly.

The smoke test must not depend on:

- MongoDB IDs copied manually from the database.
- Hardcoded book IDs.
- Specific books existing in the database.
- Manually created test data.
- Production or staging.

This is an infrastructure smoke test, not a Books functional test.

---

## Browser Scope

For this story:

- Chromium is required.
- Firefox and WebKit are out of scope.

The Playwright configuration should be structured so additional browsers can be introduced later without redesigning the test architecture.

Cross-browser coverage will be addressed in a future story.

---

## Environment Scope

### Local

Local execution is required.

### Staging

Do not implement staging E2E execution in this story.

The infrastructure should not prevent future execution against staging, but staging-specific configuration belongs to a later story.

### Production

Production does not currently exist and is completely out of scope.

---

## Test Commands

Establish clear npm scripts for running E2E tests locally.

At minimum, provide a command that allows the complete E2E suite to be executed, for example:

```bash
npm run test:e2e
```

The exact command name may follow existing repository conventions if a better established convention exists.

If useful, provide an interactive/headed/debug command for local development, but do not add unnecessary scripts.

---

## Test Isolation

Do not introduce complex fixtures, factories, database reset mechanisms, or test-data management in this story.

Those concerns will be addressed separately once actual application E2E scenarios are introduced.

The initial smoke test should remain independent of application-specific test data.

---

## Out of Scope

Do not implement:

- Books E2E functional coverage.
- Book detail navigation changes.
- New product features.
- Authentication E2E.
- Complex fixtures.
- E2E test-data management.
- Database seeding specifically for E2E.
- Staging E2E execution.
- Production E2E execution.
- Firefox/WebKit coverage.
- CI integration.
- Visual regression testing.
- Performance testing.
- Major application refactoring.

---

## Testing

The following existing test suites must continue to pass after the Playwright setup:

### Frontend

```bash
npm run lint
npm run build
npm run test:run
```

### Backend

Run the established backend:

- lint
- build
- test

commands.

### E2E

Run the new E2E command and verify that the smoke test passes successfully using Chromium.

---

## Acceptance Criteria

- Playwright is installed and configured.
- E2E infrastructure lives at the repository root and is independent from frontend/backend test suites.
- Chromium is configured as the initial browser.
- Local E2E execution works reliably.
- The application can be started or connected to using the existing project architecture.
- A minimal smoke test launches Chromium and loads the local application successfully.
- The smoke test verifies that the application rendered correctly using a stable assertion.
- The smoke test does not depend on manually copied database IDs or application-specific test data.
- A clear npm command exists for running the E2E suite.
- Existing frontend tests continue to pass.
- Existing backend tests continue to pass.
- Existing frontend and backend lint/build checks continue to pass.
- No product features are introduced.
- No staging or production E2E configuration is introduced.
- The setup leaves room for future Firefox/WebKit support.

---

## Definition of Done

- Playwright infrastructure is implemented.
- Root-level E2E structure exists.
- Chromium execution works locally.
- Initial application smoke test passes.
- Existing frontend/backend checks remain green.
- No unnecessary application changes were introduced.
- The repository is ready for application-specific E2E test development.
