# Story 22 — MSW & API Contract Synchronization

## Objective

Eliminate divergence between MSW and the real backend so frontend tests use a faithful representation of the API contract.

## Scope

Update MSW to accurately reproduce:

- sorting;
- pagination;
- invalid `page`;
- invalid `limit`;
- invalid genre;
- invalid ObjectId;
- validation details;
- PATCH semantics;
- empty request bodies;
- 500 responses;
- error messages;
- HTTP status codes.

## Contract Strategy

Define a clear strategy to prevent future divergence:

Backend API Contract
↓
Contract fixtures
↓
MSW
↓
Frontend tests

Evaluate using Swagger/OpenAPI as the contract source when appropriate.

## Testing

Create tests that verify MSW accurately represents the real API contract.

Include coverage for:

- successful responses;
- validation errors;
- not-found responses;
- invalid parameters;
- server errors;
- pagination;
- sorting;
- mutations.

## Acceptance Criteria

- MSW returns the same relevant status codes as the backend.
- MSW returns the same response structures.
- MSW uses the same relevant error messages.
- MSW correctly implements pagination.
- MSW correctly implements sorting.
- MSW correctly implements PATCH semantics.
- Existing frontend tests continue to pass.
- There is an automated strategy capable of detecting contract drift.

## Related Audit Findings

- C-03
