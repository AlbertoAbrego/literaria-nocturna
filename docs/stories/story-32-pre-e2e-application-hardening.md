# Story 32 — Pre-E2E Application Hardening

## Objective

Resolve remaining technical and documentation issues that could interfere with staging validation or E2E automation.

This story is the final technical cleanup before introducing Playwright.

## Scope

Review and address remaining issues identified during the consolidation process.

### API & Backend

Review:

- Swagger/API schema parity
- Runtime DTO validation
- Error responses
- Health endpoint
- Seed script
- Production-safe error handling

### Frontend

Review:

- TypeScript type hygiene
- Remaining ESLint warnings
- API configuration
- Error/loading states
- Unnecessary test/build artifacts

### Repository

Review:

- README
- Documentation consistency
- `.gitignore`
- Environment examples
- Coverage artifacts
- Build output
- Generated files

## Important Rule

Do **not** introduce new product features.

This story is exclusively for preparing the existing application for reliable staging and E2E testing.

## Testing

Run:

```bash
npm run lint
npm run build
npm run test:run
```

for the frontend, and the equivalent established commands for the backend.

Perform a final manual smoke test against staging.

## Acceptance Criteria

- No known high or medium priority consolidation issues remain.
- Frontend builds successfully.
- Backend builds successfully.
- Frontend tests pass.
- Backend tests pass.
- Lint has no unresolved actionable warnings.
- Environment configuration is documented.
- Swagger/API documentation is consistent with the implementation.
- Runtime validation is present where required.
- Seed process works.
- Repository contains no accidental generated artifacts or secrets.
- Staging remains functional after cleanup.

## Out of Scope

- New application features.
- Playwright.
- E2E automation.
- Major architectural redesign.
- Performance optimization unrelated to identified issues.

## Definition of Done

- Backend verified.
- Frontend verified.
- Documentation cleaned.
- Environment configuration verified.
- Build passes.
- Tests pass.
- Lint passes without actionable warnings.
- Staging smoke test passes.
- Project is ready to begin Playwright implementation.
