# Story 30 — Staging Configuration & Environment Validation

## Objective

Ensure the staging environment is correctly isolated from development and configured consistently across the frontend, backend, and database.

## Scope

Validate all configuration that changes between development and staging.

## Tasks

### Environment Variables

Review and document:

- Frontend API URL
- Backend port
- MongoDB URI
- Environment identifier
- CORS origins
- Authentication/secrets if applicable
- Other runtime configuration

### Environment Separation

Ensure:

```text
Development
     ≠
Staging
```

Specifically:

- Staging does not use the local database.
- Staging does not depend on `.env` from the developer machine.
- Local development does not accidentally point to staging.
- Staging secrets are stored only in the hosting platform.

### CORS

Configure CORS so that:

- Staging frontend is allowed.
- Unrelated origins are rejected.
- Local development remains functional.

### Backend

Verify:

- Environment is correctly identified.
- Database connection works.
- Health endpoint works.
- Errors do not expose sensitive implementation details.
- API behaves correctly without development-only configuration.

### Frontend

Verify:

- Correct staging API URL.
- No localhost URLs remain in the production build.
- Environment variables are correctly exposed to the application.

## Testing

### Manual Tests

- Open staging frontend.
- Verify API requests use staging backend.
- Verify staging database is used.
- Verify local API is not contacted.
- Verify CORS behavior.
- Verify health endpoint.
- Verify invalid API requests return expected responses.
- Verify errors do not expose secrets or stack traces.

## Acceptance Criteria

- Development and staging environments are isolated.
- Staging configuration is documented.
- No staging secrets exist in Git.
- Frontend uses staging API.
- Backend uses staging database.
- CORS is restricted appropriately.
- No localhost dependencies remain in staging.
- Health check succeeds.
- Basic security configuration is verified.

## Definition of Done

- Environment variables documented.
- Development/staging separation verified.
- CORS verified.
- Database isolation verified.
- Frontend API configuration verified.
- Backend configuration verified.
- Security smoke tests completed.
- Documentation updated.
