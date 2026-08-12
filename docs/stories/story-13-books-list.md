# Story 13 – Books List

## Objective

Display the list of books by consuming the backend API and implementing the complete frontend data flow.

## Description

Implement the first functional feature module following the established frontend architecture. The application should retrieve books from the backend and render them in a responsive catalog-style table.

## Acceptance Criteria

- Books are retrieved from the backend API.
- TanStack Query is used for data fetching.
- The Books page displays a responsive table.
- Loading state is implemented.
- Error state is implemented.
- Empty state is implemented.
- The API layer is separated from UI components.
- No Axios calls exist inside React components.

## Deliverables

- `books.api.ts`
- `useBooks.ts`
- `BookTable.tsx`
- `BooksPage.tsx`
- Loading and error UI states

## Testing Scope

# Component Tests

- BookTable renders books correctly.
- BookTable renders table headers.
- Empty state is displayed when no books exist.
- Loading state is displayed.
- Error state is displayed.

# Hook Tests

- useBooks returns loading state.
- useBooks returns book data.
- useBooks handles API errors.

# Integration Tests

- BooksPage renders data from mocked API.
- Retry behavior works correctly.
- Error recovery is handled correctly.

## Out of Scope

- Pagination
- Search
- Create
- Update
- Delete
