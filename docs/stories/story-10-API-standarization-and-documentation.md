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
