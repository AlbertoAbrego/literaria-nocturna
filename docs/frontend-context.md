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

Query defaults (retry, staleTime, refetch behavior) are configured once in the app `QueryClient` at `src/app/providers.tsx`. Feature hooks must not duplicate these defaults per query; per-query overrides are only allowed when they intentionally differ. This keeps hooks consistent and keeps the test client's `retry: false` isolation rule effective (see [frontend-testing.md](./frontend-testing.md)).

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

Hooks may also expose **derived states** that rows/state components consume
directly. For example, `useBook` returns an `isNotFound` flag derived from the
shared `ApiError.status`:

```ts
isNotFound: query.error instanceof ApiError && query.error.status === 404,
```

Treating a `404` as a distinct not-found state (instead of a generic error)
lets the page render a specific not-found UI without making each consumer
re-derive status from the error object. Hooks centralize this logic so error
discrimination lives in one place.

### Cache-Synchronizing Mutations

Mutations that change list data (e.g. `useDeleteBook`) keep every cached list
view consistent. Because the list is cached under many keys
(`["books", undefined]`, `["books", { page, search }]`, ...), use the query-key
**prefix** with `getQueriesData`/`setQueriesData` to touch all variants at once:

- `onMutate`: `cancelQueries(["books"])` (prevents an in-flight fetch racing the
  optimistic write), snapshot the previous lists, then optimistically update.
- `onError`: restore the snapshots (rollback).
- `onSuccess`: `invalidateQueries(["books"])` to refetch authoritatively, and
  evict any dependent queries (e.g. `removeQueries(["books", "detail", id])`).

Optimistic updaters must return `undefined` unchanged so `setQueriesData` never
evicts a query that simply is not cached yet.

### Hooks Barrel

Each feature exposes a `hooks/index.ts` barrel (e.g. `features/books/hooks/index.ts`)
so consumers import from one place (`@/features/books/hooks`) instead of many
deep paths.

### URL-Synced Filter State

`useBookFilters` (in `features/books/hooks/useBookFilters.ts`) owns search/filter
state for the catalog and keeps it synchronized with the URL:

- **Draft vs. committed.** The controlled inputs (title/author/genre) read from a
  `draft` state so typing is instant; the URL reflects only the _committed_ value.
  A 300ms debounce writes `draft` → URL via `buildSearchParams` with
  `{ replace: true }`, and the committed value is parsed back from
  `useSearchParams`.
- **Derived query params.** `queryParams` is memoized from `committed`, giving a
  stable object identity per URL state. Passing it to `useBooks` yields distinct
  query keys (`["books", { title, author, genre }]`) per filter, so each filter
  state is cached independently and refetching is emergent — no manual debounce
  logic in the page.
- **Back/forward sync.** `draft` is re-synced from `committed` when the URL changes
  externally (browser back/forward). This uses the React-recommended "adjust state
  during render" pattern — compare against a stored `previousCommitted` and set
  state during render — which keeps the inputs consistent with the URL without a
  `set-state-in-effect` lint violation. Because `setSearchParams` uses `replace`,
  the debounce writes do not pollute history.
- **Pure helpers.** All parsing/derivation (trim, omit-empty, parse, equality,
  genre validation) lives in `features/books/utils/searchFilters.ts`, keeping the
  hook declarative and unit-testable.

---

# Styling Strategy

The frontend uses **Tailwind CSS v4** with the design system wired as theme tokens.

Design tokens (colors, fonts, radii) are defined in:

```text
src/index.css  (@theme block)
```

and documented in [design-system.md](./design/design-system.md).

- Cormorant Garamond (headings) and Inter (body) are loaded in `index.html`.
- Components must use semantic token utilities (`bg-charcoal`, `text-parchment`, ...) instead of hardcoded hex values or default Tailwind palette colors.
- The token set can be extended in the `@theme` block when new values are needed.
- Avoid inline styles except for temporary prototypes.

---

# Environment Variables

Use Vite environment variables.

Example:

```text
VITE_API_URL=/api
```

In development, the Vite dev server proxies `/api` requests to the backend at `http://localhost:3000`. In production, set the full backend URL (e.g., `https://api.example.com/api`).

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

# Testing

The frontend is tested with Vitest, React Testing Library, and Mock Service Worker (MSW).

The complete testing setup, utilities, and conventions are documented in [frontend-testing.md](./frontend-testing.md).

## Contract-Driven MSW Strategy

MSW handlers are synchronized with the backend OpenAPI contract through a
contract layer in `src/test/contract/`. This ensures frontend tests exercise
a faithful representation of the API.

**Source of truth:** `scripts/contract/openapi.json` — a static OpenAPI 3.0 spec
derived from the backend's `swagger.ts` config and JSDoc annotations.

**Flow:**

1. `npm run contract:extract` reads the OpenAPI spec and generates
   `openapi-types.ts` (TypeScript interfaces) and `endpoints.ts` (endpoint
   definitions) in `src/test/contract/`.
2. MSW handlers in `handlers/books.ts` import validators from
   `contract/validators.ts` and error messages from
   `contract/error-messages.ts`, ensuring identical behavior.
3. `npm run contract:verify` compares handler registration against the OpenAPI
   spec and fails if any endpoint is missing.
4. `msw-contract.test.ts` (32 tests) validates runtime behavior: status codes,
   response shapes, error messages, pagination, and sorting.

**CI integration:** The `contract:check` script runs in the frontend CI pipeline
between lint and build, catching drift before deployment.

---

# Import Conventions

Use path aliases.

Preferred:

```ts
import { BookTable } from "@/features/books/components";
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
- Skeleton
- ErrorAlert

These components encapsulate:

- Tailwind classes,
- variants,
- accessibility,
- common behaviors.

Feature components should compose shared UI components instead of duplicating Tailwind classes.
