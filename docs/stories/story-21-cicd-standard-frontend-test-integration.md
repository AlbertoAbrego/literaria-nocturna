# Story 21 — CI/CD Standardization & Frontend Test Integration

## Objective

Align backend and frontend CI pipelines and ensure automated tests are part of Pull Request protection.

## Scope

### Frontend

- Execute frontend tests in GitHub Actions.
- Use `npm run test:run` or explicitly establish a `test:ci` script.
- Configure `actions/setup-node`.
- Use Node.js 22.
- Configure npm caching.
- Correct job naming.
- Keep lint and build verification.

### Backend

- Review the use of `test` vs `test:ci`.
- Standardize the command used by CI.
- Align the configuration with the frontend pipeline.

### CI Triggers

Review:

- push;
- pull requests;
- path filters;
- workflow changes.

## Acceptance Criteria

- Frontend CI executes the complete Vitest suite.
- Backend CI executes its test suite correctly.
- Both pipelines use Node.js 22.
- Both pipelines use consistent caching.
- Job names are correct.
- A failing test blocks the Pull Request.
- Lint and build continue to execute.

## Testing

- Execute both pipelines through a Pull Request.
- Verify successful test execution.
- Introduce a temporary controlled failure to verify that CI fails correctly.

## Related Audit Findings

- C-01
- H-01
- M-12
