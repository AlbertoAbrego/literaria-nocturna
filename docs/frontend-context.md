# Frontend Context

## Project Overview

This frontend is a React + TypeScript application that consumes the Literaria Nocturna backend API.

The frontend follows a **feature-based architecture** with a strong separation between UI, data fetching, business logic, and shared infrastructure.

The goal is long-term maintainability, scalability, and consistency across all modules.

The application should support the following feature modules:

- Books
- Members
- Readings

---

# Architecture Principles

## Feature-Based Organization

All business functionality must live inside **feature modules**.

Features should be independent and self-contained.

Example:

```text
features/
└── books/
    ├── api/
    ├── components/
    ├── hooks/
    ├── types/
    └── utils/
```

Shared code belongs in `shared/`.

---

## Separation of Responsibilities

### Components

Components are responsible for:

- rendering UI,
- handling user interactions,
- receiving data via props or hooks.

Components should **not contain API calls**.

### Hooks

Hooks are responsible for:

- data fetching,
- mutations,
- UI state,
- feature-specific logic.

### API Layer

API modules are responsible for:

- HTTP requests,
- endpoint definitions,
- request/response typing,
- API transformation when necessary.

### Shared Infrastructure

Shared code includes:

- reusable UI components,
- API client,
- common hooks,
- utilities,
- global types.

---

# Folder Structure

```text
src/
├── app/
├── routes/
├── pages/
├── features/
│   ├── books/
│   ├── members/
│   └── readings/
├── shared/
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── types/
│   └── utils/
└── main.tsx
```

---

# Routing

Pages represent **route-level components**.

Pages should compose feature components.

Example:

```text
pages/
└── BooksPage.tsx
```

BooksPage should render feature components such as:

- BookTable
- SearchBar
- PaginationControls

---

# Data Fetching

## TanStack Query

All server state must use **TanStack Query**.

Do not manually manage loading, error, and caching with useState.

Preferred pattern:

```text
Component
↓

Feature Hook
↓

Feature API
↓

Axios Client
↓

Backend
```

---

# API Layer

## Axios Client

A single Axios instance should exist in:

```text
shared/api/http.ts
```

Responsibilities:

- base URL,
- interceptors,
- error handling,
- request configuration.

Feature APIs must use this client.

Example:

```ts
// features/books/api/books.api.ts

export async function getBooks() {}
```

Do not call Axios directly from components.

---

# TypeScript Conventions

## Feature Types

Feature-specific types belong in:

```text
features/books/types/
```

Shared types belong in:

```text
shared/types/
```

Avoid duplicating backend DTOs.

Frontend types represent **API contracts**, not backend implementation details.

---

# Component Guidelines

## Preferred Component Size

Components should generally remain under **150 lines**.

Extract logic into hooks.

Extract reusable UI into shared components.

## Component Naming

Use PascalCase.

Examples:

- BookCard
- BookTable
- BookForm
- PaginationControls

---

# Hooks Guidelines

Custom hooks should encapsulate:

- queries,
- mutations,
- derived state,
- feature behavior.

Examples:

- useBooks
- useBook
- useCreateBook
- useUpdateBook
- useDeleteBook

Hooks should return:

- data,
- loading state,
- error state,
- mutation actions.

---

# Styling Strategy

The styling system will be defined separately.

Current priority is architecture, not visual design.

Avoid inline styles except for temporary prototypes.

---

# Environment Variables

Use Vite environment variables.

Example:

```text
VITE_API_URL=http://localhost:3000/api
```

Do not hardcode API URLs.

---

# Error Handling

API errors should be handled consistently.

The frontend must respect the backend standardized error format:

```json
{
  "message": "...",
  "code": "...",
  "details": {}
}
```

Display user-friendly messages.

Avoid exposing raw server errors.

---

# Testing Strategy

The frontend testing stack is fully established in `frontend/src/test/`:

- Vitest
- React Testing Library
- Mock Service Worker (MSW)

Component tests must not depend on the backend.

All API interactions are mocked with MSW.

## Test Scripts

| Script              | Purpose                              |
| ------------------- | ------------------------------------ |
| `npm run test`      | Watch mode                           |
| `npm run test:ui`   | Vitest UI dashboard                  |
| `npm run test:run`  | Run once (CI)                        |
| `npm run test:coverage` | Run once with v8 coverage report |

## Test Directory Structure

```text
src/test/
├── setup.ts                  # Global setup: jest-dom, MSW lifecycle, RTL cleanup
├── server.ts                 # MSW setupServer instance
├── handlers.ts               # Handler composition root
├── handlers/
│   ├── books.ts              # Feature handlers + in-memory seed DB
│   └── errors.ts             # Standardized error response helpers
├── utils/
│   ├── render.tsx            # renderWithProviders + re-exported RTL utilities
│   ├── query-client.ts       # createTestQueryClient
│   └── factories/
│       └── book.factory.ts   # Book contract types + test data factories
└── examples/                 # Copy-pasteable reference tests
```

## MSW Usage

- Handlers are feature-organized per module and composed in `handlers.ts`.
- `setup.ts` manages the server lifecycle globally: `listen` before all tests,
  `resetHandlers` + seed DB reset after each test, `close` after all tests.
- Unhandled requests fail tests (`onUnhandledRequest: "error"`). Every request
  in a test must be covered by a handler.
- Per-test overrides use `server.use(...)` and are automatically cleared
  between tests.

```ts
server.use(http.get("/api/books", () => internalError()));
```

- Error responses (400, 401, 404, 409, 500) are produced by helpers in
  `handlers/errors.ts` and follow the backend error format
  (`{ message, code, details }`).

## Custom Render Helper

Import `renderWithProviders` (and `screen`, `userEvent`, `waitFor`, `within`,
`act`, `fireEvent`) from `@/test/utils/render`.

`renderWithProviders` composes a `QueryClientProvider` around the UI, returns
the `QueryClient` instance, and supports an optional `route` for router
context:

```ts
const view = renderWithProviders(<BookList />);
const view = renderWithProviders(<BookList />, { route: "/books" });
```

For `renderHook`, use `createQueryClientWrapper`:

```ts
renderHook(() => useBooks(), { wrapper: createQueryClientWrapper(createTestQueryClient()) });
```

## QueryClient Isolation

- `createTestQueryClient()` returns a fresh client per call: `retry: false`,
  `gcTime: 0`. No cache bleeds between tests.
- Memory routers also carry state — create a fresh router per test instead of
  reusing a module-level instance.

## Test Data Factories

Factories in `src/test/utils/factories/` are the single source of truth for
API contract types and mock data:

```ts
createBook({ genre: "Horror" });
createBookList(5);
createBookFormData({ title: "..." });
```

## Test Types

| Type                            | Responsibility                                  |
| ------------------------------- | ----------------------------------------------- |
| Component tests (`*.test.tsx`)  | Rendering, interactions, conditional UI, a11y   |
| Hook tests (`*.test.ts`)        | Queries, mutations, loading/error/derived state |
| Integration tests (`*.test.tsx`) | Pages, component composition, caching, flows    |

See `src/test/examples/` for copy-pasteable references covering loading,
success, error, and mutation scenarios.

---

# Import Conventions

Use path aliases.

Preferred:

```ts
import { BookTable } from '@/features/books/components';
```

Avoid long relative paths.

---

# Code Review Rules

When generating code:

- keep components focused,
- keep hooks responsible for data,
- keep API isolated,
- avoid duplicated logic,
- prefer composition over large components,
- maintain feature boundaries.

If a feature requires shared functionality, place it in `shared/`.

Do not bypass the API layer.

Do not place HTTP logic inside components.

Maintain architectural consistency above implementation speed.

# UI Architecture

## Shared UI Components

Reusable UI components belong in:

shared/components/ui/

Examples:

- Button
- Input
- Select
- Modal
- Table
- Pagination
- LoadingSpinner
- ErrorAlert

These components encapsulate:

- Tailwind classes,
- variants,
- accessibility,
- common behaviors.

Feature components should compose shared UI components instead of duplicating Tailwind classes.
