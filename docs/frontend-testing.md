# Frontend Testing

## Overview

The frontend is tested with:

- **Vitest** — test runner and coverage (v8 provider)
- **React Testing Library** — component rendering, user interactions, accessibility
- **Mock Service Worker (MSW)** — API mocking at the network layer

The infrastructure lives in `frontend/src/test/` and is shared by every
feature module. Component tests must not depend on the real backend; all API
interactions are mocked with MSW.

Reference implementations for every pattern described below are in
`frontend/src/test/examples/`.

---

## Test Scripts

| Script              | Purpose                          |
| ------------------- | -------------------------------- |
| `npm run test`      | Watch mode                       |
| `npm run test:ui`   | Vitest UI dashboard              |
| `npm run test:run`  | Run once (CI)                    |
| `npm run test:coverage` | Run once with v8 coverage report |

---

## How It Works

### Test Directory Structure

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

### Global Setup Lifecycle (`setup.ts`)

Runs before every test file:

1. `@testing-library/jest-dom` extends Vitest's `expect` with DOM matchers.
2. MSW server `listen` starts mocking all network requests.
3. After each test, in order: RTL `cleanup` unmounts rendered trees,
   `server.resetHandlers` restores base handlers, and the mock seed database
   is reset. Tests are independent regardless of execution order.
4. After all tests, the MSW server `close` stops intercepting.

### MSW as the API Layer

- Handlers are **feature-organized** in `handlers/` and composed in
  `handlers.ts`. New features add a handler module and append it to the
  composition root.
- `handlers/books.ts` implements CRUD matching the backend contract:
  filtering, pagination, conflict detection (409), and 404s. State is an
  in-memory seed DB with deterministic ids.
- **Unhandled requests fail tests** (`onUnhandledRequest: "error"`). If a test
  makes a request no handler covers, the test fails instead of silently
  hanging or hitting the network.
- Per-test overrides use `server.use(...)`:

```ts
server.use(http.get("/api/books", () => internalError()));
```

- To pin a test in a loading/pending state, a handler can return a Promise the
  test resolves manually (used for `isPending` mutations and skeleton states):

```ts
let resolveRequest: (value: HttpResponse<CreateBookInput>) => void;
server.use(
  http.post("/api/books", () =>
    new Promise<HttpResponse<CreateBookInput>>((resolve) => {
      resolveRequest = resolve;
    }),
  ),
);
// trigger the mutation/query...
expect(pendingButton).toBeDisabled();
await act(async () => {
  resolveRequest(HttpResponse.json(createBookFormData(), { status: 201 }));
});
```

  Note that MSW v2's `HttpResponse` is generic (`HttpResponse<BodyType>` with
  no default), so referencing the response type explicitly requires the body
  type argument.

- Error responses follow the backend standardized format
  (`{ message, code, details }`), produced by helpers in `handlers/errors.ts`:
  `validationError` (400), `unauthorizedError` (401), `notFoundError` (404),
  `conflictError` (409), `internalError` (500).

### Provider Composition and the Render Helper

`renderWithProviders` (from `@/test/utils/render`) wraps UI in a
`QueryClientProvider`, returns the `QueryClient` instance used, and supports
an optional `route` for router context:

```ts
const view = renderWithProviders(<BookList />);
const view = renderWithProviders(<BookList />, { route: "/books" });

view.queryClient.setQueryData(["books"], myData);
```

For `renderHook`, compose the same providers with `createQueryClientWrapper`:

```ts
renderHook(() => useBooks(), {
  wrapper: createQueryClientWrapper(createTestQueryClient()),
});
```

The helpers also re-export the RTL utilities used by tests: `screen`,
`userEvent`, `waitFor`, `within`, `act`, `fireEvent`.

### Dynamic Routes (`:id` Params)

The `route` option renders the element under a `path="*"` catch-all route, so
it **will not populate `useParams`**. To test a page that reads route params
(e.g. `/books/:id`), build a real `createMemoryRouter` with explicit routes and
render it through `RouterProvider`:

```tsx
const router = createMemoryRouter(
  [
    { path: "/", element: <></> },
    { path: "/books", element: <BooksPage /> },
    { path: "/books/:id", element: <BookDetailsPage /> },
  ],
  { initialEntries: ["/books/64f1c2e5a1b2c3d4e5f6a001"] },
);

renderWithProviders(<RouterProvider router={router} />);
```

Including sibling routes in the tree (not just the parametrized one) also makes
`Link` navigation flows testable, e.g. "back to the list". See
`src/pages/BookDetailsPage.test.tsx` for a reference implementation.

### Isolation Rules

- **Fresh `QueryClient` per test.** `createTestQueryClient()` sets
  `retry: false` (failures surface immediately instead of retrying) and
  `gcTime: 0` (no cache survives unmount). Never share a client between
  tests.
- **Fresh memory router per test.** `createMemoryRouter` instances retain
  navigation state; a router that navigated in one test will render the wrong
  route in the next. Build a new router inside the render helper per test.
- **Fixed seed data.** The mock database is reseeded after every test, so
  tests can rely on known ids and counts.

### Test Data Factories

`src/test/utils/factories/` is the single source of truth for API contract
types and mock data. The factory types are the same ones used by the MSW
handlers, so contracts cannot drift:

```ts
createBook({ genre: "Horror" });       // single book, unique id and title
createBookList(5);                     // array of 5 distinct books
createBookFormData({ title: "..." });  // create-request body
```

---

## What It Tests

There are three test types, defined in the story. The example tests in
`src/test/examples/` demonstrate each one and serve as starting points for
feature tests.

### Component Tests (`*.test.tsx`)

Responsibility: rendering, user interactions, conditional UI, accessibility
behavior.

`component.example.test.tsx` demonstrates:

- rendering props-driven components with factory data,
- interaction updates via `userEvent` (e.g. a button that toggles to a
  disabled "Reserved" state),
- conditional UI such as an empty state,
- accessibility assertions with `getByRole` queries.

### Hook Tests (`*.test.ts`)

Responsibility: queries, mutations, loading states, error states, derived
state.

`hook.example.test.ts` demonstrates:

- the full state machine: `isLoading` → `isSuccess` over MSW-seeded data,
- error states: a `server.use` override makes the endpoint fail, and the test
  asserts the error is an `ApiError` with the expected `status`/`code`,
- mutation lifecycle: `act(() => mutate(...))` → success, then verification
  against the mock server state,
- QueryClient isolation: a fresh client has no cached data from another
  client.

### Integration Tests (`*.test.tsx`)

Responsibility: page behavior, component integration, API interactions,
query caching, user flows.

`integration.example.test.tsx` demonstrates:

- a full page rendered under a `createMemoryRouter` route tree,
- loading data through React Query + axios against MSW,
- derived query keys (`["books", { search }]`) driving refetches and MSW
  filtering,
- cache invalidation: a delete mutation invalidates the query, and the list
  refetches,
- navigation between routes with `Link`.

---

## Guidelines

- Components are tested through their rendered output and roles, not by
  reaching into implementation details.
- API calls are never real: every request must be covered by an MSW handler.
- Tests must be deterministic and independent; run the suite with
  `npx vitest run --sequence.shuffle` to verify order independence.
- Keep test utilities in `src/test/utils/` so every feature module reuses the
  same patterns.