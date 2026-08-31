# Test Layer Strategy

This document defines the four test layers in Literaria Nocturna, their purpose, scope, tools, and rules to avoid duplication.

---

## Test Layers

### Layer 1 — Backend Integration

| Field        | Value                                                                                 |
| ------------ | ------------------------------------------------------------------------------------- |
| **Purpose**  | Verify the full Route → Controller → Service → Model contract against a real database |
| **Scope**    | All API endpoints, validation, error responses, data integrity                        |
| **Tools**    | Jest, Supertest, MongoDB Memory Server                                                |
| **Location** | `backend/src/test/integration/`                                                       |
| **Run**      | `npm run test:ci`                                                                     |

**What it covers:**

- HTTP request/response cycle (status codes, headers, body shape)
- Input validation (ObjectId, genre enum, pagination bounds, required fields)
- Business rules (duplicate detection, not-found handling)
- Database operations (CRUD, filtering, pagination, sorting)
- Error contract (`{ message, code, details? }`)
- Health/readiness endpoints with DB connectivity

**What it does NOT cover:**

- UI rendering, user interactions, accessibility
- Browser-specific behavior (focus, keyboard navigation)
- Frontend routing or cache behavior

---

### Layer 2 — Frontend Unit / Component

| Field        | Value                                                                      |
| ------------ | -------------------------------------------------------------------------- |
| **Purpose**  | Verify isolated UI components render correctly and respond to user actions |
| **Scope**    | Individual components, hooks, utility functions                            |
| **Tools**    | Vitest, React Testing Library                                              |
| **Location** | `frontend/src/**/*.test.{ts,tsx}` (component and hook files)               |
| **Run**      | `npm run test:run`                                                         |

**What it covers:**

- Component rendering with props (states: default, loading, error, empty)
- User interactions (click, type, submit)
- Accessibility (ARIA attributes, roles, focus management)
- Hook behavior (queries, mutations, loading/error states)
- Utility functions (search filters, pagination range calculation)

**What it does NOT cover:**

- Full page flows with routing and multiple components
- API contract compliance (see Layer 3)
- Real network requests or browser behavior

**Duplication rules:**

- Do NOT re-test page-level flows here; use Layer 3 for that
- Component tests focus on **isolated** rendering and interaction
- Hook tests focus on **state transitions**, not full user journeys

---

### Layer 3 — Frontend Integration + MSW

| Field        | Value                                                          |
| ------------ | -------------------------------------------------------------- |
| **Purpose**  | Verify page-level flows against a contract-faithful API mock   |
| **Scope**    | Page components, routing, API interactions, cache invalidation |
| **Tools**    | Vitest, React Testing Library, MSW (Mock Service Worker)       |
| **Location** | `frontend/src/pages/*.test.tsx`, `frontend/src/test/contract/` |
| **Run**      | `npm run test:run`                                             |

**What it covers:**

- Full page rendering with router context
- API data fetching and display
- Form submission → API call → cache invalidation → UI update
- Error states (network error, 400, 404, 409, 500)
- Navigation between pages
- MSW ↔ OpenAPI contract verification (32 contract tests)

**What it does NOT cover:**

- Real browser behavior (Playwright covers this)
- Actual backend responses (uses MSW mock)
- Cross-browser compatibility

**Duplication rules:**

- Page tests should NOT re-assert what component tests already cover
- Focus on **flows**: "user navigates to page → sees data → filters → paginates → navigates away"
- If a test only checks "component renders with props", it belongs in Layer 2

**MSW contract fidelity:**

- MSW handlers MUST match the backend OpenAPI spec exactly
- `contract:check` verifies this in CI (extract → verify)
- When adding new endpoints, update both backend routes AND MSW handlers

---

### Layer 4 — Playwright E2E (Planned)

| Field        | Value                                                                |
| ------------ | -------------------------------------------------------------------- |
| **Purpose**  | Verify real user journeys in a real browser against the real backend |
| **Scope**    | Full user flows across the entire stack                              |
| **Tools**    | Playwright                                                           |
| **Location** | `frontend/e2e/` (planned)                                            |
| **Run**      | `npx playwright test` (planned)                                      |

**What it covers:**

- Real browser rendering (not jsdom)
- Real network requests (no MSW)
- Browser history (back/forward navigation)
- Debounce timing (real 300ms, not fake timers)
- Focus management, keyboard navigation in real DOM
- Responsive behavior at actual viewport sizes
- Cross-browser testing (Chromium, Firefox, WebKit)

**What it does NOT cover:**

- Unit-level logic (Layers 2–3 are faster and cheaper)
- Backend API contract details (Layer 1 covers that)

**Duplication rules:**

- E2E tests replace the "full flow" tests in Layer 3, not the component/hook tests in Layer 2
- When E2E is added, thin out Layer 3 to: API contract tests + minimal page smoke tests
- Never duplicate the same assertion in both Layer 3 and Layer 4

---

## Layer Comparison

| Aspect          | Layer 1            | Layer 2             | Layer 3             | Layer 4           |
| --------------- | ------------------ | ------------------- | ------------------- | ----------------- |
| **Speed**       | Slow (MongoDB)     | Fast                | Medium (MSW)        | Slow (browser)    |
| **Isolation**   | Full stack (no UI) | Single component    | Page + mock API     | Real full stack   |
| **Confidence**  | API contract       | Component behavior  | Integration flows   | User reality      |
| **Cost to run** | High               | Low                 | Medium              | High              |
| **When to add** | Every endpoint     | Every new component | Every new page/flow | Before publishing |

---

## Duplication Prevention Rules

1. **One assertion, one layer.** If a behavior is tested in a lower layer, the upper layer does NOT re-assert it.
2. **Component tests = isolated.** No routing, no page context, no API mocking (unless the component directly calls API).
3. **Page tests = flows.** Start from navigation, end at navigation. Do not test individual component props.
4. **E2E = critical paths only.** The 5–10 most important user journeys. Everything else stays in Layers 1–3.
5. **Contract tests = shared.** MSW handlers are tested once in `msw-contract.test.ts`. Page tests use them but do not re-verify their correctness.

---

## CI Enforcement

| Layer       | CI Step                         | Threshold                                                  |
| ----------- | ------------------------------- | ---------------------------------------------------------- |
| Layer 1     | `npm run test:ci` (backend)     | Statements ≥80%, Branches ≥75%, Functions ≥75%, Lines ≥80% |
| Layer 2 + 3 | `npm run test:run` (frontend)   | Statements ≥90%, Branches ≥85%, Functions ≥90%, Lines ≥90% |
| Contract    | `npm run contract:check`        | All OpenAPI endpoints must have matching MSW handlers      |
| Layer 4     | (planned) `npx playwright test` | Pass/fail only                                             |

---

## References

- [Backend Testing Guide](../testing.md) — backend strategy, conventions, patterns
- [Frontend Testing Guide](../frontend-testing.md) — frontend setup, MSW contract strategy
- [Test Case Index](../tests.md) — full test case catalog
