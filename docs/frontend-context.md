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

# Testing

The frontend is tested with Vitest, React Testing Library, and Mock Service Worker (MSW).

The complete testing setup, utilities, and conventions are documented in [frontend-testing.md](./frontend-testing.md).

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
- Skeleton
- ErrorAlert

These components encapsulate:

- Tailwind classes,
- variants,
- accessibility,
- common behaviors.

Feature components should compose shared UI components instead of duplicating Tailwind classes.
