# Story 24 — API Contract, Validation & Swagger Hardening

## Objective

Strengthen the API contract and eliminate inconsistencies between runtime validation, Mongoose models, Swagger documentation, and frontend types.

---

## Scope

### 1. Runtime DTO Validation

Implement runtime validation for:

- `CreateBookDto`
- `UpdateBookDto`
- `BookQueryDto`

Validation should produce the project's standard error format:

```json
{
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {}
}
```

> **Note:** Mongoose validation must remain as a second layer of defense.

---

### 2. Genre Contract

Review and reduce duplication between:

- Mongoose `Genre` definition
- Swagger `Genre` enum
- Frontend `Genre` definitions

Add parity tests where appropriate.

---

### 3. Swagger

Strengthen Swagger verification for:

- Genre enum
- Book required fields
- Response schemas
- 204 No Content delete response
- Documented error responses
- Endpoint coverage

---

### 4. Testing

Add integration/API tests for:

- Invalid DTOs
- Invalid query parameters
- Invalid genres
- Invalid request bodies
- Swagger parity
- Duplicate key errors
- 204 delete response

---

## Acceptance Criteria

- Invalid requests are rejected before persistence when appropriate.
- Validation errors follow the standard API contract.
- Genre definitions cannot silently diverge between layers.
- Swagger accurately represents the API.
- Swagger verification detects incompatible contract changes.
- Backend and frontend tests continue to pass.

---

## Related Audit Findings

- **H-03**
- **H-04**
- **M-08**
