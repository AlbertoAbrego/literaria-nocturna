# Tests

## Overview

This document tracks all test cases across backend and frontend. Backend uses integration tests (Jest + supertest + mongodb-memory-server). Frontend uses component, hook, integration, and contract tests (Vitest + React Testing Library + MSW).

---

# Backend Tests

## Test Case Index

Each test references its story test case ID (TC-*).

### Health Module

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC-H1-001 | GET /api/health returns 200 OK | ✅ |
| TC-H1-002 | Response contains status, message, version, timestamp | ✅ |

### Books - Create (POST /api/books)

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC-H2-001 | Create a valid book → 201 Created | ✅ |
| TC-H2-002 | Reject missing title → 400 Bad Request | ✅ |
| TC-H2-008 | Reject duplicate title+author → 409 Conflict | ✅ |

**Validations covered**: title required, author required, genre required, synopsis required, invalid genre (via Mongoose enum)

### Books - List (GET /api/books)

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC-H4-001 | Return 200 OK with list of books | ✅ |
| TC-H4-002 | Return 200 OK with empty list if no books | ✅ |
| TC-H8-001 | Filter by genre (exact match) | ✅ |
| TC-H8-002 | Filter by author (partial, case-insensitive) | ✅ |
| TC-H8-003 | Filter by title (partial, case-insensitive) | ✅ |
| TC-H8-004 | Combine multiple filters (AND) | ✅ |
| TC-H8-005 | Return empty array when no matches | ✅ |
| TC-H8-006 | Reject invalid genre → 400 Bad Request | ✅ |
| TC-H8-007 | Return 500 on database failure | ✅ |

### Books - Pagination (GET /api/books?page=&limit=)

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC-H9-001 | Retrieve first page | ✅ |
| TC-H9-002 | Retrieve middle page | ✅ |
| TC-H9-003 | Retrieve last page | ✅ |
| TC-H9-004 | Retrieve empty page beyond total | ✅ |
| TC-H9-005 | Default pagination when params omitted | ✅ |
| TC-H9-006 | Invalid page (negative, zero, non-numeric) → 400 | ✅ |
| TC-H9-007 | Invalid limit (negative, zero, >100, non-numeric) → 400 | ✅ |
| TC-H9-008 | Pagination metadata correct (page, limit, total, totalPages) | ✅ |
| TC-H9-009 | Return 500 on database failure during pagination | ✅ |

### Books - Get by ID (GET /api/books/:id)

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC-H5-001 | Return 200 OK with existing book | ✅ |
| TC-H5-003 | Return 404 Not Found for valid non-existent ObjectId | ✅ |

**Note**: TC-H5-002 (invalid ObjectId → 400) is tested in update/delete suites

### Books - Update (PATCH /api/books/:id)

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC-H6-001 | Update existing book → 200 OK | ✅ |
| TC-H6-002 | Partially update, keep other fields | ✅ |
| TC-H6-003 | Reject invalid ObjectId → 400 Bad Request | ✅ |
| TC-H6-004 | Reject invalid genre → 400 Bad Request | ✅ |
| TC-H6-005 | Reject empty request body → 400 Bad Request | ✅ |
| TC-H6-006 | Return 404 for valid non-existent ObjectId | ✅ |
| TC-H6-007 | Reject duplicate title+author → 409 Conflict | ✅ |

### Books - Delete (DELETE /api/books/:id)

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC-H7-001 | Delete existing book → 204 No Content | ✅ |
| TC-H7-002 | Reject invalid ObjectId → 400 Bad Request | ✅ |
| TC-H7-003 | Return 404 for valid non-existent ObjectId | ✅ |
| TC-H7-004 | Deleted book cannot be retrieved afterwards | ✅ |
| TC-H7-005 | Return 500 on database failure | ✅ |

### Error Handling Middleware

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC-H3-001 | Validation errors return consistent structure | ✅ |
| TC-H3-002 | Business rule violations return correct status (409) | ✅ |
| TC-H3-003 | Unexpected errors return 500 | ✅ |
| TC-H3-004 | Internal error messages not exposed to client | ✅ |
| TC-H3-005 | Validation errors logged | ⚠️ (logged as "Validation failed") |
| TC-H3-006 | Unexpected errors logged | ✅ |

---

# Frontend Tests

## Test Types

| Type | Pattern | What It Tests | Location |
|------|---------|---------------|----------|
| Component | `*.test.tsx` | Rendering, user interactions, conditional UI, accessibility | `src/shared/components/ui/*.test.tsx`, `src/features/books/components/*.test.tsx`, `src/pages/*.test.tsx` |
| Hook | `*.test.ts` | Queries, mutations, loading/error states, derived state | `src/features/books/hooks/*.test.ts`, `src/shared/hooks/*.test.ts` |
| Integration | `*.test.tsx` | Full page rendering, routing, API interactions, cache invalidation | `src/pages/*.test.tsx` |
| Contract | `msw-contract.test.ts` | MSW handlers match OpenAPI spec (status codes, shapes, errors) | `src/test/contract/msw-contract.test.ts` |

## Contract-Driven MSW Verification

| Test Case | Description | Status |
|-----------|-------------|--------|
| 32 contract tests | Validate status codes, response shapes, error messages, pagination, sorting against OpenAPI spec | ✅ |

---

# Coverage Summary

## Backend

| Module | Tests | Passing |
|--------|-------|---------|
| Health | 2 | 2 |
| Books Create | 3 | 3 |
| Books List + Filters | 9 | 9 |
| Books Pagination | 10 | 10 |
| Books Get by ID | 2 | 2 |
| Books Update | 7 | 7 |
| Books Delete | 5 | 5 |
| Error Handling | 6 | 6 |
| **Backend Total** | **44** | **44** |

## Frontend

| Area | Tests | Description |
|------|-------|-------------|
| Component tests | — | Shared UI components, feature components, pages |
| Hook tests | — | useBooks, useBook, useCreateBook, useUpdateBook, useDeleteBook, useBookFilters |
| Integration tests | — | BooksPage, BookDetailsPage, EditBookPage |
| Contract tests | 32 | MSW ↔ OpenAPI verification |
| **Frontend Total** | **32+** | — |

---

# Running Tests

## Backend

```bash
cd backend
npm test                # single run
npm run test:watch      # watch mode
npm run test:coverage   # with coverage report
npm run test:ci         # CI mode: --ci --coverage --maxWorkers=2
```

## Frontend

```bash
cd frontend
npm run test            # watch mode
npm run test:run        # single run
npm run test:ui         # Vitest UI dashboard
npm run test:coverage   # coverage report
npm run contract:check  # verify MSW ↔ OpenAPI contract
```

---

# Test Structures

## Backend

```
backend/src/test/
├── globalSetup.ts       # Starts MongoMemoryServer, writes URI to temp file
├── globalTeardown.ts    # Stops MongoMemoryServer
├── setup.ts             # Per-worker: connects Mongoose, clears collection
├── helpers/
│   ├── database.ts      # clearDatabase(), seedBooks()
│   ├── request.ts       # testRequest (supertest client)
│   ├── factories.ts     # createBookDto(), createBookModel()
│   └── assertions.ts    # expectValidationError, expectConflictError, expectNotFoundError
└── integration/
    ├── health.integration.test.ts
    ├── swagger.integration.test.ts
    ├── books.create.integration.test.ts
    ├── books.list.integration.test.ts
    ├── books.getById.integration.test.ts
    ├── books.update.integration.test.ts
    └── books.delete.integration.test.ts
```

## Frontend

```
frontend/src/test/
├── setup.ts                  # jest-dom, MSW lifecycle, RTL cleanup
├── server.ts                 # MSW setupServer instance
├── handlers.ts               # Handler composition root
├── handlers/
│   ├── books.ts              # Feature handlers + in-memory seed DB
│   └── errors.ts             # Standardized error response helpers
├── contract/
│   ├── types.ts              # Contract types (re-exports + ApiErrorResponse)
│   ├── validators.ts         # Backend-mirroring pure validation functions
│   ├── error-messages.ts     # Exact error message constants from backend
│   ├── assertions.ts         # Contract test helpers
│   ├── openapi-types.ts      # Auto-generated from OpenAPI spec
│   ├── endpoints.ts          # Auto-generated endpoint definitions
│   └── msw-contract.test.ts  # 32 contract verification tests
├── utils/
│   ├── render.tsx            # renderWithProviders + re-exported RTL utilities
│   ├── query-client.ts       # createTestQueryClient
│   └── factories/
│       └── book.factory.ts   # Book contract types + test data factories
└── examples/                 # Copy-pasteable reference tests
```

---

# Further Reading

- [Testing Guide](testing.md) — Backend testing strategy, conventions, patterns
- [Frontend Testing](frontend-testing.md) — Frontend testing setup, MSW contract strategy, isolation rules
