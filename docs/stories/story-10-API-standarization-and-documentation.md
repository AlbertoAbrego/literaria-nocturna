## Objective

Standardize API responses, improve error handling, and document the backend API using OpenAPI/Swagger.

## Description

Improve the overall API consistency by introducing a standardized error response format, refining validation responses, reducing unnecessary logging, and generating interactive API documentation.

## Scope

### Standardized Error Responses

* Introduce a consistent error response structure.
* Include a `message` field.
* Include a `code` field.
* Reserve support for optional `details` in future validation errors.

### Validation Improvements

* Improve validation error handling.
* Return consistent `400 Bad Request` responses.
* Prepare the middleware for future field-level validation details.

### Logging Improvements

* Avoid logging expected client errors (`400`, `404`, `409`).
* Log only server-side errors (`5xx`).
* Keep logs concise and useful for debugging.

### Middleware Cleanup

* Simplify the global error middleware.
* Ensure consistent error propagation.
* Remove redundant logging and duplicated logic.

### API Documentation

* Integrate Swagger/OpenAPI.
* Document all book endpoints.
* Document request and response schemas.
* Document standardized error responses.
* Expose the interactive API documentation endpoint.

## Acceptance Criteria

* All API endpoints use the standardized error response format.
* Validation errors return consistent responses.
* Client errors are not logged as server errors.
* Swagger documentation is accessible and accurate.
* Error responses are documented in OpenAPI.
* Middleware follows a consistent error-handling strategy.

## Test Cases

### TC-H10-001

Verify standardized error response structure.

### TC-H10-002

Verify validation errors return `400 Bad Request`.

### TC-H10-003

Verify client errors are not logged.

### TC-H10-004

Verify server errors are logged.

### TC-H10-005

Verify Swagger documentation loads successfully.

### TC-H10-006

Verify all book endpoints appear in Swagger.

### TC-H10-007

Verify documented schemas match actual API responses.

## Notes: Malformed JSON Body Handling (Phase 3 trade-off)

As part of the Phase 3 middleware cleanup, errors that are neither `AppError` nor Mongoose `ValidationError` are now classified as unknown and return `500 INTERNAL_ERROR`. This changed how body-parser payload failures are handled: a request with malformed JSON used to return `400` (the parser's `SyntaxError` carries `status: 400`) and now returns `500`.

### Impact on Story Scope

This gap affects the story's acceptance criteria: malformed payloads are client errors, so they should return `400` and must not be logged as server errors.

### Required Changes in Next Phases

* **Middleware (small follow-up, before Phase 5):** add an explicit branch for body-parser parse errors (`SyntaxError` with `status: 400`, e.g. `type: 'entity.parse.failed'`) returning `400` with `VALIDATION_ERROR` and a generic message (e.g. `Invalid JSON payload`), without logging.
* **Phase 5 (Testing):** add a test case for malformed JSON bodies asserting `400` + `code: VALIDATION_ERROR`, and that the error is not logged as a server error.
* **Phase 6 (Documentation):** document the malformed JSON response in `docs/project-context.md` and in the OpenAPI error components.

**Alternative (not chosen):** treat all parser failures as `500` and accept that a client-error case gets logged. Rejected because it conflicts with the "client errors are not logged" criterion.
