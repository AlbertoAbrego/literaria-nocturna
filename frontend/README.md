# Literaria Nocturna — Frontend

React + TypeScript application for the Literaria Nocturna book club. A dark-academia-inspired book catalog with search, filtering, pagination, and CRUD operations.

## Architecture

Feature-based architecture with clear separation between UI, data fetching, and business logic.

### Directory Structure

```
src/
├── app/                    # Providers (QueryClient, BrowserRouter)
├── pages/                  # Route-level components (compose feature components)
├── routes/                 # React Router configuration
├── features/               # Feature modules
│   └── books/
│       ├── api/            # Axios functions (getBooks, createBook, etc.)
│       ├── components/     # BookTable, BookForm, BookCard, SearchBar
│       ├── hooks/          # useBooks, useCreateBook, useBookFilters
│       ├── types/          # Book, CreateBookInput, BookFilters
│       └── utils/          # searchFilters, buildSearchParams
├── shared/                 # Shared infrastructure
│   ├── api/                # http.ts (Axios instance)
│   ├── components/
│   │   ├── layout/         # Layout, Header, Sidebar
│   │   └── ui/             # Button, Input, Modal, Table, Pagination, Skeleton
│   ├── hooks/              # useDebounce
│   ├── types/              # ApiError, PaginationMeta
│   └── utils/              # Common utilities
└── test/                   # Test infrastructure
    ├── contract/           # OpenAPI types, validators, MSW contract tests
    ├── handlers/           # MSW handlers (books.ts, errors.ts)
    ├── utils/              # renderWithProviders, createTestQueryClient
    └── examples/           # Reference test implementations
```

### Data Flow

```
Component → Feature Hook → Feature API → Axios Client → Backend
     ↑                    ↓
   UI Props         TanStack Query
                     (cache, loading, error)
```

Components render UI and delegate data fetching to hooks. Hooks use TanStack Query for server state (caching, loading, error states) and call feature API modules. API modules import the shared Axios client from `shared/api/http.ts`.

**No Axios calls in components.** All HTTP requests go through the API layer.

### Feature Module Example

```text
features/books/
├── api/books.api.ts        # getBooks(), createBook(), updateBook(), deleteBook()
├── components/
│   ├── BookTable.tsx       # Table of books with actions
│   ├── BookForm.tsx        # Create/edit form
│   ├── BookCard.tsx        # Book display card
│   └── SearchBar.tsx       # Title/author/genre filters
├── hooks/
│   ├── index.ts            # Barrel exports
│   ├── useBooks.ts         # Query: list books with filters
│   ├── useBook.ts          # Query: single book by ID
│   ├── useCreateBook.ts    # Mutation: create
│   ├── useUpdateBook.ts    # Mutation: update
│   ├── useDeleteBook.ts    # Mutation: delete (cache-syncing)
│   └── useBookFilters.ts   # URL-synchronized filter state
├── types/index.ts          # Book, CreateBookInput, BookFilters
└── utils/searchFilters.ts  # Pure helpers for filter parsing/derivation
```

## Styling

Tailwind CSS v4 with design tokens wired as theme utilities.

- **Typography**: Cormorant Garamond (headings, serif), Inter (body, sans-serif) — loaded in `index.html`
- **Tokens**: Defined in `src/index.css` `@theme` block — use semantic utilities (`bg-charcoal`, `text-parchment`, `border-graphite`)
- **No hardcoded colors**: Components must use token utilities, not hex values or default Tailwind palette

Design tokens and component specs are documented in:

- [Design System](../docs/design/design-system.md) — Colors, typography, spacing, shadows, motion
- [UI Components](../docs/design/ui-components.md) — Component variants and specs

## Path Aliases

Use `@/` for imports instead of relative paths:

```ts
import { BookTable } from "@/features/books/components";
import { Button } from "@/shared/components/ui";
import { useBooks } from "@/features/books/hooks";
```

Configured in `tsconfig.json` and `vite.config.ts`.

## Environment Variables

| Variable       | Default | Description                 |
| -------------- | ------- | --------------------------- |
| `VITE_API_URL` | `/api`  | Base URL of the backend API |

### How the API URL Works

The default value `/api` is a **relative path**. In development, Vite's dev server proxies all `/api/*` requests to `http://localhost:3000`:

```
Browser → http://localhost:5173/api/books
       → Vite proxy → http://localhost:3000/api/books
```

For production, set the full backend URL:

```
VITE_API_URL=https://api.example.com/api
```

## Commands

| Command                    | Description                                   |
| -------------------------- | --------------------------------------------- |
| `npm run dev`              | Start Vite dev server with HMR                |
| `npm run build`            | Build for production (`tsc -b && vite build`) |
| `npm run preview`          | Preview production build locally              |
| `npm run test`             | Run Vitest in watch mode                      |
| `npm run test:run`         | Run tests once                                |
| `npm run test:ui`          | Open Vitest UI dashboard                      |
| `npm run test:coverage`    | Run tests with coverage                       |
| `npm run contract:extract` | Generate contract types from OpenAPI spec     |
| `npm run contract:verify`  | Verify MSW handlers match OpenAPI spec        |
| `npm run contract:check`   | Extract + verify contract                     |
| `npm run lint`             | ESLint check                                  |
| `npm run format`           | Prettier format                               |

## Testing

Vitest + React Testing Library + MSW (Mock Service Worker). All API calls are mocked — no backend required.

### Test Types

| Type            | Pattern                | What It Tests                                                      |
| --------------- | ---------------------- | ------------------------------------------------------------------ |
| **Component**   | `*.test.tsx`           | Rendering, user interactions, conditional UI, accessibility        |
| **Hook**        | `*.test.ts`            | Queries, mutations, loading/error states, derived state            |
| **Integration** | `*.test.tsx`           | Full page rendering, routing, API interactions, cache invalidation |
| **Contract**    | `msw-contract.test.ts` | MSW handlers match OpenAPI spec (status codes, shapes, errors)     |

### Contract-Driven MSW

MSW handlers are synchronized with the backend OpenAPI contract:

```bash
npm run contract:extract   # Generate openapi-types.ts, endpoints.ts from OpenAPI spec
npm run contract:verify    # Compare handlers against OpenAPI spec
npm run contract:check     # Extract + verify (run in CI)
```

**Flow:**

1. `scripts/contract/openapi.json` — Static OpenAPI spec derived from backend Swagger config
2. `contract:extract` generates `src/test/contract/openapi-types.ts` and `endpoints.ts`
3. MSW handlers import validators from `contract/validators.ts` and error messages from `contract/error-messages.ts`
4. `contract:verify` ensures every OpenAPI endpoint has a matching MSW handler

### Test Structure

```
src/test/
├── setup.ts                  # Global setup (jest-dom, MSW lifecycle, RTL cleanup)
├── server.ts                 # MSW setupServer instance
├── handlers.ts               # Handler composition root
├── handlers/
│   ├── books.ts              # Feature handlers + in-memory seed DB
│   └── errors.ts             # Standardized error response helpers
├── contract/
│   ├── types.ts              # Contract types (re-exports + ApiErrorResponse)
│   ├── validators.ts         # Backend-mirroring pure validation functions
│   ├── error-messages.ts     # Exact error message constants from backend
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

### Isolation Rules

- **Fresh `QueryClient` per test** — `retry: false`, `gcTime: 0` (no cache survives unmount)
- **Fresh memory router per test** — Navigation state doesn't leak between tests
- **Fixed seed data** — Mock database reseeded after every test
- **Unhandled requests fail tests** — `onUnhandledRequest: "error"` catches missing handlers

### Test Examples

**Component test:**

```tsx
import { renderWithProviders, screen, userEvent } from "@/test/utils";

const view = renderWithProviders(<BookTable books={books} />);
expect(screen.getByRole("table")).toBeInTheDocument();
```

**Hook test:**

```ts
import { renderHook, waitFor } from "@testing-library/react";
import { createTestQueryClient } from "@/test/utils";
import { useBooks } from "@/features/books/hooks";

const { result } = renderHook(() => useBooks({ page: 1 }), {
  wrapper: createQueryClientWrapper(createTestQueryClient()),
});

await waitFor(() => expect(result.current.isSuccess).toBe(true));
expect(result.current.data).toHaveLength(10);
```

**Integration test:**

```tsx
import { renderWithProviders, screen, waitFor } from "@/test/utils";
import { createMemoryRouter } from "react-router";
import { BooksPage } from "@/pages/BooksPage";

const router = createMemoryRouter([{ path: "/", element: <BooksPage /> }], {
  initialEntries: ["/"],
});

renderWithProviders(<RouterProvider router={router} />);
await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());
```

## Development Workflow

1. **Feature branches** — Create a branch for each feature/fix
2. **Implement** — Follow feature module structure (api/components/hooks/types/utils)
3. **Test** — Write component, hook, and integration tests using MSW
4. **Lint & Format** — Run `npm run lint && npm run format` before commit
5. **Contract Check** — Run `npm run contract:check` to verify MSW ↔ OpenAPI sync
6. **CI** — Frontend CI runs lint → contract check → build → tests on every PR

## Tech Stack

- React 19
- TypeScript (strict mode)
- Vite 8
- Tailwind CSS v4
- TanStack Query v5
- Axios
- React Router 7
- Vitest 4 + React Testing Library + MSW 2

## Documentation

- [Frontend Context](../docs/frontend-context.md) — Full architecture and patterns
- [Frontend Testing](../docs/frontend-testing.md) — Test setup, conventions, examples
- [Design System](../docs/design/design-system.md) — Colors, typography, spacing, tokens
- [UI Components](../docs/design/ui-components.md) — Component specs and variants
